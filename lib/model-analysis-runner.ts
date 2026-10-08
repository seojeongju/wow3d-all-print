import * as THREE from 'three'
import { useFileStore } from '@/store/useFileStore'
import { analyzeGeometryBoundingBox, analyzeGeometryProgressive } from '@/lib/geometry'
import { getParsedModelGeometry } from '@/lib/model-parse-cache'
import { useUploadNoticeStore, type AnalysisFailReason } from '@/store/useUploadNoticeStore'
import {
    getScalePercentMax,
    meshyAutoFitScalePercent,
    meshyAutoFitTargetMm,
    resolveBedMaxForMethod,
    type PrintMethodKey,
} from '@/lib/model-transform'

/**
 * 사진→3D: 현재 출력 방식 베드 중간 크기로 스케일 맞춤.
 * - 사용자 수동 조절 후에는 베드 초과 시에만 축소
 * - 출력 방식 변경 시(수동 아님) 해당 방식 기준으로 다시 맞춤
 */
export function maybeAutoFitMeshyScale(opts?: { force?: boolean }): void {
    const state = useFileStore.getState()
    if (state.fileSource.kind !== 'meshy-photo') return

    const method: PrintMethodKey = state.printMethodForFit || 'fdm'
    const bed = resolveBedMaxForMethod(method, state.bedMaxForFit)
    const box = state.baseAnalysis?.boundingBox
    if (!box) return

    const longest = Math.max(box.x, box.y, box.z)
    if (!(longest > 0)) return

    const targetMm = meshyAutoFitTargetMm(bed)
    const scaleMax = getScalePercentMax(state.fileSource.kind)
    const next = meshyAutoFitScalePercent(longest, bed, scaleMax)
    if (next == null) return

    const alreadyForMethod =
        state.meshyFittedForMethod === method &&
        state.meshyFitScalePercent === state.transform.scalePercent

    if (alreadyForMethod) return

    if (state.meshyScaleUserOverride) {
        const currentLongest = longest * (state.transform.scalePercent / 100)
        const bedLimit = Math.min(bed.x, bed.y, bed.z)
        if (!(currentLongest > bedLimit)) return
    }

    state.setScalePercent(next)
    state.markMeshyFitted(method, next, targetMm)
}

let analysisGeneration = 0
const ensurePromises = new WeakMap<File, Promise<void>>()

function isCurrentRun(gen: number): boolean {
    return gen === analysisGeneration
}

/**
 * 분석 불가 파일: 파일을 내리고 업로드 화면에 원인·상담 안내 (분석 대기 화면에 멈추지 않게)
 */
function failModelAnalysis(file: File, gen: number, reason: AnalysisFailReason, err?: unknown): void {
    if (!isCurrentRun(gen) || useFileStore.getState().file !== file) return
    console.error(`[model-analysis] 분석 실패(${reason}):`, file.name, err ?? '')
    useUploadNoticeStore.getState().showAnalysisFailed(file, reason)
    useFileStore.getState().reset()
}

function hasPrintableGeometry(geometry: THREE.BufferGeometry): boolean {
    const pos = geometry.getAttribute('position')
    return Boolean(pos && pos.count >= 3)
}

function hasValidBoundingBox(box: { x: number; y: number; z: number } | undefined): boolean {
    if (!box) return false
    const dims = [box.x, box.y, box.z]
    return dims.every((v) => Number.isFinite(v) && v >= 0) && Math.max(...dims) > 0
}

/**
 * 파싱된 geometry로 견적 분석 — 1) bbox 즉시 2) 백그라운드 샘플링 정밀화
 */
export function runAnalysisFromGeometry(
    geometry: THREE.BufferGeometry,
    file: File,
    gen: number
): void {
    const { baseAnalysis, setAnalysis, setAnalysisError } = useFileStore.getState()
    if (baseAnalysis) return

    if (!hasPrintableGeometry(geometry)) {
        failModelAnalysis(file, gen, 'empty_geometry')
        return
    }

    try {
        const quick = analyzeGeometryBoundingBox(geometry)
        if (!isCurrentRun(gen)) return
        if (!hasValidBoundingBox(quick?.boundingBox)) {
            failModelAnalysis(file, gen, 'empty_geometry')
            return
        }
        setAnalysis(quick)
        setAnalysisError(null)
        maybeAutoFitMeshyScale({ force: true })
    } catch (e) {
        failModelAnalysis(file, gen, 'error', e)
        return
    }

    void (async () => {
        try {
            const refined = await analyzeGeometryProgressive(geometry, (partial) => {
                if (!isCurrentRun(gen)) return
                useFileStore.getState().setAnalysis(partial)
            })
            if (isCurrentRun(gen)) {
                useFileStore.getState().setAnalysis(refined)
                useFileStore.getState().setAnalysisError(null)
                maybeAutoFitMeshyScale()
                // 견적이 배치에 따라 달라지므로 업로드 직후 항상 최적 자세로 배치
                useFileStore.getState().applyAutoPlacement()
            }
        } catch (e) {
            console.error('refined analysis:', e)
            if (isCurrentRun(gen) && !useFileStore.getState().baseAnalysis) {
                useFileStore.getState().setAnalysisError(
                    '정밀 분석에 실패했습니다. 근사 견적을 사용합니다.'
                )
            }
        }
    })()
}

/** 파일 기준 분석 (뷰어·견적 공용, 파싱 1회) */
export function ensureModelAnalysisForFile(file: File): Promise<void> {
    if (useFileStore.getState().baseAnalysis) return Promise.resolve()

    const existing = ensurePromises.get(file)
    if (existing) return existing

    const gen = ++analysisGeneration

    const task = (async () => {
        try {
            const geo = await getParsedModelGeometry(file)
            if (!isCurrentRun(gen)) return
            if (!geo) {
                failModelAnalysis(file, gen, 'parse_failed')
                return
            }
            if (useFileStore.getState().baseAnalysis) return
            runAnalysisFromGeometry(geo, file, gen)
        } catch (e) {
            failModelAnalysis(file, gen, 'error', e)
        } finally {
            ensurePromises.delete(file)
        }
    })()

    ensurePromises.set(file, task)
    return task
}

export function cancelModelAnalysisRun(): void {
    analysisGeneration++
}
