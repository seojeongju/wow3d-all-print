'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
    DollarSign,
    ShoppingBag,
    Users,
    Activity,
    Loader2,
    FileText,
    MessageSquare,
    BarChart3,
    ChevronRight,
} from 'lucide-react';
import DashboardStatCard from '@/components/admin/DashboardStatCard';
import SalesTrendPanel from '@/components/admin/SalesTrendPanel';
import VisitorTrendPanel from '@/components/admin/VisitorTrendPanel';
import TrafficSourcePanel from '@/components/admin/TrafficSourcePanel';
import AdminFunnelOverviewPanel from '@/components/admin/AdminFunnelOverviewPanel';
import { type SalesTrendPoint } from '@/lib/sales-trend';
import { type VisitorTrendPoint } from '@/lib/visitor-trend';
import {
    type FunnelEventRow,
    type HeroFunnelSummary,
    type QuoteFunnelSummary as QuoteBehaviorSummary,
    type ConversionFunnelTrendPoint,
} from '@/lib/conversion-events';
import {
    type QuoteFunnelSummary as QuoteDbSummary,
    type QuoteTrafficSource,
} from '@/lib/quote-funnel-trend';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';

type TrafficSource = {
    source: string;
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
    delivered: '배송완료',
    completed: '완료',
    cancelled: '취소',
};

function getOrderStatusLabel(status: string) {
    return ORDER_STATUS_LABEL[status] || status || '-';
}

type Stats = {
    totalSales: number;
    salesChangePercent: number | null;
    newOrdersCount: number;
    pendingOrdersCount: number;
    totalUsers: number;
    newSignupsCount: number;
    quotesThisMonth: number | null;
    inquiriesNew: number | null;
    operatingRate: number | null;
    operatingDetail: string | null;
    salesTrend: SalesTrendPoint[];
    visitorTrend: VisitorTrendPoint[];
    quoteFunnelSummary: QuoteDbSummary;
    quoteTrafficSources: QuoteTrafficSource[];
    recentOrders: RecentOrder[];
    trafficSources: TrafficSource[];
    heroFunnelEvents: FunnelEventRow[];
    heroFunnelSummary: HeroFunnelSummary;
    quoteConversionEvents: FunnelEventRow[];
    quoteConversionSummary: QuoteBehaviorSummary;
    conversionFunnelTrend: ConversionFunnelTrendPoint[];
};

const EMPTY_STATS: Stats = {
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
    quoteFunnelSummary: { total: 0, ordered: 0, incart: 0, abandoned: 0, draft: 0, conversionRate: 0 },
    quoteTrafficSources: [],
    recentOrders: [],
    trafficSources: [],
    heroFunnelEvents: [],
    heroFunnelSummary: {
        views: 0,
        fileIntent: 0,
        photoIntent: 0,
        sampleTry: 0,
        fileIntentRate: 0,
        photoIntentRate: 0,
    },
    quoteConversionEvents: [],
    quoteConversionSummary: {
        pageViews: 0,
        fileEntries: 0,
        photoEntries: 0,
        fileUploaded: 0,
        analysisComplete: 0,
        estimateView: 0,
        addToCart: 0,
        estimateRate: 0,
        cartRate: 0,
    },
    conversionFunnelTrend: [],
};

