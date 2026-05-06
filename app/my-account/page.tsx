'use client';

import { correctDisplayAmount } from '@/lib/amount-display';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    User, Package, FileText, LogOut, Loader2, ShoppingBag, Clock, Eye,
    Trash2, Edit2, AlertCircle, ShieldCheck, Minus, Plus, Search, Filter,
    RotateCcw, CheckCircle2, Truck, CreditCard, ChevronDown, MapPin, Phone, Mail, Box, ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/toast-helper';
import type { Quote, Order } from '@/lib/types';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import OrderTimeline from '@/components/account/OrderTimeline';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModelThumbnail from '@/components/ModelThumbnail';
import { useCartStore } from '@/store/useCartStore';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/** 견적/주문 금액 단위 → 원화 표시용 (다른 페이지와 동일) */
// 금액은 원화(KRW)로 저장·표시

/** 개별 주문의 확정 금액 반환 (수정견적 우선, 없으면 자동견적) */
function getOrderFinalAmount(order: Order): number {
    try {
        const o = order as any;
        if (o.expertQuoteData) {
            const d = typeof o.expertQuoteData === 'string' ? JSON.parse(o.expertQuoteData) : o.expertQuoteData;
            const ea = Number(d?.total_amount || 0);
            if (ea > 0) return ea;
        }
    } catch { }
    const raw = Math.round(Number(order.totalAmount) || 0);
    return correctDisplayAmount(raw) ?? raw;
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
        case 'completed':         return { bg: 'bg-teal-400/10',     text: 'text-teal-400',    border: 'border-teal-400/30',   dot: 'bg-teal-400' };
        case 'cancelled':         return { bg: 'bg-red-500/10',      text: 'text-red-400',     border: 'border-red-500/30',    dot: 'bg-red-400' };
        default:                  return { bg: 'bg-white/5',          text: 'text-white/40',    border: 'border-white/10',      dot: 'bg-white/20' };
    }
}

/** 주문 진행 단계 표시 선 */
const ORDER_STEPS = ['pending', 'confirmed', 'quote_sent', 'payment_confirmed', 'production', 'shipping', 'completed'];
const ORDER_STEP_LABELS: Record<string, string> = {
    pending: '접수',
    confirmed: '확인',
    quote_sent: '견적',
    payment_confirmed: '결제',
    production: '제작',
    shipping: '배송',
    completed: '완료',
};

