'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ChevronDown, MousePointerClick } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CompareTableRow = { label: string } & Record<string, string>
export type CompareCard = {
    title: string
    body: string
    /** 카드가 소개하는 소재 키(여러 개면 소재별 버튼 표시) */
    keys: string[]
}
export type MaterialDetail = {
    eyebrow: string
    title: string
    intro: string
    featuresTitle: string
    features: string[]
    applicationsTitle: string
    applications: string[]
    tipsTitle: string
    tips: string[]
}

type Props = {
    /** 비교표 열 순서이자 주소 해시(#키)로 쓰는 소재 키 */
    materialKeys: readonly string[]
    itemLabel: string
    columnLabels: Record<string, string>
    tableRows: CompareTableRow[]
    cards: CompareCard[]
    cardGridClassName?: string
    tableClassName?: string
    details: Record<string, MaterialDetail>
    sectionLabel: string
    hint: string
    viewDetail: string
}

/**
 * 소재 비교표 + 소재별 자세히 보기
 * - 비교표의 소재 이름·칸 또는 카드를 누르면 해당 소재 탭을 열고 상세 영역으로 이동
 * - 주소 해시(#키)로 특정 소재를 바로 열 수 있음
 * - 검색엔진이 모든 소재 설명을 읽도록 패널을 모두 렌더링하고 선택되지 않은 패널만 숨김
 */
