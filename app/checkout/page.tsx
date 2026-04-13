'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, Package, CreditCard, ChevronRight, MapPin, Phone, User, MessageSquare, ShieldCheck, Mail, Search } from 'lucide-react'
import Link from 'next/link'
import { showToast } from '@/lib/toast-helper'
import { motion } from 'framer-motion'
import Script from 'next/script'

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
    const router = useRouter()
    const { user, isAuthenticated, token, sessionId } = useAuthStore()
    const { items, removeFromCartByIds } = useCartStore()
    const searchParams = useSearchParams()
    const idsParam = searchParams.get('ids')
    const orderItemIds = idsParam ? idsParam.split(',').map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n)) : []
    const orderItems = orderItemIds.length > 0 ? items.filter((i) => orderItemIds.includes(i.id)) : items

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

    const [storeSettings, setStoreSettings] = useState<{ baseFee: number, freeThreshold: number }>({ baseFee: 3000, freeThreshold: 50000 })

    useEffect(() => {
        if (items.length === 0 || orderItems.length === 0) router.push('/cart')
    }, [items.length, orderItems.length, router])

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings')
                if (!res.ok) return
                const json = await res.json()
                if (json.success && Array.isArray(json.data)) {
                    let baseFee = 3000, freeThreshold = 50000
                    json.data.forEach((s: any) => {
                        if (s.setting_key === 'shipping_base_fee') baseFee = Number(s.setting_value) || 3000
                        if (s.setting_key === 'shipping_free_threshold') freeThreshold = Number(s.setting_value) || 50000
                    })
                    setStoreSettings({ baseFee, freeThreshold })
                }
            } catch (e) {
                console.error('Failed to load store settings', e)
            }
        }
        fetchSettings()
    }, [])

    const handleAddressSearch = () => {
        if (!window.daum?.Postcode) {
            showToast.info('로딩 중', '주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!agreedToTerms || !agreedToPrivacy) {
            showToast.error('약관 동의 확인', '필수 약관에 모두 동의해 주세요.');
            return;
        }

        if (!formData.ordererName || !formData.ordererPhone || (!isAuthenticated && !formData.ordererEmail)) {
            showToast.error('입력 확인', '주문자 필수 정보를 모두 입력해 주세요.');
            return;
        }

        if (!formData.recipientName || !formData.recipientPhone || !formData.shippingAddress) {
            showToast.error('입력 확인', '배송을 위한 필수 정보를 모두 입력해 주세요.');
            return;
        }

        setIsSubmitting(true)

        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (isAuthenticated && token) headers['Authorization'] = `Bearer ${token}`
            else if (sessionId) headers['X-Session-ID'] = sessionId

            let finalNote = formData.customerNote || '';
            if (!finalNote.includes('[주문자 정보]')) {
                finalNote = `[주문자 정보] 이름: ${formData.ordererName} / 연락처: ${formData.ordererPhone}\n${finalNote}`.trim();
            }

            const body: Record<string, unknown> = {
                recipientName: formData.recipientName,
                recipientPhone: formData.recipientPhone,
                shippingAddress: formData.shippingAddress,
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
                throw new Error(err?.error || '주문 생성 실패')
            }

            const result = await response.json()
            removeFromCartByIds(orderItems.map((i) => i.id))

            showToast.success('주문 성공', `주문이 접수되었습니다 (${result.data.orderNumber})`);

            const q = new URLSearchParams({
                orderId: String(result.data.orderId),
                orderNumber: result.data.orderNumber,
                totalAmount: String(result.data.totalAmount),
            })
            if (result.data.isGuest) q.set('guest', '1')
            router.push(`/order-complete?${q.toString()}`)

        } catch (error) {
            showToast.error('주문 실패', error);
        } finally {
            setIsSubmitting(false)
        }
    }

    if (items.length === 0 || orderItems.length === 0) return null

    const totalPriceKWR = Math.round(orderItems.reduce((s, i) => s + (i.quote?.totalPrice || 0) * i.quantity, 0))
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)
    
    // 배송비 로직: 관리자 설정에 따른 동적 계산
    const shippingFee = totalPriceKWR >= storeSettings.freeThreshold ? 0 : storeSettings.baseFee;
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
                                돌아가기
                            </Button>
                        </Link>
                        <div className="ml-auto flex items-center gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">안전 결제</span>
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
                                    <h1 className="text-4xl font-black tracking-tight leading-none uppercase">주문 정보</h1>
                                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">배송에 필요한 정보를 입력해 주세요</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="space-y-10">
                                        {/* 주문자 정보 */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 text-primary">
                                                <User className="w-5 h-5" />
                                                <h3 className="text-sm font-black uppercase tracking-widest">주문자 정보</h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="ordererName" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">이름</Label>
                                                    <Input id="ordererName" name="ordererName" value={formData.ordererName} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder="홍길동" required readOnly={isAuthenticated && !!user?.name} />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="ordererPhone" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">연락처</Label>
                                                    <Input id="ordererPhone" name="ordererPhone" value={formData.ordererPhone} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder="010-0000-0000" required readOnly={isAuthenticated && !!user?.phone} />
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="ordererEmail" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5"><Mail className="w-3 h-3" /> 이메일 {isAuthenticated ? '' : '(주문/결제 안내용 필수)'}</Label>
                                                <Input id="ordererEmail" name="ordererEmail" type="email" value={formData.ordererEmail} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder="order@example.com" required={!isAuthenticated} readOnly={isAuthenticated && !!user?.email} />
                                            </div>
                                            
                                            {!isAuthenticated && (
                                                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5">
                                                    <h4 className="text-[10px] font-bold text-amber-500 mb-1">⚡ 비회원 주문 안내</h4>
                                                    <ul className="text-[10px] text-white/40 list-disc pl-3 space-y-0.5 tracking-tight">
                                                        <li>입력하신 이메일로 관리자 검토 후 최종 결제 링크가 포함된 안내문이 발송됩니다.</li>
                                                        <li>포인트 적립 및 회원 전용 혜택은 적용되지 않습니다.</li>
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
                                                    <h3 className="text-sm font-black uppercase tracking-widest">배송지 정보</h3>
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
                                                    <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">주문자 정보와 동일합니다</span>
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="recipientName" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">받는 사람</Label>
                                                    <Input id="recipientName" name="recipientName" value={formData.recipientName} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder="홍길동" required />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="recipientPhone" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">연락처</Label>
                                                    <Input id="recipientPhone" name="recipientPhone" type="tel" value={formData.recipientPhone} onChange={handleInputChange} className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary px-5 font-bold" placeholder="010-0000-0000" required />
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="shippingPostalCode" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    우편번호
                                                </Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="shippingPostalCode"
                                                        name="shippingPostalCode"
                                                        value={formData.shippingPostalCode}
                                                        onChange={handleInputChange}
                                                        className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                        placeholder="00000"
                                                        readOnly
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={handleAddressSearch}
                                                        className="h-14 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold whitespace-nowrap flex items-center gap-2"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                        주소 찾기
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="shippingAddress" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    <MapPin className="w-3 h-3" /> 배송 주소
                                                </Label>
                                                <Input
                                                    id="shippingAddress"
                                                    name="shippingAddress"
                                                    value={formData.shippingAddress}
                                                    onChange={handleInputChange}
                                                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                    placeholder="주소 찾기를 클릭하세요"
                                                    required
                                                    readOnly
                                                />
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="detailAddress" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    상세 주소
                                                </Label>
                                                <Input
                                                    id="detailAddress"
                                                    name="detailAddress"
                                                    value={detailAddress}
                                                    onChange={(e) => {
                                                        setDetailAddress(e.target.value)
                                                        const fullAddress = formData.shippingAddress
                                                            ? `${formData.shippingAddress} ${e.target.value}`.trim()
                                                            : e.target.value
                                                        setFormData(prev => ({ ...prev, shippingAddress: fullAddress }))
                                                    }}
                                                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-5 font-bold"
                                                    placeholder="동/호수, 상세주소를 입력하세요"
                                                />
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="customerNote" className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                                                    <MessageSquare className="w-3 h-3" /> 배송 시 요청사항 (선택)
                                                </Label>
                                                <textarea
                                                    id="customerNote"
                                                    name="customerNote"
                                                    value={formData.customerNote}
                                                    onChange={handleInputChange}
                                                    placeholder="배송사에 전달할 요청 사항을 입력하세요..."
                                                    className="w-full min-h-32 px-5 py-4 rounded-3xl bg-white/[0.03] border border-white/10 text-sm font-bold ring-offset-black focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-white/10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6">
                                        <div className="flex items-center gap-3 text-white/40">
                                            <CreditCard className="w-5 h-5" />
                                            <h3 className="text-sm font-black uppercase tracking-widest">결제 안내</h3>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center">
                                                <CreditCard className="w-5 h-5 text-white/20" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs font-bold text-white/60 block">견적 검토 후 결제</span>
                                                <p className="text-[10px] text-white/20 font-medium uppercase tracking-widest mt-0.5">기술 검토 후 최종 견적·결제를 안내해 드립니다</p>
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
                                    <h2 className="text-xl font-black uppercase tracking-wide">주문 검토</h2>

                                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {orderItems.map((item) => (
                                            <div key={item.id} className="flex gap-4 group">
                                                <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 transition-all">
                                                    <Package className="w-5 h-5 text-white/20" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold truncate group-hover:text-primary transition-colors">{item.quote?.fileName}</div>
                                                    <div className="text-[10px] text-white/30 font-black uppercase mt-0.5">{item.quote?.printMethod.toUpperCase()} • 수량 {item.quantity}</div>
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
                                            <span>주문 금액 ({totalItems}개)</span>
                                            <span className="text-white">₩{totalPriceKWR.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase text-white/30 tracking-widest">
                                            <span>기본 배송비</span>
                                            {shippingFee === 0 ? (
                                                <span className="text-emerald-400">무료 혜택 ({(storeSettings.freeThreshold / 10000)}만원↑)</span>
                                            ) : (
                                                <span className="text-white">₩{shippingFee.toLocaleString()}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-baseline pt-4 border-t border-white/5 mt-4">
                                            <span className="text-xs font-black uppercase tracking-widest">선결제 예상 금액</span>
                                            <span className="text-2xl font-black text-primary">₩{finalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary/90 leading-relaxed font-medium">
                                        <span className="font-bold block mb-0.5">※ 결제 안내</span>
                                        현재 주문 단계에서는 결제가 이루어지지 않습니다. 전문가의 모델링 검토 및 시뮬레이션을 통해 산출된 <b>최종 견적서(배송비/옵션 확정)</b>를 메일로 받으신 후 실제 결제가 진행됩니다.
                                    </div>

                                    {/* 약관 동의 영역 */}
                                    <div className="space-y-3 pt-4 border-t border-white/5">
                                        <label className="flex items-start gap-2.5 cursor-pointer group">
                                            <input type="checkbox" className="w-[14px] h-[14px] mt-0.5 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                                            <div className="text-[11px] text-white/60 leading-tight group-hover:text-white transition-colors">
                                                <span className="text-emerald-500/80 font-bold">[필수]</span> 구매(제작) 조건 및 취소/환불 규정에 동의합니다.
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-2.5 cursor-pointer group">
                                            <input type="checkbox" className="w-[14px] h-[14px] mt-0.5 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer" checked={agreedToPrivacy} onChange={(e) => setAgreedToPrivacy(e.target.checked)} />
                                            <div className="text-[11px] text-white/60 leading-tight group-hover:text-white transition-colors">
                                                <span className="text-emerald-500/80 font-bold">[필수]</span> 개인정보 수집 및 제3자 제공에 동의합니다.
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
                                                    주문 확정
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </Button>

                                        <div className="mt-6 flex items-center justify-center gap-1.5 text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
                                            엔터프라이즈급 데이터 암호화
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
