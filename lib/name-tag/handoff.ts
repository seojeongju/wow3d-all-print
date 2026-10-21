'use client'

import { create } from 'zustand'
import type { NameTagDesign } from '@/lib/name-tag/design'

/** 이름표에서 견적으로 넘기는 디자인. 같은 탭의 화면 이동 동안만 유지한다. */
type NameTagHandoffState = {
    design: NameTagDesign | null
    setDesign: (design: NameTagDesign | null) => void
}

export const useNameTagHandoff = create<NameTagHandoffState>((set) => ({
    design: null,
    setDesign: (design) => set({ design }),
}))
