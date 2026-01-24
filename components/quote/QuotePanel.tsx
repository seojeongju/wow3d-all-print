'use client'

import { useFileStore } from '@/store/useFileStore'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Loader2, Box, Layers, Ruler, Printer,
    Droplets, Zap, Save, ShoppingCart,
    ChevronRight, Wallet, Clock, ShieldCheck
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

type PrintMethod = 'fdm' | 'sla' | 'dlp'

export default function QuotePanel() {
    const { file, analysis } = useFileStore()
    const { addToCart } = useCartStore()
    const { sessionId, token } = useAuthStore()
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false)

    // Print Method Selection
    const [printMethod, setPrintMethod] = useState<PrintMethod>('fdm')

    // FDM Options
    const [fdmMaterial, setFdmMaterial] = useState('pla')
    const [infill, setInfill] = useState(20)
    const [layerHeight, setLayerHeight] = useState(0.2) // mm
    const [supportEnabled, setSupportEnabled] = useState(false)

    // SLA/DLP Options
    const [resinType, setResinType] = useState('standard')
    const [slaLayerHeight, setSlaLayerHeight] = useState(0.05) // mm
    const [postProcessing, setPostProcessing] = useState(false)

    // Material Data
    const FDM_MATERIALS = {
        pla: { name: 'PLA', density: 1.24, pricePerGram: 0.05, color: 'text-emerald-400', desc: '가장 대중적인 친환경 소재' },
        abs: { name: 'ABS', density: 1.04, pricePerGram: 0.06, color: 'text-amber-400', desc: '내구성이 뛰어난 엔지니어링 소재' },
        petg: { name: 'PETG', density: 1.27, pricePerGram: 0.07, color: 'text-blue-400', desc: '강성과 내열성을 겸비한 범용 소재' },
        tpu: { name: 'TPU', density: 1.21, pricePerGram: 0.12, color: 'text-pink-400', desc: '고무처럼 유연하고 질긴 탄성 소재' },
    }

    const RESIN_TYPES = {
        standard: { name: 'Standard', density: 1.2, pricePerML: 0.08, desc: '매끄러운 표면과 높은 정밀도' },
        tough: { name: 'Tough', density: 1.15, pricePerML: 0.12, desc: '충격에 강한 고강도 레진' },
        clear: { name: 'Clear', density: 1.18, pricePerML: 0.15, desc: '투명도가 높은 시인성 위주 레진' },
        flexible: { name: 'Flexible', density: 1.1, pricePerML: 0.18, desc: '실리콘 채널 및 고무 유사 탄성' },
    }

    const volumeCm3 = analysis?.volume || 0
    const surfaceAreaCm2 = analysis?.surfaceArea || 0
    const heightMm = analysis?.boundingBox.z || 0

    // Calculate Price Memoized
    const priceInfo = useMemo(() => {
        if (!analysis) return { total: 0, time: 0 }

        if (printMethod === 'fdm') {
            const material = FDM_MATERIALS[fdmMaterial as keyof typeof FDM_MATERIALS]
            const effectiveDensity = material.density * (infill / 100)
            const adjustedDensity = Math.max(material.density * 0.2, effectiveDensity)
            const weightGrams = volumeCm3 * adjustedDensity
            const materialCost = weightGrams * material.pricePerGram
            const numLayers = heightMm / layerHeight
            const estTimeHours = Math.max(1, numLayers * 0.02)
            const supportCost = supportEnabled ? surfaceAreaCm2 * 0.02 : 0
            const machineRate = 2.5
            const laborCost = 5.0
            return {
                total: materialCost + supportCost + (estTimeHours * machineRate) + laborCost,
                time: estTimeHours
            }
        } else {
            const resin = RESIN_TYPES[resinType as keyof typeof RESIN_TYPES]
            const volumeML = volumeCm3
            const resinCost = volumeML * resin.pricePerML
            const numLayers = heightMm / slaLayerHeight
            const layerExposureTime = printMethod === 'dlp' ? 3 : 8
            const estTimeHours = (numLayers * layerExposureTime) / 3600
            const consumablesCost = 3.0
            const postProcessCost = postProcessing ? 8.0 : 0
            const machineRate = printMethod === 'dlp' ? 4.0 : 3.5
            const laborCost = 7.0
            return {
                total: resinCost + consumablesCost + postProcessCost + (estTimeHours * machineRate) + laborCost,
                time: estTimeHours
            }
        }
    }, [analysis, printMethod, fdmMaterial, infill, layerHeight, supportEnabled, resinType, slaLayerHeight, postProcessing])

    const totalPrice = priceInfo.total
    const estimatedTimeHours = priceInfo.time

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
                    fdmMaterial: fdmMaterial.toUpperCase() as any,
                    fdmInfill: infill,
                    fdmLayerHeight: layerHeight,
                    fdmSupport: supportEnabled,
                } : {
                    resinType: resinType.charAt(0).toUpperCase() + resinType.slice(1) as any,
                    layerThickness: slaLayerHeight,
                    postProcessing,
                }),
                totalPrice,
                estimatedTimeHours,
            }

            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            else headers['X-Session-ID'] = sessionId

            const response = await fetch('/api/quotes', {
                method: 'POST',
                headers,
                body: JSON.stringify(quoteData),
            })

            if (!response.ok) throw new Error('견적 저장 실패')

            const result = await response.json()
            toast({ title: '✅ 견적 완료', description: '견적이 성공적으로 기록되었습니다' })
            return result.data
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
        if (!analysis) return
        const savedQuote = await handleSaveQuote()
        if (!savedQuote) return

        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            else headers['X-Session-ID'] = sessionId

            const response = await fetch('/api/cart', {
                method: 'POST',
                headers,
                body: JSON.stringify({ quoteId: savedQuote.id, quantity: 1 }),
            })

            if (!response.ok) throw new Error('장바구니 추가 실패')

            toast({ title: '🛒 장바구니 추가', description: '제품이 장바구니에 담겼습니다' })
            addToCart({ ...savedQuote, quote: savedQuote }, 1)
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
        <div className="space-y-8 pb-32">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5 ring-1 ring-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                        <Box className="w-3 h-3" /> Volume
                    </div>
                    <span className="text-lg font-bold font-mono tracking-tight">{volumeCm3.toFixed(1)} <span className="text-[10px] font-normal text-white/30">cm³</span></span>
                </div>
                <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5 ring-1 ring-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                        <Layers className="w-3 h-3" /> Surface
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
                            {Object.entries(printMethod === 'fdm' ? FDM_MATERIALS : RESIN_TYPES).map(([key, data]) => (
                                <button
                                    key={key}
                                    onClick={() => printMethod === 'fdm' ? setFdmMaterial(key) : setResinType(key)}
                                    className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${(printMethod === 'fdm' ? fdmMaterial : resinType) === key
                                            ? 'bg-white/[0.07] border-primary/50 ring-1 ring-primary/20'
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold">{data.name}</span>
                                            {(printMethod === 'fdm' ? fdmMaterial : resinType) === key && (
                                                <ChevronRight className="w-4 h-4 text-primary" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-white/40 leading-relaxed">{(data as any).desc}</p>
                                    </div>
                                </button>
                            ))}
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
                                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block px-1">Layer Height</label>
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
                                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block px-1">Layer Thickness</label>
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

            {/* Price Preview Card - Locked to Sidebar Bottom or Floating */}
            <div className="fixed bottom-0 left-0 w-[400px] xl:w-[450px] p-6 bg-black border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-20">
                <div className="flex items-center gap-6 mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                            <Wallet className="w-3 h-3" /> Estimate
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-white">₩{Math.round(totalPrice * 1300).toLocaleString()}</span>
                            <span className="text-xs text-white/30 font-medium">KRW</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                            <Clock className="w-3 h-3" /> Delivery
                        </div>
                        <span className="text-sm font-bold text-emerald-400">~{Math.ceil(estimatedTimeHours + 24)}h</span>
                    </div>
                </div>

                <div className="grid grid-cols-[1fr_2fr] gap-3">
                    <Button
                        disabled={!analysis || isSaving}
                        variant="ghost"
                        size="lg"
                        className="h-14 rounded-2xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase transition-all active:scale-95"
                        onClick={handleSaveQuote}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                        disabled={!analysis || isSaving}
                        size="lg"
                        className="h-14 rounded-2xl bg-white text-black hover:bg-white/90 shadow-xl shadow-white/5 text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                        onClick={handleAddToCart}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        주문에 추가하기
                    </Button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] text-white/20 font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
                    Verified by Wow3D Security System
                </div>
            </div>
        </div>
    )
}
