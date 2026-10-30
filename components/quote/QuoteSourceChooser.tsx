'use client'

import { ArrowRight, Calculator } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import {
    QuotePathDiagram,
    QuotePathFlowStrip,
} from '@/components/quote/QuotePathForkInfographic'

export type QuoteEntryMode = 'file' | 'photo'

type Props = {
    onSelect: (mode: QuoteEntryMode) => void
}

export default function QuoteSourceChooser({ onSelect }: Props) {
    const t = useTranslations('Quote')

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300/90">
                    {t('eyebrow')}
                </p>
                <h1 className="text-3xl font-black leading-[1.15] tracking-tight text-white sm:text-4xl">
                    {t('titleLine1')}
                    <br />
                    <span className="text-teal-400">{t('titleAccent')}</span>
                </h1>
                <p className="max-w-lg text-sm font-medium leading-relaxed text-white/60 break-keep">
                    {t('subtitle')}
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => onSelect('file')}
                    className={cn(
                        'group flex flex-col rounded-2xl border border-teal-400/25 bg-gradient-to-b from-teal-400/14 to-teal-400/[0.05] p-5 text-left transition-all',
                        'hover:-translate-y-0.5 hover:border-teal-400/40 hover:from-teal-400/18 active:scale-[0.99]',
                    )}
                >
                    <QuotePathDiagram mode="file" tone="teal" />
                    <p className="mt-3 text-lg font-black text-white">{t('hasFile')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55 break-keep">
                        {t('hasFileDesc')}
                    </p>
                    <div className="mt-3">
                        <QuotePathFlowStrip
                            tone="teal"
                            steps={[t('fileFlow1'), t('fileFlow2'), t('fileFlow3')]}
                        />
                    </div>
                    <span className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-teal-400 text-sm font-black text-slate-950 transition group-hover:bg-teal-300">
                        {t('uploadCta')} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => onSelect('photo')}
                    className={cn(
                        'group flex flex-col rounded-2xl border border-indigo-400/25 bg-gradient-to-b from-indigo-500/14 to-indigo-500/[0.05] p-5 text-left transition-all',
                        'hover:-translate-y-0.5 hover:border-indigo-400/40 hover:from-indigo-500/18 active:scale-[0.99]',
                    )}
                >
                    <QuotePathDiagram mode="photo" tone="indigo" />
                    <p className="mt-3 text-lg font-black text-white">{t('hasPhoto')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55 break-keep">
                        {t('hasPhotoDesc')}
                    </p>
                    <div className="mt-3">
                        <QuotePathFlowStrip
                            tone="indigo"
                            steps={[t('photoFlow1'), t('photoFlow2'), t('photoFlow3')]}
                        />
                    </div>
                    <span className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-400 text-sm font-black text-slate-950 transition group-hover:bg-indigo-300">
                        {t('make3dCta')} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                </button>
            </div>

            <Link
                href="/price-calculator"
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-all hover:border-teal-400/30 hover:bg-white/[0.07]"
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-teal-300">
                    <Calculator className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black text-white break-keep">{t('noFileCalcTitle')}</p>
                    <p className="text-[11px] font-medium text-white/50 break-keep">{t('noFileCalcDesc')}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-black text-teal-300 group-hover:gap-2">
                    {t('noFileCalcCta')} <ArrowRight className="h-3.5 w-3.5" />
                </span>
            </Link>

            <p className="text-[11px] font-bold leading-relaxed text-white/35 break-keep">
                {t('makerHintBefore')}
                <Link href="/maker" className="text-teal-400 hover:underline">
                    AI 3D Maker
                </Link>
                {t('makerHintAfter')}
            </p>
        </div>
    )
}
