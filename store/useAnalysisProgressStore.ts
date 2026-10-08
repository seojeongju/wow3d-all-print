import { create } from 'zustand'
import type { ModelParseStage } from '@/lib/model-parse-protocol'

/** 분석 중 화면 단계 표시 — 파일 읽기 → 형상 해석 → 표면 정리 → 치수·부피 계산 */
export type AnalysisStage = ModelParseStage | 'measuring'

type AnalysisProgressState = {
    file: File | null
    stage: AnalysisStage | null
    startedAt: number
    setStage: (file: File, stage: AnalysisStage) => void
    clear: () => void
}

export const useAnalysisProgressStore = create<AnalysisProgressState>((set, get) => ({
    file: null,
    stage: null,
    startedAt: 0,
    setStage: (file, stage) => {
        if (get().file !== file) set({ file, stage, startedAt: Date.now() })
        else set({ stage })
    },
    clear: () => set({ file: null, stage: null, startedAt: 0 }),
}))
