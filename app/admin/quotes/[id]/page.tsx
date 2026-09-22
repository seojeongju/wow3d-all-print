'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/** DB/API 금액 단위 → 원화 표시 (다른 페이지와 동일) */
// 금액은 원화(KRW)로 저장·표시
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Save, Plus, Trash2, ArrowLeft, RotateCcw, Pencil, Mail, ShoppingCart, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { formatKoreanDate } from '@/lib/date-utils';
import { formatQuotePrintSizeMm } from '@/lib/quote-print-settings';
import {
    DEFAULT_SHIPPING_SETTINGS,
    formatFreeShippingHint,
    parseShippingSettings,
    resolveShippingFee,
    type ShippingSettings,
} from '@/lib/shipping-settings';
import { SendQuotationDialog } from '@/components/admin/SendQuotationDialog';

type StandaloneQuote = {
    id: number;
    userId: number | null;
    fileName: string | null;
    volumeCm3: number | null;
    dimensionsX: number | null;
    dimensionsY: number | null;
    dimensionsZ: number | null;
    scalePercent: number | null;
    printMethod: string | null;
    printSettings: string | null;
    totalPrice: number;
    createdAt: string;
    userName: string | null;
    userEmail: string | null;
    orderId: number | null;
    orderNumber: string | null;
    inCart: boolean;
};

