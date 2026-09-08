'use client'

import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Home, ChevronRight, Box, ShieldCheck, LogIn, FileText, Loader2, Package, RotateCcw } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect, Suspense } from 'react'
import { showToast } from '@/lib/toast-helper'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ModelThumbnail from '@/components/ModelThumbnail'
import QuotePrintSettingsChips from '@/components/quote/QuotePrintSettingsChips'
import type { Quote, Order } from '@/lib/types'
import type { QuotePrintSettings } from '@/lib/quote-print-settings'
import {
    calculateShippingFee,
    DEFAULT_SHIPPING_SETTINGS,
    formatShippingChargeHint,
    formatFreeShippingHint,
    parseShippingSettings,
} from '@/lib/shipping-settings'
import { MESHY_AI_DISCLAIMER_SHORT, MESHY_AI_DISCLAIMER_SHORT_EN } from '@/lib/meshy-disclaimer'
import { parseMeshyJobIdFromFileName } from '@/lib/meshy-r2'

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

function CartSuspenseFallback() {
    const t = useTranslations('Cart')
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white/20 font-black uppercase tracking-widest animate-pulse italic">
            {t('loading')}
        </div>
    )
}

export default function CartPage() {
    return (
        <Suspense fallback={<CartSuspenseFallback />}>
            <CartPageContent />
        </Suspense>
    )
}

