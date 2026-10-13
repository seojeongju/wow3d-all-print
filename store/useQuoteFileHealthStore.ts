import { create } from 'zustand'
import type { MeshInspection } from '@/lib/mesh-inspect'
import type { MeshRepairReport } from '@/lib/mesh-repair'
import type { MeshThicknessResult } from '@/lib/mesh-thickness'

/** 견적 화면 업로드 직후 자동 리페어한 기록 — 원본·리페어 파일을 오갈 수 있게 둘 다 보관 */
export type QuoteAutoRepair = {
    original: File
    repaired: File
    report: MeshRepairReport
    before: MeshInspection
}

export type QuoteThickness =
    | { file: File; status: 'measuring' }
    | { file: File; status: 'ok'; result: MeshThicknessResult }
    | { file: File; status: 'unavailable' }

type QuoteFileHealthState = {
    /** 자동 리페어 판단이 끝난 파일 — 이 파일이 현재 파일이어야 견적 패널을 보여 줌 */
    decidedFile: File | null
    repair: QuoteAutoRepair | null
    thickness: QuoteThickness | null
    /** 뷰어에 얇은 부위 표시 */
    showThin: boolean
    setDecided: (file: File) => void
    setRepair: (repair: QuoteAutoRepair | null) => void
    setThickness: (thickness: QuoteThickness | null) => void
    setShowThin: (show: boolean) => void
    reset: () => void
}

export const useQuoteFileHealthStore = create<QuoteFileHealthState>((set) => ({
    decidedFile: null,
    repair: null,
    thickness: null,
    showThin: false,
    setDecided: (file) => set({ decidedFile: file }),
    setRepair: (repair) => set({ repair }),
    setThickness: (thickness) => set({ thickness }),
    setShowThin: (show) => set({ showThin: show }),
    reset: () => set({ decidedFile: null, repair: null, thickness: null, showThin: false }),
}))