export default function MaterialCompareExplorer({
    materialKeys,
    itemLabel,
    columnLabels,
    tableRows,
    cards,
    cardGridClassName = 'grid md:grid-cols-2 lg:grid-cols-4 gap-6',
    tableClassName = 'min-w-[900px]',
    details,
    sectionLabel,
    hint,
    viewDetail,
}: Props) {
    const reduceMotion = useReducedMotion()
    const [active, setActive] = useState<string>(materialKeys[0])
    const sectionRef = useRef<HTMLElement>(null)
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

    const scrollToDetail = useCallback(() => {
        sectionRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }, [reduceMotion])

    const select = useCallback(
        (key: string, scroll = true) => {
            setActive(key)
            window.history.replaceState(window.history.state, '', `#${key}`)
            if (scroll) scrollToDetail()
        },
        [scrollToDetail]
    )

    useEffect(() => {
        const applyHash = () => {
            const key = window.location.hash.replace('#', '').toLowerCase()
            if (!materialKeys.includes(key)) return
            setActive(key)
            scrollToDetail()
        }
        applyHash()
        window.addEventListener('hashchange', applyHash)
        return () => window.removeEventListener('hashchange', applyHash)
    }, [materialKeys, scrollToDetail])

    const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        e.preventDefault()
        const idx = materialKeys.indexOf(active)
        const step = e.key === 'ArrowRight' ? 1 : materialKeys.length - 1
        const next = materialKeys[(idx + step) % materialKeys.length]
        select(next, false)
        tabRefs.current[next]?.focus()
    }

    return (
        <>
            <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm text-white/55 break-keep">
                    <MousePointerClick className="h-4 w-4 shrink-0 text-teal-300" aria-hidden />
                    {hint}
                </p>
                <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.03]">
                    <table className={cn('w-full text-sm', tableClassName)}>
                        <thead className="bg-white/[0.04]">
                            <tr>
                                <th className="p-4 text-left">{itemLabel}</th>
                                {materialKeys.map((key) => (
                                    <th
                                        key={key}
                                        className={cn('p-2 text-left transition-colors', active === key && 'bg-teal-400/10')}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => select(key)}
                                            aria-label={`${columnLabels[key]} ${viewDetail}`}
                                            className={cn(
                                                'group inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 font-black outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-400',
                                                active === key ? 'text-teal-300' : 'text-white hover:bg-white/[0.06] hover:text-teal-200'
                                            )}
                                        >
                                            {columnLabels[key]}
                                            <span className="rounded-full border border-white/20 px-1.5 py-0.5 text-[10px] font-bold opacity-70 group-hover:opacity-100">
                                                {viewDetail}
                                            </span>
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-white/75">
                            {tableRows.map((row) => (
                                <tr key={row.label} className="border-t border-white/10">
                                    <td className="p-4 font-bold text-white">{row.label}</td>
                                    {materialKeys.map((key) => (
                                        <td
                                            key={key}
                                            onClick={() => select(key)}
                                            className={cn(
                                                'cursor-pointer p-4 transition-colors',
                                                active === key ? 'bg-teal-400/[0.07] text-white' : 'hover:bg-white/[0.04] hover:text-white'
                                            )}
                                        >
                                            {row[key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={cardGridClassName}>
                {cards.map((card) => (
                    <article
                        key={card.title}
                        className={cn(
                            'flex flex-col rounded-3xl border bg-white/[0.03] p-6 transition-colors',
                            card.keys.includes(active) ? 'border-teal-400/40' : 'border-white/10'
                        )}
                    >
                        <h2 className="text-xl font-black mb-3">{card.title}</h2>
                        <p className="flex-1 text-white/65 leading-relaxed break-keep">{card.body}</p>
                        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                            {card.keys.map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => select(key)}
                                    className="inline-flex items-center gap-1 rounded-full text-sm font-black text-teal-300 outline-none hover:text-teal-200 focus-visible:ring-2 focus-visible:ring-teal-400"
                                >
                                    {card.keys.length > 1 ? `${columnLabels[key]} ${viewDetail}` : viewDetail}
                                    <ChevronDown className="h-4 w-4" aria-hidden />
                                </button>
                            ))}
                        </div>
                    </article>
                ))}
            </div>

            <section
                ref={sectionRef}
                id="material-detail"
                aria-label={sectionLabel}
                className="scroll-mt-28 rounded-[2rem] border border-teal-400/15 bg-teal-400/[0.04] p-6 md:p-10 space-y-6"
            >
                <div role="tablist" aria-label={sectionLabel} className="flex flex-wrap gap-2">
                    {materialKeys.map((key) => (
                        <button
                            key={key}
                            ref={(el) => {
                                tabRefs.current[key] = el
                            }}
                            type="button"
                            role="tab"
                            id={`material-tab-${key}`}
                            aria-selected={active === key}
                            aria-controls={`material-panel-${key}`}
                            tabIndex={active === key ? 0 : -1}
                            onClick={() => select(key, false)}
                            onKeyDown={onTabKeyDown}
                            className={cn(
                                'rounded-full border px-5 py-2 text-sm font-black outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-400',
                                active === key
                                    ? 'border-teal-400 bg-teal-400 text-slate-950'
                                    : 'border-white/15 bg-white/[0.03] text-white/70 hover:border-teal-400/40 hover:text-white'
                            )}
                        >
                            {columnLabels[key]}
                        </button>
                    ))}
                </div>

                {materialKeys.map((key) => {
                    const detail = details[key]
                    if (!detail) return null
                    const groups = [
                        { title: detail.featuresTitle, items: detail.features },
                        { title: detail.applicationsTitle, items: detail.applications },
                        { title: detail.tipsTitle, items: detail.tips },
                    ]
                    return (
                        <article
                            key={key}
                            role="tabpanel"
                            id={`material-panel-${key}`}
                            aria-labelledby={`material-tab-${key}`}
                            hidden={active !== key}
                            className="space-y-6"
                        >
                            <div className="space-y-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">{detail.eyebrow}</p>
                                <h2 className="text-2xl md:text-3xl font-black">{detail.title}</h2>
                                <p className="text-white/70 leading-relaxed break-keep">{detail.intro}</p>
                            </div>
                            <div className="grid lg:grid-cols-3 gap-5">
                                {groups.map((group) => (
                                    <div key={group.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                                        <h3 className="text-lg font-black text-white mb-3">{group.title}</h3>
                                        <ul className="space-y-2.5">
                                            {group.items.map((item) => (
                                                <li key={item} className="flex items-start gap-2.5 text-white/68 leading-relaxed break-keep">
                                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400/60" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </article>
                    )
                })}
            </section>
        </>
    )
}
