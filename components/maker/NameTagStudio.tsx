'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
    AlertTriangle,
    AlignCenter,
    AlignLeft,
    AlignRight,
    Box,
    ChevronDown,
    Download,
    Info,
    Loader2,
    Plus,
    ShoppingCart,
    X,
    Sparkles,
    Check,
    RotateCcw,
    Monitor,
    Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NameTagBasePicker } from '@/components/maker/NameTagBasePicker'
import { Maker3DErrorBoundary } from '@/components/maker/Maker3DErrorBoundary'
import { useFileStore } from '@/store/useFileStore'
import { NAME_TAG_FONT_GROUPS, NAME_TAG_FONTS, isCustomFontId, textHasHangul, type NameTagFontId } from '@/lib/name-tag-fonts'
import {
    useCustomFonts,
    registerCustomFontFromFile,
    removeCustomFont,
    getCustomFont,
    type CustomFontItem,
} from '@/lib/name-tag/custom-fonts'
import { SystemFontPickerModal } from '@/components/maker/SystemFontPickerModal'
import { ViewCube } from '@/components/maker/ViewCube'
import { getNameTagTemplate, templatePlateSize } from '@/lib/name-tag/templates'
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
import { useNameTagHandoff } from '@/lib/name-tag/handoff'
import { useNameTagBuilder } from '@/lib/name-tag/use-name-tag-builder'
import { showToast } from '@/lib/toast-helper'
import { cn } from '@/lib/utils'

// 인포그래픽 고도화 컴포넌트 임포트
import { ShapeInfographicIcon } from '@/components/maker/infographics/ShapeInfographicIcon'
import { HoleInfographicIcon } from '@/components/maker/infographics/HoleInfographicIcon'
import { ReliefInfographicIcon } from '@/components/maker/infographics/ReliefInfographicIcon'
import { PresetInfographicCard } from '@/components/maker/infographics/PresetInfographicCard'
import { SpecSummaryInfographic } from '@/components/maker/infographics/SpecSummaryInfographic'
import { MakerStepBar, type MakerStepId } from '@/components/maker/infographics/MakerStepBar'
import type { PreviewViewId, PreviewViewRequest } from '@/components/maker/NameTagPreview'

const NameTagPreview = dynamic(() => import('@/components/maker/NameTagPreview').then((m) => m.NameTagPreview), {
    ssr: false,
})

const DRAFT_KEY = 'wow3d:name-tag:v1'

function fontFaceCss(ids: ReadonlySet<NameTagFontId>): string {
    return NAME_TAG_FONTS.filter((font) => ids.has(font.id))
        .map((font) => `@font-face{font-family:'${font.cssFamily}';src:url('${font.file}') format('truetype');font-display:swap;}`)
        .join('')
}

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

function Section({
    title,
    children,
    aside,
    stepBadge,
}: {
    title: string
    children: React.ReactNode
    aside?: React.ReactNode
    stepBadge?: string
}) {
    return (
        <div className="space-y-2.5 rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 transition-all hover:border-white/15">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {stepBadge && (
                        <span className="flex h-4 items-center rounded-full bg-teal-400/20 px-1.5 text-[9px] font-black text-teal-300">
                            {stepBadge}
                        </span>
                    )}
                    <p className="text-[11px] font-black uppercase tracking-wider text-white/60">{title}</p>
                </div>
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
    onPreview,
    disabled = false,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
    className?: string
    label?: string
    onPreview?: () => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            onPointerEnter={disabled ? undefined : onPreview}
            onFocus={disabled ? undefined : onPreview}
            aria-pressed={active}
            aria-disabled={disabled}
            aria-label={label}
            className={cn(
                'group relative flex flex-col items-center justify-center rounded-xl border p-2 text-center text-[12px] font-bold text-white transition-all',
                disabled
                    ? 'cursor-not-allowed border-white/5 bg-black/20 text-white/30'
                    : active
                      ? 'border-teal-400/80 bg-teal-400/15 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.2)] ring-1 ring-teal-400/60'
                      : 'border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/[0.04]',
                className
            )}
        >
            {children}
            {active && (
                <div className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-400 text-slate-950">
                    <Check className="h-2 w-2 stroke-[3]" />
                </div>
            )}
        </button>
    )
}

