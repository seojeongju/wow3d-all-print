'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Package, Clock, Loader2, ArrowRight, ShieldCheck, Copy, LogIn, Mail } from 'lucide-react'
import type { Order } from '@/lib/types'
import { motion } from 'framer-motion'

function OrderCompleteContent() {
    const t = useTranslations('OrderComplete')
    const searchParams = useSearchParams()
    const orderId = searchParams.get('orderId')
    const orderNumber = searchParams.get('orderNumber')
    const totalAmount = searchParams.get('totalAmount')
    const guestEmail = searchParams.get('email')
    const isGuest = searchParams.get('guest') === '1'
    const { token } = useAuthStore()

    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    // order_complete 전환 이벤트는 POST /api/orders 서버에서 기록 (페이지 미도달 누락 방지)
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

    const displayOrderNumber = orderNumber || order?.orderNumber || '---'

    const handleCopyOrderNumber = async () => {
        try {
            await navigator.clipboard.writeText(String(displayOrderNumber))
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch {
            /* ignore */
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
        ? (Math.round(Number(order.totalAmount))).toLocaleString()
        : totalAmount != null
            ? (Math.round(Number(totalAmount))).toLocaleString()
            : '—'

    const steps = [
        { title: t('step1Title'), desc: t('step1Desc'), icon: '01' },
        { title: t('step2Title'), desc: t('step2Desc'), icon: '02' },
        { title: t('step3Title'), desc: t('step3Desc'), icon: '03' },
        { title: t('step4Title'), desc: t('step4Desc'), icon: '04' },
    ]

    const authReturn = `/auth?return=${encodeURIComponent('/cart?tab=orders')}`

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 py-24 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16 space-y-6">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 12 }}
                            className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative"
                        >
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
                            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                        </motion.div>

                        <div className="space-y-2">
                            <h1 className="text-5xl font-black uppercase tracking-tighter italic">{t('title')}</h1>
                            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">{t('subtitle')}</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-[1fr_2fr] gap-8">
                        <div className="space-y-6">
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 ring-1 ring-white/5 space-y-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5">{t('orderNumber')}</div>
                                    <div className="flex items-center gap-2">
                                        <div className="font-mono text-sm font-bold text-primary">
                                            #{displayOrderNumber}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCopyOrderNumber}
                                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-[10px] font-bold text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
                                        >
                                            <Copy className="h-3 w-3" />
                                            {copied ? t('copied') : t('copyOrderNumber')}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5">{t('status')}</div>
                                    <div className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        {t('statusReview')}
                                    </div>
                                </div>
                                <Separator className="bg-white/5" />
                                <div>
                                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5">{t('totalAmount')}</div>
                                    <div className="text-2xl font-black">₩{displayTotal}</div>
                                </div>
                            </div>

                            {isGuest ? (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-4 space-y-3">
                                        <div className="text-[11px] font-black text-teal-300 tracking-wide">
                                            {t('guestLookupTitle')}
                                        </div>
                                        <p className="text-[12px] text-white/55 leading-relaxed break-keep">
                                            {t('guestLookupBody')}
                                        </p>
                                        <div className="rounded-xl bg-black/30 border border-white/5 p-3 space-y-2">
                                            <div className="flex items-start gap-2 text-[12px]">
                                                <Package className="w-3.5 h-3.5 text-teal-400/80 mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="text-white/35 font-bold">{t('orderNumber')}: </span>
                                                    <span className="font-mono font-bold text-white/85">#{displayOrderNumber}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2 text-[12px]">
                                                <Mail className="w-3.5 h-3.5 text-teal-400/80 mt-0.5 shrink-0" />
                                                <div className="min-w-0 break-all">
                                                    <span className="text-white/35 font-bold">{t('guestEmailLabel')}: </span>
                                                    <span className="font-bold text-white/85">
                                                        {guestEmail || t('guestEmailFallback')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                                        <div className="text-[11px] font-black text-white/70 tracking-wide">
                                            {t('loginNudgeTitle')}
                                        </div>
                                        <p className="text-[12px] text-white/45 leading-relaxed break-keep">
                                            {t('loginNudgeBody')}
                                        </p>
                                        <Link href={authReturn} className="block">
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-white text-[12px] font-bold gap-2"
                                            >
                                                <LogIn className="w-4 h-4" />
                                                {t('loginNudgeCta')}
                                            </Button>
                                        </Link>
                                    </div>

                                    <Link href="/" className="block">
                                        <Button variant="ghost" className="w-full h-11 rounded-xl text-white/45 hover:text-white hover:bg-white/5 text-[11px] font-bold gap-2">
                                            <Package className="w-4 h-4" /> {t('goHome')}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Link href="/cart?tab=orders" className="block transform transition-transform active:scale-95">
                                        <Button variant="ghost" className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest gap-2">
                                            <Package className="w-4 h-4" />
                                            {t('viewOrders')}
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-10">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em]">{t('nextSteps')}</h2>
                                </div>

                                <div className="grid gap-10">
                                    {steps.map((step, idx) => (
                                        <div key={idx} className="flex gap-6 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/5 flex items-center justify-center text-[10px] font-black group-hover:bg-primary group-hover:text-primary-foreground transition-all">
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
                                    {t('newQuote')}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-20 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                            <ShieldCheck className="w-4 h-4 text-emerald-500/40" />
                            {t('footerBrand')}
                        </div>
                        <p className="text-[10px] text-white/20 font-medium max-w-sm text-center italic">
                            {t('footerNote')}
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
