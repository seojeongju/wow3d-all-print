import { create } from 'zustand'
import { useMemo } from 'react'
import type { GeometryAnalysis } from '@/lib/geometry'
import { invalidateModelParseCache } from '@/lib/model-parse-cache'
import { cancelModelAnalysisRun } from '@/lib/model-analysis-runner'
import { clearMeshyActiveJob } from '@/lib/meshy-active-job'
import {
    AI_PHOTO_SCALE_PERCENT_MAX,
    applyTransformToAnalysis,
    baseLongestMm,
    clampScalePercent,
    DEFAULT_MODEL_TRANSFORM,
    findAutoOrientTransform,
    getScalePercentMax,
    resolveBedMaxForMethod,
    type AutoOrientResult,
    INCH_SCALE_PERCENT,
    INCH_TO_MM,
    SCALE_PERCENT_MAX,
    type BedMaxMm,
    type ModelTransform,
    type PrintMethodKey,
    resolveScaleAxesPercent,
    withUniformScalePercent,
    withAxisScalePercent,
    withProportionalAxisScale,
    withProportionalScaleFactor,
    representativeScalePercent,
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
    /** 저장 견적의 배치를 복원함 → 자동 배치로 덮어쓰지 않음 (초기화 시 해제) */
    orientationLocked: boolean
    /** 단위 없는 파일(STL 등)을 인치로 보고 ×25.4 변환 중 */
    unitInch: boolean
    /** keepParseCache: 이전 파일의 해석 결과를 남김 (STL 점검기 수리 전·후 전환) */
    setFile: (file: File, source?: FileSourceMeta, opts?: { keepParseCache?: boolean }) => void
    setSavedQuoteId: (id: number | null) => void
    setSavedFileR2Url: (url: string | null) => void
    setPrintContextForFit: (method: PrintMethodKey, bedMax: BedMaxMm | null) => void
    markMeshyFitted: (method: PrintMethodKey, scalePercent: number, targetMm: number) => void
    setMeshyFitScalePercent: (percent: number | null) => void
    setAnalysis: (data: GeometryAnalysis) => void
    setAnalysisError: (message: string | null) => void
    /** fromUser: 사용자가 직접 조절한 경우 재자동맞춤 억제 */
    setScalePercent: (percent: number, opts?: { fromUser?: boolean }) => void
    /** 출력 축 하나의 스케일만 변경 (축별 조절) */
    setAxisScalePercent: (axis: 'x' | 'y' | 'z', percent: number, opts?: { fromUser?: boolean }) => void
    /** 비율 잠금: 한 축 목표에 맞추며 현재 축 비율 유지 */
    setAxisScaleKeepingRatio: (axis: 'x' | 'y' | 'z', percent: number, opts?: { fromUser?: boolean }) => void
    /** 비율 잠금: 대표 %를 목표로 맞추며 현재 축 비율 유지 */
    setScaleKeepingRatio: (percent: number, opts?: { fromUser?: boolean }) => void
    /** 인치 → mm 변환 켜기/끄기 (현재 스케일에 ×25.4 또는 ÷25.4) */
    setUnitInch: (on: boolean) => void
    /** 서포트·출력 시간이 가장 적은 자세로 배치 (슬라이서 자동 배치) — 잠금 상태면 무시 */
    applyAutoPlacement: () => AutoOrientResult | null
    /** 스케일 초기화 + 배치 잠금 해제 후 자동 배치 */
    resetTransform: () => void
    /** 저장 견적 재로드 시 스케일·회전 복원 */
    /** transform.unitInch: 저장 견적에 기록된 인치 변환 여부 (없으면 구 데이터 — 400% 초과면 인치로 간주) */
    setTransformFull: (
        transform: ModelTransform & { unitInch?: boolean },
        opts?: { userOverride?: boolean }
    ) => void
    reset: () => void
}

const EMPTY_SOURCE: FileSourceMeta = { kind: null, meshyJobId: null }

