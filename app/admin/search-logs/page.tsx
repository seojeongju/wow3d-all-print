'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, MousePointerClick, SearchX, TextSearch, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';

type RankedQuery = { query: string; count: number; visitors: number; avg_results?: number; clicks?: number; last_at?: string };
type ClickRow = { url: string; count: number };
type RecentRow = {
    id: number;
    query: string;
    result_count: number;
    locale: string;
    source: string;
    clicked_url: string | null;
    created_at: string;
};
type SearchLogData = {
    days: number;
    summary: { total: number; visitors: number; queries: number; zeroCount: number; clickCount: number };
    topQueries: RankedQuery[];
    zeroQueries: RankedQuery[];
    topClicks: ClickRow[];
    recent: RecentRow[];
    pagination: { page: number; totalPages: number; total: number };
};

const PERIODS = [
    { days: 7, label: '7일' },
    { days: 30, label: '30일' },
    { days: 90, label: '90일' },
    { days: 365, label: '1년' },
];

const SOURCE_LABEL: Record<string, string> = {
    page: '검색 페이지',
    modal: '빠른 검색',
    robot: '안내로봇',
};

/** DB 저장값은 UTC(datetime('now')) */
function parseUtc(s: string): Date {
    return new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);
}

function percent(part: number, total: number): string {
    return total > 0 ? `${Math.round((part / total) * 100)}%` : '-';
}

function safeDecode(url: string): string {
    try {
        return decodeURIComponent(url);
    } catch {
        return url;
    }
}

function siteSearchUrl(query: string): string {
    return `/search?q=${encodeURIComponent(query)}`;
}

