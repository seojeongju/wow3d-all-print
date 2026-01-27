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
import { useToast } from '@/hooks/use-toast'
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
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false)

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
    const [supportEnabled, setSupportEnabled] = useState(false)

    // SLA/DLP Options (resinType = 소재 이름)
    const [resinType, setResinType] = useState('')
    const [slaLayerHeight, setSlaLayerHeight] = useState(0.05) // mm
    const [postProcessing, setPostProcessing] = useState(false)

    const [printSpecs, setPrintSpecs] = useState<PrintSpecs | null>(null)
    const [materials, setMaterials] = useState<ApiMaterial[]>([])

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
    const MAT_COLORS: Record<string, string> = { PLA: 'text-emerald-400', ABS: 'text-amber-400', PETG: 'text-blue-400', TPU: 'text-pink-400', Standard: 'text-sky-400', Tough: 'text-amber-400', Clear: 'text-cyan-400', Flexible: 'text-lime-400' }

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

    // 레이어별 시간당 비용(원) → 견적식 내 machineRate 단위 변환 (표시 시 *1300 KRW)
    const KRW_TO_UNIT = 1300

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
        const machineRate = rateKRW / KRW_TO_UNIT

        if (printMethod === 'fdm') {
            const mat = materials.find((m) => m.type === 'FDM' && m.name === fdmMaterial)
            const density = mat?.density ?? 1.24
            const pricePerGramKr = mat ? (Number(mat.price_per_gram) || 0) : 0
            const effectiveDensity = density * (infill / 100)
            const adjustedDensity = Math.max(density * 0.2, effectiveDensity)
            const weightGrams = volumeCm3 * adjustedDensity
            const materialCost = (pricePerGramKr / KRW_TO_UNIT) * weightGrams
            const numLayers = Math.max(1, Math.ceil(heightMm / layerHeight))

            // [개선된 알고리즘] 부피 기반 시간 산출
            // 기존 단순 높이 비례 방식은 컵과 같이 속이 빈 모델의 특성을 반영하지 못함
            // 개선: (부피 × 부피계수) + (높이 × 레이어계수)로 형상의 복잡도와 크기를 모두 반영

            // 1. 부피에 따른 기본 출력 시간 (cm³ 당 약 3~6분 소요 가정, 인필 반영)
            // adjustedDensity는 density * (infill/100)와 최소밀도 보정이 적용된 값
            // 즉, 재료 소모량(g)에 비례하여 시간 산출 (대략 10g당 1시간)
            const materialTimeFactor = 0.013; // 1g 출력에 약 0.8분 (재튜닝)
            const volumeTime = weightGrams * materialTimeFactor;

            // 2. 레이어 변경 및 Z축 이동 시간 (레이어당 0.002시간 = 7.2초)
            const baseLayerFactor = (spec as any)?.fdm_layer_hours_factor ?? 0.02;
            const layerTimeFactor = baseLayerFactor * 0.015;
            const movementTime = numLayers * layerTimeFactor;

            // 3. 표면적에 따른 외벽 출력 시간 보정 (cm² 당 0.001시간으로 하향 조정)
            const surfaceTime = surfaceAreaCm2 * 0.0005;

            const estTimeHours = Math.max(0.5, volumeTime + movementTime + surfaceTime);

            // 비용 계산
            const supportPerCm2Kr = (spec as any)?.fdm_support_per_cm2_krw ?? 26
            // [개선된 알고리즘] 지지대 비용 (오버행 면적 기반)
            // overhangArea 정보가 있으면(0 포함) 사용하고, 없으면(undefined) 전체 표면적의 30%를 추정
            const supportTargetArea = (overhangAreaRaw !== undefined) ? overhangAreaRaw : (surfaceAreaCm2 * 0.3)
            const supportCost = supportEnabled ? (supportPerCm2Kr / KRW_TO_UNIT) * supportTargetArea : 0
            const laborKr = (spec as any)?.fdm_labor_cost_krw ?? 6500
            const laborCost = laborKr / KRW_TO_UNIT
            const machineCost = estTimeHours * machineRate
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
            const resinCost = (pricePerMlKr / KRW_TO_UNIT) * volumeML
            const numLayers = Math.max(1, Math.ceil(heightMm / slaLayerHeight))
            const layerExp = printMethod === 'dlp' ? ((spec as any)?.dlp_layer_exposure_sec ?? 3) : ((spec as any)?.sla_layer_exposure_sec ?? 8)
            // [개선] 기구 동작 시간(Lift & Retract) 추가 (약 8~9초)
            const mechanicDelay = 8.5;
            const estTimeHours = (numLayers * (layerExp + mechanicDelay)) / 3600
            const consKr = printMethod === 'dlp' ? ((spec as any)?.dlp_consumables_krw ?? 3900) : ((spec as any)?.sla_consumables_krw ?? 3900)
            const postKr = printMethod === 'dlp' ? ((spec as any)?.dlp_post_process_krw ?? 10400) : ((spec as any)?.sla_post_process_krw ?? 10400)
            const consumablesCost = consKr / KRW_TO_UNIT
            const postProcessCost = postProcessing ? postKr / KRW_TO_UNIT : 0
            const laborKr = printMethod === 'dlp' ? ((spec as any)?.dlp_labor_cost_krw ?? 9100) : ((spec as any)?.sla_labor_cost_krw ?? 9100)
            const laborCost = laborKr / KRW_TO_UNIT
            const machineCost = estTimeHours * machineRate
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

    const totalPrice = quoteDetail.total
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
            let uploadedQuoteId: number | null = null;

            try {
                const uploadRes = await fetch('/api/files/upload', {
                    method: 'POST',
                    headers: uploadHeaders,
                    body: uploadFormData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    fileUrl = uploadData.data?.fileUrl || null;
                    uploadedQuoteId = uploadData.data?.quoteId || null;
                } else {
                    console.warn('파일 업로드 실패, fileUrl 없이 견적 저장 진행');
                }
            } catch (uploadError) {
                console.error('파일 업로드 중 오류:', uploadError);
                // 업로드 실패해도 견적 저장은 진행 (fileUrl 없이)
            }

            const quoteData = {
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

            // 업로드한 파일이 있지만 quoteId가 다른 경우, file_url 업데이트
            if (fileUrl && uploadedQuoteId && data.id && uploadedQuoteId !== data.id) {
                try {
                    const updateHeaders: HeadersInit = { 'Content-Type': 'application/json' };
                    if (token) {
                        updateHeaders['Authorization'] = `Bearer ${token}`;
                        if (user?.id) updateHeaders['X-User-ID'] = String(user.id);
                    } else {
                        updateHeaders['X-Session-ID'] = sessionId || '';
                    }
                    // R2 key를 새 quoteId로 업데이트 (선택사항 - 기존 파일도 유지 가능)
                    // 일단 기존 파일을 사용하도록 함
                } catch (e) {
                    console.error('file_url 업데이트 실패:', e);
                }
            }

            if (data?.sessionId && !token) setSessionId(data.sessionId)
            if (token && user?.id) {
                toast({ title: '✅ 견적 저장됨', description: '회원: 내 견적함에 저장되었습니다' })
            } else {
                toast({ title: '✅ 견적 저장됨', description: '비회원: 이 기기에서만 보관됩니다. 주문 시 이어서 진행할 수 있습니다.' })
            }
            return data
        } catch (error) {
            toast({
                title: '❌ 오류 발생',
                description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다',
                variant: 'destructive',
            })
            return null
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddToCart = async () => {
        if (!analysis || !file) return
        const savedQuote = await handleSaveQuote()
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
            toast({ title: '🛒 장바구니 추가', description: '제품이 장바구니에 담겼습니다' })
            addToCart(quoteForCart as any, 1)
        } catch (error) {
            toast({
                title: '❌ 추가 실패',
                description: error instanceof Error ? error.message : '오류가 발생했습니다',
                variant: 'destructive',
            })
        }
    }

    if (!file) return null

    return (
        <div className={`space-y-6 ${embedded ? 'pb-6' : 'pb-4'}`}>
            {/* Quick Stats Grid - 카드·라벨 대비 개선 */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-600/40 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        <Box className="w-3 h-3 text-slate-500" /> 부피
                    </div>
                    <span className="text-lg font-bold font-mono tracking-tight text-slate-50">{volumeCm3.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">cm³</span></span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-600/40 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        <Layers className="w-3 h-3 text-slate-500" /> 표면적
                    </div>
                    <span className="text-lg font-bold font-mono tracking-tight text-slate-50">{surfaceAreaCm2.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">cm²</span></span>
                </div>
            </div>

            {/* Print Method Selection */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Printer className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">출력 방식 선택</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'fdm', icon: Printer, label: 'FDM' },
                        { id: 'sla', icon: Droplets, label: 'SLA' },
                        { id: 'dlp', icon: Zap, label: 'DLP' },
                    ].map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPrintMethod(method.id as PrintMethod)}
                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${printMethod === method.id
                                ? 'bg-primary border-primary shadow-lg shadow-primary/20'
                                : 'bg-slate-800/70 border-slate-600/40 hover:border-slate-500 text-slate-300'
                                }`}
                        >
                            <method.icon className={`w-6 h-6 ${printMethod === method.id ? 'text-white' : 'text-slate-400'}`} />
                            <span className={`text-[10px] font-black tracking-tighter ${printMethod === method.id ? 'text-white' : 'text-slate-400'}`}>
                                {method.label}
                            </span>
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

            <Separator className="bg-slate-600/40" />

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
                            <Box className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">소재 설정</span>
                        </div>

                        <div className="grid gap-2">
                            {(printMethod === 'fdm' ? fdmMaterials : resinMaterials).length === 0 ? (
                                <p className="text-xs text-slate-400 py-2">소재가 없습니다. 관리자 설정 → 소재에서 추가하세요.</p>
                            ) : (
                                (printMethod === 'fdm' ? fdmMaterials : resinMaterials).map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => printMethod === 'fdm' ? setFdmMaterial(m.name) : setResinType(m.name)}
                                        className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${(printMethod === 'fdm' ? fdmMaterial : resinType) === m.name
                                            ? 'bg-primary/15 border-primary/60 ring-1 ring-primary/30'
                                            : 'bg-slate-800/60 border-slate-600/40 hover:bg-slate-700/50 hover:border-slate-500/50'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-bold text-slate-100 ${MAT_COLORS[m.name] || ''}`}>{m.name}</span>
                                                {(printMethod === 'fdm' ? fdmMaterial : resinType) === m.name && (
                                                    <ChevronRight className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
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
                        <div className="space-y-6 pt-2">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Infill Density</label>
                                    <span className="font-mono text-sm text-primary font-bold">{infill}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="10" max="100" step="10"
                                    value={infill}
                                    onChange={(e) => setInfill(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-600/50 rounded-full appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block px-1">레이어 두께</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.1, 0.2, 0.3].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setLayerHeight(h)}
                                            className={`py-2.5 rounded-xl border text-[11px] font-bold transition-all ${layerHeight === h
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-slate-800/60 border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {h}mm
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex flex-col gap-0.5">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">지지 구조</label>
                                        {needsSupport && <span className="text-[9px] text-amber-500 font-medium">⚠️ 오버행 감지됨</span>}
                                    </div>
                                    <button type="button" role="switch" aria-checked={supportEnabled} onClick={() => setSupportEnabled((s) => !s)}
                                        className={`relative w-11 h-6 rounded-full border transition-colors ${supportEnabled ? 'bg-primary border-primary' : 'bg-slate-700 border-slate-600'}`}>
                                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${supportEnabled ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                                {needsSupport && !supportEnabled && (
                                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-[10px] text-amber-200/90 leading-relaxed">
                                            모델에 45도 이상 기울어진 오버행이 있습니다. 정상적인 출력을 위해 <b>지지 구조를 활성화</b>하는 것이 좋습니다.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 pt-4">
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block px-1">레이어 두께</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.025, 0.05, 0.1].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setSlaLayerHeight(h)}
                                            className={`py-2.5 rounded-xl border text-[11px] font-bold transition-all ${slaLayerHeight === h
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-slate-800/60 border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {h}mm
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">후가공</label>
                                <button type="button" role="switch" aria-checked={postProcessing} onClick={() => setPostProcessing((p) => !p)}
                                    className={`relative w-11 h-6 rounded-full border transition-colors ${postProcessing ? 'bg-primary border-primary' : 'bg-slate-700 border-slate-600'}`}>
                                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${postProcessing ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* 상세보기 모달 - 슬레이트 톤으로 가독성 */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-md sm:max-w-lg bg-slate-900 border-slate-600/60 text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-slate-50 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> 견적 상세
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
                                <div className="flex justify-between"><span className="text-slate-400">재료비</span><span className="font-mono text-slate-100">₩{Math.round(quoteDetail.costBreakdown.material * KRW_TO_UNIT).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">장비(인쇄)비</span><span className="font-mono text-slate-100">₩{Math.round(quoteDetail.costBreakdown.machine * KRW_TO_UNIT).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">기타</span><span className="font-mono text-slate-100">₩{Math.round(quoteDetail.costBreakdown.other * KRW_TO_UNIT).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">인건비</span><span className="font-mono text-slate-100">₩{Math.round(quoteDetail.costBreakdown.labor * KRW_TO_UNIT).toLocaleString()}</span></div>
                                <div className="flex justify-between pt-2 mt-2 border-t border-slate-600/50 font-bold">
                                    <span className="text-slate-100">총 견적</span>
                                    <span className="text-primary">₩{Math.round(totalPrice * KRW_TO_UNIT).toLocaleString()}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Price & Actions - 카드·라벨 가독성 */}
            <div className={`${embedded ? 'p-4' : 'p-5'} rounded-2xl bg-slate-800/80 border border-slate-600/40 space-y-4`}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">
                            <Wallet className="w-3 h-3" /> 예상 견적
                        </div>
                        <span className={`font-black text-slate-50 ${embedded ? 'text-2xl' : 'text-2xl sm:text-3xl'}`}>₩{Math.round(totalPrice * 1300).toLocaleString()}</span>
                        <span className="text-xs text-slate-400 font-medium ml-1">KRW</span>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">
                            <Clock className="w-3 h-3" /> 예상 소요
                        </div>
                        <span className="text-sm font-bold text-emerald-400">~{estimatedTimeHours < 1 ? (Math.ceil(estimatedTimeHours * 60) + '분') : (estimatedTimeHours >= 24 ? (Math.ceil(estimatedTimeHours / 24) + '일') : (Math.ceil(estimatedTimeHours) + 'h'))}</span>
                    </div>
                </div>
                <button type="button" onClick={() => setDetailModalOpen(true)} className="flex items-center gap-2 text-[11px] text-primary hover:text-primary/90 font-medium">
                    <FileText className="w-3.5 h-3.5" /> 상세보기
                </button>
                <div className={`grid gap-2 ${embedded ? 'grid-cols-2' : 'grid-cols-[1fr_1.5fr] sm:grid-cols-[1fr_2fr]'}`}>
                    <Button disabled={!analysis || isSaving} variant="ghost" size={embedded ? 'sm' : 'lg'} className={`rounded-xl border border-slate-600/50 hover:bg-slate-700/50 text-slate-200 text-xs font-bold ${embedded ? 'h-11' : 'h-12 sm:h-14 rounded-2xl'}`} onClick={handleSaveQuote}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button disabled={!analysis || isSaving} size={embedded ? 'sm' : 'lg'} className={`rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-2 ${embedded ? 'h-11' : 'h-12 sm:h-14 rounded-2xl font-black uppercase tracking-widest'}`} onClick={handleAddToCart}>
                        <ShoppingCart className={embedded ? 'w-4 h-4' : 'w-5 h-5'} /> 장바구니에 담기
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/quotes" className="text-[11px] text-slate-400 hover:text-primary font-medium flex items-center gap-1.5"><List className="w-3.5 h-3.5" /> 저장 목록</Link>
                    <span className="text-slate-600">|</span>
                    <Link href="/cart" className="text-[11px] text-slate-400 hover:text-primary font-medium flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> 장바구니로 이동</Link>
                </div>
                {!embedded && (
                    <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest pt-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500/60" /> WOW3D 보안 인증
                    </div>
                )}
            </div>
        </div>
    )
}
