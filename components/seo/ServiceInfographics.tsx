import {
    ArrowRight,
    Box,
    BrickWall,
    CalendarClock,
    Camera,
    ChevronDown,
    ClipboardList,
    Columns3,
    Files,
    Flag,
    Lightbulb,
    PackageCheck,
    Paintbrush,
    PenTool,
    PiggyBank,
    Printer,
    ReceiptText,
    Ruler,
    ScanSearch,
    Scissors,
    ScrollText,
    Sparkles,
    Wallet,
    type LucideIcon,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { ServiceInfographicContent } from '@/lib/service-infographics'
import type { InfoIcon } from '@/lib/service-infographics/types'

const INFO_ICONS: Record<InfoIcon, LucideIcon> = {
    idea: Lightbulb,
    modeling: PenTool,
    quote: ClipboardList,
    print: Printer,
    delivery: PackageCheck,
    docs: ReceiptText,
    schedule: CalendarClock,
    photo: Camera,
    scan: ScanSearch,
    wallet: Wallet,
    finish: Paintbrush,
    unit: Ruler,
    wall: BrickWall,
    mesh: Box,
    split: Scissors,
    support: Columns3,
}

const DOC_ICONS: LucideIcon[] = [ClipboardList, ScrollText, ReceiptText]

const BAR_TONES = {
    teal: 'bg-teal-400/80 text-slate-950',
    sky: 'bg-sky-400/80 text-slate-950',
    amber: 'bg-amber-400/85 text-slate-950',
    violet: 'bg-violet-400/80 text-slate-950',
} as const

const CARD_TONES = {
    teal: { ring: 'border-teal-400/30', chip: 'bg-teal-400/15 text-teal-200', bar: 'bg-teal-400' },
    sky: { ring: 'border-sky-400/30', chip: 'bg-sky-400/15 text-sky-200', bar: 'bg-sky-400' },
    violet: { ring: 'border-violet-400/30', chip: 'bg-violet-400/15 text-violet-200', bar: 'bg-violet-400' },
} as const

function SectionHeading({ eyebrow, heading, body }: { eyebrow?: string; heading: string; body?: string }) {
    return (
        <div className="mb-7 space-y-2">
            {eyebrow ? (
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">{eyebrow}</p>
            ) : null}
            <h2 className="text-2xl md:text-3xl font-black break-keep">{heading}</h2>
            {body ? <p className="max-w-3xl text-white/60 leading-relaxed break-keep">{body}</p> : null}
        </div>
    )
}

/** 히어로 하단 핵심 수치 */
export function InfoHeroStats({ stats }: { stats: ServiceInfographicContent['stats'] }) {
    return (
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-sm"
                >
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="text-2xl md:text-3xl font-black tracking-tight text-teal-300 tabular-nums">
                        {s.value}
                    </dd>
                    <dd className="mt-1 text-sm font-black text-white break-keep">{s.label}</dd>
                    <dd className="text-[12px] font-bold text-white/45 break-keep">{s.sub}</dd>
                </div>
            ))}
        </dl>
    )
}

