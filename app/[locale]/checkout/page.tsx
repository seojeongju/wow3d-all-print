'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, Package, CreditCard, ChevronRight, MapPin, Phone, User, MessageSquare, ShieldCheck, Mail, Search } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { showToast } from '@/lib/toast-helper'
import { isTokenExpired, validateAuthToken, isAuthTokenError } from '@/lib/auth-session'
import { motion } from 'framer-motion'
import Script from 'next/script'
import {
    calculateShippingFee,
    DEFAULT_SHIPPING_SETTINGS,
    formatFreeShippingBenefit,
    formatFreeShippingHint,
    parseShippingSettings,
} from '@/lib/shipping-settings'
import { MESHY_AI_DISCLAIMER_CHECKOUT, MESHY_AI_DISCLAIMER_CHECKOUT_EN } from '@/lib/meshy-disclaimer'
import { parseMeshyJobIdFromFileName } from '@/lib/meshy-r2'
import {
    CHECKOUT_CONVERSION_EVENTS,
    CONVERSION_EVENT_CATEGORY,
} from '@/lib/conversion-events'
import { trackConversionEventOnce } from '@/lib/track-conversion-event'

declare global {
    interface Window {
        daum?: {
            Postcode: new (options: {
                oncomplete: (data: {
                    zonecode: string
                    address: string
                    addressEnglish: string
                    addressType: 'R' | 'J'
                    bname: string
                    buildingName: string
                }) => void
                onclose?: () => void
                width?: string | number
                height?: string | number
            }) => {
                open: () => void
                embed: (element: HTMLElement) => void
            }
        }
    }
}

