'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Package, Clock, Loader2, PartyPopper, ChevronRight, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { Order } from '@/lib/types'
import { motion } from 'framer-motion'

function OrderCompleteContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get('orderId')
    const orderNumber = searchParams.get('orderNumber')
    const totalAmount = searchParams.get('totalAmount')
    const isGuest = searchParams.get('guest') === '1'
    const { token } = useAuthStore()

    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (orderId && token && !isGuest) {
            loadOrderDetails()
        } else {
            setIsLoading(false)
        }
    }, [orderId, token, isGuest])

    const loadOrderDetails = async () => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
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
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const displayTotal = order?.totalAmount != null
        ? (Math.round(Number(order.totalAmount) * 1300)).toLocaleString()
        : totalAmount != null
            ? (Math.round(Number(totalAmount) * 1300)).toLocaleString()
            : '—'

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 py-24 relative z-10">
                <div className="max-w-3xl mx-auto">
                    {/* Success Hero */}
                    <div className="text-center mb-16 space-y-6">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative"
                        >
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
                            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                        </motion.div>

                        <div className="space-y-2">
                            <h1 className="text-5xl font-black uppercase tracking-tighter italic">주문 접수 완료</h1>
                            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">주문이 정상적으로 접수되었습니다</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-[1fr_2fr] gap-8">
                        {/* Summary Sidebar */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 ring-1 ring-white/5 space-y-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5">주문번호</div>
                                    <div className="font-mono text-sm font-bold text-primary">
                                        #{orderNumber || order?.orderNumber || '---'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5">상태</div>
                                    <div className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        검토 대기
                                    </div>
                                </div>
                                <Separator className="bg-white/5" />
                                <div>
                                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5">총 결제 금액</div>
                                    <div className="text-2xl font-black">₩{displayTotal}</div>
                                </div>
                            </div>

                            {isGuest ? (
                                <div className="space-y-3">
                                    <p className="text-[11px] text-white/50">등록한 이메일로 접수 안내가 발송됩니다. 문의 시 주문번호를 알려주세요.</p>
                                    <Link href="/" className="block">
                                        <Button variant="ghost" className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest gap-2">
                                            <Package className="w-4 h-4" /> 홈으로
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <Link href="/my-account" className="block transform transition-transform active:scale-95">
                                    <Button variant="ghost" className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest gap-2">
                                        <Package className="w-4 h-4" />
                                        주문 조회
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Main Info */}
                        <div className="space-y-8">
                            {/* Workflow Guide */}
                            <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-10">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em]">이후 진행 절차</h2>
                                </div>

                                <div className="grid gap-10">
                                    {[
                                        { title: "기술 검토", desc: "기술자가 3D 파일을 검토하고 출력 가능 여부를 확인합니다.", icon: "01" },
                                        { title: "최종 견적 확인", desc: "배송비·소재비를 포함한 최종 견적을 안내합니다.", icon: "02" },
                                        { title: "제작", desc: "확정 후 제품이 제작 대기열에 투입됩니다.", icon: "03" },
                                        { title: "검수 및 배송", desc: "출력물을 검수·경화 후 배송지로 발송합니다.", icon: "04" },
                                    ].map((step, idx) => (
                                        <div key={idx} className="flex gap-6 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/5 flex items-center justify-center text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-all">
                                                {step.icon}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold">{step.title}</h3>
                                                <p className="text-xs text-white/40 leading-relaxed font-medium">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Link href="/quote" className="block">
                                <Button size="lg" className="w-full h-16 rounded-3xl bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/5 font-black uppercase tracking-[0.2em] gap-3 transition-all active:scale-95 group">
                                    새 견적 받기
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-20 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                            <ShieldCheck className="w-4 h-4 text-emerald-500/40" />
                            WOW3D 산업용 등급 서비스
                        </div>
                        <p className="text-[10px] text-white/20 font-medium max-w-sm text-center italic">
                            등록하신 이메일로 접수 확인 안내를 발송했습니다.
                            문의 사항은 고객 지원팀(24/7)으로 연락해 주세요.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function OrderCompletePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <OrderCompleteContent />
        </Suspense>
    )
}
