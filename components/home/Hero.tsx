'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFileStore, useEffectiveAnalysis } from '@/store/useFileStore';
import { useToast } from '@/hooks/use-toast';
import LandingHeroScene from './LandingHeroScene';
import { OG_IMAGE_ALT, OG_IMAGE_PATH } from '@/lib/site-url';

// 금액은 원화(KRW)로만 계산·표시. 자동견적(QuotePanel)과 동일한 공식·roundTo100·minPriceKr 적용
import {
    calculateFdmQuote,
    FDM_INFILL_DEFAULT,
} from '@/lib/fdm-quote';

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
    const router = useRouter();
    const { setFile, file, baseAnalysis, reset } = useFileStore();
    const analysis = useEffectiveAnalysis() ?? baseAnalysis;

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
        const volumeCm3 = analysis.volume || 0;
        const surfaceAreaCm2 = analysis.surfaceArea || 0;
        const heightMm = bz;
        const layerHeight = 0.2;
        const rateKRW = spec.layerCosts?.['0.2'] ?? spec.hourlyRate ?? 5000;

        // QuotePanel과 동일 모듈. 히어로는 빠른 미리보기용으로 인필 20%·지지대 OFF (VAT 미포함)
        const q = calculateFdmQuote({
            volumeCm3,
            surfaceAreaCm2,
            heightMm,
            density,
            pricePerGramKr,
            infillPercent: FDM_INFILL_DEFAULT,
            layerHeightMm: layerHeight,
            supportEnabled: false,
            hourlyRateKr: rateKRW,
            fdmLaborCostKrw: spec.fdm_labor_cost_krw,
            fdmSupportPerCm2Krw: spec.fdm_support_per_cm2_krw,
            fdmLayerHoursFactor: spec.fdm_layer_hours_factor,
            applyVat: false,
            minPriceKr: spec.minPriceKr,
        });

        return {
            total: q.total,
            printability: overflow ? 85 : 100,
            overflow,
            infillPercent: FDM_INFILL_DEFAULT,
            supportEnabled: false,
        };
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* 밝은 다크 좌우 그라데이션 배경 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            
            {/* 은은한 배경 이미지 레이어 */}
            <div 
                className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-[0.06] mix-blend-screen"
                style={{ backgroundAttachment: 'fixed' }}
            />

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

            <div className="container mx-auto px-4 z-10 grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)] gap-8 xl:gap-10 items-center">
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
                        <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-white/80 uppercase">Next-Gen 3D Printing</span>
                    </motion.div>

                    <h1 className="text-[2rem] sm:text-4xl md:text-[2.8rem] lg:text-[3.2rem] xl:text-[3.8rem] font-black tracking-tight mb-6 leading-[1.2] break-keep text-white">
                        <span className="text-teal-400 block text-xs sm:text-sm md:text-base mb-4 font-black uppercase tracking-[0.3em] opacity-90">WOW3D PRO</span>
                        3D프린팅출력 · 3D프린터출력<br />
                        <span className="text-teal-400 relative inline-block mt-2">
                            시제품제작 서비스
                            <svg className="absolute w-full h-2 sm:h-3 -bottom-1 left-0 text-teal-400/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-white/70 mb-10 max-w-xl leading-relaxed break-keep font-medium">
                        파일 업로드 → 가격·제작기간 확인 → 주문·결제.<br className="hidden sm:block" />
                        STL·OBJ·3MF·PLY는 즉시 <span className="text-teal-400 font-bold">자동견적</span>, STEP·STP는 업로드 시 자동 변환합니다.
                    </p>

                    {/* 모바일 전용 AI 견적 정보 카드 (Hidden on Desktop) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:hidden flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
                    >
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[11px] font-black text-teal-400 uppercase tracking-widest leading-none mb-1">AI Intelligence</div>
                            <div className="text-sm font-bold text-white tracking-tight leading-tight uppercase">99% 정확도 실시간 자동 견적</div>
                        </div>
                    </motion.div>

                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-14">
                        <Link href="/quote" className="w-full sm:w-auto order-first sm:order-none">
                            <Button size="lg" className="w-full h-14 sm:h-16 px-8 sm:px-10 text-[15px] sm:text-[17px] rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:shadow-[0_0_40px_rgba(45,212,191,0.5)] transition-all gap-3 font-black uppercase tracking-widest relative overflow-hidden group">
                                <motion.div 
                                    className="absolute inset-0 bg-white/30"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                />
                                <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current relative z-10" />
                                <span className="relative z-10">실시간 자동견적 시작</span>
                                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <Link href="/print-methods" className="flex-1 sm:flex-none">
                                <Button size="lg" variant="outline" className="w-full h-14 sm:h-16 px-6 sm:px-8 text-[14px] sm:text-[15px] rounded-2xl bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all font-bold">
                                    출력방식
                                </Button>
                            </Link>
                            <Link href="/materials" className="flex-1 sm:flex-none">
                                <Button size="lg" variant="outline" className="w-full h-14 sm:h-16 px-6 sm:px-8 text-[14px] sm:text-[15px] rounded-2xl bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all font-bold">
                                    소재보기
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-white/50">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#111827] bg-white/10 flex items-center justify-center text-xs font-bold overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col text-left">
                            <div className="font-bold text-sm sm:text-base text-white leading-tight">1,000+ Verified Customers</div>
                            <div className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-teal-500/80 mt-0.5">최적의 출력 파트너</div>
                        </div>
                    </div>

                    {/* 네이버 검색 썸네일 수집용 대표 제품 사진 (본문 <img>, CSS background 아님) */}
                    <figure className="mt-8 max-w-sm">
                        <img
                            src={OG_IMAGE_PATH}
                            alt={OG_IMAGE_ALT}
                            width={1200}
                            height={1200}
                            className="w-full aspect-square max-h-44 sm:max-h-52 rounded-2xl object-cover border border-white/10 shadow-2xl"
                            fetchPriority="high"
                            decoding="async"
                        />
                        <figcaption className="mt-2 text-[11px] font-bold text-white/35 tracking-wide">
                            WOW3D 3D프린팅출력 · 3D프린터출력 제작 사례
                        </figcaption>
                    </figure>
                </motion.div>

                {/* Right Visual — 두 카드 동일 비율, 겹침 없이 나란히 */}
                <div className="relative w-full hidden lg:grid grid-cols-2 gap-4 xl:gap-5 items-stretch">
                    {/* Card 1: AI Quote Analysis */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="min-w-0"
                    >
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.5,
                            }}
                            className="h-full min-h-[460px] xl:min-h-[500px] rounded-[2rem] xl:rounded-[2.5rem] border border-white/10 bg-[#0f172a]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 xl:p-7 flex flex-col ring-1 ring-white/5"
                        >
                            <div className="flex items-center gap-3 xl:gap-4 mb-6">
                                <div className={`w-12 h-12 xl:w-14 xl:h-14 rounded-2xl flex items-center justify-center shrink-0 ${file && !analysis ? 'bg-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/10' : analysis ? 'bg-teal-500/10 text-teal-400 shadow-lg shadow-teal-500/5' : 'bg-white/5 text-white/20'}`}>
                                    {file && !analysis ? <Loader2 className="w-6 h-6 xl:w-7 xl:h-7 animate-spin" /> : <Sparkles className="w-6 h-6 xl:w-7 xl:h-7" />}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-black text-white text-lg xl:text-xl tracking-tight">AI 견적 분석</div>
                                    <div className="text-[10px] xl:text-[11px] text-white/60 font-black uppercase tracking-widest mt-1">
                                        {!file ? 'WAITING...' : !analysis ? 'ANALYZING...' : 'COMPLETED'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col flex-1 gap-5">
                                <div className="space-y-3">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${file && !analysis ? 'bg-amber-500/80 animate-pulse' : 'bg-teal-400'}`}
                                            initial={false}
                                            animate={{
                                                width: !file ? '0%' : !analysis ? '50%' : `${heroEstimate?.printability ?? 100}%`,
                                            }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] xl:text-[11px] font-black uppercase tracking-widest gap-2">
                                        <span className="text-white/50">PRINTABILITY</span>
                                        <span className={heroEstimate?.overflow ? 'text-amber-400' : 'text-teal-400'}>
                                            {!file ? '—' : !analysis ? '—' : heroEstimate?.overflow ? 'SIZE EXCEEDED' : `${heroEstimate?.printability ?? 100}%`}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center p-4 xl:p-5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm min-h-[110px]">
                                    <div className="text-[10px] text-white/40 mb-2 font-black uppercase tracking-[0.2em]">Estimate (FDM)</div>
                                    <div className={`text-2xl xl:text-3xl font-black tracking-tight ${!file || !analysis || !heroEstimate ? 'text-white/10' : 'text-white'}`}>
                                        {!file ? '₩ —' : !analysis ? '₩ —' : heroEstimate ? `₩ ${Math.round(heroEstimate.total).toLocaleString('ko-KR')}` : '₩ —'}
                                    </div>
                                    <p className="mt-2 text-[11px] xl:text-[12px] text-white/45 font-medium break-keep leading-relaxed">
                                        미리보기 견적(인필 {FDM_INFILL_DEFAULT}% · 지지대 미포함 · VAT 별도). 상세 옵션은 자동견적에서 조정하세요.
                                    </p>
                                </div>

                                <div className="space-y-2.5 mt-auto pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-11 xl:h-12 rounded-xl border-white/25 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] xl:text-[11px] uppercase tracking-widest transition-all"
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
                                            className="w-full h-12 xl:h-14 rounded-xl bg-teal-400 text-slate-950 font-black text-[10px] xl:text-[11px] uppercase tracking-widest hover:bg-teal-300 shadow-[0_0_30px_rgba(45,212,191,0.4)] active:scale-95 transition-all relative overflow-hidden group"
                                        >
                                            <motion.div
                                                className="absolute inset-0 bg-white/20"
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            />
                                            <Zap className="w-4 h-4 mr-2 fill-current relative z-10" />
                                            <span className="relative z-10">실시간 자동견적 시작</span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Card 2: 3D Model Support */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.25 }}
                        className="min-w-0"
                    >
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="relative h-full min-h-[460px] xl:min-h-[500px] rounded-[2rem] xl:rounded-[2.5rem] border border-white/10 bg-[#0f172a]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col ring-1 ring-white/5"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:20px_20px] rounded-[2rem]" />

                            <div className="relative p-5 xl:p-7 pb-4 border-b border-white/5">
                                <h3 className="text-lg xl:text-xl font-black text-white tracking-tight mb-2">3D 모델 지원</h3>
                                <p className="text-[12px] xl:text-[13px] font-bold text-white/60 leading-relaxed break-keep">
                                    STL·OBJ·3MF·PLY는 즉시 자동견적, STEP·STP는 업로드 시 자동 변환 후 견적을 제공합니다.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-1.5 xl:gap-2">
                                    {['STL', 'OBJ', '3MF', 'PLY', 'STEP', 'STP'].map((fmt) => (
                                        <span
                                            key={fmt}
                                            className="px-2.5 py-1 xl:px-3 xl:py-1.5 rounded-xl bg-teal-500/10 border border-teal-400/20 text-[10px] xl:text-[11px] font-black text-teal-400 tracking-widest uppercase"
                                        >
                                            .{fmt.toLowerCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="relative flex-1 w-full min-h-[160px] xl:min-h-[200px]">
                                <LandingHeroScene />
                            </div>

                            <div className="relative px-5 xl:px-6 pb-5 pt-2 border-t border-white/5">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] xl:text-[11px] text-white/60 font-medium">
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
                                <p className="mt-2 text-[10px] text-white/70 font-medium break-keep">
                                    파일을 업로드하면 3D 미리보기와 상세 견적이 활성화됩니다.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
