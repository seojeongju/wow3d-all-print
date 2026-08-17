import { create } from 'zustand'
import { useMemo } from 'react'
import type { GeometryAnalysis } from '@/lib/geometry'
import {
    applyTransformToAnalysis,
    clampScalePercent,
    DEFAULT_MODEL_TRANSFORM,
    nextAxis90,
    type Axis90,
    type ModelTransform,
} from '@/lib/model-transform'

export type FileSourceKind = 'upload' | 'meshy-photo' | null

export type FileSourceMeta = {
    kind: FileSourceKind
    meshyJobId?: number | null
}

interface FileState {
    file: File | null
    fileUrl: string | null
    /** 업로드 출처 — AI 사진 생성 시 견적 화면 안내 */
    fileSource: FileSourceMeta
    /** CPU/원본 메쉬 분석 (스케일·회전 미적용) */
    baseAnalysis: GeometryAnalysis | null
    transform: ModelTransform
    setFile: (file: File, source?: FileSourceMeta) => void
    setAnalysis: (data: GeometryAnalysis) => void
    setScalePercent: (percent: number) => void
    rotateAxis90: (axis: 'x' | 'y' | 'z', delta?: number) => void
    setSnapToBed: (snap: boolean) => void
    alignAxes: () => void
    resetTransform: () => void
    reset: () => void
}

const EMPTY_SOURCE: FileSourceMeta = { kind: null, meshyJobId: null }

export const useFileStore = create<FileState>((set) => ({
    file: null,
    fileUrl: null,
    fileSource: { ...EMPTY_SOURCE },
    baseAnalysis: null,
    transform: { ...DEFAULT_MODEL_TRANSFORM },
    setFile: (file, source) => {
        set((state) => {
            if (state.fileUrl) URL.revokeObjectURL(state.fileUrl)
            return {
                file,
                fileUrl: URL.createObjectURL(file),
                fileSource: source ?? { kind: 'upload', meshyJobId: null },
                baseAnalysis: null,
                transform: { ...DEFAULT_MODEL_TRANSFORM },
            }
        })
    },
    setAnalysis: (data) => set({ baseAnalysis: data }),
    setScalePercent: (percent) =>
        set((state) => ({
            transform: {
                ...state.transform,
                scalePercent: clampScalePercent(percent),
            },
        })),
    rotateAxis90: (axis, delta = 90) =>
        set((state) => {
            const key = axis === 'x' ? 'rotX' : axis === 'y' ? 'rotY' : 'rotZ'
            const current = state.transform[key] as Axis90
            return {
                transform: {
                    ...state.transform,
                    [key]: nextAxis90(current, delta),
                },
            }
        }),
    setSnapToBed: (snap) =>
        set((state) => ({
            transform: { ...state.transform, snapToBed: snap },
        })),
    alignAxes: () =>
        set((state) => ({
            transform: {
                ...state.transform,
                rotX: 0,
                rotY: 0,
                rotZ: 0,
            },
        })),
    resetTransform: () => set({ transform: { ...DEFAULT_MODEL_TRANSFORM } }),
    reset: () =>
        set((state) => {
            if (state.fileUrl) URL.revokeObjectURL(state.fileUrl)
            return {
                file: null,
                fileUrl: null,
                fileSource: { ...EMPTY_SOURCE },
                baseAnalysis: null,
                transform: { ...DEFAULT_MODEL_TRANSFORM },
            }
        }),
}))

/** 견적·치수 표시용: 변환이 반영된 분석값 */
export function getEffectiveAnalysis(
    baseAnalysis: GeometryAnalysis | null,
    transform: ModelTransform
): GeometryAnalysis | null {
    if (!baseAnalysis) return null
    return applyTransformToAnalysis(baseAnalysis, transform)
}

/**
 * 견적·치수용 유효 분석값.
 * 주의: selector에서 매번 새 객체를 만들면 React 19 useSyncExternalStore가
 * getSnapshot 불안정으로 깨지며 Minified error #310으로 이어질 수 있음.
 * base/transform 참조만 구독하고 파생값은 useMemo로 고정한다.
 */
export function useEffectiveAnalysis(): GeometryAnalysis | null {
    const baseAnalysis = useFileStore((s) => s.baseAnalysis)
    const transform = useFileStore((s) => s.transform)

    return useMemo(
        () => getEffectiveAnalysis(baseAnalysis, transform),
        [baseAnalysis, transform]
    )
}
