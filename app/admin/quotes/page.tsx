'use client';

import React, { useState, useEffect, useMemo } from 'react';

/** DB 주문 금액 단위 → 원화 (주문관리·견적서 수정과 동일) */
// 금액은 DB/API에서 원화(KRW)로 저장·전달됨
import { correctDisplayAmount } from '@/lib/amount-display';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Printer, PenLine, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { SendQuotationDialog } from '@/components/admin/SendQuotationDialog';

export default function QuoteList() {
    const { toast } = useToast();
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [sendQuotationOrderId, setSendQuotationOrderId] = useState<number | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
    const [showMergedSendDialog, setShowMergedSendDialog] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
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

    // 견적서 수정 페이지에서 돌아올 때 목록 새로고침 (수정견적 금액 반영)
    useEffect(() => {
        const onFocus = () => fetchOrders();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return orders;
        return orders.filter((o) => {
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
    }, [orders, searchQuery]);

    // 전문가 견적 데이터 파싱 (snake_case / camelCase 모두 처리)
    const parseExpertQuote = (order: any) => {
        const hasExpert = order?.has_expert_quote ?? order?.hasExpertQuote;
        const rawData = order?.expert_quote_data ?? order?.expertQuoteData;
        if (!hasExpert || !rawData) return null;
        try {
            const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
            return data && typeof data === 'object' ? data : null;
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
        quote_sent: '견적발송',
        payment_confirmed: '결제확인',
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

    const selectedOrders = useMemo(() => {
        const ids = Array.from(selectedOrderIds);
        return ids.map((id) => orders.find((o) => o.id === id)).filter(Boolean);
    }, [orders, selectedOrderIds]);

    const handleMergedPrint = async () => {
        const ids = Array.from(selectedOrderIds);
        if (ids.length === 0) {
            toast({ title: '선택된 견적이 없습니다.', variant: 'destructive' });
            return;
        }
        if (token) localStorage.setItem('admin_print_token', token);

        try {
            const responses = await Promise.all(
                ids.map(async (oid) => {
                    const res = await fetch(`/api/admin/orders/${oid}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    const j = await res.json();
                    if (!j?.success) throw new Error(j?.error || `주문 ${oid} 조회 실패`);
                    return j.data;
                })
            );

            const baseOrder = responses[0]?.order || {};
            const mergedItems: any[] = [];
            for (const d of responses) {
                const order = d?.order || {};
                const orderNo = order?.order_number || '';
                const items = (d?.items || []) as any[];
                for (const it of items) {
                    mergedItems.push({
                        id: `${order?.id ?? ''}-${it?.id ?? ''}`,
                        file_name: orderNo ? `[${orderNo}] ${it.file_name || '-'}` : (it.file_name || '-'),
                        print_method: it.print_method || '',
                        material_name: it.material_name || '',
                        quantity: Number(it.quantity) || 1,
                        unit_price: correctDisplayAmount(Math.round(Number(it.unit_price || 0))) ?? Math.round(Number(it.unit_price || 0)),
                    });
                }
            }
            const totalSupply = mergedItems.reduce((acc, it) => acc + Math.round(Number(it.unit_price || 0)) * Math.round(Number(it.quantity || 0)), 0);
            const totalVat = Math.floor(totalSupply * 0.1);
            const totalAmount = totalSupply + totalVat;

            const tempId = `merged-${Date.now()}`;
            const printData = {
                order: {
                    ...baseOrder,
                    order_number: `MERGED-${ids.length}건`,
                    total_amount: totalAmount,
                    has_expert_quote: false,
                    expert_quote_data: null,
                },
                items: mergedItems.map((it) => ({
                    ...it,
                    subtotal: Math.round(Number(it.unit_price || 0)) * Math.round(Number(it.quantity || 0)),
                })),
            };
            localStorage.setItem(`quote_temp_${tempId}`, JSON.stringify(printData));
            window.open(`/print/estimate/${tempId}?temp=true`, '_blank', 'width=900,height=1000');
        } catch (e) {
            toast({ title: '선택 견적 인쇄 실패', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
        }
    };

    const handleQuotationSent = (orderId: number) => (result: { success: boolean; message?: string; emailSent?: boolean; sentAt?: string }) => {
        if (result.sentAt) {
            setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, quotation_sent_at: result.sentAt } : o));
        }
        toast({
            title: result.message || '견적서가 발송되었습니다.',
            variant: result.emailSent === false ? 'destructive' : 'default',
            description: result.emailSent === false ? '발신 도메인 인증 또는 RESEND_FROM 설정을 확인해 주세요.' : undefined,
        });
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">견적 관리</h1>
                <p className="text-white/70 text-sm mt-1">접수된 견적 요청(주문) 목록을 확인하고 견적서를 발행합니다.</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                        type="search"
                        placeholder="주문번호, 고객명 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/45"
                    />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        size="sm"
                        className="bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs h-9 px-4 rounded-xl transition-all"
                        onClick={handleMergedPrint}
                        disabled={selectedOrderIds.size === 0}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        선택 견적 인쇄
                    </Button>
                    <Button
                        size="sm"
                        className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 text-xs h-9 px-4 rounded-xl transition-all"
                        onClick={() => setShowMergedSendDialog(true)}
                        disabled={selectedOrderIds.size === 0}
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        선택 견적 이메일 발송
                    </Button>
                </div>
            </div>

            <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="p-4 font-medium text-white/95 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={filtered.length > 0 && filtered.every((o) => selectedOrderIds.has(o.id))}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setSelectedOrderIds((prev) => {
                                                    const next = new Set(prev);
                                                    if (checked) filtered.forEach((o) => next.add(o.id));
                                                    else filtered.forEach((o) => next.delete(o.id));
                                                    return next;
                                                });
                                            }}
                                            className="rounded border-white/30 bg-white/5 text-primary focus:ring-primary"
                                            aria-label="전체 선택"
                                        />
                                    </th>
                                    <th className="p-4 font-medium text-white/95 w-8"></th>
                                    <th className="p-4 font-medium text-white/95">주문번호</th>
                                    <th className="p-4 font-medium text-white/95">고객명</th>
                                    <th className="p-4 font-medium text-white/95">품목수</th>
                                    <th className="p-4 font-medium text-white/95">자동견적 금액</th>
                                    <th className="p-4 font-medium text-white/95">수정견적 금액</th>
                                    <th className="p-4 font-medium text-white/95">접수일</th>
                                    <th className="p-4 font-medium text-white/95">현재 상태</th>
                                    <th className="p-4 font-medium text-right text-white/95">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((order) => {
                                    const expertData = parseExpertQuote(order);
                                    const expertAmount = expertData?.total_amount;
                                    const isExpanded = expandedRows.has(order.id);
                                    const isSelected = selectedOrderIds.has(order.id);

                                    return (
                                        <React.Fragment key={order.id}>
                                            {/* 메인 행 */}
                                            <tr
                                                className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                                            >
                                                <td className="p-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            setSelectedOrderIds((prev) => {
                                                                const next = new Set(prev);
                                                                if (next.has(order.id)) next.delete(order.id);
                                                                else next.add(order.id);
                                                                return next;
                                                            });
                                                        }}
                                                        className="rounded border-white/30 bg-white/5 text-primary focus:ring-primary"
                                                        aria-label={`${order.order_number} 선택`}
                                                    />
                                                </td>
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
                                                <td className="p-4 text-white/95">
                                                    {order.recipient_name}
                                                    <span className="block text-xs text-white/60">{order.user_email || order.guest_email}</span>
                                                </td>
                                                <td className="p-4 text-white/70">{order.item_count || 1}개</td>
                                                <td className="p-4 text-white/75">
                                                    {(() => {
                                                        const totalRaw = Math.round(Number(order.total_amount || 0));
                                                        const itemsSumRaw = Math.round(Number(order.items_total ?? order.total_amount ?? 0));
                                                        const total = correctDisplayAmount(totalRaw) ?? totalRaw;
                                                        const itemsSum = correctDisplayAmount(itemsSumRaw) ?? itemsSumRaw;
                                                        const mismatch = order.items_total != null && Math.abs(totalRaw - itemsSumRaw) > 1;
                                                        const isLikely1300x = mismatch && itemsSumRaw > 0 && totalRaw > 0 && Math.abs(totalRaw / itemsSumRaw - 1300) < 50;
                                                        return (
                                                            <div className="space-y-0.5">
                                                                <span className={expertData ? 'line-through text-white/30' : 'font-bold text-white'}>
                                                                    ₩ {total.toLocaleString()}
                                                                    {total !== totalRaw && <span className="ml-1 text-[10px] text-white/50">(보정)</span>}
                                                                </span>
                                                                {mismatch && (
                                                                    <div className="text-[10px] text-amber-400/90" title={isLikely1300x ? '과거 원화 변환 시 1300이 중복 적용된 데이터일 수 있습니다. 항목합계가 올바른 값입니다.' : '주문 총액과 항목 합계가 다릅니다. 작성/수정에서 확인하세요.'}>
                                                                        항목합계 ₩ {itemsSum.toLocaleString()} (불일치)
                                                                        {isLikely1300x && <span className="block text-white/50 mt-0.5">과거 금액 오류 가능</span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
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
                                                <td className="p-4 text-white/70 text-xs">
                                                    {order.created_at ? new Date(order.created_at).toLocaleDateString('ko-KR') : '-'}
                                                    {order.quotation_sent_at && (
                                                        <Badge variant="outline" className="ml-1.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1">발송됨</Badge>
                                                    )}
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
                                                                : order.status === 'quote_sent'
                                                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                                                : order.status === 'payment_confirmed'
                                                                ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                                                                : order.status === 'production'
                                                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                                                : order.status === 'shipping'
                                                                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                                                                : 'bg-white/10 text-white/80 border-white/20'
                                                        }`}
                                                    >
                                                        {getStatusLabel(order.status)}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-bold h-8 px-3 rounded-lg transition-all"
                                                            onClick={() => handleEdit(order.id)}
                                                        >
                                                            <PenLine className="w-3.5 h-3.5 mr-1.5" />
                                                            작성/수정
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:bg-teal-500/30 text-xs font-bold h-8 px-3 rounded-lg transition-all"
                                                            onClick={() => handlePrint(order.id, expertData || undefined)}
                                                        >
                                                            <Printer className="w-3.5 h-3.5 mr-1.5" />
                                                            견적서 인쇄
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 text-xs font-bold h-8 px-3 rounded-lg transition-all"
                                                            onClick={() => setSendQuotationOrderId(order.id)}
                                                        >
                                                            <Mail className="w-3.5 h-3.5 mr-1.5" />
                                                            이메일 발송
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* 확장 행: 자동견적 vs 수정견적 비교 */}
                                            {expertData && isExpanded && (
                                                <tr className="border-b border-white/5 bg-white/[0.015]">
                                                    <td colSpan={10} className="px-6 py-4">
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
                                                                        <span className="line-through text-white/30">₩ {(correctDisplayAmount(Math.round(Number(order.total_amount || 0))) ?? Math.round(Number(order.total_amount || 0))).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-white/40">
                                                                        <span>접수일</span>
                                                                        <span>{new Date(order.created_at).toLocaleDateString('ko-KR')}</span>
                                                                    </div>
                                                                    <div className="pt-2 flex justify-end">
                                                                        <Button
                                                                            size="sm"
                                                                            className="bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 text-xs h-7 px-2.5 rounded-lg transition-all"
                                                                            onClick={() => handlePrint(order.id)}
                                                                        >
                                                                            <Printer className="w-3.5 h-3.5 mr-1.5" /> 원본 출력
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* 전문가 수정견적 */}
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
                                                                            size="sm"
                                                                            className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200 text-xs h-7 px-2.5 rounded-lg transition-all font-bold"
                                                                            onClick={() => handlePrint(order.id, expertData)}
                                                                        >
                                                                            <Printer className="w-3.5 h-3.5 mr-1.5" /> 수정견적 출력
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="p-12 text-center text-white/40">
                                            데이터가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <SendQuotationDialog
                orderId={sendQuotationOrderId}
                open={sendQuotationOrderId != null}
                onOpenChange={(open) => !open && setSendQuotationOrderId(null)}
                token={token}
                onSent={sendQuotationOrderId != null ? handleQuotationSent(sendQuotationOrderId) : undefined}
            />

            <SendQuotationDialog
                orderId={null}
                open={showMergedSendDialog}
                onOpenChange={setShowMergedSendDialog}
                token={token}
                mergeOrderIds={Array.from(selectedOrderIds)}
                onSent={(r) => {
                    if (r?.sentAt) {
                        setOrders((prev) => prev.map((o) => selectedOrderIds.has(o.id) ? { ...o, quotation_sent_at: r.sentAt } : o));
                    }
                    toast({ title: r?.message || '선택 견적 이메일 발송 처리되었습니다.' });
                }}
            />
        </div>
    );
}
