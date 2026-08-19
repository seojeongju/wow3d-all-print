'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { trafficMediumLabel, trafficSourceHint, trafficSourceLabel } from '@/lib/traffic-source-labels';

type TrafficSource = {
    source: string;
    count: number;
};

type BreakdownRow = { label: string; count: number };

type SourceDetail = {
    source: string;
    label: string;
    hint?: string;
    days: number;
    totalCount: number;
    byMedium: BreakdownRow[];
    byCampaign: BreakdownRow[];
    byPath: BreakdownRow[];
    byReferrerHost: BreakdownRow[];
    recentSamples: {
        createdAt: string;
        medium: string | null;
        campaign: string | null;
        referrerUrl: string | null;
        referrerHost: string;
        path: string | null;
    }[];
};

const BAR_COLORS = ['bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500'];

type Props = {
    sources: TrafficSource[];
    token?: string | null;
    dayCount?: number;
};

function BreakdownSection({
    title,
    rows,
    total,
    labelFn,
}: {
    title: string;
    rows: BreakdownRow[];
    total: number;
    labelFn?: (label: string) => string;
}) {
    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{title}</p>
                <p className="text-xs text-white/25">데이터 없음</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{title}</p>
            <ul className="space-y-2">
                {rows.map((row) => {
                    const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
                    const display = labelFn ? labelFn(row.label) : row.label;
                    return (
                        <li key={`${title}-${row.label}`} className="space-y-1">
                            <div className="flex justify-between gap-2 text-[11px] font-bold">
                                <span className="text-white/70 truncate" title={display}>
                                    {display}
                                </span>
                                <span className="text-white shrink-0">
                                    {pct}%{' '}
                                    <span className="text-white/30 font-medium">({row.count.toLocaleString()})</span>
                                </span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal-500/70 rounded-full"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default function TrafficSourcePanel({ sources, token, dayCount = 30 }: Props) {
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [detail, setDetail] = useState<SourceDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalTrafficCount = sources.reduce((acc, curr) => acc + curr.count, 0);
    const open = selectedSource != null;

    const loadDetail = useCallback(
        async (source: string) => {
            setLoading(true);
            setError(null);
            setDetail(null);
            try {
                const res = await fetch(
                    `/api/admin/traffic/sources/${encodeURIComponent(source)}?days=${dayCount}`,
                    {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        cache: 'no-store',
                    }
                );
                const json = await res.json();
                if (!res.ok || !json.success) {
                    throw new Error(json.error || '상세 조회 실패');
                }
                setDetail(json.data as SourceDetail);
            } catch (e) {
                setError(e instanceof Error ? e.message : '상세 조회 실패');
            } finally {
                setLoading(false);
            }
        },
        [dayCount, token]
    );

    const handleSelect = (source: string) => {
        setSelectedSource(source);
        void loadDetail(source);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setSelectedSource(null);
            setDetail(null);
            setError(null);
        }
    };

    const dialogLabel = selectedSource ? trafficSourceLabel(selectedSource) : '';
    const dialogHint = selectedSource ? trafficSourceHint(selectedSource) : undefined;

    return (
        <>
            <Card className="lg:col-span-5 bg-[#0f0f0f] border-white/5 group/traffic">
                <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                유입 경로 분석
                                <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    Last {dayCount} Days
                                </span>
                            </CardTitle>
                            <p className="text-xs text-white/40 mt-1">
                                항목을 클릭하면 medium·campaign·referrer·경로를 확인할 수 있습니다
                            </p>
                        </div>
                        <Link
                            href="/admin/quotes/analytics"
                            className="shrink-0 text-[10px] font-bold text-primary hover:text-white flex items-center gap-1 uppercase tracking-tighter"
                        >
                            견적 유입
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="h-[320px] flex flex-col justify-center">
                    {sources.length > 0 ? (
                        <div className="space-y-5">
                            {sources.slice(0, 5).map((ts, idx) => {
                                const percent =
                                    totalTrafficCount > 0 ? Math.round((ts.count / totalTrafficCount) * 100) : 0;
                                const colors = BAR_COLORS;
                                const isActive = selectedSource === ts.source;
                                return (
                                    <button
                                        key={ts.source}
                                        type="button"
                                        onClick={() => handleSelect(ts.source)}
                                        className={cn(
                                            'w-full text-left space-y-1.5 rounded-xl px-2 py-1.5 -mx-2 transition-colors',
                                            'hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                            isActive && 'bg-white/[0.06] ring-1 ring-primary/30'
                                        )}
                                        aria-label={`${trafficSourceLabel(ts.source)} 유입 상세 보기`}
                                    >
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-white/60 flex items-center gap-2">
                                                <span
                                                    className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`}
                                                />
                                                <span>
                                                    <span className="text-white/80">{trafficSourceLabel(ts.source)}</span>
                                                    {ts.source.toLowerCase() !== trafficSourceLabel(ts.source).toLowerCase() && (
                                                        <span className="text-white/30 font-medium ml-1.5 text-[10px]">
                                                            ({ts.source})
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                            <span className="text-white">
                                                {percent}%{' '}
                                                <span className="text-white/30 font-medium ml-1">
                                                    ({ts.count.toLocaleString()})
                                                </span>
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-1000`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-white/20 gap-3 h-full border border-dashed border-white/5 rounded-2xl">
                            <Users className="w-8 h-8 opacity-20" />
                            <span className="text-sm">없음</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                            {dialogLabel}
                            {selectedSource && (
                                <span className="text-[11px] font-bold text-white/30 normal-case">
                                    utm_source={selectedSource}
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-white/50 text-sm leading-relaxed">
                            {dialogHint ?? '최근 유입 로그를 medium·campaign·referrer·페이지 경로별로 집계합니다.'}
                        </DialogDescription>
                    </DialogHeader>

                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {error}
                        </div>
                    )}

                    {!loading && !error && detail && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-3 text-[11px] font-bold">
                                <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-400/20 text-teal-300">
                                    최근 {detail.days}일 · {detail.totalCount.toLocaleString()}건
                                </span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <BreakdownSection
                                    title="매체 (utm_medium)"
                                    rows={detail.byMedium}
                                    total={detail.totalCount}
                                    labelFn={trafficMediumLabel}
                                />
                                <BreakdownSection
                                    title="캠페인 (utm_campaign)"
                                    rows={detail.byCampaign}
                                    total={detail.totalCount}
                                />
                                <BreakdownSection
                                    title="유입 페이지 (path)"
                                    rows={detail.byPath}
                                    total={detail.totalCount}
                                />
                                <BreakdownSection
                                    title="Referrer 호스트"
                                    rows={detail.byReferrerHost}
                                    total={detail.totalCount}
                                />
                            </div>

                            {detail.recentSamples.length > 0 && (
                                <div className="rounded-xl border border-white/5 overflow-hidden">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                        최근 유입 샘플
                                    </p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[11px]">
                                            <thead>
                                                <tr className="text-white/40 border-b border-white/5">
                                                    <th className="text-left font-bold px-3 py-2">시각</th>
                                                    <th className="text-left font-bold px-3 py-2">medium</th>
                                                    <th className="text-left font-bold px-3 py-2">campaign</th>
                                                    <th className="text-left font-bold px-3 py-2">referrer</th>
                                                    <th className="text-left font-bold px-3 py-2">path</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detail.recentSamples.map((row, i) => (
                                                    <tr key={i} className="border-b border-white/5 last:border-0">
                                                        <td className="px-3 py-2 text-white/50 whitespace-nowrap">
                                                            {row.createdAt
                                                                ? new Date(row.createdAt).toLocaleString('ko-KR', {
                                                                      month: 'short',
                                                                      day: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit',
                                                                  })
                                                                : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-white/70">
                                                            {trafficMediumLabel(row.medium)}
                                                        </td>
                                                        <td className="px-3 py-2 text-white/70 max-w-[100px] truncate">
                                                            {row.campaign || '(없음)'}
                                                        </td>
                                                        <td
                                                            className="px-3 py-2 text-white/70 max-w-[120px] truncate"
                                                            title={row.referrerUrl || undefined}
                                                        >
                                                            {row.referrerHost}
                                                        </td>
                                                        <td className="px-3 py-2 text-white/70 max-w-[100px] truncate">
                                                            {row.path || '/'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
