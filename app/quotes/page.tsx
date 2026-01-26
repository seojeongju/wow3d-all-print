'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { Button } from '@/components/ui/button'
import { FileText, ShoppingCart, Loader2, Boxes, ArrowRight, Plus, Home, Trash2, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import ModelThumbnail from '@/components/ModelThumbnail'
import type { Quote } from '@/lib/types'

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
    resin_type?: string
    total_price: number
    estimated_time_hours: number
    created_at: string
    updated_at: string
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
    const { toast } = useToast()
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
            toast({ title: '🗑️ 삭제 완료', description: '견적이 삭제되었습니다' })
        } catch {
            toast({ title: '❌ 삭제 실패', description: '다시 시도해 주세요', variant: 'destructive' })
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
            toast({ title: '🛒 장바구니 담기', description: `${row.file_name}이(가) 장바구니에 담겼습니다` })
        } catch {
            toast({ title: '❌ 추가 실패', description: '다시 시도해 주세요', variant: 'destructive' })
        } finally {
            setAddingId(null)
        }
    }

    const inCart = (quoteId: number) => items.some((i) => i.quoteId === quoteId)

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            <Header />

            <div className="pt-24 border-b border-white/10 bg-black/30">
                <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-6">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">저장 목록</h1>
                    <p className="mt-1 text-sm text-white/50">
                        저장한 견적을 확인하고 장바구니에 담은 뒤, 장바구니에서 주문을 진행하세요.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                ) : quotes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 space-y-6"
                    >
                        <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto">
                            <FileText className="w-10 h-10 text-white/30" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">저장된 견적이 없습니다</h2>
                            <p className="text-white/50 text-sm mt-2">견적 페이지에서 저장하면 여기에 나타납니다.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/quote">
                                <Button size="lg" className="rounded-xl bg-white text-black hover:bg-white/90 gap-2 font-bold">
                                    <Plus className="w-4 h-4" /> 견적 받기
                                </Button>
                            </Link>
                            <Link href="/cart">
                                <Button variant="outline" size="lg" className="rounded-xl border-white/15 hover:bg-white/10 gap-2">
                                    <ShoppingCart className="w-4 h-4" /> 장바구니
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <Link href="/quote" className="text-primary hover:underline font-medium">+ 새 견적</Link>
                            <span className="text-white/30">|</span>
                            <Link href="/cart" className="text-white/70 hover:text-white font-medium flex items-center gap-1">
                                <ShoppingCart className="w-4 h-4" /> 장바구니
                            </Link>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {quotes.map((row, i) => (
                                <motion.div
                                    key={row.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center gap-4"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                        {row.file_url ? (
                                            <ModelThumbnail
                                                fileUrl={row.file_url}
                                                fileName={row.file_name}
                                                size={128}
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <Boxes className="w-6 h-6 text-white/30" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-white truncate">{row.file_name}</div>
                                        <div className="text-xs text-white/50 mt-0.5">
                                            {row.print_method?.toUpperCase() || '—'} · {row.volume_cm3?.toFixed(1) ?? '—'} cm³ · ₩{(Math.round((row.total_price || 0) * 1300)).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-primary hover:bg-primary/10"
                                            onClick={() => handleRequote(row.id)}
                                            title="수정(재견적)"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                            onClick={() => handleDelete(row.id)}
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-xl border-white/15 hover:bg-white/10 h-10 text-xs font-medium"
                                            onClick={() => handleAddToCart(row)}
                                            disabled={addingId === row.id || inCart(row.id)}
                                        >
                                            {addingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : inCart(row.id) ? '담김' : '장바구니에 담기'}
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <div className="pt-6 flex flex-wrap gap-3">
                            <Link href="/cart" className="inline-flex">
                                <Button size="lg" className="rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2">
                                    장바구니로 이동 <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                            <Link href="/">
                                <Button variant="outline" size="sm" className="rounded-xl border-white/15 hover:bg-white/10 gap-2">
                                    <Home className="w-4 h-4" /> 홈
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
