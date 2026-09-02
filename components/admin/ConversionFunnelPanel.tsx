'use client';

import { useMemo } from 'react';
import type { ComponentType } from 'react';
import {
    MousePointerClick,
    Upload,
    ImageIcon,
    FileBox,
    Sparkles,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    type QuoteFunnelSummary,
} from '@/lib/conversion-events';

type Props = {
    heroRows: FunnelEventRow[];
    heroSummary: HeroFunnelSummary;
    quoteRows: FunnelEventRow[];
    quoteSummary: QuoteFunnelSummary;
    trend: ConversionFunnelTrendPoint[];
    dayCount?: number;
};

const HERO_ORDER = [
    HERO_CONVERSION_EVENTS.VIEW,
    HERO_CONVERSION_EVENTS.CTA_FILE,
    HERO_CONVERSION_EVENTS.FORK_FILE,
    HERO_CONVERSION_EVENTS.DROP_FILE,
    HERO_CONVERSION_EVENTS.CTA_PHOTO,
    HERO_CONVERSION_EVENTS.FORK_PHOTO,
    HERO_CONVERSION_EVENTS.DROP_PHOTO,
    HERO_CONVERSION_EVENTS.SAMPLE_TRY,
];

const QUOTE_ORDER = [
    QUOTE_CONVERSION_EVENTS.PAGE_VIEW,
    QUOTE_CONVERSION_EVENTS.ENTRY_FILE,
    QUOTE_CONVERSION_EVENTS.ENTRY_PHOTO,
    QUOTE_CONVERSION_EVENTS.FILE_UPLOADED,
    QUOTE_CONVERSION_EVENTS.ANALYSIS_COMPLETE,
    QUOTE_CONVERSION_EVENTS.ESTIMATE_VIEW,
    QUOTE_CONVERSION_EVENTS.ADD_TO_CART,
    CHECKOUT_CONVERSION_EVENTS.ORDER_COMPLETE,
];

const TREND_SERIES: { key: keyof Omit<ConversionFunnelTrendPoint, 'date'>; label: string; color: string }[] = [
    { key: 'heroView', label: '히어로', color: '#2dd4bf' },
    { key: 'quotePageView', label: '견적 진입', color: '#60a5fa' },
    { key: 'quoteEstimate', label: '견적 확인', color: '#a78bfa' },
    { key: 'quoteAddToCart', label: '장바구니', color: '#f97316' },
    { key: 'orderComplete', label: '주문', color: '#34d399' },
];

