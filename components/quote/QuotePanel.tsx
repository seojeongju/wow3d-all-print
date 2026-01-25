'use client'

import { useFileStore } from '@/store/useFileStore'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Loader2, Box, Layers, Ruler, Printer,
    Droplets, Zap, Save, ShoppingCart,
    ChevronRight, Wallet, Clock, ShieldCheck, AlertTriangle, FileText
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type PrintSpecs = {
  fdm?: { max: { x: number; y: number; z: number }; layerHeights?: number[]; hourlyRate?: number; layerCosts?: Record<string, number>; fdm_layer_hours_factor?: number; fdm_labor_cost_krw?: number; fdm_support_per_cm2_krw?: number }
  sla?: { max: { x: number; y: number; z: number }; layerHeights?: number[]; hourlyRate?: number; layerCosts?: Record<string, number>; sla_layer_exposure_sec?: number; sla_labor_cost_krw?: number; sla_consumables_krw?: number; sla_post_process_krw?: number }
  dlp?: { max: { x: number; y: number; z: number }; layerHeights?: number[]; hourlyRate?: number; layerCosts?: Record<string, number>; dlp_layer_exposure_sec?: number; dlp_labor_cost_krw?: number; dlp_consumables_krw?: number; dlp_post_process_krw?: number }
}

type ApiMaterial = { id: number; name: string; type: string; price_per_gram: number; price_per_ml?: number | null; density: number }

type PrintMethod = 'fdm' | 'sla' | 'dlp'

