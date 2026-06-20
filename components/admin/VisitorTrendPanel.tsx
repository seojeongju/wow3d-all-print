'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    type VisitorTrendPoint,
    fillVisitorTrend,
    sumVisitorTrend,
    formatTrendAxisCount,
    formatTrendDateLabel,
} from '@/lib/visitor-trend';

type SeriesKey = 'pageViews' | 'uniqueSessions' | 'memberSessions' | 'quotePageViews';

const SERIES: {
    key: SeriesKey;
    label: string;
    shortLabel: string;
    color: string;
    type: 'bar' | 'line';
}[] = [
    { key: 'pageViews', label: '페이지뷰', shortLabel: 'PV', color: '#22c55e', type: 'bar' },
    { key: 'uniqueSessions', label: '고유 세션', shortLabel: '세션', color: '#f97316', type: 'bar' },
    { key: 'memberSessions', label: '회원 세션', shortLabel: '회원', color: '#3b82f6', type: 'bar' },
    { key: 'quotePageViews', label: '견적·체험 페이지', shortLabel: '견적PV', color: '#a855f7', type: 'line' },
];

const CHART_H = 220;
const PAD = { top: 16, right: 44, bottom: 28, left: 52 };

type Props = {
    data: VisitorTrendPoint[];
    dayCount?: number;
};

