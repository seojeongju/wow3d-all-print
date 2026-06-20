import { eachDayOfInterval, format, subDays } from 'date-fns';

export type SalesTrendPoint = {
    date: string;
    orderCount: number;
    amount: number;
    paidAmount: number;
    outstandingAmount: number;
};

export function fillSalesTrend(days: SalesTrendPoint[], dayCount = 14): SalesTrendPoint[] {
    const end = new Date();
    const start = subDays(end, dayCount - 1);
    const byDate = new Map(days.map((d) => [d.date, d]));

    return eachDayOfInterval({ start, end }).map((date) => {
        const key = format(date, 'yyyy-MM-dd');
        return (
            byDate.get(key) ?? {
                date: key,
                orderCount: 0,
                amount: 0,
                paidAmount: 0,
                outstandingAmount: 0,
            }
        );
    });
}

export function sumSalesTrend(points: SalesTrendPoint[]) {
    return points.reduce(
        (acc, p) => ({
            orderCount: acc.orderCount + p.orderCount,
            amount: acc.amount + p.amount,
            paidAmount: acc.paidAmount + p.paidAmount,
            outstandingAmount: acc.outstandingAmount + p.outstandingAmount,
        }),
        { orderCount: 0, amount: 0, paidAmount: 0, outstandingAmount: 0 }
    );
}

export function formatTrendAxisMoney(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return String(Math.round(value));
}

export function formatTrendDateLabel(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    return `${Number(m)}/${Number(d)}`;
}