type QuotePanelProps = { embedded?: boolean }
export default function QuotePanel({ embedded = false }: QuotePanelProps) {
    const { file, analysis } = useFileStore()
    const { addToCart } = useCartStore()
    const { sessionId, token, user, setSessionId } = useAuthStore()
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false)

    // Print Method Selection
    const [printMethod, setPrintMethod] = useState<PrintMethod>('fdm')

    // FDM Options (fdmMaterial = 자재 이름, API와 연동)
    const [fdmMaterial, setFdmMaterial] = useState('')
    const [infill, setInfill] = useState(20)
    const [layerHeight, setLayerHeight] = useState(0.2) // mm
    const [supportEnabled, setSupportEnabled] = useState(false)

    // SLA/DLP Options (resinType = 자재 이름)
    const [resinType, setResinType] = useState('')
    const [slaLayerHeight, setSlaLayerHeight] = useState(0.05) // mm
    const [postProcessing, setPostProcessing] = useState(false)

    const [printSpecs, setPrintSpecs] = useState<PrintSpecs | null>(null)
    const [materials, setMaterials] = useState<ApiMaterial[]>([])
    useEffect(() => {
      fetch('/api/print-specs')
        .then((r) => r.json())
        .then((d) => d?.data && setPrintSpecs(d.data))
        .catch(() => {})
    }, [])
    useEffect(() => {
      fetch('/api/materials')
        .then((r) => r.json())
        .then((d) => d?.data && setMaterials(Array.isArray(d.data) ? d.data : []))
        .catch(() => {})
    }, [])

    const fdmMaterials = materials.filter((m) => m.type === 'FDM')
    const resinMaterials = materials.filter((m) => m.type === 'SLA' || m.type === 'DLP')
    useEffect(() => {
      if (fdmMaterials.length && (fdmMaterial === '' || !fdmMaterials.some((m) => m.name === fdmMaterial))) setFdmMaterial(fdmMaterials[0].name)
    }, [materials, fdmMaterial])
    useEffect(() => {
      if (resinMaterials.length && (resinType === '' || !resinMaterials.some((m) => m.name === resinType))) setResinType(resinMaterials[0].name)
    }, [materials, resinType])
    const MAT_COLORS: Record<string, string> = { PLA: 'text-emerald-400', ABS: 'text-amber-400', PETG: 'text-blue-400', TPU: 'text-pink-400', Standard: 'text-sky-400', Tough: 'text-amber-400', Clear: 'text-cyan-400', Flexible: 'text-lime-400' }

    const volumeCm3 = analysis?.volume || 0
    const surfaceAreaCm2 = analysis?.surfaceArea || 0
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

    // 견적 상세: 관리자 산출 기준(printSpecs)·자재(materials) 연동
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
            const layerHours = (spec as any)?.fdm_layer_hours_factor ?? 0.02
            const estTimeHours = Math.max(1, numLayers * layerHours)
            const supportPerCm2Kr = (spec as any)?.fdm_support_per_cm2_krw ?? 26
            const supportCost = supportEnabled ? (supportPerCm2Kr / KRW_TO_UNIT) * surfaceAreaCm2 : 0
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
            const mat = materials.find((m) => (m.type === 'SLA' || m.type === 'DLP') && m.name === resinType)
            const pricePerMlKr = mat && mat.price_per_ml != null ? Number(mat.price_per_ml) : 0
            const volumeML = volumeCm3
            const resinCost = (pricePerMlKr / KRW_TO_UNIT) * volumeML
            const numLayers = Math.max(1, Math.ceil(heightMm / slaLayerHeight))
            const layerExp = printMethod === 'dlp' ? ((spec as any)?.dlp_layer_exposure_sec ?? 3) : ((spec as any)?.sla_layer_exposure_sec ?? 8)
            const estTimeHours = (numLayers * layerExp) / 3600
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
            const quoteData = {
                fileName: file.name,
                fileSize: file.size,
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

            const response = await fetch('/api/cart', {
                method: 'POST',
                headers,
                body: JSON.stringify({ quoteId: savedQuote.id, quantity: 1 }),
            })

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
        <div className={`space-y-8 ${embedded ? 'pb-8' : 'pb-32'}`}>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5 ring-1 ring-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                        <Box className="w-3 h-3" /> 부피
                    </div>
                    <span className="text-lg font-bold font-mono tracking-tight">{volumeCm3.toFixed(1)} <span className="text-[10px] font-normal text-white/30">cm³</span></span>
                </div>
                <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5 ring-1 ring-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                        <Layers className="w-3 h-3" /> 표면적
                    </div>
                    <span className="text-lg font-bold font-mono tracking-tight">{surfaceAreaCm2.toFixed(1)} <span className="text-[10px] font-normal text-white/30">cm²</span></span>
                </div>
            </div>

            {/* Print Method Selection */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Printer className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">출력 방식 선택</span>
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
                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all relative overflow-hidden group ${printMethod === method.id
                                    ? 'bg-primary border-primary shadow-lg shadow-primary/20'
                                    : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                                }`}
                        >
                            <method.icon className={`w-6 h-6 ${printMethod === method.id ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`} />
                            <span className={`text-[10px] font-black tracking-tighter ${printMethod === method.id ? 'text-white' : 'text-white/30'}`}>
                                {method.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {overflow && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-200">최대 출력 크기 초과</p>
                        <p className="text-xs text-amber-200/80 mt-0.5">
                            이 모델은 선택한 {printMethod.toUpperCase()} 장비의 최대 치수({overflow})를 초과합니다. 출력이 불가할 수 있으니, 크기를 줄이거나 다른 출력 방식을 선택해 주세요.
                        </p>
                    </div>
                </div>
            )}

            <Separator className="bg-white/5" />

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
                            <span className="text-xs font-bold uppercase tracking-widest text-white/50">소재 설정</span>
                        </div>

                        <div className="grid gap-2">
                            {(printMethod === 'fdm' ? fdmMaterials : resinMaterials).length === 0 ? (
                                <p className="text-xs text-white/40 py-2">자재가 없습니다. 관리자 설정 → 자재에서 추가하세요.</p>
                            ) : (
                                (printMethod === 'fdm' ? fdmMaterials : resinMaterials).map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => printMethod === 'fdm' ? setFdmMaterial(m.name) : setResinType(m.name)}
                                        className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${(printMethod === 'fdm' ? fdmMaterial : resinType) === m.name
                                                ? 'bg-white/[0.07] border-primary/50 ring-1 ring-primary/20'
                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-bold ${MAT_COLORS[m.name] || ''}`}>{m.name}</span>
                                                {(printMethod === 'fdm' ? fdmMaterial : resinType) === m.name && (
                                                    <ChevronRight className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-white/40 leading-relaxed">
                                                {printMethod === 'fdm' ? `g당 ₩${(m.price_per_gram || 0).toLocaleString()} · 밀도 ${m.density}` : `mL당 ₩${(m.price_per_ml || 0).toLocaleString()}`}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sliders & Switches */}
                    {printMethod === 'fdm' ? (
                        <div className="space-y-8 pt-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Infill Density</label>
                                    <span className="font-mono text-sm text-primary font-bold">{infill}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="10" max="100" step="10"
                                    value={infill}
                                    onChange={(e) => setInfill(Number(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block px-1">레이어 두께</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.1, 0.2, 0.3].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setLayerHeight(h)}
                                            className={`py-2.5 rounded-xl border text-[11px] font-bold transition-all ${layerHeight === h
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'
                                                }`}
                                        >
                                            {h}mm
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 pt-4">
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block px-1">레이어 두께</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.025, 0.05, 0.1].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setSlaLayerHeight(h)}
                                            className={`py-2.5 rounded-xl border text-[11px] font-bold transition-all ${slaLayerHeight === h
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'
                                                }`}
                                        >
                                            {h}mm
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* 상세보기 모달: 설정값에 따른 소요시간·소재소요량·출력레이어·비용구성 */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-md sm:max-w-lg bg-[#0a0a0a] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> 견적 상세
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-2">
                        {/* 입력 설정 */}
                        <section>
                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">입력 설정</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-white/50">출력 방식</div>
                                <div className="font-medium">{printMethod.toUpperCase()}</div>
                                <div className="text-white/50">소재</div>
                                <div className="font-medium">{printMethod === 'fdm' ? fdmMaterial : resinType}</div>
                                <div className="text-white/50">레이어 두께</div>
                                <div className="font-medium">{(printMethod === 'fdm' ? layerHeight : slaLayerHeight)} mm</div>
                                {printMethod === 'fdm' ? (
                                    <>
                                        <div className="text-white/50">Infill</div>
                                        <div className="font-medium">{infill}%</div>
                                        <div className="text-white/50">지지 구조</div>
                                        <div className="font-medium">{supportEnabled ? '사용' : '미사용'}</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-white/50">후가공</div>
                                        <div className="font-medium">{postProcessing ? '적용' : '미적용'}</div>
                                    </>
                                )}
                            </div>
                        </section>
                        {/* 모델 정보 */}
                        <section>
                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">모델 정보</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-white/50">부피</div>
                                <div className="font-mono">{volumeCm3.toFixed(1)} cm³</div>
                                <div className="text-white/50">표면적</div>
                                <div className="font-mono">{surfaceAreaCm2.toFixed(1)} cm²</div>
                                <div className="text-white/50">치수 (X×Y×Z)</div>
                                <div className="font-mono">{bx.toFixed(1)} × {by.toFixed(1)} × {bz.toFixed(1)} mm</div>
                            </div>
                        </section>
                        {/* 산출 결과 */}
                        <section>
                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">산출 결과</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-white/50">소요 시간</div>
                                <div className="font-bold text-emerald-400">{quoteDetail.time.toFixed(2)} h</div>
                                <div className="text-white/50">소재 소요량</div>
                                <div className="font-mono font-medium">{quoteDetail.materialAmount.toFixed(1)} {quoteDetail.materialUnit}</div>
                                <div className="text-white/50">출력 레이어 수</div>
                                <div className="font-mono font-bold">{quoteDetail.numLayers.toLocaleString()} layers</div>
                            </div>
                        </section>
                        {/* 비용 구분 */}
                        <section>
                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">비용 구분</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/50">재료비</span>
                                    <span className="font-mono">₩{Math.round(quoteDetail.costBreakdown.material * KRW_TO_UNIT).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">장비(인쇄)비</span>
                                    <span className="font-mono">₩{Math.round(quoteDetail.costBreakdown.machine * KRW_TO_UNIT).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">기타</span>
                                    <span className="font-mono">₩{Math.round(quoteDetail.costBreakdown.other * KRW_TO_UNIT).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">인건비</span>
                                    <span className="font-mono">₩{Math.round(quoteDetail.costBreakdown.labor * KRW_TO_UNIT).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 mt-2 border-t border-white/10 font-bold">
                                    <span>총 견적</span>
                                    <span className="text-primary">₩{Math.round(totalPrice * KRW_TO_UNIT).toLocaleString()}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Price Preview: embedded=인라인 카드, 아니면 고정 하단바 (겹침 방지) */}
            {embedded ? (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                                <Wallet className="w-3 h-3" /> 예상 견적
                            </div>
                            <span className="text-2xl font-black text-white">₩{Math.round(totalPrice * 1300).toLocaleString()}</span>
                            <span className="text-xs text-white/30 font-medium ml-1">KRW</span>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                                <Clock className="w-3 h-3" /> 예상 소요
                            </div>
                            <span className="text-sm font-bold text-emerald-400">~{estimatedTimeHours < 1 ? (Math.ceil(estimatedTimeHours * 60) + '분') : (estimatedTimeHours >= 24 ? (Math.ceil(estimatedTimeHours / 24) + '일') : (Math.ceil(estimatedTimeHours) + 'h'))}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDetailModalOpen(true)}
                        className="flex items-center gap-2 text-[11px] text-primary/90 hover:text-primary font-medium"
                    >
                        <FileText className="w-3.5 h-3.5" /> 상세보기
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button disabled={!analysis || isSaving} variant="ghost" size="sm" className="h-11 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold" onClick={handleSaveQuote}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button disabled={!analysis || isSaving} size="sm" className="h-11 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold flex items-center justify-center gap-2" onClick={handleAddToCart}>
                            <ShoppingCart className="w-4 h-4" /> 주문에 추가
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="fixed bottom-0 left-0 w-[400px] xl:w-[450px] p-6 bg-black border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-20">
                    <div className="flex items-center gap-6 mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                                <Wallet className="w-3 h-3" /> 예상 견적
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black text-white">₩{Math.round(totalPrice * 1300).toLocaleString()}</span>
                                <span className="text-xs text-white/30 font-medium">KRW</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                                <Clock className="w-3 h-3" /> 예상 소요
                            </div>
                            <span className="text-sm font-bold text-emerald-400">~{estimatedTimeHours < 1 ? (Math.ceil(estimatedTimeHours * 60) + '분') : (estimatedTimeHours >= 24 ? (Math.ceil(estimatedTimeHours / 24) + '일') : (Math.ceil(estimatedTimeHours) + 'h'))}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDetailModalOpen(true)}
                        className="flex items-center gap-2 text-[11px] text-primary/90 hover:text-primary font-medium mb-3"
                    >
                        <FileText className="w-3.5 h-3.5" /> 상세보기
                    </button>
                    <div className="grid grid-cols-[1fr_2fr] gap-3">
                        <Button disabled={!analysis || isSaving} variant="ghost" size="lg" className="h-14 rounded-2xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase transition-all active:scale-95" onClick={handleSaveQuote}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button disabled={!analysis || isSaving} size="lg" className="h-14 rounded-2xl bg-white text-black hover:bg-white/90 shadow-xl shadow-white/5 text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3" onClick={handleAddToCart}>
                            <ShoppingCart className="w-5 h-5" /> 주문에 추가하기
                        </Button>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] text-white/20 font-bold uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3 text-emerald-500/50" /> WOW3D 보안 인증
                    </div>
                </div>
            )}
        </div>
    )
}