export const useFileStore = create<FileState>((set, get) => ({
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
    orientationLocked: false,
    unitInch: false,
    setFile: (file, source, opts) => {
        set((state) => {
            if (state.fileUrl) URL.revokeObjectURL(state.fileUrl)
            if (!opts?.keepParseCache) invalidateModelParseCache(state.file)
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
                orientationLocked: false,
                unitInch: false,
            }
        })
    },
    setSavedQuoteId: (id) => set({ savedQuoteId: id }),
    setSavedFileR2Url: (url) => set({ savedFileR2Url: url }),
    setPrintContextForFit: (method, bedMax) => {
        const prev = get()
        const same =
            prev.printMethodForFit === method &&
            prev.bedMaxForFit?.x === bedMax?.x &&
            prev.bedMaxForFit?.y === bedMax?.y &&
            prev.bedMaxForFit?.z === bedMax?.z
        set({ printMethodForFit: method, bedMaxForFit: bedMax })
        // 베드 크기가 바뀌면 들어가는 자세가 달라질 수 있음
        if (!same) get().applyAutoPlacement()
    },
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
        set((state) => {
            const max = getScalePercentMax(
                state.fileSource.kind,
                state.unitInch,
                baseLongestMm(state.baseAnalysis)
            )
            return {
                transform: withUniformScalePercent(state.transform, percent, max),
                ...(opts?.fromUser ? { meshyScaleUserOverride: true } : {}),
            }
        }),
    setAxisScalePercent: (axis, percent, opts) =>
        set((state) => {
            const max = getScalePercentMax(
                state.fileSource.kind,
                state.unitInch,
                baseLongestMm(state.baseAnalysis)
            )
            return {
                transform: withAxisScalePercent(state.transform, axis, percent, max),
                ...(opts?.fromUser ? { meshyScaleUserOverride: true } : {}),
            }
        }),
    setAxisScaleKeepingRatio: (axis, percent, opts) =>
        set((state) => {
            const max = getScalePercentMax(
                state.fileSource.kind,
                state.unitInch,
                baseLongestMm(state.baseAnalysis)
            )
            return {
                transform: withProportionalAxisScale(state.transform, axis, percent, max),
                ...(opts?.fromUser ? { meshyScaleUserOverride: true } : {}),
            }
        }),
    setScaleKeepingRatio: (percent, opts) =>
        set((state) => {
            const max = getScalePercentMax(
                state.fileSource.kind,
                state.unitInch,
                baseLongestMm(state.baseAnalysis)
            )
            const cur = resolveScaleAxesPercent(state.transform, max)
            const from = representativeScalePercent(cur, max)
            if (!(from > 0)) {
                return {
                    transform: withUniformScalePercent(state.transform, percent, max),
                    ...(opts?.fromUser ? { meshyScaleUserOverride: true } : {}),
                }
            }
            const target = clampScalePercent(percent, max)
            // 이미 균일이면 균일 스케일로, 아니면 현재 비율 유지
            const next =
                cur.x === cur.y && cur.y === cur.z
                    ? withUniformScalePercent(state.transform, target, max)
                    : withProportionalScaleFactor(state.transform, target / from, max)
            return {
                transform: next,
                ...(opts?.fromUser ? { meshyScaleUserOverride: true } : {}),
            }
        }),
    setUnitInch: (on) =>
        set((state) => {
            if (state.unitInch === on || state.fileSource.kind === 'meshy-photo') return {}
            const factor = on ? INCH_TO_MM : 1 / INCH_TO_MM
            const max = getScalePercentMax(state.fileSource.kind, on, baseLongestMm(state.baseAnalysis))
            const axes = resolveScaleAxesPercent(state.transform, AI_PHOTO_SCALE_PERCENT_MAX)
            const next = {
                x: clampScalePercent(axes.x * factor, max),
                y: clampScalePercent(axes.y * factor, max),
                z: clampScalePercent(axes.z * factor, max),
            }
            return {
                unitInch: on,
                transform: {
                    ...state.transform,
                    scalePercent: representativeScalePercent(next, max),
                    scaleXPercent: next.x,
                    scaleYPercent: next.y,
                    scaleZPercent: next.z,
                },
            }
        }),
    applyAutoPlacement: () => {
        const state = get()
        if (state.orientationLocked || !state.baseAnalysis?.orientations) return null
        const result = findAutoOrientTransform(state.baseAnalysis, state.transform, {
            bed: resolveBedMaxForMethod(state.printMethodForFit, state.bedMaxForFit),
        })
        if (!result) return null
        const t = state.transform
        const next = result.transform
        const sameLayFlat =
            (!t.layFlat && !next.layFlat) ||
            (!!t.layFlat && !!next.layFlat && t.layFlat.every((v, i) => v === next.layFlat![i]))
        if (t.rotX !== next.rotX || t.rotY !== next.rotY || t.rotZ !== next.rotZ || !sameLayFlat || !t.snapToBed) {
            // 자동 배치는 자세만 바꾸고 사용자가 맞춘 축별 스케일은 유지
            set({
                transform: {
                    ...next,
                    snapToBed: true,
                    scalePercent: t.scalePercent,
                    scaleXPercent: t.scaleXPercent,
                    scaleYPercent: t.scaleYPercent,
                    scaleZPercent: t.scaleZPercent,
                },
            })
        }
        return result
    },
    resetTransform: () => {
        set((state) => {
            const p = state.meshyFitScalePercent ?? (state.unitInch ? INCH_SCALE_PERCENT : 100)
            return {
                transform: withUniformScalePercent({ ...DEFAULT_MODEL_TRANSFORM }, p),
                orientationLocked: false,
                meshyScaleUserOverride: false,
            }
        })
        get().applyAutoPlacement()
    },
    setTransformFull: (transform, opts) =>
        set((state) => {
            const isUpload = state.fileSource.kind !== 'meshy-photo'
            // 구 견적은 인치 변환 때만 400%를 넘을 수 있었으므로 기록이 없으면 배율로 판단
            const unitInch =
                isUpload &&
                (transform.unitInch ?? (state.unitInch || transform.scalePercent > SCALE_PERCENT_MAX))
            // 견적 재로드 직후에는 원본 분석 전이라 크기 기준 상한을 모름 → 저장값을 자르지 않음
            const longest = baseLongestMm(state.baseAnalysis)
            const max =
                isUpload && longest == null
                    ? AI_PHOTO_SCALE_PERCENT_MAX
                    : getScalePercentMax(state.fileSource.kind, unitInch, longest)
            const axes = resolveScaleAxesPercent(transform, max)
            const scalePercent = representativeScalePercent(axes, max)
            return {
                unitInch,
                transform: {
                    scalePercent,
                    scaleXPercent: axes.x,
                    scaleYPercent: axes.y,
                    scaleZPercent: axes.z,
                    rotX: transform.rotX,
                    rotY: transform.rotY,
                    rotZ: transform.rotZ,
                    snapToBed: transform.snapToBed !== false,
                    layFlat: transform.layFlat ?? null,
                },
                orientationLocked: true,
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
                orientationLocked: false,
                unitInch: false,
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
