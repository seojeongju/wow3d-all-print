'use client';

import { correctDisplayAmount } from '@/lib/amount-display';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    User, Package, FileText, LogOut, Loader2, ShoppingBag, Clock,
    Trash2, Edit2, ShieldCheck, Minus, Plus, Search,
    RotateCcw, CheckCircle2, CreditCard, MapPin, Phone, Mail, Box, ArrowLeft
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { showToast } from '@/lib/toast-helper';
import type { Quote, Order } from '@/lib/types';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModelThumbnail from '@/components/ModelThumbnail';
import QuotePrintSettingsChips from '@/components/quote/QuotePrintSettingsChips';
import type { QuotePrintSettings } from '@/lib/quote-print-settings';
import { useCartStore } from '@/store/useCartStore';

/** 견적/주문 금액 단위 → 원화 표시용 (다른 페이지와 동일) */
// 금액은 원화(KRW)로 저장·표시

/** API(snake_case) 견적 → UI(camelCase) */
function mapQuoteFromApi(row: any): Quote {
    return {
        id: Number(row.id),
        fileName: row.fileName ?? row.file_name ?? '',
        fileSize: Number(row.fileSize ?? row.file_size ?? 0),
        fileUrl: row.fileUrl ?? row.file_url ?? undefined,
        volumeCm3: Number(row.volumeCm3 ?? row.volume_cm3 ?? 0),
        surfaceAreaCm2: Number(row.surfaceAreaCm2 ?? row.surface_area_cm2 ?? 0),
        dimensionsX: Number(row.dimensionsX ?? row.dimensions_x ?? 0),
        dimensionsY: Number(row.dimensionsY ?? row.dimensions_y ?? 0),
        dimensionsZ: Number(row.dimensionsZ ?? row.dimensions_z ?? 0),
        printMethod: (row.printMethod ?? row.print_method ?? 'fdm') as Quote['printMethod'],
        fdmMaterial: row.fdmMaterial ?? row.fdm_material ?? undefined,
        fdmInfill: row.fdmInfill ?? row.fdm_infill ?? undefined,
        fdmLayerHeight: row.fdmLayerHeight ?? row.fdm_layer_height ?? undefined,
        fdmSupport: !!(row.fdmSupport ?? row.fdm_support),
        resinType: row.resinType ?? row.resin_type ?? undefined,
        layerThickness: row.layerThickness ?? row.layer_thickness ?? undefined,
        postProcessing: !!(row.postProcessing ?? row.post_processing),
        totalPrice: Number(row.totalPrice ?? row.total_price ?? 0),
        estimatedTimeHours: Number(row.estimatedTimeHours ?? row.estimated_time_hours ?? 0),
        userId: row.userId ?? row.user_id ?? undefined,
        sessionId: row.sessionId ?? row.session_id ?? undefined,
        createdAt: row.createdAt ?? row.created_at ?? '',
        updatedAt: row.updatedAt ?? row.updated_at ?? '',
    };
}

function quoteToPrintSettings(quote: Quote): QuotePrintSettings {
    return {
        print_method: quote.printMethod,
        fdm_material: quote.fdmMaterial,
        fdm_infill: quote.fdmInfill,
        fdm_layer_height: quote.fdmLayerHeight,
        fdm_support: quote.fdmSupport,
        resin_type: quote.resinType,
        layer_thickness: quote.layerThickness,
        post_processing: quote.postProcessing,
    };
}

/** 개별 주문의 확정 금액 반환 (수정견적 우선, 없으면 자동견적) */
function getOrderFinalAmount(order: Order): number {
    try {
        const o = order as any;
        const expertTotal = Number(o.expertTotalAmount ?? o.expert_total_amount ?? 0);
        if (expertTotal > 0) return expertTotal;
        if (o.expertQuoteData) {
            const d = typeof o.expertQuoteData === 'string' ? JSON.parse(o.expertQuoteData) : o.expertQuoteData;
            const ea = Number(d?.total_amount || 0);
            if (ea > 0) return ea;
        }
    } catch { }
    const raw = Math.round(Number(order.totalAmount) || 0);
    return correctDisplayAmount(raw) ?? raw;
}

/** 관리자 견적 발송 후 마이페이지에서 견적서 열람 가능 여부 */
function canViewOrderEstimate(order: Order): boolean {
    if (order.canViewEstimate) return true;
    if (order.quotationSentAt) return true;
    if (order.hasExpertQuote) return true;
    return ['quote_sent', 'payment_confirmed', 'production', 'shipping', 'delivered', 'completed'].includes(
        order.status
    );
}

function openOrderEstimate(orderId: number) {
    window.open(`/print/estimate/${orderId}`, '_blank', 'noopener,noreferrer');
}

/** API 주문 응답을 UI Order 형태로 정규화 */
function normalizeOrderFromApi(raw: any): Order {
    const items = Array.isArray(raw?.items)
        ? raw.items.map((item: any) => ({
              id: Number(item.id),
              orderId: Number(item.orderId ?? item.order_id ?? raw.id),
              quoteId: Number(item.quoteId ?? item.quote_id ?? 0),
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
              subtotal: Number(item.subtotal ?? 0),
              createdAt: String(item.createdAt ?? item.created_at ?? ''),
              quote: item.quote
                  ? {
                        id: Number(item.quote.id ?? item.quoteId ?? item.quote_id ?? 0),
                        fileName: item.quote.fileName ?? item.quote.file_name ?? '',
                        fileSize: Number(item.quote.fileSize ?? item.quote.file_size ?? 0),
                        fileUrl: item.quote.fileUrl ?? item.quote.file_url ?? undefined,
                        printMethod: item.quote.printMethod ?? item.quote.print_method ?? 'fdm',
                        totalPrice: Number(item.quote.totalPrice ?? item.quote.total_price ?? 0),
                    }
                  : undefined,
          }))
        : [];

    const expertTotal = Number(raw.expertTotalAmount ?? raw.expert_total_amount ?? 0);
    const normalized = {
        id: Number(raw.id),
        userId: raw.userId ?? raw.user_id ?? undefined,
        orderNumber: String(raw.orderNumber ?? raw.order_number ?? ''),
        recipientName: String(raw.recipientName ?? raw.recipient_name ?? ''),
        recipientPhone: String(raw.recipientPhone ?? raw.recipient_phone ?? ''),
        shippingAddress: String(raw.shippingAddress ?? raw.shipping_address ?? ''),
        shippingPostalCode: String(raw.shippingPostalCode ?? raw.shipping_postal_code ?? ''),
        totalAmount: Number(raw.totalAmount ?? raw.total_amount ?? 0),
        status: String(raw.status ?? 'pending') as Order['status'],
        paymentMethod: raw.paymentMethod ?? raw.payment_method ?? undefined,
        paymentStatus: (raw.paymentStatus ?? raw.payment_status ?? 'pending') as Order['paymentStatus'],
        customerNote: raw.customerNote ?? raw.customer_note ?? undefined,
        adminNote: raw.adminNote ?? raw.admin_note ?? undefined,
        createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
        updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
        hasExpertQuote: !!(raw.hasExpertQuote ?? raw.has_expert_quote),
        expertQuoteData: raw.expertQuoteData ?? raw.expert_quote_data ?? null,
        quotationSentAt: raw.quotationSentAt ?? raw.quotation_sent_at ?? null,
        canViewEstimate: !!(
            raw.canViewEstimate ??
            raw.can_view_estimate ??
            raw.quotationSentAt ??
            raw.quotation_sent_at ??
            raw.hasExpertQuote ??
            raw.has_expert_quote
        ),
        items: items as Order['items'],
        ...(expertTotal > 0 ? { expertTotalAmount: expertTotal } : {}),
    };
    return normalized as Order;
}

