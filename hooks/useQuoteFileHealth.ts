'use client'

/**
 * 견적 화면 파일 상태 점검
 * - 업로드 직후 구멍·틈·중복 면 같은 메쉬 오류가 있으면 자동 리페어한 파일로 바꿔 견적 (원본으로 되돌릴 수 있음)
 * - 현재 파일의 벽 두께를 백그라운드에서 측정
 */
import { useEffect } from 'react'
import type * as THREE from 'three'
import { useFileStore, type FileSourceMeta } from '@/store/useFileStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuoteFileHealthStore, type QuoteAutoRepair } from '@/store/useQuoteFileHealthStore'
import { getParsedModelGeometry, invalidateModelParseCache } from '@/lib/model-parse-cache'
import { inspectMesh, type MeshInspection } from '@/lib/mesh-inspect'
import { binaryStlSize, meshRepairChanged, repairedFileName } from '@/lib/mesh-repair'
import { runMeshRepair } from '@/lib/mesh-repair-client'
import { runMeshThickness } from '@/lib/mesh-thickness-client'
import type { MeshThicknessResult } from '@/lib/mesh-thickness'
import { CONVERSION_EVENT_CATEGORY, QUOTE_CONVERSION_EVENTS } from '@/lib/conversion-events'
import { trackConversionEvent } from '@/lib/track-conversion-event'

/** 3MF(다중 부품)·STEP(원본 CAD 보존)·AI 사진 모델(서버가 원본을 다시 받음)은 자동 리페어하지 않음 */
const AUTO_REPAIR_EXTENSIONS = new Set(['stl', 'obj', 'ply'])

const thicknessCache = new WeakMap<File, MeshThicknessResult | null>()

function autoRepairEligible(file: File, source: FileSourceMeta): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    return AUTO_REPAIR_EXTENSIONS.has(ext) && source.kind !== 'meshy-photo'
}

function needsRepair(m: MeshInspection): boolean {
    return m.holes > 0 || m.openEdges > 0 || m.nonManifoldEdges > 0
}

/** 구멍 메우기는 형상 밖으로 나가지 않으므로 크기가 달라졌으면 잘못된 리페어로 보고 버림 */
function keepsSize(stl: ArrayBuffer, geometry: THREE.BufferGeometry): boolean {
    const after = binaryStlSize(stl)
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    if (!after || !box) return false
    const before = [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z]
    return before.every((b, k) => Math.abs(after[k] - b) <= Math.max(b * 0.01, 1e-3))
}

async function tryAutoRepair(
    file: File,
    geometry: THREE.BufferGeometry,
    isCurrent: () => boolean
): Promise<QuoteAutoRepair | null> {
    const inspected = await inspectMesh(geometry, () => !isCurrent())
    if (inspected?.status !== 'ok' || !needsRepair(inspected.result)) return null
    // 의도한 작은 부품을 지울 수 있어 부스러기 제거는 하지 않음
    const result = await runMeshRepair(geometry, { removeFragments: false })
    if (result.status !== 'ok' || !meshRepairChanged(result.report)) return null
    if (!keepsSize(result.stl, geometry)) return null
    const repaired = new File([result.stl], repairedFileName(file.name), { type: 'model/stl' })
    return { original: file, repaired, report: result.report, before: inspected.result }
}

export function useQuoteFileHealth({ autoRepair }: { autoRepair: boolean }) {
    const file = useFileStore((s) => s.file)

    useEffect(() => {
        const health = useQuoteFileHealthStore.getState()
        const prev = health.repair
        const inPair = file != null && prev != null && (prev.original === file || prev.repaired === file)
        if (!inPair) {
            // 새 파일·초기화 — 원본·리페어 전환용으로 남겨 둔 해석 결과 정리
            if (prev) {
                invalidateModelParseCache(prev.original)
                invalidateModelParseCache(prev.repaired)
            }
            health.reset()
        }
        if (!file) return

        let cancelled = false
        const isCurrent = () => !cancelled && useFileStore.getState().file === file

        const run = async () => {
            let geometry: THREE.BufferGeometry | null = null
            try {
                geometry = await getParsedModelGeometry(file)
            } catch {
                geometry = null
            }
            if (!isCurrent()) return

            if (geometry && !inPair && autoRepair && autoRepairEligible(file, useFileStore.getState().fileSource)) {
                let repair: QuoteAutoRepair | null = null
                try {
                    repair = await tryAutoRepair(file, geometry, isCurrent)
                } catch (e) {
                    console.warn('[quote] 자동 리페어 실패 — 원본으로 견적:', e)
                }
                if (!isCurrent()) return
                if (repair) {
                    useQuoteFileHealthStore.getState().setRepair(repair)
                    trackConversionEvent({
                        eventName: QUOTE_CONVERSION_EVENTS.AUTO_REPAIR,
                        category: CONVERSION_EVENT_CATEGORY.QUOTE,
                        userId: useAuthStore.getState().user?.id ?? null,
                        metadata: {
                            holes: repair.report.holesFilled,
                            stitched: repair.report.stitchedVertices,
                            triangles: repair.report.trianglesBefore,
                        },
                    })
                    const store = useFileStore.getState()
                    store.setFile(repair.repaired, store.fileSource, { keepParseCache: true })
                    return
                }
            }

            useQuoteFileHealthStore.getState().setDecided(file)
            if (!geometry) {
                useQuoteFileHealthStore.getState().setThickness({ file, status: 'unavailable' })
                return
            }

            let result = thicknessCache.get(file)
            if (result === undefined) {
                useQuoteFileHealthStore.getState().setThickness({ file, status: 'measuring' })
                try {
                    const outcome = await runMeshThickness(geometry)
                    result = outcome.status === 'ok' ? outcome.result : null
                } catch {
                    result = null
                }
                thicknessCache.set(file, result)
            }
            if (!isCurrent()) return
            useQuoteFileHealthStore
                .getState()
                .setThickness(result ? { file, status: 'ok', result } : { file, status: 'unavailable' })
        }

        void run()
        return () => {
            cancelled = true
        }
    }, [file, autoRepair])
}
