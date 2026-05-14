'use client';

import { correctDisplayAmount } from '@/lib/amount-display';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Download, Loader2, Eye, FileDown, Printer, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
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

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'pending', label: '접수 대기' },
    { value: 'confirmed', label: '주문 확인' },
    { value: 'quote_sent', label: '견적 발송' },
    { value: 'payment_confirmed', label: '결제 확인' },
    { value: 'production', label: '제작 중' },
    { value: 'shipping', label: '배송 중' },
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
        case 'completed': return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">완료됨</Badge>;
        case 'cancelled': return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">취소</Badge>;
        default: return <Badge variant="outline" className="bg-white/10 text-white/60">미정</Badge>;
    }
}

type DetailData = { order: Record<string, unknown>; items: Record<string, unknown>[]; shipment: Record<string, unknown> | null };

function OrderListInner() {
    const { toast } = useToast();
    const { user, token } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
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

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.success) setOrders(data.data || []);
        } catch (e) {
            console.error('Failed to fetch orders', e);
            toast({ title: '주문 목록 조회 실패', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

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
                    const items = (j.data.items || []) as { id?: number }[];
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
    }, [detailOrderId, toast]);

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

    const handleCsvDownload = () => {
        const headers = ['주문번호', '고객명', '주문자', '이메일', '품목수', '금액', '상태', '날짜'];
        const rows = filtered.map((o) => [
            o.order_number || '',
            o.recipient_name || '',
            o.user_id ? (o.user_name || '-') : '비회원',
            o.user_email || o.guest_email || '-',
            String(o.item_count ?? 1),
            String(Math.round(Number(o.total_amount || 0))),
            o.status || '',
            o.created_at ? new Date(o.created_at).toLocaleDateString('ko-KR') : '',
        ]);
        const BOM = '\uFEFF';
        const csv = BOM + [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `wow3d-orders-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast({ title: 'CSV 다운로드 완료' });
    };

    const filtered = useMemo(() => {
        let list = orders;
        if (scopeFilter === 'mine' && user?.id) {
            list = list.filter((o) => Number(o.user_id) === user.id);
        }
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter((o) => {
                // 주문번호, 수령인 이름, 이메일 검색
                if ((o.order_number || '').toLowerCase().includes(q)) return true;
                if ((o.recipient_name || '').toLowerCase().includes(q)) return true;
                if ((o.user_email || '').toLowerCase().includes(q)) return true;
                if ((o.guest_email || '').toLowerCase().includes(q)) return true;
                // 파일명 검색 (items_summary JSON에서 추출)
                try {
                    const items = typeof o.items_summary === 'string'
                        ? JSON.parse(o.items_summary)
                        : (Array.isArray(o.items_summary) ? o.items_summary : []);
                    if (items.some((it: any) => (it.file_name || '').toLowerCase().includes(q))) return true;
                } catch { }
                return false;
            });
        }
        if (statusFilter && statusFilter !== 'all') {
            list = list.filter((o) => o.status === statusFilter);
        }
        return list;
    }, [orders, searchQuery, statusFilter, scopeFilter, user?.id]);

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
        } catch (e) {
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


    const handleBulkDownload = async (orderId?: number, itemsToUse?: any[]) => {
        const orderIdToUse = orderId || detailOrderId;
        const items = itemsToUse || (detailData?.items as any[]);

        if (!orderIdToUse || !items || items.length === 0) {
            toast({ title: '다운로드할 파일이 없습니다.', variant: 'destructive' });
            return;
        }

        const filesToDownload = items.filter((it: any) => it.file_url || it.quote_id);
        if (filesToDownload.length === 0) {
            toast({ title: '다운로드할 파일이 없습니다.', variant: 'destructive' });
            return;
        }

        toast({ title: `${filesToDownload.length}개 파일 다운로드 시작...` });

        let successCount = 0;
        let failCount = 0;

        for (const item of filesToDownload) {
            try {
                await handleFileDownload(Number(orderIdToUse), Number(item.id), Number(item.quote_id), String(item.file_name));
                successCount++;
                // 다운로드 사이에 약간의 지연 추가 (브라우저가 처리할 시간 제공)
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                failCount++;
                console.error(`Failed to download ${item.file_name}:`, e);
            }
        }

        if (failCount === 0) {
            toast({ title: `✅ ${successCount}개 파일 다운로드 완료` });
        } else {
            toast({
                title: `다운로드 완료`,
                description: `성공: ${successCount}개, 실패: ${failCount}개`,
                variant: failCount > successCount ? 'destructive' : 'default',
            });
        }
    };



    if (loading) {
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
                        onClick={() => setScopeFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${scopeFilter === 'all' ? 'bg-primary/30 text-zinc-100 border border-primary/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    >
                        전체
                    </button>
                    <button
                        type="button"
                        onClick={() => setScopeFilter('mine')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${scopeFilter === 'mine' ? 'bg-primary/30 text-zinc-100 border border-primary/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    >
                        내 주문
                    </button>
                </div>
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                    <Input
                        type="search"
                        placeholder="주문번호, 고객명 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/45"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                <Button variant="outline" size="sm" className="border-white/20 text-white/90 hover:bg-white/10" onClick={handleCsvDownload}>
                    <Download className="w-4 h-4 mr-2" /> CSV 다운로드
                </Button>
            </div>

            <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
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
                                {filtered.map((order) => (
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
                                            <div className="flex items-center gap-2">
                                                <span>{order.item_count || 1}개 품목</span>
                                                {(() => {
                                                    let items: any[] = [];
                                                    try {
                                                        if (typeof order.items_summary === 'string') {
                                                            items = JSON.parse(order.items_summary);
                                                        } else if (Array.isArray(order.items_summary)) {
                                                            items = order.items_summary;
                                                        }
                                                    } catch (e) { }

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
                                        <td className="p-4 text-white/70">{order.created_at ? new Date(order.created_at).toLocaleDateString('ko-KR') : '-'}</td>
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
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="p-12 text-center text-white/40">
                                            {orders.length === 0 ? '접수된 주문이 없습니다.' : '검색 결과가 없습니다.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
                                        const order = detailData.order as any;
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
                                {(detailData.order as any).quotation_sent_at && (
                                    <div className="col-span-2">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">견적서 발송 일시</span>
                                        <p className="text-emerald-400/90 text-sm">
                                            {new Date((detailData.order as any).quotation_sent_at).toLocaleString('ko-KR')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {detailData.items && detailData.items.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-[10px] font-bold text-white/40 uppercase">주문 항목</Label>
                                        {detailData.items.filter((it: any) => it.file_url).length > 1 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                                onClick={() => handleBulkDownload()}
                                                disabled={downloadingFileId !== null}
                                            >
                                                <Download className="w-3 h-3 mr-1.5" />
                                                전체 다운로드 ({detailData.items.filter((it: any) => it.file_url).length}개)
                                            </Button>
                                        )}
                                    </div>
                                    <div className="mt-2 rounded-lg border border-white/10 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-white/10 bg-white/5"><th className="p-2 text-left text-white/70 pl-4">파일/방식</th><th className="p-2 text-right text-white/70">수량</th><th className="p-2 text-right text-white/70">단가</th><th className="p-2 text-right text-white/70">소계</th><th className="p-2 text-center text-white/70 w-24">파일</th></tr></thead>
                                            <tbody>
                                                {detailData.items.map((it: any) => {
                                                    const upRaw = Math.round(Number(it.unit_price || 0));
                                                    const subRaw = Math.round(Number(it.subtotal || 0));
                                                    const unitPrice = correctDisplayAmount(upRaw) ?? upRaw;
                                                    const subtotal = correctDisplayAmount(subRaw) ?? subRaw;
                                                    return (
                                                    <tr key={it.id} className="border-b border-white/5">
                                                        <td className="p-2 text-white/90 pl-4">{it.file_name || '-'} ({it.print_method || '-'})</td>
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
                                            ₩ {(detailData.items as any[]).reduce((acc: number, it: any) => acc + (correctDisplayAmount(Math.round(Number(it.subtotal || 0))) ?? Math.round(Number(it.subtotal || 0))), 0).toLocaleString()}
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
