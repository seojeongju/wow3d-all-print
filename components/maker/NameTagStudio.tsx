'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Box, Download, Loader2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Preview3D } from '@/components/maker/Preview3D'
import { Maker3DErrorBoundary } from '@/components/maker/Maker3DErrorBoundary'
import { Exporter } from '@/components/maker/Exporter'
import { useMakerStore, makerSceneInputFromState } from '@/store/useMakerStore'
import { useFileStore } from '@/store/useFileStore'
import { buildMakerStlBlob, hasMakerExportContent } from '@/lib/maker-stl-export'
import {
    NAME_TAG_FONTS,
    NAME_TAG_PLATE_SIZES,
    plateForSize,
    type NameTagFontId,
    type NameTagPlateSizeId,
} from '@/lib/name-tag-fonts'
import { renderNameSvg } from '@/lib/name-tag-text'
import { showToast } from '@/lib/toast-helper'
import { cn } from '@/lib/utils'

const FONT_FACE_CSS = NAME_TAG_FONTS.map(
    (font) => `@font-face{font-family:'${font.cssFamily}';src:url('${font.file}') format('truetype');font-display:swap;}`
).join('')

type Props = {
    onOpenDraw: () => void
}

type LineSvg = {
    id: string
    name: string
    svgContent: string
    scale: number
    offsetXMm: number
    offsetYMm: number
}

