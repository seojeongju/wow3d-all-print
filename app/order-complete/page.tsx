'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Package, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Order } from '@/lib/types'

function OrderCompleteContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get('orderId')
    const orderNumber = searchParams.get('orderNumber')
    const { token } = useAuthStore()

    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (orderId && token) {
            loadOrderDetails()
        }
    }, [orderId, token])

    const loadOrderDetails = async () => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const result = await response.json()
                setOrder(result.data)
            }
        } catch (error) {
            console.error('Failed to load order details:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto">
                    {/* 성공 아이콘 */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">주문이 완료되었습니다!</h1>
                        <p className="text-muted-foreground">
                            주문이 성공적으로 접수되었습니다
                        </p>
                    </div>

                    {/* 주문 정보 */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>주문 정보</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">주문 번호</div>
                                    <div className="font-mono font-semibold text-lg">
                                        {orderNumber || order?.orderNumber || '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">주문 상태</div>
                                    <div className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-500">
                                        접수 대기중
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {order && (
                                <>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">배송지</div>
                                        <div className="font-medium">{order.shippingAddress}</div>
                                        {order.shippingPostalCode && (
                                            <div className="text-sm text-muted-foreground">
                                                우편번호: {order.shippingPostalCode}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">받는 사람</div>
                                        <div className="font-medium">
                                            {order.recipientName} · {order.recipientPhone}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div className="text-lg font-semibold">총 금액</div>
                                        <div className="text-2xl font-bold text-primary">
                                            ${order.totalAmount.toFixed(2)}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* 다음 단계 안내 */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                다음 단계
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <div className="font-medium">주문 확인</div>
                                        <div className="text-muted-foreground">
                                            담당자가 주문 내용을 확인하고 연락드립니다 (영업일 기준 1-2일)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        2
                                    </div>
                                    <div>
                                        <div className="font-medium">결제 안내</div>
                                        <div className="text-muted-foreground">
                                            최종 견적 확인 후 결제 방법을 안내드립니다
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        3
                                    </div>
                                    <div>
                                        <div className="font-medium">제작 시작</div>
                                        <div className="text-muted-foreground">
                                            결제 완료 후 3D 프린팅 제작을 시작합니다
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        4
                                    </div>
                                    <div>
                                        <div className="font-medium">배송</div>
                                        <div className="text-muted-foreground">
                                            제작 완료 후 입력하신 주소로 배송해드립니다
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 액션 버튼 */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/my-account">
                            <Button variant="outline" size="lg" className="w-full gap-2">
                                <Package className="w-4 h-4" />
                                주문 내역 보기
                            </Button>
                        </Link>
                        <Link href="/quote">
                            <Button size="lg" className="w-full">
                                쇼핑 계속하기
                            </Button>
                        </Link>
                    </div>

                    {/* 추가 안내 */}
                    <div className="mt-8 p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground text-center">
                        <p>주문 관련 문의사항이 있으시면 마이페이지에서 주문 내역을 확인하시거나</p>
                        <p className="mt-1">고객센터로 문의해주세요</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function OrderCompletePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <OrderCompleteContent />
        </Suspense>
    )
}
