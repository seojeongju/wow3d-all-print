'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
    AlertTriangle,
    AlignCenter,
    AlignLeft,
    AlignRight,
    Box,
    Download,
    Info,
    Loader2,
    Plus,
    ShoppingCart,
    X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Maker3DErrorBoundary } from '@/components/maker/Maker3DErrorBoundary'
import { useFileStore } from '@/store/useFileStore'
import { NAME_TAG_FONTS, type NameTagFontId } from '@/lib/name-tag-fonts'
import {
    applyNameTagPreset,
    DEFAULT_NAME_TAG_DESIGN,
    HOLE_POSITIONS,
    MAX_LINE_CHARS,
    MAX_LINES,
    NAME_TAG_LIMITS,
    NAME_TAG_PRESETS,
    nameTagHasText,
    normalizeNameTagDesign,
    PLATE_SHAPES,
    RELIEF_MODES,
    type NameTagDesign,
    type NameTagPresetId,
    type TextAlign,
} from '@/lib/name-tag/design'
import { PRINT_RULES_DRAFT, type NameTagIssue } from '@/lib/name-tag/build'
import { useNameTagBuilder } from '@/lib/name-tag/use-name-tag-builder'
import { showToast } from '@/lib/toast-helper'
import { cn } from '@/lib/utils'

const NameTagPreview = dynamic(() => import('@/components/maker/NameTagPreview').then((m) => m.NameTagPreview), {
    ssr: false,
})

const FONT_FACE_CSS = NAME_TAG_FONTS.map(
    (font) => `@font-face{font-family:'${font.cssFamily}';src:url('${font.file}') format('truetype');font-display:swap;}`
).join('')

const DRAFT_KEY = 'wow3d:name-tag:v1'

