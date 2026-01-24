'use client'

import Scene from "@/components/canvas/Scene";
import { Button } from "@/components/ui/button";
import QuotePanel from "@/components/quote/QuotePanel";
import Link from "next/link";
import { ArrowLeft, Boxes, FileBox, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useFileStore } from "@/store/useFileStore";

export default function ExperiencePage() {
    const { file, analysis, setFile, reset } = useFileStore();
    const [step, setStep] = useState(1);
    const [loadingSample, setLoadingSample] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const loadSample = useCallback(async () => {
        setLoadError(null);
        setLoadingSample(true);
        try {
            const res = await fetch('/test_cube.stl');
            if (!res.ok) throw new Error('샘플 파일을 불러올 수 없습니다.');
            const blob = await res.blob();
            const f = new File([blob], 'sample_cube.stl', { type: 'model/stl' });
            setFile(f);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : '샘플을 불러오지 못했습니다.');
        } finally {
            setLoadingSample(false);
        }
    }, [setFile]);

    // 체험 페이지 진입 시 파일 없으면 샘플 로드 (직접 /experience 접속 시)
    useEffect(() => {
        if (file) return;
        loadSample();
    }, [file, loadSample]);

    useEffect(() => {
        if (file && analysis && step === 1) setStep(2);
    }, [file, analysis, step]);

    return (
        <main className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-primary/30 overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-20" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] opacity-20" />
            </div>

            <header className="border-b border-white/5 backdrop-blur-xl sticky top-0 z-50 bg-black/40">
                <div className="container mx-auto px-6 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all active:scale-95 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                                <Boxes className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                Wow3D <span className="text-primary font-light">Pro</span>
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                                샘플 체험
                            </span>
                            <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                                {[
                                    { id: 1, label: "체험", active: step >= 1 },
                                    { id: 2, label: "견적 설정", active: step >= 2 },
                                ].map((item) => (
                                    <div
                                        key={item.id}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${item.id === step
                                                ? "bg-white text-black shadow-lg"
                                                : item.active
                                                    ? "text-white/60"
                                                    : "text-white/30"
                                            }`}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 border border-white/5">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            나가기
                        </Button>
                    </Link>
                </div>
            </header>

            <section className="flex-1 relative">
                <div className="h-full grid lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr]">

                    <div className="bg-black/60 backdrop-blur-3xl border-r border-white/5 h-[calc(100vh-4.5rem)] flex flex-col overflow-hidden relative z-10">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    loadingSample || (file && !analysis) ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8 flex flex-col items-center justify-center min-h-[320px]"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h1 className="text-2xl font-bold tracking-tight">
                                                    {loadingSample ? '샘플을 불러오는 중' : <>모델 <span className="text-primary">분석 중</span></>}
                                                </h1>
                                                <p className="text-white/50 text-sm break-keep">
                                                    {loadingSample
                                                        ? '견적 체험용 샘플 모델을 준비하고 있습니다.'
                                                        : '부피·표면적을 계산하고 있습니다. 잠시만 기다려 주세요.'}
                                                </p>
                                            </div>
                                            {file && !loadingSample && (
                                                <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                                        <FileBox className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium truncate">{file.name}</div>
                                                        <div className="text-xs text-white/40">{file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : loadError ? (
                                        <motion.div
                                            key="error"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-6 flex flex-col items-center justify-center min-h-[280px] text-center"
                                        >
                                            <p className="text-white/70">{loadError}</p>
                                            <div className="flex gap-3">
                                                <Button onClick={loadSample} variant="outline" size="sm" className="border-white/20">
                                                    다시 시도
                                                </Button>
                                                <Link href="/quote" onClick={() => reset()}>
                                                    <Button size="sm">본격 견적하기</Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[200px]" />
                                    )
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <div className="mb-6 flex items-center justify-between">
                                            <h2 className="text-xl font-bold">견적 세부 설정</h2>
                                            <Link href="/quote" onClick={() => reset()}>
                                                <button className="text-xs text-primary hover:underline">
                                                    본격 견적하러 가기
                                                </button>
                                            </Link>
                                        </div>
                                        <QuotePanel />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-black/40">
                            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                샘플 체험 모드
                            </div>
                        </div>
                    </div>

                    <div className="relative flex flex-col bg-[#080808]">
                        <div className="flex-1 relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10" />
                            <div className="h-full w-full">
                                <Scene />
                            </div>

                            <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
                                <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold tracking-widest uppercase text-amber-400/90">
                                    샘플 체험
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/60">
                                    3D Viewer Engine V2.0
                                </div>
                            </div>

                            {!file && !loadingSample && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-32 h-32 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center animate-pulse">
                                        <Boxes className="w-10 h-10 text-white/10" />
                                    </div>
                                    <p className="mt-6 text-sm text-white/20 font-medium italic">샘플을 불러오는 중…</p>
                                </div>
                            )}
                        </div>

                        <div className="h-16 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center px-8 relative z-20">
                            <div className="flex items-center gap-8 text-xs font-bold tracking-widest uppercase text-white/40">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    100종+ 소재
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    24시간 내 제작
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    ±0.2mm 정밀도
                                </div>
                            </div>
                            <div className="ml-auto text-[10px] text-white/20">
                                WOW3D 프로페셔널 엔진
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    );
}