/** 서비스 범위 아이콘 카드 */
export function InfoScope({ scope }: { scope: ServiceInfographicContent['scope'] }) {
    return (
        <section>
            <SectionHeading heading={scope.heading} />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {scope.items.map((item) => {
                    const Icon = INFO_ICONS[item.icon]
                    return (
                        <li
                            key={item.title}
                            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3 transition-colors hover:border-teal-400/30"
                        >
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-400/15 text-teal-300">
                                <Icon className="h-5 w-5" aria-hidden />
                            </span>
                            <h3 className="font-black break-keep">{item.title}</h3>
                            <p className="text-sm text-white/60 leading-relaxed break-keep">{item.body}</p>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

/** 시작 지점별 5단계 진행 흐름 */
export function InfoProcess({ process }: { process: ServiceInfographicContent['process'] }) {
    return (
        <section>
            <SectionHeading eyebrow={process.eyebrow} heading={process.heading} body={process.body} />
            <ol className="relative grid gap-4 md:grid-cols-5 md:gap-3">
                {/* 단계 연결선 (데스크톱 가로, 모바일 세로) */}
                <span
                    aria-hidden
                    className="absolute left-[22px] top-6 bottom-6 w-px bg-gradient-to-b from-teal-400/60 via-teal-400/30 to-teal-400/60 md:hidden"
                />
                <span
                    aria-hidden
                    className="absolute hidden md:block left-[10%] right-[10%] top-[114px] h-px bg-gradient-to-r from-violet-400/60 via-teal-400/50 to-teal-400/80"
                />
                {process.steps.map((step, i) => {
                    const Icon = INFO_ICONS[step.icon]
                    return (
                        <li key={step.title} className="relative flex gap-4 md:flex-col md:gap-0">
                            {/* 시작점 안내 */}
                            <div className="hidden md:flex h-[92px] flex-col justify-end pb-3">
                                {step.entry ? (
                                    <Link
                                        href={step.entry.href as '/'}
                                        className="group rounded-2xl border border-teal-400/35 bg-teal-400/10 px-3 py-2 text-center hover:bg-teal-400/20 transition-colors"
                                    >
                                        <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-teal-300/80">
                                            {process.startLabel}
                                        </span>
                                        <span className="block text-[13px] font-black text-white break-keep">
                                            {step.entry.label}
                                        </span>
                                    </Link>
                                ) : null}
                            </div>
                            <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-teal-300/50 bg-[#062a2a] text-teal-200 shadow-[0_0_24px_rgba(45,212,191,0.25)] md:mx-auto">
                                <Icon className="h-5 w-5" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:mt-4 space-y-2">
                                {step.entry ? (
                                    <p className="md:hidden inline-block rounded-full border border-teal-400/35 bg-teal-400/10 px-2.5 py-1 text-[11px] font-black text-teal-200 break-keep">
                                        {process.startLabel} · {step.entry.label}
                                    </p>
                                ) : null}
                                <p className="text-[11px] font-black text-teal-400 tabular-nums">STEP {i + 1}</p>
                                <h3 className="text-lg font-black break-keep">{step.title}</h3>
                                <p className="text-sm text-white/60 leading-relaxed break-keep">{step.body}</p>
                                <div className="pt-1 space-y-1">
                                    <p className="text-[11px] font-bold text-white/40">{process.outputLabel}</p>
                                    <p className="inline-block rounded-lg bg-white/10 px-2 py-1 text-[12px] font-black text-white/85 break-keep">
                                        {step.output}
                                    </p>
                                </div>
                                {step.entry ? (
                                    <Link
                                        href={step.entry.href as '/'}
                                        className="inline-flex items-center gap-1 pt-1 text-[13px] font-black text-teal-300 hover:text-teal-200"
                                    >
                                        {step.entry.cta}
                                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                                    </Link>
                                ) : null}
                            </div>
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}

/** 발표일 역산 간트 차트 */
export function InfoTimeline({ timeline }: { timeline: ServiceInfographicContent['timeline'] }) {
    const span = Math.max(...timeline.ticks)
    const pos = (d: number) => `${((span - d) / span) * 100}%`

    return (
        <section>
            <SectionHeading eyebrow={timeline.eyebrow} heading={timeline.heading} body={timeline.body} />
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
                <div className="relative">
                    {/* 차트 영역 배경: 주차 눈금선 + 최종 주문 마감선 */}
                    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[220px] right-0 hidden md:block">
                        {timeline.ticks.map((d) => (
                            <span
                                key={d}
                                className="absolute inset-y-0 w-px bg-white/[0.07]"
                                style={{ left: pos(d) }}
                            />
                        ))}
                        <span
                            className="absolute inset-y-0 w-0 border-l-2 border-dashed border-rose-400/80"
                            style={{ left: pos(timeline.deadline.day) }}
                        />
                    </div>

                    <ul className="relative space-y-4 md:space-y-3">
                        {timeline.bars.map((bar) => (
                            <li key={bar.label} className="grid gap-1.5 md:grid-cols-[220px_1fr] md:items-center">
                                <div className="md:pr-4">
                                    <p className="text-sm font-black text-white break-keep">
                                        {bar.label}
                                        <span className="ml-2 text-[11px] font-bold text-white/40 tabular-nums sm:hidden">
                                            {timeline.dayLabel(bar.from)} ~ {timeline.dayLabel(bar.to)}
                                        </span>
                                    </p>
                                    <p className="text-[12px] font-bold text-white/45 break-keep">{bar.detail}</p>
                                </div>
                                <div className="relative h-9 rounded-xl bg-white/[0.03] md:bg-transparent">
                                    <span
                                        aria-hidden
                                        className="absolute inset-y-0 w-0 border-l-2 border-dashed border-rose-400/70 md:hidden"
                                        style={{ left: pos(timeline.deadline.day) }}
                                    />
                                    <span
                                        className={cn(
                                            'absolute inset-y-1 rounded-xl px-2 text-[11px] font-black flex items-center justify-center whitespace-nowrap overflow-hidden',
                                            BAR_TONES[bar.tone]
                                        )}
                                        style={{ left: pos(bar.from), width: `${((bar.from - bar.to) / span) * 100}%` }}
                                    >
                                        <span className="hidden sm:inline">
                                            {timeline.dayLabel(bar.from)} ~ {timeline.dayLabel(bar.to)}
                                        </span>
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 축 */}
                <div className="mt-3 md:ml-[220px] relative h-10">
                    {timeline.ticks.map((d) => (
                        <span
                            key={d}
                            className={cn(
                                'absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] font-black tabular-nums',
                                d === 0 ? 'text-teal-300' : 'text-white/40',
                                d === span && 'translate-x-0',
                                d === 0 && '-translate-x-full',
                                !timeline.mobileTicks.includes(d) && 'hidden sm:block'
                            )}
                            style={{ left: pos(d) }}
                        >
                            {d === 0 ? (
                                <span className="inline-flex items-center gap-1">
                                    <Flag className="h-3 w-3" aria-hidden />
                                    {timeline.dayLabel(d)}
                                </span>
                            ) : (
                                timeline.dayLabel(d)
                            )}
                        </span>
                    ))}
                    <span
                        className="absolute top-5 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-black text-rose-200"
                        style={{ left: pos(timeline.deadline.day) }}
                    >
                        {timeline.deadline.label} · {timeline.dayLabel(timeline.deadline.day)}
                    </span>
                </div>

                <p className="mt-4 text-[12px] font-bold text-white/40 leading-relaxed break-keep">{timeline.note}</p>
            </div>
        </section>
    )
}

/** 목적별 공정·소재 비교 카드 */
export function InfoMatch({ match }: { match: ServiceInfographicContent['match'] }) {
    return (
        <section>
            <SectionHeading eyebrow={match.eyebrow} heading={match.heading} body={match.body} />
            <div className="grid gap-4 md:grid-cols-3">
                {match.cards.map((card) => {
                    const tone = CARD_TONES[card.tone]
                    return (
                        <article
                            key={card.purpose}
                            className={cn('rounded-3xl border bg-white/[0.03] p-6 space-y-4', tone.ring)}
                        >
                            <div className="space-y-2">
                                <span className={cn('inline-block rounded-full px-3 py-1 text-[11px] font-black', tone.chip)}>
                                    {card.purpose}
                                </span>
                                <h3 className="text-xl font-black break-keep">
                                    {card.method} <span className="text-white/40">·</span>{' '}
                                    <span className="text-white/85">{card.materials}</span>
                                </h3>
                                <p className="text-sm text-white/60 leading-relaxed break-keep">{card.why}</p>
                            </div>
                            <dl className="space-y-2.5 border-t border-white/10 pt-4">
                                {match.metrics.map((metric, mi) => (
                                    <div key={metric} className="grid grid-cols-[84px_1fr] items-center gap-3">
                                        <dt className="text-[12px] font-bold text-white/55 break-keep">{metric}</dt>
                                        <dd className="flex gap-1" aria-label={`${metric} ${card.scores[mi]}/5`}>
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <span
                                                    key={n}
                                                    className={cn(
                                                        'h-2 flex-1 rounded-full',
                                                        n <= card.scores[mi] ? tone.bar : 'bg-white/10'
                                                    )}
                                                />
                                            ))}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </article>
                    )
                })}
            </div>
            <p className="mt-3 text-[12px] font-bold text-white/40 break-keep">{match.note}</p>
        </section>
    )
}

/** 산학협력단 결제 서류 흐름 */
export function InfoDocs({ docs }: { docs: NonNullable<ServiceInfographicContent['docs']> }) {
    return (
        <section>
            <SectionHeading eyebrow={docs.eyebrow} heading={docs.heading} body={docs.body} />
            <ol className="grid gap-4 md:grid-cols-3">
                {docs.items.map((doc, i) => {
                    const Icon = DOC_ICONS[i] ?? ScrollText
                    return (
                        <li key={doc.title} className="relative">
                            <div className="relative h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 pr-10 space-y-3 [clip-path:polygon(0_0,calc(100%-28px)_0,100%_28px,100%_100%,0_100%)]">
                                <span
                                    aria-hidden
                                    className="absolute right-0 top-0 h-7 w-7 bg-white/15 [clip-path:polygon(0_0,100%_100%,0_100%)]"
                                />
                                <div className="flex items-center gap-3">
                                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-400/15 text-teal-300">
                                        <Icon className="h-5 w-5" aria-hidden />
                                    </span>
                                    <span className="text-3xl font-black text-white/15 tabular-nums">{doc.step}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-black">{doc.title}</h3>
                                    <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-2.5 py-0.5 text-[11px] font-black text-teal-200">
                                        {doc.when}
                                    </span>
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed break-keep">{doc.body}</p>
                                <div aria-hidden className="space-y-1.5 pt-1">
                                    <span className="block h-1.5 w-full rounded-full bg-white/10" />
                                    <span className="block h-1.5 w-4/5 rounded-full bg-white/10" />
                                    <span className="block h-1.5 w-3/5 rounded-full bg-white/10" />
                                </div>
                            </div>
                            {i < docs.items.length - 1 ? (
                                <span
                                    aria-hidden
                                    className="absolute -right-3.5 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-teal-400/40 bg-[#020617] text-teal-300 md:grid"
                                >
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                            ) : null}
                        </li>
                    )
                })}
            </ol>
            <p className="mt-3 text-[12px] font-bold text-white/40 leading-relaxed break-keep">{docs.note}</p>
        </section>
    )
}

/** 출력 전 파일 점검표 */
export function InfoChecklist({ checklist }: { checklist: NonNullable<ServiceInfographicContent['checklist']> }) {
    return (
        <section>
            <SectionHeading eyebrow={checklist.eyebrow} heading={checklist.heading} body={checklist.body} />
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7 space-y-5">
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {checklist.items.map((item, i) => {
                        const Icon = INFO_ICONS[item.icon]
                        return (
                            <li
                                key={item.title}
                                className="relative rounded-3xl border border-white/10 bg-black/20 p-5 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-400/15 text-indigo-200">
                                        <Icon className="h-5 w-5" aria-hidden />
                                    </span>
                                    <span className="grid h-7 w-7 place-items-center rounded-full border border-teal-400/40 text-[12px] font-black text-teal-300 tabular-nums">
                                        {i + 1}
                                    </span>
                                </div>
                                <h3 className="font-black break-keep">{item.title}</h3>
                                <p className="text-sm text-white/60 leading-relaxed break-keep">{item.body}</p>
                                <p className="inline-block rounded-lg bg-indigo-400/10 px-2 py-1 text-[11px] font-black text-indigo-200 break-keep">
                                    {item.badge}
                                </p>
                            </li>
                        )
                    })}
                </ol>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-5">
                    <Link
                        href={checklist.cta.href as '/'}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-indigo-300 transition-colors"
                    >
                        <ScanSearch className="h-4 w-4" aria-hidden />
                        {checklist.cta.label}
                    </Link>
                    {checklist.guide ? (
                        <Link
                            href={checklist.guide.href as '/'}
                            className="inline-flex items-center gap-1 text-sm font-black text-white/60 hover:text-white"
                        >
                            {checklist.guide.label}
                            <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                    ) : null}
                </div>
            </div>
        </section>
    )
}

/** 접이식 FAQ — 답변도 HTML에 그대로 있어 검색 노출에 영향 없음 */
export function InfoFaq({ heading, faqs }: { heading: string; faqs: { q: string; a: string }[] }) {
    return (
        <section>
            <SectionHeading heading={heading} />
            <div className="space-y-3">
                {faqs.map((f, i) => (
                    <details
                        key={f.q}
                        open={i === 0}
                        className="group rounded-3xl border border-white/10 bg-white/[0.03] open:border-teal-400/25 open:bg-teal-400/[0.04] transition-colors"
                    >
                        <summary className="flex cursor-pointer list-none items-center gap-4 p-5 md:p-6 [&::-webkit-details-marker]:hidden">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-400/15 text-[13px] font-black text-teal-300">
                                Q
                            </span>
                            <h3 className="flex-1 text-base md:text-lg font-black break-keep">{f.q}</h3>
                            <ChevronDown
                                className="h-5 w-5 shrink-0 text-white/40 transition-transform group-open:rotate-180"
                                aria-hidden
                            />
                        </summary>
                        <p className="px-5 pb-5 md:px-6 md:pb-6 md:pl-[72px] text-white/65 leading-relaxed break-keep">
                            {f.a}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    )
}

/** 팀 묶음 주문·예산 절감 */
export function InfoTeam({ team }: { team: ServiceInfographicContent['team'] }) {
    const tipIcons: LucideIcon[] = [Printer, Sparkles, Files]
    return (
        <section>
            <SectionHeading eyebrow={team.eyebrow} heading={team.heading} body={team.body} />
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 space-y-3">
                    {team.groups.map((group) => (
                        <div
                            key={group.label}
                            className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                            <div className="space-y-2">
                                <p className="text-[12px] font-black text-teal-300">{group.label}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {group.files.map((f) => (
                                        <span
                                            key={f}
                                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] font-bold text-white/75"
                                        >
                                            <Files className="h-3 w-3 text-white/40" aria-hidden />
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <ArrowRight className="hidden sm:block h-4 w-4 text-white/30" aria-hidden />
                            <span className="justify-self-start rounded-xl bg-teal-400 px-3 py-1.5 text-[12px] font-black text-slate-950 whitespace-nowrap">
                                {group.result}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="rounded-[2rem] border border-amber-400/25 bg-amber-400/[0.06] p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <PiggyBank className="h-5 w-5 text-amber-300" aria-hidden />
                        <h3 className="font-black">{team.tipsHeading}</h3>
                    </div>
                    <ol className="space-y-3">
                        {team.tips.map((tip, i) => {
                            const Icon = tipIcons[i] ?? Sparkles
                            return (
                                <li key={tip} className="flex items-center gap-3">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-200">
                                        <Icon className="h-4 w-4" aria-hidden />
                                    </span>
                                    <span className="text-sm font-bold text-white/80 break-keep">{tip}</span>
                                </li>
                            )
                        })}
                    </ol>
                </div>
            </div>
        </section>
    )
}
