'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { DollarSign, ShoppingBag, Users, Activity, Loader2, TrendingUp, FileText, MessageSquare, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';

type SalesTrend = {
    date: string;
    amount: number;
};

type TrafficSource = {
    source: string;
    count: number;
};

type DailyVisitor = {
    date: string;
    count: number;
};

type RecentOrder = {
    id: number;
    orderNumber: string;
    recipientName: string;
    createdAt: string;
    totalAmount: number;
    status: string;
};

const ORDER_STATUS_LABEL: Record<string, string> = {
    pending: '접수대기',
    confirmed: '주문확인',
    quote_sent: '견적발송',
    payment_confirmed: '결제확인',
    production: '제작중',
    shipping: '배송중',
    completed: '완료',
    cancelled: '취소',
};
function getOrderStatusLabel(status: string) {
    return ORDER_STATUS_LABEL[status] || status || '-';
}

type Stats = {
    totalSales: number;
    /** 지난달 대비 계산 불가·의미 없을 때 null → "없음" */
    salesChangePercent: number | null;
    newOrdersCount: number;
    pendingOrdersCount: number;
    totalUsers: number;
    newSignupsCount: number;
    quotesThisMonth: number | null;
    inquiriesNew: number | null;
    operatingRate: number | null;
    operatingDetail: string | null;
    salesTrend: SalesTrend[];
    recentOrders: RecentOrder[];
    trafficSources: TrafficSource[];
    dailyVisitors: DailyVisitor[];
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const { token } = useAuthStore();
    const { toast } = useToast();

    useEffect(() => {
        const load = async () => {
            setLoadFailed(false);
            try {
                const res = await fetch('/api/admin/stats', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    cache: 'no-store',
                });
                const json = await res.json();
                if (json.success && json.data) {
                    setStats(json.data as Stats);
                } else {
                    setStats(null);
                    setLoadFailed(true);
                    toast({ title: json.error || '대시보드 데이터를 불러오지 못했습니다.', variant: 'destructive' });
                }
            } catch (e) {
                console.error('Failed to fetch admin stats', e);
                setStats(null);
                setLoadFailed(true);
                toast({ title: '대시보드 데이터를 불러오지 못했습니다.', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token, toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const emptyStats: Stats = {
        totalSales: 0,
        salesChangePercent: null,
        newOrdersCount: 0,
        pendingOrdersCount: 0,
        totalUsers: 0,
        newSignupsCount: 0,
        quotesThisMonth: null,
        inquiriesNew: null,
        operatingRate: null,
        operatingDetail: null,
        salesTrend: [],
        recentOrders: [],
        trafficSources: [],
        dailyVisitors: [],
    };
    const s: Stats = stats ?? emptyStats;

    const maxTrend = Math.max(1, ...s.salesTrend.map((t) => t.amount));
    const maxVisitors = Math.max(1, ...s.dailyVisitors.map((v) => v.count));
    const totalTrafficCount = s.trafficSources.reduce((acc, curr) => acc + curr.count, 0);

    const pctTone = (text: string) => {
        if (text === '없음') return 'text-white/40';
        if (text.startsWith('-')) return 'text-rose-400';
        return 'text-emerald-400';
    };

    return (
        <div className="space-y-8 pb-12">
            {loadFailed && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
                    대시보드 API 응답을 받지 못했습니다. 표시는 비어 있는 기본값이며, 로그인·네트워크를 확인한 뒤 새로고침 해 주세요.
                </div>
            )}
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
                        change: s.salesChangePercent === null ? '없음' : `${s.salesChangePercent >= 0 ? '+' : ''}${s.salesChangePercent}%`,
                        detail: s.salesChangePercent === null ? '' : '지난달 대비',
                        changeClass: pctTone(s.salesChangePercent === null ? '없음' : `${s.salesChangePercent >= 0 ? '+' : ''}${s.salesChangePercent}%`),
                        icon: DollarSign,
                        color: 'text-emerald-400',
                        bg: 'bg-emerald-500/10',
                    },
                    {
                        title: '신규 주문',
                        value: s.newOrdersCount,
                        change: `${s.pendingOrdersCount}건 대기`,
                        detail: '',
                        changeClass: 'text-white/50',
                        icon: ShoppingBag,
                        color: 'text-blue-400',
                        bg: 'bg-blue-500/10',
                    },
                    {
                        title: '활성 사용자',
                        value: s.totalUsers,
                        change: `+${s.newSignupsCount}`,
                        detail: '이번 달 가입',
                        changeClass: 'text-white/50',
                        icon: Users,
                        color: 'text-purple-400',
                        bg: 'bg-purple-500/10',
                    },
                    {
                        title: '장비 가동률',
                        value:
                            s.operatingRate != null && !Number.isNaN(Number(s.operatingRate))
                                ? `${s.operatingRate}%`
                                : '없음',
                        change: s.operatingDetail?.trim() ? s.operatingDetail : '없음',
                        detail: '',
                        changeClass: 'text-white/50',
                        icon: Activity,
                        color: 'text-orange-400',
                        bg: 'bg-orange-500/10',
                    },
                    {
                        title: '견적 요청',
                        value: s.quotesThisMonth === null ? '없음' : s.quotesThisMonth,
                        change: s.quotesThisMonth === null ? '' : '이번 달 건수',
                        detail: '',
                        changeClass: s.quotesThisMonth === null ? 'text-white/40' : 'text-white/50',
                        icon: FileText,
                        color: 'text-pink-400',
                        bg: 'bg-pink-500/10',
                    },
                    {
                        title: '미확인 문의',
                        value: s.inquiriesNew === null ? '없음' : s.inquiriesNew,
                        change: s.inquiriesNew === null ? '' : '즉시 확인 필요',
                        detail: '',
                        changeClass: s.inquiriesNew === null ? 'text-white/40' : 'text-cyan-400/90',
                        icon: MessageSquare,
                        color: 'text-cyan-400',
                        bg: 'bg-cyan-500/10',
                    },
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
                                <span className={`text-[10px] font-bold ${item.changeClass}`}>
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
                                <span className="text-sm">없음</span>
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
                                            key={o.id}
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
                                                <div className={`text-[9px] font-bold ${o.status === 'completed' ? 'text-emerald-400' : o.status === 'cancelled' ? 'text-red-400' : o.status === 'pending' ? 'text-amber-400' : 'text-white/60'}`}>
                                                    {getOrderStatusLabel(o.status)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                                        <ShoppingBag className="w-8 h-8 mb-2" />
                                        <p className="text-[11px] font-bold">없음</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Traffic Tracking Section */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Traffic Source Pie-like Chart */}
                <Card className="lg:col-span-5 bg-[#0f0f0f] border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                             유입 경로 분석
                            <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest ml-2">Last 30 Days</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px] flex flex-col justify-center">
                        {s.trafficSources.length > 0 ? (
                            <div className="space-y-5">
                                {s.trafficSources.slice(0, 5).map((ts, idx) => {
                                    const percent = totalTrafficCount > 0 ? Math.round((ts.count / totalTrafficCount) * 100) : 0;
                                    const colors = ['bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500'];
                                    return (
                                        <div key={ts.source} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-white/60 flex items-center gap-2 capitalize">
                                                    <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
                                                    {ts.source}
                                                </span>
                                                <span className="text-white">{percent}% <span className="text-white/30 font-medium ml-1">({ts.count.toLocaleString()})</span></span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-1000`} 
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-white/20 gap-3 h-full border border-dashed border-white/5 rounded-2xl">
                                <Users className="w-8 h-8 opacity-20" />
                                <span className="text-sm">없음</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Daily Visitors Line Chart (Simplified) */}
                <Card className="lg:col-span-7 bg-[#0f0f0f] border-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-white">일별 방문자 추이</CardTitle>
                            <p className="text-xs text-white/40 mt-1">최근 14일간의 고유 방문자 세션 수</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-10">
                        {s.dailyVisitors.length > 0 ? (
                            <div className="h-[220px] flex items-end gap-2 relative">
                                {/* Grid lines */}
                                <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none opacity-20">
                                    {[0, 1, 2, 3].map((l) => (
                                        <div key={l} className="w-full h-px bg-white/10" />
                                    ))}
                                </div>
                                {s.dailyVisitors.map((v) => (
                                    <div key={v.date} className="flex-1 flex flex-col items-center justify-end h-full group/vbar">
                                        <div className="relative w-full flex flex-col items-center justify-end h-full">
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-white text-black text-[9px] font-bold opacity-0 group-hover/vbar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                                {v.count} 명
                                            </div>
                                            <div 
                                                className="w-full max-w-[8px] rounded-t-full bg-primary/40 group-hover/vbar:bg-primary transition-all duration-300"
                                                style={{ height: `${(v.count / maxVisitors) * 160}px` }}
                                            />
                                        </div>
                                        <span className="text-[8px] font-medium text-white/20 mt-3 group-hover/vbar:text-white transition-colors">
                                            {v.date.split('-')[2]}일
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[220px] flex flex-col items-center justify-center text-white/20 gap-3 border border-dashed border-white/5 rounded-2xl">
                                <Activity className="w-8 h-8 opacity-20" />
                                <span className="text-sm">없음</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
