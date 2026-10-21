'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { NAME_TAG_TEMPLATES, getNameTagTemplate, type NameTagTemplateSet } from '@/lib/name-tag/templates'

const SETS: NameTagTemplateSet[] = ['kids', 'pet']

export function NameTagBasePicker({
    baseId,
    onSelect,
}: {
    baseId: string | null
    onSelect: (baseId: string | null) => void
}) {
    const t = useTranslations('Maker.nameTag')
    const [open, setOpen] = useState(false)
    const current = getNameTagTemplate(baseId)

    return (
        <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-white/45">{t('baseLabel')}</p>
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="flex h-14 w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 text-left"
            >
                <span className="flex min-w-0 items-center gap-2">
                    {current ? (
                        <Image src={encodeURI(current.file)} alt="" width={48} height={36} unoptimized className="h-9 w-12 shrink-0 object-contain" />
                    ) : null}
                    <span className="truncate text-[14px] text-white">{current ? current.name : t('baseBasic')}</span>
                </span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-white/50', open && 'rotate-180')} />
            </button>
            {open ? (
                <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-2">
                    <button
                        type="button"
                        onClick={() => {
                            onSelect(null)
                            setOpen(false)
                        }}
                        className={cn(
                            'w-full rounded-lg border px-3 py-2 text-left text-[13px] font-bold',
                            baseId == null ? 'border-teal-400/70 bg-teal-400/15 text-white' : 'border-white/10 text-white/80'
                        )}
                    >
                        {t('baseBasic')}
                    </button>
                    {SETS.map((set) => (
                        <div key={set} className="space-y-1.5">
                            <p className="text-[10px] font-bold text-white/35">{t(set === 'kids' ? 'baseKids' : 'basePets')}</p>
                            <div className="grid grid-cols-3 gap-1.5">
                                {NAME_TAG_TEMPLATES[set].map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(template.id)
                                            setOpen(false)
                                        }}
                                        className={cn(
                                            'rounded-lg border bg-white px-1 py-1 text-center',
                                            template.id === baseId ? 'border-teal-400 ring-2 ring-teal-400/60' : 'border-white/15'
                                        )}
                                    >
                                        <Image
                                            src={encodeURI(template.file)}
                                            alt={template.name}
                                            width={96}
                                            height={48}
                                            unoptimized
                                            className="h-12 w-full object-contain"
                                        />
                                        <span className="mt-0.5 block truncate text-[10px] font-bold text-zinc-800">{template.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
            <p className="text-[11px] leading-relaxed text-white/40">{t('baseHint')}</p>
        </div>
    )
}
