import {
    eachDayOfInterval,
    eachMonthOfInterval,
    eachWeekOfInterval,
    format,
    parseISO,
    startOfMonth,
    startOfWeek,
    subDays,
    subMonths,
    subWeeks,
} from 'date-fns'
import type { SalesTrendPoint } from '@/lib/sales-trend'
import type { VisitorTrendPoint } from '@/lib/visitor-trend'
import type { ConversionFunnelTrendPoint } from '@/lib/conversion-events'

export type StatsGranularity = 'day' | 'week' | 'month'

export const STATS_RANGE = {
    day: {
        lookbackDays: 14,
        bucketCount: 14,
        label: '최근 14일',
        shortLabel: '일간',
        unitLabel: '일',
    },
    week: {
        lookbackDays: 84,
        bucketCount: 12,
        label: '최근 12주',
        shortLabel: '주간',
        unitLabel: '주',
    },
    month: {
        lookbackDays: 365,
        bucketCount: 12,
        label: '최근 12개월',
        shortLabel: '월간',
        unitLabel: '개월',
    },
} as const

export function parseStatsGranularity(raw: string | null | undefined): StatsGranularity {
    if (raw === 'week' || raw === 'month' || raw === 'day') return raw
    return 'day'
}

export function statsRangeOffsetDays(g: StatsGranularity): number {
    return STATS_RANGE[g].lookbackDays - 1
}

/** SQLite date('now', '-N days') 용 N */
export function statsSqlOffsetDays(g: StatsGranularity): number {
    return statsRangeOffsetDays(g)
}

function weekBucketKey(dateStr: string): string {
    const d = parseISO(dateStr.slice(0, 10))
    return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

function monthBucketKey(dateStr: string): string {
    const d = parseISO(dateStr.slice(0, 10))
    return format(startOfMonth(d), 'yyyy-MM-dd')
}

function bucketKey(dateStr: string, g: StatsGranularity): string {
    if (g === 'week') return weekBucketKey(dateStr)
    if (g === 'month') return monthBucketKey(dateStr)
    return dateStr.slice(0, 10)
}

export function formatStatsPeriodLabel(dateStr: string, g: StatsGranularity = 'day'): string {
    const key = dateStr.slice(0, 10)
    if (g === 'month') {
        const [, m] = key.split('-')
        return `${Number(m)}월`
    }
    if (g === 'week') {
        const [, m, d] = key.split('-')
        return `${Number(m)}/${Number(d)}주`
    }
    const [, m, d] = key.split('-')
    return `${Number(m)}/${Number(d)}`
}

function emptySales(date: string): SalesTrendPoint {
    return { date, orderCount: 0, amount: 0, paidAmount: 0, outstandingAmount: 0 }
}

function emptyVisitor(date: string): VisitorTrendPoint {
    return {
        date,
        pageViews: 0,
        uniqueSessions: 0,
        memberSessions: 0,
        quotePageViews: 0,
    }
}

function emptyFunnel(date: string): ConversionFunnelTrendPoint {
    return {
        date,
        heroView: 0,
        quotePageView: 0,
        quoteEstimate: 0,
        quoteAddToCart: 0,
        orderComplete: 0,
    }
}

function bucketDates(g: StatsGranularity): string[] {
    const end = new Date()
    if (g === 'week') {
        const start = startOfWeek(subWeeks(end, STATS_RANGE.week.bucketCount - 1), {
            weekStartsOn: 1,
        })
        return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((d) =>
            format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        )
    }
    if (g === 'month') {
        const start = startOfMonth(subMonths(end, STATS_RANGE.month.bucketCount - 1))
        return eachMonthOfInterval({ start, end }).map((d) => format(startOfMonth(d), 'yyyy-MM-dd'))
    }
    const start = subDays(end, STATS_RANGE.day.bucketCount - 1)
    return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'))
}

export function aggregateSalesTrend(
    daily: SalesTrendPoint[],
    g: StatsGranularity
): SalesTrendPoint[] {
    if (g === 'day') {
        const byDate = new Map(daily.map((p) => [p.date.slice(0, 10), p]))
        return bucketDates(g).map((date) => byDate.get(date) ?? emptySales(date))
    }

    const acc = new Map<string, SalesTrendPoint>()
    for (const p of daily) {
        const key = bucketKey(p.date, g)
        const cur = acc.get(key) ?? emptySales(key)
        acc.set(key, {
            date: key,
            orderCount: cur.orderCount + p.orderCount,
            amount: cur.amount + p.amount,
            paidAmount: cur.paidAmount + p.paidAmount,
            outstandingAmount: cur.outstandingAmount + p.outstandingAmount,
        })
    }
    return bucketDates(g).map((date) => acc.get(date) ?? emptySales(date))
}

export function aggregateVisitorTrend(
    daily: VisitorTrendPoint[],
    g: StatsGranularity
): VisitorTrendPoint[] {
    if (g === 'day') {
        const byDate = new Map(daily.map((p) => [p.date.slice(0, 10), p]))
        return bucketDates(g).map((date) => byDate.get(date) ?? emptyVisitor(date))
    }

    const acc = new Map<string, VisitorTrendPoint>()
    for (const p of daily) {
        const key = bucketKey(p.date, g)
        const cur = acc.get(key) ?? emptyVisitor(key)
        acc.set(key, {
            date: key,
            pageViews: cur.pageViews + p.pageViews,
            uniqueSessions: cur.uniqueSessions + p.uniqueSessions,
            memberSessions: cur.memberSessions + p.memberSessions,
            quotePageViews: cur.quotePageViews + p.quotePageViews,
        })
    }
    return bucketDates(g).map((date) => acc.get(date) ?? emptyVisitor(date))
}

export function aggregateConversionFunnelTrend(
    daily: ConversionFunnelTrendPoint[],
    g: StatsGranularity
): ConversionFunnelTrendPoint[] {
    if (g === 'day') {
        const byDate = new Map(daily.map((p) => [p.date.slice(0, 10), p]))
        return bucketDates(g).map((date) => byDate.get(date) ?? emptyFunnel(date))
    }

    const acc = new Map<string, ConversionFunnelTrendPoint>()
    for (const p of daily) {
        const key = bucketKey(p.date, g)
        const cur = acc.get(key) ?? emptyFunnel(key)
        acc.set(key, {
            date: key,
            heroView: cur.heroView + p.heroView,
            quotePageView: cur.quotePageView + p.quotePageView,
            quoteEstimate: cur.quoteEstimate + p.quoteEstimate,
            quoteAddToCart: cur.quoteAddToCart + p.quoteAddToCart,
            orderComplete: cur.orderComplete + p.orderComplete,
        })
    }
    return bucketDates(g).map((date) => acc.get(date) ?? emptyFunnel(date))
}
