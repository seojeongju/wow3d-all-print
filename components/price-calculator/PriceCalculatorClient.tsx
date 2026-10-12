'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
    AlertTriangle,
    ArrowRight,
    Box,
    Calculator,
    Camera,
    Clock,
    FileBox,
    Info,
    Loader2,
    Minus,
    Package,
    Plus,
    Shapes,
    Sparkles,
    type LucideIcon,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { FDM_INFILL_PRESETS } from '@/lib/fdm-quote'
import { formatEstimatedPrintTime } from '@/lib/print-time-estimate'
import { formatBuildDims } from '@/lib/build-volume'
import { QUOTE_PRICE_ROUND_MODE, roundTo100 } from '@/lib/amount-display'
import {
    CALCULATOR_CONVERSION_EVENTS,
    CONVERSION_EVENT_CATEGORY,
} from '@/lib/conversion-events'
import { trackConversionEvent, trackConversionEventOnce } from '@/lib/track-conversion-event'
import {
    clampEstimatorDim,
    clampEstimatorQty,
    estimatePriceRange,
    ESTIMATOR_CONSULT_KRW,
    ESTIMATOR_METHODS,
    ESTIMATOR_QTY_MAX,
    ESTIMATOR_SHAPES,
    materialTypeForMethod,
    type EstimateRange,
    type EstimatorMaterial,
    type EstimatorMethod,
    type EstimatorShape,
    type EstimatorSpecs,
} from '@/lib/price-estimator'

type InfillPresetId = (typeof FDM_INFILL_PRESETS)[number]['id']

const SHAPE_ICONS: Record<EstimatorShape, LucideIcon> = {
    solid: Box,
    general: Shapes,
    shell: Package,
    figure: Sparkles,
}

const EXAMPLES: Array<{
    id: 'part' | 'case' | 'stand' | 'figure'
    dims: [number, number, number]
    shape: EstimatorShape
}> = [
    { id: 'part', dims: [40, 30, 20], shape: 'solid' },
    { id: 'case', dims: [100, 80, 40], shape: 'shell' },
    { id: 'stand', dims: [80, 70, 110], shape: 'general' },
    { id: 'figure', dims: [50, 50, 100], shape: 'figure' },
]

const QUOTE_SOURCE = 'price_calculator'

function isConsult(range: EstimateRange | null): boolean {
    return range != null && range.high.totalKrw > ESTIMATOR_CONSULT_KRW
}