/** 상태별 스타일 */
function getStatusStyle(status: string): { bg: string; text: string; border: string; dot: string } {
    switch (status) {
        case 'pending':           return { bg: 'bg-amber-500/10',    text: 'text-amber-400',   border: 'border-amber-500/30',  dot: 'bg-amber-400' };
        case 'confirmed':         return { bg: 'bg-blue-500/10',     text: 'text-blue-400',    border: 'border-blue-500/30',   dot: 'bg-blue-400' };
        case 'quote_sent':        return { bg: 'bg-emerald-500/10',  text: 'text-emerald-400', border: 'border-emerald-500/30',dot: 'bg-emerald-400' };
        case 'payment_confirmed': return { bg: 'bg-teal-500/10',     text: 'text-teal-400',    border: 'border-teal-500/30',   dot: 'bg-teal-400' };
        case 'production':        return { bg: 'bg-purple-500/10',   text: 'text-purple-400',  border: 'border-purple-500/30', dot: 'bg-purple-400' };
        case 'shipping':          return { bg: 'bg-indigo-500/10',   text: 'text-indigo-400',  border: 'border-indigo-500/30', dot: 'bg-indigo-400' };
        case 'delivered':         return { bg: 'bg-sky-500/10',      text: 'text-sky-400',     border: 'border-sky-500/30',    dot: 'bg-sky-400' };
        case 'completed':         return { bg: 'bg-teal-400/10',     text: 'text-teal-400',    border: 'border-teal-400/30',   dot: 'bg-teal-400' };
        case 'cancelled':         return { bg: 'bg-red-500/10',      text: 'text-red-400',     border: 'border-red-500/30',    dot: 'bg-red-400' };
        default:                  return { bg: 'bg-white/5',          text: 'text-white/40',    border: 'border-white/10',      dot: 'bg-white/20' };
    }
}

/** 주문 진행 단계 표시 선 */
const ORDER_STEPS = ['pending', 'confirmed', 'quote_sent', 'payment_confirmed', 'production', 'shipping', 'delivered', 'completed'];
const ORDER_STEP_KEYS: Record<string, string> = {
    pending: 'stepPending',
    confirmed: 'stepConfirmed',
    quote_sent: 'stepQuoteSent',
    payment_confirmed: 'stepPayment',
    production: 'stepProduction',
    shipping: 'stepShipping',
    delivered: 'stepDelivered',
    completed: 'stepCompleted',
};

const STATUS_KEYS: Record<string, string> = {
    pending: 'statusPending',
    confirmed: 'statusConfirmed',
    quote_sent: 'statusQuoteSent',
    payment_confirmed: 'statusPaymentConfirmed',
    production: 'statusProduction',
    shipping: 'statusShipping',
    delivered: 'statusDelivered',
    completed: 'statusCompleted',
    cancelled: 'statusCancelled',
};