export default function QuoteEditPage() {
    const { toast } = useToast();
    const { token } = useAuthStore();
    const router = useRouter();
    const params = useParams();
    const id = params?.id;
    const orderId = typeof id === 'string' ? Number(id) : Array.isArray(id) ? Number(id[0]) : NaN;

    const [loading, setLoading] = useState(true);
    const [orderInfo, setOrderInfo] = useState<any>(null);
    const [standaloneQuote, setStandaloneQuote] = useState<StandaloneQuote | null>(null);

    const [recipient, setRecipient] = useState({ name: '', phone: '', email: '', address: '' });
    const [items, setItems] = useState<any[]>([]);
    const [autoItems, setAutoItems] = useState<any[]>([]);
    const [autoRecipient, setAutoRecipient] = useState({ name: '', phone: '', email: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [hasExpertQuote, setHasExpertQuote] = useState(false);
    const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
    const [shippingFeeOverride, setShippingFeeOverride] = useState<number | null>(null);
    const [shippingFeeManual, setShippingFeeManual] = useState(false);
    const [sendDialogOpen, setSendDialogOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        const applyOrderPayload = (data: { order: any; items: any[] }) => {
            const { order, items } = data;
            setStandaloneQuote(null);
            setOrderInfo(order);

            const baseRecipient = {
                name: order.recipient_name || '',
                phone: order.recipient_phone || '',
                email: order.user_email || order.guest_email || '',
                address: order.shipping_address || '',
            };
            setAutoRecipient(baseRecipient);

            const autoItemsMapped = items.map((it: any) => {
                const unitPriceBase = Number(it.unit_price) || 0;
                const unitPriceKr = Math.round(unitPriceBase);
                return {
                    id: it.id || Math.random(),
                    name: it.file_name,
                    spec: `${it.print_method || ''} ${it.material_name ? '/ ' + it.material_name : ''}`.trim(),
                    quantity: Number(it.quantity) || 1,
                    unit_price: unitPriceKr,
                };
            });
            setAutoItems(autoItemsMapped);

            if (order.has_expert_quote && order.expert_quote_data) {
                try {
                    const expertData = JSON.parse(order.expert_quote_data);
                    setItems(
                        expertData.items?.map((it: any) => ({
                            ...it,
                            unit_price: Math.round(Number(it.unit_price) || 0),
                            quantity: Number(it.quantity) || 1,
                        })) || []
                    );
                    setRecipient(expertData.recipient || baseRecipient);
                    if (expertData.shipping_fee != null && Number.isFinite(Number(expertData.shipping_fee))) {
                        setShippingFeeOverride(Number(expertData.shipping_fee));
                        setShippingFeeManual(true);
                    }
                    setHasExpertQuote(true);
                } catch {
                    setItems(autoItemsMapped);
                    setRecipient(baseRecipient);
                }
            } else {
                setItems(autoItemsMapped);
                setRecipient(baseRecipient);
            }
        };

        const load = async () => {
            setLoading(true);
            setOrderInfo(null);
            setStandaloneQuote(null);

            try {
                const settingsRes = await fetch('/api/settings');
                const settingsJson = await settingsRes.json();
                if (!cancelled && settingsJson.success && Array.isArray(settingsJson.data)) {
                    setShippingSettings(parseShippingSettings(settingsJson.data));
                }
            } catch {
                /* ignore */
            }

            const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
            // Meshy 카드 등: ?kind=quote → 견적 ID만 조회 (주문 API 404 콘솔 노이즈 방지)
            // 견적 관리 목록: 파라미터 없음 → 주문 ID로 견적서 수정
            const kind =
                typeof window !== 'undefined'
                    ? new URLSearchParams(window.location.search).get('kind')
                    : null;

            try {
                if (kind === 'quote') {
                    const quoteRes = await fetch(`/api/admin/quotes/${id}`, { headers, cache: 'no-store' });
                    const quoteJson = await quoteRes.json();
                    if (cancelled) return;

                    if (quoteRes.ok && quoteJson.success && quoteJson.data) {
                        const q = quoteJson.data as StandaloneQuote;
                        if (q.orderId != null && Number(q.orderId) > 0) {
                            router.replace(`/admin/quotes/${q.orderId}`);
                            return;
                        }
                        setStandaloneQuote(q);
                        return;
                    }

                    toast({
                        title: '데이터 로드 실패',
                        description: '견적을 찾을 수 없습니다.',
                        variant: 'destructive',
                    });
                    return;
                }

                // 주문 ID로 조회 (기존 견적서 수정 화면)
                const orderRes = await fetch(`/api/admin/orders/${id}`, { headers, cache: 'no-store' });
                const orderJson = await orderRes.json();
                if (cancelled) return;

                if (orderRes.ok && orderJson.success && orderJson.data) {
                    applyOrderPayload(orderJson.data);
                    return;
                }

                // 구 링크 호환: 주문 없으면 견적으로 한 번 더 시도
                const quoteRes = await fetch(`/api/admin/quotes/${id}`, { headers, cache: 'no-store' });
                const quoteJson = await quoteRes.json();
                if (cancelled) return;

                if (quoteRes.ok && quoteJson.success && quoteJson.data) {
                    const q = quoteJson.data as StandaloneQuote;
                    if (q.orderId != null && Number(q.orderId) > 0) {
                        router.replace(`/admin/quotes/${q.orderId}`);
                        return;
                    }
                    setStandaloneQuote(q);
                    return;
                }

                toast({ title: '데이터 로드 실패', description: '주문 또는 견적을 찾을 수 없습니다.', variant: 'destructive' });
            } catch {
                if (!cancelled) toast({ title: '오류 발생', variant: 'destructive' });
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [id, toast, token, router]);

    const handleItemChange = (idx: number, field: string, value: string) => {
        const newItems = [...items];
        if (field === 'unit_price' || field === 'quantity') {
            const cleaned = value.replace(/,/g, '').replace(/[^0-9]/g, '');
            newItems[idx] = { ...newItems[idx], [field]: cleaned === '' ? 0 : Number(cleaned) };
        } else {
            newItems[idx] = { ...newItems[idx], [field]: value };
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), name: '', spec: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    // 금액 계산 (이미 부가세가 포함된 단가 기준)
    const itemsSubtotal = items.reduce((acc, it) => {
        return acc + (Math.round(Number(it.unit_price) || 0) * Math.round(Number(it.quantity) || 0));
    }, 0);
    const shippingFee = resolveShippingFee(
        itemsSubtotal,
        shippingSettings,
        shippingFeeManual ? shippingFeeOverride : null
    );
    const totalAmount = itemsSubtotal + shippingFee;
    // 합계금액에서 부가세를 역산 (합계 = 공급가 * 1.1)
    const totalSupply = Math.round(totalAmount / 1.1);
    const totalVat = totalAmount - totalSupply;

    const handleSaveExpertQuote = async () => {
        if (!id || saving) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    expert_quote_data: {
                        items,
                        recipient,
                        shipping_fee: shippingFee,
                        total_amount: totalAmount,
                        updated_at: new Date().toISOString()
                    }
                })
            });
            const json = await res.json();
            if (json.success) {
                setHasExpertQuote(true);
                toast({ title: '전문가 견적이 저장되었습니다.' });
            } else {
                toast({
                    title: '저장 실패',
                    description: json?.error || '다시 시도해 주세요.',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({ title: '오류 발생', description: '네트워크 또는 서버 오류일 수 있습니다.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const resetToAutoQuote = () => {
        if (confirm('자동견적 원본 데이터로 초기화하시겠습니까?')) {
            setItems(autoItems.map(it => ({ ...it })));
            setRecipient({ ...autoRecipient });
            setShippingFeeManual(false);
            setShippingFeeOverride(null);
        }
    };

    const openSendDialog = () => {
        if (!Number.isFinite(orderId)) {
            toast({ title: '주문 정보를 확인할 수 없습니다.', variant: 'destructive' });
            return;
        }
        if (!hasExpertQuote) {
            toast({
                title: '먼저 수정견적을 저장해 주세요',
                description: '이메일 발송은 저장된 견적 내용을 기준으로 합니다.',
                variant: 'destructive',
            });
            return;
        }
        setSendDialogOpen(true);
    };

    const handlePrint = () => {
        const printData = {
            order: {
                ...orderInfo,
                recipient_name: recipient.name,
                recipient_phone: recipient.phone,
                user_email: recipient.email,
                guest_email: recipient.email,
                shipping_address: recipient.address,
                total_amount: totalAmount,
                has_expert_quote: true,
                expert_quote_data: JSON.stringify({
                    items,
                    recipient,
                    shipping_fee: shippingFee,
                    total_amount: totalAmount,
                }),
            },
            items: items.map(it => ({
                id: it.id,
                file_name: it.name,
                print_method: it.spec,
                material_name: '',
                quantity: it.quantity,
                unit_price: Math.round(Number(it.unit_price) || 0),
                subtotal: Math.round(Number(it.unit_price) || 0) * Number(it.quantity),
            })),
            shipping_fee: shippingFee,
        };
        localStorage.setItem(`quote_temp_${id}`, JSON.stringify(printData));
        if (token) localStorage.setItem('admin_print_token', token);
        window.open(`/print/estimate/${id}?temp=true`, '_blank', 'width=900,height=1000');
    };

    if (loading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    // 주문 없이 견적만 있는 경우 (이미지→3D 후 견적·장바구니 단계)
    if (!orderInfo && standaloneQuote) {
        const sizeLine = formatQuotePrintSizeMm(
            standaloneQuote.dimensionsX,
            standaloneQuote.dimensionsY,
            standaloneQuote.dimensionsZ,
            standaloneQuote.scalePercent
        );
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-white/50 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">견적 #{standaloneQuote.id}</h1>
                        <p className="text-white/40 text-sm">주문 전 자동견적 상세</p>
                    </div>
                </div>

                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {standaloneQuote.inCart ? (
                                <Badge className="bg-sky-500/20 text-sky-200 border-sky-500/30">
                                    <ShoppingCart className="w-3 h-3 mr-1" />
                                    장바구니 보관중
                                </Badge>
                            ) : (
                                <Badge className="bg-white/10 text-white/50 border-white/15">장바구니 없음</Badge>
                            )}
                            {standaloneQuote.printMethod && (
                                <Badge className="bg-teal-500/20 text-teal-200 border-teal-500/30">
                                    {standaloneQuote.printMethod}
                                </Badge>
                            )}
                        </div>

                        <div className="grid gap-3 text-sm">
                            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                                <span className="text-white/40">파일</span>
                                <span className="text-white font-medium text-right break-all">
                                    {standaloneQuote.fileName || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                                <span className="text-white/40">회원</span>
                                <span className="text-white text-right">
                                    {standaloneQuote.userName || standaloneQuote.userEmail || '게스트'}
                                    {standaloneQuote.userId != null && (
                                        <span className="text-white/35 ml-1">#{standaloneQuote.userId}</span>
                                    )}
                                </span>
                            </div>
                            {standaloneQuote.printSettings && (
                                <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                                    <span className="text-white/40 shrink-0">출력 설정</span>
                                    <span className="text-teal-200/90 text-right leading-snug">
                                        {standaloneQuote.printSettings}
                                    </span>
                                </div>
                            )}
                            {sizeLine && (
                                <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                                    <span className="text-white/40">적용 사이즈</span>
                                    <span className="text-amber-200/90 text-right">{sizeLine}</span>
                                </div>
                            )}
                            {standaloneQuote.volumeCm3 != null && standaloneQuote.volumeCm3 > 0 && (
                                <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                                    <span className="text-white/40">부피</span>
                                    <span className="text-white">{standaloneQuote.volumeCm3.toFixed(1)} cm³</span>
                                </div>
                            )}
                            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                                <span className="text-white/40">최종 견적 금액</span>
                                <span className="text-emerald-300 font-black text-lg tabular-nums">
                                    {standaloneQuote.totalPrice > 0
                                        ? `₩${standaloneQuote.totalPrice.toLocaleString()}`
                                        : '미산정'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-white/40">생성일</span>
                                <span className="text-white/70">
                                    {standaloneQuote.createdAt
                                        ? formatKoreanDate(standaloneQuote.createdAt)
                                        : '—'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <Button asChild variant="outline" className="border-white/20 text-white/80">
                                <Link href="/admin/meshy">
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    사진→AI 3D 목록
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="border-white/20 text-white/80">
                                <Link href={`/admin/quotes/analytics?q=${standaloneQuote.id}`}>
                                    전환 분석에서 보기
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!orderInfo) return <div className="p-8 text-white">데이터를 찾을 수 없습니다.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white/50 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        견적서 수정 및 발행
                        {hasExpertQuote && (
                            <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">전문가 견적 저장됨</Badge>
                        )}
                    </h1>
                    <p className="text-white/40 text-sm ml-10">아래 단가 및 품목을 직접 수정하고 저장하세요.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={resetToAutoQuote} className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white text-sm">
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        자동견적으로 초기화
                    </Button>
                    <Button onClick={handleSaveExpertQuote} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm">
                        {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                        수정견적 저장
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm">
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        견적서 인쇄
                    </Button>
                    <Button
                        onClick={openSendDialog}
                        className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 font-bold text-sm"
                    >
                        <Mail className="w-3.5 h-3.5 mr-1.5" />
                        이메일 발송
                    </Button>
                </div>
            </div>

            {/* ─── 자동견적 vs 수정견적 비교 ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 자동견적 원본 */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">자동견적 원본</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                        <Button
                            variant="ghost" size="sm"
                            className="text-white/30 hover:text-white text-xs h-6 px-2"
                            onClick={() => {
                                const autoItemsTotal = autoItems.reduce((acc, it) => acc + Math.round(Number(it.unit_price) || 0) * Number(it.quantity), 0);
                                const autoShipping = resolveShippingFee(autoItemsTotal, shippingSettings, null);
                                const printData = {
                                    order: { ...orderInfo, total_amount: autoItemsTotal + autoShipping },
                                    items: autoItems.map(it => ({
                                        file_name: it.name, print_method: it.spec, material_name: '',
                                        quantity: it.quantity,
                                        unit_price: Math.round(Number(it.unit_price) || 0),
                                        subtotal: Math.round(Number(it.unit_price) || 0) * Number(it.quantity),
                                    })),
                                    shipping_fee: autoShipping,
                                };
                                localStorage.setItem(`quote_temp_${id}`, JSON.stringify(printData));
                                if (token) localStorage.setItem('admin_print_token', token);
                                window.open(`/print/estimate/${id}?temp=true`, '_blank', 'width=900,height=1000');
                            }}
                        >
                            <Printer className="w-3 h-3 mr-1" /> 출력
                        </Button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                        {autoItems.map((it, i) => {
                            const supply = Math.round(Number(it.unit_price) || 0) * Number(it.quantity);
                            return (
                                <div key={i} className="flex justify-between text-white/60">
                                    <span className="truncate max-w-[180px]">{it.name || `품목 ${i + 1}`}</span>
                                    <span className={hasExpertQuote ? 'line-through text-white/25' : ''}>{supply.toLocaleString()}원</span>
                                </div>
                            );
                        })}
                        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-medium">
                            <span className="text-white/50">합계 (VAT 포함)</span>
                            <span className={hasExpertQuote ? 'line-through text-white/25' : 'text-white'}>
                                ₩ {(() => { const s = autoItems.reduce((a, it) => a + Math.round(Number(it.unit_price) || 0) * Number(it.quantity), 0); return s.toLocaleString(); })()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 수정견적 */}
                <div className={`rounded-xl border p-4 transition-all ${hasExpertQuote ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-white/10 bg-white/[0.01] border-dashed'
                    }`}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold uppercase tracking-wider ${hasExpertQuote ? 'text-emerald-400' : 'text-white/20'}`}>전문가 수정견적</span>
                        <div className={`h-px flex-1 ${hasExpertQuote ? 'bg-emerald-500/20' : 'bg-white/5'}`}></div>
                        {hasExpertQuote && (
                            <>
                                <Button
                                    variant="ghost" size="sm"
                                    className="text-emerald-400 hover:text-emerald-300 text-xs h-6 px-2"
                                    onClick={handlePrint}
                                >
                                    <Printer className="w-3 h-3 mr-1" /> 출력
                                </Button>
                                <Button
                                    variant="ghost" size="sm"
                                    className="text-indigo-300 hover:text-indigo-200 text-xs h-6 px-2"
                                    onClick={openSendDialog}
                                >
                                    <Mail className="w-3 h-3 mr-1" /> 이메일
                                </Button>
                            </>
                        )}
                    </div>
                    {hasExpertQuote ? (
                        <div className="space-y-1.5 text-xs">
                            {items.map((it, i) => {
                                const supply = Math.round(Number(it.unit_price) || 0) * Number(it.quantity);
                                return (
                                    <div key={i} className="flex justify-between text-white/70">
                                        <span className="truncate max-w-[180px]">{it.name || `품목 ${i + 1}`}</span>
                                        <span>{supply.toLocaleString()}원</span>
                                    </div>
                                );
                            })}
                            <div className="border-t border-emerald-500/20 pt-2 mt-2 flex justify-between font-bold">
                                <span className="text-emerald-300">합계 (VAT 포함)</span>
                                <span className="text-emerald-400">₩ {totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-white/20">
                            <Pencil className="w-8 h-8 mb-2" />
                            <p className="text-xs text-center">아래에서 품목·단가를 수정 후<br />수정견적 저장 버튼을 클릭하세요</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 공급받는자 정보 */}
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-primary" />
                            공급받는자 정보
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { label: '성명/상호', key: 'name' },
                            { label: '연락처', key: 'phone' },
                            { label: '이메일', key: 'email' },
                            { label: '주소', key: 'address' },
                        ].map(({ label, key }) => (
                            <div key={key} className="grid grid-cols-4 items-center gap-3">
                                <Label className="text-right text-white/60 text-sm">{label}</Label>
                                <Input
                                    className="col-span-3 bg-white/5 border-white/20 text-white text-sm focus:border-primary/60 focus:bg-white/10 transition-colors"
                                    value={(recipient as any)[key]}
                                    onChange={e => setRecipient({ ...recipient, [key]: e.target.value })}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 견적 요약 */}
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-white">견적 요약</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                            <span className="text-white/60 text-sm">견적 번호</span>
                            <span className="font-mono text-white text-sm">{orderInfo.order_number}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                            <span className="text-white/60 text-sm">견적 일자</span>
                            <span className="text-white text-sm">{formatKoreanDate(orderInfo.created_at)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                            <span className="text-white/60 text-sm">품목 합계</span>
                            <span className="text-white font-medium">₩ {itemsSubtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10 gap-3">
                            <div className="min-w-0">
                                <span className="text-white/60 text-sm block">배송비</span>
                                <span className="text-[10px] text-white/30">
                                    {formatFreeShippingHint(shippingSettings.freeThreshold)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    className="w-28 bg-white/5 border-white/20 text-white text-sm text-right"
                                    value={shippingFee}
                                    onChange={(e) => {
                                        const cleaned = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
                                        setShippingFeeManual(true);
                                        setShippingFeeOverride(cleaned === '' ? 0 : Number(cleaned));
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] text-white/40 hover:text-white h-8 px-2"
                                    onClick={() => {
                                        setShippingFeeManual(false);
                                        setShippingFeeOverride(null);
                                    }}
                                >
                                    자동
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                            <span className="text-white/60 text-sm">공급가액</span>
                            <span className="text-white font-medium">₩ {totalSupply.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                            <span className="text-white/60 text-sm">부가세 (10%)</span>
                            <span className="text-white font-medium">₩ {totalVat.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 pb-1">
                            <span className="text-lg font-bold text-white">합계금액 (VAT·배송비 포함)</span>
                            <span className="text-2xl font-bold text-primary">₩ {totalAmount.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 품목 편집 테이블 */}
            <Card className="bg-white/[0.03] border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-primary" />
                        견적 품목 상세
                        <span className="text-xs text-white/40 font-normal ml-1">단가·수량·품명을 직접 수정하세요</span>
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={addItem} className="border-white/20 text-white hover:bg-white/10 text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> 항목 추가
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50 text-xs">
                                    <th className="p-2 text-center w-10">No</th>
                                    <th className="p-2 text-left">품명</th>
                                    <th className="p-2 text-left w-28">규격/사양</th>
                                    <th className="p-2 text-center w-20">수량</th>
                                    <th className="p-2 text-right w-36">단가 (원)</th>
                                    <th className="p-2 text-right w-36">공급가액 (원)</th>
                                    <th className="p-2 text-center w-10">삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => {
                                    const supply = Math.round(Number(item.unit_price) || 0) * Math.round(Number(item.quantity) || 0);
                                    return (
                                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="p-2 text-center text-white/40 text-xs">{idx + 1}</td>
                                            <td className="p-1.5">
                                                <Input
                                                    className="bg-white/5 border border-white/20 text-white h-8 text-sm focus:border-primary/60 focus:bg-white/10 transition-colors"
                                                    placeholder="품명 입력"
                                                    value={item.name}
                                                    onChange={e => handleItemChange(idx, 'name', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <Input
                                                    className="bg-white/5 border border-white/20 text-white h-8 text-sm focus:border-primary/60 focus:bg-white/10 transition-colors"
                                                    placeholder="DLP / FDM"
                                                    value={item.spec}
                                                    onChange={e => handleItemChange(idx, 'spec', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <Input
                                                    type="text"
                                                    className="bg-white/5 border border-white/20 text-white text-center h-8 text-sm focus:border-primary/60 focus:bg-white/10 transition-colors"
                                                    value={item.quantity}
                                                    onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <Input
                                                    type="text"
                                                    className="bg-white/5 border border-primary/40 text-primary text-right h-8 text-sm font-medium focus:border-primary focus:bg-primary/5 transition-colors"
                                                    value={Number(item.unit_price).toLocaleString()}
                                                    onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2 text-right text-white font-medium">
                                                {supply.toLocaleString()}원
                                            </td>
                                            <td className="p-2 text-center">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    onClick={() => removeItem(idx)}
                                                    className="h-7 w-7 text-red-500/50 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-white/20 bg-white/[0.02]">
                                    <td colSpan={4} className="p-2 text-right text-white/50 text-xs">소계</td>
                                    <td className="p-2 text-right text-white font-bold">{totalSupply.toLocaleString()}원</td>
                                    <td className="p-2 text-right text-white/50 text-xs">공급가액 합계</td>
                                    <td></td>
                                </tr>
                                <tr className="bg-white/[0.02]">
                                    <td colSpan={4} className="p-2 text-right text-white/50 text-xs">부가세 (10%)</td>
                                    <td className="p-2 text-right text-white/70">{totalVat.toLocaleString()}원</td>
                                    <td colSpan={2}></td>
                                </tr>
                                <tr className="border-t border-primary/30 bg-primary/5">
                                    <td colSpan={4} className="p-3 text-right font-bold text-white">합계금액 (VAT 포함)</td>
                                    <td className="p-3 text-right font-bold text-primary text-base">{totalAmount.toLocaleString()}원</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
                        <div className="text-primary text-lg">💡</div>
                        <div className="text-sm">
                            <p className="text-white font-medium">수정 후 반드시 <span className="text-emerald-400 font-bold">수정견적 저장</span> 버튼을 클릭하세요.</p>
                            <p className="text-white/50 text-xs mt-0.5">저장 후 <span className="text-indigo-300 font-semibold">이메일 발송</span>으로 고객에게 견적서를 보낼 수 있습니다.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <SendQuotationDialog
                orderId={Number.isFinite(orderId) ? orderId : null}
                open={sendDialogOpen}
                onOpenChange={setSendDialogOpen}
                token={token}
                onSent={(r) => {
                    toast({ title: r?.message || '견적서 이메일이 발송되었습니다.' });
                }}
            />
        </div>
    );
}
