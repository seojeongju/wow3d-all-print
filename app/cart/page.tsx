'use client'

import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Home, ChevronRight, Box, ShieldCheck, LogIn, FileText, Loader2, Package } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { showToast } from '@/lib/toast-helper'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import ModelThumbnail from '@/components/ModelThumbnail'
import type { Quote, Order } from '@/lib/types'

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
    const { items, removeFromCart, removeFromCartByIds, updateQuantity, setQuoteThumbnail, clearCart, getTotalPriceForItems, getTotalItems, addToCart } = useCartStore()
    const { isAuthenticated, sessionId, token, user } = useAuthStore()
    const [isClearing, setIsClearing] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

    // 신규 추가: 저장된 견적 관련 상태
    const [savedQuotes, setSavedQuotes] = useState<QuoteRow[]>([])
    const [isLoadingSaved, setIsLoadingSaved] = useState(false)
    const [activeTab, setActiveTab] = useState<'cart' | 'saved' | 'orders'>('cart')
    const [addingId, setAddingId] = useState<number | null>(null)

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

    const selectedItems = items.filter((i) => selectedIds.has(i.id))
    const selectedTotal = getTotalPriceForItems(selectedItems)
    const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0)

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
                                아직 담긴 모델이나 저장된 견적이 없습니다.<br />
                                지금 바로 견적을 내고 최상의 출력을 경험하세요.
                            </p>
                        </div>
                        <Link href="/quote" className="inline-block">
                            <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-black hover:bg-white/90 gap-2 font-bold transition-transform hover:scale-105">
                                견적 시작하기 <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div className="block pt-4">
                            <Link href="/" className="text-xs text-white/40 hover:text-white/60">홈으로</Link>
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
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleDeleteSelected}
                            disabled={selectedIds.size === 0 || isClearing}
                            className="text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-xl px-4 py-2 text-sm font-medium gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> 선택 삭제
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleClearCart}
                            disabled={isClearing}
                            className="text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-xl px-4 py-2 text-sm font-medium gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> 전체 비우기
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 max-w-7xl">
                {/* Tab Switcher */}
                <div className="flex items-center p-1 bg-white/[0.04] border border-white/10 rounded-2xl w-fit mb-8">
                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'cart' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/50 hover:text-white'}`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        장바구니 ({items.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'saved' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/50 hover:text-white'}`}
                    >
                        <FileText className="w-4 h-4" />
                        저장 목록 ({savedQuotes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/50 hover:text-white'}`}
                    >
                        <Package className="w-4 h-4" />
                        주문조회 ({orders.length})
                    </button>
                </div>

                <div className="grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-12">

                    {/* Left Column: Items List OR Saved Quotes List */}
                    <div className="space-y-5">
                        {activeTab === 'cart' ? (
                            <>
                                <div className="flex items-center gap-2 pb-2">
                                    <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        className="text-xs font-medium text-white/50 hover:text-white"
                                    >
                                        {selectedIds.size >= items.length ? '선택 해제' : '전체 선택'}
                                    </button>
                                    <span className="text-white/30">|</span>
                                    <span className="text-xs text-white/50">{selectedIds.size}개 선택</span>
                                </div>
                                <AnimatePresence mode="popLayout">
                                    {items.length > 0 ? (
                                        items.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -40 }}
                                                className={`p-5 sm:p-6 rounded-2xl border transition-all group ${selectedIds.has(item.id) ? 'bg-white/[0.04] border-white/10 hover:border-white/15' : 'bg-white/[0.02] border-white/5 opacity-75'}`}
                                            >
                                                <div className="flex flex-col sm:flex-row gap-6">
                                                    <label className="flex items-start gap-3 sm:items-center cursor-pointer shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(item.id)}
                                                            onChange={() => toggleSelect(item.id)}
                                                            className="w-5 h-5 rounded border-white/30 bg-white/5 text-primary focus:ring-primary"
                                                        />
                                                    </label>
                                                    <div className="w-full sm:w-28 h-28 rounded-xl bg-gradient-to-br from-white/[0.06] to-transparent border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
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
                                                            <Box className="w-10 h-10 text-white/20" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <h3 className="font-semibold text-white truncate">
                                                                    {item.quote?.fileName || (item.quote as any)?.file_name || '3D 모델'}
                                                                </h3>
                                                                <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-white/40 hover:text-red-400">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                                <div>
                                                                    <dt className="text-[10px] text-white/40 font-bold uppercase tracking-widest">방식</dt>
                                                                    <dd className="text-sm font-medium mt-0.5">{item.quote?.printMethod?.toUpperCase()}</dd>
                                                                </div>
                                                                <div>
                                                                    <dt className="text-[10px] text-white/40 font-bold uppercase tracking-widest">소재</dt>
                                                                    <dd className="text-sm font-medium mt-0.5 truncate">{item.quote?.fdmMaterial || item.quote?.resinType || '미지정'}</dd>
                                                                </div>
                                                                <div>
                                                                    <dt className="text-[10px] text-white/40 font-bold uppercase tracking-widest">부피</dt>
                                                                    <dd className="text-sm font-medium mt-0.5">{item.quote?.volumeCm3?.toFixed(1)}cm³</dd>
                                                                </div>
                                                                <div>
                                                                    <dt className="text-[10px] text-white/40 font-bold uppercase tracking-widest">예상가</dt>
                                                                    <dd className="text-sm font-bold text-primary mt-0.5">₩{Math.round((item.quote?.totalPrice || 0)).toLocaleString()}</dd>
                                                                </div>
                                                            </dl>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                            <div className="flex items-center gap-1 bg-black/30 rounded-lg p-0.5 border border-white/5">
                                                                <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-8 h-8 flex items-center justify-center text-white/40 disabled:opacity-20"><Minus className="w-3 h-3" /></button>
                                                                <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                                                <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-white/40"><Plus className="w-3 h-3" /></button>
                                                            </div>
                                                            <span className="text-lg font-black tracking-tight">₩{Math.round((item.quote?.totalPrice || 0) * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-white/30 text-sm">장바구니에 담긴 항목이 없습니다.</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </>
                        ) : activeTab === 'saved' ? (
                            /* Saved Quotes Tab Content */
                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {savedQuotes.length > 0 ? (
                                        savedQuotes.map((row) => (
                                            <motion.div
                                                key={row.id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row gap-5 items-center"
                                            >
                                                <div className="w-20 h-20 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                    {row.file_url ? (
                                                        <ModelThumbnail fileUrl={row.file_url} fileName={row.file_name} size={128} className="w-full h-full" />
                                                    ) : (
                                                        <Box className="w-8 h-8 text-white/20" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-white truncate">{row.file_name}</h3>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                        <span className="text-xs text-white/40">{row.print_method?.toUpperCase()}</span>
                                                        <span className="text-xs text-white/40">{row.volume_cm3?.toFixed(1)}cm³</span>
                                                        <span className="text-xs font-bold text-white/70">₩{Math.round(row.total_price).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <Button
                                                        onClick={() => handleAddToCartFromSaved(row)}
                                                        disabled={addingId === row.id || inCart(row.id)}
                                                        className={`flex-1 sm:flex-none h-11 px-6 rounded-xl font-bold gap-2 ${inCart(row.id) ? 'bg-white/10 text-white/40 border border-white/5' : 'bg-primary text-primary-foreground hover:scale-105'}`}
                                                    >
                                                        {addingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : inCart(row.id) ? '장바구니 담김' : (
                                                            <>담기 <Plus className="w-4 h-4" /></>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteSavedQuote(row.id)}
                                                        className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/5 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-white/30 text-sm">저장된 견적이 없습니다.</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            /* 주문조회 Tab Content */
                            <div className="space-y-4">
                                {!isAuthenticated ? (
                                    <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                        <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                        <p className="text-white/70 font-medium mb-1">로그인 후 주문 내역을 확인하세요</p>
                                        <p className="text-white/40 text-sm mb-6">회원으로 로그인하면 주문조회가 가능합니다.</p>
                                        <Link href="/auth?return=/cart">
                                            <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                                                <LogIn className="w-4 h-4" /> 로그인
                                            </Button>
                                        </Link>
                                    </div>
                                ) : isLoadingOrders ? (
                                    <div className="py-20 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                    </div>
                                ) : orders.length > 0 ? (
                                    <AnimatePresence mode="popLayout">
                                        {orders.map((order) => (
                                            <motion.div
                                                key={order.id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row gap-5 items-center justify-between"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-white font-mono">{order.orderNumber}</h3>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-white/50">
                                                        <span>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
                                                        <span className="capitalize">{order.status}</span>
                                                        <span className="font-bold text-primary">₩{Math.round((order.totalAmount || 0)).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <Link href="/my-account" className="shrink-0">
                                                    <Button variant="outline" size="sm" className="rounded-xl border-white/15 hover:bg-white/10 gap-1.5">
                                                        상세보기 <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                ) : (
                                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                        <p className="text-white/30 text-sm">주문 내역이 없습니다.</p>
                                        <Link href="/quote" className="inline-block mt-3">
                                            <Button variant="outline" size="sm" className="rounded-xl border-white/15 text-white/60 hover:text-white">
                                                견적 받기
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:pt-0">
                        <div className="sticky top-24 p-6 sm:p-7 rounded-2xl bg-white/[0.04] border border-white/10 space-y-6">
                            <div>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">1단계</span>
                                <h2 className="text-lg font-bold text-white">장바구니 확인</h2>
                                <p className="text-xs text-white/50 mt-0.5">저장 목록·장바구니를 확인하셨다면, 아래 2단계로 주문을 진행하세요.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">선택 품목</span>
                                    <span className="font-semibold text-white">{selectedCount}개</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">배송비</span>
                                    <span className="font-medium text-emerald-400/90 text-xs sm:text-sm">결제 시 산정</span>
                                </div>
                                <Separator className="bg-white/10" />
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-medium text-white/70">총 결제 금액</span>
                                    <span className="text-2xl font-bold text-primary">₩{Math.round(selectedTotal).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">2단계: 주문하기</span>
                                {selectedCount === 0 && <p className="text-xs text-amber-400/90">주문할 항목을 선택하세요.</p>}
                                {isAuthenticated ? (
                                    selectedCount > 0 ? (
                                        <Link href={`/checkout?ids=${Array.from(selectedIds).join(',')}`} className="block">
                                            <Button size="lg" className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2">
                                                회원 주문 · 결제하기 <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button size="lg" className="w-full h-14 rounded-xl bg-primary/50 font-bold gap-2 cursor-not-allowed" disabled>
                                            회원 주문 · 결제하기 <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    )
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-white/50">로그인 후 회원 주문을 진행하시거나, 비회원으로 주문하세요.</p>
                                        <Link href="/auth?return=/cart" className="block">
                                            <Button size="lg" className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2 shadow-lg shadow-primary/25 ring-2 ring-primary/40">
                                                <LogIn className="w-5 h-5" />
                                                회원(로그인) 후 주문 <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <p className="text-[10px] text-primary/80 -mt-1">주문 내역·회원 혜택 이용</p>
                                        {selectedCount > 0 ? (
                                            <Link href={`/checkout?ids=${Array.from(selectedIds).join(',')}`} className="block">
                                                <Button variant="outline" size="sm" className="w-full h-11 rounded-xl border-white/15 hover:bg-white/10 text-sm font-medium gap-2">
                                                    비회원 주문 <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        ) : (
                                            <div className="space-y-2">
                                                <Button variant="outline" size="sm" className="w-full h-11 rounded-xl border-white/10 text-white/40 font-medium gap-2 cursor-not-allowed" disabled>
                                                    비회원 주문 <ChevronRight className="w-4 h-4" />
                                                </Button>
                                                {activeTab === 'saved' && savedQuotes.length > 0 && (
                                                    <p className="text-[10px] text-primary/70 text-center animate-pulse">상단의 '담기' 버튼을 눌러 장바구니로 옮겨주세요</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <Link href="/quotes">
                                        <Button variant="outline" size="sm" className="w-full h-11 rounded-xl border-white/15 hover:bg-white/10 gap-1.5 text-sm font-medium">
                                            저장 목록
                                        </Button>
                                    </Link>
                                    <Link href="/quote">
                                        <Button variant="outline" size="sm" className="w-full h-11 rounded-xl border-white/15 hover:bg-white/10 gap-1.5 text-sm font-medium">
                                            견적 더 받기
                                        </Button>
                                    </Link>
                                    <Link href="/" className="col-span-2">
                                        <Button variant="outline" size="sm" className="w-full h-11 rounded-xl border-white/15 hover:bg-white/10 gap-1.5 text-sm font-medium">
                                            <Home className="w-4 h-4" /> 홈
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary/90 leading-relaxed font-medium">
                                    <span className="font-bold block mb-0.5">※ 안내사항</span>
                                    자동견적 금액은 참조용이며, 전문가의 모델링 검토 및 시뮬레이션을 통해서 정확한 견적 산출후 견적서 발송됩니다.
                                </div>
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
