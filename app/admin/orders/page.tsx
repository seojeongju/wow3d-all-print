'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Download, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

export default function OrderList() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

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

    useEffect(() => {
        fetchOrders();
    }, []);

    const filtered = useMemo(() => {
        let list = orders;
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
    }, [orders, searchQuery, statusFilter]);

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

            <div className="flex flex-col sm:flex-row gap-4">
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
                <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/5">
                    <Download className="w-4 h-4 mr-2" /> 엑셀 다운로드
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
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-white/40">
                                            {orders.length === 0 ? '접수된 주문이 없습니다.' : '검색 결과가 없습니다.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
