'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { DollarSign, ShoppingBag, Users, Activity, Loader2, TrendingUp, FileText, MessageSquare, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

type SalesTrend = {
    date: string;
    amount: number;
};

type RecentOrder = {
    id: number;
    orderNumber: string;
    recipientName: string;
    createdAt: string;
    totalAmount: number;
    status: string;
};

type Stats = {
    totalSales: number;
    salesChangePercent: number;
    newOrdersCount: number;
    pendingOrdersCount: number;
    totalUsers: number;
    newSignupsCount: number;
    quotesThisMonth: number;
    inquiriesNew: number;
    operatingRate: number;
    operatingDetail: string;
    salesTrend: SalesTrend[];
    recentOrders: RecentOrder[];
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuthStore();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/admin/stats', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const json = await res.json();
                if (json.success && json.data) setStats(json.data);
            } catch (e) {
                console.error('Failed to fetch admin stats', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const s = stats || {
        totalSales: 0,
        salesChangePercent: 0,
        newOrdersCount: 0,
        pendingOrdersCount: 0,
        totalUsers: 0,
        newSignupsCount: 0,
        quotesThisMonth: 0,
        inquiriesNew: 0,
        operatingRate: 82,
        operatingDetail: '프린터 12/15대 가동중',
        salesTrend: [],
        recentOrders: [],
    };

    const maxTrend = Math.max(1, ...s.salesTrend.map((t) => t.amount));

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        대시보드
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/20">LIVE</span>
                    </h1>
                    <p className="text-white/40 text-sm mt-1.5 font-medium">서비스 현황 및 실시간 비즈니스 지표를 관리합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg shadow-white/5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        보고서 다운로드
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                    {
                        title: '이번 달 매출',
                        value: `₩ ${s.totalSales.toLocaleString()}`,
                        change: `${s.salesChangePercent >= 0 ? '+' : ''}${s.salesChangePercent}%`,
                        detail: '지난달 대비',
                        icon: DollarSign,
                        color: 'text-emerald-400',
                        bg: 'bg-emerald-500/10'
                    },
                    {
                        title: '신규 주문',
                        value: s.newOrdersCount,
                        change: `${s.pendingOrdersCount}건 대기`,
                        detail: '',
                        icon: ShoppingBag,
                        color: 'text-blue-400',
                        bg: 'bg-blue-500/10'
                    },
                    {
                        title: '활성 사용자',
                        value: s.totalUsers,
                        change: `+${s.newSignupsCount}`,
                        detail: '이번 달 가입',
                        icon: Users,
                        color: 'text-purple-400',
                        bg: 'bg-purple-500/10'
                    },
                    {
                        title: '장비 가동률',
                        value: `${s.operatingRate}%`,
                        change: s.operatingDetail,
                        detail: '',
                        icon: Activity,
                        color: 'text-orange-400',
                        bg: 'bg-orange-500/10'
                    },
                    {
                        title: '견적 요청',
                        value: s.quotesThisMonth,
                        change: '이번 달 건수',
                        detail: '',
                        icon: FileText,
                        color: 'text-pink-400',
                        bg: 'bg-pink-500/10'
                    },
                    {
                        title: '미확인 문의',
                        value: s.inquiriesNew,
                        change: '즉시 확인 필요',
                        detail: '',
                        icon: MessageSquare,
                        color: 'text-cyan-400',
                        bg: 'bg-cyan-500/10'
                    }
                ].map((item, i) => (
                    <Card key={i} className="bg-[#0f0f0f] border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full -mr-4 -mt-4 ${item.bg}`} />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{item.title}</CardTitle>
                            <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                                <item.icon className="h-3.5 w-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-black text-white">{item.value}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-[10px] font-bold ${item.change.includes('+') || !item.change.includes('-') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {item.change}
                                </span>
                                <span className="text-[10px] text-white/30 font-medium">{item.detail}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-12 mt-8">
                {/* Main Chart Section */}
                <Card className="lg:col-span-8 bg-[#0f0f0f] border-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-0 px-6 pt-6">
                        <div>
                            <CardTitle className="text-lg font-bold text-white">최근 매출 추이</CardTitle>
                            <p className="text-xs text-white/40 mt-1">지난 14일간의 일일 매출 데이터</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/60">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                매출액 (%)
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-10">
                        {s.salesTrend.length > 0 ? (
                            <div className="h-[280px] flex items-end gap-2 pb-6 relative">
                                {/* Chart Grid lines */}
                                <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none opacity-20">
                                    {[0, 1, 2, 3].map((l) => (
                                        <div key={l} className="w-full h-px bg-white/10" />
                                    ))}
                                </div>
                                {s.salesTrend.map((t, idx) => (
                                    <div
                                        key={t.date}
                                        className="flex-1 min-w-[12px] flex flex-col items-center gap-3 group/bar z-10"
                                    >
                                        <div className="relative w-full flex flex-col items-center justify-end h-full">
                                            {/* Value Tooltip on hover */}
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-white text-black text-[10px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 pointer-events-none">
                                                ₩ {t.amount.toLocaleString()}
                                            </div>
                                            <div
                                                className="w-full max-w-[16px] rounded-t-sm bg-gradient-to-t from-primary/20 via-primary/60 to-primary group-hover/bar:to-white transition-all duration-300 relative group-hover/bar:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                                style={{ height: `${Math.max(4, (t.amount / maxTrend) * 200)}px` }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-medium text-white/30 group-hover/bar:text-white transition-colors rotate-[-45deg] origin-top-left -ml-2">
                                            {t.date.split('-').slice(1).join('/')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[280px] flex flex-col items-center justify-center text-white/20 gap-3 border border-dashed border-white/5 rounded-2xl">
                                <Activity className="w-8 h-8 opacity-20" />
                                <span className="text-sm">매출 데이터를 분석하고 있습니다...</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Side Content: Quick Actions & Recent Orders */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Quick Access Actions */}
                    <Card className="bg-[#0f0f0f] border-white/5">
                        <CardHeader className="pb-3 border-b border-white/5">
                            <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">자주 쓰는 기능</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
                                {[
                                    { label: '주문 확인', icon: ShoppingBag, href: '/admin/orders', color: 'text-blue-400' },
                                    { label: '견적 작성', icon: FileText, href: '/admin/quotes', color: 'text-purple-400' },
                                    { label: '소재 관리', icon: Settings, href: '/admin/settings', color: 'text-orange-400' },
                                    { label: '문의 답변', icon: MessageSquare, href: '/admin/inquiries', color: 'text-pink-400' },
                                ].map((act, i) => (
                                    <Link
                                        key={i}
                                        href={act.href}
                                        className="flex flex-col items-center justify-center py-5 hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <act.icon className={`w-5 h-5 mb-2 ${act.color} group-hover:scale-110 transition-transform`} />
                                        <span className="text-[11px] font-bold text-white/60 group-hover:text-white">{act.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Orders List */}
                    <Card className="bg-[#0f0f0f] border-white/5">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
                            <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">최근 주문</CardTitle>
                            <Link
                                href="/admin/orders"
                                className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-tighter flex items-center gap-1"
                            >
                                전체 보기
                                <TrendingUp className="w-3 h-3" />
                            </Link>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <div className="space-y-1">
                                {s.recentOrders.length > 0 ? (
                                    s.recentOrders.map((o) => (
                                        <Link
                                            key={o.orderNumber}
                                            href={typeof o.id === 'number' ? `/admin/orders?detail=${o.id}` : '/admin/orders'}
                                            className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-colors font-black text-[10px]">
                                                    {o.recipientName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                                                        {o.recipientName}
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20 font-black">
                                                            {o.orderNumber.slice(-4)}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-white/30 block mt-0.5 font-medium">
                                                        {o.createdAt ? new Date(o.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-white">₩ {Number(o.totalAmount || 0).toLocaleString()}</div>
                                                <div className="text-[9px] text-emerald-400 font-bold">결제완료</div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                                        <ShoppingBag className="w-8 h-8 mb-2" />
                                        <p className="text-[11px] font-bold">표시할 주문이 없습니다</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