function StatusProgress({ status }: { status: string }) {
    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-2 mt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400/80">주문 취소됨</span>
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
                                    {ORDER_STEP_LABELS[step]}
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

const statusMap: Record<string, string> = {
    pending: '결제 대기',
    confirmed: '주문 확인',
    quote_sent: '견적 발송',
    payment_confirmed: '결제 확인',
    production: '제작 중',
    shipping: '배송 중',
    completed: '배송 완료',
    cancelled: '주문 취소',
};

export default function MyAccountPage() {
    const { user, token, isAuthenticated, logout, updateUser } = useAuthStore();
    const { addToCart } = useCartStore();
    const router = useRouter();

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', phone: '' });

    // Order History Search/Filter
    const [orderSearch, setOrderSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth');
            return;
        }
        if (user?.role === 'admin') {
            router.replace('/admin');
            return;
        }
        loadData();
        if (user) {
            setProfileForm({ name: user.name, phone: user.phone || '' });
        }

        // 30초마다 주문 상태 자동 갱신 (관리자 변경사항 실시간 반영)
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/orders', {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.data || []);
                }
            } catch { /* 네트워크 오류 시 조용히 실패 */ }
        }, 30000);

        return () => clearInterval(interval);
    }, [isAuthenticated, user?.role]);

    const loadData = async () => {
        try {
            // Load saved quotes
            const quotesRes = await fetch('/api/quotes', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (quotesRes.ok) {
                const quotesData = await quotesRes.json();
                setQuotes(quotesData.data || []);
            }

            // Load orders
            const ordersRes = await fetch('/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData.data || []);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast.error('데이터를 불러오는데 실패했습니다', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        showToast.success('로그아웃 완료', '안전하게 로그아웃되었습니다');
        router.push('/');
    };

    const handleDeleteQuote = async (quoteId: number) => {
        if (!confirm('정말로 이 견적을 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/quotes/${quoteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                setQuotes(prev => prev.filter(q => q.id !== quoteId));
                showToast.success('견적이 삭제되었습니다');
            } else {
                const data = await res.json();
                showToast.error('견적 삭제 실패', data);
            }
        } catch (error) {
            showToast.error('견적 삭제 중 오류가 발생했습니다', error);
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm('정말로 주문을 취소하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
                showToast.success('주문이 취소되었습니다');
            } else {
                const data = await res.json();
                showToast.error('주문 취소 실패', data);
            }
        } catch (error) {
            showToast.error('주문 취소 중 오류가 발생했습니다', error);
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
                showToast.success('주문 정보가 수정되었습니다');
                setEditingOrder(null);
                loadData();
            } else {
                const data = await res.json();
                showToast.error('주문 정보 수정 실패', data);
            }
        } catch (error) {
            showToast.error('주문 수정 중 오류가 발생했습니다', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            const res = await fetch('/api/auth/me', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileForm),
            });

            if (res.ok) {
                const data = await res.json();
                updateUser(data.data);
                showToast.success('프로필이 업데이트되었습니다');
                setIsEditingProfile(false);
            } else {
                const data = await res.json();
                showToast.error('프로필 업데이트 실패', data);
            }
        } catch (error) {
            showToast.error('프로필 업데이트 중 오류가 발생했습니다', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddToCartFromSaved = (quote: Quote) => {
        addToCart(quote, 1);
        showToast.success('장바구니 추가 완료', `${quote.fileName}이 장바구니에 담겼습니다.`);
        router.push('/cart');
    };

    const handleReOrder = (order: Order) => {
        if (!order.items) return;

        order.items.forEach(item => {
            if (item.quote) {
                addToCart(item.quote, item.quantity);
            }
        });

        showToast.success('재주문 준비 완료', '주문 품목들이 장바구니에 다시 담겼습니다.');
        router.push('/cart');
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (!isAuthenticated) return null;
    if (user?.role === 'admin') return null;

    // derived stats
    const activeOrders = orders.filter(o =>
        ['pending', 'confirmed', 'quote_sent', 'payment_confirmed', 'production', 'shipping'].includes(o.status)
    );
    const completedOrders = orders.filter(o => o.status === 'completed');
    // 수정견적 우선 적용한 누적 이용 금액 (cancelled 제외)
    const totalSpentKr = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + getOrderFinalAmount(o), 0);

    // 견적 발송된 주문 목록
    const quoteSentOrders = orders.filter(o => o.status === 'quote_sent');

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-teal-500/30 selection:text-teal-400 overflow-x-hidden pb-20">
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
                                홈으로 돌아가기
                            </Button>
                        </Link>
                    </motion.div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
                                안녕하세요, <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">{user?.name}</span>님!
                            </h1>
                            <p className="text-white/40 text-lg font-bold">
                                진행 중인 프로젝트와 견적 내역을 확인해보세요.
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
                                <LogOut className="w-4 h-4" /> 로그아웃
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-12">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                        { label: '진행 중인 프로젝트', value: `${activeOrders.length}`, unit: '건', desc: '배송을 기다리고 있어요', icon: Clock, color: 'text-teal-400' },
                                { label: '완료된 프로젝트', value: `${completedOrders.length}`, unit: '건', desc: '완료된 프로젝트 내역', icon: CheckCircle2, color: 'text-indigo-400' },
                                { label: '누적 이용 금액', value: `₩${Math.round(totalSpentKr).toLocaleString('ko-KR')}`, unit: '', desc: '누적 이용 금액', icon: ShoppingBag, color: 'text-amber-400' },
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
                        <Tabs defaultValue="active-orders" className="space-y-10">
                            <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-[2rem] h-auto flex flex-wrap justify-start gap-1 backdrop-blur-xl">
                                {[
                                    { val: 'active-orders', label: '진행 중인 주문' },
                                    { val: 'history', label: '주문 내역' },
                                    { val: 'quotes', label: '저장된 견적' },
                                    { val: 'profile', label: '내 정보' },
                                ].map((tab) => (
                                    <TabsTrigger
                                        key={tab.val}
                                        value={tab.val}
                                        className="rounded-[1.5rem] px-8 py-3.5 text-[13px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-teal-400 data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_10px_30px_rgba(45,212,191,0.3)] active:scale-95"
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
                                        <div className="text-sm font-black text-emerald-400 mb-1">견적서가 발송되었습니다! 📧</div>
                                        <div className="text-xs text-emerald-400/70">
                                            {quoteSentOrders.length}개의 주문에 견적서가 발송되었습니다. 금액 확인 후 결제해 주세요.
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-400 text-slate-950 font-black hover:bg-emerald-300 rounded-xl px-5 text-xs uppercase tracking-widest shrink-0"
                                        onClick={() => {
                                            const tab = document.querySelector('[data-value="active-orders"]') as HTMLElement;
                                            tab?.click();
                                        }}
                                    >확인하기</Button>
                                </div>
                            )}

                            {/* Active Orders Tab */}
                            <TabsContent value="active-orders" className="space-y-6">
                                {activeOrders.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-24 rounded-[3rem] bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center text-center px-6"
                                    >
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                            <Package className="w-10 h-10 text-white/20" />
                                        </div>
                                        <h3 className="text-2xl font-black mb-3">진행 중인 주문이 없습니다</h3>
                                        <p className="text-white/40 font-bold mb-10 break-keep">새로운 아이디어를 출력하고 현실로 만들어보세요!</p>
                                        <Link href="/quote">
                                            <Button className="h-14 px-10 rounded-2xl bg-teal-400 text-slate-950 font-black uppercase tracking-widest hover:bg-teal-300 transition-all active:scale-95 shadow-xl shadow-teal-400/20">
                                                새 견적 받기
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
                                                        <h3 className="text-2xl font-black text-white">주문 #{order.orderNumber}</h3>
                                                        {(() => {
                                                            const s = getStatusStyle(order.status);
                                                            return (
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${s.bg} ${s.text} ${s.border}`}>
                                                                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                                                    {statusMap[order.status] || order.status}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="text-sm font-bold text-white/60 uppercase tracking-widest">
                                                        주문일: {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-black text-white">
                                                        ₩{getOrderFinalAmount(order).toLocaleString('ko-KR')}
                                                    </div>
                                                    {(order as any).expertQuoteData && (() => {
                                                        try {
                                                            const d = JSON.parse((order as any).expertQuoteData);
                                                            if (d?.total_amount > 0) return <div className="text-[11px] text-emerald-400 font-black mt-1">수정견적 금액</div>;
                                                        } catch { } return null;
                                                    })()}
                                                    <span className="text-[11px] text-white/50 font-bold">(VAT 포함)</span>
                                                </div>
                                            </div>
                                            <div className="p-8">
                                                {/* 진행 단계 표시 */}
                                                <StatusProgress status={order.status} />

                                                <div className="flex flex-col gap-4 mt-8">
                                                    {order.items?.map(item => (
                                                        <div key={item.id} className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group/item hover:bg-white/5 transition-colors">
                                                            <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                                                                {item.quote?.fileUrl ? (
                                                                    <ModelThumbnail fileUrl={item.quote.fileUrl} size={100} />
                                                                ) : (
                                                                    <Box className="w-full h-full p-6 text-slate-200" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-lg font-black truncate text-white mb-2">{item.quote?.fileName || `상품 #${item.quoteId}`}</div>
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="outline" className="border-white/10 text-white/40 text-[10px] h-5 font-black uppercase tracking-widest">{item.quote?.printMethod}</Badge>
                                                                    <span className="text-xs font-bold text-white/20">{item.quantity}개 품목</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-lg font-black text-white text-right shrink-0">
                                                                ₩{Math.round((Number(item.subtotal) || 0)).toLocaleString('ko-KR')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6 mt-10 p-6 rounded-3xl bg-slate-800/50 border border-slate-700/50">
                                                    <div>
                                                        <span className="text-[11px] font-black uppercase tracking-widest text-teal-400 flex items-center gap-2 mb-3">
                                                            <MapPin className="w-4 h-4" /> 배송 주소
                                                        </span>
                                                        <span className="text-base font-bold text-white leading-relaxed block">{order.shippingAddress}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-black uppercase tracking-widest text-teal-400 flex items-center gap-2 mb-3">
                                                            <User className="w-4 h-4" /> 수령인
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
                                                            <Edit2 className="w-4 h-4" /> 주문 수정
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex-1 h-14 rounded-2xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-black uppercase tracking-widest gap-2 transition-all"
                                                            onClick={() => handleCancelOrder(order.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" /> 주문 취소
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </TabsContent>

                            {/* History Tab */}
                            <TabsContent value="history" className="space-y-8">
                                <div className="flex flex-col lg:flex-row gap-6 items-end lg:items-center justify-between">
                                    <div className="flex flex-1 gap-4 w-full max-w-2xl">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                            <Input
                                                placeholder="주문번호 검색..."
                                                className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                                value={orderSearch}
                                                onChange={(e) => setOrderSearch(e.target.value)}
                                            />
                                        </div>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-[180px] h-14 bg-white/5 border-white/10 rounded-2xl font-black uppercase tracking-widest text-[11px]">
                                                <Filter className="w-4 h-4 mr-2 text-teal-400" />
                                                <SelectValue placeholder="상태" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-white">
                                                <SelectItem value="all">전체 상태</SelectItem>
                                                <SelectItem value="pending">결제 대기</SelectItem>
                                                <SelectItem value="confirmed">주문 확인</SelectItem>
                                                <SelectItem value="production">제작 중</SelectItem>
                                                <SelectItem value="shipping">배송 중</SelectItem>
                                                <SelectItem value="completed">배송 완료</SelectItem>
                                                <SelectItem value="cancelled">주문 취소</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20">
                                        총 {filteredOrders.length}건 검색 결과
                                    </div>
                                </div>

                                {filteredOrders.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-24 rounded-[3rem] bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center"
                                    >
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                            <Search className="w-10 h-10 text-white/10" />
                                        </div>
                                        <p className="text-white/40 font-bold uppercase tracking-widest">검색 결과가 없습니다.</p>
                                    </motion.div>
                                ) : (
                                    <div className="grid gap-4">
                                        {filteredOrders.map(order => (
                                            <motion.div
                                                key={order.id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="group border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 rounded-[2rem] transition-all overflow-hidden"
                                            >
                                                <div className="flex flex-col md:flex-row">
                                                    {/* Order Info Part */}
                                                    <div className="p-8 flex-1 border-b md:border-b-0 md:border-r border-white/5">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div>
                                                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">
                                                                    주문일: {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                                                                </div>
                                                                <div className="font-mono text-lg font-black tracking-tight text-white group-hover:text-teal-400 transition-colors">
                                                                    {order.orderNumber}
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none ${
                                                                    order.status === 'completed'
                                                                        ? 'bg-teal-400 text-slate-950 shadow-lg shadow-teal-400/20'
                                                                        : order.status === 'cancelled'
                                                                        ? 'bg-red-500/20 text-red-400'
                                                                        : order.status === 'quote_sent'
                                                                        ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                                                                        : 'bg-white/10 text-white/60'
                                                                }`}
                                                            >
                                                                {statusMap[order.status] || order.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex gap-3 mb-6">
                                                            {order.items?.slice(0, 4).map((item, idx) => (
                                                                <div key={idx} className="w-12 h-12 rounded-xl bg-white border border-white/10 flex items-center justify-center overflow-hidden shadow-sm">
                                                                    {item.quote?.fileUrl ? (
                                                                        <ModelThumbnail fileUrl={item.quote.fileUrl} size={60} />
                                                                    ) : (
                                                                        <Box className="w-6 h-6 text-slate-200" />
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {(order.items?.length || 0) > 4 && (
                                                                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                                                                    +{(order.items?.length || 0) - 4}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-sm font-bold text-white/80">
                                                            {order.items && order.items.length > 0
                                                                ? `${order.items[0].quote?.fileName || '상품'} ${order.items.length > 1 ? `외 ${order.items.length - 1}건` : ''}`
                                                                : '상품 정보 없음'}
                                                        </div>
                                                    </div>

                                                    {/* Total & Action Part */}
                                                    <div className="p-8 w-full md:w-80 bg-white/[0.02] flex flex-col justify-between gap-6">
                                                        <div className="text-right">
                                                            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 text-left md:text-right">총 주문 금액</div>
                                                            <div className="text-3xl font-black text-white text-left md:text-right">
                                                            ₩{getOrderFinalAmount(order).toLocaleString('ko-KR')}
                                                        </div>
                                                        {(order as any).expertQuoteData && (() => {
                                                            try {
                                                                const d = JSON.parse((order as any).expertQuoteData);
                                                                if (d?.total_amount > 0) return <div className="text-[10px] text-emerald-400/70 font-black mt-0.5 text-left md:text-right">수정견적 적용</div>;
                                                            } catch { } return null;
                                                        })()}
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <Button
                                                                variant="outline"
                                                                className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-widest transition-all"
                                                                onClick={() => setSelectedOrder(order)}
                                                            >
                                                                상세 보기
                                                            </Button>
                                                            <Button
                                                                className="flex-1 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 font-black text-[11px] uppercase tracking-widest gap-2 transition-all"
                                                                onClick={() => handleReOrder(order)}
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" /> 재주문
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Saved Quotes Tab */}
                            <TabsContent value="quotes">
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
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                                        <span>{new Date(quote.createdAt).toLocaleDateString('ko-KR')}</span>
                                                        <span>{(quote.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="text-2xl font-black text-teal-400">
                                                        ₩{quote.totalPrice.toLocaleString()}
                                                        <span className="text-[10px] ml-2 opacity-50 font-bold">(VAT 포함)</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 mt-auto">
                                                    <Button
                                                        className="flex-1 h-12 rounded-xl bg-teal-400 text-slate-950 font-black uppercase tracking-widest hover:bg-teal-300 transition-all active:scale-95 shadow-lg shadow-teal-400/20 gap-2"
                                                        onClick={() => handleAddToCartFromSaved(quote)}
                                                    >
                                                        <ShoppingBag className="w-4 h-4" /> 장바구니 담기
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
                                            <p className="text-white/40 font-bold uppercase tracking-widest">저장된 견적이 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Profile Tab */}
                            <TabsContent value="profile" className="space-y-8">
                                <div className="grid md:grid-cols-3 gap-10">
                                    {/* Profile Summary Card */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="md:col-span-1 p-8 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-2xl flex flex-col items-center"
                                    >
                                        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-teal-400 mb-6 border-4 border-white/5 shadow-2xl">
                                            <User className="w-16 h-16" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-2">{user?.name}님</h3>
                                        <div className="flex items-center gap-2 text-[11px] font-black text-white/40 uppercase tracking-widest mb-10">
                                            <Mail className="w-3 h-3" /> {user?.email}
                                        </div>

                                        <div className="w-full space-y-4 pt-10 border-t border-white/10">
                                            <div className="flex justify-between items-center group/info">
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">총 주문 횟수</span>
                                                <span className="text-lg font-black text-white">{orders.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center group/info">
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">저장된 견적</span>
                                                <span className="text-lg font-black text-white">{quotes.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center group/info">
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">최근 로그인</span>
                                                <span className="text-sm font-black text-white/60">{new Date().toLocaleDateString('ko-KR')}</span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Detailed Form Card */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="md:col-span-2 p-10 rounded-[3rem] bg-white/[0.03] border border-white/5"
                                    >
                                        <div className="flex flex-row items-center justify-between mb-12">
                                            <div>
                                                <h3 className="text-2xl font-black text-white mb-2 underline decoration-teal-400 decoration-4 underline-offset-8">회원 정보</h3>
                                                <p className="text-xs font-bold text-white/40 mt-4 uppercase tracking-widest">사용자 이름, 휴대폰 번호 등 개인 정보를 관리합니다.</p>
                                            </div>
                                            {!isEditingProfile && (
                                                <Button
                                                    variant="outline"
                                                    className="h-12 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-widest gap-2 transition-all"
                                                    onClick={() => setIsEditingProfile(true)}
                                                >
                                                    <Edit2 className="w-4 h-4" /> 프로필 수정
                                                </Button>
                                            )}
                                        </div>

                                        <form onSubmit={handleUpdateProfile} className="space-y-10">
                                            <div className="grid gap-10">
                                                <div className="grid gap-4">
                                                    <Label htmlFor="name" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">사용자 이름</Label>
                                                    {isEditingProfile ? (
                                                        <Input
                                                            id="name"
                                                            value={profileForm.name}
                                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                            className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                                            required
                                                        />
                                                    ) : (
                                                        <div className="h-14 flex items-center px-6 bg-white/[0.02] rounded-2xl font-black text-white text-lg">
                                                            {user?.name}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid gap-4">
                                                    <Label htmlFor="phone" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">휴대폰 번호</Label>
                                                    {isEditingProfile ? (
                                                        <Input
                                                            id="phone"
                                                            placeholder="010-0000-0000"
                                                            value={profileForm.phone}
                                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                            className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                                        />
                                                    ) : (
                                                        <div className="h-14 flex items-center px-6 bg-white/[0.02] rounded-2xl font-black text-white/60 text-lg gap-3">
                                                            <Phone className="w-5 h-5 text-teal-400/40" />
                                                            {user?.phone || '등록된 번호가 없습니다.'}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid gap-4 opacity-40">
                                                    <Label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">이메일 계정 (고정)</Label>
                                                    <div className="h-14 flex items-center px-6 bg-transparent border border-white/5 border-dashed rounded-2xl font-bold text-white/50 gap-3">
                                                        <Mail className="w-5 h-5 text-white/10" />
                                                        {user?.email}
                                                    </div>
                                                </div>
                                            </div>

                                            {isEditingProfile && (
                                                <div className="flex justify-end gap-4 pt-10 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <Button
                                                        variant="ghost"
                                                        type="button"
                                                        className="h-14 px-8 rounded-2xl text-white/40 font-black uppercase tracking-widest hover:bg-white/5"
                                                        onClick={() => {
                                                            setIsEditingProfile(false);
                                                            if (user) setProfileForm({ name: user.name, phone: user.phone || '' });
                                                        }}
                                                    >
                                                        취소
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        className="h-14 px-10 rounded-2xl bg-teal-400 text-slate-950 font-black uppercase tracking-widest hover:bg-teal-300 transition-all active:scale-95 shadow-xl shadow-teal-400/20 gap-3"
                                                        disabled={isUpdating}
                                                    >
                                                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                                        변경 사항 저장
                                                    </Button>
                                                </div>
                                            )}
                                        </form>
                                    </motion.div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#020617] border-white/10 text-white rounded-[2rem] p-0 shadow-2xl">
                    <DialogHeader className="p-10 pb-0">
                        <DialogTitle className="text-2xl font-black underline decoration-teal-400 decoration-4 underline-offset-8">주문 상세 정보</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pt-6">
                            주문 번호: <span className="font-mono text-teal-400 ml-2">{selectedOrder?.orderNumber}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="p-10 space-y-12">
                            {/* 주문 상태 및 날짜 */}
                            <div className="flex flex-wrap gap-8 p-8 bg-white/[0.03] border border-white/5 rounded-3xl justify-between items-center shadow-inner">
                                <div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">주문 날짜</span>
                                    <span className="text-sm font-black text-white/80">{new Date(selectedOrder.createdAt).toLocaleString('ko-KR')}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">주문 상태</span>
                                    <Badge className="bg-teal-400 text-slate-950 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border-none shadow-lg shadow-teal-400/20">
                                        {statusMap[selectedOrder.status] || selectedOrder.status}
                                    </Badge>
                                </div>
                            </div>

                            {/* 배송 정보 */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-teal-400/40" /> 배송 정보
                                </h4>
                                <div className="grid md:grid-cols-2 gap-10 p-8 border border-white/5 bg-white/[0.01] rounded-[2.5rem]">
                                    <div>
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] block mb-2">수령인</span>
                                        <span className="text-base font-black text-white/80">{selectedOrder.recipientName}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] block mb-2">연락처</span>
                                        <span className="text-base font-black text-white/80">{selectedOrder.recipientPhone}</span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] block mb-2">주소</span>
                                        <span className="text-sm font-bold text-white/60 leading-relaxed italic">{selectedOrder.shippingAddress} {selectedOrder.shippingPostalCode && `(${selectedOrder.shippingPostalCode})`}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 주문 상품 목록 */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Package className="w-4 h-4 text-teal-400/40" /> 주문 품목
                                </h4>
                                <div className="border border-white/10 rounded-[2.5rem] overflow-hidden bg-white/[0.02]">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] bg-white/[0.02]">
                                                <th className="p-8 text-left">품목</th>
                                                <th className="p-8 text-center w-24">수량</th>
                                                <th className="p-8 text-right w-40">소계</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {selectedOrder.items?.map((item) => (
                                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group/row">
                                                    <td className="p-8">
                                                        <div className="text-base font-black text-white mb-2 group-hover/row:text-teal-400 transition-colors">{item.quote?.fileName || `상품 #${item.quoteId}`}</div>
                                                        <div className="flex items-center gap-3">
                                                            {item.quote?.printMethod && <Badge variant="outline" className="text-[9px] h-5 px-2 font-black uppercase border-white/10 text-white/30 group-hover/row:border-teal-400/30 group-hover/row:text-teal-400/60 transition-colors">{item.quote.printMethod}</Badge>}
                                                            {item.quote?.fileSize && <span className="text-[10px] font-black text-white/10 group-hover/row:text-white/30 transition-colors">{(item.quote.fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-center text-sm font-black text-white/40">{item.quantity}</td>
                                                    <td className="p-8 text-right text-lg font-black text-white">
                                                        ₩{Math.round((Number(item.subtotal) || 0)).toLocaleString('ko-KR')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-white/[0.04] border-t border-white/10">
                                            <tr>
                                                <td colSpan={2} className="p-8 text-right text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">최종합계</td>
                                                <td className="p-8 text-right text-3xl font-black text-teal-400">
                                                    ₩{Math.round((Number(selectedOrder.totalAmount) || 0) ).toLocaleString('ko-KR')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {selectedOrder.customerNote && (
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">배송 메시지</h4>
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
                        <DialogTitle className="text-2xl font-black underline decoration-teal-400 decoration-4 underline-offset-8">주문 수정</DialogTitle>
                        <DialogDescription className="text-sm font-bold text-white/40 uppercase tracking-widest pt-4">
                            배송 정보 및 품목 수량을 수정합니다.
                        </DialogDescription>
                    </DialogHeader>

                    {editingOrder && (
                        <form onSubmit={handleUpdateOrder} className="p-10 pt-8 space-y-10">
                            <div className="space-y-8">
                                <div className="grid gap-4">
                                    <Label htmlFor="recipientName" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">수령인 이름</Label>
                                    <Input
                                        id="recipientName"
                                        value={editingOrder.recipientName}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, recipientName: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                        required
                                    />
                                </div>
                                <div className="grid gap-4">
                                    <Label htmlFor="recipientPhone" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">연락처</Label>
                                    <Input
                                        id="recipientPhone"
                                        value={editingOrder.recipientPhone}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, recipientPhone: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                        required
                                    />
                                </div>
                                <div className="grid gap-4">
                                    <Label htmlFor="shippingAddress" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">배송 주소</Label>
                                    <Input
                                        id="shippingAddress"
                                        value={editingOrder.shippingAddress}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, shippingAddress: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                        required
                                    />
                                </div>
                                <div className="grid gap-4">
                                    <Label htmlFor="customerNote" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">배송 메시지</Label>
                                    <Input
                                        id="customerNote"
                                        placeholder="배송 시 요청사항을 입력하세요..."
                                        value={editingOrder.customerNote || ''}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, customerNote: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-teal-400 focus:border-teal-400 font-bold"
                                    />
                                </div>

                                <div className="pt-10 border-t border-white/10">
                                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 block">품목 수량 조절</Label>
                                    <div className="space-y-4">
                                        {editingOrder.items?.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-black text-white mb-1 truncate">{item.quote?.fileName || `상품 #${item.quoteId}`}</div>
                                                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">단가: ₩{(item.unitPrice).toLocaleString()}</div>
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
                                    취소
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="h-14 px-10 rounded-2xl bg-teal-400 text-slate-950 font-black uppercase tracking-widest hover:bg-teal-300 transition-all active:scale-95 shadow-xl shadow-teal-400/20 gap-3"
                                >
                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                    변경 사항 저장
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