function CheckoutContent() {
    const t = useTranslations('Checkout')
    const locale = useLocale()
    const router = useRouter()
    const { user, isAuthenticated, token, logout } = useAuthStore()
    const { items, removeFromCartByIds } = useCartStore()
    const searchParams = useSearchParams()
    const idsParam = searchParams.get('ids')
    const orderItemIds = idsParam ? idsParam.split(',').map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n)) : []
    const orderItems = orderItemIds.length > 0 ? items.filter((i) => orderItemIds.includes(i.id)) : items
    const hasMeshyAiModel = orderItems.some(
        (i) => parseMeshyJobIdFromFileName(i.quote?.fileName || '') != null
    )

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAddressScriptLoaded, setIsAddressScriptLoaded] = useState(false)
    const [detailAddress, setDetailAddress] = useState('')
    const [isSameAsOrderer, setIsSameAsOrderer] = useState(true)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
    
    const [formData, setFormData] = useState({
        ordererName: user?.name || '',
        ordererPhone: user?.phone || '',
        ordererEmail: user?.email || '',
        recipientName: user?.name || '',
        recipientPhone: user?.phone || '',
        shippingAddress: '',
        shippingPostalCode: '',
        customerNote: '',
    })

    const [storeSettings, setStoreSettings] = useState(DEFAULT_SHIPPING_SETTINGS)

    useEffect(() => {
        if (items.length === 0 || orderItems.length === 0) router.push('/cart')
    }, [items.length, orderItems.length, router])

    useEffect(() => {
        if (orderItems.length === 0) return
        trackConversionEventOnce('wow3d_checkout_start', {
            eventName: CHECKOUT_CONVERSION_EVENTS.START,
            category: CONVERSION_EVENT_CATEGORY.CHECKOUT,
            userId: user?.id ?? null,
            metadata: { itemCount: orderItems.length },
        })
    }, [orderItems.length, user?.id])

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

    const handleAddressSearch = () => {
        if (!window.daum?.Postcode) {
            showToast.info(t('toastAddressLoadingTitle'), t('toastAddressLoadingDesc'));
            return
        }

        new window.daum.Postcode({
            oncomplete: (data) => {
                let fullAddress = ''
                let extraAddress = ''

                if (data.addressType === 'R') {
                    if (data.bname !== '') {
                        extraAddress += data.bname
                    }
                    if (data.buildingName !== '') {
                        extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName
                    }
                    fullAddress = extraAddress !== '' ? `${data.address} (${extraAddress})` : data.address
                } else {
                    fullAddress = data.address
                }

                setFormData(prev => ({
                    ...prev,
                    shippingPostalCode: data.zonecode,
                    shippingAddress: fullAddress,
                }))
                setDetailAddress('')
            },
            onclose: () => {
                // 주소 선택 창이 닫혔을 때
            },
            width: '100%',
            height: '100%',
        }).open()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => {
            const next = { ...prev, [name]: value }
            if (isSameAsOrderer) {
                if (name === 'ordererName') next.recipientName = value;
                if (name === 'ordererPhone') next.recipientPhone = value;
            }
            return next;
        })
    }

    const checkoutReturnPath = `/checkout${idsParam ? `?ids=${idsParam}` : ''}`

    const redirectToLoginForExpiredSession = () => {
        logout({ keepCart: true })
        showToast.error(t('toastLoginExpiredTitle'), t('toastLoginExpiredDesc'))
        router.push(`/auth?return=${encodeURIComponent(checkoutReturnPath)}`)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!agreedToTerms || !agreedToPrivacy) {
            showToast.error(t('toastTermsTitle'), t('toastTermsDesc'));
            return;
        }

        if (!formData.ordererName || !formData.ordererPhone || (!isAuthenticated && !formData.ordererEmail)) {
            showToast.error(t('toastOrdererRequiredTitle'), t('toastOrdererRequiredDesc'));
            return;
        }

        if (!formData.recipientName || !formData.recipientPhone || !formData.shippingAddress) {
            showToast.error(t('toastShippingRequiredTitle'), t('toastShippingRequiredDesc'));
            return;
        }

        setIsSubmitting(true)

        try {
            if (isAuthenticated && token) {
                if (isTokenExpired(token)) {
                    redirectToLoginForExpiredSession()
                    return
                }
                const validation = await validateAuthToken(token)
                if (!validation.ok) {
                    if (validation.reason === 'network_error') {
                        showToast.error(t('toastNetworkTitle'), t('toastNetworkDesc'))
                        return
                    }
                    redirectToLoginForExpiredSession()
                    return
                }
            }

            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            const authState = useAuthStore.getState()
            if (authState.isAuthenticated && authState.token) {
                headers['Authorization'] = `Bearer ${authState.token}`
            }
            if (authState.sessionId) {
                headers['X-Session-ID'] = authState.sessionId
            }
            if (authState.user?.id) {
                headers['X-User-ID'] = String(authState.user.id)
            }

            // 브라우저 장바구니 → DB cart 동기화 (로컬만 있고 DB에 없어 주문이 거절되던 문제 방지)
            for (const item of orderItems) {
                const syncRes = await fetch('/api/cart', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        quoteId: item.quoteId,
                        quantity: item.quantity,
                        updateOnly: true,
                    }),
                })
                if (!syncRes.ok) {
                    const syncErr = await syncRes.json().catch(() => ({}))
                    throw new Error(
                        (syncErr as { error?: string })?.error ||
                            t('errCartSync')
                    )
                }
            }

            let finalNote = formData.customerNote || '';
            const ordererPrefix = t('ordererNotePrefix', { name: formData.ordererName, phone: formData.ordererPhone })
            if (!finalNote.includes(ordererPrefix) && !finalNote.includes('[주문자 정보]') && !finalNote.includes('[Buyer]')) {
                finalNote = `${ordererPrefix}\n${finalNote}`.trim();
            }

            const body: Record<string, unknown> = {
                ordererName: formData.ordererName,
                ordererPhone: formData.ordererPhone,
                recipientName: formData.recipientName,
                recipientPhone: formData.recipientPhone,
                shippingAddress: `${formData.shippingAddress} ${detailAddress}`.trim(),
                shippingPostalCode: formData.shippingPostalCode || undefined,
                customerNote: finalNote,
                cartItems: orderItems.map((item) => ({
                    quoteId: item.quoteId,
                    quantity: item.quantity,
                    totalPrice: item.quote?.totalPrice || 0,
                })),
            }
            if (!isAuthenticated && formData.ordererEmail?.trim()) body.guestEmail = formData.ordererEmail.trim()

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                if (isAuthTokenError(response.status, err) && isAuthenticated && token) {
                    redirectToLoginForExpiredSession()
                    return
                }
                throw new Error(err?.error || t('errOrderCreate'))
            }

            const result = await response.json()
            removeFromCartByIds(orderItems.map((i) => i.id))

            showToast.success(t('toastOrderOkTitle'), t('toastOrderOkDesc', { orderNumber: result.data.orderNumber }));

            const q = new URLSearchParams({
                orderId: String(result.data.orderId),
                orderNumber: result.data.orderNumber,
                totalAmount: String(result.data.totalAmount),
            })
            if (result.data.isGuest) q.set('guest', '1')
            router.push(`/order-complete?${q.toString()}`)

        } catch (error) {
            showToast.error(t('toastOrderFailTitle'), error);
        } finally {
            setIsSubmitting(false)
        }
    }

    if (items.length === 0 || orderItems.length === 0) return null

    const totalPriceKWR = Math.round(orderItems.reduce((s, i) => s + (i.quote?.totalPrice || 0) * i.quantity, 0))
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)
    
    // 배송비 로직: 관리자 설정에 따른 동적 계산
    const shippingFee = calculateShippingFee(totalPriceKWR, storeSettings);
    const finalAmount = totalPriceKWR + shippingFee;

    return (
        <>
            <Script
                src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="lazyOnload"
                onLoad={() => setIsAddressScriptLoaded(true)}
            />
            <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
                {/* Minimal Header */}
                <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl">
                    <div className="container mx-auto px-6 h-20 flex items-center">
                        <Link href="/cart">
                            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/10 rounded-full px-4 text-[10px] font-black uppercase tracking-widest gap-2">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                {t('back')}
                            </Button>
                        </Link>
                        <div className="ml-auto flex items-center gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{t('securePay')}</span>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-6 py-16">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid lg:grid-cols-[1fr_360px] gap-16">

                            {/* Delivery Form */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-12"
                            >
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-black tracking-tight leading-none uppercase">{t('title')}</h1>
                                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{t('subtitle')}</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="space-y-10">
                                        {/* 주문자 정보 */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 text-primary">
                                                <User className="w-5 h-5" />
                                                <h3 className="text-sm font-black uppercase tracking-widest">{t('ordererSection')}</h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="ordererName" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                        {t('name')} <span className="normal-case tracking-normal text-teal-400 font-bold">{t('required')}</span>
                                                    </Label>
                                                    <Input id="ordererName" name="ordererName" value={formData.ordererName} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder={t('placeholderName')} required readOnly={isAuthenticated && !!user?.name} />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="ordererPhone" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                        {t('phone')} <span className="normal-case tracking-normal text-teal-400 font-bold">{t('required')}</span>
                                                    </Label>
                                                    <Input id="ordererPhone" name="ordererPhone" value={formData.ordererPhone} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder={t('placeholderPhone')} required readOnly={isAuthenticated && !!user?.phone} />
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="ordererEmail" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5 flex-wrap">
                                                    <Mail className="w-3 h-3" /> {t('email')} <span className="normal-case tracking-normal text-teal-400 font-bold">{t('required')}</span>
                                                    {!isAuthenticated ? (
                                                        <span className="normal-case tracking-normal text-white/35 font-medium">{t('emailHintGuest')}</span>
                                                    ) : null}
                                                </Label>
                                                <Input id="ordererEmail" name="ordererEmail" type="email" value={formData.ordererEmail} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder={t('placeholderEmail')} required={!isAuthenticated} readOnly={isAuthenticated && !!user?.email} />
                                            </div>
                                            
                                            {!isAuthenticated && (
                                                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5">
                                                    <h4 className="text-[10px] font-bold text-amber-500 mb-1">{t('guestNoticeTitle')}</h4>
                                                    <ul className="text-[10px] text-white/40 list-disc pl-3 space-y-0.5 tracking-tight">
                                                        <li>{t('guestNotice1')}</li>
                                                        <li>{t('guestNotice2')}</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <Separator className="bg-white/5" />

                                        {/* 배송지 정보 */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-primary">
                                                    <MapPin className="w-5 h-5" />
                                                    <h3 className="text-sm font-black uppercase tracking-widest">{t('shippingSection')}</h3>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer" checked={isSameAsOrderer} onChange={(e) => {
                                                        setIsSameAsOrderer(e.target.checked);
                                                        if (e.target.checked) {
                                                            setFormData(p => ({ ...p, recipientName: p.ordererName, recipientPhone: p.ordererPhone }));
                                                        } else {
                                                            setFormData(p => ({ ...p, recipientName: '', recipientPhone: '' }));
                                                        }
                                                    }} />
                                                    <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">{t('sameAsOrderer')}</span>
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="recipientName" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                        {t('recipient')} <span className="normal-case tracking-normal text-teal-400 font-bold">{t('required')}</span>
                                                    </Label>
                                                    <Input id="recipientName" name="recipientName" value={formData.recipientName} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder={t('placeholderName')} required />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="recipientPhone" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                        {t('phone')} <span className="normal-case tracking-normal text-teal-400 font-bold">{t('required')}</span>
                                                    </Label>
                                                    <Input id="recipientPhone" name="recipientPhone" type="tel" value={formData.recipientPhone} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder={t('placeholderPhone')} required />
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="shippingPostalCode" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    {t('postalCode')} <span className="normal-case tracking-normal text-teal-400 font-bold">{t('required')}</span>
                                                </Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="shippingPostalCode"
                                                        name="shippingPostalCode"
                                                        value={formData.shippingPostalCode}
                                                        onChange={handleInputChange}
                                                        className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                        placeholder={t('placeholderPostal')}
                                                        readOnly
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={handleAddressSearch}
                                                        className="h-14 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold whitespace-nowrap flex items-center gap-2"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                        {t('findAddress')}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="shippingAddress" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    <MapPin className="w-3 h-3" /> {t('shippingAddress')} <span className="normal-case tracking-normal text-teal-400 font-bold">{t('required')}</span>
                                                </Label>
                                                <Input
                                                    id="shippingAddress"
                                                    name="shippingAddress"
                                                    value={formData.shippingAddress}
                                                    onChange={handleInputChange}
                                                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                    placeholder={t('placeholderAddress')}
                                                    required
                                                    readOnly
                                                />
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="detailAddress" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    {t('detailAddress')}
                                                </Label>
                                                <Input
                                                    id="detailAddress"
                                                    name="detailAddress"
                                                    value={detailAddress}
                                                    onChange={(e) => setDetailAddress(e.target.value)}
                                                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                    placeholder={t('placeholderDetail')}
                                                />
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="customerNote" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    <MessageSquare className="w-3 h-3" /> {t('noteLabel')}
                                                </Label>
                                                <textarea
                                                    id="customerNote"
                                                    name="customerNote"
                                                    value={formData.customerNote}
                                                    onChange={handleInputChange}
                                                    placeholder={t('notePlaceholder')}
                                                    className="w-full min-h-32 px-5 py-4 rounded-3xl bg-white/[0.03] border border-white/10 text-sm font-bold ring-offset-black focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-white/10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6">
                                        <div className="flex items-center gap-3 text-white/40">
                                            <CreditCard className="w-5 h-5" />
                                            <h3 className="text-sm font-black uppercase tracking-widest">{t('paymentInfo')}</h3>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center">
                                                <CreditCard className="w-5 h-5 text-white/20" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs font-bold text-white/60 block">{t('payAfterReview')}</span>
                                                <p className="text-[10px] text-white/20 font-medium uppercase tracking-widest mt-0.5">{t('payAfterReviewDesc')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>

                            {/* Order Summary Sticky Panel */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="relative"
                            >
                                <div className="sticky top-12 p-8 rounded-[40px] bg-white/[0.03] border border-white/10 ring-1 ring-white/5 space-y-8">
                                    <h2 className="text-xl font-black uppercase tracking-wide">{t('reviewTitle')}</h2>

                                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {orderItems.map((item) => (
                                            <div key={item.id} className="flex gap-4 group">
                                                <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 transition-all">
                                                    <Package className="w-5 h-5 text-white/20" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold truncate group-hover:text-primary transition-colors">{item.quote?.fileName}</div>
                                                    <div className="text-[10px] text-white/30 font-black uppercase mt-0.5">
                                                        {t('qtyLine', {
                                                            method: String(item.quote?.printMethod ?? '').toUpperCase(),
                                                            qty: item.quantity,
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="text-xs font-mono font-bold">
                                                    ₩{Math.round((item.quote?.totalPrice || 0) * item.quantity).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-white/30 tracking-widest">
                                            <span>{t('orderAmount', { count: totalItems })}</span>
                                            <span className="text-white">₩{totalPriceKWR.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase text-white/30 tracking-widest">
                                            <span>{t('baseShipping')}</span>
                                            {shippingFee === 0 ? (
                                                <span className="text-emerald-400 font-black">{formatFreeShippingBenefit(storeSettings.freeThreshold, locale)}</span>
                                            ) : (
                                                <div className="text-right">
                                                    <span className="text-white block">₩{shippingFee.toLocaleString()}</span>
                                                    <span className="text-[9px] text-white/10 mt-0.5 block italic">({formatFreeShippingHint(storeSettings.freeThreshold, locale)})</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-baseline pt-4 border-t border-white/5 mt-4">
                                            <span className="text-xs font-black uppercase tracking-widest">{t('estimatedPrepaid')}</span>
                                            <span className="text-2xl font-black text-primary">₩{finalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary/90 leading-relaxed font-medium space-y-1.5">
                                        <span className="font-bold block">{t('paymentNoticeTitle')}</span>
                                        <p>
                                            {t.rich('paymentNoticeBody', { b: (chunks) => <b>{chunks}</b> })}
                                        </p>
                                        {hasMeshyAiModel && (
                                            <p className="text-amber-100/95 bg-amber-500/15 border border-amber-400/25 rounded-lg px-2.5 py-2">
                                                {locale === 'en' ? MESHY_AI_DISCLAIMER_CHECKOUT_EN : MESHY_AI_DISCLAIMER_CHECKOUT}
                                            </p>
                                        )}
                                    </div>

                                    {/* 약관 동의 영역 */}
                                    <div className="space-y-3 pt-4 border-t border-white/5">
                                        <label className="flex items-start gap-2.5 cursor-pointer group">
                                            <input type="checkbox" className="w-[14px] h-[14px] mt-0.5 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                                            <div className="text-[11px] text-white/60 leading-tight group-hover:text-white transition-colors">
                                                <span className="text-emerald-500/80 font-bold">{t('agreeRequired')}</span> {t('agreeTerms')}
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-2.5 cursor-pointer group">
                                            <input type="checkbox" className="w-[14px] h-[14px] mt-0.5 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer" checked={agreedToPrivacy} onChange={(e) => setAgreedToPrivacy(e.target.checked)} />
                                            <div className="text-[11px] text-white/60 leading-tight group-hover:text-white transition-colors">
                                                <span className="text-emerald-500/80 font-bold">{t('agreeRequired')}</span> {t('agreePrivacy')}
                                            </div>
                                        </label>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            size="lg"
                                            className="w-full h-18 rounded-2xl bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/5 gap-3 font-black uppercase tracking-[0.2em] transition-all active:scale-95 group"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    {t('confirmOrder')}
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </Button>

                                        <div className="mt-6 flex items-center justify-center gap-1.5 text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
                                            {t('encryptionNote')}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" /></div>}>
            <CheckoutContent />
        </Suspense>
    )
}