function CartPageContent() {
    const t = useTranslations('Cart')
    const locale = useLocale()
    const router = useRouter()
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
        showToast.success(t('toastItemRemovedTitle'), t('toastItemRemovedDesc'))
    }

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return
        removeFromCartByIds(Array.from(selectedIds))
        showToast.success(t('toastSelectedRemovedTitle'), t('toastSelectedRemovedDesc', { count: selectedIds.size }))
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
            if (!res.ok) throw new Error(t('errDeleteFailed'))
            setSavedQuotes(prev => prev.filter(q => q.id !== id))
            showToast.success(t('toastDeleteOkTitle'), t('toastDeleteOkDesc'))
        } catch (error) {
            showToast.error(t('toastDeleteFailTitle'), error)
        }
    }

    const handleClearCart = () => {
        setIsClearing(true)
        setTimeout(() => {
            clearCart()
            setIsClearing(false)
            showToast.success(t('toastClearTitle'), t('toastClearDesc'))
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
            if (!res.ok) throw new Error(t('errAddFailed'))
            addToCart(toQuote(row), 1)
            showToast.success(t('toastAddTitle'), t('toastAddDesc', { name: row.file_name }))
            setActiveTab('cart')
        } catch (error) {
            showToast.error(t('toastAddFailTitle'), error)
        } finally {
            setAddingId(null)
        }
    }

    const inCart = (quoteId: number) => items.some((i) => i.quoteId === quoteId)

    const handleEditQuote = (quoteId: number) => {
        router.push(`/quote?load_quote_id=${quoteId}`)
    }

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
                            <h2 className="text-4xl font-black text-white tracking-tight uppercase">{t('emptyTitle')}</h2>
                            <p className="text-white/40 text-lg font-bold leading-relaxed break-keep">
                                {t('emptyDesc1')}<br />
                                {t('emptyDesc2')}
                            </p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <Link href="/quote" className="block">
                                <Button size="lg" className="w-full h-16 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 gap-3 font-black uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(45,212,191,0.2)]">
                                    {t('startQuote')} <ArrowRight className="w-6 h-6" />
                                </Button>
                            </Link>
                            <Link href="/" className="text-xs font-black text-white/20 hover:text-white uppercase tracking-[0.3em] transition-colors py-4">{t('backHome')}</Link>
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
                                <ShoppingCart className="w-4 h-4" /> {t('badge')}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white uppercase">{t('title')}</h1>
                            <p className="text-white/40 text-lg font-bold">
                                {t.rich('subtitle', {
                                    count: getTotalItems(),
                                    highlight: (chunks) => <span className="text-teal-400">{chunks}</span>,
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={handleDeleteSelected}
                                disabled={selectedIds.size === 0 || isClearing}
                                className="h-14 px-6 rounded-2xl bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 border border-white/10 font-bold gap-2 transition-all"
                            >
                                <Trash2 className="w-4 h-4" /> {t('deleteSelected')}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleClearCart}
                                disabled={isClearing}
                                className="h-14 px-6 rounded-2xl bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 border border-white/10 font-bold gap-2 transition-all"
                            >
                                <Trash2 className="w-4 h-4" /> {t('clearAll')}
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
                                {t('tabCart', { count: items.length })}
                            </button>
                            <button
                                onClick={() => setActiveTab('saved')}
                                className={`px-8 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === 'saved' ? 'bg-teal-400 text-slate-950 shadow-[0_10px_30px_rgba(45,212,191,0.3)]' : 'text-white/40 hover:text-white'}`}
                            >
                                <FileText className="w-5 h-5" />
                                {t('tabSaved', { count: savedQuotes.length })}
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`px-8 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === 'orders' ? 'bg-teal-400 text-slate-950 shadow-[0_10px_30px_rgba(45,212,191,0.3)]' : 'text-white/40 hover:text-white'}`}
                            >
                                <Package className="w-5 h-5" />
                                {t('tabOrders', { count: orders.length })}
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
                                            {selectedIds.size >= items.length ? t('deselectAll') : t('selectAll')}
                                        </button>
                                        <span className="text-white/10">|</span>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white/30">{t('selectedCount', { count: selectedIds.size })}</span>
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
                                                                            {item.quote?.fileName || (item.quote as any)?.file_name || t('modelFallback')}
                                                                        </h3>
                                                                        <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">{t('quoteDetails')}</p>
                                                                    </div>
                                                                    <button onClick={() => handleRemoveItem(item.id)} className="p-3 rounded-xl bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-90">
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                                                                    <div>
                                                                        <dt className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">{t('printMethod')}</dt>
                                                                        <dd className="text-sm font-bold text-white/80 mt-1">{item.quote?.printMethod?.toUpperCase()}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">{t('material')}</dt>
                                                                        <dd className="text-sm font-bold text-white/80 mt-1 truncate">{item.quote?.fdmMaterial || item.quote?.resinType || 'Standard'}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">{t('volume')}</dt>
                                                                        <dd className="text-sm font-bold text-white/80 mt-1">{item.quote?.volumeCm3?.toFixed(1)} cm³</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">{t('unitPrice')}</dt>
                                                                        <dd className="text-sm font-black text-teal-400 mt-1">
                                                                            ₩{Math.round((item.quote?.totalPrice || 0)).toLocaleString()}
                                                                            <span className="text-[8px] ml-1 opacity-60 font-bold">{t('vatIncluded')}</span>
                                                                        </dd>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center justify-between pt-6 border-t border-white/5 gap-3">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    {item.quoteId ? (
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleEditQuote(item.quoteId)}
                                                                            className="h-10 rounded-xl border-white/15 bg-white/5 text-white/80 hover:bg-teal-500/15 hover:text-teal-200 font-black text-[11px] gap-1.5"
                                                                        >
                                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                                            {t('editSizeOptions')}
                                                                        </Button>
                                                                    ) : null}
                                                                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-2xl p-1.5 px-3">
                                                                    <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/40 active:scale-90 disabled:opacity-20 transition-all"><Minus className="w-4 h-4" /></button>
                                                                    <span className="w-10 text-center font-black text-white text-lg">{item.quantity}</span>
                                                                    <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/40 active:scale-90 transition-all"><Plus className="w-4 h-4" /></button>
                                                                </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">{t('subtotalVat')}</p>
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
                                                <p className="text-white/30 font-bold text-lg uppercase tracking-widest">{t('cartEmptyTab')}</p>
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
                                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{t('createdAt', { date: new Date(row.created_at).toLocaleDateString(locale) })}</p>
                                                        </div>
                                                        <QuotePrintSettingsChips
                                                            settings={quoteRowPrintSettings(row)}
                                                            className="gap-3"
                                                            trailing={
                                                                <>
                                                                    <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-black text-white/60 uppercase tracking-widest">
                                                                        {row.print_method?.toUpperCase()}
                                                                    </span>
                                                                    <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-black text-white/60 uppercase tracking-widest">
                                                                        {row.volume_cm3?.toFixed(1)}cm³
                                                                    </span>
                                                                    <span className="px-3 py-1.5 rounded-lg bg-teal-400/10 border border-teal-400/20 text-[11px] font-black text-teal-400 uppercase tracking-widest">
                                                                        ₩{Math.round(row.total_price).toLocaleString()}
                                                                        <span className="text-[8px] ml-1.5 opacity-60 font-black">{t('vatIncludedShort')}</span>
                                                                    </span>
                                                                </>
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => handleEditQuote(row.id)}
                                                            className="h-14 px-5 rounded-2xl border-white/15 bg-white/5 text-white/80 hover:bg-teal-500/15 hover:text-teal-200 font-black text-xs gap-2"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                            {t('editSizeOptions')}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleAddToCartFromSaved(row)}
                                                            disabled={addingId === row.id || inCart(row.id)}
                                                            className={`flex-1 md:flex-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-sm gap-2 transition-all shadow-xl ${inCart(row.id) ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed' : 'bg-teal-400 text-slate-950 hover:bg-teal-300 hover:scale-105 shadow-teal-400/20'}`}
                                                        >
                                                            {addingId === row.id ? <Loader2 className="w-5 h-5 animate-spin" /> : inCart(row.id) ? t('inCart') : (
                                                                <>{t('addToCart')} <Plus className="w-5 h-5" /></>
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
                                                <p className="text-white/30 font-bold text-lg uppercase tracking-widest">{t('noSavedQuotes')}</p>
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
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">{t('loginRequired')}</h3>
                                            <p className="text-white/40 font-bold mb-10 max-w-xs mx-auto text-lg leading-relaxed">{t('loginRequiredDesc')}</p>
                                            <Link href="/auth?return=/cart">
                                                <Button className="h-16 px-10 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-widest shadow-xl shadow-teal-400/20 gap-3 text-lg">
                                                    <LogIn className="w-6 h-6" /> {t('userLogin')}
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
                                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{t('orderDate')}</span>
                                                                <span className="text-sm font-bold text-white/60">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{t('orderStatus')}</span>
                                                                <span className="text-sm font-black text-teal-400 uppercase">{order.status}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{t('paymentAmount')}</span>
                                                                <span className="text-sm font-black text-white">₩{Math.round((order.totalAmount || 0)).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link href="/my-account" className="shrink-0 w-full md:w-auto">
                                                        <Button variant="outline" className="w-full md:w-auto h-14 px-8 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs gap-2 transition-all">
                                                            {t('viewDetails')} <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    ) : (
                                        <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                            <p className="text-white/30 font-bold text-lg uppercase tracking-widest mb-6">{t('noOrders')}</p>
                                            <Link href="/quote">
                                                <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 text-white/40 hover:text-white uppercase font-black tracking-widest text-[11px]">
                                                    {t('newQuote')}
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
                                <span className="text-[11px] font-black text-teal-400 uppercase tracking-[0.3em]">{t('step01')}</span>
                                <h2 className="text-3xl font-black text-white tracking-tight uppercase">{t('orderSummary')}</h2>
                                <p className="text-white/30 text-sm font-bold leading-relaxed break-keep">{t('orderSummaryDesc')}</p>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/30 font-black uppercase tracking-widest">{t('totalItems')}</span>
                                    <span className="font-black text-white text-lg">{selectedCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/30 font-black uppercase tracking-widest">{t('shipping')}</span>
                                    <div className="text-right">
                                        <span className={`font-black uppercase tracking-widest ${shippingFee === 0 && selectedCount > 0 ? 'text-teal-400' : 'text-white'}`}>
                                            {selectedCount === 0 ? t('dash') : shippingFee === 0 ? t('free') : `₩${shippingFee.toLocaleString()}`}
                                        </span>
                                        {selectedCount > 0 && shippingFee > 0 && (
                                            <span className="block text-[9px] text-white/20 mt-0.5">
                                                {formatShippingChargeHint(storeSettings.freeThreshold, locale)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="space-y-1 text-right">
                                    <p className="text-[11px] font-black text-white/20 uppercase tracking-widest">{t('finalTotal')}</p>
                                    <p className="text-5xl font-black tracking-tighter text-white">₩{Math.round(finalTotal).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 relative z-10">
                                <span className="text-[11px] font-black text-teal-400 uppercase tracking-[0.3em] block">{t('step02')}</span>
                                {selectedCount === 0 && (
                                    <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-200/95 text-[12px] font-bold leading-relaxed text-center break-keep">
                                        {activeTab === 'saved' || (items.length === 0 && savedQuotes.length > 0)
                                            ? t('selectFromSavedHint')
                                            : t('selectItemsHint')}
                                    </div>
                                )}
                                
                                {isAuthenticated ? (
                                    <Link href={`/checkout?ids=${Array.from(selectedIds).join(',')}`} className={selectedCount === 0 ? 'pointer-events-none' : ''}>
                                        <Button 
                                            size="lg" 
                                            disabled={selectedCount === 0}
                                            className="w-full h-16 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-widest gap-2 shadow-xl shadow-teal-400/20 transition-all active:scale-95 disabled:opacity-20"
                                        >
                                            {t('checkoutCta')} <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <div className="space-y-4">
                                        <Link href="/auth?return=/cart" className="block">
                                            <Button size="lg" className="w-full h-16 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-widest gap-3 shadow-xl shadow-teal-400/20 ring-4 ring-teal-400/20 transition-all">
                                                <LogIn className="w-6 h-6" /> {t('userLogin')}
                                            </Button>
                                        </Link>
                                        <div className="flex items-center gap-4 py-2">
                                            <Separator className="bg-white/5 flex-1" />
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{t('guestOrder')}</span>
                                            <Separator className="bg-white/5 flex-1" />
                                        </div>
                                        <Link href={selectedCount > 0 ? `/checkout?ids=${Array.from(selectedIds).join(',')}` : '#'} className={selectedCount === 0 ? 'pointer-events-none' : ''}>
                                            <Button variant="outline" disabled={selectedCount === 0} className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black uppercase tracking-widest text-[11px] disabled:opacity-20 transition-all">
                                                {t('guestCheckout')} <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="pt-10 space-y-6 relative z-10 border-t border-white/5">
                                <div className="p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 text-[11px] text-white/40 leading-relaxed font-bold space-y-2">
                                    <span className="font-black text-teal-400 block mb-2 uppercase tracking-widest">{t('guideTitle')}</span>
                                    <p>
                                        {t('guideBody')}
                                    </p>
                                    {items.some(
                                        (i) => parseMeshyJobIdFromFileName(i.quote?.fileName || '') != null
                                    ) && (
                                        <p className="text-amber-100/90 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-2.5">
                                            {locale === 'en' ? MESHY_AI_DISCLAIMER_SHORT_EN : MESHY_AI_DISCLAIMER_SHORT}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-start gap-4 px-2">
                                    <ShieldCheck className="w-6 h-6 text-teal-400/40 shrink-0" />
                                    <div className="text-[10px] text-white/20 font-bold leading-relaxed uppercase tracking-widest">
                                        <span className="font-black text-white/40">{t('safeTrade')}</span><br />
                                        {t('shippingPolicy', { hint: formatFreeShippingHint(storeSettings.freeThreshold, locale) })}
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
