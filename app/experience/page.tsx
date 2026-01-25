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
    const { file, analysis, setFile, reset } = useFileStore()
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
        <main className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-primary/30 overflow-hidden">
            <Header />

            {/* Ambient orbs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/15 rounded-full blur-[100px]" />
            </div>

            <section className="flex-1 relative pt-24">
                <div className="h-[calc(100vh-6rem)] grid lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">

                    {/* Left: Control Panel */}
                    <div className="min-w-0 bg-black/50 backdrop-blur-2xl border-r border-white/5 flex flex-col overflow-hidden relative z-10">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    /* Step 1: 모델 선택 */
                                    loadingSample ? (
                                        <motion.div
                                            key="loading-sample"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center min-h-[320px] space-y-6"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                                <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                                            </div>
                                            <div className="text-center space-y-1">
                                                <h2 className="text-lg font-semibold text-white">샘플을 불러오는 중</h2>
                                                <p className="text-sm text-white/50">잠시만 기다려 주세요.</p>
                                            </div>
                                        </motion.div>
                                    ) : file && !analysis ? (
                                        <motion.div
                                            key="analyzing"
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -12 }}
                                            className="flex flex-col items-center justify-center min-h-[320px] space-y-6"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                                                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                                            </div>
                                            <div className="text-center space-y-1">
                                                <h2 className="text-lg font-semibold text-white">모델 <span className="text-primary">분석 중</span></h2>
                                                <p className="text-sm text-white/50">부피·표면적을 계산하고 있습니다.</p>
                                            </div>
                                            {file && (
                                                <div className="w-full max-w-xs p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                                                    <Box className="w-9 h-9 text-white/30 shrink-0" />
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-white truncate">{file.name}</div>
                                                        <div className="text-xs text-white/40">
                                                            {file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={goBackToSelect}
                                                className="text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
                                            >
                                                다른 모델로
                                            </button>
                                        </motion.div>
                                    ) : loadError ? (
                                        <motion.div
                                            key="error"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center min-h-[280px] text-center space-y-6"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">!</div>
                                            <div>
                                                <p className="text-white/80 font-medium">{loadError}</p>
                                                <p className="mt-1 text-sm text-white/40">다시 시도하거나 본격 견적을 이용해 주세요.</p>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-3">
                                                <Button onClick={() => loadSample(SAMPLES[0].path)} variant="outline" size="sm" className="border-white/20 text-white/80">
                                                    다시 시도
                                                </Button>
                                                <Link href="/quote" onClick={goBackToSelect}>
                                                    <Button size="sm" className="bg-white text-black hover:bg-white/90">본격 견적</Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="select"
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -12 }}
                                            className="space-y-6"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 text-amber-400/90 mb-1">
                                                    <Sparkles className="w-4 h-4" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">샘플 체험</span>
                                                </div>
                                                <h1 className="text-xl font-bold text-white tracking-tight">체험할 모델 선택</h1>
                                                <p className="mt-1 text-sm text-white/50">샘플을 고르거나 직접 업로드해 견적 흐름을 체험하세요.</p>
                                            </div>

                                            <div className="space-y-3">
                                                <span className="text-xs font-medium text-white/40">샘플 모델</span>
                                                <div className="grid gap-2">
                                                    {SAMPLES.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => loadSample(s.path)}
                                                            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 text-left transition-all group"
                                                        >
                                                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/15">
                                                                <Box className="w-6 h-6 text-amber-400/80" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-white">{s.name}</div>
                                                                <div className="text-xs text-white/45 mt-0.5">{s.desc}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-px bg-white/10" />
                                                <span className="text-xs text-white/35 font-medium">또는</span>
                                                <div className="flex-1 h-px bg-white/10" />
                                            </div>

                                            <div className="space-y-2">
                                                <span className="text-xs font-medium text-white/40">내 파일로 체험</span>
                                                <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden [&>div]:border-white/20 [&>div]:bg-white/[0.03]">
                                                    <FileUpload />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                ) : (
                                    /* Step 2: 견적 설정 */
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 12 }}
                                        className="space-y-6 pb-48"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-bold text-white">견적 세부 설정</h2>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={goBackToSelect}
                                                    className="text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
                                                >
                                                    다른 모델로
                                                </button>
                                                <span className="text-white/20">|</span>
                                                <Link href="/quote" onClick={goBackToSelect} className="text-xs font-medium text-amber-400/90 hover:text-amber-400">
                                                    본격 견적
                                                </Link>
                                            </div>
                                        </div>
                                        <QuotePanel embedded />
                                        <div className="pt-4 border-t border-white/5">
                                            <p className="text-[11px] text-white/40 leading-relaxed">
                                                체험용 참고 견적입니다. 정확한 견적은 <Link href="/quote" className="text-amber-400/90 hover:underline">본격 견적</Link>에서 확인하세요.
                                            </p>
                                            <div className="mt-4 flex gap-2">
                                                <Link href="/" className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full h-10 rounded-xl border-white/15 text-white/70 hover:bg-white/5 gap-1.5">
                                                        <Home className="w-3.5 h-3.5" /> 홈
                                                    </Button>
                                                </Link>
                                                <Link href="/quote" onClick={goBackToSelect} className="flex-1">
                                                    <Button size="sm" className="w-full h-10 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-black font-semibold gap-1.5">
                                                        <Zap className="w-3.5 h-3.5" /> 본격 견적
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="p-4 border-t border-white/5 bg-black/30">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-amber-400/70 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse" />
                                샘플 체험 모드
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

                            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
                                <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold uppercase tracking-wider text-amber-400/95">
                                    샘플 체험
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur border border-white/10 text-[10px] font-medium text-white/50 uppercase tracking-wider">
                                    3D Viewer
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

                        <div className="h-14 border-t border-white/5 bg-black/40 flex items-center px-6 gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-white/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/80" /> 100종+ 소재
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-white/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" /> 24h 내 제작
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-white/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" /> ±0.2mm 정밀
                            </div>
                            <div className="ml-auto text-[10px] text-white/25">WOW3D</div>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    )
}