export default function VisitorTrendPanel({ data, dayCount = 14 }: Props) {
    const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
        pageViews: true,
        uniqueSessions: true,
        memberSessions: true,
        quotePageViews: true,
    });

    const points = useMemo(() => fillVisitorTrend(data, dayCount), [data, dayCount]);
    const totals = useMemo(() => sumVisitorTrend(points), [points]);

    const maxBar = useMemo(() => {
        let max = 1;
        for (const p of points) {
            if (visible.pageViews) max = Math.max(max, p.pageViews);
            if (visible.uniqueSessions) max = Math.max(max, p.uniqueSessions);
            if (visible.memberSessions) max = Math.max(max, p.memberSessions);
        }
        return max;
    }, [points, visible]);

    const maxLine = useMemo(() => {
        if (!visible.quotePageViews) return 1;
        return Math.max(1, ...points.map((p) => p.quotePageViews));
    }, [points, visible.quotePageViews]);

    const innerW = 640;
    const innerH = CHART_H - PAD.top - PAD.bottom;
    const n = points.length;
    const groupW = n > 0 ? innerW / n : innerW;
    const barW = Math.min(10, Math.max(4, groupW / 5));

    const barTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxBar * t));
    const lineTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxLine * t));

    const linePath = useMemo(() => {
        if (!visible.quotePageViews || n === 0) return '';
        return points
            .map((p, i) => {
                const x = PAD.left + groupW * i + groupW / 2;
                const y = PAD.top + innerH - (p.quotePageViews / maxLine) * innerH;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');
    }, [points, visible.quotePageViews, groupW, innerH, maxLine, n]);

    const toggleSeries = (key: SeriesKey) => {
        setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const tableRows: { key: SeriesKey; label: string; format: (v: number) => string }[] = [
        { key: 'uniqueSessions', label: '고유 세션', format: (v) => `${v.toLocaleString()}회` },
        { key: 'pageViews', label: '페이지뷰', format: (v) => `${v.toLocaleString()}회` },
        { key: 'memberSessions', label: '회원 세션', format: (v) => `${v.toLocaleString()}회` },
        { key: 'quotePageViews', label: '견적·체험 PV', format: (v) => `${v.toLocaleString()}회` },
    ];

    const hasAnyData = points.some(
        (p) =>
            p.pageViews > 0 ||
            p.uniqueSessions > 0 ||
            p.memberSessions > 0 ||
            p.quotePageViews > 0
    );

    return (
        <Card className="lg:col-span-7 bg-[#0f0f0f] border-white/5 overflow-hidden group/visitors">
            <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-2 px-4 pt-4 border-b border-white/5">
                <Link
                    href="/admin/quotes/analytics"
                    className="rounded-lg hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="견적 유입 분석 보기"
                >
                    <CardTitle className="text-base font-bold text-white group-hover/visitors:text-primary transition-colors flex items-center gap-2">
                        일별 방문자 추이
                        <ChevronRight className="w-3.5 h-3.5 text-white/0 group-hover/visitors:text-white/40 transition-colors" />
                    </CardTitle>
                    <p className="text-[11px] text-white/40 mt-0.5">
                        최근 {dayCount}일 · PV·세션·회원·견적 페이지 동시 비교
                    </p>
                </Link>

                <div className="flex flex-wrap gap-1.5">
                    {SERIES.map((s) => (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => toggleSeries(s.key)}
                            className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-bold transition-all',
                                visible[s.key]
                                    ? 'border-white/15 bg-white/[0.06] text-white/80'
                                    : 'border-white/5 bg-transparent text-white/30 line-through'
                            )}
                            aria-pressed={visible[s.key]}
                        >
                            <span
                                className="w-2 h-2 rounded-sm shrink-0"
                                style={{ backgroundColor: visible[s.key] ? s.color : '#444' }}
                            />
                            {s.shortLabel}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-3 space-y-4">
                {!hasAnyData ? (
                    <div className="h-[280px] flex flex-col items-center justify-center text-white/20 gap-2 border border-dashed border-white/5 rounded-xl">
                        <Activity className="w-6 h-6 opacity-20" />
                        <span className="text-xs">최근 {dayCount}일 방문 데이터 없음</span>
                    </div>
                ) : (
                    <>
                        <div className="w-full overflow-x-auto">
                            <svg
                                viewBox={`0 0 ${innerW + PAD.left + PAD.right} ${CHART_H}`}
                                className="w-full min-w-[520px] h-[220px]"
                                role="img"
                                aria-label="일별 방문자 추이 차트"
                            >
                                {[0, 1, 2, 3, 4].map((i) => {
                                    const y = PAD.top + (innerH / 4) * i;
                                    return (
                                        <line
                                            key={i}
                                            x1={PAD.left}
                                            x2={PAD.left + innerW}
                                            y1={y}
                                            y2={y}
                                            stroke="rgba(255,255,255,0.06)"
                                            strokeDasharray="4 4"
                                        />
                                    );
                                })}

                                {barTicks.map((tick, i) => {
                                    const y = PAD.top + innerH - (tick / maxBar) * innerH;
                                    return (
                                        <text
                                            key={`b-${i}`}
                                            x={PAD.left - 8}
                                            y={y + 3}
                                            textAnchor="end"
                                            className="fill-white/35 text-[9px] font-medium"
                                        >
                                            {formatTrendAxisCount(tick)}
                                        </text>
                                    );
                                })}

                                {visible.quotePageViews &&
                                    lineTicks.map((tick, i) => {
                                        const y = PAD.top + innerH - (tick / maxLine) * innerH;
                                        return (
                                            <text
                                                key={`l-${i}`}
                                                x={PAD.left + innerW + 8}
                                                y={y + 3}
                                                textAnchor="start"
                                                className="fill-purple-400/60 text-[9px] font-medium"
                                            >
                                                {tick}
                                            </text>
                                        );
                                    })}

                                {points.map((p, i) => {
                                    const gx = PAD.left + groupW * i + groupW / 2;
                                    const bars: { key: SeriesKey; value: number; color: string; offset: number }[] = [];
                                    if (visible.pageViews) bars.push({ key: 'pageViews', value: p.pageViews, color: '#22c55e', offset: -1.5 });
                                    if (visible.uniqueSessions) bars.push({ key: 'uniqueSessions', value: p.uniqueSessions, color: '#f97316', offset: -0.5 });
                                    if (visible.memberSessions) bars.push({ key: 'memberSessions', value: p.memberSessions, color: '#3b82f6', offset: 0.5 });

                                    return (
                                        <g key={p.date}>
                                            {bars.map((b) => {
                                                const h = maxBar > 0 ? (b.value / maxBar) * innerH : 0;
                                                const x = gx + b.offset * barW - barW / 2;
                                                const y = PAD.top + innerH - h;
                                                return (
                                                    <rect
                                                        key={b.key}
                                                        x={x}
                                                        y={y}
                                                        width={barW}
                                                        height={Math.max(h, b.value > 0 ? 2 : 0)}
                                                        fill={b.color}
                                                        rx={2}
                                                        opacity={0.85}
                                                    >
                                                        <title>{`${formatTrendDateLabel(p.date)} ${SERIES.find((s) => s.key === b.key)?.label}: ${Math.round(b.value).toLocaleString()}회`}</title>
                                                    </rect>
                                                );
                                            })}
                                            <text
                                                x={gx}
                                                y={CHART_H - 6}
                                                textAnchor="middle"
                                                className="fill-white/30 text-[8px] font-medium"
                                            >
                                                {formatTrendDateLabel(p.date)}
                                            </text>
                                        </g>
                                    );
                                })}

                                {visible.quotePageViews && linePath && (
                                    <>
                                        <path
                                            d={linePath}
                                            fill="none"
                                            stroke="#a855f7"
                                            strokeWidth={2}
                                            strokeLinejoin="round"
                                        />
                                        {points.map((p, i) => {
                                            if (p.quotePageViews <= 0) return null;
                                            const x = PAD.left + groupW * i + groupW / 2;
                                            const y = PAD.top + innerH - (p.quotePageViews / maxLine) * innerH;
                                            return (
                                                <g key={`dot-${p.date}`}>
                                                    <circle cx={x} cy={y} r={4} fill="#a855f7" stroke="#0f0f0f" strokeWidth={2}>
                                                        <title>{`${formatTrendDateLabel(p.date)} 견적·체험 ${p.quotePageViews}회`}</title>
                                                    </circle>
                                                    <text
                                                        x={x}
                                                        y={y - 8}
                                                        textAnchor="middle"
                                                        className="fill-purple-300 text-[8px] font-bold"
                                                    >
                                                        {p.quotePageViews}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </>
                                )}

                                <text x={8} y={PAD.top + 4} className="fill-white/25 text-[8px] font-bold">
                                    회
                                </text>
                                {visible.quotePageViews && (
                                    <text
                                        x={PAD.left + innerW + 8}
                                        y={PAD.top + 4}
                                        className="fill-purple-400/50 text-[8px] font-bold"
                                    >
                                        견적
                                    </text>
                                )}
                            </svg>
                        </div>

                        <div className="rounded-xl border border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-[10px]">
                                    <thead>
                                        <tr className="bg-orange-600/90 text-white">
                                            <th className="px-3 py-2 text-left font-bold w-24 sticky left-0 bg-orange-600/95 z-10">
                                                구분
                                            </th>
                                            {points.map((p) => (
                                                <th key={p.date} className="px-2 py-2 text-center font-bold whitespace-nowrap">
                                                    {formatTrendDateLabel(p.date)}
                                                </th>
                                            ))}
                                            <th className="px-3 py-2 text-center font-black bg-orange-700/80 whitespace-nowrap">
                                                합계
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableRows.map((row, ri) => {
                                            const series = SERIES.find((s) => s.key === row.key)!;
                                            const showRow = visible[row.key];
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
                                                            <span
                                                                className="w-2 h-2 rounded-sm"
                                                                style={{ backgroundColor: series.color }}
                                                            />
                                                            {row.label}
                                                        </span>
                                                    </td>
                                                    {points.map((p) => (
                                                        <td
                                                            key={`${row.key}-${p.date}`}
                                                            className="px-2 py-2 text-center text-white/60 font-medium tabular-nums"
                                                        >
                                                            {showRow ? p[row.key].toLocaleString() : '—'}
                                                        </td>
                                                    ))}
                                                    <td className="px-3 py-2 text-center font-black text-white bg-white/[0.04] tabular-nums">
                                                        {showRow ? row.format(totals[row.key]) : '—'}
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
