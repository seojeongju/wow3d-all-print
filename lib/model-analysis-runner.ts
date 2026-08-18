import * as THREE from 'three'
import { useFileStore } from '@/store/useFileStore'
import { analyzeGeometryBoundingBox, analyzeGeometryProgressive } from '@/lib/geometry'
import { getParsedModelGeometry } from '@/lib/model-parse-cache'
import { meshyAutoFitScalePercent } from '@/lib/model-transform'

export function maybeAutoFitMeshyScale(): void {
    const state = useFileStore.getState()
    if (state.fileSource.kind !== 'meshy-photo') return
    if (state.meshyAutoFitted) return
    if (state.transform.scalePercent !== 100) {
        state.markMeshyAutoFitted()
        return
    }
    const box = state.baseAnalysis?.boundingBox
    if (!box) return
    const longest = Math.max(box.x, box.y, box.z)
    const next = meshyAutoFitScalePercent(longest)
    if (next == null) {
        state.markMeshyAutoFitted()
        return
    }
    state.setScalePercent(next)
    state.setMeshyFitScalePercent(next)
    state.markMeshyAutoFitted()
}

let analysisGeneration = 0
const ensurePromises = new WeakMap<File, Promise<void>>()

function isCurrentRun(gen: number): boolean {
    return gen === analysisGeneration
}

/**
 * 파싱된 geometry로 견적 분석 — 1) bbox 즉시 2) 백그라운드 샘플링 정밀화
 */
export function runAnalysisFromGeometry(
    geometry: THREE.BufferGeometry,
    _file: File,
    gen: number
): void {
    const { baseAnalysis, setAnalysis, setAnalysisError } = useFileStore.getState()
    if (baseAnalysis) return

    try {
        const quick = analyzeGeometryBoundingBox(geometry)
        if (!isCurrentRun(gen)) return
        setAnalysis(quick)
        setAnalysisError(null)
        maybeAutoFitMeshyScale()
    } catch (e) {
        console.error('bbox analysis:', e)
        if (isCurrentRun(gen)) {
            setAnalysisError('모델 치수를 계산할 수 없습니다.')
        }
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
            if (!geo || !isCurrentRun(gen)) return
            if (useFileStore.getState().baseAnalysis) return
            runAnalysisFromGeometry(geo, file, gen)
        } catch (e) {
            console.error('ensureModelAnalysisForFile:', e)
            if (isCurrentRun(gen)) {
                useFileStore.getState().setAnalysisError(
                    e instanceof Error ? e.message : '모델 분석 중 오류가 발생했습니다.'
                )
            }
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
