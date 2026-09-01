import { create } from 'zustand'
import { useMemo } from 'react'
import type { GeometryAnalysis } from '@/lib/geometry'
import { invalidateModelParseCache } from '@/lib/model-parse-cache'
import { cancelModelAnalysisRun } from '@/lib/model-analysis-runner'
import { clearMeshyActiveJob } from '@/lib/meshy-active-job'
import {
    applyTransformToAnalysis,
    clampScalePercent,
    DEFAULT_MODEL_TRANSFORM,
    getScalePercentMax,
    nextAxis90,
    type Axis90,
    type BedMaxMm,
    type ModelTransform,
    type PrintMethodKey,
} from '@/lib/model-transform'

export type FileSourceKind = 'upload' | 'meshy-photo' | null

export type FileSourceMeta = {
    kind: FileSourceKind
    meshyJobId?: number | null
}

interface FileState {
    file: File | null
    fileUrl: string | null
    /** 마지막으로 저장한 견적 ID — 동일 설정 재저장 시 UPDATE */
    savedQuoteId: number | null
    /** R2에 저장된 모델 파일 키 — 조건 변경 후 새 견적 INSERT 시 재업로드 없이 연결 */
    savedFileR2Url: string | null
    /** 사진→3D 자동 맞춤을 적용한 출력 방식 */
    meshyFittedForMethod: PrintMethodKey | null
    /** 자동 맞춤 때 적용한 스케일 % — 초기화 시 여기로 되돌림 */
    meshyFitScalePercent: number | null
    /** 자동 맞춤 목표 최장축(mm) — UI 안내 */
    meshyFitTargetMm: number | null
    /** 사용자가 스케일·치수를 직접 바꿈 → 방식 전환 시 강제 재맞춤하지 않음(오버플로만) */
    meshyScaleUserOverride: boolean
    /** 견적 패널에서 동기화한 출력 방식·베드 (Meshy autofit용) */
    printMethodForFit: PrintMethodKey
    bedMaxForFit: BedMaxMm | null
    /** 업로드 출처 — AI 사진 생성 시 견적 화면 안내 */
    fileSource: FileSourceMeta
    /** CPU/원본 메쉬 분석 (스케일·회전 미적용) */
    baseAnalysis: GeometryAnalysis | null
    /** 분석 실패·근사 견적 안내 (null = 정상) */
    analysisError: string | null
    transform: ModelTransform
    setFile: (file: File, source?: FileSourceMeta) => void
    setSavedQuoteId: (id: number | null) => void
    setSavedFileR2Url: (url: string | null) => void
    setPrintContextForFit: (method: PrintMethodKey, bedMax: BedMaxMm | null) => void
    markMeshyFitted: (method: PrintMethodKey, scalePercent: number, targetMm: number) => void
    setMeshyFitScalePercent: (percent: number | null) => void
    setAnalysis: (data: GeometryAnalysis) => void
    setAnalysisError: (message: string | null) => void
    /** fromUser: 사용자가 직접 조절한 경우 재자동맞춤 억제 */
    setScalePercent: (percent: number, opts?: { fromUser?: boolean }) => void
    rotateAxis90: (axis: 'x' | 'y' | 'z', delta?: number) => void
    setSnapToBed: (snap: boolean) => void
    alignAxes: () => void
    resetTransform: () => void
    /** 저장 견적 재로드 시 스케일·회전 복원 */
    setTransformFull: (transform: ModelTransform, opts?: { userOverride?: boolean }) => void
    reset: () => void
}

const EMPTY_SOURCE: FileSourceMeta = { kind: null, meshyJobId: null }

export const useFileStore = create<FileState>((set) => ({
    file: null,
    fileUrl: null,
    savedQuoteId: null,
    savedFileR2Url: null,
    meshyFittedForMethod: null,
    meshyFitScalePercent: null,
    meshyFitTargetMm: null,
    meshyScaleUserOverride: false,
    printMethodForFit: 'fdm',
    bedMaxForFit: null,
    fileSource: { ...EMPTY_SOURCE },
    baseAnalysis: null,
    analysisError: null,
    transform: { ...DEFAULT_MODEL_TRANSFORM },
    setFile: (file, source) => {
        set((state) => {
            if (state.fileUrl) URL.revokeObjectURL(state.fileUrl)
            invalidateModelParseCache(state.file)
            cancelModelAnalysisRun()
            return {
                file,
                fileUrl: URL.createObjectURL(file),
                savedQuoteId: null,
                savedFileR2Url: null,
                meshyFittedForMethod: null,
                meshyFitScalePercent: null,
                meshyFitTargetMm: null,
                meshyScaleUserOverride: false,
                fileSource: source ?? { kind: 'upload', meshyJobId: null },
                baseAnalysis: null,
                analysisError: null,
                transform: { ...DEFAULT_MODEL_TRANSFORM },
            }
        })
    },
    setSavedQuoteId: (id) => set({ savedQuoteId: id }),
    setSavedFileR2Url: (url) => set({ savedFileR2Url: url }),
    setPrintContextForFit: (method, bedMax) =>
        set({ printMethodForFit: method, bedMaxForFit: bedMax }),
    markMeshyFitted: (method, scalePercent, targetMm) =>
        set({
            meshyFittedForMethod: method,
            meshyFitScalePercent: scalePercent,
            meshyFitTargetMm: targetMm,
        }),
    setMeshyFitScalePercent: (percent) => set({ meshyFitScalePercent: percent }),
    setAnalysis: (data) => set({ baseAnalysis: data }),
    setAnalysisError: (message) => set({ analysisError: message }),
    setScalePercent: (percent, opts) =>
        set((state) => ({
            transform: {
                ...state.transform,
                scalePercent: clampScalePercent(percent, getScalePercentMax(state.fileSource.kind)),
            },
            ...(opts?.fromUser ? { meshyScaleUserOverride: true } : {}),
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
    resetTransform: () =>
        set((state) => ({
            transform: {
                ...DEFAULT_MODEL_TRANSFORM,
                scalePercent: state.meshyFitScalePercent ?? 100,
            },
            meshyScaleUserOverride: false,
        })),
    setTransformFull: (transform, opts) =>
        set((state) => {
            const scalePercent = clampScalePercent(
                transform.scalePercent,
                getScalePercentMax(state.fileSource.kind)
            )
            return {
                transform: {
                    scalePercent,
                    rotX: transform.rotX,
                    rotY: transform.rotY,
                    rotZ: transform.rotZ,
                    snapToBed: transform.snapToBed !== false,
                },
                ...(opts?.userOverride
                    ? {
                          meshyScaleUserOverride: true,
                          meshyFitScalePercent: scalePercent,
                      }
                    : {}),
                ...(opts?.userOverride && state.fileSource.kind === 'meshy-photo'
                    ? { meshyFittedForMethod: state.printMethodForFit }
                    : {}),
            }
        }),
    reset: () =>
        set((state) => {
            if (state.fileUrl) URL.revokeObjectURL(state.fileUrl)
            invalidateModelParseCache(state.file)
            cancelModelAnalysisRun()
            clearMeshyActiveJob()
            return {
                file: null,
                fileUrl: null,
                savedQuoteId: null,
                savedFileR2Url: null,
                meshyFittedForMethod: null,
                meshyFitScalePercent: null,
                meshyFitTargetMm: null,
                meshyScaleUserOverride: false,
                printMethodForFit: 'fdm',
                bedMaxForFit: null,
                fileSource: { ...EMPTY_SOURCE },
                baseAnalysis: null,
                analysisError: null,
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
