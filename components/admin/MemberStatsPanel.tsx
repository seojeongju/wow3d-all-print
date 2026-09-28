'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Loader2, RefreshCw, UserPlus, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AdminChartTooltip,
    ChartDayHitArea,
    useAdminChartHover,
} from '@/components/admin/AdminChartTooltip';
import AdminStatsRangeToggle from '@/components/admin/AdminStatsRangeToggle';
import {
    STATS_RANGE,
    formatStatsPeriodLabel,
    type CountTrendPoint,
    type StatsGranularity,
} from '@/lib/admin-stats-range';
import { formatTrendAxisCount } from '@/lib/visitor-trend';
import { ADMIN_CHART } from '@/lib/admin-chart-theme';

type SignupSummary = {
    total: number;
    today: number;
    last7Days: number;
    thisMonth: number;
    lastMonth: number;
};

type OnlineStats = {
    total: number;
    members: number;
    guests: number;
    windowMinutes: number;
    checkedAt: string;
};

const ONLINE_POLL_MS = 30_000;
const CHART_H = 220;
const PAD = { top: 20, right: 16, bottom: 28, left: 40 };
const INNER_W = 640;

type Props = { token: string | null };

export default function MemberStatsPanel({ token }: Props) {
    const [granularity, setGranularity] = useState<StatsGranularity>('day');
    const [trend, setTrend] = useState<CountTrendPoint[]>([]);
    const [summary, setSummary] = useState<SignupSummary | null>(null);
    const [periodTotal, setPeriodTotal] = useState(0);
    const [trendLoading, setTrendLoading] = useState(true);
    const [online, setOnline] = useState<OnlineStats | null>(null);
    const [onlineLoading, setOnlineLoading] = useState(false);
    const chartHover = useAdminChartHover();

    const authHeaders = useMemo(() => {
        const h: Record<string, string> = {};
        if (token) h.Authorization = `Bearer ${token}`;
        return h;
    }, [token]);

    useEffect(() => {
        let cancelled = false;
        setTrendLoading(true);
        fetch(`/api/admin/users/stats?granularity=${granularity}`, {
            headers: authHeaders,
            cache: 'no-store',
        })
            .then((r) => r.json())
            .then((json) => {
                if (cancelled || !json?.success) return;
                setTrend(Array.isArray(json.data?.trend) ? json.data.trend : []);
                setSummary(json.data?.summary ?? null);
                setPeriodTotal(Number(json.data?.periodTotal ?? 0));
            })
            .catch((e) => console.error('회원 가입 통계 조회 실패', e))
            .finally(() => {
                if (!cancelled) setTrendLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [granularity, authHeaders]);

    const fetchOnline = useCallback(async () => {
        setOnlineLoading(true);
        try {
            const res = await fetch('/api/admin/users/online', {
                headers: authHeaders,
                cache: 'no-store',
            });
            const json = await res.json();
            if (json?.success) setOnline(json.data as OnlineStats);
        } catch (e) {
            console.error('현재 접속자 조회 실패', e);
        } finally {
            setOnlineLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        void fetchOnline();
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') void fetchOnline();
        }, ONLINE_POLL_MS);
        return () => window.clearInterval(timer);
    }, [fetchOnline]);

    const innerH = CHART_H - PAD.top - PAD.bottom;
    const n = trend.length;
    const groupW = n > 0 ? INNER_W / n : INNER_W;
    const barW = Math.min(28, Math.max(6, groupW * 0.55));
    const maxCount = Math.max(1, ...trend.map((p) => p.count));
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxCount * t));
    const hasData = trend.some((p) => p.count > 0);

    const monthDelta =
        summary && summary.lastMonth > 0
            ? Math.round(((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100)
            : null;

    const summaryItems = summary
        ? [
              { label: '전체 회원', value: summary.total },
              { label: '오늘 가입', value: summary.today },
              { label: '최근 7일', value: summary.last7Days },
              { label: '이번 달', value: summary.thisMonth },
          ]
        : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="bg-[#0f0f0f] border-white/5 overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2 px-4 pt-4 border-b border-white/5">
                    <div>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                            </span>
                            현재 접속자
                        </CardTitle>
                        <p className="text-[11px] text-white/40 mt-0.5">
                            최근 {online?.windowMinutes ?? 5}분 내 활동 · 30초마다 갱신
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void fetchOnline()}
                        disabled={onlineLoading}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
                        aria-label="현재 접속자 새로고침"
                    >
                        <RefreshCw className={`w-4 h-4 ${onlineLoading ? 'animate-spin' : ''}`} />
                    </button>
                </CardHeader>
                <CardContent className="px-4 py-5 space-y-4">
                    <div className="flex items-end gap-2">
                        <Wifi className="w-7 h-7 text-emerald-400 mb-1" />
                        <span className="text-5xl font-black tracking-tight text-white tabular-nums">
                            {online ? online.total.toLocaleString() : '–'}
                        </span>
                        <span className="text-sm text-white/50 font-bold mb-1.5">명</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2">
                            <p className="text-[10px] text-white/40 font-bold">회원</p>
                            <p className="text-lg font-black text-white tabular-nums">
                                {online ? online.members.toLocaleString() : '–'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2">
                            <p className="text-[10px] text-white/40 font-bold">비회원</p>
                            <p className="text-lg font-black text-white tabular-nums">
                                {online ? online.guests.toLocaleString() : '–'}
                            </p>
                        </div>
                    </div>
                    <p className="text-[10px] text-white/30 leading-relaxed">
                        관리자 페이지 접속은 제외됩니다.
                        {online?.checkedAt
                            ? ` 마지막 확인 ${new Date(online.checkedAt).toLocaleTimeString('ko-KR')}`
                            : ''}
                    </p>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3 bg-[#0f0f0f] border-white/5 overflow-hidden min-w-0">
                <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-2 px-4 pt-4 border-b border-white/5">
                    <div>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-primary" />
                            회원 가입 현황
                        </CardTitle>
                        <p className="text-[11px] text-white/40 mt-0.5">
                            {STATS_RANGE[granularity].label} 신규 가입 {periodTotal.toLocaleString()}명
                            {monthDelta !== null && (
                                <span className={monthDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                    {' '}· 전월 대비 {monthDelta >= 0 ? '+' : ''}
                                    {monthDelta}%
                                </span>
                            )}
                        </p>
                    </div>
                    <AdminStatsRangeToggle value={granularity} onChange={setGranularity} size="sm" />
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-3 space-y-4">
                    {summaryItems.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {summaryItems.map((s) => (
                                <div
                                    key={s.label}
                                    className="rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2"
                                >
                                    <p className="text-[10px] text-white/40 font-bold">{s.label}</p>
                                    <p className="text-lg font-black text-white tabular-nums">
                                        {s.value.toLocaleString()}
                                        <span className="text-[11px] text-white/40 font-bold ml-0.5">명</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {trendLoading && trend.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : !hasData ? (
                        <div className="h-[220px] flex flex-col items-center justify-center text-white/20 gap-2 border border-dashed border-white/5 rounded-xl">
                            <Activity className="w-6 h-6 opacity-20" />
                            <span className="text-xs">{STATS_RANGE[granularity].label} 가입 데이터 없음</span>
                        </div>
                    ) : (
                        <div className="relative w-full max-w-full overflow-x-auto overscroll-x-contain">
                            {trendLoading && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                            <svg
                                viewBox={`0 0 ${INNER_W + PAD.left + PAD.right} ${CHART_H}`}
                                className="h-[200px] w-full min-w-0 sm:h-[220px] sm:min-w-[520px]"
                                role="img"
                                aria-label="회원 가입 추이 차트"
                            >
                                {[0, 1, 2, 3, 4].map((i) => {
                                    const y = PAD.top + (innerH / 4) * i;
                                    return (
                                        <line
                                            key={i}
                                            x1={PAD.left}
                                            x2={PAD.left + INNER_W}
                                            y1={y}
                                            y2={y}
                                            stroke={ADMIN_CHART.grid}
                                            strokeDasharray="3 6"
                                        />
                                    );
                                })}
                                {ticks.map((tick, i) => {
                                    const y = PAD.top + innerH - (tick / maxCount) * innerH;
                                    return (
                                        <text
                                            key={`t-${i}`}
                                            x={PAD.left - 8}
                                            y={y + 3}
                                            textAnchor="end"
                                            className="fill-white/35 text-[9px] font-medium"
                                        >
                                            {formatTrendAxisCount(tick)}
                                        </text>
                                    );
                                })}
                                {trend.map((p, i) => {
                                    const gx = PAD.left + groupW * i + groupW / 2;
                                    const h = (p.count / maxCount) * innerH;
                                    const y = PAD.top + innerH - h;
                                    return (
                                        <g key={p.date}>
                                            <rect
                                                x={gx - barW / 2}
                                                y={y}
                                                width={barW}
                                                height={Math.max(h, p.count > 0 ? 2 : 0)}
                                                fill={ADMIN_CHART.sage}
                                                rx={4}
                                                pointerEvents="none"
                                            />
                                            {p.count > 0 && (
                                                <text
                                                    x={gx}
                                                    y={y - 5}
                                                    textAnchor="middle"
                                                    className="fill-white/70 text-[9px] font-bold"
                                                >
                                                    {p.count}
                                                </text>
                                            )}
                                            <text
                                                x={gx}
                                                y={CHART_H - 6}
                                                textAnchor="middle"
                                                className="fill-white/30 text-[8px] font-medium"
                                            >
                                                {formatStatsPeriodLabel(p.date, granularity)}
                                            </text>
                                        </g>
                                    );
                                })}
                                {trend.map((p, i) => (
                                    <ChartDayHitArea
                                        key={`hit-${p.date}`}
                                        x={PAD.left + groupW * i}
                                        y={PAD.top}
                                        width={groupW}
                                        height={innerH}
                                        active={chartHover.hover?.index === i}
                                        onMove={(e) => chartHover.fromPointer(i, e)}
                                        onLeave={chartHover.hide}
                                    />
                                ))}
                            </svg>
                            <AdminChartTooltip
                                hover={chartHover.hover}
                                title={
                                    chartHover.hover
                                        ? formatStatsPeriodLabel(
                                              trend[chartHover.hover.index]?.date ?? '',
                                              granularity
                                          )
                                        : ''
                                }
                                rows={
                                    chartHover.hover
                                        ? [
                                              {
                                                  label: '신규 가입',
                                                  color: ADMIN_CHART.sage,
                                                  value: `${(trend[chartHover.hover.index]?.count ?? 0).toLocaleString('ko-KR')}명`,
                                              },
                                          ]
                                        : []
                                }
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