function NumberField({
    value,
    min,
    max,
    step,
    unit,
    label,
    onCommit,
}: {
    value: number
    min: number
    max: number
    step: number
    unit: string
    label: string
    onCommit: (v: number) => void
}) {
    const decimals = step < 1 ? Math.max(0, Math.ceil(-Math.log10(step))) : 0
    const format = useCallback((v: number) => v.toFixed(decimals), [decimals])
    const [draft, setDraft] = useState(() => format(value))
    const [editing, setEditing] = useState(false)

    // 슬라이더·프리셋으로 값이 바뀌면 입력 중이 아닐 때만 따라간다
    useEffect(() => {
        if (!editing) setDraft(format(value))
    }, [value, editing, format])

    const commit = () => {
        setEditing(false)
        const parsed = Number(draft.replace(',', '.'))
        if (!Number.isFinite(parsed) || draft.trim() === '') {
            setDraft(format(value))
            return
        }
        const clamped = Math.min(max, Math.max(min, Math.round(parsed / step) * step))
        const next = Number(clamped.toFixed(decimals))
        setDraft(format(next))
        if (next !== value) onCommit(next)
    }

    return (
        <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-1.5 focus-within:border-teal-400/70">
            <input
                type="text"
                inputMode="decimal"
                value={draft}
                aria-label={`${label} (${unit})`}
                title={`${format(min)}–${format(max)} ${unit}`}
                onFocus={(e) => {
                    setEditing(true)
                    e.currentTarget.select()
                }}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') {
                        setDraft(format(value))
                        setEditing(false)
                        e.currentTarget.blur()
                    }
                }}
                className="h-7 w-14 bg-transparent text-right font-mono text-[12px] font-black text-teal-300 outline-none"
            />
            <span className="text-[10px] font-bold text-white/40">{unit}</span>
        </span>
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
    unit,
    inputStep,
}: {
    label: string
    value: number
    display: string
    min: number
    max: number
    step: number
    onChange: (v: number) => void
    /** 지정하면 값을 직접 입력할 수 있는 칸을 보여 준다 */
    unit?: string
    /** 직접 입력 단위(기본은 슬라이더 step) */
    inputStep?: number
}) {
    return (
        <div className="space-y-1.5 rounded-xl border border-white/6 bg-black/20 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-white/65">
                <span>{label}</span>
                {unit ? (
                    <NumberField
                        value={value}
                        min={min}
                        max={max}
                        step={inputStep ?? step}
                        unit={unit}
                        label={label}
                        onCommit={onChange}
                    />
                ) : (
                    <span className="font-mono font-black text-teal-300">{display}</span>
                )}
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                aria-label={label}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
            />
            {unit ? (
                <div className="flex justify-between text-[10px] font-medium text-white/30">
                    <span>
                        {min}
                        {unit}
                    </span>
                    <span>
                        {max}
                        {unit}
                    </span>
                </div>
            ) : null}
        </div>
    )
}

