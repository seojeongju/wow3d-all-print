'use client'

import Scene from "@/components/canvas/Scene";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/upload/FileUpload";
import QuotePanel from "@/components/quote/QuotePanel";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info, Boxes, FileBox, Loader2, FileText, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useFileStore } from "@/store/useFileStore";

export default function QuotePage() {
    const { file, analysis, reset } = useFileStore();
    const [step, setStep] = useState(1); // 1: Upload, 2: Configure

    // Auto-advance to step 2 when file is uploaded and analyzed (in useEffect to avoid setState during render)
    useEffect(() => {
        if (file && analysis && step === 1) setStep(2);
    }, [file, analysis, step]);

    return (
        <main className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-primary/30 overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-20" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] opacity-20" />
            </div>

            {/* Premium Header */}
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

                        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                            {[
                                { id: 1, label: "업로드", active: step >= 1 },
                                { id: 2, label: "견적 설정", active: step >= 2 },
                                { id: 3, label: "주문 완료", active: step >= 3 },
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
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/quotes" className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all">
                            <FileText className="w-4 h-4" /> 저장 목록
                        </Link>
                        <Link href="/cart" className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all">
                            <ShoppingCart className="w-4 h-4" /> 장바구니
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 border border-white/5">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                나가기
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <section className="flex-1 relative">
                <div className="h-full grid lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr]">

                    {/* Left Sidebar: Settings Panel - min-h-0으로 스크롤 영역 정상 동작 */}
                    <div className="bg-black/60 backdrop-blur-3xl border-r border-white/5 h-[calc(100vh-4.5rem)] flex flex-col overflow-hidden relative z-10">
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 pb-8 space-y-6">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    // 파일 있음 + 분석 대기: 업로드 UI 대신 "분석 중" 전용 화면 (샘플 견적 등에서 진입 시 리다이렉트처럼 보이는 현상 방지)
                                    file && !analysis ? (
                                        <motion.div
                                            key="analyzing"
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
                                                    모델 <span className="text-primary">분석 중</span>
                                                </h1>
                                                <p className="text-white/50 text-sm break-keep">
                                                    부피·표면적을 계산하고 있습니다.
                                                    <br />
                                                    잠시만 기다려 주세요.
                                                </p>
                                            </div>
                                            <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                                    <FileBox className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium truncate">{file.name}</div>
                                                    <div className="text-xs text-white/40">{file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                    <motion.div
                                        key="upload"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                새로운 프로젝트 <br />
                                                <span className="text-primary">시작하기</span>
                                            </h1>
                                            <p className="text-white/50 text-sm">
                                                STL, OBJ, 3MF, PLY 파일을 드래그하여 업로드하세요. <br />
                                                자동으로 지오메트리를 분석합니다.
                                            </p>
                                        </div>
                                        <div className="p-1 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10">
                                            <FileUpload />
                                        </div>

                                        <div className="pt-8 grid gap-4">
                                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-all">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-semibold">초정밀 분석</h3>
                                                    <p className="text-xs text-white/40 leading-relaxed">부피, 표면적, 출력 예상 시간을 정밀 계산 엔진이 분석합니다.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-all">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                    <Info className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-semibold">보안 클라우드</h3>
                                                    <p className="text-xs text-white/40 leading-relaxed">업로드된 모든 파일은 암호화되어 안전하게 처리됩니다.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                    )
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <div className="mb-6 flex items-center justify-between">
                                            <h2 className="text-xl font-bold">견적 세부 설정</h2>
                                            <button
                                                onClick={() => { reset(); setStep(1); }}
                                                className="text-xs text-primary hover:underline"
                                            >
                                                파일 재업로드
                                            </button>
                                        </div>
                                        <QuotePanel />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sidebar Footer - 컴팩트 */}
                        <div className="shrink-0 px-6 py-3 border-t border-white/5 bg-black/40">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                보안 분석 엔진
                            </div>
                        </div>
                    </div>

                    {/* Right Column: 3D Visualization */}
                    <div className="relative flex flex-col bg-[#080808]">
                        <div className="flex-1 relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10" />
                            <div className="h-full w-full">
                                <Scene />
                            </div>

                            {/* Viewer HUD */}
                            <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
                                <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/60">
                                    3D Viewer Engine V2.0
                                </div>
                            </div>

                            {!file && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-32 h-32 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center animate-pulse">
                                        <Boxes className="w-10 h-10 text-white/10" />
                                    </div>
                                    <p className="mt-6 text-sm text-white/20 font-medium italic">파일을 업로드하면 3D 미리보기가 활성화됩니다.</p>
                                </div>
                            )}
                        </div>

                        {/* Bottom Info Bar */}
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