export function NameTagStudio({ onOpenDraw }: Props) {
    const t = useTranslations('Maker')
    const router = useRouter()
    const setFile = useFileStore((s) => s.setFile)
    const applyNameTagDesign = useMakerStore((s) => s.applyNameTagDesign)
    const [name, setName] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [fontId, setFontId] = useState<NameTagFontId>('gowun-dodum')
    const [plateSize, setPlateSize] = useState<NameTagPlateSizeId>('m')
    const [letterSize, setLetterSize] = useState(100)
    const [isQuoting, setIsQuoting] = useState(false)
    const [tracing, setTracing] = useState(false)
    const [textError, setTextError] = useState('')

    useEffect(() => {
        const plate = plateForSize(plateSize, subtitle.trim().length > 0)
        const letter = Math.min(1.05, Math.max(0.62, letterSize / 100))
        const holeShift = plate.widthMm * 0.08
        let cancel = false
        const timer = window.setTimeout(() => {
            setTracing(true)
            void (async () => {
                try {
                    const [nameLine, subLine] = await Promise.all([
                        renderNameSvg(name, fontId),
                        renderNameSvg(subtitle, fontId),
                    ])
                    if (cancel) return
                    const missing = [...(nameLine?.missing ?? []), ...(subLine?.missing ?? [])]
                    setTextError(missing.length > 0 ? `${t('nameTagMissingGlyph')} ${[...new Set(missing)].join(' ')}` : '')
                    const twoLines = Boolean(nameLine && subLine)
                    const svgs: LineSvg[] = []
                    if (nameLine) {
                        svgs.push({
                            id: 'name-tag-text',
                            name: 'name',
                            svgContent: nameLine.svg,
                            scale: (twoLines ? 0.46 : 0.9) * letter,
                            offsetXMm: holeShift,
                            offsetYMm: twoLines ? plate.heightMm * 0.16 : 0,
                        })
                    }
                    if (subLine) {
                        svgs.push({
                            id: 'name-tag-sub',
                            name: 'text',
                            svgContent: subLine.svg,
                            scale: (nameLine ? 0.32 : 0.82) * letter,
                            offsetXMm: holeShift,
                            offsetYMm: nameLine ? -plate.heightMm * 0.2 : 0,
                        })
                    }
                    applyNameTagDesign({
                        widthMm: plate.widthMm,
                        heightMm: plate.heightMm,
                        cornerRadiusMm: plate.cornerRadiusMm,
                        ringHoleMm: plate.ringHoleMm,
                        circle: false,
                        baseColor: '#f4f4f5',
                        logoColor: '#0f172a',
                        svgs,
                    })
                } catch (error) {
                    if (!cancel) setTextError(error instanceof Error ? error.message : t('nameTagFontFail'))
                } finally {
                    if (!cancel) setTracing(false)
                }
            })()
        }, 280)
        return () => {
            cancel = true
            window.clearTimeout(timer)
        }
    }, [applyNameTagDesign, fontId, letterSize, name, plateSize, subtitle, t])

    const requestQuote = async () => {
        const input = makerSceneInputFromState(useMakerStore.getState())
        if (!hasMakerExportContent(input)) {
            showToast.error(t('toastQuoteUnavailableTitle'), t('toastQuoteNeedContent'))
            return
        }
        setIsQuoting(true)
        try {
            const blob = buildMakerStlBlob(input)
            if (!blob) {
                showToast.error(t('toastQuoteUnavailableTitle'), t('toastQuoteNoMesh'))
                return
            }
            const file = new File([blob], `wow3d-nametag-${Date.now()}.stl`, { type: 'model/stl' })
            setFile(file)
            showToast.success(t('toastQuoteOkTitle'), t('toastQuoteOkDesc'))
            router.push('/quote?entry=file&handoff=1')
        } catch (e) {
            console.error(e)
            showToast.error(t('toastQuoteFailTitle'), e instanceof Error ? e.message : t('toastQuoteFailRetry'))
        } finally {
            setIsQuoting(false)
        }
    }

    return (
        <>
            <style>{FONT_FACE_CSS}</style>
            <Exporter />
            <div className="flex w-full max-w-6xl min-h-[100dvh] flex-col overflow-hidden border border-white/10 bg-[#0d0d0d]/90 shadow-2xl md:h-[820px] md:flex-row md:rounded-[2rem]">
                <section className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-white/10 p-5 md:w-[360px] md:border-r md:p-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-400">{t('nameTagKicker')}</p>
                        <h1 className="mt-1 text-xl font-black text-white">{t('nameTagTitle')}</h1>
                        <p className="mt-2 text-[13px] font-medium leading-relaxed text-white/70 break-keep">{t('nameTagLead')}</p>
                    </div>

                    <label className="block space-y-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-white/45">{t('nameTagNameLabel')}</span>
                        <input
                            value={name}
                            maxLength={16}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('nameTagNamePlaceholder')}
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-teal-400/50"
                        />
                    </label>

                    <label className="block space-y-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-white/45">{t('nameTagTextLabel')}</span>
                        <input
                            value={subtitle}
                            maxLength={24}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder={t('nameTagTextPlaceholder')}
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-teal-400/50"
                        />
                        {textError ? <span className="block text-[11px] font-bold text-amber-300">{textError}</span> : null}
                    </label>

                    <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-wider text-white/45">{t('nameTagFontLabel')}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {NAME_TAG_FONTS.map((font) => (
                                <button
                                    key={font.id}
                                    type="button"
                                    onClick={() => setFontId(font.id)}
                                    className={cn(
                                        'rounded-xl border px-3 py-2.5 text-left',
                                        fontId === font.id
                                            ? 'border-teal-400/60 bg-teal-400/10'
                                            : 'border-white/10 bg-black/20 hover:border-white/25'
                                    )}
                                >
                                    <span
                                        className="block truncate text-[15px] text-white"
                                        style={{ fontFamily: `'${font.cssFamily}', sans-serif` }}
                                    >
                                        {t(`nameTagFonts.${font.id}`)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-wider text-white/45">{t('nameTagSizeLabel')}</p>
                        <div className="grid grid-cols-3 gap-2">
                            {NAME_TAG_PLATE_SIZES.map((size) => (
                                <button
                                    key={size.id}
                                    type="button"
                                    onClick={() => setPlateSize(size.id)}
                                    className={cn(
                                        'rounded-xl border px-2 py-2 text-center',
                                        plateSize === size.id
                                            ? 'border-teal-400/60 bg-teal-400/10'
                                            : 'border-white/10 bg-black/20 hover:border-white/25'
                                    )}
                                >
                                    <span className="block text-[12px] font-black text-white">{t(`nameTagSizes.${size.id}`)}</span>
                                    <span className="mt-0.5 block text-[10px] font-medium text-white/50">{size.widthMm}×{size.heightMm}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="block space-y-2">
                        <span className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-white/45">
                            {t('nameTagLetterLabel')}
                            <span className="text-teal-200">{letterSize}%</span>
                        </span>
                        <input
                            type="range"
                            min={70}
                            max={120}
                            step={5}
                            value={letterSize}
                            onChange={(e) => setLetterSize(Number(e.target.value))}
                            className="w-full accent-teal-400"
                        />
                    </label>

                    <div className="mt-auto flex flex-col gap-2 pt-2">
                        <Button
                            type="button"
                            disabled={isQuoting}
                            onClick={() => void requestQuote()}
                            className="h-11 rounded-xl bg-teal-400 font-black text-slate-950 hover:bg-teal-300"
                        >
                            {isQuoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                            {t('requestQuote')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => useMakerStore.getState().triggerExport()}
                            className="h-10 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {t('stlSave')}
                        </Button>
                        <button
                            type="button"
                            onClick={onOpenDraw}
                            className="py-1 text-center text-[12px] font-bold text-white/45 underline-offset-2 hover:text-white/80 hover:underline"
                        >
                            {t('nameTagOpenDraw')}
                        </button>
                    </div>
                </section>

                <section className="relative min-h-[420px] flex-1 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
                    <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 text-[12px] font-bold text-white/70">
                        <Box className="h-4 w-4 text-teal-400" />
                        {tracing ? t('nameTagTracing') : t('nameTagPreviewHint')}
                    </div>
                    <Maker3DErrorBoundary
                        onRetry={() => setLetterSize((size) => size)}
                        title={t('error3dTitle')}
                        description={t('error3dDesc')}
                        backLabel={t('nameTagPreviewHint')}
                    >
                        <Preview3D />
                    </Maker3DErrorBoundary>
                </section>
            </div>
        </>
    )
}
