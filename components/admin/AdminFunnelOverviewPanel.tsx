'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ChevronDown,
    ChevronRight,
    Database,
    FileText,
    MousePointer2,
    PenLine,
    ShoppingCart,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    CHECKOUT_CONVERSION_EVENTS,
    HERO_CONVERSION_EVENTS,
    HERO_EVENT_LABELS,
    QUOTE_CONVERSION_EVENTS,
    QUOTE_EVENT_LABELS,
    formatFunnelDateLabel,
    type ConversionFunnelTrendPoint,
    type FunnelEventRow,
    type HeroFunnelSummary,
    type QuoteFunnelSummary as QuoteBehaviorSummary,
} from '@/lib/conversion-events';
import {
    type QuoteFunnelSummary as QuoteDbSummary,
    type QuoteTrafficSource,
} from '@/lib/quote-funnel-trend';

type Props = {
    heroSummary: HeroFunnelSummary;
    quoteSummary: QuoteBehaviorSummary;
    quoteDbSummary: QuoteDbSummary;
    quoteTrafficSources: QuoteTrafficSource[];
    trend: ConversionFunnelTrendPoint[];
    heroRows: FunnelEventRow[];
    quoteRows: FunnelEventRow[];
    dayCount?: number;
};

type FunnelStep = {
    key: string;
    label: string;
    value: number;
    rateLabel?: string;
    color: string;
};

const TREND_SERIES: {
    key: keyof Omit<ConversionFunnelTrendPoint, 'date'>;
    label: string;
    shortLabel: string;
    color: string;
}[] = [
    { key: 'heroView', label: '히어로', shortLabel: '히어로', color: '#2dd4bf' },
    { key: 'quotePageView', label: '견적 진입', shortLabel: '견적', color: '#60a5fa' },
    { key: 'quoteEstimate', label: '견적 확인', shortLabel: '확인', color: '#a78bfa' },
    { key: 'quoteAddToCart', label: '장바구니', shortLabel: '장바구니', color: '#f97316' },
    { key: 'orderComplete', label: '주문', shortLabel: '주문', color: '#34d399' },
];

const HERO_DETAIL_ORDER = [
    HERO_CONVERSION_EVENTS.CTA_FILE,
    HERO_CONVERSION_EVENTS.FORK_FILE,
    HERO_CONVERSION_EVENTS.DROP_FILE,
    HERO_CONVERSION_EVENTS.CTA_PHOTO,
    HERO_CONVERSION_EVENTS.FORK_PHOTO,
    HERO_CONVERSION_EVENTS.DROP_PHOTO,
    HERO_CONVERSION_EVENTS.SAMPLE_TRY,
];

const QUOTE_DETAIL_ORDER = [
    QUOTE_CONVERSION_EVENTS.ENTRY_FILE,
    QUOTE_CONVERSION_EVENTS.ENTRY_PHOTO,
    QUOTE_CONVERSION_EVENTS.FILE_UPLOADED,
    QUOTE_CONVERSION_EVENTS.ANALYSIS_COMPLETE,
];

const SOURCE_COLORS = ['bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500'];

const CHART_H = 200;
const PAD = { top: 12, right: 12, bottom: 24, left: 40 };

