'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Loader2,
    FileText,
    Download,
    ExternalLink,
    MousePointer2,
    Clock,
    BarChart3,
    Filter,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    XCircle,
    Folder,
    FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';

type QuoteAnalytics = {
    id: number;
    user_id: number | null;
    session_id: string | null;
    file_name: string;
    file_size: number;
    file_url: string | null;
    volume_cm3: number;
    total_price: number;
    print_method: string;
    guide_source: string | null;
    guide_topic: string | null;
    created_at: string;
    updated_at: string;
    user_name: string | null;
    user_email: string | null;
    user_role: string | null;
    order_number: string | null;
    order_status: string | null;
    is_in_cart: number;
    traffic_source: string | null;
    traffic_medium: string | null;
};

type GuideSourceStat = {
    guideSource: string;
    guideTopic: string;
    quoteCount: number;
    orderedCount: number;
    incartCount: number;
    abandonedCount: number;
    draftCount: number;
    orderRate: number;
};

type Stats = {
    total: number;
    ordered: number;
    incart: number;
    abandoned: number;
    draft: number;
    guideSources: GuideSourceStat[];
};
type Pagination = { page: number; limit: number; total: number; totalPages: number };

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

type CustomerGroup = {
    key: string;
    items: QuoteAnalytics[];
};

function getCustomerKey(item: QuoteAnalytics): string {
    if (item.user_id != null) return `user-${item.user_id}`;
    const email = item.user_email?.trim().toLowerCase();
    if (email) return `email-${email}`;
    if (item.session_id) return `session-${item.session_id}`;
    return `quote-${item.id}`;
}

function groupByCustomer(items: QuoteAnalytics[]): CustomerGroup[] {
    const map = new Map<string, QuoteAnalytics[]>();
    for (const item of items) {
        const key = getCustomerKey(item);
        const list = map.get(key) ?? [];
        list.push(item);
        map.set(key, list);
    }
    return Array.from(map.entries())
        .map(([key, groupItems]) => ({
            key,
            items: groupItems.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ),
        }))
        .sort(
            (a, b) =>
                new Date(b.items[0].created_at).getTime() - new Date(a.items[0].created_at).getTime()
        );
}

