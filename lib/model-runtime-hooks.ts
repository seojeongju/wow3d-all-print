/**
 * 파일 스토어 ↔ 3D 분석 모듈 연결고리.
 * useFileStore는 헤더 등 모든 페이지에서 쓰이므로 three.js를 가진 모듈(model-parse-cache, model-analysis-runner)을 직접 임포트하지 않는다.
 * 그 모듈들이 로드될 때 자신의 정리 함수를 여기에 등록하고, 로드되지 않았다면 정리할 상태도 없으므로 호출은 아무 일도 하지 않는다.
 */
type Hooks = {
    invalidateParseCache?: (file: File | null | undefined) => void
    cancelAnalysisRun?: () => void
}

const hooks: Hooks = {}

export function registerModelRuntimeHooks(next: Hooks): void {
    Object.assign(hooks, next)
}

/** 파싱 캐시 무효화 (model-parse-cache가 로드된 경우에만) */
export function invalidateModelParseCacheIfLoaded(file: File | null | undefined): void {
    hooks.invalidateParseCache?.(file)
}

/** 진행 중인 분석 취소 (model-analysis-runner가 로드된 경우에만) */
export function cancelModelAnalysisRunIfLoaded(): void {
    hooks.cancelAnalysisRun?.()
}