export default function AdminFunnelOverviewPanel({
    heroSummary,
    quoteSummary,
    quoteDbSummary,
    quoteTrafficSources,
    trend,
    heroRows,
    quoteRows,
    dayCount = 14,
}: Props) {
    const [showDetails, setShowDetails] = useState(false);
    const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(TREND_SERIES.map((s) => [s.key, true])),
    );

    const orderComplete =
        quoteRows.find((r) => r.eventName === CHECKOUT_CONVERSION_EVENTS.ORDER_COMPLETE)?.count ?? 0;

    const steps: FunnelStep[] = useMemo(() => {
        const hero = heroSummary.views;
        const quote = quoteSummary.pageViews;
        const estimate = quoteSummary.estimateView;
        const cart = quoteSummary.addToCart;

        const pct = (num: number, den: number) =>
            den > 0 ? `${Math.round((num / den) * 1000) / 10}%` : '—';

        return [
            { key: 'hero', label: '히어로', value: hero, color: '#2dd4bf' },
            {
                key: 'quote',
                label: '견적 진입',
                value: quote,
                rateLabel: pct(quote, hero),
                color: '#60a5fa',
            },
            {
                key: 'estimate',
                label: '견적 확인',
                value: estimate,
                rateLabel: `${quoteSummary.estimateRate}%`,
                color: '#a78bfa',
            },
            {
                key: 'cart',
                label: '장바구니',
                value: cart,
                rateLabel: `${quoteSummary.cartRate}%`,
                color: '#f97316',
            },
            {
                key: 'order',
                label: '주문',
                value: orderComplete,
                rateLabel: pct(orderComplete, quote),
                color: '#34d399',
            },
        ];
    }, [heroSummary.views, quoteSummary, orderComplete]);

    const chart = useMemo(() => buildTrendChart(trend, TREND_SERIES, visibleSeries), [trend, visibleSeries]);

    const heroDetails = orderDetailRows(heroRows, HERO_DETAIL_ORDER, HERO_EVENT_LABELS);
    const quoteDetails = orderDetailRows(quoteRows, QUOTE_DETAIL_ORDER, QUOTE_EVENT_LABELS);

    const totalSourceCount = quoteTrafficSources.reduce((a, s) => a + s.count, 0);
    const hasTrend = trend.some((p) =>
        TREND_SERIES.some((s) => p[s.key] > 0),
    );

    const dbKpis = [
        { label: '신규 견적', value: quoteDbSummary.total, icon: FileText, tone: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: '주문 전환', value: quoteDbSummary.ordered, sub: `${quoteDbSummary.conversionRate}%`, icon: ShoppingCart, tone: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: '장바구니', value: quoteDbSummary.incart, icon: MousePointer2, tone: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: '견적 이탈', value: quoteDbSummary.abandoned, icon: XCircle, tone: 'text-rose-400', bg: 'bg-rose-500/10' },
        { label: '작성 중', value: quoteDbSummary.draft, icon: PenLine, tone: 'text-white/50', bg: 'bg-white/5' },
    ];

    return (
        <Card className="overflow-hidden border-white/5 bg-[#0f0f0f]">
            <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
                            <TrendingUp className="h-4 w-4 text-teal-400" />
                            전환 &amp; 견적 현황
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                                최근 {dayCount}일
                            </span>
                        </CardTitle>
                        <p className="mt-1 text-xs leading-relaxed text-white/45 break-keep">
                            사이트 행동 퍼널과 DB 견적 데이터를 한곳에서 확인합니다.
                        </p>
                    </div>
                    <Link
                        href="/admin/quotes/analytics"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-white/60 transition-colors hover:border-primary/30 hover:text-primary"
                    >
                        견적 상세 분석
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
                {/* 행동 퍼널 — 단일 시각화 */}
                <div>
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/35">
                        사이트 행동 퍼널
                        <span className="ml-2 font-medium normal-case tracking-normal text-white/25">· 이벤트 추적</span>
                    </p>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
                        {steps.map((step, i) => {
                            const maxVal = steps[0]?.value || 1;
                            const widthPct = maxVal > 0 ? Math.max(8, Math.round((step.value / maxVal) * 100)) : 8;
                            return (
                                <div key={step.key} className="flex min-w-0 flex-1 items-center gap-2 lg:flex-col lg:gap-1.5">
                                    {i > 0 && (
                                        <ChevronRight className="hidden h-4 w-4 shrink-0 text-white/20 lg:block lg:rotate-0" />
                                    )}
                                    <div className="min-w-0 flex-1 rounded-xl border border-white/5 bg-white/[0.02] p-3 lg:w-full">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                                                {step.label}
                                            </span>
                                            {step.rateLabel && i > 0 && (
                                                <span className="text-[10px] font-bold text-teal-400/80">{step.rateLabel}</span>
                                            )}
                                        </div>
                                        <p className="text-xl font-black tabular-nums text-white">{step.value.toLocaleString('ko-KR')}</p>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${widthPct}%`, backgroundColor: step.color }}
                                            />
                                        </div>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <ChevronRight className="h-4 w-4 shrink-0 text-white/20 lg:hidden" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {(heroSummary.fileIntent > 0 || heroSummary.photoIntent > 0 || heroSummary.sampleTry > 0) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {heroSummary.fileIntent > 0 && (
                                <InsightChip label="3D intent" value={heroSummary.fileIntent} />
                            )}
                            {heroSummary.photoIntent > 0 && (
                                <InsightChip label="사진 intent" value={heroSummary.photoIntent} />
                            )}
                            {heroSummary.sampleTry > 0 && (
                                <InsightChip label="샘플 체험" value={heroSummary.sampleTry} />
                            )}
                        </div>
                    )}
                </div>

                <div className="grid gap-5 lg:grid-cols-12">
                    {/* 일별 추이 */}
                    <div className="lg:col-span-8 rounded-xl border border-white/5 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/35">일별 추이</p>
                            <div className="flex flex-wrap gap-1">
                                {TREND_SERIES.map((s) => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        onClick={() =>
                                            setVisibleSeries((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
                                        }
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold transition-all',
                                            visibleSeries[s.key]
                                                ? 'border-white/15 bg-white/[0.06] text-white/75'
                                                : 'border-white/5 text-white/25 line-through',
                                        )}
                                        aria-pressed={visibleSeries[s.key]}
                                    >
                                        <span
                                            className="h-1.5 w-1.5 rounded-full"
                                            style={{
                                                backgroundColor: visibleSeries[s.key] ? s.color : '#444',
                                            }}
                                        />
                                        {s.shortLabel}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {!hasTrend ? (
                            <p className="py-10 text-center text-xs text-white/30">일별 행동 데이터 없음</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <svg
                                    viewBox={`0 0 ${chart.width + PAD.left + PAD.right} ${CHART_H}`}
                                    className="h-[200px] w-full min-w-[480px]"
                                    role="img"
                                    aria-label="전환 퍼널 일별 추이"
                                >
                                    {[0, 1, 2, 3].map((i) => {
                                        const innerH = CHART_H - PAD.top - PAD.bottom;
                                        const y = PAD.top + (innerH / 3) * i;
                                        return (
                                            <line
                                                key={i}
                                                x1={PAD.left}
                                                x2={PAD.left + chart.width}
                                                y1={y}
                                                y2={y}
                                                stroke="rgba(255,255,255,0.06)"
                                                strokeDasharray="4 4"
                                            />
                                        );
                                    })}
                                    {chart.yTicks.map((tick) => {
                                        const innerH = CHART_H - PAD.top - PAD.bottom;
                                        const y = PAD.top + innerH - (tick / chart.max) * innerH;
                                        return (
                                            <text
                                                key={tick}
                                                x={PAD.left - 6}
                                                y={y + 3}
                                                textAnchor="end"
                                                className="fill-white/30 text-[8px] font-medium"
                                            >
                                                {tick}
                                            </text>
                                        );
                                    })}
                                    {chart.columns.map((col, i) => {
                                        const groupW = chart.width / chart.columns.length;
                                        const gx = PAD.left + groupW * i + groupW / 2;
                                        const activeSeries = TREND_SERIES.filter((s) => visibleSeries[s.key]);
                                        const barW = Math.min(8, Math.max(3, groupW / (activeSeries.length + 2)));

                                        return (
                                            <g key={col.date}>
                                                {activeSeries.map((s, bi) => {
                                                    const innerH = CHART_H - PAD.top - PAD.bottom;
                                                    const h =
                                                        chart.max > 0
                                                            ? (col.values[s.key] / chart.max) * innerH
                                                            : 0;
                                                    const offset = (bi - (activeSeries.length - 1) / 2) * (barW + 1);
                                                    const x = gx + offset - barW / 2;
                                                    const y = PAD.top + innerH - h;
                                                    return (
                                                        <rect
                                                            key={s.key}
                                                            x={x}
                                                            y={y}
                                                            width={barW}
                                                            height={Math.max(h, col.values[s.key] > 0 ? 2 : 0)}
                                                            fill={s.color}
                                                            rx={2}
                                                            opacity={0.9}
                                                        >
                                                            <title>{`${formatFunnelDateLabel(col.date)} ${s.label}: ${col.values[s.key]}`}</title>
                                                        </rect>
                                                    );
                                                })}
                                                <text
                                                    x={gx}
                                                    y={CHART_H - 4}
                                                    textAnchor="middle"
                                                    className="fill-white/30 text-[8px] font-medium"
                                                >
                                                    {formatFunnelDateLabel(col.date)}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* DB 견적 + 유입 경로 */}
                    <div className="space-y-4 lg:col-span-4">
                        <div className="rounded-xl border border-white/5 p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <Database className="h-3.5 w-3.5 text-orange-400" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">
                                    견적 DB
                                    <span className="ml-1.5 font-medium normal-case tracking-normal text-white/25">· 실제 저장</span>
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {dbKpis.map((k) => (
                                    <div
                                        key={k.label}
                                        className={cn('rounded-lg border border-white/5 px-2.5 py-2', k.bg)}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <k.icon className={cn('h-3 w-3 shrink-0', k.tone)} />
                                            <span className="truncate text-[9px] font-bold text-white/40">{k.label}</span>
                                        </div>
                                        <div className="mt-0.5 flex items-baseline gap-1">
                                            <span className="text-base font-black tabular-nums text-white">
                                                {k.value.toLocaleString('ko-KR')}
                                            </span>
                                            {'sub' in k && k.sub && (
                                                <span className={cn('text-[10px] font-bold', k.tone)}>{k.sub}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/5 p-4">
                            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/35">
                                견적 유입 경로
                            </p>
                            {quoteTrafficSources.length > 0 ? (
                                <div className="space-y-2.5">
                                    {quoteTrafficSources.slice(0, 5).map((src, idx) => {
                                        const pct =
                                            totalSourceCount > 0
                                                ? Math.round((src.count / totalSourceCount) * 100)
                                                : 0;
                                        return (
                                            <div key={src.source} className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="flex min-w-0 items-center gap-1.5 truncate text-white/60 capitalize">
                                                        <span
                                                            className={cn(
                                                                'h-1.5 w-1.5 shrink-0 rounded-full',
                                                                SOURCE_COLORS[idx % SOURCE_COLORS.length],
                                                            )}
                                                        />
                                                        {src.source}
                                                    </span>
                                                    <span className="shrink-0 text-white">
                                                        {pct}%
                                                        <span className="ml-1 font-medium text-white/30">({src.count})</span>
                                                    </span>
                                                </div>
                                                <div className="h-1 overflow-hidden rounded-full bg-white/5">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full',
                                                            SOURCE_COLORS[idx % SOURCE_COLORS.length],
                                                        )}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-xs text-white/25">유입 경로 데이터 없음</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 접기 가능한 상세 이벤트 */}
                {(heroDetails.length > 0 || quoteDetails.length > 0) && (
                    <div className="rounded-xl border border-white/5">
                        <button
                            type="button"
                            onClick={() => setShowDetails((v) => !v)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
                            aria-expanded={showDetails}
                        >
                            <span className="text-[11px] font-bold text-white/60">
                                이벤트 상세
                                <span className="ml-2 font-medium text-white/30">히어로·견적 세부 행동</span>
                            </span>
                            <ChevronDown
                                className={cn(
                                    'h-4 w-4 text-white/40 transition-transform',
                                    showDetails && 'rotate-180',
                                )}
                            />
                        </button>
                        {showDetails && (
                            <div className="grid gap-px border-t border-white/5 bg-white/5 sm:grid-cols-2">
                                <DetailList title="히어로" rows={heroDetails} />
                                <DetailList title="견적 단계" rows={quoteDetails} />
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function InsightChip({ label, value }: { label: string; value: number }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-white/50">
            {label}
            <span className="tabular-nums text-white/80">{value.toLocaleString('ko-KR')}</span>
        </span>
    );
}

function DetailList({ title, rows }: { title: string; rows: FunnelEventRow[] }) {
    if (rows.length === 0) {
        return (
            <div className="bg-[#0f0f0f] p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/35">{title}</p>
                <p className="text-xs text-white/25">데이터 없음</p>
            </div>
        );
    }

    const maxSessions = Math.max(1, ...rows.map((r) => r.sessions));

    return (
        <div className="bg-[#0f0f0f] p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/35">{title}</p>
            <ul className="space-y-2">
                {rows.map((row) => (
                    <li key={row.eventName} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="truncate font-medium text-white/70">{row.label}</span>
                            <span className="shrink-0 tabular-nums text-white/50">
                                {row.sessions.toLocaleString('ko-KR')} 세션
                            </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-white/5">
                            <div
                                className="h-full rounded-full bg-teal-500/70"
                                style={{ width: `${Math.round((row.sessions / maxSessions) * 100)}%` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function orderDetailRows(
    rows: FunnelEventRow[],
    order: string[],
    labels: Record<string, string>,
): FunnelEventRow[] {
    const byName = new Map(rows.map((r) => [r.eventName, r]));
    return order
        .map((name) => byName.get(name))
        .filter((r): r is FunnelEventRow => Boolean(r) && (r!.count > 0 || r!.sessions > 0));
}

function buildTrendChart(
    trend: ConversionFunnelTrendPoint[],
    series: typeof TREND_SERIES,
    visible: Record<string, boolean>,
) {
    const width = 600;
    const activeKeys = series.filter((s) => visible[s.key]).map((s) => s.key);
    const max = Math.max(
        1,
        ...trend.flatMap((p) => activeKeys.map((k) => p[k])),
    );
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));

    const columns = trend.map((p) => ({
        date: p.date,
        values: Object.fromEntries(series.map((s) => [s.key, p[s.key]])) as Record<
            keyof Omit<ConversionFunnelTrendPoint, 'date'>,
            number
        >,
    }));

    return { width, max, yTicks, columns };
}
