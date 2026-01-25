'use client'

import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Home, ChevronRight, Box, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'

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
            title: '✅ 항목 삭제됨',
            description: '장바구니에서 안전하게 제거되었습니다',
        })
    }

    const handleClearCart = () => {
        setIsClearing(true)
        setTimeout(() => {
            clearCart()
            setIsClearing(false)
            toast({
                title: '✅ 장바구니 비움',
                description: '모든 항목이 초기화되었습니다',
            })
        }, 300)
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#050505] text-white">
                <Header />
                <div className="pt-24 flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center space-y-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto"
                        >
                            <ShoppingCart className="w-10 h-10 text-white/30" />
                        </motion.div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-white">장바구니가 비어있습니다</h2>
                            <p className="text-white/50 text-sm leading-relaxed">
                                아직 장바구니에 담긴 3D 모델이 없습니다.<br />
                                지금 바로 견적을 내고 최상의 출력을 경험하세요.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/" className="flex-1">
                                <Button variant="outline" size="lg" className="w-full h-12 rounded-xl border-white/15 hover:bg-white/10 gap-2 font-semibold">
                                    <Home className="w-4 h-4" /> 홈으로
                                </Button>
                            </Link>
                            <Link href="/quote" className="flex-1">
                                <Button size="lg" className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 gap-2 font-bold">
                                    견적 시작하기 <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            <Header />

            {/* Page title bar – Header(홈/nav)는 위에 고정 */}
            <div className="pt-24 border-b border-white/10 bg-black/30">
                <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">장바구니</h1>
                        <p className="mt-1 text-sm text-white/50">
                            총 <span className="font-semibold text-white/80">{getTotalItems()}</span>개 품목
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleClearCart}
                        disabled={isClearing}
                        className="self-start sm:self-center text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-xl px-4 py-2 text-sm font-medium gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> 전체 비우기
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 max-w-7xl">
                <div className="grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-12">

                    {/* Items List */}
                    <div className="space-y-5">
                        <AnimatePresence mode="popLayout">
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ duration: 0.25 }}
                                    className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/15 transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        {/* Preview */}
                                        <div className="w-full sm:w-28 h-28 rounded-xl bg-gradient-to-br from-white/[0.06] to-transparent border border-white/10 flex items-center justify-center shrink-0">
                                            <Box className="w-10 h-10 text-white/20" />
                                        </div>

                                        {/* Item Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <h3 className="font-semibold text-base sm:text-lg text-white truncate">
                                                        {item.quote?.fileName || '3D 모델'}
                                                    </h3>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                                                        aria-label="항목 삭제"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                                                    <div>
                                                        <dt className="text-xs text-white/50 font-medium">방식</dt>
                                                        <dd className="text-sm font-medium text-white mt-0.5">{item.quote?.printMethod?.toUpperCase() || '—'}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs text-white/50 font-medium">소재</dt>
                                                        <dd className="text-sm font-medium text-white mt-0.5 truncate">{item.quote?.fdmMaterial || item.quote?.resinType || '미지정'}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs text-white/50 font-medium">부피</dt>
                                                        <dd className="text-sm font-medium text-white mt-0.5">{item.quote?.volumeCm3?.toFixed(1) ?? '—'} cm³</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs text-white/50 font-medium">예상 소요</dt>
                                                        <dd className="text-sm font-medium text-emerald-400 mt-0.5">~{Math.ceil((item.quote?.estimatedTimeHours || 0) + 24)}시간</dd>
                                                    </div>
                                                </dl>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-10 text-center text-sm font-semibold text-white">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-xs text-white/50">소계</span>
                                                    <span className="text-lg font-bold text-white">₩{(Math.round((item.quote?.totalPrice || 0) * item.quantity) * 1300).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:pt-0">
                        <div className="sticky top-24 p-6 sm:p-7 rounded-2xl bg-white/[0.04] border border-white/10 space-y-6">
                            <h2 className="text-lg font-bold text-white">주문 요약</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">총 품목 수</span>
                                    <span className="font-semibold text-white">{getTotalItems()}개</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">배송비</span>
                                    <span className="font-medium text-emerald-400/90 text-xs sm:text-sm">결제 시 산정</span>
                                </div>
                                <Separator className="bg-white/10" />
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-medium text-white/70">총 결제 금액</span>
                                    <span className="text-2xl font-bold text-primary">₩{(Math.round(getTotalPrice()) * 1300).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {isAuthenticated ? (
                                    <Link href="/checkout" className="block">
                                        <Button size="lg" className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2">
                                            결제하기 <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-white/50 text-center">회원으로 주문하거나 비회원으로 바로 주문할 수 있습니다</p>
                                        <Link href="/checkout" className="block">
                                            <Button size="lg" className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-semibold gap-2">
                                                비회원으로 주문하기 <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link href="/auth?return=/cart">
                                            <Button variant="outline" size="sm" className="w-full h-11 rounded-xl border-white/15 hover:bg-white/10 text-sm font-medium">
                                                로그인 후 주문
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <Link href="/">
                                        <Button variant="outline" size="sm" className="w-full h-11 rounded-xl border-white/15 hover:bg-white/10 gap-1.5 text-sm font-medium">
                                            <Home className="w-4 h-4" /> 홈
                                        </Button>
                                    </Link>
                                    <Link href="/quote">
                                        <Button variant="outline" size="sm" className="w-full h-11 rounded-xl border-white/15 hover:bg-white/10 gap-1.5 text-sm font-medium">
                                            견적 더 받기
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500/70 shrink-0 mt-0.5" />
                                    <div className="text-xs text-white/45 leading-relaxed">
                                        <span className="font-medium text-white/60">안전한 주문</span><br />
                                        견적은 현재 소재 단가 기준이며, 배송비는 결제 단계에서 산정됩니다.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
