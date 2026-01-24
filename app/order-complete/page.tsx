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
    const { token } = useAuthStore()

    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (orderId && token) {
            loadOrderDetails()
        } else if (!orderId) {
            setIsLoading(false)
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
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

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
                            <h1 className="text-5xl font-black uppercase tracking-tighter italic">Mission Accomplished</h1>
                            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Your order has been recorded successfully</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-[1fr_2fr] gap-8">
                        {/* Summary Sidebar */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 ring-1 ring-white/5 space-y-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5">Order ID</div>
                                    <div className="font-mono text-sm font-bold text-primary">
                                        #{orderNumber || order?.orderNumber || '---'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5">Status</div>
                                    <div className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        Pending Review
                                    </div>
                                </div>
                                <Separator className="bg-white/5" />
                                <div>
                                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1.5">Total Amount</div>
                                    <div className="text-2xl font-black">
                                        ₩{(Math.round(order?.totalAmount || 0) * 1300).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <Link href="/my-account" className="block transform transition-transform active:scale-95">
                                <Button variant="ghost" className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest gap-2">
                                    <Package className="w-4 h-4" />
                                    Track Order
                                </Button>
                            </Link>
                        </div>

                        {/* Main Info */}
                        <div className="space-y-8">
                            {/* Workflow Guide */}
                            <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-10">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em]">What happens next?</h2>
                                </div>

                                <div className="grid gap-10">
                                    {[
                                        { title: "Technical Review", desc: "A technician will review your 3D files and ensure printability.", icon: "01" },
                                        { title: "Price Confirmation", desc: "We'll confirm the final quote including shipping and materials.", icon: "02" },
                                        { title: "Manufacturing", desc: "Once confirmed, your parts enter the production queue.", icon: "03" },
                                        { title: "Quality Control & Ship", desc: "Parts are inspected, cured, and shipped to your destination.", icon: "04" },
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
                                    Scale Up New Quote
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-20 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                            <ShieldCheck className="w-4 h-4 text-emerald-500/40" />
                            Wow3D Industrial Grade Service
                        </div>
                        <p className="text-[10px] text-white/20 font-medium max-w-sm text-center italic">
                            Email confirmation has been sent to your registered address.
                            Our support team is available 24/7 for your questions.
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
