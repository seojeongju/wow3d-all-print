'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Activity, FileText, ShoppingCart, MousePointer2, XCircle, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    type QuoteFunnelTrendPoint,
    type QuoteFunnelSummary,
    type QuoteTrafficSource,
    fillQuoteFunnelTrend,
    sumQuoteFunnelTrend,
    dailyConversionRate,
    formatTrendAxisCount,
    formatTrendDateLabel,
} from '@/lib/quote-funnel-trend';

type BarKey = 'totalQuotes' | 'ordered' | 'incart';
type SeriesKey = BarKey | 'conversionRate';

const BAR_SERIES: { key: BarKey; label: string; shortLabel: string; color: string }[] = [
    { key: 'totalQuotes', label: '신규 견적', shortLabel: '신규', color: '#22c55e' },
    { key: 'ordered', label: '주문 전환', shortLabel: '주문', color: '#f97316' },
    { key: 'incart', label: '장바구니', shortLabel: '장바구니', color: '#3b82f6' },
];

const CHART_H = 220;
const PAD = { top: 16, right: 44, bottom: 28, left: 52 };

type Props = {
    trend: QuoteFunnelTrendPoint[];
    summary?: QuoteFunnelSummary;
    sources?: QuoteTrafficSource[];
    dayCount?: number;
};

const SOURCE_COLORS = ['bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500'];

