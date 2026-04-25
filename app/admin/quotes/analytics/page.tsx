'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Search, Loader2, FileText, ShoppingCart, 
    CheckCircle2, XCircle, Download, ExternalLink, 
    MousePointer2, Clock, BarChart3, Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';

type QuoteAnalytics = {
    id: number;
    user_id: number | null;
    session_id: string | null;
    file_name: string;
    file_size: number;
    file_url: string | null;
    volume_cm3: number;
    total_price: number;
    print_method: string;
    created_at: string;
    updated_at: string;
    user_name: string | null;
    user_email: string | null;
    order_number: string | null;
    order_status: string | null;
    is_in_cart: number;
    traffic_source: string | null;
    traffic_medium: string | null;
};

export default function QuoteAnalyticsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<QuoteAnalytics[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ordered' | 'incart' | 'abandoned' | 'draft'>('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/quotes/analytics', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });
            const json = await res.json();
            if (json.success) {
                setData(json.data || []);
            } else {
                throw new Error(json.error || '데이터 로드 실패');
            }
        } catch (e: any) {
            toast({ title: '분석 데이터 조회 실패', description: e.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Search filter
            const matchesSearch = searchQuery === '' || 
                item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.order_number || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            // Status filter
            if (statusFilter === 'all') return true;
            if (statusFilter === 'ordered') return item.order_number !== null;
            if (statusFilter === 'incart') return item.is_in_cart > 0 && item.order_number === null;
            if (statusFilter === 'abandoned') return item.total_price > 0 && item.order_number === null && item.is_in_cart === 0;
            if (statusFilter === 'draft') return item.total_price === 0;

            return true;
        });
    }, [data, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        const total = data.length;
        const ordered = data.filter(d => d.order_number !== null).length;
        const incart = data.filter(d => d.is_in_cart > 0 && d.order_number === null).length;
        const draft = data.filter(d => d.total_price === 0).length;
        const abandoned = total - ordered - incart - draft;

        return { total, ordered, incart, abandoned, draft };
    }, [data]);

    const getStatusBadge = (item: QuoteAnalytics) => {
        if (item.order_number) {
            return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">주문완료 ({item.order_number})</Badge>;
        }
        if (item.is_in_cart > 0) {
            return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">장바구니 보관 중</Badge>;
        }
        if (item.total_price > 0) {
            return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">견적 산출 후 이탈</Badge>;
        }
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">업로드 후 이탈</Badge>;
    };

    if (loading && data.length === 0) {
        return <div className="flex justify-center p-24"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" /> 견적 유입 분석
                    </h1>
                    <p className="text-white/50 text-sm mt-2 font-medium">사용자의 업로드 및 견적 산출 흐름을 실시간으로 모니터링합니다.</p>
                </div>
                <Button onClick={fetchData} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                    <Clock className="w-4 h-4 mr-2" /> 새로고침
                </Button>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: '전체 유입', value: stats.total, color: 'text-white', bg: 'bg-white/5' },
                    { label: '주문 전환', value: stats.ordered, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: '장바구니', value: stats.incart, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: '견적 이탈', value: stats.abandoned, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: '단순 업로드', value: stats.draft, color: 'text-slate-400', bg: 'bg-slate-500/10' },
                ].map((s, i) => (
                    <Card key={i} className={`${s.bg} border-white/10`}>
                        <CardContent className="p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{s.label}</p>
                            <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="파일명, 고객명, 주문번호 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        <Filter className="w-4 h-4 text-white/40 shrink-0" />
                        {[
                            { id: 'all', label: '전체' },
                            { id: 'ordered', label: '주문완료' },
                            { id: 'incart', label: '장바구니' },
                            { id: 'abandoned', label: '견적이탈' },
                            { id: 'draft', label: '단순업로드' },
                        ].map((f) => (
                            <Button
                                key={f.id}
                                size="sm"
                                variant={statusFilter === f.id ? 'default' : 'ghost'}
                                onClick={() => setStatusFilter(f.id as any)}
                                className={statusFilter === f.id ? '' : 'text-white/60 hover:text-white hover:bg-white/5'}
                            >
                                {f.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Main Table */}
            <Card className="bg-white/[0.03] border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">파일 정보</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">상태</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">견적 금액</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">고객/유입</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px]">일시</th>
                                <th className="p-4 font-black text-white/40 uppercase tracking-widest text-[10px] text-right">액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                                                <FileText className="w-5 h-5 text-white/40" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white truncate max-w-[240px]" title={item.file_name}>{item.file_name}</p>
                                                <p className="text-[10px] text-white/30 uppercase font-bold tracking-tight">
                                                    {item.print_method?.toUpperCase()} · {(item.file_size / (1024 * 1024)).toFixed(2)}MB
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(item)}
                                    </td>
                                    <td className="p-4">
                                        <p className="font-mono font-bold text-white">
                                            {item.total_price > 0 ? `₩ ${Math.round(item.total_price).toLocaleString()}` : '-'}
                                        </p>
                                        <p className="text-[10px] text-white/30 font-bold">{item.volume_cm3 > 0 ? `${item.volume_cm3.toFixed(1)} cm³` : ''}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium">{item.user_name || '비회원'}</p>
                                                {item.user_email && <p className="text-[10px] text-white/40">{item.user_email}</p>}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MousePointer2 className="w-3 h-3 text-primary/60" />
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-wider">
                                                    {item.traffic_source || '직접 유입'} / {item.traffic_medium || '없음'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-white/50 text-xs">
                                        {format(new Date(item.created_at), 'yy/MM/dd HH:mm')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.file_url && (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 p-0 hover:bg-white/10"
                                                    onClick={() => window.open(`/api/files/${item.file_url}`, '_blank')}
                                                    title="파일 다운로드"
                                                >
                                                    <Download className="w-4 h-4 text-white/60" />
                                                </Button>
                                            )}
                                            {item.order_number && (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 p-0 hover:bg-white/10"
                                                    onClick={() => router.push(`/admin/orders`)} // 실제론 검색 파라미터 전달 가능
                                                    title="주문 보기"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-primary" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-white/20">
                                            <XCircle className="w-12 h-12" />
                                            <p className="font-bold">검색 결과가 없습니다.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