function SectionHeading({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-white/70">{title}</h2>
                {description && (
                    <p className="mt-0.5 text-xs font-medium text-white/35">{description}</p>
                )}
            </div>
            {action}
        </div>
    );
}

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
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const s: Stats = stats ?? EMPTY_STATS;
    const hasUrgent =
        s.pendingOrdersCount > 0 || (s.inquiriesNew != null && s.inquiriesNew > 0);

    return (
        <div className="space-y-8 pb-12">
            {loadFailed && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
                    대시보드 API 응답을 받지 못했습니다. 로그인·네트워크를 확인한 뒤 새로고침 해 주세요.
                </div>
            )}

            {/* 헤더 */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white">
                        대시보드
                        <span className="rounded border border-primary/20 bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                            LIVE
                        </span>
                    </h1>
                    <p className="mt-1.5 text-sm font-medium text-white/40">
                        매출·주문·전환을 한눈에 확인하고 바로 조치할 수 있습니다.
                    </p>
                </div>
                {hasUrgent && (
                    <div className="flex flex-wrap gap-2">
                        {s.pendingOrdersCount > 0 && (
                            <Link
                                href="/admin/orders?status=pending"
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-500/15"
                            >
                                접수대기 {s.pendingOrdersCount}건
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        )}
                        {s.inquiriesNew != null && s.inquiriesNew > 0 && (
                            <Link
                                href="/admin/inquiries?status=new"
                                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-500/15"
                            >
                                미확인 문의 {s.inquiriesNew}건
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* 핵심 KPI */}
            <section className="space-y-4">
                <SectionHeading
                    title="핵심 지표"
                    description="이번 달 비즈니스 현황 · 카드 클릭 시 해당 관리 화면으로 이동"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <DashboardStatCard
                        title="이번 달 매출"
                        icon={DollarSign}
                        iconColor="text-emerald-400"
                        iconBg="bg-emerald-500/10"
                        value={`₩ ${s.totalSales.toLocaleString()}`}
                        primary={{
                            label: '주문 관리에서 확인',
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
                            label: '전체 주문 보기',
                            href: '/admin/orders',
                            ariaLabel: '이번 달 신규 주문 목록',
                        }}
                        secondary={
                            s.pendingOrdersCount > 0
                                ? {
                                      label: `${s.pendingOrdersCount}건 접수대기`,
                                      href: '/admin/orders?status=pending',
                                      ariaLabel: '접수대기 주문만 보기',
                                      tone: 'warning',
                                  }
                                : { label: '접수대기 0건', tone: 'muted' }
                        }
                    />
                    <DashboardStatCard
                        title="견적 요청"
                        icon={FileText}
                        iconColor="text-pink-400"
                        iconBg="bg-pink-500/10"
                        value={s.quotesThisMonth === null ? '없음' : s.quotesThisMonth}
                        valueClassName={s.quotesThisMonth === null ? 'text-lg text-white/40' : undefined}
                        primary={{
                            label: '견적 관리',
                            href: '/admin/quotes',
                            ariaLabel: '견적 관리 목록',
                        }}
                        secondary={{
                            label: '유입·전환 분석',
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
                        valueClassName={s.inquiriesNew === null ? 'text-lg text-white/40' : undefined}
                        primary={{
                            label: '문의 관리',
                            href: '/admin/inquiries',
                            ariaLabel: '문의 관리 목록',
                        }}
                        secondary={
                            s.inquiriesNew != null && s.inquiriesNew > 0
                                ? {
                                      label: `${s.inquiriesNew}건 즉시 확인`,
                                      href: '/admin/inquiries?status=new',
                                      ariaLabel: '미확인 문의만 보기',
                                      tone: 'accent',
                                  }
                                : { label: '미확인 문의 없음', tone: 'muted' }
                        }
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DashboardStatCard
                        title="활성 사용자"
                        icon={Users}
                        iconColor="text-purple-400"
                        iconBg="bg-purple-500/10"
                        value={s.totalUsers}
                        primary={{
                            label: isSuperAdmin ? '회원 관리' : '등록 회원 수',
                            href: isSuperAdmin ? '/admin/users' : undefined,
                            tone: isSuperAdmin ? 'default' : 'muted',
                        }}
                        secondary={{
                            label: `+${s.newSignupsCount}명 · 이번 달 신규`,
                            href: isSuperAdmin ? '/admin/users' : undefined,
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
                                ? 'text-lg text-white/40'
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
                </div>
            </section>

            {/* 매출 + 빠른 조치 */}
            <section className="space-y-4">
                <SectionHeading title="매출 &amp; 최근 활동" description="최근 14일 매출 추이와 주문 처리" />
                <div className="grid gap-5 lg:grid-cols-12">
                    <SalesTrendPanel data={s.salesTrend} dayCount={14} />

                    <div className="space-y-5 lg:col-span-5">
                        <Card className="border-white/5 bg-[#0f0f0f]">
                            <CardHeader className="border-b border-white/5 pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">
                                    빠른 이동
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
                                    {[
                                        { label: '주문 확인', icon: ShoppingBag, href: '/admin/orders', color: 'text-blue-400' },
                                        { label: '견적 작성', icon: FileText, href: '/admin/quotes', color: 'text-purple-400' },
                                        { label: '전환 분석', icon: BarChart3, href: '/admin/quotes/analytics', color: 'text-teal-400' },
                                        { label: '문의 답변', icon: MessageSquare, href: '/admin/inquiries', color: 'text-pink-400' },
                                    ].map((act) => (
                                        <Link
                                            key={act.href}
                                            href={act.href}
                                            className="group flex flex-col items-center justify-center py-5 transition-colors hover:bg-white/[0.02]"
                                        >
                                            <act.icon className={`mb-2 h-5 w-5 ${act.color} transition-transform group-hover:scale-110`} />
                                            <span className="text-[11px] font-bold text-white/60 group-hover:text-white">
                                                {act.label}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/5 bg-[#0f0f0f]">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">
                                    최근 주문
                                </CardTitle>
                                <Link
                                    href="/admin/orders"
                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-primary transition-colors hover:text-white"
                                >
                                    전체
                                    <ChevronRight className="h-3 w-3" />
                                </Link>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <div className="space-y-1">
                                    {s.recentOrders.length > 0 ? (
                                        s.recentOrders.map((o) => (
                                            <Link
                                                key={o.id}
                                                href={
                                                    typeof o.id === 'number'
                                                        ? `/admin/orders?detail=${o.id}`
                                                        : '/admin/orders'
                                                }
                                                className="group flex items-center justify-between rounded-xl border border-transparent px-3 py-3 transition-all hover:border-white/5 hover:bg-white/[0.03]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[10px] font-black text-white/20 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                                        {o.recipientName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-white transition-colors group-hover:text-primary">
                                                            {o.recipientName}
                                                            <span className="rounded-full border border-primary/20 bg-primary/20 px-1.5 py-0.5 text-[9px] font-black text-primary">
                                                                {o.orderNumber.slice(-4)}
                                                            </span>
                                                        </div>
                                                        <span className="mt-0.5 block text-[9px] font-medium text-white/30">
                                                            {o.createdAt
                                                                ? new Date(o.createdAt).toLocaleString('ko-KR', {
                                                                      month: 'short',
                                                                      day: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit',
                                                                  })
                                                                : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-white">
                                                        ₩ {Number(o.totalAmount || 0).toLocaleString()}
                                                    </div>
                                                    <div
                                                        className={`text-[9px] font-bold ${
                                                            o.status === 'completed'
                                                                ? 'text-emerald-400'
                                                                : o.status === 'cancelled'
                                                                  ? 'text-red-400'
                                                                  : o.status === 'pending'
                                                                    ? 'text-amber-400'
                                                                    : 'text-white/60'
                                                        }`}
                                                    >
                                                        {getOrderStatusLabel(o.status)}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-20">
                                            <ShoppingBag className="mb-2 h-8 w-8" />
                                            <p className="text-[11px] font-bold">최근 주문 없음</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* 통합 전환·견적 */}
            <section className="space-y-4">
                <AdminFunnelOverviewPanel
                    heroSummary={s.heroFunnelSummary}
                    quoteSummary={s.quoteConversionSummary}
                    quoteDbSummary={s.quoteFunnelSummary}
                    quoteTrafficSources={s.quoteTrafficSources ?? []}
                    trend={s.conversionFunnelTrend ?? []}
                    heroRows={s.heroFunnelEvents ?? []}
                    quoteRows={s.quoteConversionEvents ?? []}
                    dayCount={14}
                />
            </section>

            {/* 유입 분석 */}
            <section className="space-y-4">
                <SectionHeading
                    title="유입 분석"
                    description="사이트 전체 트래픽 · 방문자 추이 (최근 14~30일)"
                />
                <div className="grid gap-6 lg:grid-cols-12">
                    <TrafficSourcePanel sources={s.trafficSources} token={token} dayCount={30} />
                    <VisitorTrendPanel data={s.visitorTrend ?? []} dayCount={14} />
                </div>
            </section>
        </div>
    );
}
