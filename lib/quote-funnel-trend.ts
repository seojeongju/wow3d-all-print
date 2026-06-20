import { eachDayOfInterval, format, subDays } from 'date-fns';

export type QuoteFunnelTrendPoint = {
    date: string;
    totalQuotes: number;
    ordered: number;
    incart: number;
    abandoned: number;
    draft: number;
};

export type QuoteFunnelSummary = {
    total: number;
    ordered: number;
    incart: number;
    abandoned: number;
    draft: number;
    conversionRate: number;
};

export type QuoteTrafficSource = {
    source: string;
    count: number;
};

export function fillQuoteFunnelTrend(days: QuoteFunnelTrendPoint[], dayCount = 14): QuoteFunnelTrendPoint[] {
    const end = new Date();
    const start = subDays(end, dayCount - 1);
    const byDate = new Map(days.map((d) => [d.date, d]));

    return eachDayOfInterval({ start, end }).map((date) => {
        const key = format(date, 'yyyy-MM-dd');
        return (
            byDate.get(key) ?? {
                date: key,
                totalQuotes: 0,
                ordered: 0,
                incart: 0,
                abandoned: 0,
                draft: 0,
            }
        );
    });
}

export function sumQuoteFunnelTrend(points: QuoteFunnelTrendPoint[]): QuoteFunnelSummary {
    const acc = points.reduce(
        (a, p) => ({
            total: a.total + p.totalQuotes,
            ordered: a.ordered + p.ordered,
            incart: a.incart + p.incart,
            abandoned: a.abandoned + p.abandoned,
            draft: a.draft + p.draft,
        }),
        { total: 0, ordered: 0, incart: 0, abandoned: 0, draft: 0 }
    );
    return {
        ...acc,
        conversionRate: acc.total > 0 ? Math.round((acc.ordered / acc.total) * 1000) / 10 : 0,
    };
}

export function dailyConversionRate(point: QuoteFunnelTrendPoint): number {
    if (point.totalQuotes <= 0) return 0;
    return Math.round((point.ordered / point.totalQuotes) * 1000) / 10;
}

export { formatTrendDateLabel } from '@/lib/sales-trend';
export { formatTrendAxisCount } from '@/lib/visitor-trend';
