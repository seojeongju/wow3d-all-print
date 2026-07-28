'use client';

import { correctDisplayAmount } from '@/lib/amount-display';
import { formatKoreanDate } from '@/lib/date-utils';
import { formatQuoteGuideContext, formatQuotePrintSettings } from '@/lib/quote-print-settings';
import { useState, useEffect, useCallback, useRef, Suspense, type ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Download, Loader2, Eye, FileDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import JSZip from 'jszip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

/** 금액은 DB에서 원화(KRW)로 저장·표시 - 2026-05-06 Status Order Fix */

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

type OrdersPagination = { page: number; limit: number; total: number; totalPages: number };

type OrderItemSummary = {
    id?: number;
    quote_id?: number;
    file_name?: string;
    file_url?: string | null;
    print_method?: string;
    guide_source?: string | null;
    guide_topic?: string | null;
    fdm_material?: string | null;
    fdm_infill?: number | null;
    fdm_layer_height?: number | null;
    fdm_support?: number | boolean | null;
    resin_type?: string | null;
    layer_thickness?: number | null;
    post_processing?: number | boolean | null;
};

type AdminOrder = {
    id: number;
    order_number?: string;
    recipient_name?: string;
    user_id?: number | null;
    user_name?: string | null;
    user_email?: string | null;
    user_role?: string | null;
    guest_email?: string | null;
    item_count?: number;
    total_amount?: number;
    status?: string;
    created_at?: string;
    has_expert_quote?: boolean | number;
    expert_quote_data?: string | null;
    quotation_sent_at?: string | null;
    items_summary?: string | OrderItemSummary[];
};

type AdminOrderDetail = Record<string, unknown> & {
    admin_note?: string | null;
    status?: string;
    recipient_name?: string;
    user_id?: number | null;
    user_name?: string | null;
    user_email?: string | null;
    guest_email?: string | null;
    shipping_address?: string;
    shipping_postal_code?: string | null;
    recipient_phone?: string;
    customer_note?: string | null;
    total_amount?: number;
    has_expert_quote?: boolean | number;
    expert_quote_data?: string | null;
    quotation_sent_at?: string | null;
};

type AdminOrderItem = Record<string, unknown> & {
    id?: number;
    quote_id?: number;
    file_name?: string;
    file_url?: string | null;
    print_method?: string;
    quantity?: number;
    unit_price?: number;
    subtotal?: number;
    estimated_time_hours?: number | null;
    volume_cm3?: number | null;
    guide_source?: string | null;
    guide_topic?: string | null;
};

function parseItemsSummary(raw: unknown): OrderItemSummary[] {
    try {
        if (typeof raw === 'string') return JSON.parse(raw) as OrderItemSummary[];
        if (Array.isArray(raw)) return raw as OrderItemSummary[];
    } catch { /* ignore */ }
    return [];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'pending', label: '접수 대기' },
    { value: 'confirmed', label: '주문 확인' },
    { value: 'quote_sent', label: '견적 발송' },
    { value: 'payment_confirmed', label: '결제 확인' },
    { value: 'production', label: '제작 중' },
    { value: 'shipping', label: '배송 중' },
    { value: 'delivered', label: '배송 완료' },
    { value: 'completed', label: '완료됨' },
    { value: 'cancelled', label: '취소' },
];

function getStatusBadge(status: string) {
    switch (status) {
        case 'pending': return <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">접수 대기</Badge>;
        case 'confirmed': return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">주문 확인</Badge>;
        case 'quote_sent': return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">견적 발송</Badge>;
        case 'payment_confirmed': return <Badge variant="outline" className="bg-teal-500/20 text-teal-400 border-teal-500/30">결제 확인</Badge>;
        case 'production': return <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">제작 중</Badge>;
        case 'shipping': return <Badge variant="outline" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">배송 중</Badge>;
        case 'delivered': return <Badge variant="outline" className="bg-sky-500/20 text-sky-400 border-sky-500/30">배송 완료</Badge>;
        case 'completed': return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">완료됨</Badge>;
        case 'cancelled': return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">취소</Badge>;
        default: return <Badge variant="outline" className="bg-white/10 text-white/60">미정</Badge>;
    }
}

