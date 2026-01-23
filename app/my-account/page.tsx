'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { User, Package, FileText, LogOut, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import type { Quote, Order } from '@/lib/types'

export default function MyAccountPage() {
    const { user, token, isAuthenticated, logout } = useAuthStore()
    const router = useRouter()
    const { toast } = useToast()

    const [quotes, setQuotes] = useState<Quote[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth')
            return
        }

        loadData()
    }, [isAuthenticated])

    const loadData = async () => {
        try {
            // Load saved quotes
            const quotesRes = await fetch('/api/quotes', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (quotesRes.ok) {
                const quotesData = await quotesRes.json()
                setQuotes(quotesData.data || [])
            }

            // Load orders
            const ordersRes = await fetch('/api/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (ordersRes.ok) {
                const ordersData = await ordersRes.json()
                setOrders(ordersData.data || [])
            }
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        toast({
            title: '✅ 로그아웃 완료',
            description: '안전하게 로그아웃되었습니다',
        })
        router.push('/')
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">마이페이지</h1>
                            <p className="text-muted-foreground mt-1">
                                {user?.name}님의 활동 내역
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            로그아웃
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {/* Profile Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        프로필 정보
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">이름</div>
                                            <div className="font-medium">{user?.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">이메일</div>
                                            <div className="font-medium">{user?.email}</div>
                                        </div>
                                        {user?.phone && (
                                            <div>
                                                <div className="text-sm text-muted-foreground">전화번호</div>
                                                <div className="font-medium">{user.phone}</div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Saved Quotes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        저장된 견적 ({quotes.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {quotes.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            저장된 견적이 없습니다
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {quotes.slice(0, 5).map((quote) => (
                                                <div key={quote.id} className="p-4 rounded-lg border bg-muted/30">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium">{quote.fileName}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {quote.printMethod.toUpperCase()} • ${quote.totalPrice.toFixed(2)}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {new Date(quote.createdAt).toLocaleDateString('ko-KR')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Orders */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        주문 내역 ({orders.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {orders.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            주문 내역이 없습니다
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {orders.map((order) => (
                                                <div key={order.id} className="p-4 rounded-lg border bg-muted/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="font-medium">{order.orderNumber}</div>
                                                        <div className="text-sm">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                                                    order.status === 'shipping' ? 'bg-blue-500/20 text-blue-500' :
                                                                        order.status === 'production' ? 'bg-yellow-500/20 text-yellow-500' :
                                                                            'bg-gray-500/20 text-gray-500'
                                                                }`}>
                                                                {order.status === 'pending' && '대기'}
                                                                {order.status === 'confirmed' && '확인'}
                                                                {order.status === 'production' && '제작중'}
                                                                {order.status === 'shipping' && '배송중'}
                                                                {order.status === 'completed' && '완료'}
                                                                {order.status === 'cancelled' && '취소'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="text-muted-foreground">
                                                            {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                                                        </div>
                                                        <div className="font-semibold text-primary">
                                                            ${order.totalAmount.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