export default function PriceCalculatorClient() {
    const t = useTranslations('PriceCalculator')
    const locale = useLocale()
    const userId = useAuthStore((s) => s.user?.id ?? null)

    const [dims, setDims] = useState({ x: '100', y: '80', z: '40' })
    const [shape, setShape] = useState<EstimatorShape>('shell')
    const [method, setMethod] = useState<EstimatorMethod>('fdm')
    const [materialName, setMaterialName] = useState('')
    const [infillId, setInfillId] = useState<InfillPresetId>('appearance')
    const [quantity, setQuantity] = useState(1)

    const [materials, setMaterials] = useState<EstimatorMaterial[]>([])
    const [specs, setSpecs] = useState<EstimatorSpecs | null>(null)
    const [loaded, setLoaded] = useState(false)
    const interacted = useRef(false)

    const formatKrw = (n: number) =>
        locale === 'en' ? `₩${n.toLocaleString('en-US')}` : `${n.toLocaleString('ko-KR')}원`
    const formatRange = (low: number, high: number) =>
        low === high ? formatKrw(low) : `${formatKrw(low)} ~ ${formatKrw(high)}`

    useEffect(() => {
        trackConversionEventOnce('wow3d-calc-view', {
            eventName: CALCULATOR_CONVERSION_EVENTS.VIEW,
            category: CONVERSION_EVENT_CATEGORY.CALCULATOR,
            userId,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 진입 시 1회만
    }, [])

    useEffect(() => {
        let cancelled = false
        Promise.all([
            fetch('/api/materials', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/print-specs', { cache: 'no-store' }).then((r) => r.json()),
        ])
            .then(([m, s]) => {
                if (cancelled) return
                setMaterials(Array.isArray(m?.data) ? m.data : [])
                setSpecs(s?.data ?? null)
            })
            .catch(() => { })
            .finally(() => {
                if (!cancelled) setLoaded(true)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const methodMaterials = useMemo(
        () => {
            // 소재는 이름으로 선택하므로 같은 이름이 중복되면 첫 항목만 사용
            const seen = new Set<string>()
            return materials.filter((m) => {
                if (m.type !== materialTypeForMethod(method) || seen.has(m.name)) return false
                seen.add(m.name)
                return true
            })
        },
        [materials, method]
    )

    useEffect(() => {
        if (methodMaterials.length && !methodMaterials.some((m) => m.name === materialName)) {
            setMaterialName(methodMaterials[0].name)
        }
    }, [methodMaterials, materialName])

    const parsedDims = useMemo(
        () => ({ x: clampEstimatorDim(dims.x), y: clampEstimatorDim(dims.y), z: clampEstimatorDim(dims.z) }),
        [dims]
    )
    const infillPercent = FDM_INFILL_PRESETS.find((p) => p.id === infillId)?.percent

    const estimateFor = (material: EstimatorMaterial) =>
        estimatePriceRange({
            method,
            dims: parsedDims,
            shape,
            quantity,
            material,
            spec: specs?.[method],
            infillPercent,
        })

    const selectedMaterial = methodMaterials.find((m) => m.name === materialName) ?? methodMaterials[0]
    const range = selectedMaterial && specs ? estimateFor(selectedMaterial) : null
    const comparisons = specs
        ? methodMaterials.map((m) => ({ material: m, range: estimateFor(m) }))
        : []
    const consult = isConsult(range)
    const spec = specs?.[method]
    const minPriceKr = spec?.minPriceKr
    const dimsValid = [parsedDims.x, parsedDims.y, parsedDims.z].every((v) => v >= 1)

    /** 사용자가 처음 조건을 바꿨을 때 세션당 1회 기록 */
    const markInteraction = () => {
        if (interacted.current) return
        interacted.current = true
        trackConversionEventOnce('wow3d-calc-estimate', {
            eventName: CALCULATOR_CONVERSION_EVENTS.ESTIMATE,
            category: CONVERSION_EVENT_CATEGORY.CALCULATOR,
            userId,
        })
    }

    const trackCta = (eventName: string) =>
        trackConversionEvent({
            eventName,
            category: CONVERSION_EVENT_CATEGORY.CALCULATOR,
            userId,
            metadata: {
                method,
                shape,
                material: selectedMaterial?.name ?? '',
                quantity,
                size: formatBuildDims(parsedDims),
                low: range?.low.totalKrw ?? 0,
                high: range?.high.totalKrw ?? 0,
            },
        })

    const updateDim = (key: 'x' | 'y' | 'z', value: string) => {
        markInteraction()
        setDims((d) => ({ ...d, [key]: value.replace(/[^0-9.]/g, '').slice(0, 6) }))
    }

    const applyExample = (ex: (typeof EXAMPLES)[number]) => {
        markInteraction()
        setDims({ x: String(ex.dims[0]), y: String(ex.dims[1]), z: String(ex.dims[2]) })
        setShape(ex.shape)
    }

    const setQty = (v: number) => {
        markInteraction()
        setQuantity(clampEstimatorQty(v))
    }

    const quoteHref = (entry: 'file' | 'photo') => `/quote?entry=${entry}&guide_source=${QUOTE_SOURCE}`
    const materialGuideHref =
        method === 'fdm' ? '/guides/pla-vs-abs-vs-petg' : '/guides/standard-vs-tough-vs-clear-vs-flexible-resin'
    const faqs = t.raw('faqs') as Array<{ q: string; a: string }>

    const sectionLabel = (n: number, label: string) => (
        <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-400/15 text-[11px] font-black text-teal-300">
                {n}
            </span>
            <h2 className="text-sm font-black text-white">{label}</h2>
        </div>
    )

    const resultBody = () => {
        if (!loaded) {
            return (
                <div className="flex items-center gap-2 py-8 text-sm font-bold text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t('loading')}
                </div>
            )
        }
        if (!selectedMaterial) {
            return <p className="py-6 text-sm font-bold text-white/50 break-keep">{t('materialNone')}</p>
        }
        if (!dimsValid || !range) {
            return <p className="py-6 text-sm font-bold text-amber-200/90 break-keep">{t('invalidDims')}</p>
        }
        if (consult) {
            return (
                <div className="space-y-3 py-2">
                    <p className="text-xl font-black text-white break-keep">{t('consultTitle')}</p>
                    <p className="text-[13px] font-medium leading-relaxed text-white/60 break-keep">{t('consultBody')}</p>
                    <Link
                        href="/expert#large-format"
                        onClick={() => trackCta(CALCULATOR_CONVERSION_EVENTS.CTA_CONSULT)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-300"
                    >
                        {t('consultCta')} <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            )
        }
        return (
            <div className="space-y-4">
                <div>
                    <p className="text-3xl font-black tracking-tight text-white sm:text-[2rem]" aria-live="polite">
                        {formatRange(range.low.totalKrw, range.high.totalKrw)}
                    </p>
                    {quantity > 1 ? (
                        <p className="mt-1 text-sm font-bold text-teal-300">
                            {t('resultPerUnit', { range: formatRange(range.low.unitKrw, range.high.unitKrw) })}
                        </p>
                    ) : null}
                </div>
                <div className="flex items-center gap-2 text-[13px] font-bold text-white/60">
                    <Clock className="h-4 w-4 text-white/40" />
                    {t('printTime')}{' '}
                    <span className="text-white/85">
                        {formatEstimatedPrintTime(range.low.hours, locale)}
                        {Math.abs(range.high.hours - range.low.hours) >= 1 / 60
                            ? ` ~ ${formatEstimatedPrintTime(range.high.hours, locale)}`
                            : ''}
                    </span>
                </div>
                {range.low.minApplied && minPriceKr ? (
                    <p className="flex gap-2 rounded-xl border border-teal-400/20 bg-teal-400/10 px-3 py-2.5 text-[12px] font-bold leading-relaxed text-teal-100/90 break-keep">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                        {t('minApplied', { amount: formatKrw(roundTo100(minPriceKr * 1.1, QUOTE_PRICE_ROUND_MODE)) })}
                    </p>
                ) : null}
            </div>
        )
    }

    return (
        <main className="relative flex min-h-screen flex-col overflow-x-clip bg-[#020617] text-slate-50 selection:bg-teal-500/30">
            <Header />
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_70%)]" />
                <div className="absolute left-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-teal-500/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-500/5 blur-[140px]" />
            </div>

            <section className="relative z-10 pb-8 pt-32 sm:pt-36">
                <div className="container mx-auto max-w-5xl px-4 text-center sm:px-6">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        <Calculator className="h-3.5 w-3.5" />
                        {t('eyebrow')}
                    </div>
                    <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl break-keep">
                        {t('title')} <span className="text-teal-400">{t('titleAccent')}</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm font-bold leading-relaxed text-white/55 sm:text-base break-keep">
                        {t('subtitle')}
                    </p>
                </div>
            </section>

            <section className="relative z-10 pb-16">
                <div className="container mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_400px]">
                    <div className="space-y-6 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-7">
                        {/* 1. 크기 */}
                        <div>
                            {sectionLabel(1, t('sizeLabel'))}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {(['x', 'y', 'z'] as const).map((key) => (
                                    <label key={key} className="block">
                                        <span className="mb-1 block text-[11px] font-black text-white/45">
                                            {key === 'x' ? t('width') : key === 'y' ? t('depth') : t('height')}
                                        </span>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={dims[key]}
                                                onChange={(e) => updateDim(key, e.target.value)}
                                                className="h-12 w-full rounded-xl border border-white/15 bg-slate-950/60 pl-3 pr-10 text-lg font-black text-white outline-none transition-colors focus:border-teal-400/60"
                                            />
                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/35">
                                                mm
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <p className="mt-2 text-[11px] font-bold text-white/40">{t('sizeHint')}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                <span className="mr-1 text-[11px] font-black text-white/40">{t('examplesLabel')}</span>
                                {EXAMPLES.map((ex) => (
                                    <button
                                        key={ex.id}
                                        type="button"
                                        onClick={() => applyExample(ex)}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/65 transition-colors hover:border-teal-400/40 hover:text-white"
                                    >
                                        {t(`examples.${ex.id}`)} · {ex.dims.join('×')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. 형태 */}
                        <div>
                            {sectionLabel(2, t('shapeLabel'))}
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {ESTIMATOR_SHAPES.map((s) => {
                                    const Icon = SHAPE_ICONS[s]
                                    const active = shape === s
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => {
                                                markInteraction()
                                                setShape(s)
                                            }}
                                            className={cn(
                                                'rounded-2xl border p-3 text-left transition-all',
                                                active
                                                    ? 'border-teal-400/60 bg-teal-400/15'
                                                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                                            )}
                                        >
                                            <Icon className={cn('mb-2 h-5 w-5', active ? 'text-teal-300' : 'text-white/40')} />
                                            <p className="text-[13px] font-black text-white break-keep">{t(`shapes.${s}.title`)}</p>
                                            <p className="mt-0.5 text-[11px] font-medium leading-snug text-white/45 break-keep">
                                                {t(`shapes.${s}.desc`)}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* 3. 출력 방식 */}
                        <div>
                            {sectionLabel(3, t('methodLabel'))}
                            <div className="grid grid-cols-3 gap-2">
                                {ESTIMATOR_METHODS.map((m) => {
                                    const active = method === m
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => {
                                                markInteraction()
                                                setMethod(m)
                                            }}
                                            className={cn(
                                                'rounded-2xl border p-3 text-left transition-all',
                                                active
                                                    ? 'border-indigo-400/60 bg-indigo-500/15'
                                                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                                            )}
                                        >
                                            <p className="text-sm font-black text-white">{t(`methods.${m}.title`)}</p>
                                            <p className="mt-0.5 text-[11px] font-medium leading-snug text-white/45 break-keep">
                                                {t(`methods.${m}.desc`)}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                            <Link
                                href="/guides/fdm-vs-sla-vs-dlp"
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-indigo-300 hover:text-indigo-200"
                            >
                                {t('methodGuide')} <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>

                        {/* 4. 소재 */}
                        <div>
                            {sectionLabel(4, t('materialLabel'))}
                            {methodMaterials.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {methodMaterials.map((m) => {
                                        const active = selectedMaterial?.name === m.name
                                        return (
                                            <button
                                                key={m.name}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => {
                                                    markInteraction()
                                                    setMaterialName(m.name)
                                                }}
                                                className={cn(
                                                    'rounded-xl border px-3.5 py-2 text-[13px] font-black transition-all',
                                                    active
                                                        ? 'border-teal-400/60 bg-teal-400/15 text-white'
                                                        : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white'
                                                )}
                                            >
                                                {m.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-[12px] font-bold text-white/40">
                                    {loaded ? t('materialNone') : t('loading')}
                                </p>
                            )}
                            <Link
                                href={materialGuideHref}
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-teal-300 hover:text-teal-200"
                            >
                                {method === 'fdm' ? t('materialGuideFdm') : t('materialGuideResin')}{' '}
                                <ArrowRight className="h-3 w-3" />
                            </Link>

                            {method === 'fdm' ? (
                                <div className="mt-4">
                                    <p className="mb-2 text-[11px] font-black text-white/45">{t('strengthLabel')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {FDM_INFILL_PRESETS.map((p) => {
                                            const active = infillId === p.id
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    aria-pressed={active}
                                                    onClick={() => {
                                                        markInteraction()
                                                        setInfillId(p.id)
                                                    }}
                                                    className={cn(
                                                        'rounded-xl border px-3 py-1.5 text-[12px] font-bold transition-all',
                                                        active
                                                            ? 'border-teal-400/60 bg-teal-400/15 text-white'
                                                            : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white'
                                                    )}
                                                >
                                                    {t(`strength.${p.id}`)}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* 5. 수량 */}
                        <div>
                            {sectionLabel(5, t('qtyLabel'))}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-label="-1"
                                    onClick={() => setQty(quantity - 1)}
                                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 hover:text-white"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={quantity}
                                    onChange={(e) => setQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 1)}
                                    className="h-11 w-20 rounded-xl border border-white/15 bg-slate-950/60 text-center text-lg font-black text-white outline-none focus:border-teal-400/60"
                                    aria-label={t('qtyLabel')}
                                />
                                <button
                                    type="button"
                                    aria-label="+1"
                                    onClick={() => setQty(quantity + 1)}
                                    disabled={quantity >= ESTIMATOR_QTY_MAX}
                                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 hover:text-white disabled:opacity-40"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                                <div className="ml-1 flex flex-wrap gap-1.5">
                                    {[10, 50, 100].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setQty(n)}
                                            className={cn(
                                                'rounded-full border px-2.5 py-1 text-[11px] font-bold',
                                                quantity === n
                                                    ? 'border-teal-400/60 bg-teal-400/15 text-white'
                                                    : 'border-white/10 bg-white/5 text-white/55 hover:text-white'
                                            )}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <p className="mt-2 text-[11px] font-bold leading-relaxed text-white/40 break-keep">{t('qtyHint')}</p>
                        </div>
                    </div>

                    {/* 결과 */}
                    <aside id="estimate-result" className="lg:sticky lg:top-24 lg:self-start">
                        <div className="space-y-4 rounded-[1.75rem] border border-teal-400/25 bg-gradient-to-b from-teal-500/10 to-slate-950/60 p-5 shadow-[0_20px_60px_rgba(20,184,166,0.08)] backdrop-blur-xl sm:p-6">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-300/90">
                                {t('resultEyebrow')}
                            </p>
                            {resultBody()}

                            {range && !range.fits && spec?.max ? (
                                <div className="flex gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-[12px] font-bold leading-relaxed text-amber-100/90 break-keep">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="font-black">{t('overflowTitle')}</p>
                                        <p className="mt-0.5">
                                            {t('overflowBody', { method: method.toUpperCase(), max: formatBuildDims(spec.max) })}
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-2 pt-1">
                                <Link
                                    href={quoteHref('file')}
                                    onClick={() => trackCta(CALCULATOR_CONVERSION_EVENTS.CTA_FILE)}
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.25)] transition-all hover:bg-teal-300 active:scale-[0.99]"
                                >
                                    <FileBox className="h-4 w-4" /> {t('ctaFile')} <ArrowRight className="h-4 w-4" />
                                </Link>
                                <p className="px-1 text-[11px] font-medium leading-relaxed text-white/45 break-keep">
                                    {t('ctaFileHint')}
                                </p>
                                <Link
                                    href={quoteHref('photo')}
                                    onClick={() => trackCta(CALCULATOR_CONVERSION_EVENTS.CTA_PHOTO)}
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-400/30 bg-indigo-500/15 px-5 py-3 text-sm font-black text-indigo-100 transition-all hover:bg-indigo-500/25"
                                >
                                    <Camera className="h-4 w-4" /> {t('ctaPhoto')}
                                </Link>
                                <p className="px-1 text-[11px] font-medium leading-relaxed text-white/45 break-keep">
                                    {t('ctaPhotoHint')}
                                </p>
                            </div>
                        </div>

                        {comparisons.length > 1 && dimsValid ? (
                            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                                <p className="text-sm font-black text-white">{t('compareTitle')}</p>
                                <p className="mt-0.5 text-[11px] font-medium text-white/45">{t('compareHint')}</p>
                                <ul className="mt-3 space-y-1.5">
                                    {comparisons.map(({ material, range: r }) => {
                                        const active = selectedMaterial?.name === material.name
                                        return (
                                            <li key={material.name}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        markInteraction()
                                                        setMaterialName(material.name)
                                                    }}
                                                    className={cn(
                                                        'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[12px] font-bold transition-colors',
                                                        active ? 'bg-teal-400/15 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                    )}
                                                >
                                                    <span className="font-black">{material.name}</span>
                                                    <span className="tabular-nums">
                                                        {!r ? '-' : isConsult(r) ? t('compareConsult') : formatRange(r.low.totalKrw, r.high.totalKrw)}
                                                    </span>
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        ) : null}

                        <p className="mt-4 px-1 text-[11px] font-medium leading-relaxed text-white/35 break-keep">
                            {t('disclaimer')}
                        </p>
                    </aside>
                </div>
            </section>

            <section className="relative z-10 pb-24">
                <div className="container mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_400px]">
                    <div>
                        <h2 className="mb-4 text-xl font-black text-white">{t('faqTitle')}</h2>
                        <div className="space-y-3">
                            {faqs.map((f) => (
                                <details
                                    key={f.q}
                                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 open:border-white/20"
                                >
                                    <summary className="cursor-pointer list-none text-sm font-black text-white break-keep">
                                        {f.q}
                                    </summary>
                                    <p className="mt-2 text-[13px] font-medium leading-relaxed text-white/55 break-keep">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2 className="mb-4 text-xl font-black text-white">{t('guidesTitle')}</h2>
                        <div className="space-y-2">
                            {[
                                { href: '/guides/3d-printing-quote-guide', label: t('guideQuote') },
                                { href: '/guides/pla-vs-abs-vs-petg', label: t('guideMaterials') },
                                { href: '/guides/fdm-vs-sla-vs-dlp', label: t('guideMethods') },
                                { href: '/guides/3d-printing-turnaround-time', label: t('guideTurnaround') },
                            ].map((g) => (
                                <Link
                                    key={g.href}
                                    href={g.href}
                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-black text-white/75 transition-colors hover:border-teal-400/30 hover:text-white"
                                >
                                    {g.label} <ArrowRight className="h-4 w-4 text-teal-300" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