export default function AdminSearchLogsPage() {
    const { token } = useAuthStore();
    const [days, setDays] = useState(30);
    const [page, setPage] = useState(1);
    const [data, setData] = useState<SearchLogData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/search-logs?days=${days}&page=${page}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || '조회 실패');
            setData(json.data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [token, days, page]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const s = data?.summary;
    const cards = s
        ? [
              { label: '총 검색', value: s.total.toLocaleString(), color: 'text-white' },
              { label: '검색한 방문자', value: s.visitors.toLocaleString(), color: 'text-white' },
              { label: '서로 다른 검색어', value: s.queries.toLocaleString(), color: 'text-teal-300' },
              { label: '결과 없음 비율', value: percent(s.zeroCount, s.total), color: 'text-amber-400' },
              { label: '결과 클릭 비율', value: percent(s.clickCount, s.total), color: 'text-emerald-400' },
          ]
        : [];

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <TextSearch className="w-8 h-8 text-primary" /> 검색어 분석
                    </h1>
                    <p className="text-white/50 text-sm mt-2 font-medium">
                        고객이 사이트 검색에서 무엇을 찾는지, 어떤 검색어에 결과가 없는지 확인합니다. 결과 없는 검색어는 새 가이드·FAQ 주제 후보입니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    {PERIODS.map((p) => (
                        <Button
                            key={p.days}
                            size="sm"
                            variant={days === p.days ? 'default' : 'outline'}
                            onClick={() => {
                                setDays(p.days);
                                setPage(1);
                            }}
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </div>

            {error && (
                <Card className="bg-amber-500/10 border-amber-500/30">
                    <CardContent className="p-5 text-sm font-bold text-amber-200">{error}</CardContent>
                </Card>
            )}

            {loading && !data ? (
                <div className="flex justify-center p-24">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : (
                data && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {cards.map((c) => (
                                <Card key={c.label} className="bg-white/[0.03] border-white/10">
                                    <CardContent className="p-5">
                                        <p className="text-[11px] font-bold text-white/45">{c.label}</p>
                                        <p className={`text-2xl font-black mt-1 ${c.color}`}>{c.value}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card className="bg-white/[0.03] border-white/10">
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-5 h-5 text-teal-400" /> 인기 검색어
                                    </h2>
                                    {data.topQueries.length === 0 ? (
                                        <p className="text-sm text-white/40">기간 내 검색 기록이 없습니다.</p>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-[11px] text-white/40 text-left">
                                                    <th className="py-2 w-8">#</th>
                                                    <th className="py-2">검색어</th>
                                                    <th className="py-2 text-right">검색</th>
                                                    <th className="py-2 text-right">방문자</th>
                                                    <th className="py-2 text-right">평균 결과</th>
                                                    <th className="py-2 text-right">클릭</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.topQueries.map((q, i) => (
                                                    <tr key={q.query} className="border-t border-white/5">
                                                        <td className="py-2 text-white/35">{i + 1}</td>
                                                        <td className="py-2">
                                                            <a href={siteSearchUrl(q.query)} target="_blank" rel="noreferrer" className="font-bold text-white hover:text-teal-300">
                                                                {q.query}
                                                            </a>
                                                            {Number(q.avg_results) === 0 && (
                                                                <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30">결과 없음</Badge>
                                                            )}
                                                        </td>
                                                        <td className="py-2 text-right text-white/80">{q.count}</td>
                                                        <td className="py-2 text-right text-white/60">{q.visitors}</td>
                                                        <td className="py-2 text-right text-white/60">{q.avg_results}</td>
                                                        <td className="py-2 text-right text-emerald-400/90">{q.clicks}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-white/[0.03] border-white/10">
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-black text-white flex items-center gap-2 mb-1">
                                        <SearchX className="w-5 h-5 text-amber-400" /> 결과 없는 검색어
                                    </h2>
                                    <p className="text-[12px] text-white/40 mb-4">고객이 찾았지만 사이트에 없는 정보입니다. 가이드·FAQ를 추가하거나 동의어를 보강하세요.</p>
                                    {data.zeroQueries.length === 0 ? (
                                        <p className="text-sm text-white/40">결과 없는 검색어가 없습니다.</p>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-[11px] text-white/40 text-left">
                                                    <th className="py-2">검색어</th>
                                                    <th className="py-2 text-right">검색</th>
                                                    <th className="py-2 text-right">방문자</th>
                                                    <th className="py-2 text-right">마지막 검색</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.zeroQueries.map((q) => (
                                                    <tr key={q.query} className="border-t border-white/5">
                                                        <td className="py-2 font-bold text-amber-100">{q.query}</td>
                                                        <td className="py-2 text-right text-white/80">{q.count}</td>
                                                        <td className="py-2 text-right text-white/60">{q.visitors}</td>
                                                        <td className="py-2 text-right text-white/50">
                                                            {q.last_at ? format(parseUtc(q.last_at), 'MM.dd HH:mm') : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
                            <Card className="bg-white/[0.03] border-white/10">
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                                        <MousePointerClick className="w-5 h-5 text-emerald-400" /> 많이 클릭한 결과
                                    </h2>
                                    {data.topClicks.length === 0 ? (
                                        <p className="text-sm text-white/40">클릭 기록이 없습니다.</p>
                                    ) : (
                                        <ul className="space-y-2 text-sm">
                                            {data.topClicks.map((c) => (
                                                <li key={c.url} className="flex items-center justify-between gap-3">
                                                    <a href={c.url} target="_blank" rel="noreferrer" className="truncate text-white/80 hover:text-teal-300">
                                                        {safeDecode(c.url)}
                                                    </a>
                                                    <span className="shrink-0 font-bold text-emerald-400">{c.count}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-white/[0.03] border-white/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-black text-white">최근 검색</h2>
                                        <span className="text-[12px] text-white/40">
                                            총 {data.pagination.total.toLocaleString()}건 · {data.pagination.page}/{data.pagination.totalPages} 페이지
                                        </span>
                                    </div>
                                    {data.recent.length === 0 ? (
                                        <p className="text-sm text-white/40">기간 내 검색 기록이 없습니다.</p>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-[11px] text-white/40 text-left">
                                                    <th className="py-2">시간</th>
                                                    <th className="py-2">검색어</th>
                                                    <th className="py-2 text-right">결과</th>
                                                    <th className="py-2">위치</th>
                                                    <th className="py-2">클릭한 결과</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.recent.map((r) => (
                                                    <tr key={r.id} className="border-t border-white/5">
                                                        <td className="py-2 text-white/45 whitespace-nowrap">{format(parseUtc(r.created_at), 'MM.dd HH:mm')}</td>
                                                        <td className="py-2 font-bold text-white">
                                                            {r.query}
                                                            {r.locale === 'en' && <span className="ml-1.5 text-[10px] text-white/40">EN</span>}
                                                        </td>
                                                        <td className={`py-2 text-right ${r.result_count === 0 ? 'text-amber-400' : 'text-white/70'}`}>{r.result_count}</td>
                                                        <td className="py-2 text-white/50">{SOURCE_LABEL[r.source] ?? '검색 페이지'}</td>
                                                        <td className="py-2 max-w-[260px]">
                                                            {r.clicked_url ? (
                                                                <a href={r.clicked_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-400/90 hover:text-emerald-300 truncate max-w-full">
                                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                                    <span className="truncate">{safeDecode(r.clicked_url)}</span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-white/25">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                    {data.pagination.totalPages > 1 && (
                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={page >= data.pagination.totalPages || loading}
                                                onClick={() => setPage((p) => p + 1)}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )
            )}
        </div>
    );
}