function StatusProgress({ status }: { status: string }) {
    const t = useTranslations('MyAccount');
    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-2 mt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400/80">{t('orderCancelled')}</span>
            </div>
        );
    }
    const currentIdx = ORDER_STEPS.indexOf(status);
    return (
        <div className="mt-8 mb-6 px-4">
            <div className="flex items-center gap-0">
                {ORDER_STEPS.map((step, idx) => {
                    const done = idx <= currentIdx;
                    const active = idx === currentIdx;
                    return (
                        <div key={step} className="flex items-center" style={{ flex: idx < ORDER_STEPS.length - 1 ? 1 : 'none' }}>
                            <div className={`flex flex-col items-center`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black transition-all shadow-sm
                                    ${active ? 'bg-teal-400 text-slate-950 shadow-lg shadow-teal-400/50 scale-125 border-2 border-[#020617]' : done ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-white/50'}`}>
                                    {idx + 1}
                                </div>
                                <span className={`mt-3 text-[11px] font-black uppercase tracking-wide whitespace-nowrap
                                    ${active ? 'text-teal-400' : done ? 'text-white/80' : 'text-white/30'}`}>
                                    {t(ORDER_STEP_KEYS[step] as any)}
                                </span>
                            </div>
                            {idx < ORDER_STEPS.length - 1 && (
                                <div className={`h-[3px] flex-1 mx-2 rounded-full transition-all ${done && idx < currentIdx ? 'bg-teal-500' : 'bg-slate-800'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function MyAccountPage() {
    const t = useTranslations('MyAccount');
    const locale = useLocale();
    const dateLocale = locale === 'en' ? 'en-US' : 'ko-KR';
    const statusLabel = (status: string) =>
        STATUS_KEYS[status] ? t(STATUS_KEYS[status] as any) : status;
    const { user, token, isAuthenticated, logout, updateUser, sessionId } = useAuthStore();
    const { addToCart } = useCartStore();
    const router = useRouter();

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', phone: '' });

    // Order History Search/Filter
    const [orderSearch, setOrderSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [accountTab, setAccountTab] = useState('active-orders');

    // Zustand persist hydration 완료 전에는 SSR/CSR 불일치(#418) 방지를 위해 대기
    useEffect(() => {
        const finish = () => setAuthReady(true);
        const unsub = useAuthStore.persist.onFinishHydration(finish);
        if (useAuthStore.persist.hasHydrated()) finish();
        return unsub;
    }, []);

    useEffect(() => {
        if (!authReady) return;
        if (!isAuthenticated) {
            router.push('/auth');
            return;
        }
        if (user?.role === 'admin') {
            window.location.replace('/admin');
            return;
        }
        loadData();

        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/orders', {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    const data = await res.json();
                    const rows = Array.isArray(data.data) ? data.data : [];
                    setOrders(rows.map(normalizeOrderFromApi));
                }
            } catch { /* 네트워크 오류 시 조용히 실패 */ }
        }, 30000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, isAuthenticated, user?.role, user?.id, token, sessionId]);

    const loadData = async () => {
        try {
            const quoteHeaders: HeadersInit = {};
            if (token && user?.id) {
                quoteHeaders['Authorization'] = `Bearer ${token}`;
                quoteHeaders['X-User-ID'] = String(user.id);
            } else if (sessionId) {
                quoteHeaders['X-Session-ID'] = sessionId;
            }

            // 프로필(가입일·전화 등) 최신화
            if (token) {
                try {
                    const meRes = await fetch('/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: 'no-store',
                    });
                    if (meRes.ok) {
                        const meJson = await meRes.json();
                        if (meJson.success && meJson.data) {
                            const next = meJson.data;
                            updateUser({
                                id: Number(next.id ?? user?.id),
                                email: String(next.email ?? user?.email ?? ''),
                                name: String(next.name ?? user?.name ?? ''),
                                phone:
                                    next.phone != null && String(next.phone).trim() !== ''
                                        ? String(next.phone)
                                        : undefined,
                                role: next.role ?? user?.role,
                                store_id: next.store_id ?? user?.store_id,
                                createdAt: String(next.createdAt ?? next.created_at ?? user?.createdAt ?? ''),
                                updatedAt: String(next.updatedAt ?? next.updated_at ?? user?.updatedAt ?? ''),
                            });
                            setProfileForm({
                                name: String(next.name ?? user?.name ?? ''),
                                phone: next.phone != null ? String(next.phone) : '',
                            });
                        }
                    }
                } catch {
                    if (user) {
                        setProfileForm({ name: user.name, phone: user.phone || '' });
                    }
                }
            }

            // Load saved quotes
            const quotesRes = await fetch('/api/quotes', { headers: quoteHeaders });
            if (quotesRes.ok) {
                const quotesData = await quotesRes.json();
                const rows = Array.isArray(quotesData.data) ? quotesData.data : [];
                setQuotes(rows.map(mapQuoteFromApi).filter((q: Quote) => q.volumeCm3 > 0));
            }

            // Load orders
            const ordersRes = await fetch('/api/orders', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                const rows = Array.isArray(ordersData.data) ? ordersData.data : [];
                setOrders(rows.map(normalizeOrderFromApi));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast.error(t('toastLoadFail'), error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        showToast.success(t('toastLogoutTitle'), t('toastLogoutDesc'));
        router.push('/');
    };

    const handleDeleteQuote = async (quoteId: number) => {
        if (!confirm(t('confirmDeleteQuote'))) return;

        try {
            const headers: HeadersInit = {};
            if (token && user?.id) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['X-User-ID'] = String(user.id);
            } else if (sessionId) {
                headers['X-Session-ID'] = sessionId;
            }

            const res = await fetch(`/api/quotes/${quoteId}`, {
                method: 'DELETE',
                headers,
            });

            if (res.ok) {
                setQuotes(prev => prev.filter(q => q.id !== quoteId));
                showToast.success(t('toastDeleteQuoteOk'));
            } else {
                const data = await res.json();
                showToast.error(t('toastDeleteQuoteFail'), data);
            }
        } catch (error) {
            showToast.error(t('toastDeleteQuoteError'), error);
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm(t('confirmCancelOrder'))) return;

        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
                showToast.success(t('toastCancelOrderOk'));
            } else {
                const data = await res.json();
                showToast.error(t('toastCancelOrderFail'), data);
            }
        } catch (error) {
            showToast.error(t('toastCancelOrderError'), error);
        }
    };

    const handleUpdateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;

        setIsUpdating(true);
        try {
            const res = await fetch(`/api/orders/${editingOrder.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipientName: editingOrder.recipientName,
                    recipientPhone: editingOrder.recipientPhone,
                    shippingAddress: editingOrder.shippingAddress,
                    shippingPostalCode: editingOrder.shippingPostalCode,
                    customerNote: editingOrder.customerNote,
                    items: editingOrder.items?.map(i => ({ id: i.id, quantity: i.quantity, unitPrice: i.unitPrice }))
                }),
            });

            if (res.ok) {
                showToast.success(t('toastUpdateOrderOk'));
                setEditingOrder(null);
                loadData();
            } else {
                const data = await res.json();
                showToast.error(t('toastUpdateOrderFail'), data);
            }
        } catch (error) {
            showToast.error(t('toastUpdateOrderError'), error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = profileForm.name.trim();
        if (!trimmedName) {
            showToast.error(t('toastNameRequired'));
            return;
        }

        setIsUpdating(true);

        try {
            const res = await fetch('/api/auth/me', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: trimmedName,
                    phone: profileForm.phone.trim(),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const next = data.data || {};
                updateUser({
                    id: Number(next.id ?? user?.id),
                    email: String(next.email ?? user?.email ?? ''),
                    name: String(next.name ?? trimmedName),
                    phone: next.phone != null && String(next.phone).trim() !== '' ? String(next.phone) : undefined,
                    role: next.role ?? user?.role,
                    store_id: next.store_id ?? user?.store_id,
                    createdAt: String(next.createdAt ?? next.created_at ?? user?.createdAt ?? ''),
                    updatedAt: String(next.updatedAt ?? next.updated_at ?? user?.updatedAt ?? ''),
                });
                setProfileForm({
                    name: String(next.name ?? trimmedName),
                    phone: next.phone != null ? String(next.phone) : '',
                });
                showToast.success(t('toastProfileOk'));
                setIsEditingProfile(false);
            } else {
                const data = await res.json();
                showToast.error(t('toastProfileFail'), data);
            }
        } catch (error) {
            showToast.error(t('toastProfileError'), error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddToCartFromSaved = (quote: Quote) => {
        addToCart(quote, 1);
        showToast.success(t('toastAddCartTitle'), t('toastAddCartDesc', { name: quote.fileName }));
        router.push('/cart');
    };

    const handleReOrder = (order: Order) => {
        if (!order.items) return;

        order.items.forEach(item => {
            if (item.quote) {
                addToCart(item.quote, item.quantity);
            }
        });

        showToast.success(t('toastReorderTitle'), t('toastReorderDesc'));
        router.push('/cart');
    };

    const filteredOrders = orders.filter((order) => {
        const q = orderSearch.trim().toLowerCase();
        const number = String(order.orderNumber || '').toLowerCase();
        const itemNames = (order.items || [])
            .map((item) => String(item.quote?.fileName || '').toLowerCase())
            .join(' ');
        const matchesSearch = !q || number.includes(q) || itemNames.includes(q);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (!authReady || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
            </div>
        );
    }
    if (user?.role === 'admin') return null;

    // derived stats
    const activeOrders = orders.filter(o =>
        ['pending', 'confirmed', 'quote_sent', 'payment_confirmed', 'production', 'shipping', 'delivered'].includes(o.status)
    );
    const completedOrders = orders.filter(o => o.status === 'completed');
    // 수정견적 우선 적용한 누적 이용 금액 (cancelled 제외)
    const totalSpentKr = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + getOrderFinalAmount(o), 0);

    // 견적 발송된 주문 목록
    const quoteSentOrders = orders.filter(o => o.status === 'quote_sent');

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-teal-500/30 selection:text-teal-400 pb-20">
            {/* ── 배경 시스템 ───────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#020617]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(45,212,191,0.08)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.08)_0%,transparent_50%)]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <Header />

            {/* Header Banner */}
            <div className="relative pt-32 pb-16 z-10">
                <div className="container mx-auto px-4 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link href="/">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/40 hover:text-teal-400 hover:bg-teal-400/10 px-0 mb-6 h-auto text-[11px] font-black uppercase tracking-[0.2em] gap-2 transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                {t('backHome')}
                            </Button>
                        </Link>
                    </motion.div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
                                {t.rich('greeting', {
                                name: user?.name ?? '',
                                highlight: (chunks) => (
                                    <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">{chunks}</span>
                                ),
                            })}
                            </h1>
                            <p className="text-white/40 text-lg font-bold">
                                {t('subtitle')}
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Button 
                                onClick={handleLogout} 
                                className="h-12 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-400 font-bold gap-2 transition-all"
                            >
                                <LogOut className="w-4 h-4" /> {t('logout')}
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 min-w-0">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-12 min-w-0">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                        { label: t('statActiveLabel'), value: `${activeOrders.length}`, unit: t('statActiveUnit'), desc: t('statActiveDesc'), icon: Clock, color: 'text-teal-400' },
                                { label: t('statCompletedLabel'), value: `${completedOrders.length}`, unit: t('statCompletedUnit'), desc: t('statCompletedDesc'), icon: CheckCircle2, color: 'text-indigo-400' },
                                { label: t('statSpentLabel'), value: `₩${Math.round(totalSpentKr).toLocaleString(dateLocale)}`, unit: '', desc: t('statSpentDesc'), icon: ShoppingBag, color: 'text-amber-400' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="relative p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 group hover:border-teal-400/30 transition-all overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform ${stat.color}`}>
                                        <stat.icon className="w-16 h-16" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">{stat.label}</div>
                                        <div className={`text-4xl font-black mb-2 ${stat.color}`}>
                                            {stat.value}<span className="text-xl ml-1 opacity-50 font-bold">{stat.unit}</span>
                                        </div>
                                        <div className="text-xs font-bold text-white/20 uppercase tracking-widest">{stat.desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Main Content Tabs */}
                        <Tabs
                            value={accountTab}
                            onValueChange={(v) => {
                                setAccountTab(v);
                                if (v === 'history') {
                                    setOrderSearch('');
                                    setStatusFilter('all');
                                }
                            }}
                            className="w-full min-w-0 max-w-full space-y-10"
                        >
                            <TabsList className="w-full min-w-0 max-w-full h-auto flex flex-wrap justify-start gap-1 bg-white/5 border border-white/10 p-1.5 rounded-[2rem] backdrop-blur-xl">
                                {[
                                    { val: 'active-orders', label: t('tabActive') },
                                    { val: 'history', label: t('tabHistory') },
                                    { val: 'quotes', label: t('tabQuotes') },
                                    { val: 'profile', label: t('tabProfile') },
                                ].map((tab) => (
                                    <TabsTrigger
                                        key={tab.val}
                                        value={tab.val}
                                        className="rounded-[1.5rem] px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 text-[11px] sm:text-[13px] font-black tracking-wide sm:tracking-widest uppercase transition-all whitespace-normal data-[state=active]:bg-teal-400 data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_10px_30px_rgba(45,212,191,0.3)] active:scale-95"
                                    >
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {/* 견적 발송 알림 배너 */}
                            {quoteSentOrders.length > 0 && (
                                <div className="rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 p-6 flex items-center gap-5">
                                    <div className="w-12 h-12 bg-emerald-400/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <CreditCard className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-emerald-400 mb-1">{t('quoteSentTitle')}</div>
                                        <div className="text-xs text-emerald-400/70">
                                            {t('quoteSentDesc', { count: quoteSentOrders.length })}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 shrink-0">
                                        {quoteSentOrders.slice(0, 2).map((o) => (
                                            <Button
                                                key={o.id}
                                                size="sm"
                                                variant="outline"
                                                className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10 rounded-xl px-4 text-xs font-black"
                                                onClick={() => openOrderEstimate(o.id)}
                                            >
                                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                                {t('quoteSentButton', { tail: String(o.orderNumber || o.id).slice(-6) })}
                                            </Button>
                                        ))}
                                        <Button
                                            size="sm"
                                            className="bg-emerald-400 text-slate-950 font-black hover:bg-emerald-300 rounded-xl px-5 text-xs uppercase tracking-widest"
                                            onClick={() => setAccountTab('active-orders')}
                                        >{t('quoteSentCta')}</Button>
                                    </div>
                                </div>
                            )}

                            {/* Active Orders Tab */}
                            <TabsContent value="active-orders" className="w-full min-w-0 space-y-6">
                                <div className="mb-8 px-2">
                                    <h2 className="text-2xl font-black text-white mb-2">{t('activeTitle')}</h2>
                                    <p className="text-sm font-bold text-white/50">{t('activeDesc')}</p>
                                </div>
                                {activeOrders.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-24 rounded-[3rem] bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center text-center px-6"
                                    >
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                            <Package className="w-10 h-10 text-white/20" />
                                        </div>
                                        <h3 className="text-2xl font-black mb-3">{t('activeEmptyTitle')}</h3>
                                        <p className="text-white/40 font-bold mb-10 break-keep">{t('activeEmptyDesc')}</p>
                                        <Link href="/quote">
                                            <Button className="h-14 px-10 rounded-2xl bg-teal-400 text-slate-950 font-black uppercase tracking-widest hover:bg-teal-300 transition-all active:scale-95 shadow-xl shadow-teal-400/20">
                                                {t('newQuote')}
                                            </Button>
                                        </Link>
                                    </motion.div>
                                ) : (
                                    activeOrders.map(order => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="overflow-hidden rounded-[2.5rem] border border-white/20 bg-[#0f172a]/80 backdrop-blur-xl group hover:border-teal-400/50 transition-all shadow-2xl"
                                        >
                                            <div className="px-8 py-6 bg-white/[0.04] border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <h3 className="text-2xl font-black text-white">{t('orderNumber', { number: order.orderNumber })}</h3>
                                                        {(() => {
                                                            const s = getStatusStyle(order.status);
                                                            return (
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${s.bg} ${s.text} ${s.border}`}>
                                                                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                                                    {statusLabel(order.status)}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="text-sm font-bold text-white/60 uppercase tracking-widest">
                                                        {t('orderDate', { date: new Date(order.createdAt).toLocaleDateString(dateLocale) })}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-black text-white">
                                                        ₩{getOrderFinalAmount(order).toLocaleString(dateLocale)}
                                                    </div>
                                                    {(order.hasExpertQuote || Number((order as any).expertTotalAmount) > 0) && (
                                                        <div className="text-[11px] text-emerald-400 font-black mt-1">{t('expertAmount')}</div>
                                                    )}
                                                    <span className="text-[11px] text-white/50 font-bold">{t('vatIncluded')}</span>
                                                </div>
                                            </div>
                                            <div className="p-8">
                                                {/* 진행 단계 표시 */}
                                                <StatusProgress status={order.status} />

                                                {canViewOrderEstimate(order) && (
                                                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-black text-emerald-300">{t('estimateReadyTitle')}</p>
                                                            <p className="text-[11px] font-bold text-emerald-400/60 mt-0.5">
                                                                {t('estimateReadyDesc')}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            className="h-11 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-emerald-300 gap-2 shrink-0"
                                                            onClick={() => openOrderEstimate(order.id)}
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            {t('viewEstimate')}
                                                        </Button>
                                                    </div>
                                                )}

                                                <div className="flex flex-col gap-4 mt-8">
                                                    {order.items?.map(item => (
                                                        <div key={item.id} className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group/item hover:bg-white/5 transition-colors">
                                                            <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-inner flex items-center justify-center">
                                                                <Box className="w-10 h-10 text-slate-300" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-lg font-black truncate text-white mb-2">{item.quote?.fileName || t('productFallback', { id: item.quoteId })}</div>
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="outline" className="border-white/10 text-white/40 text-[10px] h-5 font-black uppercase tracking-widest">{item.quote?.printMethod}</Badge>
                                                                    <span className="text-xs font-bold text-white/20">{t('itemCount', { count: item.quantity })}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-lg font-black text-white text-right shrink-0">
                                                                ₩{Math.round((Number(item.subtotal) || 0)).toLocaleString(dateLocale)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6 mt-10 p-6 rounded-3xl bg-slate-800/50 border border-slate-700/50">
                                                    <div>
                                                        <span className="text-[11px] font-black uppercase tracking-widest text-teal-400 flex items-center gap-2 mb-3">
                                                            <MapPin className="w-4 h-4" /> {t('shippingAddress')}
                                                        </span>
                                                        <span className="text-base font-bold text-white leading-relaxed block">{order.shippingAddress}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-black uppercase tracking-widest text-teal-400 flex items-center gap-2 mb-3">
                                                            <User className="w-4 h-4" /> {t('recipient')}
                                                        </span>
                                                        <span className="text-base font-bold text-white leading-relaxed block">{order.recipientName} ({order.recipientPhone})</span>
                                                    </div>
                                                </div>

                                                {order.status === 'pending' && (
                                                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest gap-2 transition-all"
                                                            onClick={() => setEditingOrder(order)}
                                                        >
                                                            <Edit2 className="w-4 h-4" /> {t('editOrder')}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex-1 h-14 rounded-2xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-black uppercase tracking-widest gap-2 transition-all"
                                                            onClick={() => handleCancelOrder(order.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" /> {t('cancelOrder')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </TabsContent>

                            {/* History Tab */}
                            <TabsContent value="history" className="w-full min-w-0 space-y-6 outline-none">
                                <div className="px-2">
                                    <h2 className="text-2xl font-black text-white mb-2">{t('historyTitle')}</h2>
                                    <p className="text-sm font-bold text-white/50">
                                        {t('historySummary', { total: orders.length, filtered: filteredOrders.length })}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                                    <div className="relative flex-1 min-w-0">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                                        <Input
                                            placeholder={t('searchPlaceholder')}
                                            className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/30 font-bold"
                                            value={orderSearch}
                                            onChange={(e) => setOrderSearch(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="h-12 min-w-[10rem] rounded-2xl bg-white/5 border border-white/10 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-teal-400"
                                        aria-label={t('statusFilterAria')}
                                    >
                                        <option value="all" className="bg-slate-900">{t('statusAll')}</option>
                                        <option value="pending" className="bg-slate-900">{t('statusPending')}</option>
                                        <option value="confirmed" className="bg-slate-900">{t('statusConfirmed')}</option>
                                        <option value="quote_sent" className="bg-slate-900">{t('statusQuoteSent')}</option>
                                        <option value="payment_confirmed" className="bg-slate-900">{t('statusPaymentConfirmed')}</option>
                                        <option value="production" className="bg-slate-900">{t('statusProduction')}</option>
                                        <option value="shipping" className="bg-slate-900">{t('statusShipping')}</option>
                                        <option value="delivered" className="bg-slate-900">{t('statusDelivered')}</option>
                                        <option value="completed" className="bg-slate-900">{t('statusCompleted')}</option>
                                        <option value="cancelled" className="bg-slate-900">{t('statusCancelled')}</option>
                                    </select>
                                </div>

                                {isLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-white/50">
                                        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                                        <p className="text-sm font-bold">{t('historyLoading')}</p>
                                    </div>
                                ) : filteredOrders.length === 0 ? (
                                    <div className="py-20 rounded-[2rem] bg-white/[0.03] border border-dashed border-white/15 flex flex-col items-center text-center px-6">
                                        <Search className="w-10 h-10 text-white/25 mb-4" />
                                        <p className="text-base font-black text-white/70 mb-2">
                                            {orders.length === 0 ? t('historyEmptyNone') : t('historyEmptyFilter')}
                                        </p>
                                        <p className="text-sm text-white/40 font-medium mb-6">
                                            {orders.length === 0
                                                ? t('historyEmptyNoneDesc')
                                                : t('historyEmptyFilterDesc')}
                                        </p>
                                        {orders.length === 0 ? (
                                            <Link href="/quote">
                                                <Button className="h-12 px-8 rounded-2xl bg-teal-400 text-slate-950 font-black">
                                                    {t('getQuote')}
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="h-11 rounded-xl border-white/20 bg-white/5 text-white font-bold"
                                                onClick={() => {
                                                    setOrderSearch('');
                                                    setStatusFilter('all');
                                                }}
                                            >
                                                {t('resetFilters')}
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {filteredOrders.map((order) => {
                                            const statusStyle = getStatusStyle(order.status);
                                            return (
                                                <div
                                                    key={order.id}
                                                    className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] hover:border-teal-400/30 transition-colors overflow-hidden"
                                                >
                                                    <div className="flex flex-col md:flex-row">
                                                        <div className="p-6 md:p-8 flex-1 border-b md:border-b-0 md:border-r border-white/10">
                                                            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                                                <div>
                                                                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1">
                                                                        {t('historyOrderDate', { date: order.createdAt ? new Date(order.createdAt).toLocaleDateString(dateLocale) : '-' })}
                                                                    </p>
                                                                    <p className="font-mono text-lg font-black text-white tracking-tight">
                                                                        {order.orderNumber || t('orderFallback', { id: order.id })}
                                                                    </p>
                                                                </div>
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                                                                    {statusLabel(order.status)}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-2 mb-3">
                                                                {order.items?.slice(0, 4).map((item, idx) => (
                                                                    <div key={item.id ?? idx} className="w-11 h-11 rounded-xl bg-white/90 border border-white/10 flex items-center justify-center overflow-hidden">
                                                                        <Box className="w-5 h-5 text-slate-500" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="text-sm font-bold text-white/80 truncate">
                                                                {order.items && order.items.length > 0
                                                                    ? `${order.items[0].quote?.fileName || t('productDefault')}${order.items.length > 1 ? ` ${t('andMore', { count: order.items.length - 1 })}` : ''}`
                                                                    : t('noProductInfo')}
                                                            </p>
                                                        </div>
                                                        <div className="p-6 md:p-8 w-full md:w-72 flex flex-col justify-between gap-4 bg-black/20">
                                                            <div>
                                                                <p className="text-[10px] font-black text-white/35 uppercase tracking-widest mb-1">{t('totalOrderAmount')}</p>
                                                                <p className="text-2xl font-black text-white">
                                                                    ₩{getOrderFinalAmount(order).toLocaleString(dateLocale)}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                {canViewOrderEstimate(order) && (
                                                                    <Button
                                                                        className="w-full h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 font-black text-xs gap-2"
                                                                        onClick={() => openOrderEstimate(order.id)}
                                                                    >
                                                                        <FileText className="w-3.5 h-3.5" /> {t('viewEstimate')}
                                                                    </Button>
                                                                )}
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        className="flex-1 h-11 rounded-xl border-white/15 bg-white/5 text-white font-black text-xs"
                                                                        onClick={() => setSelectedOrder(order)}
                                                                    >
                                                                        {t('detail')}
                                                                    </Button>
                                                                    <Button
                                                                        className="flex-1 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 font-black text-xs gap-1.5"
                                                                        onClick={() => handleReOrder(order)}
                                                                    >
                                                                        <RotateCcw className="w-3.5 h-3.5" /> {t('reorder')}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Saved Quotes Tab */}
                            <TabsContent value="quotes" className="w-full min-w-0">
                                <div className="mb-8 px-2">
                                    <h2 className="text-2xl font-black text-white mb-2">{t('quotesTitle')}</h2>
                                    <p className="text-sm font-bold text-white/50">{t('quotesDesc')}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {quotes.map((quote, i) => (
                                        <motion.div
                                            key={quote.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl group hover:border-teal-400/30 transition-all shadow-2xl flex flex-col"
                                        >
                                            <div className="h-56 bg-white relative group-hover:scale-105 transition-transform duration-700 overflow-hidden">
                                                <ModelThumbnail
                                                    fileUrl={quote.fileUrl || ''}
                                                    className="w-full h-full object-contain p-4 transition-transform duration-500"
                                                    size={400}
                                                />
                                                <div className="absolute top-4 right-4">
                                                    <Badge className="bg-slate-950/80 backdrop-blur-md text-white border-white/10 text-[10px] font-black tracking-widest uppercase px-3 py-1">
                                                        {quote.printMethod}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="p-6 flex flex-1 flex-col">
                                                <div className="mb-6 flex-1">
                                                    <h3 className="text-lg font-black truncate text-white mb-2" title={quote.fileName}>
                                                        {quote.fileName}
                                                    </h3>
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
                                                        <span>{new Date(quote.createdAt).toLocaleDateString(dateLocale)}</span>
                                                        <span>{(quote.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                    </div>
                                                    <QuotePrintSettingsChips
                                                        settings={quoteToPrintSettings(quote)}
                                                        trailing={
                                                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-white/50 uppercase tracking-widest">
                                                                {quote.volumeCm3?.toFixed(1)} cm³
                                                            </span>
                                                        }
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="text-2xl font-black text-teal-400">
                                                        ₩{quote.totalPrice.toLocaleString()}
                                                        <span className="text-[10px] ml-2 opacity-50 font-bold">{t('vatIncluded')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 mt-auto">
                                                    <Button
                                                        className="flex-1 h-12 rounded-xl bg-teal-400 text-slate-950 font-black uppercase tracking-widest hover:bg-teal-300 transition-all active:scale-95 shadow-lg shadow-teal-400/20 gap-2"
                                                        onClick={() => handleAddToCartFromSaved(quote)}
                                                    >
                                                        <ShoppingBag className="w-4 h-4" /> {t('addToCart')}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-12 w-12 rounded-xl border-white/10 bg-white/5 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                                                        onClick={() => handleDeleteQuote(quote.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {quotes.length === 0 && (
                                        <div className="col-span-full py-24 rounded-[3rem] bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                                <FileText className="w-10 h-10 text-white/10" />
                                            </div>
                                            <p className="text-white/40 font-bold uppercase tracking-widest">{t('quotesEmpty')}</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Profile Tab */}
                            <TabsContent value="profile" className="w-full min-w-0 space-y-8 outline-none">
                                <div className="mb-4 px-2">
                                    <h2 className="text-2xl font-black text-white mb-2">{t('profileTitle')}</h2>
                                    <p className="text-sm font-bold text-white/50">{t('profileDesc')}</p>
                                </div>
                                <div className="flex flex-col gap-6 max-w-3xl">
                                    <div className="w-full p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-2xl flex flex-col items-center">
                                        <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center text-teal-400 mb-6 border-4 border-white/5 shadow-2xl">
                                            <User className="w-14 h-14" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2 text-center break-keep">
                                            {t('nameSuffix', { name: user?.name ?? '' })}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[11px] font-black text-white/40 uppercase tracking-widest mb-8 break-all text-center">
                                            <Mail className="w-3 h-3 shrink-0" /> {user?.email}
                                        </div>

                                        <div className="w-full space-y-4 pt-8 border-t border-white/10">
                                            <div className="flex justify-between items-center gap-3">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{t('totalOrders')}</span>
                                                <span className="text-lg font-black text-white">{t('countUnit', { count: orders.length })}</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-3">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{t('savedQuotesCount')}</span>
                                                <span className="text-lg font-black text-white">{t('countUnit', { count: quotes.length })}</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-3">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] shrink-0">{t('joinedAt')}</span>
                                                <span className="text-sm font-black text-white/60 text-right">
                                                    {user?.createdAt
                                                        ? new Date(user.createdAt).toLocaleDateString(dateLocale)
                                                        : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full p-6 sm:p-8 md:p-10 rounded-[2rem] bg-slate-900 border border-white/20 shadow-xl">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                            <div>
                                                <h3 className="text-xl sm:text-2xl font-black text-white mb-2 underline decoration-teal-400 decoration-4 underline-offset-8">
                                                    {t('memberInfo')}
                                                </h3>
                                                <p className="text-xs font-bold text-white/45 mt-3">{t('memberInfoDesc')}</p>
                                            </div>
                                            {!isEditingProfile && (
                                                <Button
                                                    variant="outline"
                                                    className="h-12 px-6 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-widest gap-2 transition-all shrink-0"
                                                    onClick={() => {
                                                        if (user) {
                                                            setProfileForm({ name: user.name, phone: user.phone || '' });
                                                        }
                                                        setIsEditingProfile(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" /> {t('editProfile')}
                                                </Button>
                                            )}
                                        </div>

                                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                                            <div className="grid gap-8">
                                                <div className="grid gap-3">
                                                    <Label htmlFor="profile-name" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                                        {t('labelName')}
                                                    </Label>
                                                    {isEditingProfile ? (
                                                        <Input
                                                            id="profile-name"
                                                            value={profileForm.name}
                                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                            className="h-14 bg-white/5 border-white/15 rounded-2xl text-white placeholder:text-white/30 focus-visible:ring-teal-400 font-bold"
                                                            required
                                                            autoComplete="name"
                                                            maxLength={80}
                                                        />
                                                    ) : (
                                                        <div className="h-14 flex items-center px-5 rounded-2xl bg-white/[0.04] border border-white/10 font-black text-white text-lg">
                                                            {user?.name || '-'}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid gap-3">
                                                    <Label htmlFor="profile-phone" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                                        {t('labelPhone')}
                                                    </Label>
                                                    {isEditingProfile ? (
                                                        <Input
                                                            id="profile-phone"
                                                            type="tel"
                                                            placeholder={t('phonePlaceholder')}
                                                            value={profileForm.phone}
                                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                            className="h-14 bg-white/5 border-white/15 rounded-2xl text-white placeholder:text-white/30 focus-visible:ring-teal-400 font-bold"
                                                            autoComplete="tel"
                                                            maxLength={30}
                                                        />
                                                    ) : (
                                                        <div className="h-14 flex items-center px-5 rounded-2xl bg-white/[0.04] border border-white/10 font-black text-white text-lg gap-3">
                                                            <Phone className="w-5 h-5 text-teal-400/60 shrink-0" />
                                                            {user?.phone || t('noPhone')}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid gap-3">
                                                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                                        {t('labelEmailLocked')}
                                                    </Label>
                                                    <div className="h-14 flex items-center px-5 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] font-bold text-white/70 gap-3 break-all">
                                                        <Mail className="w-5 h-5 text-white/35 shrink-0" />
                                                        {user?.email || '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            {isEditingProfile && (
                                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-8 border-t border-white/10">
                                                    <Button
                                                        variant="ghost"
                                                        type="button"
                                                        className="h-14 px-8 rounded-2xl text-white/50 font-black hover:bg-white/5"
                                                        disabled={isUpdating}
                                                        onClick={() => {
                                                            setIsEditingProfile(false);
                                                            if (user) setProfileForm({ name: user.name, phone: user.phone || '' });
                                                        }}
                                                    >
                                                        {t('cancel')}
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        className="h-14 px-10 rounded-2xl bg-teal-400 text-slate-950 font-black hover:bg-teal-300 transition-all active:scale-95 shadow-xl shadow-teal-400/20 gap-3"
                                                        disabled={isUpdating}
                                                    >
                                                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                                        {t('saveChanges')}
                                                    </Button>
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#020617] border-white/10 text-white rounded-[2rem] p-0 shadow-2xl">
                    <DialogHeader className="p-10 pb-0">
                        <DialogTitle className="text-2xl font-black underline decoration-teal-400 decoration-4 underline-offset-8">{t('detailTitle')}</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pt-6">
                            {t('detailOrderNumber')} <span className="font-mono text-teal-400 ml-2">{selectedOrder?.orderNumber}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="p-10 space-y-12">
                            {/* 주문 상태 및 날짜 */}
                            <div className="flex flex-wrap gap-8 p-8 bg-white/[0.03] border border-white/5 rounded-3xl justify-between items-center shadow-inner">
                                <div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">{t('detailOrderDate')}</span>
                                    <span className="text-sm font-black text-white/80">{new Date(selectedOrder.createdAt).toLocaleString(dateLocale)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">{t('detailOrderStatus')}</span>
                                    <Badge className="bg-teal-400 text-slate-950 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border-none shadow-lg shadow-teal-400/20">
                                        {statusLabel(selectedOrder.status)}
                                    </Badge>
                                </div>
                            </div>

                            {canViewOrderEstimate(selectedOrder) && (
                                <Button
                                    className="w-full h-14 rounded-2xl bg-emerald-400 text-slate-950 font-black uppercase tracking-widest hover:bg-emerald-300 gap-2"
                                    onClick={() => openOrderEstimate(selectedOrder.id)}
                                >
                                    <FileText className="w-5 h-5" />
                                    {t('viewEstimate')}
                                </Button>
                            )}

                            {/* 배송 정보 */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-teal-400/40" /> {t('shippingInfo')}
                                </h4>
                                <div className="grid md:grid-cols-2 gap-10 p-8 border border-white/5 bg-white/[0.01] rounded-[2.5rem]">
                                    <div>
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] block mb-2">{t('recipient')}</span>
                                        <span className="text-base font-black text-white/80">{selectedOrder.recipientName}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] block mb-2">{t('contact')}</span>
                                        <span className="text-base font-black text-white/80">{selectedOrder.recipientPhone}</span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] block mb-2">{t('address')}</span>
                                        <span className="text-sm font-bold text-white/60 leading-relaxed italic">{selectedOrder.shippingAddress} {selectedOrder.shippingPostalCode && `(${selectedOrder.shippingPostalCode})`}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 주문 상품 목록 */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Package className="w-4 h-4 text-teal-400/40" /> {t('orderItems')}
                                </h4>
                                <div className="border border-white/10 rounded-[2.5rem] overflow-hidden bg-white/[0.02]">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] bg-white/[0.02]">
                                                <th className="p-8 text-left">{t('colItem')}</th>
                                                <th className="p-8 text-center w-24">{t('colQty')}</th>
                                                <th className="p-8 text-right w-40">{t('colSubtotal')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {selectedOrder.items?.map((item) => (
                                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group/row">
                                                    <td className="p-8">
                                                        <div className="text-base font-black text-white mb-2 group-hover/row:text-teal-400 transition-colors">{item.quote?.fileName || t('productFallback', { id: item.quoteId })}</div>
                                                        <div className="flex items-center gap-3">
                                                            {item.quote?.printMethod && <Badge variant="outline" className="text-[9px] h-5 px-2 font-black uppercase border-white/10 text-white/30 group-hover/row:border-teal-400/30 group-hover/row:text-teal-400/60 transition-colors">{item.quote.printMethod}</Badge>}
                                                            {item.quote?.fileSize && <span className="text-[10px] font-black text-white/10 group-hover/row:text-white/30 transition-colors">{(item.quote.fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-center text-sm font-black text-white/40">{item.quantity}</td>
                                                    <td className="p-8 text-right text-lg font-black text-white">
                                                        ₩{Math.round((Number(item.subtotal) || 0)).toLocaleString(dateLocale)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-white/[0.04] border-t border-white/10">
                                            <tr>
                                                <td colSpan={2} className="p-8 text-right text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('grandTotal')}</td>
                                                <td className="p-8 text-right text-3xl font-black text-teal-400">
                                                    ₩{getOrderFinalAmount(selectedOrder).toLocaleString(dateLocale)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {selectedOrder.customerNote && (
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('shippingMessage')}</h4>
                                    <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl text-sm font-bold text-white/40 leading-relaxed italic">
                                        "{selectedOrder.customerNote}"
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Order Edit Dialog */}
            <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
                <DialogContent className="max-w-lg bg-[#020617] border-white/10 text-white rounded-[2rem] p-0 shadow-2xl overflow-hidden">
                    <DialogHeader className="p-10 pb-0">
                        <DialogTitle className="text-2xl font-black underline decoration-teal-400 decoration-4 underline-offset-8">{t('editOrderTitle')}</DialogTitle>
                        <DialogDescription className="text-sm font-bold text-white/40 uppercase tracking-widest pt-4">
                            {t('editOrderDesc')}
                        </DialogDescription>
                    </DialogHeader>

                    {editingOrder && (
                        <form onSubmit={handleUpdateOrder} className="p-10 pt-8 space-y-10">
                            <div className="space-y-8">
                                <div className="grid gap-4">
                                    <Label htmlFor="recipientName" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('recipientName')}</Label>
                                    <Input
                                        id="recipientName"
                                        value={editingOrder.recipientName}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, recipientName: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                        required
                                    />
                                </div>
                                <div className="grid gap-4">
                                    <Label htmlFor="recipientPhone" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('contact')}</Label>
                                    <Input
                                        id="recipientPhone"
                                        value={editingOrder.recipientPhone}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, recipientPhone: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                        required
                                    />
                                </div>
                                <div className="grid gap-4">
                                    <Label htmlFor="shippingAddress" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('shippingAddress')}</Label>
                                    <Input
                                        id="shippingAddress"
                                        value={editingOrder.shippingAddress}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, shippingAddress: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                        required
                                    />
                                </div>
                                <div className="grid gap-4">
                                    <Label htmlFor="customerNote" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('shippingMessage')}</Label>
                                    <Input
                                        id="customerNote"
                                        placeholder={t('notePlaceholder')}
                                        value={editingOrder.customerNote || ''}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, customerNote: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                    />
                                </div>

                                <div className="pt-10 border-t border-white/10">
                                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 block">{t('adjustQty')}</Label>
                                    <div className="space-y-4">
                                        {editingOrder.items?.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-black text-white mb-1 truncate">{item.quote?.fileName || t('productFallback', { id: item.quoteId })}</div>
                                                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{t('unitPrice', { price: (item.unitPrice).toLocaleString() })}</div>
                                                </div>
                                                <div className="flex items-center gap-4 ml-8">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-xl hover:bg-white/10 text-white/40 hover:text-white"
                                                        onClick={() => {
                                                            const newItems = [...(editingOrder.items || [])];
                                                            if (newItems[idx].quantity > 1) {
                                                                 newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity - 1 };
                                                                 setEditingOrder({ ...editingOrder, items: newItems });
                                                            }
                                                        }}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                    <span className="w-8 text-center text-lg font-black text-teal-400">{item.quantity}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-xl hover:bg-white/10 text-white/40 hover:text-white"
                                                        onClick={() => {
                                                            const newItems = [...(editingOrder.items || [])];
                                                            newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity + 1 };
                                                            setEditingOrder({ ...editingOrder, items: newItems });
                                                        }}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-10 border-t border-white/10">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-14 px-8 rounded-2xl text-white/40 font-black uppercase tracking-widest hover:bg-white/5"
                                    onClick={() => setEditingOrder(null)}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="h-14 px-10 rounded-2xl bg-teal-400 text-slate-950 font-black uppercase tracking-widest hover:bg-teal-300 transition-all active:scale-95 shadow-xl shadow-teal-400/20 gap-3"
                                >
                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                    {t('saveChanges')}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
