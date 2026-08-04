'use client'

import Scene from "@/components/canvas/Scene"
import { Button } from "@/components/ui/button"
import QuotePanel from "@/components/quote/QuotePanel"
import FileUpload from "@/components/upload/FileUpload"
import Link from "next/link"
import { Box, Home, Loader2, Sparkles, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import { useFileStore } from "@/store/useFileStore"
import Header from "@/components/layout/Header"

const SAMPLES = [
    { id: 'cube', name: '기본 큐브', desc: '간단한 형상으로 견적 흐름을 빠르게 체험', path: '/test_cube.stl' },
] as const

export default function ExperiencePage() {
    const { file, baseAnalysis, setFile, reset } = useFileStore()
    const analysis = baseAnalysis
    const [step, setStep] = useState(1)
    const [loadingSample, setLoadingSample] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    const loadSample = useCallback(async (path: string) => {
        setLoadError(null)
        setLoadingSample(true)
        try {
            const res = await fetch(path)
            if (!res.ok) throw new Error('샘플을 불러올 수 없습니다.')
            const blob = await res.blob()
            const name = path.split('/').pop() || 'sample.stl'
            const f = new File([blob], name, { type: 'model/stl' })
            setFile(f)
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : '샘플을 불러오지 못했습니다.')
        } finally {
            setLoadingSample(false)
        }
    }, [setFile])

    useEffect(() => {
        if (file && analysis && step === 1) setStep(2)
    }, [file, analysis, step])

    const goBackToSelect = useCallback(() => {
        reset()
        setStep(1)
        setLoadError(null)
    }, [reset])

    return (
        <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col selection:bg-teal-500/30 overflow-hidden relative font-sans">
            <Header />

            {/* Premium Background System */}
            <div className="fixed inset-0 z-0">
                {/* Deep Base Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]" />
                
                {/* Dynamic Grid Pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.07] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                
                {/* Tech Glow Layers */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[140px] animate-pulse" />
            </div>

            <section className="flex-1 relative pt-20 z-10">
                <div className="h-[calc(100vh-5rem)] grid lg:grid-cols-[420px_1fr] xl:grid-cols-[460px_1fr]">

                    {/* Left: Control Panel - Glassmorphism UI */}
                    <div className="min-w-0 bg-white/5 backdrop-blur-3xl border-r border-white/10 flex flex-col overflow-hidden relative">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    /* Step 1: 모델 선택 */
                                    loadingSample ? (
                                        <motion.div
                                            key="loading-sample"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center min-h-[360px] space-y-8"
                                        >
                                            <div className="w-16 h-16 rounded-[2rem] bg-teal-400/10 border border-teal-400/20 flex items-center justify-center relative">
                                                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                                                <div className="absolute inset-0 bg-teal-400/20 blur-xl rounded-full animate-pulse" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h2 className="text-xl font-black text-white tracking-tight">샘플 모델 <span className="text-teal-400">로드 중</span></h2>
                                                <p className="text-sm font-bold text-white/30 tracking-widest uppercase">체험을 준비 중입니다...</p>
                                            </div>
                                        </motion.div>
                                    ) : file && !analysis ? (
                                        <motion.div
                                            key="analyzing"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex flex-col items-center justify-center min-h-[360px] space-y-8"
                                        >
                                            <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative">
                                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h2 className="text-xl font-black text-white tracking-tight">모델 <span className="text-indigo-400">정밀 분석 중</span></h2>
                                                <p className="text-sm font-bold text-white/30 tracking-widest uppercase">기하학 데이터 계산 중...</p>
                                            </div>
                                            <div className="w-full p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4 shadow-2xl backdrop-blur-md">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                                    <Box className="w-6 h-6 text-white/20" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[13px] font-black text-white truncate max-w-[200px]">{file.name}</div>
                                                    <div className="text-[10px] font-black text-white/30 tracking-widest uppercase mt-0.5">
                                                        {file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={goBackToSelect}
                                                className="text-[11px] font-black text-white/30 hover:text-white/60 tracking-[0.2em] uppercase transition-colors"
                                            >
                                                [ 분석 취소 ]
                                            </button>
                                        </motion.div>
                                    ) : loadError ? (
                                        <motion.div
                                            key="error"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center min-h-[320px] text-center space-y-8"
                                        >
                                            <div className="w-16 h-16 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                                                <div className="text-2xl font-black">!</div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[15px] text-white font-black tracking-tight">{loadError}</p>
                                                <p className="text-[11px] font-bold text-white/30 leading-relaxed uppercase tracking-widest px-4">샘플을 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
                                            </div>
                                            <div className="flex flex-col w-full gap-3 px-4">
                                                <Button onClick={() => loadSample(SAMPLES[0].path)} variant="outline" className="h-12 rounded-2xl border-white/10 text-white font-black hover:bg-white/5">
                                                    다시 시도하기
                                                </Button>
                                                <Link href="/quote" onClick={goBackToSelect} className="w-full">
                                                    <Button className="w-full h-12 rounded-2xl bg-white text-slate-950 font-black hover:bg-white/90 shadow-xl">본격 견적 이용하기</Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="select"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-10"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2.5 px-1">
                                                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400/80">프리미엄 체험</span>
                                                </div>
                                                <h1 className="text-4xl font-black text-white tracking-tight leading-[1.1]">체험할 모델<br /><span className="text-teal-400">선택하기</span></h1>
                                                <p className="text-[14px] font-bold text-white/40 leading-relaxed break-keep">준비된 샘플 모델을 선택하거나, 본인의 3D 파일을 업로드하여 Wow3D의 지능형 견적을 즉시 체험해보세요.</p>
                                            </div>

                                            <div className="space-y-5">
                                                <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.25em] px-1">엄선된 샘플 모델</span>
                                                <div className="grid gap-3">
                                                    {SAMPLES.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => loadSample(s.path)}
                                                            className="flex items-center gap-5 p-5 rounded-[2rem] border border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-teal-400/40 text-left transition-all group relative overflow-hidden active:scale-[0.98]"
                                                        >
                                                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <div className="w-14 h-14 rounded-2xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                                <Box className="w-7 h-7 text-teal-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-[17px] font-black text-white tracking-tight group-hover:text-teal-400 transition-colors">{s.name}</div>
                                                                <div className="text-[12px] font-bold text-white/30 mt-1 leading-tight">{s.desc}</div>
                                                            </div>
                                                            <div className="ml-auto w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                                                <Sparkles className="w-4 h-4 text-teal-400" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 py-2">
                                                <div className="flex-1 h-px bg-white/5" />
                                                <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">또는 직접 파일 업로드</span>
                                                <div className="flex-1 h-px bg-white/5" />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="p-1 rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl relative group">
                                                    <div className="absolute inset-0 bg-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                    <FileUpload variant="dark" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                ) : (
                                    /* Step 2: 견적 설정 */
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-8 pb-48"
                                    >
                                        <div className="flex items-center justify-between px-1">
                                            <h2 className="text-2xl font-black text-white tracking-tight">견적 <span className="text-teal-400">세부 설정</span></h2>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={goBackToSelect}
                                                    className="text-[11px] font-black text-white/30 hover:text-white/60 tracking-widest uppercase transition-colors"
                                                >
                                                    [ 모델 변경 ]
                                                </button>
                                                <span className="text-white/10">|</span>
                                                <Link href="/quote" onClick={goBackToSelect} className="text-[11px] font-black text-teal-400/80 hover:text-teal-400 tracking-widest uppercase">
                                                    본격 견적
                                                </Link>
                                            </div>
                                        </div>
                                        
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-teal-400/5 blur-3xl rounded-full opacity-30 pointer-events-none" />
                                            <QuotePanel embedded />
                                        </div>

                                        <div className="pt-8 border-t border-white/5 space-y-6">
                                            <p className="text-[12px] font-bold text-white/30 leading-relaxed break-keep px-1">
                                                * 현재 화면은 체험용 견적입니다. 실제 주문을 위한 정밀 분석 및 대량 주문 할인은 <Link href="/quote" onClick={goBackToSelect} className="text-teal-400 hover:underline">본격 견적</Link> 기능을 이용해 주세요.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Link href="/">
                                                    <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white font-black hover:bg-white/5 gap-3 shadow-xl group">
                                                        <Home className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" /> 메인으로
                                                    </Button>
                                                </Link>
                                                <Link href="/quote" onClick={goBackToSelect}>
                                                    <Button className="w-full h-14 rounded-2xl bg-teal-400 text-slate-950 font-black hover:bg-teal-300 gap-3 shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all active:scale-[0.98]">
                                                        <Zap className="w-4 h-4 fill-current" /> 본격 견적
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-white/[0.02] backdrop-blur-md">
                            <div className="flex items-center gap-3 text-[11px] font-black text-teal-400 uppercase tracking-[0.3em]">
                                <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                                <div className="w-2 h-2 rounded-full bg-teal-400 absolute opacity-50" />
                                샘플 체험 모드 활성
                            </div>
                        </div>
                    </div>

                    {/* Right: 3D Viewer */}
                    <div className="relative flex flex-col bg-[#080808]">
                        <div className="flex-1 relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none z-10" />
                            <div className="h-full w-full">
                                <Scene compact />
                            </div>

                             <div className="absolute top-8 left-8 flex flex-wrap items-center gap-3 z-20">
                                <div className="px-4 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 backdrop-blur-md text-[11px] font-black uppercase tracking-widest text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.15)]">
                                    프리미엄 샘플 체험
                                </div>
                                <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[11px] font-black text-white/40 uppercase tracking-widest">
                                    AI 분석 엔진 가동 중
                                </div>
                            </div>

                            {!file && !loadingSample && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                    <div className="w-28 h-28 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
                                        <Box className="w-12 h-12 text-white/10" />
                                    </div>
                                    <p className="mt-5 text-sm text-white/25 font-medium">모델을 선택하거나 업로드해 주세요</p>
                                </div>
                            )}
                        </div>

                        <div className="h-16 border-t border-white/10 bg-white/[0.02] backdrop-blur-sm flex items-center px-8 gap-8">
                            <div className="flex items-center gap-3 text-[11px] font-black text-white/30 uppercase tracking-[0.15em]">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]" /> 100종 이상의 소재
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-black text-white/30 uppercase tracking-[0.15em]">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> 24시간 내 제작
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-black text-white/30 uppercase tracking-[0.15em]">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" /> ±0.1mm 정밀도 보장
                            </div>
                            <div className="ml-auto text-[11px] font-black text-white/10 uppercase tracking-widest">
                                Powered by Wow3D Logic
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    )
}
