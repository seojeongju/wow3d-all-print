'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Loader2, Printer, PenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QuoteList() {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders');
            const data = await res.json();
            if (data.success) {
                // 수동으로 견적서 상태(가상) 추가 가능
                setOrders(data.data || []);
            }
        } catch (e) {
            console.error('Failed to fetch orders', e);
            toast({ title: '목록 조회 실패', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return orders;
        return orders.filter(
            (o) =>
                (o.order_number || '').toLowerCase().includes(q) ||
                (o.recipient_name || '').toLowerCase().includes(q)
        );
    }, [orders, searchQuery]);

    const handlePrint = (id: number) => {
        window.open(`/print/estimate/${id}`, '_blank', 'width=900,height=1000');
    };

    const handleEdit = (id: number) => {
        // 견적서 수정 페이지로 이동 (추후 구현)
        router.push(`/admin/quotes/${id}`);
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
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">견적 관리</h1>
                <p className="text-white/50 text-sm mt-1">접수된 견적 요청(주문) 목록을 확인하고 견적서를 발행합니다.</p>
            </div>

            <div className="flex items-center gap-4">
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
            </div>

            <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-4 font-medium text-white/70">주문번호</th>
                                    <th className="p-4 font-medium text-white/70">고객명</th>
                                    <th className="p-4 font-medium text-white/70">품목수</th>
                                    <th className="p-4 font-medium text-white/70">견적 금액</th>
                                    <th className="p-4 font-medium text-white/70">접수일</th>
                                    <th className="p-4 font-medium text-right text-white/70">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((order) => (
                                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-medium text-white">{order.order_number}</td>
                                        <td className="p-4 text-white/90">
                                            {order.recipient_name}
                                            <span className="block text-xs text-white/40">{order.user_email || order.guest_email}</span>
                                        </td>
                                        <td className="p-4 text-white/50">{order.item_count || 1}개</td>
                                        <td className="p-4 font-bold text-white">₩ {Number(order.total_amount || 0).toLocaleString()}</td>
                                        <td className="p-4 text-white/50">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                                        <td className="p-4 text-right space-x-2">
                                            {/* 수정 버튼 (추후 구현) */}

                                            <Button
                                                variant="outline" size="sm"
                                                className="border-white/10 text-white hover:bg-white/10"
                                                onClick={() => handleEdit(order.id)}
                                            >
                                                <PenLine className="w-3.5 h-3.5 mr-1.5" />
                                                작성/수정
                                            </Button>

                                            <Button
                                                variant="secondary" size="sm"
                                                className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20"
                                                onClick={() => handlePrint(order.id)}
                                            >
                                                <Printer className="w-3.5 h-3.5 mr-1.5" />
                                                견적서 인쇄
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-white/40">
                                            데이터가 없습니다.
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
