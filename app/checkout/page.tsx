'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, Package, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function CheckoutPage() {
    const router = useRouter()
    const { user, isAuthenticated, token } = useAuthStore()
    const { items, getTotalPrice, clearCart } = useCartStore()
    const { toast } = useToast()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        recipientName: user?.name || '',
        recipientPhone: user?.phone || '',
        shippingAddress: '',
        shippingPostalCode: '',
        customerNote: '',
    })

    useEffect(() => {
        if (!isAuthenticated) {
            toast({
                title: '⚠️ 로그인 필요',
                description: '주문하려면 로그인이 필요합니다',
                variant: 'destructive',
            })
            router.push('/auth')
        }

        if (items.length === 0) {
            toast({
                title: '⚠️ 장바구니가 비어있습니다',
                description: '주문할 상품을 추가해주세요',
            })
            router.push('/cart')
        }
    }, [isAuthenticated, items.length])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.recipientName || !formData.recipientPhone || !formData.shippingAddress) {
            toast({
                title: '❌ 필수 정보 누락',
                description: '받는 사람 정보와 배송지를 모두 입력해주세요',
                variant: 'destructive',
            })
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    cartItems: items.map(item => ({
                        quoteId: item.quoteId,
                        quantity: item.quantity,
                        totalPrice: item.quote?.totalPrice || 0,
                    })),
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || '주문 생성 실패')
            }

            const result = await response.json()

            // 장바구니 비우기
            clearCart()

            toast({
                title: '✅ 주문 완료!',
                description: `주문번호: ${result.data.orderNumber}`,
            })

            // 주문 완료 페이지로 이동
            router.push(`/order-complete?orderId=${result.data.orderId}&orderNumber=${result.data.orderNumber}`)

        } catch (error) {
            toast({
                title: '❌ 주문 실패',
                description: error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isAuthenticated || items.length === 0) {
        return null
    }

    const totalPrice = getTotalPrice()
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const estimatedTime = items.reduce(
        (sum, item) => sum + (item.quote?.estimatedTimeHours || 0) * item.quantity,
        0
    )

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/cart">
                            <Button variant="ghost" size="sm" className="gap-2 mb-4">
                                <ArrowLeft className="w-4 h-4" />
                                장바구니로 돌아가기
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold">주문하기</h1>
                        <p className="text-muted-foreground mt-1">
                            배송 정보를 입력하고 주문을 완료하세요
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* 주문 폼 */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* 주문자 정보 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        배송지 정보
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="recipientName">받는 사람 *</Label>
                                                <Input
                                                    id="recipientName"
                                                    name="recipientName"
                                                    value={formData.recipientName}
                                                    onChange={handleInputChange}
                                                    placeholder="홍길동"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="recipientPhone">전화번호 *</Label>
                                                <Input
                                                    id="recipientPhone"
                                                    name="recipientPhone"
                                                    type="tel"
                                                    value={formData.recipientPhone}
                                                    onChange={handleInputChange}
                                                    placeholder="010-1234-5678"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="shippingAddress">배송 주소 *</Label>
                                            <Input
                                                id="shippingAddress"
                                                name="shippingAddress"
                                                value={formData.shippingAddress}
                                                onChange={handleInputChange}
                                                placeholder="서울시 강남구 테헤란로 123"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="shippingPostalCode">우편번호 (선택)</Label>
                                            <Input
                                                id="shippingPostalCode"
                                                name="shippingPostalCode"
                                                value={formData.shippingPostalCode}
                                                onChange={handleInputChange}
                                                placeholder="06234"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="customerNote">요청사항 (선택)</Label>
                                            <textarea
                                                id="customerNote"
                                                name="customerNote"
                                                value={formData.customerNote}
                                                onChange={handleInputChange}
                                                placeholder="배송 시 요청사항을 입력해주세요"
                                                className="w-full min-h-24 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            />
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* 결제 방법 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        결제 방법
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                                        ℹ️ 현재는 주문 접수만 가능합니다. 결제는 담당자가 연락드린 후 진행됩니다.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 주문 요약 */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle>주문 요약</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* 주문 아이템 */}
                                    <div className="space-y-3">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <div className="flex-1">
                                                    <div className="font-medium truncate">
                                                        {item.quote?.fileName}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {item.quote?.printMethod.toUpperCase()} × {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="font-semibold ml-2">
                                                    ${((item.quote?.totalPrice || 0) * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    {/* 금액 요약 */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">상품 금액</span>
                                            <span>${totalPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">배송비</span>
                                            <span>$0.00</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>총 금액</span>
                                            <span className="text-primary">${totalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* 제작 정보 */}
                                    <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>총 제작 시간</span>
                                            <span className="font-medium">약 {estimatedTime.toFixed(1)}시간</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>주문 항목</span>
                                            <span className="font-medium">{totalItems}개</span>
                                        </div>
                                    </div>

                                    {/* 주문 버튼 */}
                                    <Button
                                        size="lg"
                                        className="w-full"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                주문 처리중...
                                            </>
                                        ) : (
                                            `$${totalPrice.toFixed(2)} 주문하기`
                                        )}
                                    </Button>

                                    {/* 주의사항 */}
                                    <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground">
                                        <p>• 주문 접수 후 담당자가 확인하여 연락드립니다</p>
                                        <p>• 견적 가격은 참고용이며 실제 금액은 다를 수 있습니다</p>
                                        <p>• 제작 시간은 예상 시간이며 변동될 수 있습니다</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
