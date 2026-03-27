'use client'

import { useFileStore } from '@/store/useFileStore'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Loader2, Box, Layers, Ruler, Printer,
    Droplets, Zap, Save, ShoppingCart,
    ChevronRight, Wallet, Clock, ShieldCheck, AlertTriangle, FileText, List, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { showToast } from '@/lib/toast-helper'
import { roundTo100, type PriceRoundMode } from '@/lib/amount-display'
import { generateModelThumbnail } from '@/lib/modelThumbnail'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type PrintSpecs = {
    fdm?: { max: { x: number; y: number; z: number }; layerHeights?: number[]; hourlyRate?: number; layerCosts?: Record<string, number>; fdm_layer_hours_factor?: number; fdm_labor_cost_krw?: number; fdm_support_per_cm2_krw?: number }
    sla?: { max: { x: number; y: number; z: number }; layerHeights?: number[]; hourlyRate?: number; layerCosts?: Record<string, number>; sla_layer_exposure_sec?: number; sla_labor_cost_krw?: number; sla_consumables_krw?: number; sla_post_process_krw?: number }
    dlp?: { max: { x: number; y: number; z: number }; layerHeights?: number[]; hourlyRate?: number; layerCosts?: Record<string, number>; dlp_layer_exposure_sec?: number; dlp_labor_cost_krw?: number; dlp_consumables_krw?: number; dlp_post_process_krw?: number }
}

type ApiMaterial = { id: number; name: string; type: string; price_per_gram: number; price_per_ml?: number | null; density: number }

type PrintMethod = 'fdm' | 'sla' | 'dlp'

type QuotePanelProps = {
    embedded?: boolean
    initialQuote?: any
}

