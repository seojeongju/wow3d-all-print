'use client'

import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
    localeText,
    type MaterialSpecDef,
    type MaterialSpecFieldId,
} from '@/lib/material-specs'

const FIELD_ORDER: MaterialSpecFieldId[] = [
    'heatDeflection',
    'meltRange',
    'nozzleTemp',
    'bedTemp',
    'strength',
    'flexibility',
    'surface',
    'postProcess',
    'printNote',
]

type Props = {
    spec: MaterialSpecDef
    /** 강조 톤 */
    tone?: 'teal' | 'indigo'
    className?: string
    /** 요약 문단 표시 */
    showSummary?: boolean
}

export default function MaterialSpecsGrid({
    spec,
    tone = 'teal',
    className,
    showSummary = true,
}: Props) {
    const t = useTranslations('Materials')
    const locale = useLocale()
    const labelTone = tone === 'indigo' ? 'text-indigo-300/90' : 'text-teal-300/90'
    const borderTone = tone === 'indigo' ? 'border-indigo-400/15 bg-indigo-400/[0.04]' : 'border-teal-400/15 bg-teal-400/[0.04]'

    const fields = [...spec.fields].sort(
        (a, b) => FIELD_ORDER.indexOf(a.id) - FIELD_ORDER.indexOf(b.id)
    )

    return (
        <div className={cn('space-y-3', className)}>
            {showSummary ? (
                <p className="text-[13px] sm:text-sm font-bold text-white/55 leading-relaxed break-keep">
                    {localeText(spec.summary, locale)}
                </p>
            ) : null}
            <dl className={cn('grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl border p-3 sm:p-4', borderTone)}>
                {fields.map((field) => (
                    <div
                        key={field.id}
                        className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
                    >
                        <dt className={cn('text-[10px] font-black uppercase tracking-[0.16em]', labelTone)}>
                            {t(`specLabels.${field.id}`)}
                        </dt>
                        <dd className="mt-1 text-[13px] font-bold text-white/85 leading-snug break-keep">
                            {localeText(field.value, locale)}
                        </dd>
                    </div>
                ))}
            </dl>
            <p className="text-[10px] sm:text-[11px] font-medium text-white/35 leading-relaxed break-keep">
                {t('specDisclaimer')}
            </p>
        </div>
    )
}
