'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Cuboid, Loader2, Zap, Palette } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFileStore } from '@/store/useFileStore';
import { useToast } from '@/hooks/use-toast';

export default function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);
    const router = useRouter();
    const { setFile, reset } = useFileStore();
    const { toast } = useToast();
    const [isLoadingSample, setIsLoadingSample] = useState(false);

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
            {/* Background Elements */}
            <div className="absolute inset-0 bg-background">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
                <div className="absolute right-0 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-purple-500/20 opacity-20 blur-[120px]" />
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
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-secondary mb-6 backdrop-blur-md"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground">차세대 3D 프린팅 서비스</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] word-keep-all text-balance">
                        당신의 <br />
                        <span className="text-primary relative inline-block">
                            상상력을
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        </span>
                        <br />
                        현실로 만듭니다.
                    </h1>

                    <p className="text-xl text-muted-foreground/90 mb-8 max-w-lg leading-relaxed break-keep">
                        AI 기반 실시간 견적부터 전문가급 정밀 출력까지.<br />
                        시제품 제작부터 양산까지, WOW3D가 함께합니다.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/print-methods">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-[0_4px_14px_0_rgb(0,118,255,0.35)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.25)] hover:scale-[1.02] transition-all gap-2">
                                3D 프린터 출력방식 (FDM, SLA, DLP)
                                <ArrowRight className="w-5 h-5 shrink-0" />
                            </Button>
                        </Link>
                        <Link href="/materials">
                            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full bg-secondary text-secondary-foreground shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 hover:scale-[1.02] transition-all gap-2">
                                <Palette className="w-5 h-5 shrink-0" />
                                소재 살펴보기
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-12 flex items-center gap-8 text-muted-foreground">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-400" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="font-bold text-foreground">1,000+</div>
                            <div className="text-sm">고객 만족 후기</div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Visual - 3D 지원 정보 카드 + 플레이스홀더 */}
                <div className="relative h-[600px] w-full hidden lg:block perspective-1000">
                    <motion.div
                        style={{ y: y1, rotateX: 5, rotateY: -5 }}
                        className="absolute right-0 top-10 w-[400px] min-h-[480px] rounded-[2rem] border border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl shadow-2xl shadow-black/30 z-10 overflow-hidden flex flex-col"
                    >
                        {/* 그리드 배경 */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:20px_20px] rounded-[2rem]" />

                        {/* 상단: 타이틀 + 지원 형식 텍스트 */}
                        <div className="relative p-6 pb-4 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white tracking-tight mb-1">3D 모델 지원</h3>
                            <p className="text-[13px] text-white/50 leading-relaxed">
                                STL, OBJ, 3MF, PLY, STEP, STP를 업로드하면 AI가 부피·표면적을 분석해 실시간 견적을 제공합니다.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {['STL', 'OBJ', '3MF', 'PLY', 'STEP', 'STP'].map((fmt) => (
                                    <span
                                        key={fmt}
                                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80 tracking-wide"
                                    >
                                        .{fmt.toLowerCase()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 중앙: 3D 플레이스홀더 */}
                        <div className="relative flex-1 flex items-center justify-center min-h-[200px] p-6">
                            <motion.div
                                animate={{ rotate: [0, 8, -8, 0], y: [0, -12, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-36 h-36 rounded-2xl bg-gradient-to-br from-primary/90 via-primary/70 to-purple-600 flex items-center justify-center shadow-xl shadow-primary/25"
                            >
                                <Cuboid className="w-16 h-16 text-white/95" strokeWidth={1.5} />
                            </motion.div>
                        </div>

                        {/* 하단: 부가 정보 텍스트 */}
                        <div className="relative px-6 pb-6 pt-2 border-t border-white/5">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-white/40 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500/80" />
                                    최대 100MB
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-primary/80" />
                                    실시간 견적
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-blue-500/80" />
                                    암호화 업로드
                                </span>
                            </div>
                            <p className="mt-3 text-[10px] text-white/30">
                                파일을 업로드하면 3D 미리보기와 상세 견적이 활성화됩니다.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        style={{ y: y2 }}
                        className="absolute left-10 bottom-20 w-[280px] h-[420px] bg-card rounded-[30px] shadow-2xl border border-border p-6 z-20"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold">AI 견적 분석</div>
                                <div className="text-xs text-muted-foreground">분석 완료</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full w-[90%] bg-green-500 rounded-full" />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">출력 가능성</span>
                                <span className="font-bold text-green-500">98%</span>
                            </div>
                            <div className="mt-8 p-4 bg-secondary/50 rounded-xl">
                                <div className="text-xs text-muted-foreground mb-1">예상 견적가</div>
                                <div className="text-2xl font-bold">₩ 24,500</div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-4 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                                onClick={handleTrySample}
                                disabled={isLoadingSample}
                            >
                                {isLoadingSample ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    '샘플 견적 체험'
                                )}
                            </Button>
                            <Link href="/quote" className="block mt-3" onClick={() => reset()}>
                                <Button
                                    size="sm"
                                    className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold shadow-[0_4px_14px_0_rgba(0,118,255,0.4)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.5)] hover:from-primary hover:to-primary/95 ring-2 ring-primary/30 transition-all"
                                >
                                    <Zap className="w-4 h-4 mr-2 fill-current" />
                                    AI실시간 자동견적하기
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
