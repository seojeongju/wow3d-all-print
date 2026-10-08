/**
 * 모델 해석 실행기 — Web Worker에서 파싱·정밀 분석(화면 멈춤 방지), 시간 초과·취소·메인 스레드 폴백 처리
 */
import * as THREE from 'three'
import { MODEL_PARTS_USERDATA_KEY, type GeometryAnalysis } from '@/lib/geometry'
import { parseModelArrayBuffer } from '@/lib/parseModelGeometry'
import type { ModelParseResponse, ModelParseStage, ParsedGeometryPayload } from '@/lib/model-parse-protocol'

export type { ModelParseStage } from '@/lib/model-parse-protocol'

export type ModelParseFailReason = 'timeout' | 'too_complex'

export class ModelParseError extends Error {
    constructor(public readonly reason: ModelParseFailReason, message?: string) {
        super(message ?? reason)
        this.name = 'ModelParseError'
    }
}

export class ModelParseCancelledError extends Error {
    constructor() {
        super('cancelled')
        this.name = 'ModelParseCancelledError'
    }
}

/** 구형 3MF 로더(DOMParser)는 메인 스레드를 멈추므로 작은 파일만 폴백 허용 */
const LEGACY_3MF_FALLBACK_MAX_BYTES = 15 * 1024 * 1024

/** 용량 비례 제한 시간 (최소 1분 ~ 최대 4분) */
export function modelParseTimeoutMs(bytes: number): number {
    const mb = bytes / (1024 * 1024)
    return Math.round(Math.min(240_000, Math.max(60_000, 60_000 + mb * 2_500)))
}

function payloadToGeometry(p: ParsedGeometryPayload): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(p.position, 3))
    geo.setAttribute('normal', new THREE.BufferAttribute(p.normal, 3))
    if (p.index) geo.setIndex(new THREE.BufferAttribute(p.index, 1))
    if (p.parts) geo.userData[MODEL_PARTS_USERDATA_KEY] = p.parts
    return geo
}

async function parseOnMainThread(file: File): Promise<THREE.BufferGeometry | null> {
    const buffer = await file.arrayBuffer()
    return parseModelArrayBuffer(file.name, buffer)
}

export type ModelParseJob = {
    promise: Promise<THREE.BufferGeometry | null>
    cancel: () => void
}

/** Worker가 이어서 계산 중인 정밀 분석 (메인 스레드 해석 경로면 없음) */
const workerAnalyses = new WeakMap<THREE.BufferGeometry, Promise<GeometryAnalysis>>()

export function takeWorkerAnalysis(geometry: THREE.BufferGeometry): Promise<GeometryAnalysis> | null {
    const pending = workerAnalyses.get(geometry) ?? null
    workerAnalyses.delete(geometry)
    return pending
}

type AnalysisDeferred = { resolve: (a: GeometryAnalysis) => void; reject: (e: unknown) => void }

/** 파일 → BufferGeometry. 해석 불가 시 null, 시간 초과·메모리 부족 시 ModelParseError, 취소 시 ModelParseCancelledError */
export function parseModelFile(file: File, onStage?: (stage: ModelParseStage) => void): ModelParseJob {
    let cancel: () => void = () => {}

    const promise = new Promise<THREE.BufferGeometry | null>((resolve, reject) => {
        let settled = false
        let worker: Worker | null = null
        let timer: ReturnType<typeof setTimeout> | undefined
        let pendingAnalysis: AnalysisDeferred | null = null

        const stopWorker = () => {
            if (timer) clearTimeout(timer)
            timer = undefined
            worker?.terminate()
            worker = null
        }
        const settle = (fn: () => void) => {
            if (settled) return
            settled = true
            stopWorker()
            fn()
        }
        const finishAnalysis = (fn: (d: AnalysisDeferred) => void) => {
            const d = pendingAnalysis
            pendingAnalysis = null
            stopWorker()
            if (d) fn(d)
        }
        const runOnMainThread = () => {
            stopWorker()
            if (settled) return
            onStage?.('parsing')
            parseOnMainThread(file).then(
                (geo) => settle(() => resolve(geo)),
                () => settle(() => resolve(null))
            )
        }

        cancel = () => {
            finishAnalysis((d) => d.reject(new ModelParseCancelledError()))
            settle(() => reject(new ModelParseCancelledError()))
        }

        if (typeof Worker === 'undefined') {
            runOnMainThread()
            return
        }
        try {
            worker = new Worker(new URL('./workers/model-parse.worker.ts', import.meta.url))
        } catch (e) {
            console.warn('[model-parse] Worker 생성 실패 — 메인 스레드로 해석:', e)
            runOnMainThread()
            return
        }

        let ready = false
        const canLegacy3mf = file.name.toLowerCase().endsWith('.3mf') && file.size <= LEGACY_3MF_FALLBACK_MAX_BYTES

        worker.onmessage = (event: MessageEvent<ModelParseResponse>) => {
            const msg = event.data
            if (msg.type === 'ready') {
                ready = true
                return
            }
            if (msg.type === 'stage') {
                onStage?.(msg.stage)
                return
            }
            if (msg.type === 'done') {
                if (!msg.payload && canLegacy3mf) {
                    runOnMainThread()
                    return
                }
                if (!msg.payload || settled) {
                    settle(() => resolve(null))
                    return
                }
                const geo = payloadToGeometry(msg.payload)
                const analysis = new Promise<GeometryAnalysis>((res, rej) => {
                    pendingAnalysis = { resolve: res, reject: rej }
                })
                analysis.catch(() => {})
                workerAnalyses.set(geo, analysis)
                // Worker는 정밀 분석을 위해 유지하고, 제한 시간은 분석 단계 기준으로 다시 잼
                settled = true
                if (timer) clearTimeout(timer)
                timer = setTimeout(
                    () => finishAnalysis((d) => d.reject(new ModelParseError('timeout'))),
                    modelParseTimeoutMs(file.size)
                )
                resolve(geo)
                return
            }
            if (msg.type === 'analysis') {
                finishAnalysis((d) => d.resolve(msg.analysis))
                return
            }
            if (msg.type === 'analysis_error') {
                finishAnalysis((d) =>
                    d.reject(msg.code === 'out_of_memory' ? new ModelParseError('too_complex', msg.message) : new Error(msg.message))
                )
                return
            }
            if (msg.code === 'step_unavailable' || (msg.code === 'error' && canLegacy3mf)) {
                console.warn('[model-parse] Worker 해석 불가 — 메인 스레드로 재시도:', msg.message)
                runOnMainThread()
                return
            }
            console.warn('[model-parse] 해석 실패:', msg.code, msg.message)
            settle(() =>
                msg.code === 'out_of_memory' ? reject(new ModelParseError('too_complex', msg.message)) : resolve(null)
            )
        }
        worker.onerror = (event) => {
            event.preventDefault()
            if (!ready) {
                console.warn('[model-parse] Worker 로드 실패 — 메인 스레드로 해석:', event.message)
                runOnMainThread()
                return
            }
            // 실행 중 비정상 종료 — 대부분 메모리 한도 초과
            finishAnalysis((d) => d.reject(new ModelParseError('too_complex', event.message)))
            settle(() => reject(new ModelParseError('too_complex', event.message)))
        }

        timer = setTimeout(() => settle(() => reject(new ModelParseError('timeout'))), modelParseTimeoutMs(file.size))
        worker.postMessage({ id: 1, file })
    })

    return { promise, cancel: () => cancel() }
}
