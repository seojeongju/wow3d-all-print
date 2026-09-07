'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { Button } from '@/components/ui/button'
import { FileText, ShoppingCart, Loader2, Boxes, ArrowRight, Plus, Home, Trash2, RotateCcw, ChevronRight, Shield } from 'lucide-react'
import { showToast } from '@/lib/toast-helper'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import ModelThumbnail from '@/components/ModelThumbnail'
import QuotePrintSettingsChips from '@/components/quote/QuotePrintSettingsChips'
import type { Quote } from '@/lib/types'
import type { QuotePrintSettings } from '@/lib/quote-print-settings'

type QuoteRow = {
    id: number
    file_name: string
    file_size: number
    file_url?: string
    volume_cm3: number
    surface_area_cm2: number
    dimensions_x: number
    dimensions_y: number
    dimensions_z: number
    print_method: string
    fdm_material?: string
    fdm_material_name?: string
    fdm_infill?: number
    fdm_layer_height?: number
    fdm_support?: number | boolean
    resin_type?: string
    resin_type_name?: string
    layer_thickness?: number
    post_processing?: number | boolean
    total_price: number
    estimated_time_hours: number
    created_at: string
    updated_at: string
}

function quoteRowPrintSettings(row: QuoteRow): QuotePrintSettings {
    return {
        print_method: row.print_method,
        fdm_material: row.fdm_material,
        fdm_material_name: row.fdm_material_name,
        fdm_infill: row.fdm_infill,
        fdm_layer_height: row.fdm_layer_height,
        fdm_support: row.fdm_support,
        resin_type: row.resin_type,
        resin_type_name: row.resin_type_name,
        layer_thickness: row.layer_thickness,
        post_processing: row.post_processing,
    }
}

function toQuote(r: QuoteRow): Quote {
    return {
        id: r.id,
        fileName: r.file_name,
        fileSize: r.file_size,
        fileUrl: r.file_url,
        volumeCm3: r.volume_cm3,
        surfaceAreaCm2: r.surface_area_cm2,
        dimensionsX: r.dimensions_x,
        dimensionsY: r.dimensions_y,
        dimensionsZ: r.dimensions_z,
        printMethod: r.print_method as 'fdm' | 'sla' | 'dlp',
        fdmMaterial: r.fdm_material as Quote['fdmMaterial'],
        resinType: r.resin_type as Quote['resinType'],
        totalPrice: r.total_price,
        estimatedTimeHours: r.estimated_time_hours,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }
}

