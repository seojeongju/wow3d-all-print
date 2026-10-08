import { create } from 'zustand'

/** 업로드 화면 안내 — 용량 초과·분석 실패 (메인·뷰어·분석기에서 감지해 업로드 화면에 표시, 저장 안 함) */
export type AnalysisFailReason = 'parse_failed' | 'empty_geometry' | 'error'

export type UploadNotice =
    | { kind: 'too_large'; name: string; size: number }
    | { kind: 'analysis_failed'; name: string; size: number; reason: AnalysisFailReason }

type UploadNoticeState = {
    notice: UploadNotice | null
    showTooLarge: (file: { name: string; size: number }) => void
    showAnalysisFailed: (file: { name: string; size: number }, reason: AnalysisFailReason) => void
    clear: () => void
}

export const useUploadNoticeStore = create<UploadNoticeState>((set) => ({
    notice: null,
    showTooLarge: (file) => set({ notice: { kind: 'too_large', name: file.name, size: file.size } }),
    showAnalysisFailed: (file, reason) =>
        set({ notice: { kind: 'analysis_failed', name: file.name, size: file.size, reason } }),
    clear: () => set({ notice: null }),
}))