export default function ConversionFunnelPanel({
    heroRows,
    heroSummary,
    quoteRows,
    quoteSummary,
    trend,
    dayCount = 14,
}: Props) {
    const heroOrdered = orderRows(heroRows, HERO_ORDER, HERO_EVENT_LABELS);
    const quoteOrdered = orderRows(quoteRows, QUOTE_ORDER, {
        ...QUOTE_EVENT_LABELS,
        [CHECKOUT_CONVERSION_EVENTS.ORDER_COMPLETE]: '주문 완료',
    });

    const chart = useMemo(() => buildBarChart(trend, TREND_SERIES), [trend]);

    return (
        <Card className="overflow-hidden border-white/5 bg-[#0f0f0f]">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
                    <TrendingUp className="h-4 w-4 text-teal-400" />
                    전환 퍼널 추적
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                        최근 {dayCount}일
                    </span>
                </CardTitle>
                <p className="text-xs leading-relaxed text-white/45 break-keep">
                    히어로 → 견적 → 장바구니 → 주문까지 단계별 이탈을 확인합니다.
                </p>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
                {/* Summary strip */}
                <div className="grid gap-px border-b border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCell icon={Sparkles} label="히어로 노출" value={String(heroSummary.views)} sub="세션" />
                    <SummaryCell icon={FileBox} label="견적 페이지" value={String(quoteSummary.pageViews)} sub={`견적확인 ${quoteSummary.estimateRate}%`} />
                    <SummaryCell icon={ShoppingCart} label="장바구니" value={String(quoteSummary.addToCart)} sub={`전환 ${quoteSummary.cartRate}%`} />
                    <SummaryCell icon={Upload} label="3D/사진 intent" value={`${heroSummary.fileIntent}/${heroSummary.photoIntent}`} sub="파일/사진" />
                </div>

                {/* Daily trend */}
                <div className="border-b border-white/5 p-5">
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/35">일별 추이</p>
                    {trend.length === 0 ? (
                        <p className="py-6 text-center text-xs text-white/30">일별 데이터 없음</p>
                    ) : (
                        <>
                            <div className="mb-3 flex flex-wrap gap-3">
                                {TREND_SERIES.map((s) => (
                                    <span key={s.key} className="flex items-center gap-1.5 text-[10px] font-bold text-white/50">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                                        {s.label}
                                    </span>
                                ))}
                            </div>
                            <div className="overflow-x-auto">
                                <div className="flex min-w-[640px] items-end gap-1.5" style={{ height: 140 }}>
                                    {chart.map((col) => (
                                        <div key={col.date} className="flex flex-1 flex-col items-center gap-1">
                                            <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                                                {TREND_SERIES.map((s) => {
                                                    const h = col.heights[s.key];
                                                    return (
                                                        <div
                                                            key={s.key}
                                                            title={`${s.label}: ${col.values[s.key]}`}
                                                            className="w-full max-w-[6px] rounded-t-sm transition-all"
                                                            style={{
                                                                height: `${h}%`,
                                                                backgroundColor: s.color,
                                                                minHeight: col.values[s.key] > 0 ? 4 : 0,
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <span className="text-[9px] font-bold text-white/30">{formatFunnelDateLabel(col.date)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <FunnelTable title="히어로" rows={heroOrdered} empty="히어로 이벤트 없음" />
                <FunnelTable title="견적·주문" rows={quoteOrdered} empty="견적 퍼널 이벤트 없음" />
            </CardContent>
        </Card>
    );
}

function orderRows(
    rows: FunnelEventRow[],
    order: string[],
    labels: Record<string, string>,
): FunnelEventRow[] {
    const byName = new Map(rows.map((r) => [r.eventName, r]));
    return order.map((name) => byName.get(name)).filter(Boolean) as FunnelEventRow[];
}

function FunnelTable({ title, rows, empty }: { title: string; rows: FunnelEventRow[]; empty: string }) {
    return (
        <div className="border-b border-white/5 last:border-0">
            <p className="border-b border-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white/35">
                {title}
            </p>
            {rows.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-white/30">{empty}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/35">
                                <th className="px-5 py-2.5">이벤트</th>
                                <th className="px-4 py-2.5 text-right">발생</th>
                                <th className="px-5 py-2.5 text-right">세션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.eventName} className="border-b border-white/5 last:border-0">
                                    <td className="px-5 py-2.5 font-medium text-white/75">{row.label}</td>
                                    <td className="px-4 py-2.5 text-right font-black tabular-nums text-white">
                                        {row.count.toLocaleString('ko-KR')}
                                    </td>
                                    <td className="px-5 py-2.5 text-right tabular-nums text-white/50">
                                        {row.sessions.toLocaleString('ko-KR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function SummaryCell({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <div className="bg-[#0f0f0f] p-5">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/35">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="text-2xl font-black tabular-nums text-white">{value}</p>
            <p className="mt-0.5 text-[11px] font-bold text-teal-400/80">{sub}</p>
        </div>
    );
}

function buildBarChart(
    trend: ConversionFunnelTrendPoint[],
    series: typeof TREND_SERIES,
) {
    const max = Math.max(
        1,
        ...trend.flatMap((p) => series.map((s) => p[s.key])),
    );
    return trend.map((p) => ({
        date: p.date,
        values: Object.fromEntries(series.map((s) => [s.key, p[s.key]])) as Record<
            keyof Omit<ConversionFunnelTrendPoint, 'date'>,
            number
        >,
        heights: Object.fromEntries(
            series.map((s) => [s.key, Math.round((p[s.key] / max) * 100)]),
        ) as Record<keyof Omit<ConversionFunnelTrendPoint, 'date'>, number>,
    }));
}
