/**
 * 동일 File 객체에 대한 geometry 파싱을 1회만 수행 (뷰어·분석기 공용, 대용량 중복 파싱 방지)
 * 실제 해석은 Web Worker에서 실행 — 파일 교체·초기화 시 진행 중 해석을 중단한다.
 */
import * as THREE from 'three'
import { parseModelFile } from '@/lib/model-parse-client'
import { useAnalysisProgressStore } from '@/store/useAnalysisProgressStore'

const geometryCache = new WeakMap<File, Promise<THREE.BufferGeometry | null>>()
const cancelers = new WeakMap<File, () => void>()

export function invalidateModelParseCache(file: File | null | undefined): void {
    if (!file) return
    cancelers.get(file)?.()
    cancelers.delete(file)
    geometryCache.delete(file)
}

export function getParsedModelGeometry(file: File): Promise<THREE.BufferGeometry | null> {
    let pending = geometryCache.get(file)
    if (!pending) {
        const job = parseModelFile(file, (stage) => useAnalysisProgressStore.getState().setStage(file, stage))
        pending = job.promise
        // 해석 완료 후에도 Worker 정밀 분석이 이어지므로 취소 핸들을 유지 (완료 후 호출은 무시됨)
        cancelers.set(file, job.cancel)
        geometryCache.set(file, pending)
    }
    return pending
}
