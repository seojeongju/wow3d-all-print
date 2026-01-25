'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { DollarSign, ShoppingBag, Users, Activity, Loader2, TrendingUp } from 'lucide-react';

type Stats = {
    totalSales: number;
    salesChangePercent: number;
    newOrdersCount: number;
    pendingOrdersCount: number;
    totalUsers: number;
    newSignupsCount: number;
    operatingRate: number;
    operatingDetail: string;
    salesTrend: { date: string; amount: number }[];
    recentOrders: { orderNumber: string; recipientName: string; createdAt: string; totalAmount: number }[];
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                const json = await res.json();
                if (json.success && json.data) setStats(json.data);
            } catch (e) {
                console.error('Failed to fetch admin stats', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

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
        operatingRate: 82,
        operatingDetail: '프린터 12/15대 가동중',
        salesTrend: [],
        recentOrders: [],
    };

    const maxTrend = Math.max(1, ...s.salesTrend.map((t) => t.amount));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">대시보드</h1>
                <p className="text-white/50 text-sm mt-1">Wow3D 서비스 현황을 한눈에 확인하세요.</p>
                <div className="flex flex-wrap gap-2 mt-4">
                    {[
                        { label: '서비스', href: '/#services' },
                        { label: '기능', href: '/#features' },
                        { label: '공정', href: '/#process' },
                        { label: '주문조회', href: '/admin/orders' },
                    ].map((x) => (
                        <Link
                            key={x.href}
                            href={x.href}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
                        >
                            {x.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">총 매출</CardTitle>
                        <DollarSign className="h-4 w-4 text-white/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            ₩ {s.totalSales.toLocaleString()}
                        </div>
                        <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            {s.salesChangePercent >= 0 ? '+' : ''}{s.salesChangePercent}% 지난달 대비
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">신규 주문</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-white/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">+{s.newOrdersCount}</div>
                        <p className="text-xs text-white/50 mt-1">{s.pendingOrdersCount}건 대기중</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">활성 사용자</CardTitle>
                        <Users className="h-4 w-4 text-white/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{s.totalUsers}</div>
                        <p className="text-xs text-white/50 mt-1">+{s.newSignupsCount} 신규 가입</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">가동률</CardTitle>
                        <Activity className="h-4 w-4 text-white/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{s.operatingRate}%</div>
                        <p className="text-xs text-white/50 mt-1">{s.operatingDetail}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4 bg-white/[0.03] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">최근 매출 추이</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {s.salesTrend.length > 0 ? (
                            <div className="h-[200px] flex items-end gap-1 pr-4">
                                {s.salesTrend.map((t) => (
                                    <div
                                        key={t.date}
                                        className="flex-1 min-w-[8px] flex flex-col items-center gap-1"
                                        title={`${t.date}: ₩${t.amount.toLocaleString()}`}
                                    >
                                        <div
                                            className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors"
                                            style={{ height: `${Math.max(4, (t.amount / maxTrend) * 160)}px` }}
                                        />
                                        <span className="text-[10px] text-white/40 truncate max-w-full">
                                            {t.date.slice(5)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-white/30 text-sm">
                                차트 준비중...
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3 bg-white/[0.03] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white">최근 주문</CardTitle>
                        <Link
                            href="/admin/orders"
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            전체 보기
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {s.recentOrders.length > 0 ? (
                                s.recentOrders.map((o) => (
                                    <Link
                                        key={o.orderNumber}
                                        href="/admin/orders"
                                        className="flex items-center justify-between py-1 group"
                                    >
                                        <div>
                                            <span className="font-medium text-white group-hover:text-primary transition-colors">
                                                {o.orderNumber}
                                            </span>
                                            <span className="text-xs text-white/50 block">
                                                {o.recipientName} · {o.createdAt ? new Date(o.createdAt).toLocaleDateString('ko-KR') : '-'}
                                            </span>
                                        </div>
                                        <span className="font-bold text-white">₩ {Number(o.totalAmount || 0).toLocaleString()}</span>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-sm text-white/40 py-4">최근 주문이 없습니다.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
