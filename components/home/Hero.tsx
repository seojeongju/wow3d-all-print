'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Cuboid, Loader2, Zap, Palette } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFileStore } from '@/store/useFileStore';
import { useToast } from '@/hooks/use-toast';
import LandingHeroScene from './LandingHeroScene';

// 금액은 원화(KRW)로만 계산·표시. 자동견적(QuotePanel)과 동일한 공식·roundTo100·minPriceKr 적용
import { roundTo100 } from '@/lib/amount-display';

type PrintSpecs = {
    fdm?: {
        max?: { x?: number; y?: number; z?: number };
        layerCosts?: Record<string, number>;
        hourlyRate?: number;
        fdm_layer_hours_factor?: number;
        fdm_labor_cost_krw?: number;
        fdm_support_per_cm2_krw?: number;
        minPriceKr?: number;
    };
    sla?: unknown;
    dlp?: unknown;
};
type ApiMaterial = { type: string; name?: string; price_per_gram?: number; density?: number };

export default function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);
    const router = useRouter();
    const { setFile, file, analysis, reset } = useFileStore();

    const SAMPLE_NAMES = ['sample_cube.stl', 'test_cube.stl'];
    const clearSampleIfPresent = () => { if (file && SAMPLE_NAMES.includes(file.name)) reset(); };
    const { toast } = useToast();
    const [isLoadingSample, setIsLoadingSample] = useState(false);
    const [printSpecs, setPrintSpecs] = useState<PrintSpecs | null>(null);
    const [materials, setMaterials] = useState<ApiMaterial[]>([]);

    useEffect(() => {
        fetch('/api/print-specs').then((r) => r.json()).then((d) => d?.data && setPrintSpecs(d.data)).catch(() => { });
        fetch('/api/materials').then((r) => r.json()).then((d) => Array.isArray(d?.data) && setMaterials(d.data)).catch(() => { });
    }, []);

    // 자동견적(QuotePanel)과 동일한 FDM 공식 + 100원 반올림 + 최소견적 적용
    const heroEstimate = useMemo(() => {
        if (!analysis || !printSpecs?.fdm) return null;
        const spec = printSpecs.fdm;
        const max = spec.max || { x: 220, y: 220, z: 250 };
        const bx = analysis.boundingBox?.x ?? 0;
        const by = analysis.boundingBox?.y ?? 0;
        const bz = analysis.boundingBox?.z ?? 0;
        const overflow = bx > (max.x ?? 220) || by > (max.y ?? 220) || bz > (max.z ?? 250);

        const mat = materials.find((m) => m.type === 'FDM');
        const density = mat?.density ?? 1.24;
        const pricePerGramKr = mat && typeof mat.price_per_gram === 'number' ? mat.price_per_gram : 0;
        const infill = 20;
        const effectiveDensity = density * (infill / 100);
        const adjustedDensity = Math.max(density * 0.2, effectiveDensity);
        const volumeCm3 = analysis.volume || 0;
        const surfaceAreaCm2 = analysis.surfaceArea || 0;
        const heightMm = bz;
        const weightGrams = volumeCm3 * adjustedDensity;
        const materialCost = pricePerGramKr * weightGrams;
        const layerHeight = 0.2;
        const numLayers = Math.max(1, Math.ceil(heightMm / layerHeight));

        // 서브리니어 보완: 대형도 완만 (지수 0.85, 계수 0.0297)
        const volumeTime = Math.pow(weightGrams + 1, 0.85) * 0.0297;
        const baseLayerFactor = spec.fdm_layer_hours_factor ?? 0.02;
        const layerTimeFactor = baseLayerFactor * 0.08;
        const movementTime = numLayers * layerTimeFactor;
        const surfaceTime = Math.pow(surfaceAreaCm2 + 1, 0.8) * 0.00126;
        const estTimeHours = Math.max(0.5, volumeTime + movementTime + surfaceTime);

        const rateKRW = spec.layerCosts?.['0.2'] ?? spec.hourlyRate ?? 5000;
        const effectiveRate = estTimeHours > 10 ? rateKRW * 0.7 : estTimeHours > 5 ? rateKRW * 0.8 : rateKRW;
        const machineCost = estTimeHours * effectiveRate;
        const laborCost = spec.fdm_labor_cost_krw ?? 6500;
        const supportCost = 0; // 히어로에서는 지지대 미적용(QuotePanel 기본값과 동일)
        const totalRaw = materialCost + supportCost + machineCost + laborCost;
        const rounded = roundTo100(totalRaw, 'round');
        const minPriceKr = spec.minPriceKr;
        const total = minPriceKr != null && minPriceKr > 0 ? Math.max(rounded, minPriceKr) : rounded;
        return { total, printability: overflow ? 85 : 100, overflow };
    }, [analysis, printSpecs, materials]);

    const handleTrySample = async () => {
        setIsLoadingSample(true);
        try {
            const res = await fetch('/test_cube.stl');
            if (!res.ok) throw new Error('샘플 파일을 불러올 수 없습니다.');
            const blob = await res.blob();
            const file = new File([blob], 'sample_cube.stl', { type: 'model/stl' });
            setFile(file);
            router.push('/experience');
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '샘플 파일 로드에 실패했습니다.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingSample(false);
        }
    };

    return (
        <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 cyber-grid bg-background transition-all duration-700">
            {/* Cyber Glow Points - Light Theme */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-[-10%] top-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[140px] animate-pulse-glow" />
                <div className="absolute right-[-5%] bottom-0 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[160px]" />
            </div>

            <div className="container mx-auto px-4 z-10 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-left"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-md"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] text-primary uppercase">Next-Gen 3D Printing</span>
                    </motion.div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.95] text-foreground">
                        <span className="text-primary block text-base sm:text-lg md:text-xl mb-4 font-black uppercase tracking-[0.3em]">WOW3D ALL-PRINT</span>
                        3D프린팅 출력 및 <br />
                        <span className="text-primary relative inline-block text-glow-mint">
                            시제품제작 대행
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-foreground/60 mb-10 max-w-lg leading-relaxed break-keep font-bold">
                        STL·OBJ·3MF 파일 업로드만으로 <span className="text-primary font-black underline decoration-primary/30 underline-offset-4">실시간 자동견적</span>을 즉시 확인하세요.<br className="hidden sm:block" />
                        상상을 현실로 만드는 가장 빠른 방법.
                    </p>

                    <div className="flex flex-col sm:flex-row flex-wrap gap-5 mb-12">
                        <Link href="/quote" className="w-full sm:w-auto order-first sm:order-none">
                            <Button size="lg" className="w-full h-16 px-10 text-[16px] sm:text-lg rounded-2xl bg-primary text-primary-foreground shadow-[0_15px_40px_rgba(0,255,204,0.3)] hover:scale-[1.05] hover:shadow-[0_20px_50px_rgba(0,255,204,0.4)] transition-all gap-3 font-black uppercase tracking-widest relative overflow-hidden group">
                                <Zap className="w-6 h-6 fill-current relative z-10" />
                                <span className="relative z-10">실시간 자동견적</span>
                                <ArrowRight className="w-6 h-6 shrink-0 relative z-10" />
                            </Button>
                        </Link>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link href="/maker" className="flex-1">
                                <Button size="lg" variant="outline" className="w-full h-16 px-8 text-sm rounded-2xl bg-white/50 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary transition-all gap-2 font-black uppercase tracking-widest backdrop-blur-md">
                                    <Palette className="w-5 h-5" /> AI 메이커
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-xs font-black text-primary overflow-hidden shadow-lg">
                                    {i}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col text-left">
                            <div className="font-black text-sm sm:text-base text-foreground leading-tight">1,000+ Verified Projects</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">Reliable Engineering Tool</div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Visual - Cyber Glass Cards */}
                <div className="relative h-[650px] w-full hidden lg:block perspective-1000">
                    <motion.div
                        style={{ y: y1, rotateX: 5, rotateY: -5 }}
                        className="absolute right-0 top-10 w-[420px] glass-card min-h-[500px] p-0 z-10 flex flex-col group overflow-hidden"
                    >
                        <div className="absolute inset-0 cyber-grid opacity-30 group-hover:opacity-50 transition-opacity" />

                        <div className="relative p-8 pb-6 border-b border-primary/10 bg-white/20">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-foreground tracking-tighter uppercase">Model Analysis</h3>
                                <div className="w-3 h-3 rounded-full bg-primary animate-pulse cyber-glow-mint" />
                            </div>
                            <p className="text-sm text-foreground/60 leading-relaxed font-bold">
                                AI 기반의 정밀한 모델 분석을 통해 최적의 출력 파라미터와 정확한 비용을 산출합니다.
                            </p>
                        </div>

                        <div className="relative flex-1 w-full min-h-[320px]">
                            <LandingHeroScene />
                        </div>

                        <div className="relative p-8 pt-4 bg-white/20">
                            <div className="grid grid-cols-3 gap-4">
                                {['STL', 'STEP', 'OBJ'].map(fmt => (
                                    <div key={fmt} className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                                        <span className="text-[10px] font-black text-primary tracking-widest">{fmt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        style={{ y: y2 }}
                        className="absolute left-10 bottom-10 w-[300px] glass-card p-8 z-20 flex flex-col space-y-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary cyber-glow-mint">
                                <Zap className="w-7 h-7 fill-current" />
                            </div>
                            <div>
                                <div className="font-black text-foreground text-lg tracking-tighter">AI QUOTE</div>
                                <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Live Update</div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                <div className="text-[10px] text-foreground/40 mb-3 font-black uppercase tracking-[0.2em]">Live Estimate</div>
                                <div className="text-3xl font-black text-foreground text-glow-mint tracking-tighter">
                                    ₩ 45,000
                                </div>
                            </div>

                            <Button
                                className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-widest shadow-[0_10px_30px_rgba(0,255,204,0.3)] transition-all active:scale-95"
                                onClick={handleTrySample}
                            >
                                {isLoadingSample ? <Loader2 className="w-5 h-5 animate-spin" /> : 'TRY SAMPLE QUOTE'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

