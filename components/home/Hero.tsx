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
        <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* 밝은 다크 좌우 그라데이션 배경 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            {/* 틸/블루 은은한 포인트 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
                {/* 좌상단 틸 글로우 */}
                <div className="absolute left-0 top-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-[130px]" />
                {/* 우하단 인디고 글로우 */}
                <div className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[150px]" />
                {/* 중앙 상단 퍼플 포인트 */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[300px] h-[300px] rounded-full bg-purple-800/10 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 z-10 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-left"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-md"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-xs font-semibold tracking-wider text-white/80">차세대 3D 프린팅 서비스</span>
                    </motion.div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-[1.1] word-keep-all text-balance text-white">
                        <span className="text-teal-400 block text-lg md:text-xl mb-3 font-black uppercase tracking-[0.2em] opacity-90">WOW3D PRO</span>
                        3D프린팅 출력 및 <br />
                        <span className="text-teal-400 relative inline-block">
                            시제품제작 대행 서비스
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-teal-400/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-xl text-white/70 mb-8 max-w-lg leading-relaxed break-keep font-medium">
                        STL·OBJ·3MF 파일 업로드만으로 <span className="text-white font-bold">3D프린팅 자동견적</span>을 즉시 확인하세요.<br />
                        3D프린터 출력대행부터 시제품제작, 소량·대량 생산까지 (주)와우쓰리디가 빠르고 정확하게 지원합니다.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/print-methods">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-teal-500 hover:bg-teal-400 text-white shadow-[0_4px_24px_rgba(20,184,166,0.4)] hover:shadow-[0_6px_32px_rgba(20,184,166,0.5)] hover:scale-[1.02] transition-all gap-2">
                                3D 프린터 출력방식 (FDM, SLA, DLP)
                                <ArrowRight className="w-5 h-5 shrink-0" />
                            </Button>
                        </Link>
                        <Link href="/materials">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-[1.02] transition-all gap-2">
                                <Palette className="w-5 h-5 shrink-0" />
                                소재 살펴보기
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-12 flex items-center gap-8 text-white/70">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-xs font-bold overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="font-bold text-white">1,000+</div>
                            <div className="text-sm">고객 만족</div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Visual - 3D 지원 정보 카드 + 플레이스홀더 */}
                <div className="relative h-[600px] w-full hidden lg:block perspective-1000">
                    <motion.div
                        style={{ y: y1, rotateX: 5, rotateY: -5 }}
                        className="absolute right-0 top-10 w-[400px] min-h-[480px] rounded-[2rem] border border-white/15 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 z-10 overflow-hidden flex flex-col ring-1 ring-white/10"
                    >
                        {/* 그리드 배경 */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:20px_20px] rounded-[2rem]" />

                        {/* 상단: 타이틀 + 지원 형식 텍스트 */}
                        <div className="relative p-6 pb-4 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white tracking-tight mb-1">3D 모델 지원</h3>
                            <p className="text-[13px] text-white/70 leading-relaxed">
                                STL, OBJ, 3MF, PLY, STEP, STP를 업로드하면 AI가 부피·표면적을 분석해 실시간 견적을 제공합니다.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {['STL', 'OBJ', '3MF', 'PLY', 'STEP', 'STP'].map((fmt) => (
                                    <span
                                        key={fmt}
                                        className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-400/30 text-[11px] font-semibold text-teal-300 tracking-wide"
                                    >
                                        .{fmt.toLowerCase()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 중앙: 3D 플레이스홀더 (인터랙티브 3D 뷰어) */}
                        <div className="relative flex-1 w-full min-h-[300px]">
                            <LandingHeroScene />
                        </div>

                        {/* 하단: 부가 정보 텍스트 */}
                        <div className="relative px-6 pb-6 pt-2 border-t border-white/5">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-white/60 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                    최대 100MB
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-teal-400" />
                                    실시간 견적
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                                    암호화 업로드
                                </span>
                            </div>
                            <p className="mt-3 text-[10px] text-white/70 font-medium">
                                파일을 업로드하면 3D 미리보기와 상세 견적이 활성화됩니다.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        style={{ y: y2 }}
                        className="absolute left-10 bottom-20 w-[280px] h-[480px] rounded-[2.5rem] border border-white/15 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 z-20 p-8 flex flex-col ring-1 ring-white/10"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${file && !analysis ? 'bg-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/10' : analysis ? 'bg-teal-500/10 text-teal-400 shadow-lg shadow-teal-500/5' : 'bg-white/5 text-white/20'}`}>
                                {file && !analysis ? <Loader2 className="w-7 h-7 animate-spin" /> : <Sparkles className="w-7 h-7" />}
                            </div>
                            <div>
                                <div className="font-black text-white text-lg tracking-tight">AI 견적 분석</div>
                                <div className="text-[11px] text-white/60 font-black uppercase tracking-widest mt-1">
                                    {!file ? 'WAITING...' : !analysis ? 'ANALYZING...' : 'COMPLETED'}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 flex-1">
                            <div className="space-y-3">
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${file && !analysis ? 'bg-amber-500/80 animate-pulse' : 'bg-teal-400'}`}
                                        initial={false}
                                        animate={{
                                            width: !file ? '0%' : !analysis ? '50%' : `${heroEstimate?.printability ?? 100}%`,
                                        }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                    <span className="text-white/50">PRINTABILITY</span>
                                    <span className={heroEstimate?.overflow ? 'text-amber-400' : 'text-teal-400'}>
                                        {!file ? '—' : !analysis ? '—' : heroEstimate?.overflow ? 'SIZE EXCEEDED' : `${heroEstimate?.printability ?? 100}%`}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-5 bg-white/[0.04] rounded-2xl border border-white/10 backdrop-blur-sm">
                                <div className="text-[10px] text-white/40 mb-3 font-black uppercase tracking-[0.2em]">Estimate (FDM)</div>
                                <div className={`text-2xl font-black ${!file || !analysis || !heroEstimate ? 'text-white/10' : 'text-white'}`}>
                                    {!file ? '₩ —' : !analysis ? '₩ —' : heroEstimate ? `₩ ${Math.round(heroEstimate.total).toLocaleString('ko-KR')}` : '₩ —'}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest transition-all"
                                    onClick={handleTrySample}
                                    disabled={isLoadingSample}
                                >
                                    {isLoadingSample ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        '샘플 견적 체험'
                                    )}
                                </Button>
                                <Link href="/quote" className="block" onClick={clearSampleIfPresent}>
                                    <Button
                                        size="sm"
                                        className="w-full h-12 rounded-xl bg-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-teal-400 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
                                    >
                                        <Zap className="w-4 h-4 mr-2 fill-current" />
                                        실시간 자동견적 시작
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
