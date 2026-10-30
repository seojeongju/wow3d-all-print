'use client'

import { useFileStore, useEffectiveAnalysis } from '@/store/useFileStore'
import { nameTagTextSummary } from '@/lib/name-tag/design'
import { useNameTagHandoff } from '@/lib/name-tag/handoff'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Loader2, Box, Layers, Printer,
    Droplets, Zap, Save, ShoppingCart,
    ChevronRight, Wallet, Clock, ShieldCheck, AlertTriangle, FileText, List, ArrowRight, Palette
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties } from 'react'
import { resolveErrorCopy } from '@/lib/toast-helper'
import { QUOTE_PRICE_ROUND_MODE, roundTo100, type PriceRoundMode } from '@/lib/amount-display'
import { generateModelThumbnail } from '@/lib/modelThumbnail'
import { parseMeshyJobIdFromFileName } from '@/lib/meshy-r2'
import type { Quote, QuoteData } from '@/lib/types'
import {
    calculateFdmQuote,
    FDM_INFILL_DEFAULT,
    FDM_INFILL_MAX,
    FDM_INFILL_MIN,
    FDM_INFILL_PRESETS,
} from '@/lib/fdm-quote'
import { calculateResinQuote } from '@/lib/resin-quote'
import { formatEstimatedPrintTime } from '@/lib/print-time-estimate'
import { sanitizeGeometryAnalysis } from '@/lib/geometry'
import { maybeAutoFitMeshyScale } from '@/lib/model-analysis-runner'
import {
    CONVERSION_EVENT_CATEGORY,
    QUOTE_CONVERSION_EVENTS,
} from '@/lib/conversion-events'
import { trackConversionEvent } from '@/lib/track-conversion-event'
import { useQuoteEstimateLog, type QuoteEstimateSnapshot } from '@/hooks/useQuoteEstimateLog'
import { toEstimateTransformPayload } from '@/lib/quote-estimate-transform'
import { parseStoredModelTransform } from '@/lib/quote-reload'
import { fitsBuildVolume, formatBuildDims } from '@/lib/build-volume'
import InchUnitNotice from '@/components/quote/InchUnitNotice'
import QuoteEmailSave from '@/components/quote/QuoteEmailSave'
import QuoteActionFeedback, { type QuoteFeedback, type QuoteFeedbackAction } from '@/components/quote/QuoteActionFeedback'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { KakaoChannelFab } from '@/components/quote/KakaoChannelFab'
import { MESHY_AI_DISCLAIMER_SHORT, MESHY_AI_DISCLAIMER_SHORT_EN } from '@/lib/meshy-disclaimer'
import {
    coercePrintColorForMaterial,
    formatPrintColor,
    getAllowedPrintColors,
    isPlaMaterial,
    normalizePrintColor,
    PRINT_COLOR_DEFAULT,
    PRINT_COLOR_NOTE_MAX,
    type PrintColor,
} from '@/lib/print-color'

type PrintSpecEntry = {
    label?: string
    quoteFamily?: 'fdm' | 'sla' | 'dlp'
    max: { x: number; y: number; z: number }
    layerHeights?: number[]
    hourlyRate?: number
    layerCosts?: Record<string, number>
    minPriceKr?: number
    fdm_layer_hours_factor?: number
    fdm_labor_cost_krw?: number
    fdm_support_per_cm2_krw?: number
    sla_layer_exposure_sec?: number
    sla_labor_cost_krw?: number
    sla_consumables_krw?: number
    sla_post_process_krw?: number
    sla_support_per_cm2_krw?: number
    dlp_layer_exposure_sec?: number
    dlp_labor_cost_krw?: number
    dlp_consumables_krw?: number
    dlp_post_process_krw?: number
    dlp_support_per_cm2_krw?: number
}

type PrintSpecs = Record<string, PrintSpecEntry>

type ApiMaterial = {
    id: number
    name: string
    type: string
    price_per_gram: number
    price_per_ml?: number | null
    density: number
    min_price_krw?: number | null
}

/** 출력방식 type 코드(소문자). 견적 공식은 quoteFamily로 결정 */
type PrintMethod = string

function resolveQuoteFamily(method: string, specs: PrintSpecs | null): 'fdm' | 'sla' | 'dlp' {
    const entry = specs?.[method]
    const f = entry?.quoteFamily || method
    if (f === 'sla' || f === 'dlp') return f
    return 'fdm'
}

type QuotePanelProps = {
    embedded?: boolean
    initialQuote?: InitialQuoteData | null
    /** load_quote_id로 진입한 견적 — 장바구니 연동용 */
    reloadQuoteId?: number | null
    guideSource?: string
    guideTopic?: string
}

type InitialQuoteData = Partial<Quote> & {
    print_method?: PrintMethod
    fdm_material?: string | null
    fdm_infill?: number | null
    fdm_layer_height?: number | null
    fdm_support?: boolean | number | null
    resin_type?: string | null
    layer_thickness?: number | null
    post_processing?: boolean | number | null
    model_transform?: string | null
    print_color?: string | null
    print_color_note?: string | null
}

type UploadResponse = {
    data?: {
        fileUrl?: string | null
        quoteId?: number | null
    }
}

type SaveQuoteResult = {
    id: number
    sessionId?: string
    totalPrice?: number
    estimatedTimeHours?: number
    pricingSource?: string
}

function buildQuoteConfigKey(input: {
    printMethod: PrintMethod
    fdmMaterial: string
    infill: number
    layerHeight: number
    supportEnabled: boolean
    resinType: string
    slaLayerHeight: number
    postProcessing: boolean
    printColor: PrintColor
    printColorNote: string
    totalPrice: number
    modelTransform: {
        scalePercent: number
        scaleXPercent?: number
        scaleYPercent?: number
        scaleZPercent?: number
        rotX: number
        rotY: number
        rotZ: number
        layFlat?: [number, number, number] | null
    }
    dimensions: { x: number; y: number; z: number }
}) {
    return JSON.stringify({
        printMethod: input.printMethod,
        fdmMaterial: input.fdmMaterial,
        infill: input.infill,
        layerHeight: input.layerHeight,
        supportEnabled: input.supportEnabled,
        resinType: input.resinType,
        slaLayerHeight: input.slaLayerHeight,
        postProcessing: input.postProcessing,
        printColor: input.printColor,
        printColorNote: input.printColor === 'other' ? input.printColorNote.trim() : '',
        totalPrice: input.totalPrice,
        scalePercent: input.modelTransform.scalePercent,
        scaleXPercent: input.modelTransform.scaleXPercent ?? input.modelTransform.scalePercent,
        scaleYPercent: input.modelTransform.scaleYPercent ?? input.modelTransform.scalePercent,
        scaleZPercent: input.modelTransform.scaleZPercent ?? input.modelTransform.scalePercent,
        rotX: input.modelTransform.rotX,
        rotY: input.modelTransform.rotY,
        rotZ: input.modelTransform.rotZ,
        layFlat: input.modelTransform.layFlat ?? null,
        dx: input.dimensions.x,
        dy: input.dimensions.y,
        dz: input.dimensions.z,
    })
}

const defaultQuoteDetail = {
    total: 0,
    time: 0,
    numLayers: 0,
    materialAmount: 0,
    materialUnit: 'g' as const,
    materialName: '-',
    costBreakdown: { material: 0, other: 0, machine: 0, labor: 0 },
    variableCostKrw: 0,
    setupCostKrw: 0,
}

