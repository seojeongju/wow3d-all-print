'use client'

import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Home, ChevronRight, Box, ShieldCheck, LogIn, FileText, Loader2, Package } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { showToast } from '@/lib/toast-helper'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ModelThumbnail from '@/components/ModelThumbnail'
import type { Quote, Order } from '@/lib/types'
import {
    calculateShippingFee,
    DEFAULT_SHIPPING_SETTINGS,
    formatShippingChargeHint,
    formatFreeShippingHint,
    parseShippingSettings,
} from '@/lib/shipping-settings'

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

export default function CartPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center text-white/20 font-black uppercase tracking-widest animate-pulse italic">Loading WOW3D Cart...</div>}>
            <CartPageContent />
        </Suspense>
    )
}

function CartPageContent() {
    const { items, removeFromCart, removeFromCartByIds, updateQuantity, setQuoteThumbnail, clearCart, getTotalPriceForItems, getTotalItems, addToCart, refreshQuoteSnapshots } = useCartStore()
    const { isAuthenticated, sessionId, token, user } = useAuthStore()
    const searchParams = useSearchParams()
    const tabParam = searchParams.get('tab')
    const initialTab = tabParam === 'saved' ? 'saved' : tabParam === 'orders' ? 'orders' : 'cart'

    const [isClearing, setIsClearing] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [savedQuotes, setSavedQuotes] = useState<QuoteRow[]>([])
    const [isLoadingSaved, setIsLoadingSaved] = useState(false)
    const [activeTab, setActiveTab] = useState<'cart' | 'saved' | 'orders'>(initialTab)
    const [addingId, setAddingId] = useState<number | null>(null)
    const [storeSettings, setStoreSettings] = useState(DEFAULT_SHIPPING_SETTINGS)

    // 주문조회
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoadingOrders, setIsLoadingOrders] = useState(false)

    useEffect(() => {
        if (items.length === 0) {
            setSelectedIds(new Set())
            // 장바구니가 비어있고 저장된 목록을 아직 안 불러왔다면 '저장 목록' 탭으로 자동 전환 의논
            // (사용자 요청: "저장된 목록이 먼저 보이게")
            return
        }
        setSelectedIds((s) => {
            const kept = [...s].filter((id) => items.some((i) => i.id === id))
            return new Set(kept.length > 0 ? kept : items.map((i) => i.id))
        })
    }, [items])

    // 장바구니 진입 시 DB 견적 금액·출력 방식 동기화 (FDM↔SLA 변경 반영)
    useEffect(() => {
        if (items.length === 0) return
        const headers: HeadersInit = {}
        if (token && user?.id) {
            headers['Authorization'] = `Bearer ${token}`
            headers['X-User-ID'] = String(user.id)
        } else if (sessionId) {
            headers['X-Session-ID'] = sessionId
        } else {
            return
        }

        const syncCartQuotes = async () => {
            try {
                const res = await fetch('/api/cart', { headers, cache: 'no-store' })
                const data = await res.json()
                const rows = Array.isArray(data?.data) ? (data.data as QuoteRow[]) : []
                if (rows.length === 0) return
                refreshQuoteSnapshots(rows.map(toQuote))
            } catch (err) {
                console.error('Failed to sync cart quotes:', err)
            }
        }

        void syncCartQuotes()
    }, [items.length, sessionId, token, user?.id, refreshQuoteSnapshots])

    // 저장된 견적 목록 불러오기
    useEffect(() => {
        const fetchSavedQuotes = async () => {
            setIsLoadingSaved(true)
            const headers: HeadersInit = {}
            if (token && user?.id) {
                headers['Authorization'] = `Bearer ${token}`
                headers['X-User-ID'] = String(user.id)
            } else {
                headers['X-Session-ID'] = sessionId || ''
            }

            try {
                const res = await fetch('/api/quotes', { headers })
                const data = await res.json()
                const quotes = Array.isArray(data?.data) ? data.data : []
                // 데이터가 불완전한(부피 0) 견적 필터링
                setSavedQuotes(quotes.filter((q: any) => q.volume_cm3 > 0))

                // 자동으로 탭을 전환하지 않음 (Zustand persist 동기화 지연으로 인한 오탐 방지)
                // if (items.length === 0 && quotes.length > 0) {
                //     setActiveTab('saved')
                // }
            } catch (err) {
                console.error('Failed to fetch saved quotes:', err)
            } finally {
                setIsLoadingSaved(false)
            }
        }

        fetchSavedQuotes()
    }, [sessionId, token, user?.id, items.length])

    // 주문 목록 불러오기 (로그인 시)
    useEffect(() => {
        if (!isAuthenticated || !token || !user?.id) {
            setOrders([])
            return
        }
        const fetchOrders = async () => {
            setIsLoadingOrders(true)
            try {
                const res = await fetch('/api/orders', {
                    headers: { Authorization: `Bearer ${token}`, 'X-User-ID': String(user.id) },
                })
                const data = await res.json()
                setOrders(Array.isArray(data?.data) ? data.data : [])
            } catch (err) {
                console.error('Failed to fetch orders:', err)
            } finally {
                setIsLoadingOrders(false)
            }
        }
        fetchOrders()
    }, [isAuthenticated, token, user?.id])

    // 배송비 및 설정 정보 불러오기
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings')
                if (!res.ok) return
                const json = await res.json()
                if (json.success && Array.isArray(json.data)) {
                    setStoreSettings(parseShippingSettings(json.data))
                }
            } catch (e) {
                console.error('Failed to load store settings', e)
            }
        }
        fetchSettings()
    }, [])

    const selectedItems = items.filter((i) => selectedIds.has(i.id))
    const selectedTotal = getTotalPriceForItems(selectedItems)
    const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0)
    
    // 배송비 계산
    const shippingFee = selectedCount > 0 ? calculateShippingFee(selectedTotal, storeSettings) : 0;
    const finalTotal = selectedTotal + shippingFee;

    const handleQuantityChange = (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return
        updateQuantity(itemId, newQuantity)
    }

    const handleRemoveItem = (itemId: number) => {
        removeFromCart(itemId)
        showToast.success('항목 삭제됨', '장바구니에서 제거되었습니다')
    }

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return
        removeFromCartByIds(Array.from(selectedIds))
        showToast.success('선택 항목 삭제됨', `${selectedIds.size}개 항목이 제거되었습니다`)
    }

    const toggleSelect = (itemId: number) => {
        setSelectedIds((s) => { const n = new Set(s); if (n.has(itemId)) n.delete(itemId); else n.add(itemId); return n })
    }
    const toggleSelectAll = () => {
        setSelectedIds(selectedIds.size >= items.length ? new Set() : new Set(items.map((i) => i.id)))
    }

    const handleDeleteSavedQuote = async (id: number) => {
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
            setSavedQuotes(prev => prev.filter(q => q.id !== id))
            showToast.success('삭제 성공', '견적이 목록에서 제거되었습니다')
        } catch (error) {
            showToast.error('삭제 오류', error)
        }
    }

    const handleClearCart = () => {
        setIsClearing(true)
        setTimeout(() => {
            clearCart()
            setIsClearing(false)
            showToast.success('장바구니 비움', '모든 항목이 초기화되었습니다')
        }, 300)
    }

    const handleAddToCartFromSaved = async (row: QuoteRow) => {
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
            addToCart(toQuote(row), 1)
            showToast.success('장바구니 담기', `${row.file_name}이(가) 추가되었습니다`)
            setActiveTab('cart')
        } catch (error) {
            showToast.error('추가 실패', error)
        } finally {
            setAddingId(null)
        }
    }

    const inCart = (quoteId: number) => items.some((i) => i.quoteId === quoteId)

    const hasOrders = isAuthenticated && orders.length > 0
    const maybeHasOrders = isAuthenticated && isLoadingOrders
    if (items.length === 0 && savedQuotes.length === 0 && !isLoadingSaved && !hasOrders && !maybeHasOrders) {
        return (
            <main className="min-h-screen bg-[#020617] text-white flex flex-col font-sans overflow-hidden">
                <Header />
                {/* Premium Background System */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-400/5 rounded-full blur-[120px] animate-pulse" />
                </div>

                <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                    <div className="max-w-md w-full text-center space-y-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-32 h-32 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto backdrop-blur-3xl shadow-2xl relative group"
                        >
                            <div className="absolute inset-0 bg-teal-400/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <ShoppingCart className="w-14 h-14 text-teal-400/60 relative z-10" />
                        </motion.div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-white tracking-tight uppercase">장바구니가 비어있습니다</h2>
                            <p className="text-white/40 text-lg font-bold leading-relaxed break-keep">
                                아직 담긴 모델이나 저장된 견적이 없습니다.<br />
                                지금 바로 견적을 내고 최상의 출력을 경험하세요.
                            </p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <Link href="/quote" className="block">
                                <Button size="lg" className="w-full h-16 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 gap-3 font-black uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(45,212,191,0.2)]">
                                    견적 시작하기 <ArrowRight className="w-6 h-6" />
                                </Button>
                            </Link>
                            <Link href="/" className="text-xs font-black text-white/20 hover:text-white uppercase tracking-[0.3em] transition-colors py-4">홈으로 돌아가기</Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col selection:bg-teal-500/30 overflow-x-hidden relative font-sans">
            <Header />

            {/* Premium Background System */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-400/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[140px] animate-pulse" />
            </div>

            {/* Page title bar */}
            <div className="pt-40 pb-12 relative z-10 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 text-[11px] font-black uppercase tracking-[0.3em] mb-2">
                                <ShoppingCart className="w-4 h-4" /> 주문 관리
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white uppercase">장바구니</h1>
                            <p className="text-white/40 text-lg font-bold">
                                총 <span className="text-teal-400">{getTotalItems()}</span>개의 정밀 부품이 결제를 대기 중입니다.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={handleDeleteSelected}
                                disabled={selectedIds.size === 0 || isClearing}
                                className="h-14 px-6 rounded-2xl bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 border border-white/10 font-bold gap-2 transition-all"
                            >
                                <Trash2 className="w-4 h-4" /> 선택 삭제
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleClearCart}
                                disabled={isClearing}
                                className="h-14 px-6 rounded-2xl bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 border border-white/10 font-bold gap-2 transition-all"
                            >
                                <Trash2 className="w-4 h-4" /> 전체 비우기
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16 max-w-7xl relative z-10 flex-1">
                <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
                    <div className="space-y-10">
                        {/* Tab Switcher */}
                        <div className="flex items-center p-2 bg-white/[0.03] border border-white/10 rounded-3xl w-fit backdrop-blur-3xl shadow-2xl">
                            <button
                                onClick={() => setActiveTab('cart')}
                                className={`px-8 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === 'cart' ? 'bg-teal-400 text-slate-950 shadow-[0_10px_30px_rgba(45,212,191,0.3)]' : 'text-white/40 hover:text-white'}`}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                장바구니 ({items.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('saved')}
                                className={`px-8 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === 'saved' ? 'bg-teal-400 text-slate-950 shadow-[0_10px_30px_rgba(45,212,191,0.3)]' : 'text-white/40 hover:text-white'}`}
                            >
                                <FileText className="w-5 h-5" />
                                저장 목록 ({savedQuotes.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`px-8 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === 'orders' ? 'bg-teal-400 text-slate-950 shadow-[0_10px_30px_rgba(45,212,191,0.3)]' : 'text-white/40 hover:text-white'}`}
                            >
                                <Package className="w-5 h-5" />
                                주문 내역 ({orders.length})
                            </button>
                        </div>

                        {/* Left Column: Items List OR Saved Quotes List */}
                        <div className="space-y-6">
                            {activeTab === 'cart' ? (
                                <>
                                    <div className="flex items-center gap-4 px-2">
                                        <button
                                            type="button"
                                            onClick={toggleSelectAll}
                                            className="text-[11px] font-black uppercase tracking-widest text-teal-400/60 hover:text-teal-400 transition-colors"
                                        >
                                            {selectedIds.size >= items.length ? '전체 해제' : '전체 선택'}
                                        </button>
                                        <span className="text-white/10">|</span>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white/30">{selectedIds.size}개 품목 선택됨</span>
                                    </div>
                                    <AnimatePresence mode="popLayout">
                                        {items.length > 0 ? (
                                            items.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 30 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className={`p-8 rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500 group relative overflow-hidden ${selectedIds.has(item.id) ? 'bg-white/[0.05] border-teal-400/30' : 'bg-white/[0.02] border-white/5 opacity-60'}`}
                                                >
                                                    {selectedIds.has(item.id) && (
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/5 blur-3xl rounded-full -mr-16 -mt-16" />
                                                    )}
                                                    <div className="flex flex-col sm:flex-row gap-8 relative z-10">
                                                        <label className="flex items-start pt-4 cursor-pointer shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(item.id)}
                                                                onChange={() => toggleSelect(item.id)}
                                                                className="w-6 h-6 rounded-lg border-white/10 bg-white/5 text-teal-400 focus:ring-teal-400/50 transition-all checked:bg-teal-400"
                                                            />
                                                        </label>
                                                        <div className="w-full sm:w-40 h-40 rounded-3xl bg-slate-900/50 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                                                            {item.quote?.thumbnailDataUrl ? (
                                                                <img src={item.quote.thumbnailDataUrl} alt="" className="w-full h-full object-contain" />
                                                            ) : item.quote?.fileUrl ? (
                                                                <ModelThumbnail
                                                                    fileUrl={item.quote.fileUrl}
                                                                    fileName={item.quote?.fileName || (item.quote as any)?.file_name}
                                                                    onThumbnailReady={(url) => setQuoteThumbnail(item.id, url)}
                                                                    size={256}
                                                                    className="w-full h-full"
                                                                />
                                                            ) : (
                                                                <Box className="w-12 h-12 text-white/20" />
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>

                                                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-6">
                                                            <div>
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="space-y-1 min-w-0">
                                                                        <h3 className="text-xl font-bold text-white truncate group-hover:text-teal-400 transition-colors">
                                                                            {item.quote?.fileName || (item.quote as any)?.file_name || '3D 모델 구성'}
                                                                        </h3>
                                                                        <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">상세 견적 정보</p>
                                                                    </div>
                                                                    <button onClick={() => handleRemoveItem(item.id)} className="p-3 rounded-xl bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-90">
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                                                                    <div>
                                                                        <dt className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">작업 방식</dt>
                                                                        <dd className="text-sm font-bold text-white/80 mt-1">{item.quote?.printMethod?.toUpperCase()}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">소재</dt>
                                                                        <dd className="text-sm font-bold text-white/80 mt-1 truncate">{item.quote?.fdmMaterial || item.quote?.resinType || 'Standard'}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">부피</dt>
                                                                        <dd className="text-sm font-bold text-white/80 mt-1">{item.quote?.volumeCm3?.toFixed(1)} cm³</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">단가</dt>
                                                                        <dd className="text-sm font-black text-teal-400 mt-1">
                                                                            ₩{Math.round((item.quote?.totalPrice || 0)).toLocaleString()}
                                                                            <span className="text-[8px] ml-1 opacity-60 font-bold">(VAT 포함)</span>
                                                                        </dd>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center justify-between pt-6 border-t border-white/5">
                                                                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-2xl p-1.5 px-3">
                                                                    <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/40 active:scale-90 disabled:opacity-20 transition-all"><Minus className="w-4 h-4" /></button>
                                                                    <span className="w-10 text-center font-black text-white text-lg">{item.quantity}</span>
                                                                    <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/40 active:scale-90 transition-all"><Plus className="w-4 h-4" /></button>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">소계 (VAT 포함)</p>
                                                                    <span className="text-3xl font-black tracking-tighter text-white">₩{Math.round((item.quote?.totalPrice || 0) * item.quantity).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <ShoppingCart className="w-8 h-8 text-white/20" />
                                                </div>
                                                <p className="text-white/30 font-bold text-lg uppercase tracking-widest">장바구니가 비어있습니다.</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : activeTab === 'saved' ? (
                                <div className="space-y-6">
                                    <AnimatePresence mode="popLayout">
                                        {savedQuotes.length > 0 ? (
                                            savedQuotes.map((row) => (
                                                <motion.div
                                                    key={row.id}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-teal-400/20 transition-all flex flex-col md:flex-row gap-8 items-center group relative overflow-hidden backdrop-blur-3xl"
                                                >
                                                    <div className="w-28 h-28 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
                                                        {row.file_url ? (
                                                            <ModelThumbnail fileUrl={row.file_url} fileName={row.file_name} size={128} className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <Box className="w-10 h-10 text-white/20" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-3">
                                                        <div className="space-y-1">
                                                            <h3 className="text-xl font-bold text-white truncate">{row.file_name}</h3>
                                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">생성일 {new Date(row.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-4">
                                                            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-black text-white/60 uppercase tracking-widest">{row.print_method?.toUpperCase()}</div>
                                                            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-black text-white/60 uppercase tracking-widest">{row.volume_cm3?.toFixed(1)}cm³</div>
                                                            <div className="px-3 py-1.5 rounded-lg bg-teal-400/10 border border-teal-400/20 text-[11px] font-black text-teal-400 uppercase tracking-widest">
                                                                ₩{Math.round(row.total_price).toLocaleString()}
                                                                <span className="text-[8px] ml-1.5 opacity-60 font-black">VAT 포함</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 w-full md:w-auto">
                                                        <Button
                                                            onClick={() => handleAddToCartFromSaved(row)}
                                                            disabled={addingId === row.id || inCart(row.id)}
                                                            className={`flex-1 md:flex-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-sm gap-2 transition-all shadow-xl ${inCart(row.id) ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed' : 'bg-teal-400 text-slate-950 hover:bg-teal-300 hover:scale-105 shadow-teal-400/20'}`}
                                                        >
                                                            {addingId === row.id ? <Loader2 className="w-5 h-5 animate-spin" /> : inCart(row.id) ? '장바구니 담김' : (
                                                                <>담기 <Plus className="w-5 h-5" /></>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteSavedQuote(row.id)}
                                                            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-400 hover:bg-red-400/10 active:scale-90 transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                                <p className="text-white/30 font-bold text-lg uppercase tracking-widest">저장된 견적이 없습니다.</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {!isAuthenticated ? (
                                        <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01] flex flex-col items-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
                                                <Package className="w-10 h-10 text-white/20" />
                                            </div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">로그인이 필요합니다</h3>
                                            <p className="text-white/40 font-bold mb-10 max-w-xs mx-auto text-lg leading-relaxed">로그인 후 주문 내역을 실시간으로 확인하실 수 있습니다.</p>
                                            <Link href="/auth?return=/cart">
                                                <Button className="h-16 px-10 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-widest shadow-xl shadow-teal-400/20 gap-3 text-lg">
                                                    <LogIn className="w-6 h-6" /> 사용자 로그인
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : isLoadingOrders ? (
                                        <div className="py-32 flex items-center justify-center">
                                            <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
                                        </div>
                                    ) : orders.length > 0 ? (
                                        <AnimatePresence mode="popLayout">
                                            {orders.map((order) => (
                                                <motion.div
                                                    key={order.id}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-teal-400/20 transition-all flex flex-col md:flex-row gap-8 items-center justify-between backdrop-blur-3xl"
                                                >
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <Package className="w-5 h-5 text-teal-400" />
                                                            <h3 className="text-xl font-black text-white font-mono tracking-wider">{order.orderNumber}</h3>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">주문 날짜</span>
                                                                <span className="text-sm font-bold text-white/60">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">진행 상태</span>
                                                                <span className="text-sm font-black text-teal-400 uppercase">{order.status}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">결제 금액</span>
                                                                <span className="text-sm font-black text-white">₩{Math.round((order.totalAmount || 0)).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link href="/my-account" className="shrink-0 w-full md:w-auto">
                                                        <Button variant="outline" className="w-full md:w-auto h-14 px-8 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs gap-2 transition-all">
                                                            상세보기 <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    ) : (
                                        <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                            <p className="text-white/30 font-bold text-lg uppercase tracking-widest mb-6">주문 내역이 없습니다.</p>
                                            <Link href="/quote">
                                                <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 text-white/40 hover:text-white uppercase font-black tracking-widest text-[11px]">
                                                    새 견적 받기
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="relative">
                        <div className="sticky top-32 p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 space-y-10 backdrop-blur-3xl shadow-2xl overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <ShieldCheck className="w-32 h-32 text-teal-400" />
                            </div>
                            
                            <div className="space-y-4 relative z-10">
                                <span className="text-[11px] font-black text-teal-400 uppercase tracking-[0.3em]">Step 01</span>
                                <h2 className="text-3xl font-black text-white tracking-tight uppercase">주문 요약</h2>
                                <p className="text-white/30 text-sm font-bold leading-relaxed break-keep">품목 리스트를 확인하셨다면 아래 결제 단계로 진행해 주세요.</p>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/30 font-black uppercase tracking-widest">총 품목 수</span>
                                    <span className="font-black text-white text-lg">{selectedCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/30 font-black uppercase tracking-widest">배송비</span>
                                    <div className="text-right">
                                        <span className={`font-black uppercase tracking-widest ${shippingFee === 0 && selectedCount > 0 ? 'text-teal-400' : 'text-white'}`}>
                                            {selectedCount === 0 ? '-' : shippingFee === 0 ? '무료' : `₩${shippingFee.toLocaleString()}`}
                                        </span>
                                        {selectedCount > 0 && shippingFee > 0 && (
                                            <span className="block text-[9px] text-white/20 mt-0.5">
                                                {formatShippingChargeHint(storeSettings.freeThreshold)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="space-y-1 text-right">
                                    <p className="text-[11px] font-black text-white/20 uppercase tracking-widest">최종 합계 (배송비 및 VAT 포함)</p>
                                    <p className="text-5xl font-black tracking-tighter text-white">₩{Math.round(finalTotal).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 relative z-10">
                                <span className="text-[11px] font-black text-teal-400 uppercase tracking-[0.3em] block">Step 02: 결제하기</span>
                                {selectedCount === 0 && (
                                    <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] font-black uppercase tracking-widest text-center">
                                        주문할 항목을 선택해 주세요
                                    </div>
                                )}
                                
                                {isAuthenticated ? (
                                    <Link href={`/checkout?ids=${Array.from(selectedIds).join(',')}`} className={selectedCount === 0 ? 'pointer-events-none' : ''}>
                                        <Button 
                                            size="lg" 
                                            disabled={selectedCount === 0}
                                            className="w-full h-16 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-widest gap-2 shadow-xl shadow-teal-400/20 transition-all active:scale-95 disabled:opacity-20"
                                        >
                                            주문 및 결제하기 <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <div className="space-y-4">
                                        <Link href="/auth?return=/cart" className="block">
                                            <Button size="lg" className="w-full h-16 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-widest gap-3 shadow-xl shadow-teal-400/20 ring-4 ring-teal-400/20 transition-all">
                                                <LogIn className="w-6 h-6" /> 사용자 로그인
                                            </Button>
                                        </Link>
                                        <div className="flex items-center gap-4 py-2">
                                            <Separator className="bg-white/5 flex-1" />
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">비회원 주문</span>
                                            <Separator className="bg-white/5 flex-1" />
                                        </div>
                                        <Link href={selectedCount > 0 ? `/checkout?ids=${Array.from(selectedIds).join(',')}` : '#'} className={selectedCount === 0 ? 'pointer-events-none' : ''}>
                                            <Button variant="outline" disabled={selectedCount === 0} className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black uppercase tracking-widest text-[11px] disabled:opacity-20 transition-all">
                                                비회원 주문하기 <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="pt-10 space-y-6 relative z-10 border-t border-white/5">
                                <div className="p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 text-[11px] text-white/40 leading-relaxed font-bold">
                                    <span className="font-black text-teal-400 block mb-2 uppercase tracking-widest">※ Guide</span>
                                    자동견적 금액은 참조용이며, 전문가의 모델링 검토 및 시뮬레이션을 통해서 정확한 견적 산출 후 최종 견적서가 발송됩니다.
                                </div>
                                <div className="flex items-start gap-4 px-2">
                                    <ShieldCheck className="w-6 h-6 text-teal-400/40 shrink-0" />
                                    <div className="text-[10px] text-white/20 font-bold leading-relaxed uppercase tracking-widest">
                                        <span className="font-black text-white/40">안전한 거래</span><br />
                                        견적은 소재 단가 기준이며, 배송비는 {formatFreeShippingHint(storeSettings.freeThreshold)} 기준으로 적용됩니다.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    )
}
