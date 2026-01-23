'use client'

import { useFileStore } from '@/store/useFileStore'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, Box, Layers, Ruler, Printer, Droplets, Zap, Save, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

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
        pla: { name: 'PLA', density: 1.24, pricePerGram: 0.05, color: 'Standard' },
        abs: { name: 'ABS', density: 1.04, pricePerGram: 0.06, color: 'Engineering' },
        petg: { name: 'PETG', density: 1.27, pricePerGram: 0.07, color: 'Durable' },
        tpu: { name: 'TPU', density: 1.21, pricePerGram: 0.12, color: 'Flexible' },
    }

    const RESIN_TYPES = {
        standard: { name: 'Standard Resin', density: 1.2, pricePerML: 0.08 },
        tough: { name: 'Tough Resin', density: 1.15, pricePerML: 0.12 },
        clear: { name: 'Clear Resin', density: 1.18, pricePerML: 0.15 },
        flexible: { name: 'Flexible Resin', density: 1.1, pricePerML: 0.18 },
    }

    const volumeCm3 = analysis?.volume || 0
    const surfaceAreaCm2 = analysis?.surfaceArea || 0
    const heightMm = analysis?.boundingBox.z || 0

    // Calculate Price based on Print Method
    const calculatePrice = () => {
        if (!analysis) return 0

        if (printMethod === 'fdm') {
            // FDM Pricing Logic
            const material = FDM_MATERIALS[fdmMaterial as keyof typeof FDM_MATERIALS]
            const effectiveDensity = material.density * (infill / 100)
            const adjustedDensity = Math.max(material.density * 0.2, effectiveDensity)
            const weightGrams = volumeCm3 * adjustedDensity
            const materialCost = weightGrams * material.pricePerGram

            // Time estimation: based on volume and layer height
            const numLayers = heightMm / layerHeight
            const estTimeHours = Math.max(1, numLayers * 0.02) // ~1.2 min per layer

            // Support material cost (if enabled)
            const supportCost = supportEnabled ? surfaceAreaCm2 * 0.02 : 0

            const machineRate = 2.5 // $/hour
            const laborCost = 5.0

            return materialCost + supportCost + (estTimeHours * machineRate) + laborCost
        } else {
            // SLA/DLP Pricing Logic
            const resin = RESIN_TYPES[resinType as keyof typeof RESIN_TYPES]
            const volumeML = volumeCm3 // 1 cm³ ≈ 1 mL for resin
            const resinCost = volumeML * resin.pricePerML

            // Time: Z-height based (SLA/DLP prints layer by layer)
            const numLayers = heightMm / slaLayerHeight
            const layerExposureTime = printMethod === 'dlp' ? 3 : 8 // seconds per layer
            const estTimeHours = (numLayers * layerExposureTime) / 3600

            // Consumables (FEP film, cleaning)
            const consumablesCost = 3.0

            // Post-processing (washing + curing)
            const postProcessCost = postProcessing ? 8.0 : 0

            const machineRate = printMethod === 'dlp' ? 4.0 : 3.5 // $/hour
            const laborCost = 7.0

            return resinCost + consumablesCost + postProcessCost + (estTimeHours * machineRate) + laborCost
        }
    }

    const totalPrice = calculatePrice()

    // 견적 시간 계산
    const estimatedTimeHours = analysis
        ? (printMethod === 'fdm'
            ? heightMm / layerHeight * 0.02
            : heightMm / slaLayerHeight * (printMethod === 'dlp' ? 3 : 8) / 3600)
        : 0

    // 견적 저장 핸들러
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

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            }

            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            } else {
                headers['X-Session-ID'] = sessionId
            }

            const response = await fetch('/api/quotes', {
                method: 'POST',
                headers,
                body: JSON.stringify(quoteData),
            })

            if (!response.ok) {
                throw new Error('견적 저장 실패')
            }

            const result = await response.json()

            toast({
                title: '✅ 견적 저장 완료',
                description: '견적이 성공적으로 저장되었습니다',
            })

            return result.data
        } catch (error) {
            toast({
                title: '❌ 저장 실패',
                description: error instanceof Error ? error.message : '견적 저장 중 오류가 발생했습니다',
                variant: 'destructive',
            })
            return null
        } finally {
            setIsSaving(false)
        }
    }

    // 장바구니 추가 핸들러
    const handleAddToCart = async () => {
        if (!analysis) return

        // 먼저 견적 저장
        const savedQuote = await handleSaveQuote()
        if (!savedQuote) return

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            }

            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            } else {
                headers['X-Session-ID'] = sessionId
            }

            const response = await fetch('/api/cart', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    quoteId: savedQuote.id,
                    quantity: 1,
                }),
            })

            if (!response.ok) {
                throw new Error('장바구니 추가 실패')
            }

            toast({
                title: '🛒 장바구니에 추가됨',
                description: '견적이 장바구니에 추가되었습니다',
            })

            // 로컬 상태 업데이트
            addToCart({
                ...savedQuote,
                quote: savedQuote,
            }, 1)
        } catch (error) {
            toast({
                title: '❌ 추가 실패',
                description: error instanceof Error ? error.message : '장바구니 추가 중 오류가 발생했습니다',
                variant: 'destructive',
            })
        }
    }

    if (!file) return null

    return (
        <Card className="w-full shadow-lg border-primary/10">
            <CardHeader>
                <CardTitle>Instant Quote</CardTitle>
                <CardDescription>Configure your print settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Analysis Loading/Results */}
                {!analysis ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                        <span className="text-sm">Analyzing Geometry...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Box className="w-3.5 h-3.5" /> Volume
                            </div>
                            <span className="font-mono font-medium">{volumeCm3.toFixed(2)} cm³</span>
                        </div>
                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Layers className="w-3.5 h-3.5" /> Surface
                            </div>
                            <span className="font-mono font-medium">{surfaceAreaCm2.toFixed(2)} cm²</span>
                        </div>
                        <div className="col-span-2 flex flex-col gap-1 p-3 rounded-lg bg-muted/40">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Ruler className="w-3.5 h-3.5" /> Dimensions
                            </div>
                            <span className="font-mono font-medium text-xs">
                                {analysis.boundingBox.x.toFixed(1)} × {analysis.boundingBox.y.toFixed(1)} × {analysis.boundingBox.z.toFixed(1)} mm
                            </span>
                        </div>
                    </div>
                )}

                <Separator />

                {/* Print Method Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Print Method</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setPrintMethod('fdm')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${printMethod === 'fdm'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:bg-muted'
                                }`}
                        >
                            <Printer className="w-5 h-5" />
                            <span className="text-xs font-semibold">FDM</span>
                        </button>
                        <button
                            onClick={() => setPrintMethod('sla')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${printMethod === 'sla'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:bg-muted'
                                }`}
                        >
                            <Droplets className="w-5 h-5" />
                            <span className="text-xs font-semibold">SLA</span>
                        </button>
                        <button
                            onClick={() => setPrintMethod('dlp')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${printMethod === 'dlp'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:bg-muted'
                                }`}
                        >
                            <Zap className="w-5 h-5" />
                            <span className="text-xs font-semibold">DLP</span>
                        </button>
                    </div>
                </div>

                {/* FDM Options */}
                {printMethod === 'fdm' && (
                    <>
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Material</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(FDM_MATERIALS).map(([key, mat]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFdmMaterial(key)}
                                        className={`text-xs p-2 rounded-md border transition-all ${fdmMaterial === key
                                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                                            : 'border-border hover:bg-muted'
                                            }`}
                                    >
                                        {mat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Infill</label>
                                <span className="text-xs text-muted-foreground">{infill}%</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="10"
                                value={infill}
                                onChange={(e) => setInfill(Number(e.target.value))}
                                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Layer Height</label>
                                <span className="text-xs text-muted-foreground">{layerHeight} mm</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[0.1, 0.2, 0.3].map(height => (
                                    <button
                                        key={height}
                                        onClick={() => setLayerHeight(height)}
                                        className={`text-xs p-2 rounded-md border transition-all ${layerHeight === height
                                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                                            : 'border-border hover:bg-muted'
                                            }`}
                                    >
                                        {height}mm
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                            <label className="text-sm font-medium">Support Structures</label>
                            <button
                                onClick={() => setSupportEnabled(!supportEnabled)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${supportEnabled
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground'
                                    }`}
                            >
                                {supportEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </>
                )}

                {/* SLA/DLP Options */}
                {(printMethod === 'sla' || printMethod === 'dlp') && (
                    <>
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Resin Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(RESIN_TYPES).map(([key, res]) => (
                                    <button
                                        key={key}
                                        onClick={() => setResinType(key)}
                                        className={`text-xs p-2 rounded-md border transition-all ${resinType === key
                                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                                            : 'border-border hover:bg-muted'
                                            }`}
                                    >
                                        {res.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Layer Thickness</label>
                                <span className="text-xs text-muted-foreground">{slaLayerHeight} mm</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[0.025, 0.05, 0.1].map(height => (
                                    <button
                                        key={height}
                                        onClick={() => setSlaLayerHeight(height)}
                                        className={`text-xs p-2 rounded-md border transition-all ${slaLayerHeight === height
                                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                                            : 'border-border hover:bg-muted'
                                            }`}
                                    >
                                        {height}mm
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                            <label className="text-sm font-medium">Post-Processing</label>
                            <button
                                onClick={() => setPostProcessing(!postProcessing)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${postProcessing
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground'
                                    }`}
                            >
                                {postProcessing ? 'YES' : 'NO'}
                            </button>
                        </div>
                    </>
                )}

                {/* Total Price */}
                <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Estimated Cost</span>
                            <span className="text-2xl font-bold tracking-tight text-primary">
                                ${analysis ? totalPrice.toFixed(2) : '---'}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                                {printMethod.toUpperCase()} • {analysis ? `~${Math.ceil(estimatedTimeHours)}h` : '---'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            disabled={!analysis || isSaving}
                            variant="outline"
                            size="lg"
                            onClick={handleSaveQuote}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    저장중...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    견적 저장
                                </>
                            )}
                        </Button>
                        <Button
                            disabled={!analysis || isSaving}
                            size="lg"
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            장바구니
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