export default function QuoteAnalyticsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<QuoteAnalytics[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        ordered: 0,
        incart: 0,
        abandoned: 0,
        draft: 0,
        guideSources: [],
    });
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ordered' | 'incart' | 'abandoned' | 'draft'>('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                filter: statusFilter,
                page: String(page),
                limit: String(PAGE_SIZE),
            });
            if (debouncedSearch) params.set('q', debouncedSearch);
            const res = await fetch(`/api/admin/quotes/analytics?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });
            const json = await res.json();
            if (json.success && json.data) {
                setItems(json.data.items || []);
                setStats(json.data.stats || {
                    total: 0,
                    ordered: 0,
                    incart: 0,
                    abandoned: 0,
                    draft: 0,
                    guideSources: [],
                });
                setPagination(
                    json.data.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 }
                );
            } else {
                throw new Error(json.error || '데이터 로드 실패');
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            toast({ title: '분석 데이터 조회 실패', description: msg, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [token, toast, statusFilter, page, debouncedSearch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setExpandedGroups(new Set());
    }, [statusFilter, debouncedSearch, page]);

    const getStatusBadge = (item: QuoteAnalytics) => {
        if (item.order_number) {
            return (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    주문완료 ({item.order_number})
                </Badge>
            );
        }
        if (item.is_in_cart > 0) {
            return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">장바구니 보관 중</Badge>;
        }
        if (item.total_price > 0) {
            return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">견적 산출 후 이탈</Badge>;
        }
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">업로드 후 이탈</Badge>;
    };

    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (key: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const customerGroups = groupByCustomer(items);

    const handleDownload = async (item: QuoteAnalytics) => {
        if (!item.file_url) return;
        setDownloadingId(item.id);

        try {
            const res = await fetch(`/api/files/${item.file_url}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error((errorData as { error?: string }).error || '파일 다운로드에 실패했습니다.');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.file_name || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({ title: '다운로드 완료', description: `${item.file_name} 파일을 다운로드했습니다.` });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            toast({
                title: '다운로드 실패',
                description: msg,
                variant: 'destructive',
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const { page: curPage, totalPages, total } = pagination;
    const showPagination = totalPages > 1;

    const renderCustomerCell = (item: QuoteAnalytics) => (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <p className="text-white font-medium">{item.user_name || '비회원'}</p>
                    {(item.user_role === 'admin' || item.user_role === 'super_admin') && (
                        <Badge
                            variant="outline"
                            className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] py-0 px-1"
                        >
                            관리자
                        </Badge>
                    )}
                </div>
                {item.user_email && <p className="text-[10px] text-white/40">{item.user_email}</p>}
            </div>
            <div className="flex items-center gap-1.5">
                <MousePointer2 className="w-3 h-3 text-primary/60" />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-wider">
                    {item.traffic_source || '직접 유입'} / {item.traffic_medium || '없음'}
                </span>
            </div>
            {item.guide_topic && (
                <div className="flex items-center gap-1.5">
                    <Badge className="bg-teal-400/10 text-teal-300 border-teal-400/20 text-[10px]">
                        가이드 유입
                    </Badge>
                    <span className="text-[10px] text-teal-200/70 truncate max-w-[220px]" title={item.guide_topic}>
                        {item.guide_topic}
                    </span>
                </div>
            )}
        </div>
    );

    const renderActions = (item: QuoteAnalytics, className?: string) => (
        <div className={cn('flex items-center justify-end gap-2', className)}>
            {item.file_url && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-white/10"
                    onClick={() => handleDownload(item)}
                    disabled={downloadingId === item.id}
                    title="파일 다운로드"
                >
                    {downloadingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                        <Download className="w-4 h-4 text-white/60" />
                    )}
                </Button>
            )}
            {item.order_number && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-white/10"
                    onClick={() => router.push('/admin/orders')}
                    title="주문 보기"
                >
                    <ExternalLink className="w-4 h-4 text-primary" />
                </Button>
            )}
        </div>
    );

    const renderFileRow = (item: QuoteAnalytics, opts?: { nested?: boolean }) => (
        <tr
            key={item.id}
            className={cn(
                'hover:bg-white/[0.02] transition-colors group',
                opts?.nested && 'bg-white/[0.01]'
            )}
        >
            <td className={cn('p-4', opts?.nested && 'pl-10')}>
                <div className="flex items-center gap-3">
                    {opts?.nested && <span className="w-4 border-l border-b border-white/10 h-4 -mt-4 shrink-0" />}
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                        <FileText className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                        <p className="font-bold text-white truncate max-w-[240px]" title={item.file_name}>
                            {item.file_name}
                        </p>
                        <p className="text-[10px] text-white/30 uppercase font-bold tracking-tight">
                            {item.print_method?.toUpperCase()} · {(item.file_size / (1024 * 1024)).toFixed(2)}MB
                        </p>
                    </div>
                </div>
            </td>
            <td className="p-4">{getStatusBadge(item)}</td>
            <td className="p-4">
                <p className="font-mono font-bold text-white">
                    {item.total_price > 0 ? `₩ ${Math.round(item.total_price).toLocaleString()}` : '-'}
                </p>
                <p className="text-[10px] text-white/30 font-bold">
                    {item.volume_cm3 > 0 ? `${item.volume_cm3.toFixed(1)} cm³` : ''}
                </p>
            </td>
            <td className="p-4">{opts?.nested ? <span className="text-[10px] text-white/25">└ 포함 파일</span> : renderCustomerCell(item)}</td>
            <td className="p-4 text-white/50 text-xs">{format(new Date(item.created_at), 'yy/MM/dd HH:mm')}</td>
            <td className="p-4 text-right">{renderActions(item, 'opacity-0 group-hover:opacity-100 transition-opacity')}</td>
        </tr>
    );

    const renderFolderRow = (group: CustomerGroup) => {
        const { key, items: groupItems } = group;
        const isExpanded = expandedGroups.has(key);
        const primary = groupItems[0];
        const totalPrice = groupItems.reduce((s, i) => s + (i.total_price || 0), 0);
        const totalVolume = groupItems.reduce((s, i) => s + (i.volume_cm3 || 0), 0);
        const orderNumbers = [...new Set(groupItems.map((i) => i.order_number).filter(Boolean))] as string[];
        const statuses = new Set(
            groupItems.map((i) => (i.order_number ? 'ordered' : i.is_in_cart > 0 ? 'incart' : i.total_price > 0 ? 'abandoned' : 'draft'))
        );

        return (
            <React.Fragment key={key}>
                <tr
                    className="hover:bg-white/[0.03] transition-colors group cursor-pointer border-l-2 border-l-primary/40"
                    onClick={() => toggleGroup(key)}
                >
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30">
                                {isExpanded ? (
                                    <FolderOpen className="w-5 h-5 text-primary" />
                                ) : (
                                    <Folder className="w-5 h-5 text-primary" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-white flex items-center gap-2">
                                    {primary.user_name || '비회원'}
                                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                                        {groupItems.length}개 파일
                                    </Badge>
                                    <ChevronDown
                                        className={cn(
                                            'w-4 h-4 text-white/40 transition-transform',
                                            isExpanded && 'rotate-180'
                                        )}
                                    />
                                </p>
                                <p className="text-[10px] text-white/40 mt-0.5 truncate max-w-[280px]">
                                    {groupItems.map((i) => i.file_name).join(' · ')}
                                </p>
                            </div>
                        </div>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-1">
                            {orderNumbers.length === 1 ? (
                                getStatusBadge({ ...primary, order_number: orderNumbers[0] })
                            ) : statuses.size === 1 ? (
                                getStatusBadge(primary)
                            ) : (
                                <Badge className="bg-white/10 text-white/60 border-white/20">혼합 상태</Badge>
                            )}
                        </div>
                    </td>
                    <td className="p-4">
                        <p className="font-mono font-bold text-white">
                            {totalPrice > 0 ? `₩ ${Math.round(totalPrice).toLocaleString()}` : '-'}
                        </p>
                        <p className="text-[10px] text-white/30 font-bold">
                            {totalVolume > 0 ? `${totalVolume.toFixed(1)} cm³ 합계` : ''}
                        </p>
                    </td>
                    <td className="p-4">{renderCustomerCell(primary)}</td>
                    <td className="p-4 text-white/50 text-xs">
                        {format(new Date(primary.created_at), 'yy/MM/dd HH:mm')}
                        <span className="block text-[9px] text-white/25">최근 업로드</span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-[10px] font-bold text-primary hover:bg-primary/10"
                            onClick={() => toggleGroup(key)}
                        >
                            {isExpanded ? '접기' : '펼치기'}
                        </Button>
                    </td>
                </tr>
                {isExpanded && groupItems.map((item) => renderFileRow(item, { nested: true }))}
            </React.Fragment>
        );
    };

    const renderPageButtons = () => {
        if (!showPagination) return null;
        const maxPagesToShow = 5;
        let startPage = Math.max(1, curPage - Math.floor(maxPagesToShow / 2));
        let endPage = startPage + maxPagesToShow - 1;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        const buttons: React.ReactNode[] = [];
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-bold transition-colors ${
                        curPage === i
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {i}
                </button>
            );
        }
        return buttons;
    };

    if (loading && items.length === 0) {
        return (
            <div className="flex justify-center p-24">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" /> 견적 유입 분석
                    </h1>
                    <p className="text-white/50 text-sm mt-2 font-medium">
                        사용자의 업로드 및 견적 산출 흐름을 실시간으로 모니터링합니다.
                    </p>
                </div>
                <Button onClick={() => fetchData()} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                    <Clock className="w-4 h-4 mr-2" /> 새로고침
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: '전체 유입', value: stats.total, color: 'text-white', bg: 'bg-white/5' },
                    { label: '주문 전환', value: stats.ordered, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: '장바구니', value: stats.incart, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: '견적 이탈', value: stats.abandoned, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: '단순 업로드', value: stats.draft, color: 'text-slate-400', bg: 'bg-slate-500/10' },
                ].map((s, i) => (
                    <Card key={i} className={`${s.bg} border-white/10`}>
                        <CardContent className="p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{s.label}</p>
                            <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-teal-300/80 mb-1">Guide Attribution</p>
                            <h2 className="text-xl font-black text-white">가이드 유입 상위 주제</h2>
                            <p className="text-sm text-white/45 mt-1">어떤 가이드가 실제 견적과 주문으로 이어지는지 빠르게 확인합니다.</p>
                        </div>
                    </div>

                    {stats.guideSources.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {stats.guideSources.map((guide, index) => (
                                <div key={`${guide.guideSource}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-teal-400/15 px-2 text-[10px] font-black text-teal-300">
                                                    #{index + 1}
                                                </span>
                                                <Badge className="bg-white/5 text-white/60 border-white/10 text-[10px]">
                                                    {guide.guideSource}
                                                </Badge>
                                            </div>
                                            <p className="font-bold text-white break-keep">{guide.guideTopic}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-2xl font-black text-teal-300">{guide.quoteCount}</p>
                                            <p className="text-[10px] text-white/35 uppercase tracking-widest">quotes</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 mt-4">
                                        {[
                                            { label: '주문', value: guide.orderedCount, color: 'text-emerald-400' },
                                            { label: '장바구니', value: guide.incartCount, color: 'text-blue-400' },
                                            { label: '견적이탈', value: guide.abandonedCount, color: 'text-amber-400' },
                                            { label: '업로드이탈', value: guide.draftCount, color: 'text-slate-400' },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                                                <p className="text-[10px] text-white/35 mb-1">{item.label}</p>
                                                <p className={`font-black ${item.color}`}>{item.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                                            <span className="text-white/45">주문 전환율</span>
                                            <span className="font-black text-white">{(guide.orderRate * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
                                                style={{ width: `${Math.min(100, Math.max(0, guide.orderRate * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-white/35">
                            아직 저장된 가이드 유입 데이터가 없습니다.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="파일명, 고객명, 주문번호 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        <Filter className="w-4 h-4 text-white/40 shrink-0" />
                        {(
                            [
                                { id: 'all', label: '전체' },
                                { id: 'ordered', label: '주문완료' },
                                { id: 'incart', label: '장바구니' },
                                { id: 'abandoned', label: '견적이탈' },
                                { id: 'draft', label: '단순업로드' },
                            ] as const
                        ).map((f) => (
                            <Button
                                key={f.id}
                                size="sm"
                                variant={statusFilter === f.id ? 'default' : 'ghost'}
                                onClick={() => {
                                    setStatusFilter(f.id);
                                    setPage(1);
                                }}
                                className={
                                    statusFilter === f.id ? '' : 'text-white/60 hover:text-white hover:bg-white/5'
                                }
                            >
                                {f.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/[0.03] border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto relative">
                    {loading && items.length > 0 && (
                        <div className="absolute inset-0 z-10 bg-black/20 flex items-center justify-center pointer-events-none">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )}
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">파일 정보</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">상태</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">견적 금액</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">고객/유입</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">일시</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px] text-right">
                                    액션
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {customerGroups.map((group) =>
                                group.items.length > 1 ? renderFolderRow(group) : renderFileRow(group.items[0])
                            )}

                            {items.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-white/20">
                                            <XCircle className="w-12 h-12" />
                                            <p className="font-bold">검색 결과가 없습니다.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {(showPagination || total > 0) && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-white/10 bg-white/[0.02]">
                        <p className="text-xs text-white/40 font-medium order-2 sm:order-1">
                            총 <span className="text-white/70 font-bold">{total.toLocaleString()}</span>건
                            {customerGroups.length > 0 && items.length > customerGroups.length && (
                                <>
                                    {' '}
                                    · <span className="text-white/50">{customerGroups.length}개 고객 그룹</span>
                                </>
                            )}{' '}
                            · {curPage}/{totalPages} 페이지
                        </p>
                        {showPagination && (
                            <div className="flex items-center gap-2 order-1 sm:order-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="bg-white/5 border-white/10 h-9 w-9 p-0"
                                    disabled={curPage <= 1 || loading}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    aria-label="이전 페이지"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center gap-1">{renderPageButtons()}</div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="bg-white/5 border-white/10 h-9 w-9 p-0"
                                    disabled={curPage >= totalPages || loading}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    aria-label="다음 페이지"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