function FontChoices({
    activeId,
    groupLabel,
    fontLabel,
    activeFontIds,
    onPreview,
    onPick,
    onOpenSystemModal,
    blockLatin = false,
}: {
    activeId: NameTagFontId | null
    groupLabel: (group: 'ko' | 'en') => string
    fontLabel: (fontId: NameTagFontId) => string
    activeFontIds: ReadonlySet<NameTagFontId>
    onPreview: (fontId: NameTagFontId) => void
    onPick: (fontId: NameTagFontId) => void
    onOpenSystemModal: () => void
    /** 한글이 있으면 영문 전용 폰트는 고르지 않는다 */
    blockLatin?: boolean
}) {
    const t = useTranslations('Maker.nameTag')
    const [tab, setTab] = useState<'preset' | 'local'>('preset')
    const customFonts = useCustomFonts()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const registered = await registerCustomFontFromFile(file)
            showToast.success('글꼴 등록 완료', `"${registered.name}" 글꼴을 불러왔습니다.`)
            onPick(registered.id)
        } catch (err) {
            console.error('[FontChoices] 폰트 업로드 실패:', err)
            showToast.error(
                '글꼴 등록 실패',
                err instanceof Error ? err.message : '유효한 TTF/OTF 폰트 파일이 아닙니다.'
            )
        } finally {
            setUploading(false)
            if (e.target) e.target.value = ''
        }
    }

    return (
        <div className="max-h-72 space-y-2.5 overflow-y-auto rounded-xl border border-white/10 bg-black/75 p-2.5 custom-scrollbar shadow-xl backdrop-blur-md">
            {/* 탭 헤더 */}
            <div className="flex items-center gap-1 p-0.5 bg-white/[0.04] rounded-lg border border-white/8">
                <button
                    type="button"
                    onClick={() => setTab('preset')}
                    className={cn(
                        'flex-1 py-1 text-[11px] font-bold rounded-md transition-all',
                        tab === 'preset'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'text-white/60 hover:text-white'
                    )}
                >
                    {t('fontTabPreset')}
                </button>
                <button
                    type="button"
                    onClick={() => setTab('local')}
                    className={cn(
                        'flex-1 py-1 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1.5',
                        tab === 'local'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'text-white/60 hover:text-white'
                    )}
                >
                    <span>{t('fontTabLocal')}</span>
                    {customFonts.length > 0 && (
                        <span className="h-3.5 px-1 rounded-full bg-teal-400 text-black text-[9px] font-black leading-none flex items-center justify-center">
                            {customFonts.length}
                        </span>
                    )}
                </button>
            </div>

            {/* 추천 폰트 탭 */}
            {tab === 'preset' ? (
                <div className="space-y-3">
                    {NAME_TAG_FONT_GROUPS.map((group) => (
                        <div key={group} className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                                {groupLabel(group)}
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {NAME_TAG_FONTS.filter((font) => font.group === group).map((font) => (
                                    <Choice
                                        key={font.id}
                                        active={font.id === activeId}
                                        disabled={blockLatin && group === 'en'}
                                        onClick={() => {
                                            if (blockLatin && group === 'en') {
                                                showToast.error(t('fontLatinBlockedTitle'), t('fontLatinBlocked'))
                                                return
                                            }
                                            onPick(font.id)
                                        }}
                                        onPreview={() => onPreview(font.id)}
                                        className="h-10 text-left px-2.5 py-1"
                                    >
                                        <span
                                            className="block w-full truncate text-[14px] font-normal"
                                            style={
                                                activeFontIds.has(font.id)
                                                    ? { fontFamily: `'${font.cssFamily}', sans-serif` }
                                                    : undefined
                                            }
                                        >
                                            {fontLabel(font.id)}
                                        </span>
                                    </Choice>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* 내 PC 글꼴 탭 */
                <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            type="button"
                            onClick={onOpenSystemModal}
                            className="flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] font-bold transition-colors"
                        >
                            <Monitor className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{t('loadSystemFonts')}</span>
                        </button>
                        <button
                            type="button"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-colors"
                        >
                            {uploading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                            ) : (
                                <Upload className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="truncate">{t('uploadFontFile')}</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".ttf,.otf"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>

                    {customFonts.length === 0 ? (
                        <div className="py-6 px-3 text-center rounded-lg border border-dashed border-white/10 bg-black/30 text-white/40 text-[11px] leading-relaxed">
                            {t('customFontsEmpty')}
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
                            {customFonts.map((cf) => {
                                const isSelected = activeId === cf.id
                                return (
                                    <div
                                        key={cf.id}
                                        className={cn(
                                            'group flex items-center justify-between p-1.5 rounded-lg border transition-colors',
                                            isSelected
                                                ? 'bg-teal-500/20 border-teal-500/50 text-teal-200'
                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] text-white'
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onPick(cf.id)}
                                            className="flex-1 min-w-0 text-left pr-2"
                                        >
                                            <span
                                                className="block truncate text-[13px] font-medium"
                                                style={{ fontFamily: `'${cf.cssFamily}', sans-serif` }}
                                            >
                                                {cf.name}
                                            </span>
                                            <span className="block text-[10px] text-white/40">
                                                {cf.source === 'local' ? 'PC 설치 글꼴' : '파일 등록'}
                                            </span>
                                        </button>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {isSelected && <Check className="h-3.5 w-3.5 text-teal-300" />}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeCustomFont(cf.id)
                                                }}
                                                className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/15 transition-colors"
                                                title={t('removeCustomFont')}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/80 leading-normal">
                        {t('customFontNotice')}
                    </div>
                </div>
            )}
        </div>
    )
}

export function NameTagStudio({ onOpenDraw }: Props) {
    const t = useTranslations('Maker.nameTag')
    const tm = useTranslations('Maker')
    const router = useRouter()
    const setFile = useFileStore((s) => s.setFile)

    const [design, setDesign] = useState<NameTagDesign>(DEFAULT_NAME_TAG_DESIGN)
    const [loaded, setLoaded] = useState(false)
    const [seenFonts, setSeenFonts] = useState<NameTagFontId[]>([DEFAULT_NAME_TAG_DESIGN.lines[0].fontId])
    const [openFontMenu, setOpenFontMenu] = useState<number | 'all' | null>(null)
    const [showThin, setShowThin] = useState(true)
    const [busy, setBusy] = useState<'quote' | 'stl' | null>(null)
    const [activeStep, setActiveStep] = useState<MakerStepId>('all')
    const [activePreset, setActivePreset] = useState<NameTagPresetId | null>('bag')
    const [viewRequest, setViewRequest] = useState<PreviewViewRequest | null>(null)
    const requestView = (id: PreviewViewId, direction?: [number, number, number]) =>
        setViewRequest((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1, direction }))
    const [systemModalOpen, setSystemModalOpen] = useState(false)

    const getFontFamily = useCallback((fontId: NameTagFontId) => {
        if (isCustomFontId(fontId)) {
            const cf = getCustomFont(fontId)
            return cf ? `'${cf.cssFamily}', sans-serif` : 'sans-serif'
        }
        const preset = NAME_TAG_FONTS.find((f) => f.id === fontId)
        return preset ? `'${preset.cssFamily}', sans-serif` : 'sans-serif'
    }, [])

    const getFontLabel = useCallback(
        (fontId: NameTagFontId) => {
            if (isCustomFontId(fontId)) {
                return getCustomFont(fontId)?.name ?? '내 글꼴'
            }
            return t(`fonts.${fontId}` as Parameters<typeof t>[0])
        },
        [t]
    )

    const handleSelectSystemFont = (font: CustomFontItem) => {
        noteFont(font.id)
        if (typeof openFontMenu === 'number') {
            setLine(openFontMenu, { fontId: font.id })
        } else if (openFontMenu === 'all') {
            update((d) => ({
                ...d,
                lines: d.lines.map((l) => ({ ...l, fontId: font.id })),
            }))
        }
        setOpenFontMenu(null)
    }

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

    const [placingHole, setPlacingHole] = useState(false)
    const holeBeforePlace = useRef<NameTagDesign['hole'] | null>(null)
    const placeHole = useCallback((xMm: number, yMm: number) => {
        update((d) => ({ ...d, hole: { ...d.hole, position: 'custom', xMm, yMm } }))
    }, [update])
    const togglePlaceHole = () => {
        if (placingHole) {
            setPlacingHole(false)
            if (design.hole.xMm == null || design.hole.yMm == null) {
                const previous = holeBeforePlace.current
                update((d) => ({
                    ...d,
                    hole: previous
                        ? { ...previous, diameterMm: d.hole.diameterMm }
                        : { ...d.hole, position: 'left', xMm: null, yMm: null },
                }))
            }
            return
        }
        holeBeforePlace.current = design.hole
        setPlacingHole(true)
        update((d) => ({
            ...d,
            hole: {
                ...d.hole,
                position: 'custom',
                xMm: d.hole.position === 'custom' ? d.hole.xMm : null,
                yMm: d.hole.position === 'custom' ? d.hole.yMm : null,
            },
        }))
    }

    const noteFont = useCallback((fontId: NameTagFontId) => {
        setSeenFonts((current) => (current.includes(fontId) ? current : [...current, fontId]))
    }, [])

    const activeFontIds = useMemo(() => {
        const ids = new Set<NameTagFontId>(seenFonts)
        for (const line of design.lines) ids.add(line.fontId)
        return ids
    }, [design.lines, seenFonts])

    const setLine = (index: number, patch: Partial<NameTagDesign['lines'][number]>) =>
        update((d) => ({ ...d, lines: d.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)) }))

    const setAllFonts = (fontId: NameTagFontId) =>
        update((d) => ({ ...d, lines: d.lines.map((line) => ({ ...line, fontId })) }))

    const issues = result?.issues ?? []
    const blocking = issues.some((issue) => issue.level === 'error')
    const hasText = nameTagHasText(design)
    const isCircle = design.baseId == null && design.plate.shape === 'circle'

    const maxTextW = useMemo(() => {
        const baseW = design.plate.widthMm
        const baseH = isCircle ? baseW : design.plate.heightMm
        const baseMargin = Math.max(1.5, Math.min(baseW, baseH) * 0.08) + (design.border ? 1.8 : 0)
        const holeDed = design.hole.position === 'left' ? design.hole.diameterMm + 2 : 0
        return Math.max(10, Math.round(baseW - baseMargin * 2 - holeDed))
    }, [design.plate.widthMm, design.plate.heightMm, isCircle, design.border, design.hole.position, design.hole.diameterMm])

    const maxTextH = useMemo(() => {
        const baseW = design.plate.widthMm
        const baseH = isCircle ? baseW : design.plate.heightMm
        const baseMargin = Math.max(1.5, Math.min(baseW, baseH) * 0.08) + (design.border ? 1.8 : 0)
        const holeDed = design.hole.position === 'top' ? design.hole.diameterMm + 2 : 0
        return Math.max(5, Math.round(baseH - baseMargin * 2 - holeDed))
    }, [design.plate.widthMm, design.plate.heightMm, isCircle, design.border, design.hole.position, design.hole.diameterMm])

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
            useNameTagHandoff.getState().setDesign(design)
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
        if (blocking) {
            showToast.error(t('quoteBlockedTitle'), t('quoteBlocked'))
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
    const pickingHole = hasText && placingHole

    return (
        <>
            <style>{fontFaceCss(activeFontIds)}</style>
            <div className="flex w-full max-w-6xl flex-col overflow-hidden border border-white/10 bg-[#0a0a0e]/95 shadow-2xl md:h-[880px] md:flex-row md:rounded-[2rem] backdrop-blur-xl">
                {/* 오른쪽/상단 3D 뷰포트 */}
                <section className="relative order-1 h-[46vh] min-h-[300px] w-full shrink-0 bg-gradient-to-b from-[#08080c] via-[#0d0d14] to-[#12121c] md:order-2 md:h-auto md:flex-1">
                    {/* 상단 3D 상태 라벨 */}
                    <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl bg-black/60 px-3 py-1.5 text-[12px] font-bold text-white/80 border border-white/10 backdrop-blur-md">
                        {building ? <Loader2 className="h-4 w-4 animate-spin text-teal-400" /> : <Box className="h-4 w-4 text-teal-400" />}
                        {building ? t('building') : hasText ? t(pickingHole ? 'previewHintPick' : 'previewHint') : t('previewEmpty')}
                    </div>

                    {/* 우측 상단 실시간 치수 뱃지 */}
                    {result ? (
                        <div className="pointer-events-none absolute left-4 top-14 z-10 rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-left text-[11px] font-bold leading-relaxed text-white/80 backdrop-blur-md">
                            <div className="font-mono text-teal-300">
                                {w.toFixed(1)} × {h.toFixed(1)} × {z.toFixed(1)} mm
                            </div>
                            <div className="text-white/50">
                                {t('volume', { cm3: (result.stats.volumeMm3 / 1000).toFixed(2) })} · {Math.round(buildMs)}ms
                            </div>
                        </div>
                    ) : null}

                    {/* 3D 캔버스 */}
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
                            onPlaceHole={pickingHole ? placeHole : undefined}
                            plateTopZ={design.plate.thicknessMm}
                            view={viewRequest}
                        />
                    </Maker3DErrorBoundary>

                    {/* 3D 뷰 큐브 (ViewCube) */}
                    <ViewCube onSelectView={requestView} />

                    {/* 3D 뷰포트 하단 알림 바 */}
                    {hasText && (issues.length > 0 || error) ? (
                        <div className="absolute inset-x-3 bottom-3 z-10 space-y-1.5 md:inset-x-4 md:bottom-4">
                            {error ? (
                                <p className="rounded-xl border border-red-500/30 bg-red-500/20 px-3.5 py-2.5 text-[12px] font-bold text-red-200 backdrop-blur-md">
                                    {t('engineError')}
                                </p>
                            ) : null}
                            {issues.map((issue, i) => (
                                <div
                                    key={`${issue.code}-${i}`}
                                    className={cn(
                                        'flex items-start gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-bold leading-snug backdrop-blur-md shadow-lg',
                                        issue.level === 'error' && 'border-red-500/30 bg-red-500/20 text-red-100',
                                        issue.level === 'warn' && 'border-amber-400/30 bg-amber-400/20 text-amber-100',
                                        issue.level === 'info' && 'border-white/10 bg-white/10 text-white/85'
                                    )}
                                >
                                    {issue.level === 'info' ? (
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    ) : (
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <span className="flex-1 break-keep">{issueText(issue)}</span>
                                    {issue.code === 'thin-stroke' ? (
                                        <span className="flex shrink-0 gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setAllFonts('black-han')}
                                                className="rounded-lg bg-teal-400 px-2 py-0.5 text-[11px] font-black text-slate-950 shadow hover:bg-teal-300"
                                            >
                                                {t('fixBoldFont')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowThin((v) => !v)}
                                                className="rounded-lg border border-white/20 bg-white/15 px-2 py-0.5 text-[11px] hover:bg-white/25"
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
                                            className="shrink-0 rounded-lg bg-teal-400 px-2 py-0.5 text-[11px] font-black text-slate-950 shadow hover:bg-teal-300"
                                        >
                                            {t('fixBiggerPlate')}
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </section>

                {/* 왼쪽 고도화된 인포그래픽 메뉴 패널 */}
                <section className="order-2 flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-white/10 p-4 md:order-1 md:w-[410px] md:border-r md:p-5 custom-scrollbar [&>*]:shrink-0">
                    {/* 상단 타이틀 & 키커 */}
                    <div className="relative space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-teal-300">
                                <Sparkles className="h-3 w-3" />
                                {t('kicker')}
                            </span>
                            <span className="text-[10px] font-bold text-white/40">3D Maker Studio</span>
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-white">{t('title')}</h1>
                        <p className="text-[12px] font-medium leading-relaxed text-white/60 break-keep">{t('lead')}</p>
                    </div>

                    {/* 4단계 스마트 스텝 네비게이션 인포그래픽 바 */}
                    <MakerStepBar activeStep={activeStep} onSelectStep={setActiveStep} />

                    {/* 추천 용도 프리셋 인포그래픽 카드 그리드 (항상 또는 전체/형태 스텝 시 표시) */}
                    {(activeStep === 'all' || activeStep === 'shape') && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black uppercase tracking-wider text-white/50">{t('presetLabel')}</p>
                                <span className="text-[10px] font-bold text-teal-400/70">클릭 시 자동 세팅</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(Object.keys(NAME_TAG_PRESETS) as NameTagPresetId[]).map((id) => (
                                    <PresetInfographicCard
                                        key={id}
                                        presetId={id}
                                        label={t(`presets.${id}`)}
                                        active={activePreset === id}
                                        onClick={() => {
                                            setActivePreset(id)
                                            setDesign((d) => applyNameTagPreset(d, id))
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 베이스 선택. 문구를 넣기 전에 판 모양을 고른다 */}
                    {(activeStep === 'all' || activeStep === 'shape') && (
                        <NameTagBasePicker
                            baseId={design.baseId}
                            onSelect={(baseId) => {
                                setPlacingHole(false)
                                update((d) => {
                                    const centered = {
                                        align: 'center' as const,
                                        textArea: { widthMm: null, heightMm: null },
                                    }
                                    if (!baseId) return { ...d, ...centered, baseId: null }
                                    const template = getNameTagTemplate(baseId)
                                    if (!template) return d
                                    return {
                                        ...d,
                                        ...centered,
                                        baseId,
                                        plate: { ...d.plate, ...templatePlateSize(template, d.plate.widthMm) },
                                        hole: { ...d.hole, position: 'none' },
                                    }
                                })
                            }}
                        />
                    )}

                    {/* [Step 1] 문구 & 폰트 스타일 섹션 */}
                    {(activeStep === 'all' || activeStep === 'text') && (
                        <>
                            <Section
                                stepBadge="STEP 1"
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
                                            className="flex items-center gap-1 rounded-lg bg-teal-400/10 px-2 py-0.5 text-[11px] font-bold text-teal-300 hover:bg-teal-400/20 hover:text-teal-200 transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            {t('addLine')}
                                        </button>
                                    ) : null
                                }
                            >
                                <div className="space-y-2.5">
                                    {design.lines.map((line, index) => (
                                        <div key={index} className="space-y-2 rounded-xl border border-white/8 bg-black/40 p-2.5">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={line.text}
                                                    maxLength={MAX_LINE_CHARS}
                                                    onChange={(e) => setLine(index, { text: e.target.value })}
                                                    placeholder={t(`linePlaceholder${Math.min(index, 2)}`)}
                                                    aria-label={t('lineAria', { n: index + 1 })}
                                                    style={{ fontFamily: getFontFamily(line.fontId) }}
                                                    className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[15px] font-medium text-white outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-white/30 focus:border-teal-400/80 focus:bg-white/[0.07] transition-all"
                                                />
                                                {design.lines.length > 1 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => update((d) => ({ ...d, lines: d.lines.filter((_, i) => i !== index) }))}
                                                        aria-label={t('removeLine')}
                                                        className="rounded-lg p-2 text-white/40 hover:bg-red-500/15 hover:text-red-300 transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                ) : null}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    aria-expanded={openFontMenu === index}
                                                    aria-label={t('fontLabel')}
                                                    onClick={() => setOpenFontMenu((current) => (current === index ? null : index))}
                                                    className="flex h-8 w-28 shrink-0 items-center justify-between gap-1 rounded-lg border border-white/10 bg-black/60 px-2 text-left text-[12px] font-bold text-white hover:border-teal-400/40"
                                                >
                                                    <span
                                                        className="truncate"
                                                        style={{ fontFamily: getFontFamily(line.fontId) }}
                                                    >
                                                        {getFontLabel(line.fontId)}
                                                    </span>
                                                    <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-white/50', openFontMenu === index && 'rotate-180 text-teal-300')} />
                                                </button>
                                                <input
                                                    type="range"
                                                    min={NAME_TAG_LIMITS.lineSize[0]}
                                                    max={NAME_TAG_LIMITS.lineSize[1]}
                                                    step={0.05}
                                                    value={line.size}
                                                    onChange={(e) => setLine(index, { size: Number(e.target.value) })}
                                                    aria-label={t('lineSize')}
                                                    className="min-w-0 flex-1 accent-teal-400 cursor-pointer"
                                                />
                                                <span className="w-14 text-right font-mono text-[11px] font-bold text-teal-300/80">
                                                    {result?.lines.find((l) => l.index === index)?.heightMm.toFixed(1) ?? '-'}mm
                                                </span>
                                            </div>
                                            {openFontMenu === index ? (
                                                <FontChoices
                                                    activeId={line.fontId}
                                                    groupLabel={(group) => t(group === 'ko' ? 'fontGroupKo' : 'fontGroupEn')}
                                                    fontLabel={getFontLabel}
                                                    activeFontIds={activeFontIds}
                                                    onPreview={noteFont}
                                                    onOpenSystemModal={() => setSystemModalOpen(true)}
                                                    onPick={(fontId) => {
                                                        noteFont(fontId)
                                                        setLine(index, { fontId })
                                                        setOpenFontMenu(null)
                                                    }}
                                                    blockLatin={textHasHangul(line.text)}
                                                />
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            {/* 일괄 폰트 적용 & 정렬/자간 */}
                            <Section title={t('fontAllLabel')}>
                                {(() => {
                                    const shared = design.lines.every((line) => line.fontId === design.lines[0]?.fontId)
                                        ? design.lines[0]?.fontId
                                        : null
                                    return (
                                        <button
                                            type="button"
                                            aria-expanded={openFontMenu === 'all'}
                                            onClick={() => setOpenFontMenu((current) => (current === 'all' ? null : 'all'))}
                                            className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-3 text-left hover:border-white/25 transition-colors"
                                        >
                                            <span
                                                className="truncate text-[14px] text-white font-medium"
                                                style={shared ? { fontFamily: getFontFamily(shared) } : undefined}
                                            >
                                                {shared ? getFontLabel(shared) : t('fontMixed')}
                                            </span>
                                            <ChevronDown className={cn('h-4 w-4 shrink-0 text-white/50', openFontMenu === 'all' && 'rotate-180 text-teal-300')} />
                                        </button>
                                    )
                                })()}
                                {openFontMenu === 'all' ? (
                                    <FontChoices
                                        activeId={
                                            design.lines.every((line) => line.fontId === design.lines[0]?.fontId)
                                                ? design.lines[0]?.fontId ?? null
                                                : null
                                        }
                                        groupLabel={(group) => t(group === 'ko' ? 'fontGroupKo' : 'fontGroupEn')}
                                        fontLabel={getFontLabel}
                                        activeFontIds={activeFontIds}
                                        onPreview={noteFont}
                                        onOpenSystemModal={() => setSystemModalOpen(true)}
                                        onPick={(fontId) => {
                                            noteFont(fontId)
                                            setAllFonts(fontId)
                                            setOpenFontMenu(null)
                                        }}
                                        blockLatin={design.lines.some((line) => textHasHangul(line.text))}
                                    />
                                ) : null}
                            </Section>

                            <Section title={t('alignLabel')}>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['left', 'center', 'right'] as const).map((align) => {
                                        const Icon = ALIGN_ICONS[align]
                                        const isActive = design.align === align
                                        return (
                                            <Choice
                                                key={align}
                                                label={t(`align.${align}`)}
                                                active={isActive}
                                                onClick={() => update((d) => ({ ...d, align }))}
                                                className="h-10"
                                            >
                                                <Icon className="h-4 w-4" />
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

                            {/* 글자 영역 사이즈 독립 조절 섹션 (베이스 크기는 유지) */}
                            <Section
                                title={t('textAreaLabel')}
                                aside={
                                    (design.textArea.widthMm != null || design.textArea.heightMm != null) ? (
                                        <button
                                            type="button"
                                            onClick={() => update((d) => ({ ...d, textArea: { widthMm: null, heightMm: null } }))}
                                            className="text-[11px] font-bold text-teal-400 hover:text-teal-300"
                                        >
                                            {t('textAreaAuto')}
                                        </button>
                                    ) : null
                                }
                            >
                                <p className="text-[11px] font-medium leading-relaxed text-white/50 break-keep">
                                    {t('textAreaHint')}
                                </p>
                                <div className="space-y-2 pt-1">
                                    <Slider
                                        label={t('textAreaWidth')}
                                        value={design.textArea.widthMm ?? Math.round(maxTextW)}
                                        display={`${(design.textArea.widthMm ?? Math.round(maxTextW)).toFixed(0)}mm`}
                                        min={10}
                                        max={Math.max(10, Math.round(maxTextW))}
                                        step={1}
                                        unit="mm"
                                        onChange={(widthMm) => update((d) => ({ ...d, textArea: { ...d.textArea, widthMm } }))}
                                    />
                                    <Slider
                                        label={t('textAreaHeight')}
                                        value={design.textArea.heightMm ?? Math.round(maxTextH)}
                                        display={`${(design.textArea.heightMm ?? Math.round(maxTextH)).toFixed(0)}mm`}
                                        min={5}
                                        max={Math.max(5, Math.round(maxTextH))}
                                        step={1}
                                        unit="mm"
                                        onChange={(heightMm) => update((d) => ({ ...d, textArea: { ...d.textArea, heightMm } }))}
                                    />
                                </div>
                            </Section>
                        </>
                    )}

                    {/* [Step 2] 형태 & 사이즈 섹션 */}
                    {(activeStep === 'all' || activeStep === 'shape') && (
                        <>
                            {/* 인포그래픽 기반 플레이트 형태 셀렉터 */}
                            <Section stepBadge="STEP 2" title={t('plateLabel')}>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {PLATE_SHAPES.map((shape) => {
                                        const isActive = design.baseId == null && design.plate.shape === shape
                                        return (
                                            <button
                                                key={shape}
                                                type="button"
                                                onClick={() => update((d) => ({ ...d, baseId: null, plate: { ...d.plate, shape } }))}
                                                className={cn(
                                                    'group relative flex flex-col items-center justify-center rounded-xl border p-1.5 transition-all text-center',
                                                    isActive
                                                        ? 'border-teal-400 bg-teal-400/15 shadow-[0_0_12px_rgba(45,212,191,0.25)] ring-1 ring-teal-400'
                                                        : 'border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/[0.04]'
                                                )}
                                            >
                                                <ShapeInfographicIcon shape={shape} active={isActive} />
                                                <span
                                                    className={cn(
                                                        'mt-1 text-[10px] font-bold truncate w-full',
                                                        isActive ? 'text-teal-300 font-black' : 'text-white/70 group-hover:text-white'
                                                    )}
                                                >
                                                    {t(`shapes.${shape}`)}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="space-y-2 pt-1">
                                    <Slider
                                        label={isCircle ? t('baseDiameter') : t('baseWidth')}
                                        value={design.plate.widthMm}
                                        display={`${design.plate.widthMm.toFixed(0)}mm`}
                                        min={NAME_TAG_LIMITS.widthMm[0]}
                                        max={NAME_TAG_LIMITS.widthMm[1]}
                                        step={1}
                                        unit="mm"
                                        onChange={(widthMm) =>
                                            update((d) => {
                                                const template = getNameTagTemplate(d.baseId)
                                                return {
                                                    ...d,
                                                    plate: {
                                                        ...d.plate,
                                                        ...(template ? templatePlateSize(template, widthMm) : { widthMm }),
                                                    },
                                                }
                                            })
                                        }
                                    />
                                    {!isCircle ? (
                                        <Slider
                                            label={t('baseHeight')}
                                            value={design.plate.heightMm}
                                            display={`${design.plate.heightMm.toFixed(0)}mm`}
                                            min={NAME_TAG_LIMITS.heightMm[0]}
                                            max={NAME_TAG_LIMITS.heightMm[1]}
                                            step={1}
                                            unit="mm"
                                            onChange={(heightMm) =>
                                                update((d) => {
                                                    const template = getNameTagTemplate(d.baseId)
                                                    if (!template) return { ...d, plate: { ...d.plate, heightMm } }
                                                    const aspect = template.view[1] / template.view[0]
                                                    return {
                                                        ...d,
                                                        plate: { ...d.plate, ...templatePlateSize(template, heightMm / aspect) },
                                                    }
                                                })
                                            }
                                        />
                                    ) : null}
                                    <Slider
                                        label={t('thickness')}
                                        value={design.plate.thicknessMm}
                                        display={`${design.plate.thicknessMm.toFixed(1)}mm`}
                                        min={NAME_TAG_LIMITS.thicknessMm[0]}
                                        max={NAME_TAG_LIMITS.thicknessMm[1]}
                                        step={0.1}
                                        unit="mm"
                                        inputStep={0.1}
                                        onChange={(thicknessMm) => update((d) => ({ ...d, plate: { ...d.plate, thicknessMm } }))}
                                    />
                                </div>
                            </Section>
                        </>
                    )}

                    {/* [Step 3] 키링 홀 & 입체감 섹션 */}
                    {(activeStep === 'all' || activeStep === 'relief') && (
                        <>
                            {/* 인포그래픽 기반 키링 고리 구멍 셀렉터 */}
                            <Section stepBadge="STEP 3" title={t('holeLabel')}>
                                <div className="grid grid-cols-3 gap-2">
                                    {HOLE_POSITIONS.map((position) => {
                                        const isActive = design.hole.position === position
                                        return (
                                            <button
                                                key={position}
                                                type="button"
                                                onClick={() => {
                                                    setPlacingHole(false)
                                                    update((d) => ({ ...d, hole: { ...d.hole, position, xMm: null, yMm: null } }))
                                                }}
                                                className={cn(
                                                    'group relative flex flex-col items-center justify-center rounded-xl border p-2 transition-all text-center',
                                                    isActive
                                                        ? 'border-teal-400 bg-teal-400/15 shadow-[0_0_12px_rgba(45,212,191,0.25)] ring-1 ring-teal-400'
                                                        : 'border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/[0.04]'
                                                )}
                                            >
                                                <HoleInfographicIcon position={position} active={isActive} />
                                                <span
                                                    className={cn(
                                                        'mt-1 text-[11px] font-bold',
                                                        isActive ? 'text-teal-300 font-black' : 'text-white/70 group-hover:text-white'
                                                    )}
                                                >
                                                    {t(`holes.${position}`)}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={placingHole}
                                    onClick={togglePlaceHole}
                                    className={cn(
                                        'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                                        placingHole
                                            ? 'border-teal-400 bg-teal-400/15 shadow-[0_0_12px_rgba(45,212,191,0.25)] ring-1 ring-teal-400'
                                            : 'border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/[0.04]'
                                    )}
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <HoleInfographicIcon position="custom" active={placingHole} />
                                        <span className={cn('text-[13px] font-bold', placingHole ? 'text-teal-300' : 'text-white/80')}>
                                            {t('holes.custom')}
                                        </span>
                                    </span>
                                    <span
                                        className={cn(
                                            'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                                            placingHole ? 'bg-teal-400' : 'bg-white/15'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                                                placingHole ? 'left-5' : 'left-0.5'
                                            )}
                                        />
                                    </span>
                                </button>
                                {placingHole ? (
                                    <p className="text-[11px] font-medium leading-relaxed text-white/45">
                                        {design.hole.xMm != null ? t('holePickDone') : t('holePick')}
                                    </p>
                                ) : null}
                                {!placingHole && design.hole.position === 'custom' && design.hole.xMm != null ? (
                                    <p className="text-[12px] font-bold text-teal-300">{t('holeCustom')}</p>
                                ) : null}
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

                            {/* 인포그래픽 기반 양각/음각 3D 단면 셀렉터 */}
                            <Section title={t('reliefLabel')}>
                                <div className="grid grid-cols-3 gap-2">
                                    {RELIEF_MODES.map((mode) => {
                                        const isActive = design.relief.mode === mode
                                        return (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => update((d) => ({ ...d, relief: { ...d.relief, mode } }))}
                                                className={cn(
                                                    'group relative flex flex-col items-center justify-center rounded-xl border p-2 transition-all text-center',
                                                    isActive
                                                        ? 'border-teal-400 bg-teal-400/15 shadow-[0_0_12px_rgba(45,212,191,0.25)] ring-1 ring-teal-400'
                                                        : 'border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/[0.04]'
                                                )}
                                            >
                                                <ReliefInfographicIcon mode={mode} active={isActive} />
                                                <span
                                                    className={cn(
                                                        'mt-1 text-[11px] font-bold',
                                                        isActive ? 'text-teal-300 font-black' : 'text-white/70 group-hover:text-white'
                                                    )}
                                                >
                                                    {t(`relief.${mode}`)}
                                                </span>
                                            </button>
                                        )
                                    })}

                                    {/* 입체 테두리(border) 토글 버튼 */}
                                    <button
                                        type="button"
                                        onClick={() => update((d) => ({ ...d, border: !d.border }))}
                                        className={cn(
                                            'group relative flex flex-col items-center justify-center rounded-xl border p-2 transition-all text-center',
                                            design.border
                                                ? 'border-teal-400 bg-teal-400/15 shadow-[0_0_12px_rgba(45,212,191,0.25)] ring-1 ring-teal-400'
                                                : 'border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/[0.04]'
                                        )}
                                    >
                                        <div className="flex h-6 w-9 items-center justify-center">
                                            <div
                                                className={cn(
                                                    'h-5 w-8 rounded border-2 transition-all',
                                                    design.border ? 'border-teal-300 bg-teal-400/20' : 'border-white/30'
                                                )}
                                            />
                                        </div>
                                        <span
                                            className={cn(
                                                'mt-1 text-[11px] font-bold',
                                                design.border ? 'text-teal-300 font-black' : 'text-white/70 group-hover:text-white'
                                            )}
                                        >
                                            {t('border')}
                                        </span>
                                    </button>
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
                        </>
                    )}

                    {/* [Step 4] 색상 & 실시간 사양 인포그래픽 */}
                    {(activeStep === 'all' || activeStep === 'finish') && (
                        <>
                            <Section stepBadge="STEP 4" title={t('colorLabel')}>
                                {(
                                    [
                                        ['plate', PLATE_COLORS],
                                        ['text', TEXT_COLORS],
                                    ] as const
                                ).map(([part, palette]) => (
                                    <div key={part} className="flex items-center gap-2.5">
                                        <span className="w-10 shrink-0 text-[11px] font-bold text-white/60">{t(`colors.${part}`)}</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {palette.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => update((d) => ({ ...d, colors: { ...d.colors, [part]: c } }))}
                                                    aria-label={c}
                                                    aria-pressed={design.colors[part] === c}
                                                    className={cn(
                                                        'h-6 w-6 rounded-full border transition-transform hover:scale-110',
                                                        design.colors[part] === c
                                                            ? 'border-teal-300 ring-2 ring-teal-400/80 scale-105'
                                                            : 'border-white/20'
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[11px] font-medium leading-relaxed text-white/40 break-keep">{t('colorNote')}</p>
                            </Section>

                            {/* 실시간 3D 제작 사양 & 출력 안정성 인포그래픽 요약 카드 */}
                            <SpecSummaryInfographic
                                result={result}
                                issues={issues}
                                hasText={hasText}
                                isCircle={isCircle}
                                onFixBoldFont={() => setAllFonts('black-han')}
                                onFixBiggerPlate={() =>
                                    update((d) => ({
                                        ...d,
                                        plate: { ...d.plate, widthMm: d.plate.widthMm * 1.2, heightMm: d.plate.heightMm * 1.2 },
                                    }))
                                }
                                onToggleShowThin={() => setShowThin((v) => !v)}
                                showThin={showThin}
                            />
                        </>
                    )}

                    {/* 하단 고정 액션 바 */}
                    <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-2 border-t border-white/10 bg-[#0a0a0e]/95 px-4 pb-1 pt-3.5 backdrop-blur-xl md:-mx-5 md:px-5">
                        <Button
                            type="button"
                            disabled={busy !== null || !hasText || blocking}
                            onClick={() => void requestQuote()}
                            className="h-11 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 font-black text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all hover:from-teal-300 hover:to-emerald-300 hover:shadow-[0_0_25px_rgba(45,212,191,0.5)] active:scale-[0.98]"
                        >
                            {busy === 'quote' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                            {tm('requestQuote')}
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busy !== null || !hasText || blocking}
                                onClick={() => void downloadStl()}
                                className="h-10 flex-1 rounded-xl border-white/15 bg-white/5 font-bold text-white hover:border-white/30 hover:bg-white/10"
                            >
                                {busy === 'stl' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4 text-teal-400" />}
                                {tm('stlSave')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setDesign(DEFAULT_NAME_TAG_DESIGN)
                                    setActivePreset('bag')
                                }}
                                className="h-10 rounded-xl border-white/15 bg-white/5 font-bold text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                            >
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                {t('reset')}
                            </Button>
                        </div>
                        <button
                            type="button"
                            onClick={onOpenDraw}
                            className="py-1 text-center text-[12px] font-bold text-white/45 underline-offset-2 hover:text-teal-300 hover:underline transition-colors"
                        >
                            {t('openDraw')}
                        </button>
                    </div>
                </section>
            </div>

            <SystemFontPickerModal
                open={systemModalOpen}
                onClose={() => setSystemModalOpen(false)}
                onSelectFont={handleSelectSystemFont}
            />
        </>
    )
}
