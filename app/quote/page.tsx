'use client'

import Scene from "@/components/canvas/Scene";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/upload/FileUpload";
import QuotePanel from "@/components/quote/QuotePanel";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info, Boxes, FileBox, Loader2, FileText, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useFileStore } from "@/store/useFileStore";
import { useSearchParams } from "next/navigation";

function QuoteContent() {
    const { file, analysis, reset, setFile } = useFileStore();
    const [step, setStep] = useState(1); // 1: Upload, 2: Configure
    const searchParams = useSearchParams();
    const loadQuoteId = searchParams.get('load_quote_id');
    const [loadedQuote, setLoadedQuote] = useState<any>(null); // DB quote data

    // Load quote data if ID is present
    useEffect(() => {
        if (!loadQuoteId) return;

        const load = async () => {
            try {
                // Fetch quote data
                const res = await fetch(`/api/quotes/${loadQuoteId}`);
                const json = await res.json();

                if (json.success && json.data) {
                    const q = json.data;
                    setLoadedQuote(q);

                    // Fetch and set file if URL exists
                    if (q.file_url) {
                        const fileRes = await fetch(q.file_url);
                        const blob = await fileRes.blob();
                        const newFile = new File([blob], q.file_name, { type: blob.type });
                        setFile(newFile);
                        // setStep(2) will be triggered by the existing useEffect when analysis is complete
                    }
                }
            } catch (error) {
                console.error("Failed to load quote:", error);
            }
        };

        load();
    }, [loadQuoteId, setFile]);

    const SAMPLE_NAMES = ['sample_cube.stl', 'test_cube.stl', 'jet_engine_rotor.stl'];

    // 샘플 견적 체험 후 실시간 견적 진입 시: 샘플 파일이면 제거 (업로드부터 다시)
    useEffect(() => {
        const checkAndResetSample = () => {
            const f = useFileStore.getState().file;
            if (f && SAMPLE_NAMES.includes(f.name)) {
                useFileStore.getState().reset();
                setStep(1);
            }
        };
        checkAndResetSample();
    }, [setStep]);

    // Auto-advance to step 2 when file is uploaded and analyzed (in useEffect to avoid setState during render)
    useEffect(() => {
        if (file && analysis && step === 1) setStep(2);
    }, [file, analysis, step]);

    // Go back to step 1 if the file is removed
    useEffect(() => {
        if (!file && step !== 1) setStep(1);
    }, [file, step]);

    return (
        <main className="min-h-screen relative text-slate-100 flex flex-col selection:bg-teal-500/30 overflow-hidden">
            {/* 프리미엄 배경 시스템 (Hero와 동일) */}
            <div className="fixed inset-0 z-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            
            {/* 틸/블루 은은한 포인트 오버레이 */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.06),transparent_50%)]" />

            {/* 그리드 배경 */}
            <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]" />

            {/* 배경 글로우 포인트들 */}
            <div className="fixed left-0 top-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/15 blur-[130px] z-0 pointer-events-none" />
            <div className="fixed right-0 bottom-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] z-0 pointer-events-none" />
            <div className="fixed left-1/2 -translate-x-1/2 top-0 w-[300px] h-[300px] rounded-full bg-purple-800/10 blur-[100px] z-0 pointer-events-none" />

            {/* Premium Header - 고대비 텍스트 및 유리 질감 */}
            <header className="relative z-50 border-b border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-all active:scale-95 group">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
                                <Boxes className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-xl tracking-tight text-white">
                                    Wow3D <span className="text-teal-400 font-light">Pro</span>
                                </span>
                                <span className="text-[10px] font-black text-white/50 leading-tight mt-0.5 uppercase tracking-[0.2em]">
                                    AI Auto Quoting System
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                            {[
                                { id: 1, label: "업로드", active: step >= 1 },
                                { id: 2, label: "견적 설정", active: step >= 2 },
                                { id: 3, label: "주문 완료", active: step >= 3 },
                            ].map((item) => (
                                <div
                                    key={item.id}
                                    className={`px-6 py-2 rounded-full text-xs font-black transition-all ${item.id === step
                                        ? "bg-white text-slate-950 shadow-xl"
                                        : item.active
                                            ? "text-white/80 hover:bg-white/5 cursor-pointer"
                                            : "text-white/30"
                                        }`}
                                >
                                    {item.label}
                                </div>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/quotes" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all">
                            <FileText className="w-4 h-4" /> 저장 목록
                        </Link>
                        <Link href="/cart" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all">
                            <ShoppingCart className="w-4 h-4" /> 장바구니
                        </Link>
                        <Link href="/">
                            <Button variant="outline" size="sm" className="rounded-xl bg-white/5 border-white/15 text-white/70 hover:text-white hover:bg-white/10 px-5 font-bold transition-all">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                나가기
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <section className="flex-1 relative z-10">
                <div className="h-full grid lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr]">

                    {/* Left Sidebar: Settings Panel - 유리 질감 디자인 */}
                    <div className="bg-black/20 backdrop-blur-[20px] border-r border-white/10 h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar p-8 pb-10 space-y-8">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    // 파일 있음 + 분석 대기
                                    file && !analysis ? (
                                        <motion.div
                                            key="analyzing"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="space-y-8 flex flex-col items-center justify-center min-h-[400px]"
                                        >
                                            <div className="w-24 h-24 rounded-[2.5rem] bg-teal-400/10 border border-teal-400/20 flex items-center justify-center relative group">
                                                <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
                                                <div className="absolute inset-0 rounded-[2.5rem] bg-teal-400/20 blur-2xl animate-pulse group-hover:blur-3xl transition-all" />
                                            </div>
                                            <div className="text-center space-y-3">
                                                <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
                                                    모델 <span className="text-teal-400">정밀 분석 중</span>
                                                </h1>
                                                <p className="text-white/60 text-sm break-keep font-bold leading-relaxed">
                                                    부피·표면적·출력 시간을 계산하고 있습니다.
                                                    <br />
                                                    최적의 견적을 산출하기 위해 잠시만 기다려 주세요.
                                                </p>
                                            </div>
                                            <div className="w-full p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4 shadow-xl">
                                                <div className="w-14 h-14 rounded-2xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center text-teal-400 shrink-0">
                                                    <FileBox className="w-7 h-7" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black text-white truncate">{file.name}</div>
                                                    <div className="text-[11px] font-black text-white/40 tracking-[0.1em] uppercase mt-0.5">{file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="upload"
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            className="space-y-10"
                                        >
                                            <div className="space-y-4">
                                                <h1 className="text-4xl font-black tracking-tight text-white leading-[1.15]">
                                                    새로운 프로젝트 <br />
                                                    <span className="text-teal-400">시작하기</span>
                                                </h1>
                                                <p className="text-white/70 text-[15px] font-bold leading-relaxed break-keep">
                                                    STL, STEP, OBJ 등 3D 파일을 업로드하세요. <br />
                                                    지능형 분석 엔진이 실시간으로 비용을 산출합니다.
                                                </p>
                                            </div>
                                            <div className="p-1 rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl relative group">
                                                <div className="absolute inset-0 bg-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                <FileUpload variant="dark" />
                                            </div>

                                            <div className="pt-2 grid gap-4">
                                                <div className="flex items-start gap-5 p-6 rounded-[2rem] bg-white/5 border border-white/10 group hover:border-teal-400/40 transition-all hover:bg-teal-400/5">
                                                    <div className="w-14 h-14 rounded-2xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                                                        <CheckCircle2 className="w-7 h-7" />
                                                    </div>
                                                    <div className="space-y-1.5 pt-1">
                                                        <h3 className="text-[15px] font-black text-white">정밀 견적 분석</h3>
                                                        <p className="text-[13px] text-white/50 leading-relaxed font-bold">부피, 표면적, 예상 소요 시간을 99% 정확도로 분석합니다.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-5 p-6 rounded-[2rem] bg-white/5 border border-white/10 group hover:border-indigo-500/40 transition-all hover:bg-indigo-500/5">
                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                        <Info className="w-7 h-7" />
                                                    </div>
                                                    <div className="space-y-1.5 pt-1">
                                                        <h3 className="text-[15px] font-black text-white">강력한 파일 보호</h3>
                                                        <p className="text-[13px] text-white/50 leading-relaxed font-bold">업로드된 자산은 AES-256 암호화되어 안전하게 처리됩니다.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 30 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex items-center justify-between px-1">
                                            <h2 className="text-2xl font-black text-white tracking-tight">견적 세부 설정</h2>
                                            <button
                                                onClick={() => { reset(); setStep(1); }}
                                                className="text-[13px] text-teal-400 hover:text-teal-300 font-black tracking-tight hover:underline transition-all flex items-center gap-1.5"
                                            >
                                                파일 교체
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <QuotePanel initialQuote={loadedQuote} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sidebar Footer */}
                        <div className="shrink-0 px-8 py-6 border-t border-white/10 bg-black/40 backdrop-blur-md">
                            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white/40 font-black">
                                <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.6)]" />
                                <span className="text-white/30">SYSTEM STATUS:</span>
                                <span className="text-teal-400/80">V3.5 MASTER ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: 3D Visualization - 더욱 투명하고 세련된 뷰어 환경 */}
                    <div className="relative flex flex-col bg-slate-950/20 backdrop-blur-[2px] overflow-hidden">
                        <div className="flex-1 relative group">
                            <div className="h-full w-full relative z-0">
                                <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="w-12 h-12 text-teal-400/30 animate-spin" /></div>}>
                                    <Scene />
                                </Suspense>
                            </div>

                            {/* Viewer HUD */}
                            <div className="absolute top-10 left-10 flex flex-col gap-4 z-20 pointer-events-none">
                                <div className="px-6 py-3 rounded-[1.25rem] bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-black tracking-[0.25em] uppercase text-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                    3D Viewer Engine V3.5
                                </div>
                            </div>

                            {!file && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                    <div className="w-40 h-40 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm flex items-center justify-center animate-pulse relative">
                                        <Boxes className="w-12 h-12 text-white/10" />
                                        <div className="absolute inset-0 rounded-full border border-teal-400/20 scale-150 blur-xl" />
                                    </div>
                                    <div className="mt-10 text-center space-y-2">
                                        <p className="text-white/30 text-lg font-bold tracking-tight">STANDBY FOR INPUT</p>
                                        <p className="text-white/20 text-sm font-medium italic">파일을 업로드하면 고해상도 3D 미리보기가 활성화됩니다.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Info Bar - 고대비 정보 레이아웃 */}
                        <div className="h-24 border-t border-white/10 bg-black/60 backdrop-blur-xl flex items-center px-12 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                            <div className="flex items-center gap-12 text-[12px] font-black tracking-[0.25em] uppercase text-white/50">
                                <div className="flex items-center gap-4 group transition-all hover:text-white/90 cursor-default">
                                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
                                    30종+ 고성능 소재
                                </div>
                                <div className="flex items-center gap-4 group transition-all hover:text-white/90 cursor-default">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                                    실시간 지능형 견적
                                </div>
                                <div className="flex items-center gap-4 group transition-all hover:text-white/90 cursor-default">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                    ±0.1mm 정밀 제작
                                </div>
                            </div>
                            <div className="ml-auto text-right">
                                <div className="text-[14px] font-black text-white/20 tracking-[0.1em] uppercase">WOW3D MASTER Pro</div>
                                <div className="text-[10px] font-bold text-teal-400/40 tracking-[0.3em] uppercase mt-1">Industrial Intelligence</div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    );
}

export default function QuotePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        }>
            <QuoteContent />
        </Suspense>
    )
}
