'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Box, ChevronLeft, ChevronRight, Eye, Loader2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';

type EstimateLog = {
    id: number;
    user_id: number | null;
    session_id: string | null;
    file_name: string;
    file_size: number;
    dimensions_x: number;
    dimensions_y: number;
    dimensions_z: number;
    volume_cm3: number;
    print_method: string;
    material_name: string | null;
    layer_height: number | null;
    fdm_infill: number | null;
    total_price: number;
    estimated_time_hours: number;
    change_count: number;
    thumbnail_data: string | null;
    quote_id: number | null;
    guide_source: string | null;
    created_at: string;
    updated_at: string;
    user_name: string | null;
    user_email: string | null;
    user_phone: string | null;
    order_number: string | null;
};

type EstimateStats = {
    total: number;
    unsaved: number;
    saved: number;
    ordered: number;
    unsavedAmount: number;
    memberCount: number;
};

type FilterKey = 'unsaved' | 'saved' | 'ordered' | 'all';

const FILTERS: { id: FilterKey; label: string }[] = [
    { id: 'unsaved', label: '저장 안 함' },
    { id: 'saved', label: '저장·장바구니' },
    { id: 'ordered', label: '주문 완료' },
    { id: 'all', label: '전체' },
];

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 400;

/** DB 저장값은 UTC(datetime('now')) */
function parseUtc(s: string): Date {
    return new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);
}

function formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function statusBadge(item: EstimateLog) {
    if (item.order_number) {
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">주문완료</Badge>;
    }
    if (item.quote_id) {
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">견적 저장</Badge>;
    }
    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">확인만 함</Badge>;
}

export default function QuoteEstimateLogsPanel() {
    const { token } = useAuthStore();
    const [items, setItems] = useState<EstimateLog[]>([]);
    const [stats, setStats] = useState<EstimateStats | null>(null);
    const [filter, setFilter] = useState<FilterKey>('unsaved');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ filter, page: String(page), limit: String(PAGE_SIZE) });
            if (debouncedSearch) params.set('q', debouncedSearch);
            const res = await fetch(`/api/admin/quote-estimates?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || '조회 실패');
            setItems(json.data.items || []);
            setStats(json.data.stats || null);
            setTotalPages(json.data.pagination?.totalPages || 1);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [token, filter, page, debouncedSearch]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const summary = stats
        ? [
              { label: '견적 확인', value: stats.total.toLocaleString(), color: 'text-white' },
              { label: '저장 안 하고 떠남', value: stats.unsaved.toLocaleString(), color: 'text-amber-400' },
              { label: '놓친 견적 합계', value: `${stats.unsavedAmount.toLocaleString()}원`, color: 'text-amber-300' },
              { label: '저장·장바구니', value: stats.saved.toLocaleString(), color: 'text-blue-400' },
              { label: '주문 완료', value: stats.ordered.toLocaleString(), color: 'text-emerald-400' },
          ]
        : [];

    return (
        <Card className="bg-white/[0.03] border-white/10">
            <CardContent className="p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-300/80 mb-1">Estimate Views</p>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <Eye className="w-5 h-5 text-amber-300" /> 견적 확인 기록
                        </h2>
                        <p className="text-sm text-white/45 mt-1">
                            견적 저장 버튼을 누르지 않아도, 손님이 파일을 올려 확인한 금액과 조건을 모두 보여줍니다. 원본 파일은 보관하지 않습니다.
                        </p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="파일명, 고객명, 이메일 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white"
                        />
                    </div>
                </div>

                {summary.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {summary.map((s) => (
                            <div key={s.label} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                                <p className="text-[10px] text-white/40 mb-1">{s.label}</p>
                                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {FILTERS.map((f) => (
                        <Button
                            key={f.id}
                            size="sm"
                            variant={filter === f.id ? 'default' : 'ghost'}
                            onClick={() => {
                                setFilter(f.id);
                                setPage(1);
                            }}
                            className={filter === f.id ? '' : 'text-white/60 hover:text-white hover:bg-white/5'}
                        >
                            {f.label}
                        </Button>
                    ))}
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-primary ml-2" />}
                </div>

                {error ? (
                    <div className="rounded-2xl border border-dashed border-red-400/30 bg-red-500/5 p-8 text-center text-red-300/80 text-sm">
                        {error}
                    </div>
                ) : items.length === 0 && !loading ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-white/35 text-sm">
                        아직 기록된 견적 확인이 없습니다.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {items.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden flex">
                                <div className="w-28 shrink-0 bg-[#0b1220] flex items-center justify-center">
                                    {item.thumbnail_data ? (
                                        <img src={item.thumbnail_data} alt={item.file_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Box className="w-8 h-8 text-white/15" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 p-3 space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-bold text-white text-sm truncate" title={item.file_name}>
                                            {item.file_name}
                                        </p>
                                        {statusBadge(item)}
                                    </div>
                                    <p className="text-lg font-black text-primary">{item.total_price.toLocaleString()}원</p>
                                    <p className="text-[11px] text-white/60">
                                        {item.print_method.toUpperCase()} · {item.material_name || '-'}
                                        {item.fdm_infill != null ? ` · 채움 ${item.fdm_infill}%` : ''}
                                        {item.layer_height != null ? ` · ${item.layer_height}mm` : ''}
                                    </p>
                                    <p className="text-[11px] text-white/45">
                                        {item.dimensions_x}×{item.dimensions_y}×{item.dimensions_z}mm · {item.volume_cm3}cm³ · {formatSize(item.file_size)}
                                    </p>
                                    <p className="text-[11px] text-white/45 truncate">
                                        {item.user_id ? (
                                            <span className="text-white/80">
                                                {item.user_name || '회원'}
                                                {item.user_email ? ` (${item.user_email})` : ''}
                                            </span>
                                        ) : (
                                            '비회원'
                                        )}
                                    </p>
                                    <p className="text-[10px] text-white/30">
                                        {format(parseUtc(item.updated_at), 'yy/MM/dd HH:mm')}
                                        {item.change_count > 0 ? ` · 조건 변경 ${item.change_count}회` : ''}
                                        {item.guide_source ? ` · 가이드 유입` : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-white/5 border-white/10 h-9 w-9 p-0"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            aria-label="이전 페이지"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs text-white/50">
                            {page} / {totalPages}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-white/5 border-white/10 h-9 w-9 p-0"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            aria-label="다음 페이지"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