export default function QuotePanel({ embedded = false, initialQuote }: QuotePanelProps) {
    const { file, analysis } = useFileStore()
    const { addToCart } = useCartStore()
    const { sessionId, token, user, setSessionId } = useAuthStore()
    const [isSaving, setIsSaving] = useState(false)
    const [uploadedQuoteId, setUploadedQuoteId] = useState<number | null>(null)
    const [lastSavedConfig, setLastSavedConfig] = useState<string>('')

    // Print Method Selection
    const [printMethod, setPrintMethod] = useState<PrintMethod>('fdm')

    // Initial Data Effect
    useEffect(() => {
        if (!initialQuote) return

        if (initialQuote.print_method) setPrintMethod(initialQuote.print_method as PrintMethod)

        if (initialQuote.print_method === 'fdm') {
            if (initialQuote.fdm_material) setFdmMaterial(initialQuote.fdm_material)
            if (initialQuote.fdm_infill) setInfill(initialQuote.fdm_infill)
            if (initialQuote.fdm_layer_height) setLayerHeight(initialQuote.fdm_layer_height)
            if (initialQuote.fdm_support !== undefined) setSupportEnabled(!!initialQuote.fdm_support)
        } else {
            if (initialQuote.resin_type) setResinType(initialQuote.resin_type)
            if (initialQuote.layer_thickness) setSlaLayerHeight(initialQuote.layer_thickness)
            if (initialQuote.post_processing !== undefined) setPostProcessing(!!initialQuote.post_processing)
        }
    }, [initialQuote])

    // FDM Options (fdmMaterial = 소재 이름, API와 연동)
    const [fdmMaterial, setFdmMaterial] = useState('')
    const [infill, setInfill] = useState(20)
    const [layerHeight, setLayerHeight] = useState(0.2) // mm
    const [supportEnabled, setSupportEnabled] = useState(true)

    // SLA/DLP Options (resinType = 소재 이름)
    const [resinType, setResinType] = useState('')
    const [slaLayerHeight, setSlaLayerHeight] = useState(0.05) // mm
    const [postProcessing, setPostProcessing] = useState(false)

    const [printSpecs, setPrintSpecs] = useState<PrintSpecs | null>(null)
    const [materials, setMaterials] = useState<ApiMaterial[]>([])
    /** 자동견적 금액 100원 단위 반올림/반내림 (원단위 | 100원 반올림 | 100원 반내림) */
    const [priceRoundMode, setPriceRoundMode] = useState<PriceRoundMode>('round')

    // 소재·출력스펙 갱신 (관리자 설정/삭제 후 실시간 반영: visibility + 45초 폴링, cache: no-store)
    const refreshMaterials = useCallback(() => {
        fetch('/api/materials', { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => d?.data && setMaterials(Array.isArray(d.data) ? d.data : []))
            .catch(() => { })
    }, [])
    const refreshPrintSpecs = useCallback(() => {
        fetch('/api/print-specs', { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => d?.data && setPrintSpecs(d.data))
            .catch(() => { })
    }, [])

    useEffect(() => {
        refreshMaterials()
        refreshPrintSpecs()
    }, [refreshMaterials, refreshPrintSpecs])

    // 탭 전환 후 복귀 시·주기적: 관리자 소재 변경 실시간 반영
    useEffect(() => {
        const onVisible = () => { if (document.visibilityState === 'visible') { refreshMaterials(); refreshPrintSpecs(); } }
        document.addEventListener('visibilitychange', onVisible)
        const t = setInterval(() => { refreshMaterials(); refreshPrintSpecs(); }, 45_000)
        return () => { document.removeEventListener('visibilitychange', onVisible); clearInterval(t) }
    }, [refreshMaterials, refreshPrintSpecs])

    const fdmMaterials = materials.filter((m) => m.type === 'FDM')
    const resinMaterials = materials.filter((m) => m.type === (printMethod === 'dlp' ? 'DLP' : 'SLA'))
    useEffect(() => {
        if (fdmMaterials.length && (fdmMaterial === '' || !fdmMaterials.some((m) => m.name === fdmMaterial))) setFdmMaterial(fdmMaterials[0].name)
    }, [materials, fdmMaterial])
    useEffect(() => {
        if (resinMaterials.length && (resinType === '' || !resinMaterials.some((m) => m.name === resinType))) setResinType(resinMaterials[0].name)
    }, [materials, resinType, printMethod])
    const MAT_COLORS: Record<string, string> = { 
        PLA: 'text-teal-400', 
        ABS: 'text-amber-400', 
        PETG: 'text-indigo-400', 
        TPU: 'text-pink-400', 
        Standard: 'text-teal-400', 
        Tough: 'text-amber-400', 
        Clear: 'text-cyan-400', 
        Flexible: 'text-lime-400' 
    }

    const volumeCm3 = analysis?.volume || 0
    const surfaceAreaCm2 = analysis?.surfaceArea || 0
    const overhangAreaRaw = analysis?.overhangArea // 오버행 정보 존재 여부 확인용
    const needsSupport = overhangAreaRaw !== undefined && overhangAreaRaw > (surfaceAreaCm2 * 0.05) // 5% 이상 오버행 시 지지대 권장
    const heightMm = analysis?.boundingBox.z || 0
    const bx = analysis?.boundingBox?.x ?? 0
    const by = analysis?.boundingBox?.y ?? 0
    const bz = analysis?.boundingBox?.z ?? 0

    const overflow = useMemo(() => {
        if (!printSpecs || !analysis) return null
        const key = printMethod === 'fdm' ? 'fdm' : printMethod === 'sla' ? 'sla' : 'dlp'
        const spec = printSpecs[key]?.max
        if (!spec) return null
        const over: string[] = []
        if (bx > spec.x) over.push(`X(${bx.toFixed(0)}>${spec.x})`)
        if (by > spec.y) over.push(`Y(${by.toFixed(0)}>${spec.y})`)
        if (bz > spec.z) over.push(`Z(${bz.toFixed(0)}>${spec.z})`)
        return over.length ? over.join(', ') : null
    }, [printSpecs, printMethod, bx, by, bz, analysis])

    // 금액은 전부 원화(KRW)로 계산·저장·표시 (한국 사용자 대상)
    const defaultDetail = {
        total: 0,
        time: 0,
        numLayers: 0,
        materialAmount: 0,
        materialUnit: 'g' as 'g' | 'mL',
        materialName: '-',
        costBreakdown: { material: 0, other: 0, machine: 0, labor: 0 },
    }

    // 견적 상세: 관리자 산출 기준(printSpecs)·소재(materials) 연동
    const quoteDetail = useMemo(() => {
        if (!analysis) return defaultDetail
        const key = printMethod === 'fdm' ? 'fdm' : printMethod === 'sla' ? 'sla' : 'dlp'
        const spec = printSpecs?.[key]
        const layer = printMethod === 'fdm' ? layerHeight : slaLayerHeight
        const rateKRW = (spec?.layerCosts && spec.layerCosts[String(layer)] != null)
            ? spec.layerCosts[String(layer)]
            : (spec?.hourlyRate ?? (printMethod === 'fdm' ? 5000 : printMethod === 'dlp' ? 9000 : 8000))

        if (printMethod === 'fdm') {
            const mat = materials.find((m) => m.type === 'FDM' && m.name === fdmMaterial)
            const density = mat?.density ?? 1.24
            const pricePerGramKr = mat ? (Number(mat.price_per_gram) || 0) : 0
            const effectiveDensity = density * (infill / 100)
            const adjustedDensity = Math.max(density * 0.2, effectiveDensity)
            const weightGrams = volumeCm3 * adjustedDensity
            const materialCost = pricePerGramKr * weightGrams
            const numLayers = Math.max(1, Math.ceil(heightMm / layerHeight))

            // [개선된 알고리즘] 부피 기반 시간 산출
            // 기존 단순 높이 비례 방식은 컵과 같이 속이 빈 모델의 특성을 반영하지 못함
            // 개선: (부피 × 부피계수) + (높이 × 레이어계수)로 형상의 복잡도와 크기를 모두 반영

            // 1. 부피 시간 서브리니어 (지수 0.85: 대형도 견적 완만) 100g 근처 유지용 계수 0.0297
            const volumeTime = Math.pow(weightGrams + 1, 0.85) * 0.0297;

            // 2. 레이어 변경 및 Z축 이동 시간 (레이어당 0.002시간 = 7.2초)
            const baseLayerFactor = (spec as any)?.fdm_layer_hours_factor ?? 0.02;
            const layerTimeFactor = baseLayerFactor * 0.08; // 0.015 -> 0.08 (약 5배 상향)
            const movementTime = numLayers * layerTimeFactor;

            // 3. 표면적 시간 서브리니어 (지수 0.8: 대형에서 더 완만)
            const surfaceTime = Math.pow(surfaceAreaCm2 + 1, 0.8) * 0.00126;

            const estTimeHours = Math.max(0.5, volumeTime + movementTime + surfaceTime);

            // 비용 계산 (볼륨 디스카운트: 5h+ 10%, 10h+ 15%)
            const supportPerCm2Kr = (spec as any)?.fdm_support_per_cm2_krw ?? 26
            const supportTargetArea = (overhangAreaRaw !== undefined) ? overhangAreaRaw : (surfaceAreaCm2 * 0.3)
            const supportCost = supportEnabled ? supportPerCm2Kr * supportTargetArea : 0
            const laborKr = (spec as any)?.fdm_labor_cost_krw ?? 6500
            const laborCost = laborKr
            const effectiveRate = estTimeHours > 10 ? rateKRW * 0.7 : estTimeHours > 5 ? rateKRW * 0.8 : rateKRW
            const machineCost = estTimeHours * effectiveRate
            return {
                total: materialCost + supportCost + machineCost + laborCost,
                time: estTimeHours,
                numLayers,
                materialAmount: weightGrams,
                materialUnit: 'g' as const,
                materialName: (mat?.name ?? fdmMaterial) || '-',
                costBreakdown: { material: materialCost, other: supportCost, machine: machineCost, labor: laborCost },
            }
        } else {
            const mat = materials.find((m) => m.type === (printMethod === 'dlp' ? 'DLP' : 'SLA') && m.name === resinType)
            const pricePerMlKr = mat && mat.price_per_ml != null ? Number(mat.price_per_ml) : 0
            const volumeML = volumeCm3
            const resinCost = pricePerMlKr * volumeML
            const numLayers = Math.max(1, Math.ceil(heightMm / slaLayerHeight))
            const layerExp = printMethod === 'dlp' ? ((spec as any)?.dlp_layer_exposure_sec ?? 3) : ((spec as any)?.sla_layer_exposure_sec ?? 8)
            const mechanicDelay = 8.5
            const rawEstTimeHours = (numLayers * (layerExp + mechanicDelay)) / 3600
            // 서브리니어: 크기 커져도 견적이 과하게 뛰지 않도록 (FDM과 동일 방향)
            const estTimeHours = Math.max(0.5, Math.pow(rawEstTimeHours + 0.1, 0.9) * 0.953)
            const consKr = printMethod === 'dlp' ? ((spec as any)?.dlp_consumables_krw ?? 3900) : ((spec as any)?.sla_consumables_krw ?? 3900)
            const postKr = printMethod === 'dlp' ? ((spec as any)?.dlp_post_process_krw ?? 10400) : ((spec as any)?.sla_post_process_krw ?? 10400)
            const consumablesCost = consKr
            const postProcessCost = postProcessing ? postKr : 0
            const laborKr = printMethod === 'dlp' ? ((spec as any)?.dlp_labor_cost_krw ?? 9100) : ((spec as any)?.sla_labor_cost_krw ?? 9100)
            const laborCost = laborKr
            const effectiveRate = estTimeHours > 10 ? rateKRW * 0.7 : estTimeHours > 5 ? rateKRW * 0.8 : rateKRW
            const machineCost = estTimeHours * effectiveRate
            const otherCost = consumablesCost + postProcessCost
            return {
                total: resinCost + otherCost + machineCost + laborCost,
                time: estTimeHours,
                numLayers,
                materialAmount: volumeML,
                materialUnit: 'mL' as const,
                materialName: (mat?.name ?? resinType) || '-',
                costBreakdown: { material: resinCost, other: otherCost, machine: machineCost, labor: laborCost },
            }
        }
    }, [analysis, printMethod, fdmMaterial, infill, layerHeight, supportEnabled, resinType, slaLayerHeight, postProcessing, printSpecs, materials])

    const specKey = printMethod === 'fdm' ? 'fdm' : printMethod === 'sla' ? 'sla' : 'dlp'
    const minPriceKr = (printSpecs?.[specKey] as { minPriceKr?: number } | undefined)?.minPriceKr
    const rawRounded = roundTo100(quoteDetail.total, priceRoundMode)
    const totalPrice = minPriceKr != null && minPriceKr > 0 ? Math.max(rawRounded, minPriceKr) : rawRounded
    const estimatedTimeHours = quoteDetail.time

    const [detailModalOpen, setDetailModalOpen] = useState(false)

    const handleSaveQuote = async () => {
        if (!analysis || !file) return

        setIsSaving(true)
        try {
            // 먼저 파일을 R2에 업로드
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadHeaders: HeadersInit = {};
            if (token) {
                uploadHeaders['Authorization'] = `Bearer ${token}`;
                if (user?.id) uploadHeaders['X-User-ID'] = String(user.id);
            } else {
                uploadHeaders['X-Session-ID'] = sessionId || '';
            }

            let fileUrl: string | null = null;
            let currentQuoteId = uploadedQuoteId;

            // 이미 업로드된 파일이 없고 새로 업로드해야 하는 경우
            if (!currentQuoteId) {
                try {
                    const uploadRes = await fetch('/api/files/upload', {
                        method: 'POST',
                        headers: uploadHeaders,
                        body: uploadFormData,
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        fileUrl = uploadData.data?.fileUrl || null;
                        currentQuoteId = uploadData.data?.quoteId || null;
                        setUploadedQuoteId(currentQuoteId);
                    } else {
                        console.warn('파일 업로드 실패, fileUrl 없이 견적 저장 진행');
                    }
                } catch (uploadError) {
                    console.error('파일 업로드 중 오류:', uploadError);
                }
            } else {
                // 이미 업로드된 경우 기존 fileUrl 정보 유지 (보통 DB에 이미 있음)
            }

            const quoteData: any = {
                id: currentQuoteId,
                fileName: file.name,
                fileSize: file.size,
                fileUrl,
                volumeCm3,
                surfaceAreaCm2,
                dimensionsX: analysis.boundingBox.x,
                dimensionsY: analysis.boundingBox.y,
                dimensionsZ: analysis.boundingBox.z,
                printMethod,
                ...(printMethod === 'fdm' ? {
                    fdmMaterial: (fdmMaterial || '').toUpperCase() as any,
                    fdmInfill: infill,
                    fdmLayerHeight: layerHeight,
                    fdmSupport: supportEnabled,
                } : {
                    resinType: (resinType ? resinType.charAt(0).toUpperCase() + resinType.slice(1) : '') as any,
                    layerThickness: slaLayerHeight,
                    postProcessing,
                }),
                totalPrice,
                estimatedTimeHours,
            }

            // 설정값 변경 여부 확인용 키 생성
            const configKey = JSON.stringify({
                printMethod,
                fdmMaterial,
                infill,
                layerHeight,
                supportEnabled,
                resinType,
                slaLayerHeight,
                postProcessing,
                totalPrice
            });
            setLastSavedConfig(configKey);

            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
                if (user?.id) headers['X-User-ID'] = String(user.id)
            } else {
                headers['X-Session-ID'] = sessionId || ''
            }

            const response = await fetch('/api/quotes', {
                method: 'POST',
                headers,
                body: JSON.stringify(quoteData),
            })

            const result = await response.json().catch(() => ({}))
            if (!response.ok) {
                const msg = (result && typeof result.error === 'string') ? result.error : '견적 저장 실패'
                throw new Error(msg)
            }
            const data = result.data as { id: number; sessionId?: string }

            // data.id가 위에서 전달한 currentQuoteId와 같을 것입니다 (업데이트됨)
            const finalQuoteId = data.id || currentQuoteId;
            if (finalQuoteId) setUploadedQuoteId(finalQuoteId);

            if (data?.sessionId && !token) setSessionId(data.sessionId)
            if (token && user?.id) {
                showToast.success('견적 저장됨', '회원: 내 견적함에 저장되었습니다.');
            } else {
                showToast.info('견적 저장됨', '비회원: 이 기기에서만 보관됩니다. 주문 시 이어서 진행할 수 있습니다.');
            }
            return { ...data, id: finalQuoteId };
        } catch (error) {
            showToast.error('오류 발생', error);
            return null
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddToCart = async () => {
        if (!file || !analysis) {
            showToast.error('추가 실패', '파일 분석 정보가 없습니다.');
            return;
        }

        const configKey = JSON.stringify({
            printMethod,
            fdmMaterial,
            infill,
            layerHeight,
            supportEnabled,
            resinType,
            slaLayerHeight,
            postProcessing,
            totalPrice
        });

        let savedQuote;
        // 설정이 바뀌지 않았고 이미 저장된 ID가 있으면 재사용
        if (uploadedQuoteId && configKey === lastSavedConfig) {
            savedQuote = { id: uploadedQuoteId };
        } else {
            savedQuote = await handleSaveQuote();
        }

        if (!savedQuote) return

        try {
            const { token: t, sessionId: sid, user: u } = useAuthStore.getState()
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (t) {
                headers['Authorization'] = `Bearer ${t}`
                if (u?.id) headers['X-User-ID'] = String(u.id)
            } else {
                headers['X-Session-ID'] = sid || ''
            }

            const [response, thumbnailDataUrl] = await Promise.all([
                fetch('/api/cart', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ quoteId: savedQuote.id, quantity: 1 }),
                }),
                generateModelThumbnail(file, 256).catch(() => null),
            ])

            if (!response.ok) throw new Error('장바구니 추가 실패')

            const quoteForCart = {
                id: savedQuote.id,
                sessionId: savedQuote.sessionId,
                fileName: file.name,
                fileSize: file.size,
                volumeCm3,
                surfaceAreaCm2,
                dimensionsX: analysis.boundingBox.x,
                dimensionsY: analysis.boundingBox.y,
                dimensionsZ: analysis.boundingBox.z,
                printMethod,
                ...(printMethod === 'fdm' ? { fdmMaterial: fdmMaterial.toUpperCase() } : { resinType: resinType.charAt(0).toUpperCase() + resinType.slice(1) }),
                totalPrice,
                estimatedTimeHours,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                thumbnailDataUrl: thumbnailDataUrl || undefined,
            }
            showToast.success('장바구니 추가', '제품이 장바구니에 담겼습니다.');
            addToCart(quoteForCart as any, 1)
        } catch (error) {
            showToast.error('추가 실패', error);
        }
    }

    if (!file) return null

    return (
        <div className={`space-y-6 ${embedded ? 'pb-6' : 'pb-4'}`}>
            {/* Quick Stats Grid - 프리미엄 카드 디자인 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-2 group hover:bg-white/10 transition-all shadow-xl">
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">
                        <Box className="w-3.5 h-3.5 text-teal-400/60" /> 부피
                    </div>
                    <span className="text-2xl font-black font-mono tracking-tighter text-white">{volumeCm3.toFixed(1)} <span className="text-xs font-bold text-white/30 ml-0.5">cm³</span></span>
                </div>
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-2 group hover:bg-white/10 transition-all shadow-xl">
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">
                        <Layers className="w-3.5 h-3.5 text-indigo-400/60" /> 표면적
                    </div>
                    <span className="text-2xl font-black font-mono tracking-tighter text-white">{surfaceAreaCm2.toFixed(1)} <span className="text-xs font-bold text-white/30 ml-0.5">cm²</span></span>
                </div>
            </div>

            {/* Print Method Selection */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Printer className="w-4 h-4 text-teal-400" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">출력 방식 선택</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'fdm', icon: Printer, label: 'FDM' },
                        { id: 'sla', icon: Droplets, label: 'SLA' },
                        { id: 'dlp', icon: Zap, label: 'DLP' },
                    ].map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPrintMethod(method.id as PrintMethod)}
                            className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all relative group overflow-hidden ${printMethod === method.id
                                ? 'bg-white text-slate-950 border-white shadow-2xl shadow-white/5 scale-[1.02]'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
                                }`}
                        >
                            <method.icon className={`w-7 h-7 relative z-10 transition-transform group-hover:scale-110 ${printMethod === method.id ? 'text-slate-950' : 'text-white/40'}`} />
                            <span className={`text-[12px] font-black tracking-tight relative z-10 ${printMethod === method.id ? 'text-slate-950' : 'text-white/40'}`}>
                                {method.label}
                            </span>
                            {printMethod === method.id && (
                                <div className="absolute inset-0 bg-white/10 blur-xl animate-pulse pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {overflow && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-100">최대 출력 크기 초과</p>
                        <p className="text-xs text-amber-200/90 mt-0.5">
                            이 모델은 선택한 {printMethod.toUpperCase()} 장비의 최대 치수({overflow})를 초과합니다. 크기를 줄이거나 다른 출력 방식을 선택해 주세요.
                        </p>
                    </div>
                </div>
            )}

            <Separator className="bg-white/10" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={printMethod}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                >
                    {/* Dynamic Material Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Box className="w-4 h-4 text-teal-400" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">소재 설정</span>
                        </div>

                        <div className="grid gap-3">
                            {(printMethod === 'fdm' ? fdmMaterials : resinMaterials).length === 0 ? (
                                <p className="text-[13px] text-white/40 py-4 font-bold italic">소재가 없습니다. 관리자 설정 → 소재에서 추가하세요.</p>
                            ) : (
                                (printMethod === 'fdm' ? fdmMaterials : resinMaterials).map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => printMethod === 'fdm' ? setFdmMaterial(m.name) : setResinType(m.name)}
                                        className={`flex items-start gap-5 p-5 rounded-3xl border text-left transition-all group relative overflow-hidden ${(printMethod === 'fdm' ? fdmMaterial : resinType) === m.name
                                            ? 'bg-teal-400/10 border-teal-400/40 ring-1 ring-teal-400/20'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex-1 relative z-10">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className={`text-[15px] font-black tracking-tight ${(printMethod === 'fdm' ? fdmMaterial : resinType) === m.name ? 'text-teal-400' : 'text-white/80'} ${MAT_COLORS[m.name] || ''}`}>{m.name}</span>
                                                {(printMethod === 'fdm' ? fdmMaterial : resinType) === m.name && (
                                                    <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center">
                                                        <ChevronRight className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[12px] text-white/40 font-bold leading-relaxed">
                                                {printMethod === 'fdm' ? `g당 ₩${(m.price_per_gram || 0).toLocaleString()} · 밀도 ${m.density}` : (m.price_per_ml != null && m.price_per_ml > 0) ? `mL당 ₩${m.price_per_ml.toLocaleString()}` : 'mL당 가격 미설정 (관리자에서 설정)'}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sliders & Switches */}
                    {printMethod === 'fdm' ? (
                        <div className="space-y-8 pt-2">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Infill Density</label>
                                    <span className="font-mono text-[15px] text-teal-400 font-black">{infill}%</span>
                                </div>
                                <div className="px-1">
                                    <input
                                        type="range"
                                        min="10" max="100" step="10"
                                        value={infill}
                                        onChange={(e) => setInfill(Number(e.target.value))}
                                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-teal-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] block px-1">레이어 두께</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.1, 0.2, 0.3].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setLayerHeight(h)}
                                            className={`py-3 rounded-2xl border text-[13px] font-black transition-all ${layerHeight === h
                                                ? 'bg-white text-slate-950 border-white shadow-xl shadow-white/5'
                                                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
                                                }`}
                                        >
                                            {h}mm
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">지지 구조 (Support)</label>
                                        {needsSupport && <span className="text-[10px] text-amber-500 font-black flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 오버행 감지됨</span>}
                                    </div>
                                    <button type="button" role="switch" aria-checked={supportEnabled} onClick={() => setSupportEnabled((s) => !s)}
                                        className={`relative w-12 h-6.5 rounded-full border-2 transition-all ${supportEnabled ? 'bg-teal-400 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-white/5 border-white/20'}`}>
                                        <span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${supportEnabled ? 'left-6 bg-slate-950' : 'left-0.5 bg-white/40'}`} />
                                    </button>
                                </div>
                                {needsSupport && !supportEnabled && (
                                    <div className="p-4 rounded-2.5xl bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-[11px] text-amber-200/90 leading-relaxed font-bold break-keep">
                                            모델에 45도 이상 기울어진 오버행이 있습니다. 정상적인 출력을 위해 <span className="text-amber-400">지지 구조 활성화</span>를 권장합니다.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 pt-4">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] block px-1">레이어 두께</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.025, 0.05, 0.1].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setSlaLayerHeight(h)}
                                            className={`py-3 rounded-2xl border text-[13px] font-black transition-all ${slaLayerHeight === h
                                                ? 'bg-white text-slate-950 border-white shadow-xl shadow-white/5'
                                                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
                                                }`}
                                        >
                                            {h}mm
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">후가공 (Post-processing)</label>
                                <button type="button" role="switch" aria-checked={postProcessing} onClick={() => setPostProcessing((p) => !p)}
                                    className={`relative w-12 h-6.5 rounded-full border-2 transition-all ${postProcessing ? 'bg-indigo-500 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-white/5 border-white/20'}`}>
                                    <span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${postProcessing ? 'left-6 bg-slate-950' : 'left-0.5 bg-white/40'}`} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* 상세보기 모달 - 슬레이트 톤으로 가독성 */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-md sm:max-w-lg bg-[#111827] border-white/10 text-white shadow-2xl backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-3 text-xl font-black">
                            <FileText className="w-6 h-6 text-teal-400" /> <span className="tracking-tight">견적 산출 상세</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-2">
                        <section>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">입력 설정</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-slate-400">출력 방식</div>
                                <div className="font-medium text-slate-100">{printMethod.toUpperCase()}</div>
                                <div className="text-slate-400">소재</div>
                                <div className="font-medium text-slate-100">{printMethod === 'fdm' ? fdmMaterial : resinType}</div>
                                <div className="text-slate-400">레이어 두께</div>
                                <div className="font-medium text-slate-100">{(printMethod === 'fdm' ? layerHeight : slaLayerHeight)} mm</div>
                                {printMethod === 'fdm' ? (
                                    <>
                                        <div className="text-slate-400">Infill</div>
                                        <div className="font-medium text-slate-100">{infill}%</div>
                                        <div className="text-slate-400">지지 구조</div>
                                        <div className="font-medium text-slate-100">{supportEnabled ? '사용' : '미사용'}</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-slate-400">후가공</div>
                                        <div className="font-medium text-slate-100">{postProcessing ? '적용' : '미적용'}</div>
                                    </>
                                )}
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">모델 정보</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-slate-400">부피</div>
                                <div className="font-mono text-slate-100">{volumeCm3.toFixed(1)} cm³</div>
                                <div className="text-slate-400">표면적</div>
                                <div className="font-mono text-slate-100">{surfaceAreaCm2.toFixed(1)} cm²</div>
                                <div className="text-slate-400">치수 (X×Y×Z)</div>
                                <div className="font-mono text-slate-100">{bx.toFixed(1)} × {by.toFixed(1)} × {bz.toFixed(1)} mm</div>
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">산출 결과</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-slate-400">소요 시간</div>
                                <div className="font-bold text-emerald-400">{quoteDetail.time.toFixed(2)} h</div>
                                <div className="text-slate-400">소재 소요량</div>
                                <div className="font-mono font-medium text-slate-100">{quoteDetail.materialAmount.toFixed(1)} {quoteDetail.materialUnit}</div>
                                <div className="text-slate-400">출력 레이어 수</div>
                                <div className="font-mono font-bold text-slate-100">{quoteDetail.numLayers.toLocaleString()} layers</div>
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">비용 구분</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-400">재료비</span><span className="font-mono text-slate-100">₩{Math.round(quoteDetail.costBreakdown.material).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">장비(인쇄)비</span><span className="font-mono text-slate-100">₩{Math.round(quoteDetail.costBreakdown.machine).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">기타</span><span className="font-mono text-slate-100">₩{Math.round(quoteDetail.costBreakdown.other).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">인건비</span><span className="font-mono text-slate-100">₩{Math.round(quoteDetail.costBreakdown.labor).toLocaleString()}</span></div>
                                <div className="flex justify-between pt-2 mt-2 border-t border-slate-600/50 font-bold">
                                    <span className="text-slate-100">총 견적</span>
                                    <span className="text-primary">₩{Math.round(totalPrice).toLocaleString()}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Price & Actions - 프리미엄 액션 보드 */}
            <div className={`${embedded ? 'p-6' : 'p-8'} rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8 relative overflow-hidden shadow-2xl`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                <div className="flex items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] font-black text-white/40 uppercase tracking-[0.25em] mb-2">
                            <Wallet className="w-3.5 h-3.5" /> 실시간 예상 견적
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`font-black text-white tracking-tighter ${embedded ? 'text-3xl' : 'text-3xl sm:text-4xl'}`}>₩{Math.round(totalPrice).toLocaleString()}</span>
                            <span className="text-sm font-black text-white/30 uppercase tracking-widest">KRW</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-[11px] font-black text-white/40 uppercase tracking-[0.25em] mb-2">
                            <Clock className="w-3.5 h-3.5" /> 제작 예상 기간
                        </div>
                        <span className="text-[17px] font-black text-teal-400 tracking-tight">~{estimatedTimeHours < 1 ? (Math.ceil(estimatedTimeHours * 60) + '분') : (estimatedTimeHours >= 24 ? (Math.ceil(estimatedTimeHours / 24) + '일') : (Math.ceil(estimatedTimeHours) + 'H'))}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <button type="button" onClick={() => setDetailModalOpen(true)} className="flex items-center gap-2 text-[12px] text-teal-400 hover:text-teal-300 font-black tracking-tight transition-all active:scale-95">
                        <FileText className="w-4 h-4" /> 산출 내역 상세 보기
                    </button>
                    
                    <div className={`grid gap-3 ${embedded ? 'grid-cols-2' : 'grid-cols-[1fr_2fr]'}`}>
                        <Button disabled={!analysis || isSaving} variant="ghost" size={embedded ? 'sm' : 'lg'} className={`rounded-2xl border border-white/10 hover:bg-white/10 text-white transition-all active:scale-95 ${embedded ? 'h-12' : 'h-14 sm:h-16'}`} onClick={handleSaveQuote}>
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        </Button>
                        <Button disabled={!analysis || isSaving} size={embedded ? 'sm' : 'lg'} className={`rounded-2xl bg-white text-slate-950 hover:bg-white/90 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)] ${embedded ? 'h-12 text-sm font-black' : 'h-14 sm:h-16 text-[15px] font-black uppercase tracking-widest'}`} onClick={handleAddToCart}>
                            <ShoppingCart className={embedded ? 'w-4 h-4 text-slate-950' : 'w-5 h-5 text-slate-950'} /> 장바구니에 담기
                        </Button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link href="/quotes" className="text-[12px] text-white/40 hover:text-teal-400 font-bold flex items-center gap-2 transition-colors"><List className="w-4 h-4" /> 나의 견적 보관함</Link>
                    <span className="text-white/10 font-thin">|</span>
                    <Link href="/cart" className="text-[12px] text-white/40 hover:text-teal-400 font-bold flex items-center gap-2 transition-colors"><ArrowRight className="w-4 h-4" /> 장바구니로 바로가기</Link>
                </div>
                {!embedded && (
                    <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 font-black uppercase tracking-[0.3em] pt-4">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-400/50 shadow-[0_0_10px_rgba(20,184,166,0.3)]" /> WOW3D Industrial Security
                    </div>
                )}
            </div>
        </div>
    )
}
