'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Download, Loader2, Eye } from 'lucide-react';
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

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'pending', label: '접수 대기' },
    { value: 'confirmed', label: '주문 확인' },
    { value: 'production', label: '제작 중' },
    { value: 'shipping', label: '배송 중' },
    { value: 'completed', label: '완료됨' },
    { value: 'cancelled', label: '취소' },
];

function getStatusBadge(status: string) {
    switch (status) {
        case 'pending': return <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">접수 대기</Badge>;
        case 'confirmed': return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">주문 확인</Badge>;
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
    const { user } = useAuthStore();
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

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders');
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
        fetch(`/api/admin/orders/${detailOrderId}`)
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
                headers: { 'Content-Type': 'application/json' },
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
            o.user_name || '-',
            o.user_email || '-',
            String(o.item_count ?? 1),
            String(Number(o.total_amount || 0)),
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
            list = list.filter(
                (o) =>
                    (o.order_number || '').toLowerCase().includes(q) ||
                    (o.recipient_name || '').toLowerCase().includes(q)
            );
        }
        if (statusFilter && statusFilter !== 'all') {
            list = list.filter((o) => o.status === statusFilter);
        }
        return list;
    }, [orders, searchQuery, statusFilter, scopeFilter, user?.id]);

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
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
                <p className="text-white/50 text-sm mt-1">접수된 주문을 확인하고 상태를 변경할 수 있습니다.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.06] border border-white/10">
                    <button
                        type="button"
                        onClick={() => setScopeFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${scopeFilter === 'all' ? 'bg-primary/20 text-primary' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                        전체
                    </button>
                    <button
                        type="button"
                        onClick={() => setScopeFilter('mine')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${scopeFilter === 'mine' ? 'bg-primary/20 text-primary' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                        내 주문
                    </button>
                </div>
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                        type="search"
                        placeholder="주문번호, 고객명 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
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
                <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/5" onClick={handleCsvDownload}>
                    <Download className="w-4 h-4 mr-2" /> CSV 다운로드
                </Button>
            </div>

            <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-4 font-medium text-white/70">주문번호</th>
                                    <th className="p-4 font-medium text-white/70">고객명</th>
                                    <th className="p-4 font-medium text-white/70">주문 내역</th>
                                    <th className="p-4 font-medium text-white/70">금액</th>
                                    <th className="p-4 font-medium text-white/70">상태</th>
                                    <th className="p-4 font-medium text-white/70">날짜</th>
                                    <th className="p-4 font-medium text-right text-white/70">상태 변경</th>
                                    <th className="p-4 font-medium text-white/70 w-12">상세</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((order) => (
                                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-medium text-white">{order.order_number}</td>
                                        <td className="p-4 text-white/90">{order.recipient_name}</td>
                                        <td className="p-4 text-white/50">{order.item_count || 1}개 품목</td>
                                        <td className="p-4 font-bold text-white">₩ {Number(order.total_amount || 0).toLocaleString()}</td>
                                        <td className="p-4">{getStatusBadge(order.status)}</td>
                                        <td className="p-4 text-white/50">{order.created_at ? new Date(order.created_at).toLocaleDateString('ko-KR') : '-'}</td>
                                        <td className="p-4 text-right">
                                            <Select
                                                value={order.status}
                                                onValueChange={(v) => handleStatusChange(order.id, v)}
                                                disabled={updatingId === order.id}
                                            >
                                                <SelectTrigger className="w-[130px] h-8 bg-white/5 border-white/10 text-white text-xs">
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
                                        <td colSpan={8} className="p-12 text-center text-white/40">
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
                                {(detailData.order.user_name != null || detailData.order.user_email != null) ? (
                                    <div className="col-span-2">
                                        <span className="text-[10px] font-bold text-white/40 uppercase">주문자 (회원)</span>
                                        <p className="text-white/90">{String(detailData.order.user_name ?? '-')} ({String(detailData.order.user_email ?? '')})</p>
                                    </div>
                                ) : null}
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold text-white/40 uppercase">배송지</span>
                                    <p className="text-white">{String(detailData.order.shipping_address)} {detailData.order.shipping_postal_code ? `(${detailData.order.shipping_postal_code})` : ''}</p>
                                    <p className="text-white/70">{String(detailData.order.recipient_phone)}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">총 금액</span>
                                    <p className="text-white font-bold">₩ {Number(detailData.order.total_amount || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">고객 메모</span>
                                    <p className="text-white/80">{String(detailData.order.customer_note || '-')}</p>
                                </div>
                            </div>

                            {detailData.items && detailData.items.length > 0 && (
                                <div>
                                    <Label className="text-[10px] font-bold text-white/40 uppercase">주문 항목</Label>
                                    <div className="mt-2 rounded-lg border border-white/10 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-white/10 bg-white/5"><th className="p-2 text-left text-white/70">파일/방식</th><th className="p-2 text-right text-white/70">수량</th><th className="p-2 text-right text-white/70">단가</th><th className="p-2 text-right text-white/70">소계</th></tr></thead>
                                            <tbody>
                                                {detailData.items.map((it: any) => (
                                                    <tr key={it.id} className="border-b border-white/5">
                                                        <td className="p-2 text-white/90">{it.file_name || '-'} ({it.print_method || '-'})</td>
                                                        <td className="p-2 text-right">{it.quantity}</td>
                                                        <td className="p-2 text-right">₩ {Number(it.unit_price || 0).toLocaleString()}</td>
                                                        <td className="p-2 text-right font-medium">₩ {Number(it.subtotal || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" className="border-white/10 text-white" onClick={closeDetail}>닫기</Button>
                        <Button onClick={handleSaveDetail} disabled={savingDetail || loadingDetail}>
                            {savingDetail ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
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
