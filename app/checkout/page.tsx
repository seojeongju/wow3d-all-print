'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, Package, CreditCard, ChevronRight, MapPin, Phone, User, MessageSquare, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'

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
            router.push('/auth')
        }
        if (items.length === 0) {
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
                title: '❌ 정보 부족',
                description: '배송을 위한 필수 정보를 모두 입력해 주세요',
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
            clearCart()

            toast({
                title: '✅ 주문 성공',
                description: `주문이 접수되었습니다 (${result.data.orderNumber})`,
            })

            router.push(`/order-complete?orderId=${result.data.orderId}&orderNumber=${result.data.orderNumber}`)

        } catch (error) {
            toast({
                title: '❌ 주문 실패',
                description: error instanceof Error ? error.message : '주문 도중 문제가 발생했습니다',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isAuthenticated || items.length === 0) return null

    const totalPriceKWR = Math.round(getTotalPrice() * 1300)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            {/* Minimal Header */}
            <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center">
                    <Link href="/cart">
                        <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/10 rounded-full px-4 text-[10px] font-black uppercase tracking-widest gap-2">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            돌아가기
                        </Button>
                    </Link>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">안전 결제</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16">
                <div className="max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-[1fr_360px] gap-16">

                        {/* Delivery Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-12"
                        >
                            <div className="space-y-2">
                                <h1 className="text-4xl font-black tracking-tight leading-none uppercase">주문 정보</h1>
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest">배송에 필요한 정보를 입력해 주세요</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 text-primary">
                                        <MapPin className="w-5 h-5" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">배송지</h3>
                                    </div>

                                    <div className="grid gap-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2.5">
                                                <Label htmlFor="recipientName" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    <User className="w-3 h-3" /> 받는 분
                                                </Label>
                                                <Input
                                                    id="recipientName"
                                                    name="recipientName"
                                                    value={formData.recipientName}
                                                    onChange={handleInputChange}
                                                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                    placeholder="홍길동"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label htmlFor="recipientPhone" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3" /> 연락처
                                                </Label>
                                                <Input
                                                    id="recipientPhone"
                                                    name="recipientPhone"
                                                    type="tel"
                                                    value={formData.recipientPhone}
                                                    onChange={handleInputChange}
                                                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                    placeholder="010-0000-0000"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label htmlFor="shippingAddress" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                <MapPin className="w-3 h-3" /> 배송 주소
                                            </Label>
                                            <Input
                                                id="shippingAddress"
                                                name="shippingAddress"
                                                value={formData.shippingAddress}
                                                onChange={handleInputChange}
                                                className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                placeholder="도로명, 동/호수, 상세주소"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label htmlFor="shippingPostalCode" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                우편번호
                                            </Label>
                                            <Input
                                                id="shippingPostalCode"
                                                name="shippingPostalCode"
                                                value={formData.shippingPostalCode}
                                                onChange={handleInputChange}
                                                className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                placeholder="00000"
                                            />
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label htmlFor="customerNote" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                <MessageSquare className="w-3 h-3" /> Delivery Note (Optional)
                                            </Label>
                                            <textarea
                                                id="customerNote"
                                                name="customerNote"
                                                value={formData.customerNote}
                                                onChange={handleInputChange}
                                                placeholder="배송사에 전달할 요청 사항을 입력하세요..."
                                                className="w-full min-h-32 px-5 py-4 rounded-3xl bg-white/[0.03] border border-white/10 text-sm font-bold ring-offset-black focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-white/10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6">
                                    <div className="flex items-center gap-3 text-white/40">
                                        <CreditCard className="w-5 h-5" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">결제 안내</h3>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center">
                                            <CreditCard className="w-5 h-5 text-white/20" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-xs font-bold text-white/60 block">견적 검토 후 결제</span>
                                            <p className="text-[10px] text-white/20 font-medium uppercase tracking-widest mt-0.5">기술 검토 후 최종 견적·결제를 안내해 드립니다</p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </motion.div>

                        {/* Order Summary Sticky Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative"
                        >
                            <div className="sticky top-12 p-8 rounded-[40px] bg-white/[0.03] border border-white/10 ring-1 ring-white/5 space-y-8">
                                <h2 className="text-xl font-black uppercase tracking-wide">주문 검토</h2>

                                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4 group">
                                            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 transition-all">
                                                <Package className="w-5 h-5 text-white/20" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold truncate group-hover:text-primary transition-colors">{item.quote?.fileName}</div>
                                                <div className="text-[10px] text-white/30 font-black uppercase mt-0.5">{item.quote?.printMethod.toUpperCase()} • 수량 {item.quantity}</div>
                                            </div>
                                            <div className="text-xs font-mono font-bold">
                                                ₩{(Math.round((item.quote?.totalPrice || 0) * item.quantity) * 1300).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="bg-white/5" />

                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-white/30 tracking-widest">
                                        <span>품목 ({totalItems}개)</span>
                                        <span className="text-white">₩{totalPriceKWR.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase text-white/30 tracking-widest">
                                        <span>배송비</span>
                                        <span className="text-emerald-400">검토 후 산정</span>
                                    </div>
                                    <div className="flex justify-between items-baseline pt-4 border-t border-white/5 mt-4">
                                        <span className="text-xs font-black uppercase tracking-widest">총 결제 예정</span>
                                        <span className="text-2xl font-black text-primary">₩{totalPriceKWR.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        size="lg"
                                        className="w-full h-18 rounded-2xl bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/5 gap-3 font-black uppercase tracking-[0.2em] transition-all active:scale-95 group"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                주문 확정
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>

                                    <div className="mt-6 flex items-center justify-center gap-1.5 text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
                                        엔터프라이즈급 데이터 암호화
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    )
}
