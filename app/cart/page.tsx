'use client'

import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCartStore()
    const { isAuthenticated } = useAuthStore()
    const { toast } = useToast()
    const [isClearing, setIsClearing] = useState(false)

    const handleQuantityChange = (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return
        updateQuantity(itemId, newQuantity)
    }

    const handleRemoveItem = (itemId: number) => {
        removeFromCart(itemId)
        toast({
            title: '✅ 삭제 완료',
            description: '항목이 장바구니에서 삭제되었습니다',
        })
    }

    const handleClearCart = () => {
        setIsClearing(true)
        setTimeout(() => {
            clearCart()
            setIsClearing(false)
            toast({
                title: '✅ 장바구니 비우기 완료',
                description: '모든 항목이 삭제되었습니다',
            })
        }, 300)
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-3xl font-bold mb-8">장바구니</h1>

                        <Card>
                            <CardContent className="py-16">
                                <div className="flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                        <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold mb-2">장바구니가 비어있습니다</h2>
                                        <p className="text-muted-foreground">
                                            견적을 받고 원하는 옵션으로 장바구니에 담아보세요
                                        </p>
                                    </div>
                                    <Link href="/quote">
                                        <Button size="lg" className="gap-2">
                                            견적 받으러 가기
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">장바구니</h1>
                            <p className="text-muted-foreground mt-1">
                                {getTotalItems()}개의 항목
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleClearCart}
                            disabled={isClearing}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            전체 비우기
                        </Button>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => (
                                <Card key={item.id}>
                                    <CardContent className="p-6">
                                        <div className="flex gap-4">
                                            {/* Item Info */}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-2">
                                                    {item.quote?.fileName || '3D 모델'}
                                                </h3>

                                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                                                    <div>
                                                        출력 방식: <span className="text-foreground font-medium">
                                                            {item.quote?.printMethod.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        재료: <span className="text-foreground font-medium">
                                                            {item.quote?.fdmMaterial || item.quote?.resinType || '-'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        부피: <span className="text-foreground font-medium">
                                                            {item.quote?.volumeCm3.toFixed(2)} cm³
                                                        </span>
                                                    </div>
                                                    <div>
                                                        예상 시간: <span className="text-foreground font-medium">
                                                            ~{item.quote?.estimatedTimeHours.toFixed(1)}h
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                        <span className="w-12 text-center font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        삭제
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground mb-1">단가</div>
                                                <div className="text-lg font-semibold">
                                                    ${item.quote?.totalPrice.toFixed(2)}
                                                </div>
                                                <Separator className="my-2" />
                                                <div className="text-sm text-muted-foreground mb-1">소계</div>
                                                <div className="text-xl font-bold text-primary">
                                                    ${((item.quote?.totalPrice || 0) * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle>주문 요약</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">상품 금액</span>
                                            <span>${getTotalPrice().toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">배송비</span>
                                            <span>$0.00</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>총 금액</span>
                                            <span className="text-primary">${getTotalPrice().toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {isAuthenticated ? (
                                            <Link href="/checkout">
                                                <Button size="lg" className="w-full gap-2">
                                                    주문하기
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground text-center">
                                                    주문하려면 로그인이 필요합니다
                                                </p>
                                                <Button size="lg" className="w-full">
                                                    로그인
                                                </Button>
                                            </div>
                                        )}

                                        <Link href="/quote">
                                            <Button size="lg" variant="outline" className="w-full">
                                                쇼핑 계속하기
                                            </Button>
                                        </Link>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <p className="text-xs text-muted-foreground">
                                            • 견적 가격은 참고용이며 실제 금액은 다를 수 있습니다<br />
                                            • 배송비는 주문 확정 시 계산됩니다<br />
                                            • 전체 제작 시간: 약 {items.reduce((total, item) =>
                                                total + (item.quote?.estimatedTimeHours || 0) * item.quantity, 0
                                            ).toFixed(1)}시간
                                        </p>
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
