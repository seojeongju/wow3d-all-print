/** 모델 해석 Worker ↔ 메인 스레드 메시지 형식 */
import type { GeometryAnalysis } from '@/lib/geometry'

export type ModelParseStage = 'reading' | 'parsing' | 'preparing'

export type ParsedGeometryPayload = {
    position: Float32Array
    normal: Float32Array
    index: Uint32Array | null
    /** 3MF 다중 객체: 객체별 인덱스 범위 */
    parts: { start: number; count: number }[] | null
}

export type ModelParseRequest = { id: number; file: File }

export type ModelParseErrorCode = 'out_of_memory' | 'step_unavailable' | 'error'

/** 해석 결과(done)를 먼저 보내 근사 견적을 띄우고, 정밀 분석(analysis)은 이어서 Worker에서 계산 */
export type ModelParseResponse =
    | { id: number; type: 'ready' }
    | { id: number; type: 'stage'; stage: ModelParseStage }
    | { id: number; type: 'done'; payload: ParsedGeometryPayload | null }
    | { id: number; type: 'analysis'; analysis: GeometryAnalysis }
    | { id: number; type: 'analysis_error'; code: ModelParseErrorCode; message: string }
    | { id: number; type: 'error'; code: ModelParseErrorCode; message: string }