const PLATE_COLORS = ['#f4f4f5', '#18181b', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#a1a1aa']
const TEXT_COLORS = ['#0f172a', '#f4f4f5', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#a1a1aa']

const ALIGN_ICONS: Record<TextAlign, typeof AlignLeft> = {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight,
}

type Props = {
    onOpenDraw: () => void
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-wider text-white/45">{title}</p>
                {aside}
            </div>
            {children}
        </div>
    )
}

function Choice({
    active,
    onClick,
    children,
    className,
    label,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
    className?: string
    label?: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            aria-label={label}
            className={cn(
                'rounded-xl border px-2 py-2 text-center text-[12px] font-bold text-white transition-colors',
                active ? 'border-teal-400/60 bg-teal-400/10' : 'border-white/10 bg-black/20 hover:border-white/25',
                className
            )}
        >
            {children}
        </button>
    )
}

function Slider({
    label,
    value,
    display,
    min,
    max,
    step,
    onChange,
}: {
    label: string
    value: number
    display: string
    min: number
    max: number
    step: number
    onChange: (v: number) => void
}) {
    return (
        <label className="block space-y-1">
            <span className="flex items-center justify-between text-[11px] font-bold text-white/55">
                {label}
                <span className="text-teal-200">{display}</span>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-teal-400"
            />
        </label>
    )
}

export function NameTagStudio({ onOpenDraw }: Props) {
    const t = useTranslations('Maker.nameTag')
    const tm = useTranslations('Maker')
    const router = useRouter()
    const setFile = useFileStore((s) => s.setFile)
    const [design, setDesign] = useState<NameTagDesign>(DEFAULT_NAME_TAG_DESIGN)
    const [loaded, setLoaded] = useState(false)
    const [showThin, setShowThin] = useState(true)
    const [busy, setBusy] = useState<'quote' | 'stl' | null>(null)
    const { result, building, error, buildMs, requestStl } = useNameTagBuilder(design)

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(DRAFT_KEY)
            if (saved) setDesign(normalizeNameTagDesign(JSON.parse(saved)))
        } catch {
            // 저장본이 깨졌으면 기본값으로 시작
        }
        setLoaded(true)
    }, [])

    useEffect(() => {
        if (!loaded) return
        const timer = window.setTimeout(() => {
            try {
                window.localStorage.setItem(DRAFT_KEY, JSON.stringify(design))
            } catch {
                // 저장 공간이 없으면 무시
            }
        }, 500)
        return () => window.clearTimeout(timer)
    }, [design, loaded])

    const update = useCallback((patch: (d: NameTagDesign) => NameTagDesign) => {
        setDesign((current) => normalizeNameTagDesign(patch(current)))
    }, [])

    const setLine = (index: number, patch: Partial<NameTagDesign['lines'][number]>) =>
        update((d) => ({ ...d, lines: d.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)) }))

    const setAllFonts = (fontId: NameTagFontId) =>
        update((d) => ({ ...d, lines: d.lines.map((line) => ({ ...line, fontId })) }))

    const issues = result?.issues ?? []
    const blocking = issues.some((issue) => issue.level === 'error')
    const hasText = nameTagHasText(design)
    const isCircle = design.plate.shape === 'circle'

    const issueText = (issue: NameTagIssue): string => {
        switch (issue.code) {
            case 'missing-glyph':
                return t('issues.missingGlyph', { chars: issue.chars.join(' ') })
            case 'thin-stroke':
                return t('issues.thinStroke', { mm: PRINT_RULES_DRAFT.minStrokeMm })
            case 'small-text':
                return t('issues.smallText', { mm: issue.heightMm.toFixed(1), min: PRINT_RULES_DRAFT.minTextHeightMm })
            case 'text-clipped':
                return t('issues.textClipped')
            case 'text-shrunk':
                return t('issues.textShrunk', { line: issue.lineIndex + 1 })
            case 'not-manifold':
            case 'multi-body':
                return t('issues.geometry')
        }
    }

    const fileBaseName = useMemo(() => {
        const first = design.lines.find((line) => line.text.trim())?.text.trim() ?? 'nametag'
        return `wow3d-nametag-${first.replace(/[^\p{L}\p{N}-]+/gu, '').slice(0, 16) || 'nametag'}`
    }, [design.lines])

    const makeStlFile = async (): Promise<File | null> => {
        const stl = await requestStl(design)
        if (!stl) return null
        return new File([stl], `${fileBaseName}.stl`, { type: 'model/stl' })
    }

    const requestQuote = async () => {
        if (!hasText || !result) {
            showToast.error(t('quoteNeedTextTitle'), t('quoteNeedText'))
            return
        }
        if (blocking) {
            showToast.error(t('quoteBlockedTitle'), t('quoteBlocked'))
            return
        }
        setBusy('quote')
        try {
            const file = await makeStlFile()
            if (!file) {
                showToast.error(tm('toastQuoteUnavailableTitle'), tm('toastQuoteNoMesh'))
                return
            }
            setFile(file)
            showToast.success(tm('toastQuoteOkTitle'), t('quoteOk'))
            router.push('/quote?entry=file&handoff=1')
        } catch (e) {
            console.error('[name-tag] 견적 파일 생성 실패', e)
            showToast.error(tm('toastQuoteFailTitle'), e instanceof Error ? e.message : tm('toastQuoteFailRetry'))
        } finally {
            setBusy(null)
        }
    }

    const downloadStl = async () => {
        if (!hasText || !result) {
            showToast.error(t('quoteNeedTextTitle'), t('quoteNeedText'))
            return
        }
        setBusy('stl')
        try {
            const file = await makeStlFile()
            if (!file) return
            const url = URL.createObjectURL(file)
            const link = document.createElement('a')
            link.href = url
            link.download = file.name
            link.click()
            window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        } catch (e) {
            console.error('[name-tag] STL 생성 실패', e)
            showToast.error(tm('toastQuoteFailTitle'), e instanceof Error ? e.message : tm('toastQuoteFailRetry'))
        } finally {
            setBusy(null)
        }
    }

    const [w, h, z] = result?.stats.sizeMm ?? [0, 0, 0]

    return (
        <>
            <style>{FONT_FACE_CSS}</style>
            <div className="flex w-full max-w-6xl flex-col overflow-hidden border border-white/10 bg-[#0d0d0d]/90 shadow-2xl md:h-[860px] md:flex-row md:rounded-[2rem]">
                <section className="relative order-1 h-[46vh] min-h-[300px] w-full shrink-0 bg-gradient-to-b from-[#0a0a0f] to-[#12121a] md:order-2 md:h-auto md:flex-1">
                    <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 text-[12px] font-bold text-white/70">
                        {building ? <Loader2 className="h-4 w-4 animate-spin text-teal-400" /> : <Box className="h-4 w-4 text-teal-400" />}
                        {building ? t('building') : hasText ? t('previewHint') : t('previewEmpty')}
                    </div>
                    {result ? (
                        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-lg bg-black/50 px-2.5 py-1.5 text-right text-[11px] font-bold leading-relaxed text-white/70">
                            <div>
                                {w.toFixed(1)} × {h.toFixed(1)} × {z.toFixed(1)} mm
                            </div>
                            <div>
                                {t('volume', { cm3: (result.stats.volumeMm3 / 1000).toFixed(2) })} · {Math.round(buildMs)}ms
                            </div>
                        </div>
                    ) : null}
                    <Maker3DErrorBoundary
                        onRetry={() => update((d) => ({ ...d }))}
                        title={tm('error3dTitle')}
                        description={tm('error3dDesc')}
                        backLabel={t('previewHint')}
                    >
                        <NameTagPreview
                            result={hasText ? result : null}
                            plateColor={design.colors.plate}
                            textColor={design.colors.text}
                            showThin={showThin}
                        />
                    </Maker3DErrorBoundary>
                    {hasText && (issues.length > 0 || error) ? (
                        <div className="absolute inset-x-3 bottom-3 z-10 space-y-1.5 md:inset-x-4 md:bottom-4">
                            {error ? (
                                <p className="rounded-lg bg-red-500/15 px-3 py-2 text-[12px] font-bold text-red-200">{t('engineError')}</p>
                            ) : null}
                            {issues.map((issue, i) => (
                                <div
                                    key={`${issue.code}-${i}`}
                                    className={cn(
                                        'flex items-start gap-2 rounded-lg px-3 py-2 text-[12px] font-bold leading-snug backdrop-blur',
                                        issue.level === 'error' && 'bg-red-500/20 text-red-100',
                                        issue.level === 'warn' && 'bg-amber-400/15 text-amber-100',
                                        issue.level === 'info' && 'bg-white/10 text-white/75'
                                    )}
                                >
                                    {issue.level === 'info' ? (
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    ) : (
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <span className="flex-1 break-keep">{issueText(issue)}</span>
                                    {issue.code === 'thin-stroke' ? (
                                        <span className="flex shrink-0 gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setAllFonts('black-han')}
                                                className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] hover:bg-white/25"
                                            >
                                                {t('fixBoldFont')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowThin((v) => !v)}
                                                className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] hover:bg-white/25"
                                            >
                                                {showThin ? t('hideThin') : t('showThin')}
                                            </button>
                                        </span>
                                    ) : null}
                                    {issue.code === 'small-text' && !isCircle ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                update((d) => ({
                                                    ...d,
                                                    plate: { ...d.plate, widthMm: d.plate.widthMm * 1.2, heightMm: d.plate.heightMm * 1.2 },
                                                }))
                                            }
                                            className="shrink-0 rounded-md bg-white/15 px-2 py-0.5 text-[11px] hover:bg-white/25"
                                        >
                                            {t('fixBiggerPlate')}
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </section>

                <section className="order-2 flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-white/10 p-5 md:order-1 md:w-[380px] md:border-r md:p-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-400">{t('kicker')}</p>
                        <h1 className="mt-1 text-xl font-black text-white">{t('title')}</h1>
                        <p className="mt-2 text-[13px] font-medium leading-relaxed text-white/70 break-keep">{t('lead')}</p>
                    </div>

                    <Section title={t('presetLabel')}>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(NAME_TAG_PRESETS) as NameTagPresetId[]).map((id) => (
                                <Choice key={id} active={false} onClick={() => setDesign((d) => applyNameTagPreset(d, id))}>
                                    {t(`presets.${id}`)}
                                </Choice>
                            ))}
                        </div>
                    </Section>

                    <Section
                        title={t('linesLabel')}
                        aside={
                            design.lines.length < MAX_LINES ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        update((d) => ({
                                            ...d,
                                            lines: [...d.lines, { text: '', fontId: d.lines[d.lines.length - 1].fontId, size: 0.6 }],
                                        }))
                                    }
                                    className="flex items-center gap-1 text-[11px] font-bold text-teal-300 hover:text-teal-200"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {t('addLine')}
                                </button>
                            ) : null
                        }
                    >
                        <div className="space-y-3">
                            {design.lines.map((line, index) => (
                                <div key={index} className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={line.text}
                                            maxLength={MAX_LINE_CHARS}
                                            onChange={(e) => setLine(index, { text: e.target.value })}
                                            placeholder={t(`linePlaceholder${Math.min(index, 2)}`)}
                                            aria-label={t('lineAria', { n: index + 1 })}
                                            style={{ fontFamily: `'${NAME_TAG_FONTS.find((f) => f.id === line.fontId)?.cssFamily}', sans-serif` }}
                                            className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-[15px] text-white outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-white/30 focus:border-teal-400/50"
                                        />
                                        {design.lines.length > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => update((d) => ({ ...d, lines: d.lines.filter((_, i) => i !== index) }))}
                                                aria-label={t('removeLine')}
                                                className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={line.fontId}
                                            onChange={(e) => setLine(index, { fontId: e.target.value as NameTagFontId })}
                                            aria-label={t('fontLabel')}
                                            className="h-8 rounded-lg border border-white/10 bg-black/40 px-2 text-[12px] font-bold text-white outline-none"
                                        >
                                            {NAME_TAG_FONTS.map((font) => (
                                                <option key={font.id} value={font.id}>
                                                    {t(`fonts.${font.id}`)}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="range"
                                            min={NAME_TAG_LIMITS.lineSize[0]}
                                            max={NAME_TAG_LIMITS.lineSize[1]}
                                            step={0.05}
                                            value={line.size}
                                            onChange={(e) => setLine(index, { size: Number(e.target.value) })}
                                            aria-label={t('lineSize')}
                                            className="min-w-0 flex-1 accent-teal-400"
                                        />
                                        <span className="w-14 text-right text-[11px] font-bold text-white/55">
                                            {result?.lines.find((l) => l.index === index)?.heightMm.toFixed(1) ?? '-'}mm
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title={t('fontAllLabel')}>
                        <div className="grid grid-cols-2 gap-2">
                            {NAME_TAG_FONTS.map((font) => (
                                <Choice
                                    key={font.id}
                                    active={design.lines.every((line) => line.fontId === font.id)}
                                    onClick={() => setAllFonts(font.id)}
                                    className="text-left"
                                >
                                    <span className="block truncate text-[15px] font-normal" style={{ fontFamily: `'${font.cssFamily}', sans-serif` }}>
                                        {t(`fonts.${font.id}`)}
                                    </span>
                                </Choice>
                            ))}
                        </div>
                    </Section>

                    <Section title={t('alignLabel')}>
                        <div className="grid grid-cols-3 gap-2">
                            {(['left', 'center', 'right'] as const).map((align) => {
                                const Icon = ALIGN_ICONS[align]
                                return (
                                    <Choice
                                        key={align}
                                        label={t(`align.${align}`)}
                                        active={design.align === align}
                                        onClick={() => update((d) => ({ ...d, align }))}
                                    >
                                        <Icon className="mx-auto h-4 w-4" />
                                    </Choice>
                                )
                            })}
                        </div>
                        <Slider
                            label={t('letterSpacing')}
                            value={design.letterSpacing}
                            display={`${Math.round(design.letterSpacing * 100)}%`}
                            min={NAME_TAG_LIMITS.letterSpacing[0]}
                            max={NAME_TAG_LIMITS.letterSpacing[1]}
                            step={0.01}
                            onChange={(letterSpacing) => update((d) => ({ ...d, letterSpacing }))}
                        />
                    </Section>

                    <Section title={t('plateLabel')}>
                        <div className="grid grid-cols-5 gap-1.5">
                            {PLATE_SHAPES.map((shape) => (
                                <Choice
                                    key={shape}
                                    active={design.plate.shape === shape}
                                    onClick={() => update((d) => ({ ...d, plate: { ...d.plate, shape } }))}
                                    className="px-1 text-[11px]"
                                >
                                    {t(`shapes.${shape}`)}
                                </Choice>
                            ))}
                        </div>
                        <Slider
                            label={isCircle ? t('diameter') : design.plate.shape === 'outline' ? t('textAreaWidth') : t('width')}
                            value={design.plate.widthMm}
                            display={`${design.plate.widthMm.toFixed(0)}mm`}
                            min={NAME_TAG_LIMITS.widthMm[0]}
                            max={NAME_TAG_LIMITS.widthMm[1]}
                            step={1}
                            onChange={(widthMm) => update((d) => ({ ...d, plate: { ...d.plate, widthMm } }))}
                        />
                        {!isCircle ? (
                            <Slider
                                label={design.plate.shape === 'outline' ? t('textAreaHeight') : t('height')}
                                value={design.plate.heightMm}
                                display={`${design.plate.heightMm.toFixed(0)}mm`}
                                min={NAME_TAG_LIMITS.heightMm[0]}
                                max={NAME_TAG_LIMITS.heightMm[1]}
                                step={1}
                                onChange={(heightMm) => update((d) => ({ ...d, plate: { ...d.plate, heightMm } }))}
                            />
                        ) : null}
                        <Slider
                            label={t('thickness')}
                            value={design.plate.thicknessMm}
                            display={`${design.plate.thicknessMm.toFixed(1)}mm`}
                            min={NAME_TAG_LIMITS.thicknessMm[0]}
                            max={NAME_TAG_LIMITS.thicknessMm[1]}
                            step={0.2}
                            onChange={(thicknessMm) => update((d) => ({ ...d, plate: { ...d.plate, thicknessMm } }))}
                        />
                    </Section>

                    <Section title={t('holeLabel')}>
                        <div className="grid grid-cols-3 gap-2">
                            {HOLE_POSITIONS.map((position) => (
                                <Choice
                                    key={position}
                                    active={design.hole.position === position}
                                    onClick={() => update((d) => ({ ...d, hole: { ...d.hole, position } }))}
                                >
                                    {t(`holes.${position}`)}
                                </Choice>
                            ))}
                        </div>
                        {design.hole.position !== 'none' ? (
                            <Slider
                                label={t('holeSize')}
                                value={design.hole.diameterMm}
                                display={`Ø${design.hole.diameterMm.toFixed(1)}mm`}
                                min={NAME_TAG_LIMITS.holeMm[0]}
                                max={NAME_TAG_LIMITS.holeMm[1]}
                                step={0.5}
                                onChange={(diameterMm) => update((d) => ({ ...d, hole: { ...d.hole, diameterMm } }))}
                            />
                        ) : null}
                    </Section>

                    <Section title={t('reliefLabel')}>
                        <div className="grid grid-cols-3 gap-2">
                            {RELIEF_MODES.map((mode) => (
                                <Choice
                                    key={mode}
                                    active={design.relief.mode === mode}
                                    onClick={() => update((d) => ({ ...d, relief: { ...d.relief, mode } }))}
                                >
                                    {t(`relief.${mode}`)}
                                </Choice>
                            ))}
                            <Choice active={design.border} onClick={() => update((d) => ({ ...d, border: !d.border }))}>
                                {t('border')}
                            </Choice>
                        </div>
                        <Slider
                            label={design.relief.mode === 'emboss' ? t('embossHeight') : t('engraveDepth')}
                            value={design.relief.depthMm}
                            display={`${design.relief.depthMm.toFixed(1)}mm`}
                            min={NAME_TAG_LIMITS.depthMm[0]}
                            max={NAME_TAG_LIMITS.depthMm[1]}
                            step={0.1}
                            onChange={(depthMm) => update((d) => ({ ...d, relief: { ...d.relief, depthMm } }))}
                        />
                    </Section>

                    <Section title={t('colorLabel')}>
                        {(
                            [
                                ['plate', PLATE_COLORS],
                                ['text', TEXT_COLORS],
                            ] as const
                        ).map(([part, palette]) => (
                            <div key={part} className="flex items-center gap-2">
                                <span className="w-10 shrink-0 text-[11px] font-bold text-white/55">{t(`colors.${part}`)}</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {palette.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => update((d) => ({ ...d, colors: { ...d.colors, [part]: c } }))}
                                            aria-label={c}
                                            aria-pressed={design.colors[part] === c}
                                            className={cn(
                                                'h-6 w-6 rounded-full border',
                                                design.colors[part] === c ? 'border-teal-300 ring-2 ring-teal-400/60' : 'border-white/20'
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                        <p className="text-[11px] font-medium leading-relaxed text-white/45 break-keep">{t('colorNote')}</p>
                    </Section>

                    <div className="sticky bottom-0 -mx-5 mt-auto flex flex-col gap-2 border-t border-white/10 bg-[#0d0d0d] px-5 pb-1 pt-3 md:-mx-6 md:px-6">
                        <Button
                            type="button"
                            disabled={busy !== null || !hasText || blocking}
                            onClick={() => void requestQuote()}
                            className="h-11 rounded-xl bg-teal-400 font-black text-slate-950 hover:bg-teal-300"
                        >
                            {busy === 'quote' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                            {tm('requestQuote')}
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busy !== null || !hasText}
                                onClick={() => void downloadStl()}
                                className="h-10 flex-1 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                            >
                                {busy === 'stl' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                {tm('stlSave')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDesign(DEFAULT_NAME_TAG_DESIGN)}
                                className="h-10 rounded-xl border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                            >
                                {t('reset')}
                            </Button>
                        </div>
                        <button
                            type="button"
                            onClick={onOpenDraw}
                            className="py-1 text-center text-[12px] font-bold text-white/45 underline-offset-2 hover:text-white/80 hover:underline"
                        >
                            {t('openDraw')}
                        </button>
                    </div>
                </section>
            </div>
        </>
    )
}