type DetailData = { order: AdminOrderDetail; items: AdminOrderItem[]; shipment: Record<string, unknown> | null };

function OrderListInner() {
    const { toast } = useToast();
    const { token } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [pagination, setPagination] = useState<OrdersPagination>({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
    });
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const prevDebouncedRef = useRef('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all');
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<DetailData | null>(null);
    const [detailAdminNote, setDetailAdminNote] = useState('');
    const [detailStatus, setDetailStatus] = useState('');
    const [savingDetail, setSavingDetail] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
    // 상태를 제작중으로 변경 시 수정 견적 금액 확인 다이얼로그
    const [confirmProductionDialog, setConfirmProductionDialog] = useState<{ orderId: number; expertAmount: number; autoAmount: number } | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                paginated: '1',
                page: String(page),
                limit: String(PAGE_SIZE),
            });
            if (debouncedSearch) params.set('q', debouncedSearch);
            if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
            if (scopeFilter === 'mine') params.set('mine', '1');
            const res = await fetch(`/api/admin/orders?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });
            const data = await res.json();
            if (data.success && data.data?.items) {
                const pag = data.data.pagination || {
                    page: 1,
                    limit: PAGE_SIZE,
                    total: 0,
                    totalPages: 1,
                };
                setOrders(data.data.items || []);
                setPagination(pag);
                if (pag.totalPages >= 1 && page > pag.totalPages) {
                    setPage(pag.totalPages);
                }
            } else {
                throw new Error(data.error || '목록 형식 오류');
            }
        } catch (e) {
            console.error('Failed to fetch orders', e);
            toast({ title: '주문 목록 조회 실패', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [token, toast, page, debouncedSearch, statusFilter, scopeFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        const t = setTimeout(() => {
            const next = searchQuery.trim();
            if (prevDebouncedRef.current === next) return;
            prevDebouncedRef.current = next;
            setDebouncedSearch(next);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [searchQuery]);


    useEffect(() => {
        const onFocus = () => fetchOrders();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchOrders]);

    // URL ?status= 필터
    useEffect(() => {
        const status = searchParams.get('status');
        if (status && STATUS_OPTIONS.some((o) => o.value === status)) {
            setStatusFilter(status);
            setPage(1);
        }
    }, [searchParams]);

    // URL ?detail=id 에서 상세 아이디 읽기
    useEffect(() => {
        const d = searchParams.get('detail');
        const n = d ? parseInt(d, 10) : NaN;
        if (Number.isInteger(n)) setDetailOrderId(n);
    }, [searchParams]);

    // 상세 아이디 변경 시 GET /api/admin/orders/[id]
    useEffect(() => {
        if (!detailOrderId) {
            setDetailData(null);
            return;
        }
        setLoadingDetail(true);
        fetch(`/api/admin/orders/${detailOrderId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => r.json())
            .then((j) => {
                if (j.success && j.data) {
                    setDetailData(j.data);
                    setDetailAdminNote(String(j.data.order?.admin_note ?? ''));
                    setDetailStatus(String(j.data.order?.status ?? 'pending'));
                } else {
                    toast({ title: j.error || '주문을 불러올 수 없습니다.', variant: 'destructive' });
                    setDetailOrderId(null);
                }
            })
            .catch(() => {
                toast({ title: '주문 상세 조회 실패', variant: 'destructive' });
                setDetailOrderId(null);
            })
            .finally(() => setLoadingDetail(false));
    }, [detailOrderId, toast, token]);

    const openDetail = (id: number) => {
        setDetailOrderId(id);
        router.replace(`/admin/orders?detail=${id}`, { scroll: false });
    };
    const closeDetail = () => {
        setDetailOrderId(null);
        setDetailData(null);
        router.replace('/admin/orders', { scroll: false });
    };

    const handleSaveDetail = async () => {
        if (!detailOrderId) return;
        setSavingDetail(true);
        try {
            const res = await fetch(`/api/admin/orders/${detailOrderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ status: detailStatus, admin_note: detailAdminNote }),
            });
            const j = await res.json();
            if (j.success) {
                setOrders((prev) => prev.map((o) => (o.id === detailOrderId ? { ...o, status: detailStatus, admin_note: detailAdminNote } : o)));
                setDetailData((d) => (d ? { ...d, order: { ...d.order, status: detailStatus, admin_note: detailAdminNote } } : null));
                toast({ title: '저장되었습니다.' });
            } else {
                toast({ title: j.error || '저장 실패', variant: 'destructive' });
            }
        } catch {
            toast({ title: '저장 중 오류가 발생했습니다.', variant: 'destructive' });
        } finally {
            setSavingDetail(false);
        }
    };

    const handleCsvDownload = async () => {
        try {
            const params = new URLSearchParams({
                paginated: '1',
                page: '1',
                limit: '500',
            });
            if (debouncedSearch) params.set('q', debouncedSearch);
            if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
            if (scopeFilter === 'mine') params.set('mine', '1');
            const res = await fetch(`/api/admin/orders?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });
            const data = await res.json();
            if (!data.success || !data.data?.items) {
                toast({ title: 'CSV용 목록을 불러오지 못했습니다.', variant: 'destructive' });
                return;
            }
            const rowsData = data.data.items as AdminOrder[];
            const headers = ['주문번호', '고객명', '주문자', '이메일', '품목수', '금액', '상태', '날짜'];
            const rows = rowsData.map((o) => [
                o.order_number || '',
                o.recipient_name || '',
                o.user_id ? (o.user_name || '-') : '비회원',
                o.user_email || o.guest_email || '-',
                String(o.item_count ?? 1),
                String(Math.round(Number(o.total_amount || 0))),
                o.status || '',
                o.created_at ? formatKoreanDate(o.created_at, '') : '',
            ]);
            const BOM = '\uFEFF';
            const csv = BOM + [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `wow3d-orders-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
            toast({ title: `CSV 다운로드 완료 (${rows.length}건)` });
        } catch {
            toast({ title: 'CSV 다운로드 실패', variant: 'destructive' });
        }
    };

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        // 제작중으로 변경 시 수정 견적 금액이 있으면 확인 다이얼로그 출력
        if (newStatus === 'production') {
            const order = orders.find(o => o.id === orderId);
            if (order?.has_expert_quote && order?.expert_quote_data) {
                try {
                    const expertData = JSON.parse(order.expert_quote_data);
                    const expertAmount = Number(expertData.total_amount || 0);
                    if (expertAmount > 0) {
                        const raw = Math.round(Number(order.total_amount || 0));
                        setConfirmProductionDialog({
                            orderId,
                            expertAmount,
                            autoAmount: correctDisplayAmount(raw) ?? raw,
                        });
                        return; // 다이얼로그 확인 후 실행
                    }
                } catch { }
            }
        }
        await doStatusChange(orderId, newStatus);
    };

    const doStatusChange = async (orderId: number, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const json = await res.json();
            if (json.success) {
                setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
                toast({ title: '상태가 변경되었습니다.' });
            } else {
                toast({ title: json.error || '변경 실패', variant: 'destructive' });
            }
        } catch {
            toast({ title: '변경 중 오류가 발생했습니다.', variant: 'destructive' });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleFileDownload = async (orderId: number, itemId: number, quoteId: number, fileName: string) => {
        setDownloadingFileId(itemId);
        try {
            const url = `/api/admin/orders/${orderId}/file?quoteId=${quoteId}`;
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const res = await fetch(url, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || '다운로드 실패');
            }
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName || 'model.stl';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast({ title: `✅ ${fileName} 다운로드 완료` });
        } catch (e) {
            toast({
                title: '❌ 다운로드 실패',
                description: e instanceof Error ? e.message : '파일을 다운로드할 수 없습니다',
                variant: 'destructive',
            });
        } finally {
            setDownloadingFileId(null);
        }
    };


    const handleBulkDownload = async (orderId?: number, itemsToUse?: OrderItemSummary[] | AdminOrderItem[]) => {
        const orderIdToUse = orderId || detailOrderId;
        const items = itemsToUse || detailData?.items || [];

        if (!orderIdToUse || !items || items.length === 0) {
            toast({ title: '다운로드할 파일이 없습니다.', variant: 'destructive' });
            return;
        }

        const filesToDownload = items.filter((it) => it.file_url || it.quote_id);
        if (filesToDownload.length === 0) {
            toast({ title: '다운로드할 파일이 없습니다.', variant: 'destructive' });
            return;
        }

        // 전체 압축 다운로드 진행 중 로딩 상태 표시 (UI 상에서 스피너 비활성화 처리를 위해 downloadingFileId를 -1로 임시 지정)
        setDownloadingFileId(-1);
        toast({ 
            title: `📦 ${filesToDownload.length}개 파일 압축 및 다운로드 시작...`, 
            description: '서버에서 바이너리 파일을 받아 브라우저 메모리상에서 압축을 진행 중입니다.' 
        });

        try {
            const zip = new JSZip();
            let successCount = 0;
            let failCount = 0;

            // R2 API를 통해 각 모델링 파일 데이터를 순차 fetch하여 zip 객체에 추가
            for (const item of filesToDownload) {
                try {
                    const url = `/api/admin/orders/${orderIdToUse}/file?quoteId=${item.quote_id}`;
                    const headers: HeadersInit = {};
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    const res = await fetch(url, { headers });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err?.error || '다운로드 실패');
                    }
                    
                    const blob = await res.blob();
                    const fileName = item.file_name || `model_${item.id}.stl`;
                    
                    // JSZip 객체에 바이너리 파일 추가
                    zip.file(fileName, blob);
                    successCount++;
                } catch (e) {
                    failCount++;
                    console.error(`Failed to fetch ${item.file_name} for zipping:`, e);
                }
            }

            if (successCount === 0) {
                throw new Error('성공적으로 로드된 모델링 파일이 없습니다.');
            }

            // 브라우저 사이드에서 ZIP 압축 파일 생성
            const zipContent = await zip.generateAsync({ type: 'blob' });
            const downloadUrl = window.URL.createObjectURL(zipContent);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // 압축 파일명 정의: [주문번호]_modeling_files.zip (주문번호 미조회 시 order_id 대체)
            let zipFileName = `order_${orderIdToUse}_modeling_files.zip`;
            const currentOrder = orders.find(o => o.id === orderIdToUse) || detailData?.order;
            if (currentOrder && currentOrder.order_number) {
                zipFileName = `${currentOrder.order_number}_modeling_files.zip`;
            }

            link.download = zipFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            if (failCount === 0) {
                toast({ 
                    title: `✅ 압축 다운로드 완료`, 
                    description: `총 ${successCount}개의 모델링 파일이 성공적으로 압축 및 저장되었습니다.` 
                });
            } else {
                toast({
                    title: `압축 다운로드 완료 (일부 파일 누락)`,
                    description: `성공: ${successCount}개, 실패: ${failCount}개. 실패한 파일은 개별 다운로드를 이용해 주세요.`,
                    variant: 'default',
                });
            }
        } catch (e) {
            toast({
                title: '❌ 압축 다운로드 실패',
                description: e instanceof Error ? e.message : '압축 파일을 생성하는 도중 오류가 발생했습니다.',
                variant: 'destructive',
            });
        } finally {
            // 로딩 종료
            setDownloadingFileId(null);
        }
    };



    const { totalPages, total } = pagination;
    const showPagination = totalPages > 1;

    const renderPageButtons = () => {
        if (!showPagination) return null;
        const maxPagesToShow = 5;
        let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        let endPage = startPage + maxPagesToShow - 1;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        const buttons: ReactNode[] = [];
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-bold transition-colors ${
                        page === i
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

    if (loading && orders.length === 0) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">주문 관리</h1>
                <p className="text-white/70 text-sm mt-1">접수된 주문을 확인하고 상태를 변경할 수 있습니다.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.06] border border-white/10">
                    <button
                        type="button"
                        onClick={() => {
                            setPage(1);
                            setScopeFilter('all');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${scopeFilter === 'all' ? 'bg-primary/30 text-zinc-100 border border-primary/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    >
                        전체
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setPage(1);
                            setScopeFilter('mine');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${scopeFilter === 'mine' ? 'bg-primary/30 text-zinc-100 border border-primary/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    >
                        내 주문
                    </button>
                </div>
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                    <Input
                        type="search"
                        placeholder="주문번호, 고객명, 이메일, 파일명 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/45"
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="상태 필터" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white/90 hover:bg-white/10"
                        onClick={() => fetchOrders()}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span className="ml-1.5 hidden sm:inline">새로고침</span>
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/20 text-white/90 hover:bg-white/10" onClick={handleCsvDownload}>
                        <Download className="w-4 h-4 mr-2" /> CSV 다운로드
                    </Button>
                </div>
            </div>

            <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto relative">
                        {loading && orders.length > 0 && (
                            <div className="absolute inset-0 z-10 bg-black/25 flex items-center justify-center pointer-events-none">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        )}
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-4 font-medium text-white/95">주문번호</th>
                                    <th className="p-4 font-medium text-white/95">고객명</th>
                                    <th className="p-4 font-medium text-white/95">연락</th>
                                    <th className="p-4 font-medium text-white/95">주문 내역(파일다운)</th>
                                    <th className="p-4 font-medium text-white/95">금액</th>
                                    <th className="p-4 font-medium text-white/95">견적 발송</th>
                                    <th className="p-4 font-medium text-white/95">상태</th>
                                    <th className="p-4 font-medium text-white/95">날짜</th>
                                    <th className="p-4 font-medium text-right text-white/95">상태 변경</th>
                                    <th className="p-4 font-medium text-white/95 w-12">상세</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-medium text-white">{order.order_number}</td>
                                        <td className="p-4 text-white/90">
                                            <div className="flex items-center gap-1.5">
                                                <span>{order.recipient_name}</span>
                                                {(order.user_role === 'admin' || order.user_role === 'super_admin') && (
                                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] py-0 px-1">관리자</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-white/75">
                                            {order.user_id ? (order.user_email || '-') : (
                                                <>
                                                    <span className="text-amber-400/90">비회원</span>
                                                    {order.guest_email && <span className="block text-[11px] text-white/60 truncate max-w-[140px]">{order.guest_email}</span>}
                                                </>
                                            )}
                                        </td>
                                        <td className="p-4 text-white/70">
                                            <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span>{order.item_count || 1}개 품목</span>
                                                {(() => {
                                                    const items = parseItemsSummary(order.items_summary);

                                                    if (items.length > 0) {
                                                        return (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2.5 text-xs font-semibold border-primary/50 text-zinc-100 bg-primary/20 hover:bg-primary hover:text-primary-foreground transition-all shadow-[0_0_10px_rgba(99,102,241,0.15)] group"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleBulkDownload(order.id, items);
                                                                }}
                                                                title="모든 파일 다운로드"
                                                            >
                                                                <FileDown className="w-3.5 h-3.5 mr-1 group-hover:scale-110 transition-transform" />
                                                                다운로드
                                                            </Button>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                            {(() => {
                                                const items = parseItemsSummary(order.items_summary);
                                                const first = items[0];
                                                if (!first) return null;
                                                const line = formatQuotePrintSettings(first);
                                                const guideLine = formatQuoteGuideContext(first);
                                                if (!line && !guideLine) return null;
                                                return (
                                                    <div className="max-w-[220px]">
                                                        {line ? (
                                                            <p className="text-[10px] text-white/40 truncate" title={line}>
                                                                {String(first.print_method || '').toUpperCase()} · {line}
                                                            </p>
                                                        ) : null}
                                                        {guideLine ? (
                                                            <p className="text-[10px] text-teal-300/70 truncate" title={guideLine}>
                                                                가이드 유입 · {guideLine}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                );
                                            })()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {(() => {
                                                let expertAmount: number | null = null;
                                                if (order.has_expert_quote && order.expert_quote_data) {
                                                    try {
                                                        const d = JSON.parse(order.expert_quote_data);
                                                        expertAmount = Number(d.total_amount || 0);
                                                    } catch { }
                                                }
                                                const autoAmountRaw = Math.round(Number(order.total_amount || 0));
                                                const autoAmountKr = correctDisplayAmount(autoAmountRaw) ?? autoAmountRaw;
                                                return expertAmount && expertAmount > 0 ? (
                                                    <div>
                                                        <div className="font-bold text-emerald-400">₩ {expertAmount.toLocaleString()}</div>
                                                        <div className="text-xs text-white/30 line-through">₩ {autoAmountKr.toLocaleString()}</div>
                                                    </div>
                                                ) : (
                                                    <span className="font-bold text-white">₩ {autoAmountKr.toLocaleString()}</span>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-4">
                                            {order.quotation_sent_at ? (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                                                        발송됨
                                                    </Badge>
                                                    <Button variant="link" className="p-0 h-auto text-[10px] text-white/50 hover:text-white" onClick={(e) => { e.stopPropagation(); if (token) localStorage.setItem('admin_print_token', token); window.open(`/print/estimate/${order.id}`, '_blank'); }}>견적서 보기</Button>
                                                </div>
                                            ) : (
                                                <span className="text-white/30 text-xs">미발송</span>
                                            )}
                                        </td>
                                        <td className="p-4">{getStatusBadge(order.status)}</td>
                                        <td className="p-4 text-white/70">{formatKoreanDate(order.created_at)}</td>
                                        <td className="p-4 text-right">
                                            <Select
                                                value={order.status}
                                                onValueChange={(v) => handleStatusChange(order.id, v)}
                                                disabled={updatingId === order.id}
                                            >
                                                <SelectTrigger className="w-[130px] h-8 bg-white/10 border-white/20 text-white text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((s) => (
                                                        <SelectItem key={s.value} value={s.value}>
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {updatingId === order.id && (
                                                <Loader2 className="w-3 h-3 animate-spin inline-block ml-1 text-primary" />
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                                                onClick={() => openDetail(order.id)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={10} className="p-12 text-center text-white/40">
                                            접수된 주문이 없거나 조건에 맞는 주문이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {(showPagination || total > 0) && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-white/10 bg-white/[0.02]">
                            <p className="text-xs text-white/40 font-medium order-2 sm:order-1">
                                총 <span className="text-white/70 font-bold">{total.toLocaleString()}</span>건 · {page}/{totalPages} 페이지
                            </p>
                            {showPagination && (
                                <div className="flex items-center gap-2 order-1 sm:order-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/5 border-white/10 h-9 w-9 p-0 text-white"
                                        disabled={page <= 1 || loading}
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
                                        className="bg-white/5 border-white/10 h-9 w-9 p-0 text-white"
                                        disabled={page >= totalPages || loading}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        aria-label="다음 페이지"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!detailOrderId} onOpenChange={(o) => !o && closeDetail()}>
                <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">주문 상세</DialogTitle>
                    </DialogHeader>
                    {loadingDetail ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                    ) : detailData?.order ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">주문번호</span>
                                    <p className="text-white font-medium">{String(detailData.order.order_number)}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">수령인</span>
                                    <p className="text-white">{String(detailData.order.recipient_name)}</p>
                                </div>
                                {detailData.order.user_id ? (
                                    <div className="col-span-2">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">주문자 (회원)</span>
                                        <p className="text-white/90">{String(detailData.order.user_name ?? '-')} ({String(detailData.order.user_email ?? '')})</p>
                                    </div>
                                ) : (
                                    <div className="col-span-2">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">주문자 (비회원)</span>
                                        <p className="text-amber-400/90">비회원 · {String(detailData.order.guest_email ?? '-')}</p>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold text-white/40 uppercase">배송지</span>
                                    <p className="text-white">{String(detailData.order.shipping_address)} {detailData.order.shipping_postal_code ? `(${detailData.order.shipping_postal_code})` : ''}</p>
                                    <p className="text-white/70">{String(detailData.order.recipient_phone)}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">총 금액</span>
                                    {(() => {
                                        const order = detailData.order;
                                        let expertAmount: number | null = null;
                                        if (order.has_expert_quote && order.expert_quote_data) {
                                            try {
                                                const d = JSON.parse(order.expert_quote_data);
                                                expertAmount = Number(d.total_amount || 0);
                                            } catch { }
                                        }
                                        const autoAmountRaw = Math.round(Number(order.total_amount || 0));
                                        const autoAmountKr = correctDisplayAmount(autoAmountRaw) ?? autoAmountRaw;
                                        return expertAmount && expertAmount > 0 ? (
                                            <div className="mt-0.5">
                                                <p className="font-bold text-emerald-400">₩ {expertAmount.toLocaleString()} <span className="text-[10px] text-emerald-500/70 font-normal">(수정견적)</span></p>
                                                <p className="text-xs text-white/30 line-through">₩ {autoAmountKr.toLocaleString()} (자동견적)</p>
                                            </div>
                                        ) : (
                                            <p className="text-white font-bold">₩ {autoAmountKr.toLocaleString()}</p>
                                        );
                                    })()}
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">고객 메모</span>
                                    <p className="text-white/80">{String(detailData.order.customer_note || '-')}</p>
                                </div>
                                {detailData.order.quotation_sent_at && (
                                    <div className="col-span-2">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">견적서 발송 일시</span>
                                        <p className="text-emerald-400/90 text-sm">
                                            {new Date(String(detailData.order.quotation_sent_at)).toLocaleString('ko-KR')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {detailData.items && detailData.items.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-[10px] font-bold text-white/40 uppercase">주문 항목</Label>
                                        {detailData.items.filter((it) => it.file_url).length > 1 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                                onClick={() => handleBulkDownload()}
                                                disabled={downloadingFileId !== null}
                                            >
                                                <Download className="w-3 h-3 mr-1.5" />
                                                전체 다운로드 ({detailData.items.filter((it) => it.file_url).length}개)
                                            </Button>
                                        )}
                                    </div>
                                    <div className="mt-2 rounded-lg border border-white/10 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-white/5">
                                                    <th className="p-2 text-left text-white/70 pl-4">파일 / 고객 출력 설정</th>
                                                    <th className="p-2 text-right text-white/70">수량</th>
                                                    <th className="p-2 text-right text-white/70">단가</th>
                                                    <th className="p-2 text-right text-white/70">소계</th>
                                                    <th className="p-2 text-center text-white/70 w-24">파일</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailData.items.map((it) => {
                                                    const upRaw = Math.round(Number(it.unit_price || 0));
                                                    const subRaw = Math.round(Number(it.subtotal || 0));
                                                    const unitPrice = correctDisplayAmount(upRaw) ?? upRaw;
                                                    const subtotal = correctDisplayAmount(subRaw) ?? subRaw;
                                                    const method = String(it.print_method || '').toUpperCase() || '-';
                                                    const settingsLine = formatQuotePrintSettings(it);
                                                    const guideLine = formatQuoteGuideContext(it);
                                                    return (
                                                    <tr key={it.id} className="border-b border-white/5 align-top">
                                                        <td className="p-3 text-white/90 pl-4">
                                                            <div className="font-medium text-white">{it.file_name || '-'}</div>
                                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                                <span className="inline-flex items-center rounded-md bg-teal-400/15 border border-teal-400/25 px-2 py-0.5 text-[10px] font-black tracking-wide text-teal-300">
                                                                    {method}
                                                                </span>
                                                                {settingsLine ? (
                                                                    <span className="text-[11px] text-white/70 leading-relaxed">{settingsLine}</span>
                                                                ) : (
                                                                    <span className="text-[11px] text-white/35">출력 설정 정보 없음</span>
                                                                )}
                                                            </div>
                                                            {it.estimated_time_hours != null && Number(it.estimated_time_hours) > 0 && (
                                                                <div className="mt-1 text-[10px] text-white/40">
                                                                    예상 출력 {Number(it.estimated_time_hours).toFixed(2)}h
                                                                    {it.volume_cm3 != null ? ` · 부피 ${Number(it.volume_cm3).toFixed(1)} cm³` : ''}
                                                                </div>
                                                            )}
                                                            {guideLine ? (
                                                                <div className="mt-1 text-[10px] text-teal-300/75">
                                                                    가이드 유입: {guideLine}
                                                                </div>
                                                            ) : null}
                                                        </td>
                                                        <td className="p-2 text-right">{it.quantity}</td>
                                                        <td className="p-2 text-right">₩ {unitPrice.toLocaleString()}</td>
                                                        <td className="p-2 text-right font-medium">₩ {subtotal.toLocaleString()}</td>
                                                        <td className="p-2 text-center">
                                                            {it.file_url ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 px-3 text-xs text-primary hover:text-primary/90 hover:bg-primary/10 disabled:opacity-50"
                                                                    disabled={downloadingFileId === it.id}
                                                                    onClick={() => handleFileDownload(Number(detailOrderId), it.id, it.quote_id, it.file_name)}
                                                                >
                                                                    {downloadingFileId === it.id ? (
                                                                        <>
                                                                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                                                            다운로드 중...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FileDown className="w-3.5 h-3.5 mr-1" />
                                                                            다운로드
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            ) : (
                                                                <span className="text-[10px] text-white/30">파일 없음</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ); })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* 자동 견적 총액 요약 */}
                                    <div className="mt-2 flex justify-end">
                                        <span className="text-white/50 text-xs">자동 견적 총액 </span>
                                        <span className="ml-2 font-bold text-white">
                                            ₩ {detailData.items.reduce((acc, it) => acc + (correctDisplayAmount(Math.round(Number(it.subtotal || 0))) ?? Math.round(Number(it.subtotal || 0))), 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}



                            {detailData.shipment ? (
                                <div>
                                    <Label className="text-[10px] font-bold text-white/40 uppercase">배송 추적</Label>
                                    <p className="text-sm text-white/80 mt-1">
                                        {String(detailData.shipment.carrier ?? '택배')} {String(detailData.shipment.tracking_number ?? '')} {String(detailData.shipment.status ?? '')}
                                    </p>
                                </div>
                            ) : null}

                            <div>
                                <Label className="text-[10px] font-bold text-white/40 uppercase">관리자 메모</Label>
                                <textarea
                                    value={detailAdminNote}
                                    onChange={(e) => setDetailAdminNote(e.target.value)}
                                    rows={2}
                                    className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 resize-y"
                                    placeholder="내부 메모"
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold text-white/40 uppercase">상태</Label>
                                <Select value={detailStatus} onValueChange={setDetailStatus}>
                                    <SelectTrigger className="mt-1 w-full max-w-[200px] bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" className="border-white/10 text-white mr-auto hover:bg-white/10" onClick={closeDetail}>닫기</Button>
                        <Button onClick={handleSaveDetail} disabled={savingDetail || loadingDetail}>
                            {savingDetail ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 제작중 전환 시 수정견적 금액 확인 다이얼로그 */}
            <Dialog open={!!confirmProductionDialog} onOpenChange={(o) => !o && setConfirmProductionDialog(null)}>
                <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            🔔 제작 시작 전 확인
                        </DialogTitle>
                    </DialogHeader>
                    {confirmProductionDialog && (
                        <div className="space-y-4 py-2">
                            <p className="text-white/70 text-sm">이 주문은 전문가 수정 견적이 있습니다.</p>
                            <div className="rounded-lg bg-white/[0.03] border border-white/10 p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-white/50 text-sm">자동 견적 금액</span>
                                    <span className="text-white/40 text-sm line-through">₩ {confirmProductionDialog.autoAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-emerald-400 font-medium text-sm">수정 견적 금액 (확정)</span>
                                    <span className="text-emerald-400 font-bold text-lg">₩ {confirmProductionDialog.expertAmount.toLocaleString()}</span>
                                </div>
                            </div>
                            <p className="text-white/50 text-xs">수정 견적 금액으로 제작을 시작합니다. 계속하시겠습니까?</p>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="border-white/10 text-white" onClick={() => setConfirmProductionDialog(null)}>취소</Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                            onClick={async () => {
                                if (confirmProductionDialog) {
                                    const { orderId } = confirmProductionDialog;
                                    setConfirmProductionDialog(null);
                                    await doStatusChange(orderId, 'production');
                                }
                            }}
                        >
                            제작 시작 확인
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function OrderList() {
    return (
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
            <OrderListInner />
        </Suspense>
    );
}
