'use client'

import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, Clock, Box, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

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
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto"
                    >
                        <ShoppingCart className="w-10 h-10 text-white/20" />
                    </motion.div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">장바구니가 비어있습니다</h2>
                        <p className="text-white/40 text-sm">
                            아직 장바구니에 담긴 3D 모델이 없습니다. <br />
                            지금 바로 견적을 내고 최상의 출력을 경험하세요.
                        </p>
                    </div>
                    <Link href="/quote" className="inline-block w-full text-white">
                        <Button size="lg" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 gap-2 font-black uppercase tracking-widest transition-all active:scale-95">
                            견적 시작하기
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            {/* Header Area */}
            <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">장바구니</h1>
                        <p className="text-[10px] uppercase font-bold text-white/30 tracking-[0.2em]">
                            총 {getTotalItems()}개 품목
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleClearCart}
                        disabled={isClearing}
                        className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Clear All
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-[1fr_380px] gap-12 max-w-7xl mx-auto">

                    {/* Items List */}
                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 ring-1 ring-white/5 hover:bg-white/[0.05] transition-all group relative overflow-hidden"
                                >
                                    <div className="flex flex-col md:flex-row gap-8">
                                        {/* Preview Placeholder / Icon */}
                                        <div className="w-full md:w-32 h-32 rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                                            <div className="relative">
                                                <Box className="w-12 h-12 text-white/10" />
                                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                            </div>
                                        </div>

                                        {/* Item Info */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                                        {item.quote?.fileName || '3D 모델'}
                                                    </h3>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
                                                    <div className="flex flex-col gap-1">
                                                        <span>방식</span>
                                                        <span className="text-white text-xs">{item.quote?.printMethod.toUpperCase()}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span>소재</span>
                                                        <span className="text-white text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {item.quote?.fdmMaterial || item.quote?.resinType || '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span>부피</span>
                                                        <span className="text-white text-xs">{item.quote?.volumeCm3.toFixed(1)} cm³</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span>예상 소요</span>
                                                        <span className="text-emerald-400 text-xs text-nowrap">~{Math.ceil((item.quote?.estimatedTimeHours || 0) + 24)}시간</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex items-center justify-between">
                                                {/* Qty Controls */}
                                                <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-white/10">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="w-8 text-center font-mono text-sm font-bold">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                <div className="text-right">
                                                    <span className="text-xs text-white/30 block mb-0.5">소계</span>
                                                    <span className="text-xl font-black">
                                                        ₩{(Math.round((item.quote?.totalPrice || 0) * item.quantity) * 1300).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="relative">
                        <div className="sticky top-12 p-8 rounded-[40px] bg-white/[0.03] border border-white/10 ring-1 ring-white/5 space-y-8 overflow-hidden">
                            {/* Decorative Background for Summary */}
                            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[80px]" />

                            <div className="relative">
                                <h2 className="text-xl font-black uppercase tracking-wide mb-6">주문 요약</h2>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">총 품목 수</span>
                                        <span className="font-bold">{getTotalItems()}개</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">배송비</span>
                                        <span className="text-emerald-400 font-bold uppercase text-[10px]">결제 시 산정</span>
                                    </div>
                                    <Separator className="bg-white/5 my-6" />
                                    <div className="flex justify-between items-end">
                                        <span className="text-white/40 font-black uppercase tracking-widest text-xs">총 결제 금액</span>
                                        <div className="text-right">
                                            <div className="text-sm text-white/30 font-medium line-through decoration-white/20">
                                                ₩{(Math.round(getTotalPrice() * 1.1) * 1300).toLocaleString()}
                                            </div>
                                            <div className="text-3xl font-black text-primary">
                                                ₩{(Math.round(getTotalPrice()) * 1300).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 space-y-3 relative z-10">
                                    {isAuthenticated ? (
                                        <Link href="/checkout">
                                            <Button size="lg" className="w-full h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 gap-3 font-black uppercase tracking-[0.2em] transition-all active:scale-95 group">
                                                결제하기
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-[10px] text-white/30 font-bold uppercase text-center tracking-widest px-4">
                                                주문을 이어가려면 로그인해 주세요
                                            </p>
                                            <Link href="/auth">
                                                <Button size="lg" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest transition-all">
                                                    로그인
                                                </Button>
                                            </Link>
                                        </div>
                                    )}

                                    <Link href="/quote">
                                        <Button variant="ghost" size="lg" className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/60 text-xs font-bold uppercase tracking-widest">
                                            더 둘러보기
                                        </Button>
                                    </Link>
                                </div>

                                <div className="pt-10 text-[10px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">
                                    <div className="flex items-center gap-2 mb-2 text-white/40">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
                                        안전한 주문 환경
                                    </div>
                                    • 견적은 현재 소재 단가 기준입니다<br />
                                    • 배송비는 검토 후 최종 결제 시 산정됩니다
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