export default function QuotePanel({ embedded = false, initialQuote, reloadQuoteId, guideSource, guideTopic }: QuotePanelProps) {
    const t = useTranslations('QuotePanel')
    const locale = useLocale()
    /** 저장·장바구니 결과 안내 (화면 가운데) */
    const [feedback, setFeedback] = useState<QuoteFeedback | null>(null)
    const showFeedback = useCallback(
        (next: Omit<QuoteFeedback, 'id'>) => setFeedback({ ...next, id: Date.now() }),
        []
    )
    const closeFeedback = useCallback(() => setFeedback(null), [])
    const showErrorFeedback = useCallback(
        (title: string, error?: unknown, retry?: () => void) => {
            const copy = resolveErrorCopy(title, error, locale)
            showFeedback({
                kind: 'error',
                ...copy,
                actions: retry ? [{ label: t('feedbackRetry'), onClick: retry, primary: true }] : undefined,
            })
        },
        [locale, showFeedback, t]
    )
    const file = useFileStore((s) => s.file)
    const nameTagDesign = useNameTagHandoff((s) => s.design)
    const nameTagForFile =
        file?.name.startsWith('wow3d-nametag-') && nameTagDesign && nameTagTextSummary(nameTagDesign)
            ? nameTagDesign
            : null
    const fileSource = useFileStore((s) => s.fileSource)
    const savedQuoteId = useFileStore((s) => s.savedQuoteId)
    const savedFileR2Url = useFileStore((s) => s.savedFileR2Url)
    const setSavedQuoteId = useFileStore((s) => s.setSavedQuoteId)
    const setSavedFileR2Url = useFileStore((s) => s.setSavedFileR2Url)
    const modelTransform = useFileStore((s) => s.transform)
    const setPrintContextForFit = useFileStore((s) => s.setPrintContextForFit)
    const rawAnalysis = useEffectiveAnalysis()
    const analysis = useMemo(
        () => (rawAnalysis ? sanitizeGeometryAnalysis(rawAnalysis) : null),
        [rawAnalysis]
    )
    const { addToCart, items: cartItems } = useCartStore()
    const { sessionId, token, user, setSessionId } = useAuthStore()
    const [isSaving, setIsSaving] = useState(false)
    const [lastSavedConfig, setLastSavedConfig] = useState<string>('')
    const [printMethod, setPrintMethod] = useState<PrintMethod>('fdm')
    const [fdmMaterial, setFdmMaterial] = useState('')
    const [infill, setInfill] = useState(FDM_INFILL_DEFAULT)
    const [layerHeight, setLayerHeight] = useState(0.2) // mm
    /** FDM 출력은 서포트 없이 불가 → 견적에 항상 포함 (고객 선택 없음) */
    const supportEnabled = true
    const [resinType, setResinType] = useState('')
    const [slaLayerHeight, setSlaLayerHeight] = useState(0.05) // mm
    /** 레진 출력은 세척·2차 경화·서포트 제거 없이 완성 불가 → 기본 후처리 항상 포함 */
    const postProcessing = true
    /** 출력 색상 — 금액 무관, 기타는 고객 메모로 받아 담당자가 확인 */
    const [printColor, setPrintColor] = useState<PrintColor>(PRINT_COLOR_DEFAULT)
    const [printColorNote, setPrintColorNote] = useState('')
    const printColorNoteMissing = printColor === 'other' && !printColorNote.trim()
    const printColorNoteRef = useRef<HTMLInputElement>(null)
    const [printSpecs, setPrintSpecs] = useState<PrintSpecs | null>(null)
    const quoteFamily = useMemo(
        () => resolveQuoteFamily(printMethod, printSpecs),
        [printMethod, printSpecs]
    )
    const isFdmQuote = quoteFamily === 'fdm'
    const isDlpQuote = quoteFamily === 'dlp'
    const [materials, setMaterials] = useState<ApiMaterial[]>([])
    /** 자동견적 금액 100원 단위 반올림/반내림 (원단위 | 100원 반올림 | 100원 반내림) */
    const [priceRoundMode] = useState<PriceRoundMode>(QUOTE_PRICE_ROUND_MODE)
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const initialConfigSeeded = useRef(false)
    /** 재로드한 저장 견적은 설정이 같아도 첫 담기 때 재저장 — 현재 단가로 금액·산출 시각 갱신 (유효기간·단가 변경 해소) */
    const resaveLoadedQuote = useRef(false)

    // Initial Data Effect
    useEffect(() => {
        if (!initialQuote) return
        resaveLoadedQuote.current = true

        const loadedId = Number((initialQuote as { id?: number }).id)
        if (Number.isInteger(loadedId) && loadedId > 0) {
            setSavedQuoteId(loadedId)
        }
        const loadedFileUrl =
            (initialQuote as { file_url?: string | null; fileUrl?: string | null }).file_url
            ?? (initialQuote as { fileUrl?: string | null }).fileUrl
        if (loadedFileUrl?.trim()) {
            setSavedFileR2Url(loadedFileUrl.trim())
        }

        if (initialQuote.print_method) setPrintMethod(initialQuote.print_method as PrintMethod)

        if ((initialQuote.print_method === 'fdm' || resolveQuoteFamily(String(initialQuote.print_method), printSpecs) === 'fdm')) {
            if (initialQuote.fdm_material) setFdmMaterial(initialQuote.fdm_material)
            if (initialQuote.fdm_infill) setInfill(initialQuote.fdm_infill)
            if (initialQuote.fdm_layer_height) setLayerHeight(initialQuote.fdm_layer_height)
        } else {
            if (initialQuote.resin_type) setResinType(initialQuote.resin_type)
            if (initialQuote.layer_thickness) setSlaLayerHeight(initialQuote.layer_thickness)
        }

        const loadedColor = normalizePrintColor(initialQuote.print_color)
        if (loadedColor) {
            setPrintColor(loadedColor)
            setPrintColorNote(loadedColor === 'other' ? (initialQuote.print_color_note ?? '') : '')
        }

        const storedTransform = parseStoredModelTransform(initialQuote.model_transform)
        if (storedTransform) {
            useFileStore.getState().setTransformFull(storedTransform, { userOverride: true })
        }
    }, [initialQuote, setSavedQuoteId, setSavedFileR2Url])

    useEffect(() => {
        if (!printSpecs) return
        const keys = Object.keys(printSpecs)
        if (keys.length === 0) return
        if (!printSpecs[printMethod]) setPrintMethod(keys[0])
    }, [printSpecs, printMethod])

    // 사진→3D: 출력 방식·장비 최대 치수를 autofit에 반영 (방식 전환 시 중간 크기로 재맞춤)
    useEffect(() => {
        const max = printSpecs?.[printMethod]?.max
        setPrintContextForFit(
            quoteFamily,
            max ? { x: max.x, y: max.y, z: max.z } : null
        )
        if (fileSource.kind === 'meshy-photo') {
            maybeAutoFitMeshyScale()
        }
    }, [printMethod, quoteFamily, printSpecs, setPrintContextForFit, fileSource.kind])

    // 소재·출력스펙 갱신 (관리자 설정/삭제 후 실시간 반영: visibility + 45초 폴링, cache: no-store)
    const refreshMaterials = useCallback(() => {
        fetch('/api/materials', { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => d?.data && setMaterials(Array.isArray(d.data) ? d.data : []))
            .catch(() => { })
    }, [])
    const refreshPrintSpecs = useCallback(() => {
        fetch('/api/print-specs', { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => d?.data && setPrintSpecs(d.data))
            .catch(() => { })
    }, [])

    useEffect(() => {
        refreshMaterials()
        refreshPrintSpecs()
    }, [refreshMaterials, refreshPrintSpecs])

    // 탭 전환 후 복귀 시·주기적: 관리자 소재 변경 실시간 반영
    useEffect(() => {
        const onVisible = () => { if (document.visibilityState === 'visible') { refreshMaterials(); refreshPrintSpecs(); } }
        document.addEventListener('visibilitychange', onVisible)
        const pollTimer = setInterval(() => { refreshMaterials(); refreshPrintSpecs(); }, 45_000)
        return () => { document.removeEventListener('visibilitychange', onVisible); clearInterval(pollTimer) }
    }, [refreshMaterials, refreshPrintSpecs])

    const methodMaterials = useMemo(() => {
        const typeU = printMethod.toUpperCase()
        const familyU = quoteFamily.toUpperCase()
        return materials.filter((m) => {
            const t = String(m.type || '').toUpperCase()
            return t === typeU || t === familyU
        })
    }, [materials, printMethod, quoteFamily])
    const fdmMaterials = isFdmQuote ? methodMaterials : []
    const resinMaterials = !isFdmQuote ? methodMaterials : []
    useEffect(() => {
        if (fdmMaterials.length && (fdmMaterial === '' || !fdmMaterials.some((m) => m.name === fdmMaterial))) setFdmMaterial(fdmMaterials[0].name)
    }, [fdmMaterials, fdmMaterial])
    useEffect(() => {
        if (resinMaterials.length && (resinType === '' || !resinMaterials.some((m) => m.name === resinType))) setResinType(resinMaterials[0].name)
    }, [resinMaterials, resinType, printMethod])

    const activeMaterialName = isFdmQuote ? fdmMaterial : resinType
    const isPlaColorUi = isFdmQuote && isPlaMaterial(fdmMaterial)
    const allowedPrintColors = useMemo(
        () => getAllowedPrintColors(quoteFamily, activeMaterialName),
        [quoteFamily, activeMaterialName]
    )

    // 소재·출력 방식 변경 시 허용되지 않는 색상은 자동 보정
    useEffect(() => {
        if (!activeMaterialName) return
        const next = coercePrintColorForMaterial(printColor, quoteFamily, activeMaterialName)
        if (next !== printColor) {
            setPrintColor(next)
            if (next !== 'other') setPrintColorNote('')
        }
    }, [quoteFamily, activeMaterialName, printColor])

    const MAT_COLORS: Record<string, string> = { 
        PLA: 'text-teal-400', 
        ABS: 'text-amber-400', 
        PETG: 'text-indigo-400', 
        TPU: 'text-pink-400', 
        Standard: 'text-teal-400', 
        Tough: 'text-amber-400', 
        Clear: 'text-cyan-400', 
        Flexible: 'text-lime-400' 
    }

    const volumeCm3 = analysis?.volume || 0
    const surfaceAreaCm2 = analysis?.surfaceArea || 0
    const overhangAreaRaw = analysis?.overhangArea // 오버행 정보 존재 여부 확인용
    const supportVolumeRaw = analysis?.supportVolume // 현재 배치 기준 서포트 그림자 부피
    const supportColumnMmRaw = analysis?.supportColumnMm // 서포트 기둥 부피 가중 평균 높이
    // 현재 배치 기준 측면·윗면·바닥·베드 면적 — P2S 출력 시간 산출
    const lateralAreaRaw = analysis?.lateralArea
    const topAreaRaw = analysis?.topArea
    const bottomAreaRaw = analysis?.bottomArea
    const bedAreaRaw = analysis?.bedArea
    const slowWallAreaRaw = analysis?.slowWallArea
    const curvedWallAreaRaw = analysis?.curvedWallArea
    const contourLoopsRaw = analysis?.contourLoops
    const partCount = analysis?.partCount
    const partHeightSumMm = analysis?.partHeightSum
    const partSpacingMm = analysis?.partSpacing
    const heightMm = analysis?.boundingBox.z || 0
    const bx = analysis?.boundingBox?.x ?? 0
    const by = analysis?.boundingBox?.y ?? 0
    const bz = analysis?.boundingBox?.z ?? 0

    // 회전(90° 단위)해서도 장비에 안 들어가면 초과 — 금액은 표시하되 장바구니·주문 차단
    const overflow = useMemo(() => {
        if (!printSpecs || !analysis) return null
        const key = isFdmQuote ? 'fdm' : !isFdmQuote && !isDlpQuote ? 'sla' : 'dlp'
        const spec = printSpecs[key]?.max
        if (!spec) return null
        const dims = { x: bx, y: by, z: bz }
        if (fitsBuildVolume(dims, spec)) return null
        return { size: formatBuildDims(dims), max: formatBuildDims(spec) }
    }, [printSpecs, printMethod, bx, by, bz, analysis])

    // 견적 상세: 관리자 산출 기준(printSpecs)·소재(materials) 연동
    const quoteDetail = useMemo(() => {
        if (!analysis) return defaultQuoteDetail
        const key = isFdmQuote ? 'fdm' : !isFdmQuote && !isDlpQuote ? 'sla' : 'dlp'
        const spec = printSpecs?.[key]
        const layer = isFdmQuote ? layerHeight : slaLayerHeight
        const rateKRW = (spec?.layerCosts && spec.layerCosts[String(layer)] != null)
            ? spec.layerCosts[String(layer)]
            : (spec?.hourlyRate ?? (isFdmQuote ? 5000 : isDlpQuote ? 9000 : 8000))

        if (isFdmQuote) {
            const fdmSpec = printSpecs?.fdm
            const mat = materials.find((m) => m.type === 'FDM' && m.name === fdmMaterial)
            const density = mat?.density ?? 1.24
            const pricePerGramKr = mat ? (Number(mat.price_per_gram) || 0) : 0

            const q = calculateFdmQuote({
                volumeCm3,
                surfaceAreaCm2,
                heightMm,
                density,
                pricePerGramKr,
                infillPercent: infill,
                layerHeightMm: layerHeight,
                supportEnabled,
                overhangAreaCm2: overhangAreaRaw,
                supportVolumeCm3: supportVolumeRaw,
                supportColumnMm: supportColumnMmRaw,
                lateralAreaCm2: lateralAreaRaw,
                topAreaCm2: topAreaRaw,
                bottomAreaCm2: bottomAreaRaw,
                bedAreaCm2: bedAreaRaw,
                slowWallAreaCm2: slowWallAreaRaw,
                curvedWallAreaCm2: curvedWallAreaRaw,
                contourLoopsMm: contourLoopsRaw,
                partCount,
                partHeightSumMm,
                partSpacingMm,
                materialName: mat?.name ?? fdmMaterial,
                hourlyRateKr: rateKRW,
                fdmLaborCostKrw: fdmSpec?.fdm_labor_cost_krw,
                fdmSupportPerCm2Krw: fdmSpec?.fdm_support_per_cm2_krw,
                fdmLayerHoursFactor: fdmSpec?.fdm_layer_hours_factor,
                applyVat: false,
            })

            return {
                total: q.subtotal,
                time: q.timeHours,
                numLayers: q.numLayers,
                materialAmount: q.weightGrams,
                materialUnit: 'g' as const,
                materialName: (mat?.name ?? fdmMaterial) || '-',
                costBreakdown: {
                    material: q.costBreakdown.material,
                    other: q.costBreakdown.support,
                    machine: q.costBreakdown.machine,
                    labor: q.costBreakdown.labor,
                },
                variableCostKrw: q.variableCostKrw,
                setupCostKrw: q.setupCostKrw,
            }
        }

        const mat = materials.find((m) => m.type === (isDlpQuote ? 'DLP' : 'SLA') && m.name === resinType)
        const pricePerMlKr = mat && mat.price_per_ml != null ? Number(mat.price_per_ml) : 0
        const q = calculateResinQuote({
            method: isDlpQuote ? 'dlp' : 'sla',
            volumeCm3,
            surfaceAreaCm2,
            heightMm,
            layerHeightMm: slaLayerHeight,
            pricePerMlKr,
            postProcessing,
            hourlyRateKr: rateKRW,
            layerExposureSec: isDlpQuote
                ? printSpecs?.dlp?.dlp_layer_exposure_sec
                : printSpecs?.sla?.sla_layer_exposure_sec,
            laborCostKrw: isDlpQuote
                ? printSpecs?.dlp?.dlp_labor_cost_krw
                : printSpecs?.sla?.sla_labor_cost_krw,
            consumablesKrw: isDlpQuote
                ? printSpecs?.dlp?.dlp_consumables_krw
                : printSpecs?.sla?.sla_consumables_krw,
            postProcessKrw: isDlpQuote
                ? printSpecs?.dlp?.dlp_post_process_krw
                : printSpecs?.sla?.sla_post_process_krw,
            supportPerCm2Krw: isDlpQuote
                ? printSpecs?.dlp?.dlp_support_per_cm2_krw
                : printSpecs?.sla?.sla_support_per_cm2_krw,
            applyVat: false,
        })
        return {
            total: q.subtotal,
            time: q.timeHours,
            numLayers: q.numLayers,
            materialAmount: q.volumeMl,
            materialUnit: 'mL' as const,
            materialName: (mat?.name ?? resinType) || '-',
            costBreakdown: {
                material: q.costBreakdown.material,
                other: q.costBreakdown.other + q.costBreakdown.support,
                machine: q.costBreakdown.machine,
                labor: q.costBreakdown.labor,
            },
            variableCostKrw: q.variableCostKrw,
            setupCostKrw: q.setupCostKrw,
        }
    }, [analysis, printMethod, quoteFamily, isFdmQuote, isDlpQuote, fdmMaterial, infill, layerHeight, supportEnabled, resinType, slaLayerHeight, postProcessing, printSpecs, materials, heightMm, overhangAreaRaw, supportVolumeRaw, supportColumnMmRaw, lateralAreaRaw, topAreaRaw, bottomAreaRaw, bedAreaRaw, slowWallAreaRaw, curvedWallAreaRaw, contourLoopsRaw, partCount, partHeightSumMm, partSpacingMm, surfaceAreaCm2, volumeCm3])

    // 소재 기본금액 우선, 없으면 장비(출력방식) 폴백
    const activeMaterialRow = methodMaterials.find((m) => m.name === activeMaterialName)
    const equipmentMinKr = printSpecs?.[printMethod]?.minPriceKr
    const materialMinKr =
        activeMaterialRow?.min_price_krw != null && Number(activeMaterialRow.min_price_krw) > 0
            ? Number(activeMaterialRow.min_price_krw)
            : undefined
    const minPriceKr =
        materialMinKr != null && materialMinKr > 0
            ? materialMinKr
            : equipmentMinKr != null && equipmentMinKr > 0
              ? equipmentMinKr
              : undefined

    // 기본금액(공급가)과 산출 금액 중 큰 것을 선택한 후 부가세 적용
    const baseAmount = minPriceKr != null && minPriceKr > 0 ? Math.max(quoteDetail.total, minPriceKr) : quoteDetail.total
    const totalPrice = roundTo100(baseAmount * 1.1, priceRoundMode)
    const supplyAmount = Math.round(Math.round(totalPrice) / 1.1)
    const estimatedTimeHours = quoteDetail.time
    const variableCostKrw = quoteDetail.variableCostKrw
    const setupCostKrw = quoteDetail.setupCostKrw

    const estimateSnapshot = useMemo<QuoteEstimateSnapshot | null>(() => {
        if (!file || !analysis || !(materials.length > 0) || !(totalPrice > 0)) return null
        return {
            fileName: file.name,
            fileSize: file.size,
            dimensionsX: Math.round(bx * 10) / 10,
            dimensionsY: Math.round(by * 10) / 10,
            dimensionsZ: Math.round(bz * 10) / 10,
            volumeCm3: Math.round(volumeCm3 * 100) / 100,
            surfaceAreaCm2: Math.round(surfaceAreaCm2 * 100) / 100,
            printMethod,
            materialName: isFdmQuote ? fdmMaterial : resinType,
            layerHeight: isFdmQuote ? layerHeight : slaLayerHeight,
            fdmInfill: isFdmQuote ? infill : null,
            totalPrice,
            estimatedTimeHours: Math.round(estimatedTimeHours * 100) / 100,
            guideSource: guideSource || undefined,
            modelTransform: toEstimateTransformPayload(modelTransform),
        }
    }, [file, analysis, materials.length, totalPrice, bx, by, bz, volumeCm3, surfaceAreaCm2, printMethod, fdmMaterial, resinType, layerHeight, slaLayerHeight, infill, estimatedTimeHours, guideSource, modelTransform])
    const { linkSavedQuote } = useQuoteEstimateLog(file, estimateSnapshot)

    // 저장 견적 재로드 시 lastSavedConfig 시드 — 동일 설정이면 UPDATE 유지
    useEffect(() => {
        if (!initialQuote || !analysis || initialConfigSeeded.current) return
        initialConfigSeeded.current = true
        setLastSavedConfig(
            buildQuoteConfigKey({
                printMethod,
                fdmMaterial,
                infill,
                layerHeight,
                supportEnabled,
                resinType,
                slaLayerHeight,
                postProcessing,
                printColor,
                printColorNote,
                totalPrice,
                modelTransform,
                dimensions: analysis.boundingBox,
            })
        )
    }, [
        initialQuote,
        analysis,
        printMethod,
        fdmMaterial,
        infill,
        layerHeight,
        supportEnabled,
        resinType,
        slaLayerHeight,
        postProcessing,
        printColor,
        printColorNote,
        totalPrice,
        modelTransform,
    ])

    const buildQuoteForCart = useCallback(
        (quoteId: number, price: number, hours: number, thumbnailDataUrl?: string | null): Quote => ({
            id: quoteId,
            fileName: file!.name,
            fileSize: file!.size,
            fileUrl: savedFileR2Url || undefined,
            volumeCm3,
            surfaceAreaCm2,
            dimensionsX: analysis!.boundingBox.x,
            dimensionsY: analysis!.boundingBox.y,
            dimensionsZ: analysis!.boundingBox.z,
            printMethod,
            ...(isFdmQuote
                ? {
                      fdmMaterial: fdmMaterial.toUpperCase() as Quote['fdmMaterial'],
                      fdmInfill: infill,
                      fdmLayerHeight: layerHeight,
                      fdmSupport: supportEnabled,
                  }
                : {
                      resinType: resinType as Quote['resinType'],
                      layerThickness: slaLayerHeight,
                      postProcessing,
                  }),
            printColor,
            printColorNote: printColor === 'other' ? printColorNote.trim() : undefined,
            totalPrice: price,
            estimatedTimeHours: hours,
            variableCostKrw,
            setupCostKrw,
            minPriceKrw: minPriceKr ?? undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            thumbnailDataUrl: thumbnailDataUrl || undefined,
        }),
        [
            analysis,
            file,
            fdmMaterial,
            infill,
            layerHeight,
            minPriceKr,
            postProcessing,
            printColor,
            printColorNote,
            printMethod,
            resinType,
            savedFileR2Url,
            setupCostKrw,
            slaLayerHeight,
            supportEnabled,
            surfaceAreaCm2,
            variableCostKrw,
            volumeCm3,
        ]
    )

    const syncCartIfLinked = useCallback(
        async (
            finalQuoteId: number,
            resolvedTotalPrice: number,
            resolvedEstimatedHours: number,
            previousQuoteId?: number | null
        ): Promise<boolean> => {
            if (!file || !analysis) return false

            const linkIds = new Set<number>()
            if (reloadQuoteId) linkIds.add(reloadQuoteId)
            if (previousQuoteId) linkIds.add(previousQuoteId)
            if (savedQuoteId) linkIds.add(savedQuoteId)
            linkIds.add(finalQuoteId)

            const fileKey = file.name.trim().toLowerCase()
            const linked = cartItems.some((item) => {
                if (linkIds.has(item.quoteId)) return true
                const existingName = (item.quote?.fileName || '').trim().toLowerCase()
                return Boolean(fileKey && existingName && existingName === fileKey)
            })
            if (!linked) return false

            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
                if (user?.id) headers['X-User-ID'] = String(user.id)
            } else {
                headers['X-Session-ID'] = sessionId || ''
            }

            const prevId =
                previousQuoteId && previousQuoteId !== finalQuoteId ? previousQuoteId : undefined

            try {
                const res = await fetch('/api/cart', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        quoteId: finalQuoteId,
                        quantity: 1,
                        updateOnly: true,
                        ...(prevId ? { previousQuoteId: prevId } : {}),
                    }),
                })
                if (!res.ok) return false

                const quoteForCart = buildQuoteForCart(
                    finalQuoteId,
                    resolvedTotalPrice,
                    resolvedEstimatedHours
                )
                addToCart(quoteForCart, 1, false)
                return true
            } catch {
                /* 로컬만 갱신 */
                const quoteForCart = buildQuoteForCart(
                    finalQuoteId,
                    resolvedTotalPrice,
                    resolvedEstimatedHours
                )
                addToCart(quoteForCart, 1, false)
                return false
            }
        },
        [
            addToCart,
            analysis,
            buildQuoteForCart,
            cartItems,
            file,
            reloadQuoteId,
            savedQuoteId,
            sessionId,
            token,
            user?.id,
        ]
    )

    const handleSaveQuote = async (opts?: { silent?: boolean }) => {
        if (!analysis || !file) return
        if (printColorNoteMissing) {
            showErrorFeedback(
                t('colorOtherRequiredTitle'),
                isPlaColorUi ? t('colorOtherSelectRequired') : t('colorOtherRequired')
            )
            printColorNoteRef.current?.focus()
            return null
        }

        const quoteIdBeforeSave = savedQuoteId

        setIsSaving(true)
        try {
            const uploadHeaders: HeadersInit = {};
            if (token) {
                uploadHeaders['Authorization'] = `Bearer ${token}`;
                if (user?.id) uploadHeaders['X-User-ID'] = String(user.id);
            } else {
                uploadHeaders['X-Session-ID'] = sessionId || '';
            }

            const configKey = buildQuoteConfigKey({
                printMethod,
                fdmMaterial,
                infill,
                layerHeight,
                supportEnabled,
                resinType,
                slaLayerHeight,
                postProcessing,
                printColor,
                printColorNote,
                totalPrice,
                modelTransform,
                dimensions: analysis.boundingBox,
            })

            // 동일 설정 → 기존 행 UPDATE, 조건 변경 → 새 행 INSERT
            const reuseExistingQuote = savedQuoteId != null && configKey === lastSavedConfig
            let quoteIdForPost: number | null = reuseExistingQuote ? savedQuoteId : null
            let fileUrl: string | null = null

            const meshyJobId =
                fileSource.meshyJobId ?? parseMeshyJobIdFromFileName(file.name) ?? null;
            // R2에 파일이 없을 때만 업로드(최초 1회). 조건 변경 시에는 savedFileR2Url로 새 견적에 연결
            const shouldUploadFile = !savedFileR2Url

            if (shouldUploadFile) {
                try {
                    const uploadFormData = new FormData();
                    if (meshyJobId) {
                        uploadFormData.append('meshyJobId', String(meshyJobId));
                    } else {
                        uploadFormData.append('file', file);
                    }
                    if (quoteIdForPost) {
                        uploadFormData.append('quoteId', String(quoteIdForPost));
                    }
                    const uploadRes = await fetch('/api/files/upload', {
                        method: 'POST',
                        headers: uploadHeaders,
                        body: uploadFormData,
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json() as UploadResponse;
                        fileUrl = uploadData.data?.fileUrl || null;
                        if (fileUrl) setSavedFileR2Url(fileUrl)
                        const uploadedQuoteId = uploadData.data?.quoteId || null;
                        if (uploadedQuoteId) quoteIdForPost = uploadedQuoteId;
                    } else {
                        const errBody = await uploadRes.json().catch(() => ({})) as {
                            error?: string
                            quoteId?: number
                        };
                        if (errBody.quoteId && !quoteIdForPost) {
                            quoteIdForPost = errBody.quoteId;
                        }
                        const gateway = [502, 503, 504, 413].includes(uploadRes.status)
                        const msg = errBody.error
                            || (gateway
                                ? t('toastUploadTooLarge')
                                : t('toastUploadFail'));
                        console.warn('파일 업로드 실패', uploadRes.status, msg);
                        if (fileSource.kind === 'meshy-photo' || meshyJobId || gateway) {
                            throw new Error(msg);
                        }
                    }
                } catch (uploadError) {
                    console.error('파일 업로드 중 오류:', uploadError);
                    throw uploadError;
                }
            }

            const linkedFileUrl = fileUrl || savedFileR2Url
            const createdNewVariant = !reuseExistingQuote && !!savedFileR2Url

            const quoteData: QuoteData = {
                id: quoteIdForPost ?? undefined,
                fileName: file.name,
                fileSize: file.size,
                ...(linkedFileUrl ? { fileUrl: linkedFileUrl } : {}),
                volumeCm3,
                surfaceAreaCm2,
                dimensionsX: analysis.boundingBox.x,
                dimensionsY: analysis.boundingBox.y,
                dimensionsZ: analysis.boundingBox.z,
                ...(overhangAreaRaw != null ? { overhangAreaCm2: overhangAreaRaw } : {}),
                ...(supportVolumeRaw != null ? { supportVolumeCm3: supportVolumeRaw } : {}),
                ...(supportColumnMmRaw != null ? { supportColumnMm: supportColumnMmRaw } : {}),
                ...(lateralAreaRaw != null ? { lateralAreaCm2: lateralAreaRaw } : {}),
                ...(topAreaRaw != null ? { topAreaCm2: topAreaRaw } : {}),
                ...(bottomAreaRaw != null ? { bottomAreaCm2: bottomAreaRaw } : {}),
                ...(bedAreaRaw != null ? { bedAreaCm2: bedAreaRaw } : {}),
                ...(slowWallAreaRaw != null ? { slowWallAreaCm2: slowWallAreaRaw } : {}),
                ...(curvedWallAreaRaw != null ? { curvedWallAreaCm2: curvedWallAreaRaw } : {}),
                ...(contourLoopsRaw != null ? { contourLoopsMm: contourLoopsRaw } : {}),
                ...(partCount != null && partCount > 1
                    ? { partCount, partHeightSumMm, partSpacingMm }
                    : {}),
                printMethod,
                ...(isFdmQuote ? {
                    fdmMaterial: (fdmMaterial || '').toUpperCase() as QuoteData['fdmMaterial'],
                    fdmInfill: infill,
                    fdmLayerHeight: layerHeight,
                    fdmSupport: supportEnabled,
                } : {
                    resinType: (resinType ? resinType.charAt(0).toUpperCase() + resinType.slice(1) : '') as QuoteData['resinType'],
                    layerThickness: slaLayerHeight,
                    postProcessing,
                }),
                printColor,
                ...(printColor === 'other' ? { printColorNote: printColorNote.trim() } : {}),
                totalPrice,
                estimatedTimeHours,
                variableCostKrw,
                setupCostKrw,
                minPriceKrw: minPriceKr ?? undefined,
                guideSource: guideSource || undefined,
                guideTopic: guideTopic || undefined,
                modelTransform: { ...modelTransform, unitInch: useFileStore.getState().unitInch },
                ...(nameTagForFile ? { nameTagDesign: nameTagForFile } : {}),
            }

            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
                if (user?.id) headers['X-User-ID'] = String(user.id)
            } else {
                headers['X-Session-ID'] = sessionId || ''
            }

            const response = await fetch('/api/quotes', {
                method: 'POST',
                headers,
                body: JSON.stringify(quoteData),
            })

            const result = await response.json().catch(() => ({}))
            if (!response.ok) {
                const msg = (result && typeof result.error === 'string') ? result.error : t('toastSaveFail')
                throw new Error(msg)
            }
            const data = result.data as SaveQuoteResult

            const finalQuoteId = data.id || quoteIdForPost;
            if (finalQuoteId) {
                setSavedQuoteId(finalQuoteId);
                linkSavedQuote(finalQuoteId);
            }
            setLastSavedConfig(configKey);
            resaveLoadedQuote.current = false

            const resolvedTotalPrice =
                typeof data.totalPrice === 'number' && data.totalPrice > 0 ? data.totalPrice : totalPrice
            const resolvedEstimatedHours =
                typeof data.estimatedTimeHours === 'number' ? data.estimatedTimeHours : estimatedTimeHours

            const cartSynced = finalQuoteId
                ? await syncCartIfLinked(
                      finalQuoteId,
                      resolvedTotalPrice,
                      resolvedEstimatedHours,
                      quoteIdBeforeSave ?? reloadQuoteId ?? null
                  )
                : false

            if (data?.sessionId && !token) setSessionId(data.sessionId)
            const priceHighlight = {
                label: t('feedbackPriceLabel', { method: printMethod.toUpperCase() }),
                value: `₩${Math.round(resolvedTotalPrice).toLocaleString()}`,
            }
            if (opts?.silent) {
                // 견적 메일·장바구니 담기 등 호출한 쪽이 결과를 안내
            } else if (cartSynced) {
                showFeedback({
                    kind: 'cart',
                    title: t('toastCartUpdated'),
                    description: t('toastCartUpdatedDesc'),
                    highlight: priceHighlight,
                    actions: [
                        { label: t('feedbackGoCart'), href: '/cart', primary: true },
                        { label: t('feedbackContinue') },
                    ],
                })
            } else {
                const isMember = Boolean(token && user?.id)
                const addToCartAction: QuoteFeedbackAction = {
                    label: t('addToCart'),
                    onClick: () => void handleAddToCart(),
                    primary: true,
                }
                showFeedback({
                    kind: isMember ? 'saved' : 'savedLocal',
                    title: t('toastSaved'),
                    description: createdNewVariant
                        ? t('toastSavedNew')
                        : isMember
                          ? t('toastSavedBox')
                          : t('toastSavedLocal'),
                    highlight: priceHighlight,
                    actions: isMember
                        ? [addToCartAction, { label: t('quoteBox'), href: '/quotes' }]
                        : [addToCartAction, { label: t('feedbackClose') }],
                })
            }
            return {
                ...data,
                id: finalQuoteId ?? data.id,
                totalPrice: data.totalPrice ?? totalPrice,
                estimatedTimeHours: data.estimatedTimeHours ?? estimatedTimeHours,
            };
        } catch (error) {
            showErrorFeedback(t('toastSaveFail'), error, () => void handleSaveQuote(opts))
            return null
        } finally {
            setIsSaving(false)
        }
    }

    /** 설정이 바뀌지 않았고 이미 저장된 ID가 있으면 재사용, 아니면 새로 저장 */
    const ensureQuoteSaved = async (opts?: { silent?: boolean }) => {
        if (!analysis) return null
        const configKey = buildQuoteConfigKey({
            printMethod,
            fdmMaterial,
            infill,
            layerHeight,
            supportEnabled,
            resinType,
            slaLayerHeight,
            postProcessing,
            printColor,
            printColorNote,
            totalPrice,
            modelTransform,
            dimensions: analysis.boundingBox,
        });

        if (savedQuoteId && configKey === lastSavedConfig && !resaveLoadedQuote.current) {
            return { id: savedQuoteId } as Partial<SaveQuoteResult> & { id: number }
        }
        return handleSaveQuote(opts)
    }

    const handleAddToCart = async () => {
        if (!file || !analysis) {
            showErrorFeedback(t('toastAddFail'), t('toastNoAnalysis'))
            return
        }
        if (overflow) {
            showErrorFeedback(t('overflowTitle'), t('overflowCartBlocked'))
            return
        }

        const savedQuote = await ensureQuoteSaved({ silent: true })
        if (!savedQuote) return

        try {
            const { token: authToken, sessionId: sid, user: u } = useAuthStore.getState()
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`
                if (u?.id) headers['X-User-ID'] = String(u.id)
            } else {
                headers['X-Session-ID'] = sid || ''
            }

            const alreadyInCart = cartItems.some((item) => {
                if (item.quoteId === savedQuote.id) return true
                const existingName = (item.quote?.fileName || '').trim().toLowerCase()
                const nextName = (file.name || '').trim().toLowerCase()
                return Boolean(existingName && nextName && existingName === nextName)
            })
            const resolvedTotalPrice =
                typeof savedQuote.totalPrice === 'number' && savedQuote.totalPrice > 0
                    ? savedQuote.totalPrice
                    : totalPrice
            const resolvedEstimatedHours =
                typeof savedQuote.estimatedTimeHours === 'number'
                    ? savedQuote.estimatedTimeHours
                    : estimatedTimeHours

            const [response, thumbnailDataUrl] = await Promise.all([
                fetch('/api/cart', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        quoteId: savedQuote.id,
                        quantity: 1,
                        updateOnly: alreadyInCart,
                    }),
                }),
                generateModelThumbnail(file, 256).catch(() => null),
            ])

            if (!response.ok) throw new Error(t('toastCartAddFail'))

            const quoteForCart = {
                id: savedQuote.id,
                sessionId: savedQuote.sessionId,
                fileName: file.name,
                fileSize: file.size,
                volumeCm3,
                surfaceAreaCm2,
                dimensionsX: analysis.boundingBox.x,
                dimensionsY: analysis.boundingBox.y,
                dimensionsZ: analysis.boundingBox.z,
                printMethod,
                ...(isFdmQuote
                    ? {
                          fdmMaterial: fdmMaterial.toUpperCase() as Quote['fdmMaterial'],
                          fdmInfill: infill,
                          fdmLayerHeight: layerHeight,
                          fdmSupport: supportEnabled,
                      }
                    : {
                          resinType: resinType as Quote['resinType'],
                          layerThickness: slaLayerHeight,
                          postProcessing,
                      }),
                printColor,
                printColorNote: printColor === 'other' ? printColorNote.trim() : undefined,
                totalPrice: resolvedTotalPrice,
                estimatedTimeHours: resolvedEstimatedHours,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                thumbnailDataUrl: thumbnailDataUrl || undefined,
            }
            showFeedback({
                kind: 'cart',
                title: alreadyInCart ? t('toastCartUpdated') : t('toastCartAdd'),
                description: alreadyInCart
                    ? t('toastCartAddMethod', { method: printMethod.toUpperCase() })
                    : t('toastCartAddOk'),
                highlight: {
                    label: t('feedbackPriceLabel', { method: printMethod.toUpperCase() }),
                    value: `₩${Math.round(resolvedTotalPrice).toLocaleString()}`,
                },
                actions: [
                    { label: t('feedbackGoCart'), href: '/cart', primary: true },
                    { label: t('feedbackContinue') },
                ],
            })
            addToCart(quoteForCart as Quote, 1, alreadyInCart ? false : true)
            trackConversionEvent({
                eventName: QUOTE_CONVERSION_EVENTS.ADD_TO_CART,
                category: CONVERSION_EVENT_CATEGORY.QUOTE,
                userId: u?.id ?? null,
                metadata: {
                    printMethod,
                    quoteId: savedQuote.id,
                    alreadyInCart,
                },
            })
        } catch (error) {
            showErrorFeedback(t('toastCartAddFail'), error, () => void handleAddToCart())
        }
    }

    const priceBoardRef = useRef<HTMLDivElement>(null)
    const priceRowRef = useRef<HTMLDivElement>(null)
    const [priceBoardVisible, setPriceBoardVisible] = useState(true)
    useEffect(() => {
        const el = priceRowRef.current
        if (!el || embedded) return
        let root: HTMLElement | null = el.parentElement
        while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement
        // 보드의 금액 줄이 하단 고정 막대(약 80px) 위로 완전히 올라와야 막대를 숨김
        // 소재 로딩 등으로 레이아웃이 바뀌어도 맞도록 스크롤·크기 변화마다 직접 계산
        const check = () => {
            const bottom = root ? root.getBoundingClientRect().bottom : window.innerHeight
            const rect = el.getBoundingClientRect()
            setPriceBoardVisible(rect.bottom <= bottom - 80 && rect.top >= 0)
        }
        check()
        const scroller: HTMLElement | Window = root ?? window
        scroller.addEventListener('scroll', check, { passive: true })
        window.addEventListener('resize', check)
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null
        if (ro && root?.firstElementChild) ro.observe(root.firstElementChild)
        return () => {
            scroller.removeEventListener('scroll', check)
            window.removeEventListener('resize', check)
            ro?.disconnect()
        }
    }, [file, embedded])

    if (!file) return null

    return (
        <div className={`space-y-4 ${embedded ? 'pb-6' : 'pb-4'}`}>
            {nameTagForFile ? (
                <div className="rounded-xl border border-teal-400/30 bg-teal-400/10 px-3 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-teal-300">{t('nameTagLabel')}</p>
                    <p className="mt-1 text-sm font-bold text-white break-keep">{nameTagTextSummary(nameTagForFile)}</p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-white/60 break-keep">{t('nameTagHint')}</p>
                </div>
            ) : null}
            <InchUnitNotice />

            {/* 모델 지표 — 한 줄 요약 */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/40">
                    <Box className="w-3.5 h-3.5 text-teal-400/60" /> {t('volume')}
                    <span className="ml-1 font-mono text-sm normal-case tracking-tight text-white">{volumeCm3.toFixed(1)}<span className="ml-0.5 text-[10px] text-white/30">cm³</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/40">
                    <Layers className="w-3.5 h-3.5 text-indigo-400/60" /> {t('sizeShort')}
                    <span className="ml-1 font-mono text-sm normal-case tracking-tight text-white">{bx.toFixed(1)}×{by.toFixed(1)}×{bz.toFixed(1)}<span className="ml-0.5 text-[10px] text-white/30">mm</span></span>
                </div>
            </div>

            {/* Print Method Selection */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <Printer className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-white/40">{t('printMethod')}</span>
                </div>
                <div className={`grid gap-2 ${(printSpecs ? Object.keys(printSpecs).length : 3) > 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3'}`}>
                    {(printSpecs
                        ? Object.entries(printSpecs).map(([id, spec]) => {
                            const family = spec.quoteFamily || id
                            const icon = family === 'dlp' ? Zap : family === 'sla' ? Droplets : Printer
                            return { id, icon, label: spec.label || id.toUpperCase() }
                        })
                        : [
                            { id: 'fdm', icon: Printer, label: 'FDM' },
                            { id: 'dlp', icon: Zap, label: 'DLP' },
                            { id: 'sla', icon: Droplets, label: 'SLA' },
                        ]
                    ).map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPrintMethod(method.id as PrintMethod)}
                            className={`flex items-center justify-center gap-1.5 h-10 rounded-xl border transition-all ${printMethod === method.id
                                ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/5'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
                                }`}
                        >
                            <method.icon className={`w-4 h-4 ${printMethod === method.id ? 'text-slate-950' : 'text-white/40'}`} />
                            <span className={`text-[12px] font-black tracking-tight ${printMethod === method.id ? 'text-slate-950' : 'text-white/50'}`}>
                                {method.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {overflow && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-100">{t('overflowTitle')}</p>
                        <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                            {t('overflowBody', { method: printMethod.toUpperCase(), size: overflow.size, max: overflow.max })}
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-1 mt-2 text-xs font-black text-amber-100 underline underline-offset-2 hover:text-white"
                        >
                            {t('overflowConsult')} <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            )}

            <Separator className="bg-white/10" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={printMethod}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                >
                    {/* Dynamic Material Section — 2열 칩 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            <Box className="w-3.5 h-3.5 text-teal-400" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-white/40">{t('materialSettings')}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {(isFdmQuote ? fdmMaterials : resinMaterials).length === 0 ? (
                                <p className="col-span-2 text-[13px] text-white/40 py-3 font-bold italic">{t('noMaterials')}</p>
                            ) : (
                                (isFdmQuote ? fdmMaterials : resinMaterials).map((m) => {
                                    const selected = (isFdmQuote ? fdmMaterial : resinType) === m.name
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => isFdmQuote ? setFdmMaterial(m.name) : setResinType(m.name)}
                                            className={`flex items-center gap-2 min-h-11 px-3 py-2 rounded-xl border text-left transition-all ${selected
                                                ? 'bg-teal-400/10 border-teal-400/40 ring-1 ring-teal-400/20'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[13px] font-black tracking-tight truncate ${selected ? 'text-teal-400' : 'text-white/80'} ${MAT_COLORS[m.name] || ''}`}>{m.name}</div>
                                            </div>
                                            {selected && (
                                                <div className="w-4 h-4 shrink-0 rounded-full bg-teal-400 flex items-center justify-center">
                                                    <ChevronRight className="w-3 h-3 text-slate-950 stroke-[3]" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* 출력 색상 — 소재별 허용 옵션만 표시 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            <Palette className="w-3.5 h-3.5 text-teal-400" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-white/40">{t('colorLabel')}</span>
                        </div>
                        <div
                            className={`grid gap-2 ${
                                allowedPrintColors.length >= 4
                                    ? 'grid-cols-2'
                                    : allowedPrintColors.length === 3
                                      ? 'grid-cols-3'
                                      : allowedPrintColors.length === 2
                                        ? 'grid-cols-2'
                                        : 'grid-cols-1'
                            }`}
                            role="radiogroup"
                            aria-label={t('colorLabel')}
                        >
                            {([
                                { id: 'white' as const, label: t('colorWhite'), swatch: 'bg-white border-white/60', style: undefined as CSSProperties | undefined },
                                { id: 'black' as const, label: t('colorBlack'), swatch: 'bg-black border-white/40', style: undefined },
                                { id: 'clear' as const, label: t('colorClear'), swatch: 'border-cyan-300/50', style: { background: 'linear-gradient(135deg, rgba(165,243,252,0.55) 0%, rgba(255,255,255,0.15) 45%, rgba(34,211,238,0.35) 100%)' } },
                                { id: 'other' as const, label: isPlaColorUi ? t('colorOtherSelect') : t('colorOther'), swatch: 'border-white/30', style: { background: 'conic-gradient(#f43f5e, #f59e0b, #22c55e, #3b82f6, #a855f7, #f43f5e)' } },
                            ]).filter((c) => allowedPrintColors.includes(c.id)).map((c) => {
                                const selected = printColor === c.id
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => {
                                            setPrintColor(c.id)
                                            if (c.id === 'other') requestAnimationFrame(() => printColorNoteRef.current?.focus())
                                            else setPrintColorNote('')
                                        }}
                                        className={`flex items-center justify-center gap-1.5 min-h-10 px-2 py-2 rounded-xl border text-[11px] sm:text-xs font-black leading-tight break-keep transition-all ${selected
                                            ? 'bg-teal-400/10 border-teal-400/40 ring-1 ring-teal-400/20 text-teal-300'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white/80'
                                            }`}
                                    >
                                        <span className={`w-3.5 h-3.5 shrink-0 rounded-full border ${c.swatch}`} style={c.style} aria-hidden="true" />
                                        {c.label}
                                    </button>
                                )
                            })}
                        </div>
                        {printColor === 'other' && allowedPrintColors.includes('other') && (
                            <div className="space-y-1.5">
                                <input
                                    ref={printColorNoteRef}
                                    type="text"
                                    value={printColorNote}
                                    onChange={(e) => setPrintColorNote(e.target.value.slice(0, PRINT_COLOR_NOTE_MAX))}
                                    maxLength={PRINT_COLOR_NOTE_MAX}
                                    placeholder={t('colorOtherPlaceholder')}
                                    aria-label={t('colorOtherPlaceholder')}
                                    aria-invalid={printColorNoteMissing}
                                    className={`w-full h-10 px-3 rounded-xl bg-white/5 border text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-teal-400/60 ${printColorNoteMissing ? 'border-amber-400/50' : 'border-white/10'}`}
                                />
                                <p className="px-1 text-[10px] text-amber-200/80 font-medium leading-snug break-keep">
                                    {isPlaColorUi ? t('colorOtherSelectNotice') : t('colorOtherNotice')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sliders & Switches */}
                    {isFdmQuote ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] sm:text-[11px] font-black text-white/40 uppercase tracking-[0.15em]" title={t('infillHint')}>{t('infillLabel')}</label>
                                    <span className="font-mono text-sm text-teal-400 font-black">{infill}%</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {FDM_INFILL_PRESETS.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setInfill(p.percent)}
                                            title={t(`infillPresets.${p.id}.hint`)}
                                            className={`h-9 rounded-xl border px-2 text-[11px] sm:text-xs font-black transition-all ${
                                                infill === p.percent
                                                    ? 'bg-teal-400/15 border-teal-400/40 text-teal-300'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/80'
                                            }`}
                                        >
                                            {t(`infillPresets.${p.id}.label`)} {p.percent}%
                                        </button>
                                    ))}
                                </div>
                                <div className="px-1">
                                    <input
                                        type="range"
                                        min={FDM_INFILL_MIN}
                                        max={FDM_INFILL_MAX}
                                        step="10"
                                        value={infill}
                                        onChange={(e) => setInfill(Number(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-teal-400"
                                        aria-label={t('infillLabel')}
                                    />
                                </div>
                                {(() => {
                                    const preset = FDM_INFILL_PRESETS.find((p) => p.percent === infill)
                                    return (
                                        <p className="px-1 text-[10px] text-white/40 font-medium leading-snug break-keep">
                                            {preset ? t(`infillPresets.${preset.id}.hint`) : t('infillHint')}
                                        </p>
                                    )
                                })()}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black text-white/40 uppercase tracking-[0.15em] block px-1">{t('layerHeight')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.1, 0.2, 0.3].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setLayerHeight(h)}
                                            className={`h-9 rounded-xl border text-xs font-black transition-all ${layerHeight === h
                                                ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/5'
                                                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
                                                }`}
                                        >
                                            {h}mm
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black text-white/40 uppercase tracking-[0.15em] block px-1">{t('layerHeight')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.025, 0.05, 0.1].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setSlaLayerHeight(h)}
                                            className={`h-9 rounded-xl border text-xs font-black transition-all ${slaLayerHeight === h
                                                ? 'bg-white text-slate-950 border-white shadow-xl shadow-white/5'
                                                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
                                                }`}
                                        >
                                            {h}mm
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* 상세보기 모달 - 슬레이트 톤으로 가독성 */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-md sm:max-w-lg bg-[#111827] border-white/10 text-white shadow-2xl backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-3 text-xl font-black">
                            <FileText className="w-6 h-6 text-teal-400" /> <span className="tracking-tight">{t('detailTitle')}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-2">
                        <section>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('inputSettings')}</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-slate-400">{t('method')}</div>
                                <div className="font-medium text-slate-100">{printMethod.toUpperCase()}</div>
                                <div className="text-slate-400">{t('material')}</div>
                                <div className="font-medium text-slate-100">{isFdmQuote ? fdmMaterial : resinType}</div>
                                <div className="text-slate-400">{t('colorLabel')}</div>
                                <div className="font-medium text-slate-100 break-keep">{formatPrintColor(printColor, printColorNote, locale, activeMaterialName)}</div>
                                <div className="text-slate-400">{t('layerThickness')}</div>
                                <div className="font-medium text-slate-100">{(isFdmQuote ? layerHeight : slaLayerHeight)} mm</div>
                                {isFdmQuote && (
                                    <>
                                        <div className="text-slate-400">{t('infill')}</div>
                                        <div className="font-medium text-slate-100">{infill}%</div>
                                    </>
                                )}
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('modelInfo')}</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-slate-400">{t('volume')}</div>
                                <div className="font-mono text-slate-100">{volumeCm3.toFixed(1)} cm³</div>
                                <div className="text-slate-400">{t('dimensions')}</div>
                                <div className="font-mono text-slate-100">{bx.toFixed(1)} × {by.toFixed(1)} × {bz.toFixed(1)} mm</div>
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('priceSummary')}</h4>
                            <div className="space-y-2 text-sm">
                                {/* 세부 원가 항목은 비노출 — 최종가에서 역산해 공급가액+부가세=최종가가 맞게 표시 */}
                                <div className="flex justify-between">
                                    <span className="text-slate-400">{t('supplyAmount')}</span>
                                    <span className="font-mono text-slate-100">₩{supplyAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">{t('vat')}</span>
                                    <span className="font-mono text-slate-300">₩{(Math.round(totalPrice) - supplyAmount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 mt-2 border-t border-slate-600/50 font-bold text-lg">
                                    <span className="text-slate-100">{t('finalTotal')}</span>
                                    <span className="text-primary">₩{Math.round(totalPrice).toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 text-right">{t('vatNote')}</p>
                            </div>
                        </section>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Price & Actions - 프리미엄 액션 보드 */}
            <div ref={priceBoardRef} className={`${embedded ? 'p-5 sm:p-6' : 'p-6 sm:p-8'} rounded-[2rem] sm:rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6 sm:space-y-8 relative overflow-hidden shadow-2xl mt-4 scroll-mt-4`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                <div ref={priceRowRef} className="flex items-center justify-between gap-4 sm:gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[9.5px] sm:text-[11px] font-black text-white/40 uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-1.5 sm:mb-2">
                            <Wallet className="w-3.5 h-3.5" /> {t('liveEstimate')}
                        </div>
                        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                            <span className={`font-black text-white tracking-tighter ${embedded ? 'text-2xl sm:text-3xl' : 'text-2xl sm:text-4xl'}`}>₩{Math.round(totalPrice).toLocaleString()}</span>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="text-[10px] sm:text-sm font-black text-white/30 uppercase tracking-widest">KRW</span>
                                <span className="text-[10px] sm:text-[11px] font-bold text-teal-400/90 bg-teal-400/10 px-2 py-0.5 rounded-md border border-teal-400/20">{t('vatIncluded')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-[9.5px] sm:text-[11px] font-black text-white/40 uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-1.5 sm:mb-2">
                            <Clock className="w-3.5 h-3.5" /> {t('leadTime')}
                        </div>
                        <span className="text-[15px] sm:text-[17px] font-black text-teal-400 tracking-tight">~{formatEstimatedPrintTime(estimatedTimeHours, locale)}</span>
                        <div className="mt-1.5 text-[10.5px] sm:text-[12px] font-bold text-white/60 whitespace-nowrap">
                            {t('deliveryEstimate')}{' '}
                            <span className="text-white/90">{t(`deliveryDays.${printMethod}`)}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button type="button" onClick={() => setDetailModalOpen(true)} className="flex items-center gap-2 text-[12px] sm:text-[13px] text-teal-300 hover:text-teal-200 font-black tracking-tight transition-all active:scale-95 px-1">
                        <FileText className="w-4 h-4" /> {t('viewDetail')}
                    </button>

                    {fileSource.kind === 'meshy-photo' && (
                        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/25 text-amber-50">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
                            <p className="text-[11px] sm:text-[12px] font-bold leading-relaxed break-keep">
                                {locale === 'en' ? MESHY_AI_DISCLAIMER_SHORT_EN : MESHY_AI_DISCLAIMER_SHORT}
                            </p>
                        </div>
                    )}
                    
                    <div className={`grid gap-3 ${embedded ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]'}`}>
                        {!embedded && (
                            <Button
                                disabled={!analysis || isSaving}
                                variant="ghost"
                                size="lg"
                                className="rounded-xl sm:rounded-2xl bg-white/10 border border-white/25 hover:bg-white/16 hover:border-white/40 text-white font-black gap-2 h-12 sm:h-16 text-[13px] sm:text-[15px] tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all active:scale-[0.98]"
                                onClick={() => void handleSaveQuote()}
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {t('save')}
                            </Button>
                        )}
                        <Button disabled={!analysis || isSaving || !!overflow} title={overflow ? t('overflowCartBlocked') : undefined} size={embedded ? 'sm' : 'lg'} className={`rounded-xl sm:rounded-2xl bg-white text-slate-950 hover:bg-white/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 sm:gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.12)] h-12 sm:h-16 ${embedded ? 'text-[13px] font-black' : 'text-sm sm:text-[15px] font-black tracking-tight'}`} onClick={handleAddToCart}>
                            <ShoppingCart className="w-4.5 h-4.5 sm:w-5 h-5 text-slate-950" /> {t('addToCart')}
                        </Button>
                    </div>
                </div>
                {!embedded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10 mt-1">
                        <Link
                            href="/quotes"
                            className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-teal-400/12 border border-teal-400/30 hover:bg-teal-400/20 hover:border-teal-400/50 text-teal-100 font-black text-[13px] sm:text-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <List className="w-4 h-4" /> {t('quoteBox')}
                        </Link>
                        <Link
                            href="/cart?tab=saved"
                            className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 border border-white/25 hover:bg-white/16 hover:border-white/40 text-white font-black text-[13px] sm:text-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {t('goCart')} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
                {!embedded && (
                    <QuoteEmailSave
                        disabled={!analysis || isSaving}
                        ensureSaved={() => ensureQuoteSaved({ silent: true })}
                        printMethod={printMethod}
                    />
                )}
                {!embedded && (
                    <p className="text-[11px] text-white/35 font-bold text-center leading-relaxed break-keep pt-1">
                        {t('saveHint')}
                    </p>
                )}
                <p className="text-[10px] text-white/30 text-center leading-relaxed break-keep">
                    {t('estimateLogNotice')}
                </p>
                {!embedded && (
                    <div className="flex items-center justify-center gap-2 text-[9px] text-white/20 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] pt-2">
                        <ShieldCheck className="w-3 h-3 sm:w-3.5 h-3.5 text-teal-400/50 shadow-[0_0_10px_rgba(20,184,166,0.2)]" /> WOW3D Security
                    </div>
                )}
            </div>

            {/* 조건을 바꾸는 동안 금액이 항상 보이도록 하단 고정 — 견적 보드가 보이면 숨김 (체험 페이지 임베드는 영역이 낮아 제외) */}
            {!embedded && (
            <div className="sticky bottom-0 z-20 h-0 !mt-0" aria-hidden={priceBoardVisible}>
                <button
                    type="button"
                    tabIndex={priceBoardVisible ? -1 : 0}
                    onClick={() => priceBoardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className={`absolute inset-x-0 bottom-2 flex items-center justify-between gap-3 rounded-2xl border border-teal-400/30 bg-slate-950 px-4 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] transition-all duration-200 ${priceBoardVisible ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100'}`}
                >
                    <div className="text-left min-w-0">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-white/40">
                            <Wallet className="w-3 h-3" /> {t('liveEstimate')}
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-lg font-black tracking-tight text-white">₩{Math.round(totalPrice).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-teal-400/90">{t('vatIncluded')}</span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/40">
                            <Clock className="w-3 h-3" /> {t('leadTime')}
                        </div>
                        <div className="text-[13px] font-black text-teal-400">~{formatEstimatedPrintTime(estimatedTimeHours, locale)}</div>
                    </div>
                </button>
            </div>
            )}
            <KakaoChannelFab visible={!!analysis} />
            <QuoteActionFeedback feedback={feedback} onClose={closeFeedback} closeLabel={t('feedbackClose')} />
        </div>
    )
}
