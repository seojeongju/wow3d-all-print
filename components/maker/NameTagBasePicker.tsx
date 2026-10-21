'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, Shapes, Sparkles, Smile, Footprints, Check } from 'lucide-react'
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
    const [activeTab, setActiveTab] = useState<'all' | 'kids' | 'pet'>('all')
    const current = getNameTagTemplate(baseId)

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-wider text-white/50">{t('baseLabel')}</p>
                {baseId ? (
                    <button
                        type="button"
                        onClick={() => onSelect(null)}
                        className="text-[11px] font-bold text-teal-400 hover:text-teal-300"
                    >
                        기본 도형으로 초기화
                    </button>
                ) : null}
            </div>

            {/* 현재 선택된 베이스 버튼 */}
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className={cn(
                    'group flex h-14 w-full items-center justify-between gap-3 rounded-2xl border px-3 text-left transition-all',
                    open
                        ? 'border-teal-400/80 bg-teal-400/10 ring-1 ring-teal-400/50'
                        : current
                        ? 'border-teal-400/40 bg-white/[0.04] hover:border-teal-400/60'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                )}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 p-1">
                        {current ? (
                            <Image
                                src={encodeURI(current.file)}
                                alt=""
                                width={48}
                                height={36}
                                unoptimized
                                className="h-8 w-10 shrink-0 object-contain drop-shadow"
                            />
                        ) : (
                            <Shapes className="h-5 w-5 text-teal-300" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <span className="block truncate text-[14px] font-bold text-white">
                            {current ? current.name : t('baseBasic')}
                        </span>
                        <span className="block text-[11px] font-medium text-white/45">
                            {current ? '일러스트 외곽 베이스 적용됨' : '도형 실루엣 (사각, 원형 등)'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {current && (
                        <span className="rounded-full bg-teal-400/20 px-2 py-0.5 text-[10px] font-black text-teal-300">
                            적용중
                        </span>
                    )}
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 shrink-0 text-white/50 transition-transform duration-200',
                            open && 'rotate-180 text-teal-300'
                        )}
                    />
                </div>
            </button>

            {/* 드롭다운 / 갤러리 피커 모달 */}
            {open ? (
                <div className="space-y-3 rounded-2xl border border-white/15 bg-[#121218]/95 p-3.5 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    {/* 카테고리 탭 인포그래픽 */}
                    <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/40 p-1 border border-white/8 text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                'flex items-center justify-center gap-1 rounded-lg py-1.5 transition-all',
                                activeTab === 'all'
                                    ? 'bg-teal-400 text-slate-950 font-black shadow'
                                    : 'text-white/60 hover:text-white'
                            )}
                        >
                            <Sparkles className="h-3 w-3" />
                            <span>전체</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('kids')}
                            className={cn(
                                'flex items-center justify-center gap-1 rounded-lg py-1.5 transition-all',
                                activeTab === 'kids'
                                    ? 'bg-teal-400 text-slate-950 font-black shadow'
                                    : 'text-white/60 hover:text-white'
                            )}
                        >
                            <Smile className="h-3 w-3" />
                            <span>어린이</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('pet')}
                            className={cn(
                                'flex items-center justify-center gap-1 rounded-lg py-1.5 transition-all',
                                activeTab === 'pet'
                                    ? 'bg-teal-400 text-slate-950 font-black shadow'
                                    : 'text-white/60 hover:text-white'
                            )}
                        >
                            <Footprints className="h-3 w-3" />
                            <span>반려동물</span>
                        </button>
                    </div>

                    {/* 기본 도형 버튼 */}
                    <button
                        type="button"
                        onClick={() => {
                            onSelect(null)
                            setOpen(false)
                        }}
                        className={cn(
                            'flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-[12px] font-bold transition-all',
                            baseId == null
                                ? 'border-teal-400/80 bg-teal-400/15 text-teal-200'
                                : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white'
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Shapes className="h-4 w-4 text-teal-400" />
                            <span>{t('baseBasic')} (일러스트 없이 깔끔한 도형)</span>
                        </span>
                        {baseId == null && <Check className="h-3.5 w-3.5 text-teal-300" />}
                    </button>

                    {/* 템플릿 카드 그리드 */}
                    <div className="max-h-72 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                        {SETS.filter((set) => activeTab === 'all' || activeTab === set).map((set) => (
                            <div key={set} className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                                    {set === 'kids' ? <Smile className="h-3 w-3 text-teal-400" /> : <Footprints className="h-3 w-3 text-teal-400" />}
                                    <span>{t(set === 'kids' ? 'baseKids' : 'basePets')}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {NAME_TAG_TEMPLATES[set].map((template) => {
                                        const isSelected = template.id === baseId
                                        return (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() => {
                                                    onSelect(template.id)
                                                    setOpen(false)
                                                }}
                                                className={cn(
                                                    'group relative flex flex-col items-center rounded-xl border p-2 text-center transition-all',
                                                    isSelected
                                                        ? 'border-teal-400 bg-teal-400/20 shadow-[0_0_12px_rgba(45,212,191,0.3)] ring-1 ring-teal-400'
                                                        : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]'
                                                )}
                                            >
                                                <div className="relative flex h-12 w-full items-center justify-center rounded-lg bg-white/10 p-1">
                                                    <Image
                                                        src={encodeURI(template.file)}
                                                        alt={template.name}
                                                        width={96}
                                                        height={48}
                                                        unoptimized
                                                        className="h-10 w-full object-contain transition-transform group-hover:scale-110 drop-shadow"
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-400 text-slate-950">
                                                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span
                                                    className={cn(
                                                        'mt-1.5 block w-full truncate text-[11px] font-bold',
                                                        isSelected ? 'text-teal-200' : 'text-white/80 group-hover:text-white'
                                                    )}
                                                >
                                                    {template.name}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <p className="text-[11px] leading-relaxed text-white/40 break-keep">{t('baseHint')}</p>
        </div>
    )
}
