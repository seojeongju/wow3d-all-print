import { eachDayOfInterval, format, subDays } from 'date-fns';

export type VisitorTrendPoint = {
    date: string;
    pageViews: number;
    uniqueSessions: number;
    memberSessions: number;
    quotePageViews: number;
};

export function fillVisitorTrend(days: VisitorTrendPoint[], dayCount = 14): VisitorTrendPoint[] {
    const end = new Date();
    const start = subDays(end, dayCount - 1);
    const byDate = new Map(days.map((d) => [d.date, d]));

    return eachDayOfInterval({ start, end }).map((date) => {
        const key = format(date, 'yyyy-MM-dd');
        return (
            byDate.get(key) ?? {
                date: key,
                pageViews: 0,
                uniqueSessions: 0,
                memberSessions: 0,
                quotePageViews: 0,
            }
        );
    });
}

export function sumVisitorTrend(points: VisitorTrendPoint[]) {
    return points.reduce(
        (acc, p) => ({
            pageViews: acc.pageViews + p.pageViews,
            uniqueSessions: acc.uniqueSessions + p.uniqueSessions,
            memberSessions: acc.memberSessions + p.memberSessions,
            quotePageViews: acc.quotePageViews + p.quotePageViews,
        }),
        { pageViews: 0, uniqueSessions: 0, memberSessions: 0, quotePageViews: 0 }
    );
}

export function formatTrendAxisCount(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return String(Math.round(value));
}

export { formatTrendDateLabel } from '@/lib/sales-trend';
