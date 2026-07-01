'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { DollarSign, ShoppingBag, Users, Activity, Loader2, TrendingUp, FileText, MessageSquare, Settings, ChevronRight } from 'lucide-react';
import DashboardStatCard from '@/components/admin/DashboardStatCard';
import SalesTrendPanel from '@/components/admin/SalesTrendPanel';
import VisitorTrendPanel from '@/components/admin/VisitorTrendPanel';
import QuoteFunnelTrendPanel from '@/components/admin/QuoteFunnelTrendPanel';
import { type SalesTrendPoint } from '@/lib/sales-trend';
import { type VisitorTrendPoint } from '@/lib/visitor-trend';
import { type QuoteFunnelTrendPoint, type QuoteFunnelSummary, type QuoteTrafficSource } from '@/lib/quote-funnel-trend';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';

type SalesTrend = SalesTrendPoint;

type TrafficSource = {
    source: string;
    count: number;
};

type VisitorTrend = VisitorTrendPoint;
type QuoteFunnelTrend = QuoteFunnelTrendPoint;

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
    delivered: '배송완료',
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
    visitorTrend: VisitorTrend[];
    quoteFunnelTrend: QuoteFunnelTrend[];
    quoteFunnelSummary: QuoteFunnelSummary;
    quoteTrafficSources: QuoteTrafficSource[];
    recentOrders: RecentOrder[];
    trafficSources: TrafficSource[];
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const { token, user } = useAuthStore();
    const { toast } = useToast();
    const isSuperAdmin = user?.role === 'super_admin' || user?.store_id === 1;

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
        visitorTrend: [],
        quoteFunnelTrend: [],
        quoteFunnelSummary: { total: 0, ordered: 0, incart: 0, abandoned: 0, draft: 0, conversionRate: 0 },
        quoteTrafficSources: [],
        recentOrders: [],
        trafficSources: [],
    };
    const s: Stats = stats ?? emptyStats;

    const totalTrafficCount = s.trafficSources.reduce((acc, curr) => acc + curr.count, 0);

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

            {/* Quick Stats Grid — 주 지표 / 하단 액션 클릭 분리 */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <DashboardStatCard
                    title="이번 달 매출"
                    icon={DollarSign}
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-500/10"
                    value={`₩ ${s.totalSales.toLocaleString()}`}
                    primary={{
                        label: '주문 관리에서 매출 확인',
                        href: '/admin/orders',
                        ariaLabel: '이번 달 매출 — 주문 관리',
                    }}
                    secondary={{
                        label:
                            s.salesChangePercent === null
                                ? '지난달 대비 — 없음'
                                : `${s.salesChangePercent >= 0 ? '+' : ''}${s.salesChangePercent}% · 지난달 대비`,
                        tone:
                            s.salesChangePercent === null
                                ? 'muted'
                                : s.salesChangePercent >= 0
                                  ? 'success'
                                  : 'warning',
                    }}
                />

                <DashboardStatCard
                    title="신규 주문"
                    icon={ShoppingBag}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    value={s.newOrdersCount}
                    primary={{
                        label: '이번 달 신규 — 전체 주문 보기',
                        href: '/admin/orders',
                        ariaLabel: '이번 달 신규 주문 목록',
                    }}
                    secondary={
                        s.pendingOrdersCount > 0
                            ? {
                                  label: `${s.pendingOrdersCount}건 접수대기 — 처리 필요`,
                                  href: '/admin/orders?status=pending',
                                  ariaLabel: '접수대기 주문만 보기',
                                  tone: 'warning',
                              }
                            : {
                                  label: '접수대기 0건',
                                  tone: 'muted',
                              }
                    }
                />

                <DashboardStatCard
                    title="활성 사용자"
                    icon={Users}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10"
                    value={s.totalUsers}
                    primary={{
                        label: isSuperAdmin ? '전체 회원 관리' : '등록 회원 수',
                        href: isSuperAdmin ? '/admin/users' : undefined,
                        tone: isSuperAdmin ? 'default' : 'muted',
                    }}
                    secondary={{
                        label: `+${s.newSignupsCount}명 · 이번 달 신규 가입`,
                        href: isSuperAdmin ? '/admin/users' : undefined,
                        ariaLabel: '이번 달 신규 가입 회원',
                        tone: s.newSignupsCount > 0 && isSuperAdmin ? 'accent' : 'muted',
                    }}
                />

                <DashboardStatCard
                    title="장비 가동률"
                    icon={Activity}
                    iconColor="text-orange-400"
                    iconBg="bg-orange-500/10"
                    value={
                        s.operatingRate != null && !Number.isNaN(Number(s.operatingRate))
                            ? `${s.operatingRate}%`
                            : '없음'
                    }
                    valueClassName={
                        s.operatingRate == null || Number.isNaN(Number(s.operatingRate))
                            ? 'text-white/40 text-lg'
                            : undefined
                    }
                    primary={{
                        label: '운영 지표 설정',
                        href: '/admin/settings?tab=pricing',
                        ariaLabel: '장비 가동률 설정',
                    }}
                    secondary={{
                        label: s.operatingDetail?.trim() ? s.operatingDetail : '상세 정보 없음',
                        href: s.operatingDetail?.trim() ? '/admin/settings?tab=pricing' : undefined,
                        tone: s.operatingDetail?.trim() ? 'default' : 'muted',
                    }}
                />

                <DashboardStatCard
                    title="견적 요청"
                    icon={FileText}
                    iconColor="text-pink-400"
                    iconBg="bg-pink-500/10"
                    value={s.quotesThisMonth === null ? '없음' : s.quotesThisMonth}
                    valueClassName={s.quotesThisMonth === null ? 'text-white/40 text-lg' : undefined}
                    primary={{
                        label: '견적 관리',
                        href: '/admin/quotes',
                        ariaLabel: '견적 관리 목록',
                    }}
                    secondary={{
                        label: s.quotesThisMonth === null ? '집계 없음 · 유입 분석' : '유입 분석 보기',
                        href: '/admin/quotes/analytics',
                        ariaLabel: '견적 유입 분석',
                        tone: 'default',
                    }}
                />

                <DashboardStatCard
                    title="미확인 문의"
                    icon={MessageSquare}
                    iconColor="text-cyan-400"
                    iconBg="bg-cyan-500/10"
                    value={s.inquiriesNew === null ? '없음' : s.inquiriesNew}
                    valueClassName={s.inquiriesNew === null ? 'text-white/40 text-lg' : undefined}
                    primary={{
                        label: '문의 관리',
                        href: '/admin/inquiries',
                        ariaLabel: '문의 관리 목록',
                    }}
                    secondary={
                        s.inquiriesNew != null && s.inquiriesNew > 0
                            ? {
                                  label: `${s.inquiriesNew}건 즉시 확인 필요`,
                                  href: '/admin/inquiries?status=new',
                                  ariaLabel: '미확인 문의만 보기',
                                  tone: 'accent',
                              }
                            : {
                                  label: '미확인 문의 없음',
                                  tone: 'muted',
                              }
                    }
                />
            </div>

            <div className="grid gap-5 lg:grid-cols-12 mt-6">
                <SalesTrendPanel data={s.salesTrend} dayCount={14} />

                {/* Side Content: Quick Actions & Recent Orders */}
                <div className="lg:col-span-5 space-y-5">
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

            {/* 견적 유입 분석 — 매출 추이 하단 */}
            <QuoteFunnelTrendPanel
                trend={s.quoteFunnelTrend ?? []}
                summary={s.quoteFunnelSummary}
                sources={s.quoteTrafficSources ?? []}
                dayCount={14}
            />

            {/* Traffic Tracking Section */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Traffic Source Pie-like Chart */}
                <Card className="lg:col-span-5 bg-[#0f0f0f] border-white/5 group/traffic">
                    <CardHeader>
                        <Link
                            href="/admin/quotes/analytics"
                            className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="견적 유입 분석 보기"
                        >
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2 group-hover/traffic:text-primary transition-colors">
                                유입 경로 분석
                                <ChevronRight className="w-4 h-4 text-white/30" />
                                <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest ml-auto">Last 30 Days</span>
                            </CardTitle>
                            <p className="text-xs text-white/40 mt-1">클릭 시 견적 유입 분석</p>
                        </Link>
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

                <VisitorTrendPanel data={s.visitorTrend ?? []} dayCount={14} />
            </div>
        </div>
    );
}
