'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, FileText, LogOut, Loader2, ShoppingBag, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Quote, Order } from '@/lib/types';
import OrderTimeline from '@/components/account/OrderTimeline';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function MyAccountPage() {
    const { user, token, isAuthenticated, logout } = useAuthStore();
    const router = useRouter();
    const { toast } = useToast();

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth');
            return;
        }
        loadData();
    }, [isAuthenticated]);

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
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        toast({
            title: '✅ 로그아웃 완료',
            description: '안전하게 로그아웃되었습니다',
        });
        router.push('/');
    };

    if (!isAuthenticated) return null;

    // derived stats
    const activeOrders = orders.filter(o => ['pending', 'confirmed', 'production', 'shipping'].includes(o.status));
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return (
        <div className="min-h-screen bg-muted/20 pb-20">
            {/* Header Banner */}
            <div className="bg-background border-b py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                                안녕하세요, {user?.name}님!
                            </h1>
                            <p className="text-muted-foreground">
                                오늘도 멋진 아이디어를 현실로 만들어보세요.
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleLogout} className="gap-2">
                            <LogOut className="w-4 h-4" /> 로그아웃
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="shadow-lg border-none bg-gradient-to-br from-primary/10 to-background">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">진행 중인 주문</CardTitle>
                                    <Clock className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{activeOrders.length}건</div>
                                    <p className="text-xs text-muted-foreground mt-1">배송을 기다리고 있어요</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">총 주문 완료</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{completedOrders.length}건</div>
                                    <p className="text-xs text-muted-foreground mt-1">지금까지 완료된 프로젝트</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">총 결제 금액</CardTitle>
                                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(totalSpent)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">누적 이용 금액</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Tabs */}
                        <Tabs defaultValue="active-orders" className="space-y-6">
                            <TabsList className="bg-background border p-1 rounded-xl h-auto flex flex-wrap justify-start gap-2">
                                <TabsTrigger value="active-orders" className="rounded-lg px-4 py-2">진행 중인 주문</TabsTrigger>
                                <TabsTrigger value="history" className="rounded-lg px-4 py-2">주문 내역</TabsTrigger>
                                <TabsTrigger value="quotes" className="rounded-lg px-4 py-2">저장된 견적</TabsTrigger>
                                <TabsTrigger value="profile" className="rounded-lg px-4 py-2">내 정보</TabsTrigger>
                            </TabsList>

                            {/* Active Orders Tab */}
                            <TabsContent value="active-orders" className="space-y-4">
                                {activeOrders.length === 0 ? (
                                    <Card className="py-12 bg-muted/40 border-dashed">
                                        <CardContent className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <Package className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-semibold mb-2">진행 중인 주문이 없습니다</h3>
                                            <p className="text-muted-foreground mb-6">새로운 아이디어를 출력해보세요!</p>
                                            <Link href="/quote">
                                                <Button>새 견적 받기</Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    activeOrders.map(order => (
                                        <Card key={order.id} className="overflow-hidden">
                                            <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">주문번호 {order.orderNumber}</CardTitle>
                                                    <CardDescription>{new Date(order.createdAt).toLocaleDateString('ko-KR')} 주문</CardDescription>
                                                </div>
                                                <Badge variant="outline" className="text-base px-3 py-1 bg-background">
                                                    {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(order.totalAmount)}
                                                </Badge>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="mb-8">
                                                    <OrderTimeline status={order.status} />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4 text-sm mt-8 p-4 bg-muted/20 rounded-lg">
                                                    <div>
                                                        <span className="text-muted-foreground block mb-1">배송지</span>
                                                        <span className="font-medium">{order.shippingAddress}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block mb-1">받는 사람</span>
                                                        <span className="font-medium">{order.recipientName} ({order.recipientPhone})</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>

                            {/* History Tab */}
                            <TabsContent value="history">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>전체 주문 내역</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="p-4">주문번호</th>
                                                        <th className="p-4">날짜</th>
                                                        <th className="p-4">상태</th>
                                                        <th className="p-4 text-right">금액</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.map(order => (
                                                        <tr key={order.id} className="border-t">
                                                            <td className="p-4 font-mono">{order.orderNumber}</td>
                                                            <td className="p-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                            <td className="p-4">
                                                                <Badge variant="secondary">{order.status}</Badge>
                                                            </td>
                                                            <td className="p-4 text-right font-medium">
                                                                {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(order.totalAmount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Saved Quotes Tab */}
                            <TabsContent value="quotes">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {quotes.map(quote => (
                                        <Card key={quote.id}>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base truncate" title={quote.fileName}>
                                                    {quote.fileName}
                                                </CardTitle>
                                                <CardDescription>{new Date(quote.createdAt).toLocaleDateString()}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <Badge variant="outline" className="mb-2">{quote.printMethod.toUpperCase()}</Badge>
                                                        <div className="font-bold text-lg">
                                                            {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(quote.totalPrice)}
                                                        </div>
                                                    </div>
                                                    <Button size="sm" variant="secondary">다시 계산</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {quotes.length === 0 && (
                                        <div className="col-span-2 text-center py-12 text-muted-foreground">저장된 견적이 없습니다.</div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Profile Tab */}
                            <TabsContent value="profile">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>내 프로필 정보</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 max-w-lg">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">이름</label>
                                            <div className="p-3 bg-muted rounded-md">{user?.name}</div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">이메일</label>
                                            <div className="p-3 bg-muted rounded-md">{user?.email}</div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">전화번호</label>
                                            <div className="p-3 bg-muted rounded-md">{user?.phone || '등록되지 않음'}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
}