export default function SavedQuotesPage() {
    const router = useRouter()
    const { sessionId, token, user } = useAuthStore()
    const { addToCart, items } = useCartStore()
    const [quotes, setQuotes] = useState<QuoteRow[]>([])
    const [loading, setLoading] = useState(true)
    const [addingId, setAddingId] = useState<number | null>(null)

    useEffect(() => {
        const headers: HeadersInit = {}
        if (token && user?.id) {
            headers['Authorization'] = `Bearer ${token}`
            headers['X-User-ID'] = String(user.id)
        } else {
            headers['X-Session-ID'] = sessionId || ''
        }

        fetch('/api/quotes', { headers })
            .then((res) => res.json())
            .then((data) => setQuotes(Array.isArray(data?.data) ? data.data : []))
            .catch(() => setQuotes([]))
            .finally(() => setLoading(false))
    }, [sessionId, token, user?.id])

    const handleDelete = async (id: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        const headers: HeadersInit = {}
        if (token && user?.id) {
            headers['Authorization'] = `Bearer ${token}`
            headers['X-User-ID'] = String(user.id)
        } else {
            headers['X-Session-ID'] = sessionId || ''
        }

        try {
            const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE', headers })
            if (!res.ok) throw new Error('삭제 실패')
            setQuotes((prev) => prev.filter((q) => q.id !== id))
            showToast.success('삭제 완료', '견적이 삭제되었습니다')
        } catch (error) {
            showToast.error('삭제 실패', error)
        }
    }

    const handleRequote = (id: number) => {
        router.push(`/quote?load_quote_id=${id}`)
    }

    const handleAddToCart = async (row: QuoteRow) => {
        setAddingId(row.id)
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token && user?.id) {
            headers['Authorization'] = `Bearer ${token}`
            headers['X-User-ID'] = String(user.id)
        } else {
            headers['X-Session-ID'] = sessionId || ''
        }

        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers,
                body: JSON.stringify({ quoteId: row.id, quantity: 1 }),
            })
            if (!res.ok) throw new Error('장바구니 추가 실패')
            const q = toQuote(row)
            addToCart(q, 1)
            showToast.success('장바구니 담기', `${row.file_name}이(가) 장바구니에 담겼습니다`)
        } catch (error) {
            showToast.error('추가 실패', error)
        } finally {
            setAddingId(null)
        }
    }

    const inCart = (quoteId: number) => items.some((i) => i.quoteId === quoteId)

    return (
        <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col selection:bg-teal-500/30 overflow-hidden relative font-sans">
            <Header />

            {/* Premium Background System */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-400/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-400/5 rounded-full blur-[140px] animate-pulse" />
            </div>

            <div className="container mx-auto px-6 pt-40 pb-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-5xl mx-auto space-y-12"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">
                                History & Archives
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                                저장된 <span className="text-teal-400">견적함</span>
                            </h1>
                            <p className="text-lg font-bold text-white/40 max-w-xl break-keep">
                                최근 30일 이내에 산출된 견적들이 보관됩니다. 결제 또는 수정이 가능합니다.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/quote">
                                <Button className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-[13px] font-black text-white tracking-widest uppercase transition-all flex items-center gap-3 active:scale-95">
                                    <Plus className="w-5 h-5 text-teal-400" />
                                    New Quote
                                </Button>
                            </Link>
                            <Link href="/cart">
                                <Button className="h-14 px-8 rounded-2xl bg-teal-400 text-slate-950 font-black hover:bg-teal-300 text-[13px] tracking-widest uppercase transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(45,212,191,0.2)] active:scale-95">
                                    <ShoppingCart className="w-5 h-5" />
                                    Cart
                                </Button>
                            </Link>
                        </div>
                    </div>

                {loading ? (
                    <div className="flex justify-center py-32">
                        <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
                    </div>
                ) : quotes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-32 rounded-[3.5rem] bg-white/[0.02] border border-dashed border-white/10 backdrop-blur-sm space-y-8"
                    >
                        <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                            <FileText className="w-12 h-12 text-white/20" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-white/50">저장된 견적이 없습니다</h2>
                            <p className="text-white/20 font-bold max-w-sm mx-auto break-keep">파일을 업로드하여 첫 번째 지능형 견적을 만들어 보세요.</p>
                        </div>
                        <Link href="/quote" className="inline-block">
                            <Button className="h-16 px-10 rounded-2xl bg-teal-400 text-slate-950 font-black hover:bg-teal-300 shadow-xl shadow-teal-400/10 active:scale-95">
                                첫 견적 산출하기
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {quotes.map((row, i) => (
                                <motion.div
                                    key={row.id}
                                    initial={{ opacity: 0, x: -25 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all backdrop-blur-3xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                        <FileText className="w-24 h-24 text-white" />
                                    </div>

                                    <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-2xl relative z-10">
                                        {row.file_url ? (
                                            <ModelThumbnail
                                                fileUrl={row.file_url}
                                                fileName={row.file_name}
                                                size={256}
                                                className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500"
                                            />
                                        ) : (
                                            <Boxes className="w-10 h-10 text-white/20" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400/80 bg-teal-400/10 px-2 py-1 rounded-md">ID: {row.id.toString().slice(0, 8)}</span>
                                            <span className="text-xs font-bold text-white/30">{new Date(row.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white group-hover:text-teal-400 transition-colors truncate">
                                            {row.file_name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <QuotePrintSettingsChips
                                                settings={quoteRowPrintSettings(row)}
                                                trailing={
                                                    <>
                                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[13px] font-bold text-white/60">
                                                            <span className="w-2 h-2 rounded-full bg-teal-400" />
                                                            {row.print_method?.toUpperCase()}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[13px] font-bold text-white/60">
                                                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                                            {row.volume_cm3?.toFixed(1)} cm³
                                                        </span>
                                                    </>
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col items-center md:items-end gap-6 shrink-0 relative z-10 pl-8 border-l border-white/5">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Total Amount</p>
                                            <p className="text-3xl font-black text-teal-400 tracking-tight">
                                                ₩{(Math.round((row.total_price || 0))).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-12 px-4 rounded-2xl bg-white/5 text-white/40 hover:text-teal-400 hover:bg-teal-400/10 transition-all active:scale-90 font-black text-[11px] gap-1.5"
                                                onClick={() => handleRequote(row.id)}
                                                title="크기·옵션 수정"
                                            >
                                                <RotateCcw className="w-5 h-5" />
                                                수정
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-12 w-12 rounded-2xl bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-90"
                                                onClick={() => handleDelete(row.id)}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                size="lg"
                                                className="h-12 px-6 rounded-2xl bg-teal-400 text-slate-950 font-black hover:bg-teal-300 shadow-lg shadow-teal-400/5 transition-all active:scale-95 disabled:opacity-50"
                                                onClick={() => handleAddToCart(row)}
                                                disabled={addingId === row.id || inCart(row.id)}
                                            >
                                                {addingId === row.id ? <Loader2 className="w-5 h-5 animate-spin" /> : inCart(row.id) ? 'Added to Cart' : 'Add to Cart'}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Bottom Notice */}
                    <div className="rounded-[3rem] p-10 md:p-12 bg-indigo-500/5 border border-indigo-500/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                            <Shield className="w-32 h-32 text-indigo-400" />
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-2xl">
                                <Shield className="w-10 h-10" />
                            </div>
                            <div className="space-y-4 text-center md:text-left">
                                <h3 className="text-2xl font-black text-white tracking-tight">데이터 보관 정책</h3>
                                <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                                    {[
                                        '견적은 산출일로부터 30일 동안 암호화되어 보관됩니다.',
                                        '30일 이후에는 개인정보 보호 및 DB 최적화를 위해 자동 삭제됩니다.',
                                        '소속된 소재의 시장가 변동 시 견적 금액이 유동적으로 조정될 수 있습니다.',
                                        '결제 완료된 견적은 주문 이력에서 영구적으로 확인 가능합니다.'
                                    ].map((text, i) => (
                                        <div key={i} className="flex items-start gap-3 group/item">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/40 mt-1.5 group-hover/item:scale-125 transition-transform" />
                                            <span className="text-[14px] font-bold text-white/40 group-hover/item:text-white/60 transition-colors leading-relaxed break-keep">{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    )
}