export default function QuoteFunnelTrendPanel({
    trend,
    summary,
    sources = [],
    dayCount = 14,
}: Props) {
    const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
        totalQuotes: true,
        ordered: true,
        incart: true,
        conversionRate: true,
    });

    const points = useMemo(() => fillQuoteFunnelTrend(trend, dayCount), [trend, dayCount]);
    const totals = useMemo(() => summary ?? sumQuoteFunnelTrend(points), [summary, points]);

    const maxBar = useMemo(() => {
        let max = 1;
        for (const p of points) {
            if (visible.totalQuotes) max = Math.max(max, p.totalQuotes);
            if (visible.ordered) max = Math.max(max, p.ordered);
            if (visible.incart) max = Math.max(max, p.incart);
        }
        return max;
    }, [points, visible]);

    const maxRate = 100;

    const innerW = 640;
    const innerH = CHART_H - PAD.top - PAD.bottom;
    const n = points.length;
    const groupW = n > 0 ? innerW / n : innerW;
    const barW = Math.min(10, Math.max(4, groupW / 5));

    const barTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxBar * t));
    const rateTicks = [0, 25, 50, 75, 100];

    const linePath = useMemo(() => {
        if (!visible.conversionRate || n === 0) return '';
        return points
            .map((p, i) => {
                const rate = dailyConversionRate(p);
                const x = PAD.left + groupW * i + groupW / 2;
                const y = PAD.top + innerH - (rate / maxRate) * innerH;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');
    }, [points, visible.conversionRate, groupW, innerH, n]);

    const hasAnyData = points.some(
        (p) => p.totalQuotes > 0 || p.ordered > 0 || p.incart > 0 || p.abandoned > 0
    );

    const totalSourceCount = sources.reduce((a, s) => a + s.count, 0);

    const kpiCards = [
        { label: '신규 견적', value: totals.total, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: '주문 전환', value: totals.ordered, sub: `${totals.conversionRate}%`, icon: ShoppingCart, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: '장바구니', value: totals.incart, icon: MousePointer2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: '견적 이탈', value: totals.abandoned, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        { label: '작성 중', value: totals.draft, icon: PenLine, color: 'text-white/50', bg: 'bg-white/5' },
    ];

    const tableRows: { key: string; label: string; getValue: (p: QuoteFunnelTrendPoint) => string; getTotal: () => string; seriesKey?: SeriesKey; color?: string }[] = [
        { key: 'total', label: '신규 견적', getValue: (p) => String(p.totalQuotes), getTotal: () => `${totals.total}건`, seriesKey: 'totalQuotes', color: '#22c55e' },
        { key: 'ordered', label: '주문 전환', getValue: (p) => String(p.ordered), getTotal: () => `${totals.ordered}건`, seriesKey: 'ordered', color: '#f97316' },
        { key: 'incart', label: '장바구니', getValue: (p) => String(p.incart), getTotal: () => `${totals.incart}건`, seriesKey: 'incart', color: '#3b82f6' },
        { key: 'abandoned', label: '견적 이탈', getValue: (p) => String(p.abandoned), getTotal: () => `${totals.abandoned}건`, color: '#f43f5e' },
        { key: 'rate', label: '전환율', getValue: (p) => `${dailyConversionRate(p)}%`, getTotal: () => `${totals.conversionRate}%`, seriesKey: 'conversionRate', color: '#a855f7' },
    ];

    return (
        <Card className="bg-[#0f0f0f] border-white/5 overflow-hidden group/quote-funnel">
            <CardHeader className="flex flex-col gap-3 pb-2 px-4 pt-4 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <Link
                        href="/admin/quotes/analytics"
                        className="rounded-lg hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="견적 유입 분석 상세 보기"
                    >
                        <CardTitle className="text-base font-bold text-white group-hover/quote-funnel:text-primary transition-colors flex items-center gap-2">
                            견적 유입 분석
                            <ChevronRight className="w-3.5 h-3.5 text-white/0 group-hover/quote-funnel:text-white/40 transition-colors" />
                        </CardTitle>
                        <p className="text-[11px] text-white/40 mt-0.5">
                            최근 {dayCount}일 · 견적 퍼널 · 유입 경로 · 전환율
                        </p>
                    </Link>

                    <div className="flex flex-wrap gap-1.5">
                        {[...BAR_SERIES, { key: 'conversionRate' as const, label: '전환율', shortLabel: '전환%', color: '#a855f7' }].map((s) => (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setVisible((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
                                className={cn(
                                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-bold transition-all',
                                    visible[s.key as SeriesKey]
                                        ? 'border-white/15 bg-white/[0.06] text-white/80'
                                        : 'border-white/5 bg-transparent text-white/30 line-through'
                                )}
                                aria-pressed={visible[s.key as SeriesKey]}
                            >
                                <span
                                    className="w-2 h-2 rounded-sm shrink-0"
                                    style={{ backgroundColor: visible[s.key as SeriesKey] ? s.color : '#444' }}
                                />
                                {s.shortLabel}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {kpiCards.map((k) => (
                        <div
                            key={k.label}
                            className={cn('rounded-lg border border-white/5 px-3 py-2.5 flex items-center gap-2.5', k.bg)}
                        >
                            <k.icon className={cn('w-4 h-4 shrink-0', k.color)} />
                            <div className="min-w-0">
                                <div className="text-[9px] font-bold text-white/40 uppercase tracking-wide truncate">{k.label}</div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-black text-white">{k.value.toLocaleString()}</span>
                                    {'sub' in k && k.sub && (
                                        <span className={cn('text-[10px] font-bold', k.color)}>{k.sub}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-3 space-y-4">
                {!hasAnyData ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-white/20 gap-2 border border-dashed border-white/5 rounded-xl">
                        <Activity className="w-6 h-6 opacity-20" />
                        <span className="text-xs">최근 {dayCount}일 견적 유입 데이터 없음</span>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 lg:grid-cols-12">
                            <div className="lg:col-span-8 w-full overflow-x-auto">
                                <svg
                                    viewBox={`0 0 ${innerW + PAD.left + PAD.right} ${CHART_H}`}
                                    className="w-full min-w-[480px] h-[220px]"
                                    role="img"
                                    aria-label="견적 유입 퍼널 차트"
                                >
                                    {[0, 1, 2, 3, 4].map((i) => {
                                        const y = PAD.top + (innerH / 4) * i;
                                        return (
                                            <line key={i} x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                                        );
                                    })}

                                    {barTicks.map((tick, i) => {
                                        const y = PAD.top + innerH - (tick / maxBar) * innerH;
                                        return (
                                            <text key={`b-${i}`} x={PAD.left - 8} y={y + 3} textAnchor="end" className="fill-white/35 text-[9px] font-medium">
                                                {formatTrendAxisCount(tick)}
                                            </text>
                                        );
                                    })}

                                    {visible.conversionRate &&
                                        rateTicks.map((tick) => {
                                            const y = PAD.top + innerH - (tick / maxRate) * innerH;
                                            return (
                                                <text key={`r-${tick}`} x={PAD.left + innerW + 8} y={y + 3} textAnchor="start" className="fill-purple-400/60 text-[9px] font-medium">
                                                    {tick}%
                                                </text>
                                            );
                                        })}

                                    {points.map((p, i) => {
                                        const gx = PAD.left + groupW * i + groupW / 2;
                                        const bars: { key: BarKey; value: number; color: string; offset: number }[] = [];
                                        if (visible.totalQuotes) bars.push({ key: 'totalQuotes', value: p.totalQuotes, color: '#22c55e', offset: -1.5 });
                                        if (visible.ordered) bars.push({ key: 'ordered', value: p.ordered, color: '#f97316', offset: -0.5 });
                                        if (visible.incart) bars.push({ key: 'incart', value: p.incart, color: '#3b82f6', offset: 0.5 });

                                        return (
                                            <g key={p.date}>
                                                {bars.map((b) => {
                                                    const h = maxBar > 0 ? (b.value / maxBar) * innerH : 0;
                                                    const x = gx + b.offset * barW - barW / 2;
                                                    const y = PAD.top + innerH - h;
                                                    return (
                                                        <rect key={b.key} x={x} y={y} width={barW} height={Math.max(h, b.value > 0 ? 2 : 0)} fill={b.color} rx={2} opacity={0.85}>
                                                            <title>{`${formatTrendDateLabel(p.date)} ${BAR_SERIES.find((s) => s.key === b.key)?.label}: ${b.value}건`}</title>
                                                        </rect>
                                                    );
                                                })}
                                                <text x={gx} y={CHART_H - 6} textAnchor="middle" className="fill-white/30 text-[8px] font-medium">
                                                    {formatTrendDateLabel(p.date)}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {visible.conversionRate && linePath && (
                                        <>
                                            <path d={linePath} fill="none" stroke="#a855f7" strokeWidth={2} strokeLinejoin="round" />
                                            {points.map((p, i) => {
                                                const rate = dailyConversionRate(p);
                                                if (p.totalQuotes <= 0) return null;
                                                const x = PAD.left + groupW * i + groupW / 2;
                                                const y = PAD.top + innerH - (rate / maxRate) * innerH;
                                                return (
                                                    <g key={`dot-${p.date}`}>
                                                        <circle cx={x} cy={y} r={4} fill="#a855f7" stroke="#0f0f0f" strokeWidth={2}>
                                                            <title>{`${formatTrendDateLabel(p.date)} 전환율 ${rate}%`}</title>
                                                        </circle>
                                                        <text x={x} y={y - 8} textAnchor="middle" className="fill-purple-300 text-[8px] font-bold">
                                                            {rate}%
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </>
                                    )}

                                    <text x={8} y={PAD.top + 4} className="fill-white/25 text-[8px] font-bold">건</text>
                                    {visible.conversionRate && (
                                        <text x={PAD.left + innerW + 8} y={PAD.top + 4} className="fill-purple-400/50 text-[8px] font-bold">%</text>
                                    )}
                                </svg>
                            </div>

                            <div className="lg:col-span-4 rounded-xl border border-white/10 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">견적 유입 경로</span>
                                    <span className="text-[9px] text-white/30">최근 {dayCount}일</span>
                                </div>
                                {sources.length > 0 ? (
                                    <div className="space-y-3">
                                        {sources.map((src, idx) => {
                                            const pct = totalSourceCount > 0 ? Math.round((src.count / totalSourceCount) * 100) : 0;
                                            return (
                                                <div key={src.source} className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-bold">
                                                        <span className="text-white/60 capitalize flex items-center gap-1.5 truncate">
                                                            <span className={cn('w-2 h-2 rounded-full shrink-0', SOURCE_COLORS[idx % SOURCE_COLORS.length])} />
                                                            {src.source}
                                                        </span>
                                                        <span className="text-white shrink-0 ml-2">
                                                            {pct}% <span className="text-white/30 font-medium">({src.count})</span>
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn('h-full rounded-full transition-all', SOURCE_COLORS[idx % SOURCE_COLORS.length])}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-white/20 text-xs">유입 경로 데이터 없음</div>
                                )}
                                <Link
                                    href="/admin/quotes/analytics"
                                    className="block text-center text-[10px] font-bold text-primary hover:text-white pt-1 transition-colors"
                                >
                                    상세 분석 보기 →
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-[10px]">
                                    <thead>
                                        <tr className="bg-orange-600/90 text-white">
                                            <th className="px-3 py-2 text-left font-bold w-24 sticky left-0 bg-orange-600/95 z-10">구분</th>
                                            {points.map((p) => (
                                                <th key={p.date} className="px-2 py-2 text-center font-bold whitespace-nowrap">
                                                    {formatTrendDateLabel(p.date)}
                                                </th>
                                            ))}
                                            <th className="px-3 py-2 text-center font-black bg-orange-700/80 whitespace-nowrap">합계</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableRows.map((row, ri) => {
                                            const showRow = !row.seriesKey || visible[row.seriesKey];
                                            return (
                                                <tr
                                                    key={row.key}
                                                    className={cn(
                                                        'border-t border-white/5',
                                                        ri % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent',
                                                        !showRow && 'opacity-40'
                                                    )}
                                                >
                                                    <td className="px-3 py-2 font-bold text-white/70 sticky left-0 bg-[#141414] z-10">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            {row.color && <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: row.color }} />}
                                                            {row.label}
                                                        </span>
                                                    </td>
                                                    {points.map((p) => (
                                                        <td key={`${row.key}-${p.date}`} className="px-2 py-2 text-center text-white/60 font-medium tabular-nums">
                                                            {showRow ? row.getValue(p) : '—'}
                                                        </td>
                                                    ))}
                                                    <td className="px-3 py-2 text-center font-black text-white bg-white/[0.04] tabular-nums">
                                                        {showRow ? row.getTotal() : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
