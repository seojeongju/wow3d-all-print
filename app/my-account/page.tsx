'use client';

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

    // derived stats (실제 주문 데이터 기준)
    const activeOrders = orders.filter(o => ['pending', 'confirmed', 'production', 'shipping'].includes(o.status));
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalSpentKr = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    return (
        <div className="min-h-screen bg-muted/20 pb-20">
            {/* Header Banner */}
            <div className="bg-background border-b pt-6 pb-12">
                <div className="container mx-auto px-4 space-y-6">
                    <div>
                        <Link href="/">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground px-0 mb-4 h-auto text-xs font-bold uppercase tracking-widest gap-2"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                홈으로
                            </Button>
                        </Link>
                    </div>
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
                                        ₩{Math.round(totalSpentKr).toLocaleString('ko-KR')}
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
                                                    ₩{Math.round((Number(order.totalAmount) || 0)).toLocaleString('ko-KR')}
                                                </Badge>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="flex flex-col gap-4">
                                                    {order.items?.map(item => (
                                                        <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/10 rounded-lg border">
                                                            <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                                                {item.quote?.fileUrl ? (
                                                                    <ModelThumbnail fileUrl={item.quote.fileUrl} size={100} />
                                                                ) : (
                                                                    <Box className="w-full h-full p-4 text-muted-foreground/30" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium truncate">{item.quote?.fileName || `상품 #${item.quoteId}`}</div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="outline" className="text-[10px] h-4 uppercase">{item.quote?.printMethod}</Badge>
                                                                    <span className="text-xs text-muted-foreground">{item.quantity}개</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm font-bold text-right">
                                                                ₩{Math.round((Number(item.subtotal) || 0)).toLocaleString('ko-KR')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4 text-sm mt-8 p-4 bg-muted/20 rounded-lg border border-primary/5">
                                                    <div>
                                                        <span className="text-muted-foreground flex items-center gap-1.5 mb-2"><MapPin className="w-3.5 h-3.5" /> 배송지</span>
                                                        <span className="font-medium">{order.shippingAddress}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground flex items-center gap-1.5 mb-2"><User className="w-3.5 h-3.5" /> 받는 사람</span>
                                                        <span className="font-medium">{order.recipientName} ({order.recipientPhone})</span>
                                                    </div>
                                                </div>

                                                {order.status === 'pending' && (
                                                    <div className="mt-6 flex gap-3">
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 gap-2 border-primary/20 hover:border-primary/50"
                                                            onClick={() => setEditingOrder(order)}
                                                        >
                                                            <Edit2 className="w-4 h-4" /> 주문 수정
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleCancelOrder(order.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" /> 주문 취소
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>

                            {/* History Tab */}
                            <TabsContent value="history" className="space-y-6">
                                <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                                    <div className="flex flex-1 gap-3 w-full">
                                        <div className="relative flex-1 max-w-sm">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                placeholder="주문번호 검색..."
                                                className="pl-10"
                                                value={orderSearch}
                                                onChange={(e) => setOrderSearch(e.target.value)}
                                            />
                                        </div>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-[140px]">
                                                <Filter className="w-4 h-4 mr-2" />
                                                <SelectValue placeholder="상태 필터" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">전체 상태</SelectItem>
                                                <SelectItem value="pending">대기 중</SelectItem>
                                                <SelectItem value="confirmed">승인 완료</SelectItem>
                                                <SelectItem value="production">제작 중</SelectItem>
                                                <SelectItem value="shipping">배송 중</SelectItem>
                                                <SelectItem value="completed">배송 완료</SelectItem>
                                                <SelectItem value="cancelled">취소됨</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        총 {filteredOrders.length}건의 주문
                                    </div>
                                </div>

                                {filteredOrders.length === 0 ? (
                                    <Card className="py-20 bg-muted/20 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                            <Search className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-muted-foreground">검색 결과가 없습니다.</p>
                                    </Card>
                                ) : (
                                    <div className="grid gap-4">
                                        {filteredOrders.map(order => (
                                            <Card key={order.id} className="hover:shadow-md transition-shadow duration-200">
                                                <CardContent className="p-0">
                                                    <div className="flex flex-col md:flex-row">
                                                        {/* Order Info Part */}
                                                        <div className="p-5 flex-1 border-b md:border-b-0 md:border-r">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <div className="text-xs text-muted-foreground mb-1">
                                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="font-mono text-sm font-bold tracking-tight">
                                                                        {order.orderNumber}
                                                                    </div>
                                                                </div>
                                                                <Badge
                                                                    variant={order.status === 'completed' ? 'default' : 'secondary'}
                                                                    className="px-2.5 py-0.5 rounded-full"
                                                                >
                                                                    {order.status}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex gap-2 mb-2">
                                                                {order.items?.slice(0, 3).map((item, idx) => (
                                                                    <div key={idx} className="w-10 h-10 rounded bg-muted/50 border flex items-center justify-center overflow-hidden">
                                                                        {item.quote?.fileUrl ? (
                                                                            <ModelThumbnail fileUrl={item.quote.fileUrl} size={60} />
                                                                        ) : (
                                                                            <Box className="w-4 h-4 text-muted-foreground/20" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {(order.items?.length || 0) > 3 && (
                                                                    <div className="w-10 h-10 rounded border bg-muted/20 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                                        +{(order.items?.length || 0) - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-sm font-medium">
                                                                {order.items && order.items.length > 0
                                                                    ? `${order.items[0].quote?.fileName || '상품'} ${order.items.length > 1 ? `외 ${order.items.length - 1}건` : ''}`
                                                                    : '상품 정보 없음'}
                                                            </div>
                                                        </div>

                                                        {/* Total & Action Part */}
                                                        <div className="p-5 w-full md:w-64 bg-muted/5 flex flex-col justify-between gap-4">
                                                            <div className="text-right">
                                                                <div className="text-xs text-muted-foreground mb-1 text-left md:text-right">결제 금액</div>
                                                                <div className="text-xl font-black text-primary text-left md:text-right">
                                                                    ₩{Math.round((Number(order.totalAmount) || 0)).toLocaleString('ko-KR')}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="flex-1 h-10"
                                                                    onClick={() => setSelectedOrder(order)}
                                                                >
                                                                    상세보기
                                                                </Button>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="flex-1 h-10 gap-1.5"
                                                                    onClick={() => handleReOrder(order)}
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5" /> 재주문
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Saved Quotes Tab */}
                            <TabsContent value="quotes">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {quotes.map(quote => (
                                        <Card key={quote.id} className="overflow-hidden group hover:border-primary/40 transition-colors">
                                            <div className="h-44 bg-muted/40 relative group-hover:bg-muted/60 transition-colors overflow-hidden">
                                                <ModelThumbnail
                                                    fileUrl={quote.fileUrl || ''}
                                                    className="group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute top-2 right-2">
                                                    <Badge className="bg-white/80 backdrop-blur-sm text-black border-none shadow-sm">
                                                        {quote.printMethod.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardHeader className="pb-2 p-4">
                                                <CardTitle className="text-sm font-bold truncate mb-1" title={quote.fileName}>
                                                    {quote.fileName}
                                                </CardTitle>
                                                <CardDescription className="text-[10px] flex items-center justify-between">
                                                    <span>{new Date(quote.createdAt).toLocaleDateString()}</span>
                                                    <span>{(quote.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="px-4 pb-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="text-lg font-black text-primary">
                                                        ₩{quote.totalPrice.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        className="flex-1 h-9 rounded-full gap-1.5"
                                                        onClick={() => handleAddToCartFromSaved(quote)}
                                                    >
                                                        <ShoppingBag className="w-3.5 h-3.5" /> 담기
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/5 hover:border-destructive/30"
                                                        onClick={() => handleDeleteQuote(quote.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {quotes.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-muted/10 rounded-xl border border-dashed border-muted-foreground/20">
                                            <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                            <p className="text-muted-foreground">저장된 견적이 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Profile Tab */}
                            <TabsContent value="profile">
                                <div className="grid md:grid-cols-3 gap-8">
                                    {/* Profile Summary Card */}
                                    <Card className="md:col-span-1 shadow-md border-primary/5">
                                        <CardHeader className="text-center pb-2">
                                            <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center text-primary mb-4 border-4 border-primary/5 shadow-inner">
                                                <User className="w-12 h-12" />
                                            </div>
                                            <CardTitle className="text-xl">{user?.name}님</CardTitle>
                                            <CardDescription className="flex items-center justify-center gap-1">
                                                <Mail className="w-3 h-3" /> {user?.email}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4 border-t mt-4">
                                            <div className="flex justify-between text-sm py-1">
                                                <span className="text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4" /> 총 주문</span>
                                                <span className="font-bold">{orders.length}건</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-1">
                                                <span className="text-muted-foreground flex items-center gap-2"><FileText className="w-4 h-4" /> 저장한 견적</span>
                                                <span className="font-bold">{quotes.length}건</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-1">
                                                <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> 마지막 로그인</span>
                                                <span className="font-bold italic text-[11px]">{new Date().toLocaleDateString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Detailed Form Card */}
                                    <Card className="md:col-span-2 shadow-md border-primary/5">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                            <div>
                                                <CardTitle>회원 정보 관리</CardTitle>
                                                <CardDescription>연락처 등 기본 정보를 변경할 수 있습니다.</CardDescription>
                                            </div>
                                            {!isEditingProfile && (
                                                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditingProfile(true)}>
                                                    <Edit2 className="w-4 h-4" /> 정보 수정
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                                <div className="grid gap-6">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="name" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">이름</Label>
                                                        {isEditingProfile ? (
                                                            <Input
                                                                id="name"
                                                                value={profileForm.name}
                                                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                                className="h-11"
                                                                required
                                                            />
                                                        ) : (
                                                            <div className="h-11 flex items-center px-4 bg-muted/40 rounded-lg font-medium border border-transparent">
                                                                {user?.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="phone" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">휴대폰 번호</Label>
                                                        {isEditingProfile ? (
                                                            <Input
                                                                id="phone"
                                                                placeholder="010-0000-0000"
                                                                value={profileForm.phone}
                                                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                                className="h-11"
                                                            />
                                                        ) : (
                                                            <div className="h-11 flex items-center px-4 bg-muted/40 rounded-lg font-medium border border-transparent">
                                                                <Phone className="w-4 h-4 mr-2 text-primary/40" />
                                                                {user?.phone || '등록된 번호가 없습니다.'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="grid gap-2 opacity-60">
                                                        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">이메일 계정 (수정 불가)</Label>
                                                        <div className="h-11 flex items-center px-4 bg-muted/20 rounded-lg border border-dashed">
                                                            <Mail className="w-4 h-4 mr-2 text-muted-foreground/40" />
                                                            {user?.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isEditingProfile && (
                                                    <div className="flex justify-end gap-3 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <Button
                                                            variant="ghost"
                                                            type="button"
                                                            onClick={() => {
                                                                setIsEditingProfile(false);
                                                                if (user) setProfileForm({ name: user.name, phone: user.phone || '' });
                                                            }}
                                                        >
                                                            취소
                                                        </Button>
                                                        <Button type="submit" className="gap-2 px-6" disabled={isUpdating}>
                                                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                            변경사항 저장
                                                        </Button>
                                                    </div>
                                                )}
                                            </form>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>주문 상세 정보</DialogTitle>
                        <DialogDescription>
                            주문번호: <span className="font-mono text-primary">{selectedOrder?.orderNumber}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* 주문 상태 및 날짜 */}
                            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg justify-between items-center">
                                <div>
                                    <span className="text-xs text-muted-foreground block mb-1">주문 일자</span>
                                    <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('ko-KR')}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block mb-1">주문 상태</span>
                                    <Badge>{selectedOrder.status}</Badge>
                                </div>
                            </div>

                            {/* 배송 정보 */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" /> 배송 정보
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm p-4 border rounded-lg">
                                    <div>
                                        <span className="text-muted-foreground block mb-1">받는 분</span>
                                        <span className="font-medium">{selectedOrder.recipientName}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block mb-1">연락처</span>
                                        <span className="font-medium">{selectedOrder.recipientPhone}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground block mb-1">주소</span>
                                        <span className="font-medium">{selectedOrder.shippingAddress} {selectedOrder.shippingPostalCode && `(${selectedOrder.shippingPostalCode})`}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 주문 상품 목록 */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> 주문 상품
                                </h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                            <tr>
                                                <th className="p-3 text-left font-medium">상품 정보</th>
                                                <th className="p-3 text-center font-medium w-20">수량</th>
                                                <th className="p-3 text-right font-medium w-32">가격</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedOrder.items?.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="p-3">
                                                        <div className="font-medium">{item.quote?.fileName || `상품 #${item.quoteId}`}</div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {item.quote?.printMethod && <Badge variant="outline" className="text-[10px] h-5 mr-1">{item.quote.printMethod.toUpperCase()}</Badge>}
                                                            {item.quote?.fileSize && <span className="ml-1">{(item.quote.fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">{item.quantity}</td>
                                                    <td className="p-3 text-right font-medium">
                                                        ₩{Math.round((Number(item.subtotal) || 0)).toLocaleString('ko-KR')}
                                                    </td>
                                                </tr>
                                            ))}
                                            {!selectedOrder.items?.length && (
                                                <tr>
                                                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                                        상세 품목 정보가 없습니다.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-muted/30 font-medium">
                                            <tr>
                                                <td colSpan={2} className="p-3 text-right">총 결제 금액</td>
                                                <td className="p-3 text-right text-base text-primary">
                                                    ₩{Math.round((Number(selectedOrder.totalAmount) || 0) ).toLocaleString('ko-KR')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {selectedOrder.customerNote && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">배송 메세지</h4>
                                    <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground">
                                        {selectedOrder.customerNote}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Order Edit Dialog */}
            <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>주문 수정</DialogTitle>
                        <DialogDescription>
                            진행 중인 주문의 배송 정보 및 수량을 수정합니다.
                        </DialogDescription>
                    </DialogHeader>

                    {editingOrder && (
                        <form onSubmit={handleUpdateOrder} className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="recipientName">받는 사람</Label>
                                    <Input
                                        id="recipientName"
                                        value={editingOrder.recipientName}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, recipientName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="recipientPhone">연락처</Label>
                                    <Input
                                        id="recipientPhone"
                                        value={editingOrder.recipientPhone}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, recipientPhone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="shippingAddress">주소</Label>
                                    <Input
                                        id="shippingAddress"
                                        value={editingOrder.shippingAddress}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, shippingAddress: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customerNote">배송 메시지</Label>
                                    <Input
                                        id="customerNote"
                                        value={editingOrder.customerNote || ''}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, customerNote: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4 border-t">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">품목 수량 수정</Label>
                                    <div className="space-y-3">
                                        {editingOrder.items?.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium truncate">{item.quote?.fileName || `상품 #${item.quoteId}`}</div>
                                                    <div className="text-xs text-muted-foreground">단가: ₩{(item.unitPrice).toLocaleString()}</div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            const newItems = [...(editingOrder.items || [])];
                                                            if (newItems[idx].quantity > 1) {
                                                                newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity - 1 };
                                                                setEditingOrder({ ...editingOrder, items: newItems });
                                                            }
                                                        }}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            const newItems = [...(editingOrder.items || [])];
                                                            newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity + 1 };
                                                            setEditingOrder({ ...editingOrder, items: newItems });
                                                        }}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setEditingOrder(null)}>취소</Button>
                                <Button type="submit" disabled={isUpdating} className="gap-2">
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
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
