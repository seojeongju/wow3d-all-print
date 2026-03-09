'use client';

import { useState, useEffect, useMemo } from 'react';

/** DB 주문 금액 단위 → 원화 (주문관리·견적서 수정과 동일) */
// 금액은 DB/API에서 원화(KRW)로 저장·전달됨
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Printer, PenLine, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';

export default function QuoteList() {
    const { toast } = useToast();
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.data || []);
            }
        } catch (e) {
            toast({ title: '목록 조회 실패', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return orders;
        return orders.filter(
            (o) => (o.order_number || '').toLowerCase().includes(q) ||
                (o.recipient_name || '').toLowerCase().includes(q)
        );
    }, [orders, searchQuery]);

    // 전문가 견적 데이터 파싱
    const parseExpertQuote = (order: any) => {
        if (!order.has_expert_quote || !order.expert_quote_data) return null;
        try {
            return JSON.parse(order.expert_quote_data);
        } catch {
            return null;
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // 주문 상태 → 한글 라벨
    const statusLabel: Record<string, string> = {
        pending: '접수대기',
        confirmed: '주문확인',
        production: '제작중',
        shipping: '배송중',
        completed: '완료',
        cancelled: '취소',
    };
    const getStatusLabel = (status: string) => statusLabel[status] || status || '-';

    const handlePrint = (id: number, expertData?: any) => {
        if (token) localStorage.setItem('admin_print_token', token);

        if (expertData) {
            const order = orders.find(o => o.id === id);
            const recipient = expertData.recipient || {};
            const printData = {
                order: {
                    order_number: order?.order_number,
                    created_at: order?.created_at,
                    recipient_name: recipient.name || order?.recipient_name || '',
                    recipient_phone: recipient.phone || order?.recipient_phone || '',
                    user_email: recipient.email || order?.user_email || order?.guest_email || '',
                    guest_email: recipient.email || order?.guest_email || '',
                    shipping_address: recipient.address || order?.shipping_address || '',
                    total_amount: expertData.total_amount,
                },
                items: expertData.items?.map((it: any) => ({
                    id: it.id,
                    file_name: it.name,
                    print_method: it.spec,
                    material_name: '',
                    quantity: it.quantity,
                    unit_price: Math.round(Number(it.unit_price) || 0),
                    subtotal: Math.round(Number(it.unit_price) || 0) * Number(it.quantity),
                }))
            };
            localStorage.setItem(`quote_temp_${id}`, JSON.stringify(printData));
            window.open(`/print/estimate/${id}?temp=true`, '_blank', 'width=900,height=1000');
        } else {
            window.open(`/print/estimate/${id}`, '_blank', 'width=900,height=1000');
        }
    };

    const handleEdit = (id: number) => router.push(`/admin/quotes/${id}`);

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
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
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="p-4 font-medium text-white/60 w-8"></th>
                                    <th className="p-4 font-medium text-white/60">주문번호</th>
                                    <th className="p-4 font-medium text-white/60">고객명</th>
                                    <th className="p-4 font-medium text-white/60">품목수</th>
                                    <th className="p-4 font-medium text-white/60">자동견적 금액</th>
                                    <th className="p-4 font-medium text-white/60">수정견적 금액</th>
                                    <th className="p-4 font-medium text-white/60">접수일</th>
                                    <th className="p-4 font-medium text-white/60">현재 상태</th>
                                    <th className="p-4 font-medium text-right text-white/60">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((order) => {
                                    const expertData = parseExpertQuote(order);
                                    const expertAmount = expertData?.total_amount;
                                    const isExpanded = expandedRows.has(order.id);

                                    return (
                                        <>
                                            {/* 메인 행 */}
                                            <tr
                                                key={order.id}
                                                className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                                            >
                                                <td className="p-4 text-center">
                                                    {expertData && (
                                                        <button
                                                            onClick={() => toggleExpand(order.id)}
                                                            className="text-white/40 hover:text-white transition-colors"
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-medium text-white">{order.order_number}</span>
                                                    {expertData && (
                                                        <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] py-0 px-1.5">수정견적</Badge>
                                                    )}
                                                </td>
                                                <td className="p-4 text-white/90">
                                                    {order.recipient_name}
                                                    <span className="block text-xs text-white/40">{order.user_email || order.guest_email}</span>
                                                </td>
                                                <td className="p-4 text-white/50">{order.item_count || 1}개</td>
                                                <td className="p-4 text-white/60">
                                                    <span className={expertData ? 'line-through text-white/30' : 'font-bold text-white'}>
                                                        ₩ {Math.round(Number(order.total_amount || 0)).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {expertData ? (
                                                        <span className="font-bold text-emerald-400">
                                                            ₩ {Number(expertAmount || 0).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-white/20 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-white/50 text-xs">
                                                    {order.created_at ? new Date(order.created_at).toLocaleDateString('ko-KR') : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs font-medium ${
                                                            order.status === 'completed'
                                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                                : order.status === 'cancelled'
                                                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                                : order.status === 'pending'
                                                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                                : 'bg-white/10 text-white/80 border-white/20'
                                                        }`}
                                                    >
                                                        {getStatusLabel(order.status)}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline" size="sm"
                                                            className="border-white/10 text-white hover:bg-white/10 text-xs"
                                                            onClick={() => handleEdit(order.id)}
                                                        >
                                                            <PenLine className="w-3 h-3 mr-1" />
                                                            작성/수정
                                                        </Button>
                                                        <Button
                                                            variant="secondary" size="sm"
                                                            className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20 text-xs"
                                                            onClick={() => handlePrint(order.id, expertData || undefined)}
                                                        >
                                                            <Printer className="w-3 h-3 mr-1" />
                                                            견적서 인쇄
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* 확장 행: 자동견적 vs 수정견적 비교 */}
                                            {expertData && isExpanded && (
                                                <tr key={`${order.id}-expand`} className="border-b border-white/5 bg-white/[0.015]">
                                                    <td colSpan={9} className="px-6 py-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* 자동견적 원본 */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider">자동견적 원본</span>
                                                                    <div className="h-px flex-1 bg-white/10"></div>
                                                                </div>
                                                                <div className="bg-white/[0.03] rounded-lg p-3 text-xs space-y-1.5">
                                                                    <div className="flex justify-between text-white/60">
                                                                        <span>총 금액</span>
                                                                        <span className="line-through text-white/30">₩ {Math.round(Number(order.total_amount || 0)).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-white/40">
                                                                        <span>접수일</span>
                                                                        <span>{new Date(order.created_at).toLocaleDateString('ko-KR')}</span>
                                                                    </div>
                                                                    <div className="pt-2 flex justify-end">
                                                                        <Button
                                                                            variant="ghost" size="sm"
                                                                            className="text-white/30 hover:text-white text-xs h-6 px-2"
                                                                            onClick={() => handlePrint(order.id)}
                                                                        >
                                                                            <Printer className="w-3 h-3 mr-1" /> 원본 출력
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* 수정견적 */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">전문가 수정견적</span>
                                                                    <div className="h-px flex-1 bg-emerald-500/20"></div>
                                                                </div>
                                                                <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg p-3 text-xs space-y-1.5">
                                                                    {expertData.items?.map((it: any, i: number) => {
                                                                        const supply = Math.round(Number(it.unit_price) || 0) * Number(it.quantity);
                                                                        return (
                                                                            <div key={i} className="flex justify-between text-white/70">
                                                                                <span className="truncate max-w-[160px]">{it.name || `품목 ${i + 1}`}</span>
                                                                                <span>{it.quantity}개 × {Math.round(Number(it.unit_price)).toLocaleString()}원 = {supply.toLocaleString()}원</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    <div className="border-t border-emerald-500/20 pt-2 mt-2">
                                                                        <div className="flex justify-between font-bold text-emerald-400">
                                                                            <span>최종 합계 (VAT 포함)</span>
                                                                            <span>₩ {Number(expertAmount || 0).toLocaleString()}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="pt-2 flex justify-end">
                                                                        <Button
                                                                            variant="ghost" size="sm"
                                                                            className="text-emerald-400 hover:text-emerald-300 text-xs h-6 px-2"
                                                                            onClick={() => handlePrint(order.id, expertData)}
                                                                        >
                                                                            <Printer className="w-3 h-3 mr-1" /> 수정견적 출력
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="p-12 text-center text-white/40">
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
