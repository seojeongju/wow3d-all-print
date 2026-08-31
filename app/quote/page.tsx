'use client'

import Scene from "@/components/canvas/Scene";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/upload/FileUpload";
import QuotePanel from "@/components/quote/QuotePanel";
import QuoteSourceChooser, { type QuoteEntryMode } from "@/components/quote/QuoteSourceChooser";
import ImageTo3DPanel from "@/components/quote/ImageTo3DPanel";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info, Boxes, FileBox, Loader2, FileText, ShoppingCart, RefreshCw, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense, useCallback, type DragEvent } from "react";
import { useFileStore } from "@/store/useFileStore";
import { useSearchParams } from "next/navigation";
import type { Quote } from "@/lib/types";
import { getModelFileFromDataTransfer } from "@/lib/model-file";
import { cn } from "@/lib/utils";
import { useCpuModelAnalysis } from "@/hooks/useCpuModelAnalysis";
import { buildFileSourceFromFileName, resolveQuoteReloadTransform } from "@/lib/quote-reload";

const quickQuoteFaqs: { q: string; a: string; guideHref?: string; guideLabel?: string }[] = [
    {
        q: "3D 프린팅 견적을 받으려면 어떤 파일을 올려야 하나요?",
        a: "STL, OBJ, 3MF, PLY 파일은 즉시 자동견적을 지원합니다. STEP, STP 파일은 업로드 시 자동 변환 후 견적을 제공합니다. 3D 파일이 없다면 제품 사진(이미지)으로 AI 모델링 후 견적할 수 있습니다.",
    },
    {
        q: "3D 모델 파일이 없어도 견적이 가능한가요?",
        a: "가능합니다. 견적 시작 화면에서 「3D 모델이 없어요」를 선택한 뒤 제품 사진(이미지)(JPG/PNG)을 올리면 AI가 3D 모델을 생성하고 자동견적으로 이어집니다. 정밀 치수·조립 공차가 필요한 부품은 STL/STEP 업로드를 권장합니다.",
    },
    {
        q: "사진(이미지)→AI 3D는 로그인·이용 한도가 있나요?",
        a: "로그인 회원 기준 하루 1회(한국 시간)입니다. 생성에 실패하면 횟수가 차감되지 않습니다.",
        guideHref: "/guides/photo-to-3d-printing-quote",
        guideLabel: "사진(이미지)→3D 촬영·견적 가이드",
    },
    {
        q: "레이어 높이와 인필을 바꾸면 견적이 왜 달라지나요?",
        a: "레이어 높이가 낮아질수록 출력 시간이 늘어나고, 인필이 높아질수록 재료 사용량이 증가합니다. 그래서 옵션에 따라 가격과 예상 시간이 함께 달라집니다.",
    },
    {
        q: "자동견적 후 실제 제작 금액이 달라질 수도 있나요?",
        a: "일반적인 모델은 자동견적이 유효하지만, 복잡한 형상이나 특수 후가공이 필요한 경우에는 관리자 검토 후 수정견적으로 안내될 수 있습니다.",
    },
];

function QuickQuoteFaqCard({ item }: { item: (typeof quickQuoteFaqs)[number] }) {
    return (
        <div className="p-4 sm:p-5 rounded-[1.25rem] bg-white/5 border border-white/10">
            <h3 className="text-xs sm:text-sm font-black text-white leading-relaxed break-keep">{item.q}</h3>
            <p className="mt-2 text-[11px] sm:text-[13px] text-white/50 leading-relaxed font-bold break-keep">{item.a}</p>
            {item.guideHref && item.guideLabel ? (
                <Link
                    href={item.guideHref}
                    className="inline-flex items-center gap-1 mt-2.5 text-[11px] sm:text-xs font-black text-indigo-300 hover:text-indigo-200"
                >
                    {item.guideLabel} →
                </Link>
            ) : null}
        </div>
    );
}

const GUIDE_SOURCE_LABELS: Record<string, string> = {
    prototypes: '시제품용 소재 추천',
    transparent_parts: '투명 부품용 소재 추천',
    housings_cases: '하우징·케이스용 소재 추천',
    heat_impact_parts: '내열·내충격 부품용 소재 추천',
    miniatures_figurines: '정밀 모형·피규어용 소재 추천',
};

function QuoteContent() {
    useCpuModelAnalysis();
    const { file, baseAnalysis, analysisError, reset, setFile } = useFileStore();
    const analysis = baseAnalysis;
    const showQuotePanel = Boolean(file && analysis);
    const [step, setStep] = useState(1); // 1: Upload, 2: Configure
    // 모바일: 기본은 업로드 패널(견적 설정). 'viewer'만 보이면 FileUpload가 숨겨져 업로드 불가 이슈 발생
    const [activeTab, setActiveTab] = useState<'settings' | 'viewer'>('settings');
    const searchParams = useSearchParams();
    const loadQuoteId = searchParams.get('load_quote_id');
    const guideSource = searchParams.get('guide_source') || '';
    const guideTopic = searchParams.get('guide_topic') || '';
    const entryParam = searchParams.get('entry');
    const [entryMode, setEntryMode] = useState<QuoteEntryMode | null>(
        entryParam === 'file' || entryParam === 'photo' ? entryParam : null
    );
    const [loadedQuote, setLoadedQuote] = useState<Quote | null>(null); // DB quote data
    const [reloadQuoteId, setReloadQuoteId] = useState<number | null>(null);
    const [isViewerDragging, setIsViewerDragging] = useState(false);
    const guideLabel = guideTopic || GUIDE_SOURCE_LABELS[guideSource] || '';
    const SAMPLE_NAMES = ['sample_cube.stl', 'test_cube.stl', 'jet_engine_rotor.stl'];

    useEffect(() => {
        if (entryParam === 'file' || entryParam === 'photo') setEntryMode(entryParam);
    }, [entryParam]);

    // 저장된 견적 로드 시에는 선택 화면 건너뛰기
    useEffect(() => {
        if (loadQuoteId) setEntryMode('file');
    }, [loadQuoteId]);

    // Auto-switch to settings tab when analysis is complete
    useEffect(() => {
        if (analysis && activeTab === 'viewer') {
            setActiveTab('settings');
        }
    }, [analysis, activeTab]);

    // Load quote data if ID is present
    useEffect(() => {
        if (!loadQuoteId) return;

        const load = async () => {
            try {
                const res = await fetch(`/api/quotes/${loadQuoteId}`);
                const json = await res.json();

                if (json.success && json.data) {
                    const q = json.data;
                    setLoadedQuote(q);
                    const quoteId = Number(q.id);
                    if (Number.isInteger(quoteId) && quoteId > 0) {
                        setReloadQuoteId(quoteId);
                    }

                    const fileSource = buildFileSourceFromFileName(q.file_name);
                    const restoredTransform = resolveQuoteReloadTransform(q.model_transform);
                    const store = useFileStore.getState();

                    if (q.file_url) {
                        store.setSavedFileR2Url(String(q.file_url));
                        const fileRes = await fetch(q.file_url);
                        const blob = await fileRes.blob();
                        const newFile = new File([blob], q.file_name, {
                            type: blob.type || 'model/stl',
                        });
                        setFile(newFile, fileSource);
                        if (Number.isInteger(quoteId) && quoteId > 0) {
                            store.setSavedQuoteId(quoteId);
                        }
                        store.setTransformFull(restoredTransform, {
                            userOverride: Boolean(q.model_transform) || fileSource.kind === 'meshy-photo',
                        });
                        setActiveTab('viewer');
                    }
                }
            } catch (error) {
                console.error("Failed to load quote:", error);
            }
        };

        load();
    }, [loadQuoteId, setFile]);

    const handleViewerDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsViewerDragging(true);
    }, []);

    const handleViewerDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsViewerDragging(false);
    }, []);

    const handleViewerDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsViewerDragging(false);
            const model = getModelFileFromDataTransfer(e.dataTransfer);
            if (!model) return;
            setEntryMode('file');
            setFile(model);
            setActiveTab('settings');
        },
        [setFile]
    );

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
        <main className="min-h-screen relative text-slate-100 flex flex-col selection:bg-teal-500/30 overflow-hidden bg-slate-950">
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
                <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-all active:scale-95 group">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
                                <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base sm:text-xl tracking-tight text-white leading-none">
                                    Wow3D <span className="text-teal-400 font-light">Pro</span>
                                </span>
                                <span className="text-[8px] sm:text-[10px] font-black text-white/50 leading-tight mt-0.5 uppercase tracking-[0.2em]">
                                    AI Auto Quoting System
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden sm:flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/20 scale-90 sm:scale-100 origin-left">
                            {[
                                { id: 1, label: "업로드", active: step >= 1 },
                                { id: 2, label: "견적 설정", active: step >= 2 },
                                { id: 3, label: "주문 완료", active: step >= 3 },
                            ].map((item) => (
                                <div
                                    key={item.id}
                                    className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black transition-all ${item.id === step
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

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/cart" className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/10 border border-white/20 text-white/60 hover:text-white hover:bg-teal-500/20 transition-all">
                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Link>
                        <Link href="/">
                            <Button variant="outline" size="sm" className="h-9 sm:h-11 rounded-xl bg-white/10 border-white/25 text-white hover:bg-white/20 px-3 sm:px-5 font-bold transition-all text-xs sm:text-sm">
                                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">나가기</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* 본문: 중첩 section/div 제거 + min-height로 뷰어 열 높이 보장 */}
            <section className="flex-1 relative z-10 flex min-h-0 flex-col pb-[4.5rem] lg:pb-0">
                <div className="flex-1 min-h-0 grid lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr] overflow-hidden min-h-[calc(100dvh-5rem)]">

                    {/* Left Sidebar: Settings Panel */}
                    <div className={`
                        bg-black/20 backdrop-blur-[20px] border-r border-white/10 flex flex-col overflow-hidden transition-all duration-300
                        ${activeTab === 'settings' ? 'flex flex-1' : 'hidden lg:flex'}
                        lg:h-[calc(100vh-5rem)]
                    `}>
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 sm:p-8 pb-24 lg:pb-10 space-y-8">
                            <AnimatePresence mode="wait">
                                {showQuotePanel ? (
                                    <motion.div
                                        key="quote-settings"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 30 }}
                                        className="space-y-6 sm:space-y-8"
                                    >
                                        <div className="flex items-center justify-between px-1">
                                            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">견적 세부 설정</h2>
                                            <button
                                                onClick={() => { reset(); setStep(1); setEntryMode(null); }}
                                                className="px-3 py-1.5 rounded-lg bg-teal-400/20 border border-teal-400/30 text-[10px] sm:text-[12px] text-teal-400 hover:bg-teal-400 hover:text-slate-900 font-black tracking-tight transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group"
                                            >
                                                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                                                파일 교체
                                            </button>
                                        </div>
                                        {loadQuoteId ? (
                                            <div className="rounded-2xl border border-teal-400/25 bg-teal-500/10 px-4 py-3 text-[11px] sm:text-xs font-bold text-teal-100/90 leading-relaxed break-keep">
                                                저장·장바구니에서 불러온 견적입니다. 3D 뷰어에서 크기·회전을 조정한 뒤 저장하면 장바구니 금액도 함께 갱신됩니다.
                                            </div>
                                        ) : null}
                                        <div className="relative">
                                            {analysisError ? (
                                                <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[11px] sm:text-xs font-bold text-amber-100/90 leading-relaxed break-keep">
                                                    {analysisError}
                                                </div>
                                            ) : null}
                                            <QuotePanel
                                                initialQuote={loadedQuote}
                                                reloadQuoteId={reloadQuoteId}
                                                guideSource={guideSource}
                                                guideTopic={guideTopic}
                                            />
                                        </div>
                                    </motion.div>
                                ) : file && !analysis ? (
                                        <motion.div
                                            key="analyzing"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="space-y-6 sm:space-y-8 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]"
                                        >
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-[2.5rem] bg-teal-400/20 border border-teal-400/30 flex items-center justify-center relative group">
                                                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-teal-400 animate-spin" />
                                                <div className="absolute inset-0 rounded-[2.5rem] bg-teal-400/25 blur-2xl animate-pulse group-hover:blur-3xl transition-all" />
                                            </div>
                                            <div className="text-center space-y-2 sm:space-y-3">
                                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                                                    모델 <span className="text-teal-400">정밀 분석 중</span>
                                                </h1>
                                                <p className="text-white/60 text-xs sm:text-sm break-keep font-bold leading-relaxed px-4">
                                                    부피·표면적·출력 시간을 계산하고 있습니다.
                                                    <br className="hidden sm:block" />
                                                    최적의 견적을 산출하기 위해 잠시만 기다려 주세요.
                                                </p>
                                                {file.size >= 20 * 1024 * 1024 ? (
                                                    <p className="text-amber-300/90 text-[11px] sm:text-xs font-bold break-keep px-6">
                                                        대용량 AI 모델은 먼저 치수 근사값으로 견적 화면을 연 뒤, 백그라운드에서 정밀 분석을 이어갑니다.
                                                    </p>
                                                ) : null}
                                                {analysisError ? (
                                                    <p className="text-rose-300 text-[11px] sm:text-xs font-bold break-keep px-6">
                                                        {analysisError}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/10 border border-white/20 flex items-center gap-4 shadow-xl">
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-teal-400/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0">
                                                    <FileBox className="w-6 h-6 sm:w-7 sm:h-7" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs sm:text-sm font-black text-white truncate">{file.name}</div>
                                                    <div className="text-[10px] sm:text-xs font-black text-white/40 tracking-[0.1em] uppercase mt-0.5">{file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                ) : !entryMode ? (
                                        <motion.div
                                            key="chooser"
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                        >
                                            <QuoteSourceChooser onSelect={setEntryMode} />
                                            <div className="space-y-3 pt-8">
                                                <div className="px-1">
                                                    <h2 className="text-sm sm:text-base font-black text-white">자동견적 전에 많이 묻는 질문</h2>
                                                </div>
                                                {quickQuoteFaqs.map((item) => (
                                                    <QuickQuoteFaqCard key={item.q} item={item} />
                                                ))}
                                                <Link
                                                    href="/guides/photo-to-3d-printing-quote"
                                                    className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-400/25 hover:border-indigo-400/40 transition-all"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                                                        <Camera className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-black text-white">3D 파일 없이 사진(이미지)으로 견적</h3>
                                                        <p className="text-[11px] sm:text-xs text-white/50 font-bold leading-relaxed break-keep mt-1">
                                                            촬영 방법·한도·Maker와의 차이를 가이드에서 확인하세요.
                                                        </p>
                                                    </div>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ) : entryMode === 'photo' ? (
                                        <motion.div
                                            key="photo"
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                        >
                                            <ImageTo3DPanel
                                                onBack={() => setEntryMode(null)}
                                                onModelReady={() => {
                                                    setEntryMode(null);
                                                    setActiveTab('viewer');
                                                }}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="upload"
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            className="space-y-8 sm:space-y-10"
                                        >
                                            <div className="space-y-3 sm:space-y-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setEntryMode(null)}
                                                    className="inline-flex items-center gap-1.5 text-[12px] font-black text-white/50 hover:text-white transition-colors"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" />
                                                    시작 방식 다시 선택
                                                </button>
                                                {guideLabel ? (
                                                    <div className="rounded-[1.5rem] border border-teal-400/20 bg-teal-400/10 px-5 py-4">
                                                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300 mb-2">Guide Context</p>
                                                        <p className="text-sm sm:text-[15px] font-bold text-white/85 break-keep">
                                                            현재 <span className="text-teal-300">{guideLabel}</span> 가이드에서 들어오셨습니다.
                                                            업로드 후 해당 용도에 맞는 소재와 옵션으로 바로 견적을 확인해 보세요.
                                                        </p>
                                                    </div>
                                                ) : null}
                                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.15]">
                                                    3D 모델 <br />
                                                    <span className="text-teal-400">업로드</span>
                                                </h1>
                                                <p className="text-white/70 text-[13px] sm:text-[15px] font-bold leading-relaxed break-keep">
                                                    STL·OBJ·3MF·PLY는 즉시 견적, STEP·STP는 자동 변환 후 견적을 제공합니다. <br />
                                                    지능형 분석 엔진이 실시간으로 비용을 산출합니다.
                                                </p>
                                            </div>
                                            <div className="p-1 rounded-[2.5rem] sm:rounded-[3rem] bg-white/10 border border-white/20 overflow-hidden shadow-2xl relative group">
                                                <div className="absolute inset-0 bg-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                <FileUpload variant="dark" />
                                            </div>

                                            <div className="pt-2 grid gap-3 sm:gap-4">
                                                <div className="flex items-start gap-4 sm:gap-5 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white/10 border border-white/20 group hover:border-teal-400/40 transition-all hover:bg-teal-400/5">
                                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-teal-400/20 border border-teal-400/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform shrink-0">
                                                        <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7" />
                                                    </div>
                                                    <div className="space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1">
                                                        <h3 className="text-sm sm:text-[15px] font-black text-white">정밀 견적 분석</h3>
                                                        <p className="text-[11px] sm:text-[13px] text-white/50 leading-relaxed font-bold">부피, 표면적, 예상 소요 시간을 99% 정확도로 분석합니다.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 sm:gap-5 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white/10 border border-white/20 group hover:border-indigo-500/40 transition-all hover:bg-indigo-500/5">
                                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                                                        <Info className="w-5 h-5 sm:w-7 sm:h-7" />
                                                    </div>
                                                    <div className="space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1">
                                                        <h3 className="text-sm sm:text-[15px] font-black text-white">강력한 파일 보호</h3>
                                                        <p className="text-[11px] sm:text-[13px] text-white/50 leading-relaxed font-bold">업로드된 자산은 AES-256 암호화되어 안전하게 처리됩니다.</p>
                                                    </div>
                                                </div>
                                                <Link href="/guides/3d-printing-file-preparation" className="flex items-start gap-4 sm:gap-5 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white/8 border border-white/15 hover:border-white/30 transition-all hover:bg-white/10">
                                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                                                        <FileText className="w-5 h-5 sm:w-7 sm:h-7" />
                                                    </div>
                                                    <div className="space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1">
                                                        <h3 className="text-sm sm:text-[15px] font-black text-white">파일 준비 가이드 보기</h3>
                                                        <p className="text-[11px] sm:text-[13px] text-white/50 leading-relaxed font-bold">STL, OBJ, 3MF 업로드 전 두께, 단위, 메쉬 오류를 체크하는 방법을 확인하세요.</p>
                                                    </div>
                                                </Link>
                                            </div>
                                            <div className="space-y-3 pt-2">
                                                <div className="px-1">
                                                    <h2 className="text-sm sm:text-base font-black text-white">자동견적 전에 많이 묻는 질문</h2>
                                                </div>
                                                {quickQuoteFaqs.map((item) => (
                                                    <QuickQuoteFaqCard key={item.q} item={item} />
                                                ))}
                                                <Link
                                                    href="/guides/photo-to-3d-printing-quote"
                                                    className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-400/25 hover:border-indigo-400/40 transition-all"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                                                        <Camera className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-black text-white">3D 파일 없이 사진(이미지)으로 견적</h3>
                                                        <p className="text-[11px] sm:text-xs text-white/50 font-bold leading-relaxed break-keep mt-1">
                                                            촬영 방법·한도·Maker와의 차이를 가이드에서 확인하세요.
                                                        </p>
                                                    </div>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                            </AnimatePresence>
                        </div>

                        {/* Sidebar Footer */}
                        <div className="shrink-0 px-8 py-6 border-t border-white/10 bg-black/40 backdrop-blur-md hidden sm:block">
                            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white/40 font-black">
                                <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.6)]" />
                                <span className="text-white/30">SYSTEM STATUS:</span>
                                <span className="text-teal-400/80">V3.5 MASTER ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: 3D Visualization */}
                    <div
                        onDragEnter={handleViewerDragOver}
                        onDragOver={handleViewerDragOver}
                        onDragLeave={handleViewerDragLeave}
                        onDrop={handleViewerDrop}
                        className={cn(
                            'relative flex flex-col bg-slate-950/20 backdrop-blur-[2px] overflow-hidden transition-all duration-300',
                            activeTab === 'viewer' ? 'flex flex-1' : 'hidden lg:flex',
                            'lg:h-[calc(100vh-5rem)]',
                            isViewerDragging && 'ring-2 ring-inset ring-teal-400/70'
                        )}
                    >
                        <div className="flex-1 relative group min-h-[min(60dvh,560px)]">
                            <div className="absolute inset-0 z-0">
                                <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="w-12 h-12 text-teal-400/30 animate-spin" /></div>}>
                                    <Scene />
                                </Suspense>
                            </div>
                            {isViewerDragging ? (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm pointer-events-none">
                                    <p className="text-teal-300 font-black text-sm sm:text-base tracking-wide">
                                        여기에 모델을 놓아 업로드
                                    </p>
                                </div>
                            ) : null}

                            {/* Viewer HUD */}
                            <div className="absolute top-6 left-6 sm:top-10 sm:left-10 flex flex-col gap-4 z-20 pointer-events-none">
                                <div className="px-4 py-2 sm:px-6 sm:py-3 rounded-[1rem] sm:rounded-[1.25rem] bg-black/60 backdrop-blur-md border border-white/10 text-[9px] sm:text-[11px] font-black tracking-[0.15em] sm:tracking-[0.25em] uppercase text-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-2 sm:gap-3">
                                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-teal-400" />
                                    3D Viewer Engine V3.5
                                </div>
                            </div>

                            {!file && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-5">
                                    <div className="pointer-events-none flex flex-col items-center">
                                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm flex items-center justify-center animate-pulse relative">
                                            <Boxes className="w-10 h-10 sm:w-12 sm:h-12 text-white/10" />
                                            <div className="absolute inset-0 rounded-full border border-teal-400/20 scale-150 blur-xl" />
                                        </div>
                                        <div className="mt-8 sm:mt-10 text-center space-y-2">
                                            <p className="text-white/30 text-base sm:text-lg font-bold tracking-tight">STANDBY FOR INPUT</p>
                                            <p className="text-white/20 text-[11px] sm:text-sm font-medium italic break-keep">
                                                파일을 드래그하거나 왼쪽에서 업로드하면 3D 미리보기가 활성화됩니다.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('settings')}
                                        className="pointer-events-auto mt-8 flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_8px_30px_rgba(20,184,166,0.35)] active:scale-[0.98] transition-transform lg:hidden"
                                    >
                                        <FileBox className="h-5 w-5" />
                                        모델 파일 업로드
                                    </button>
                                    <p className="pointer-events-none mt-3 text-center text-[10px] text-white/35 lg:hidden break-keep">
                                        아래 「파일 업로드」 탭에서도 선택할 수 있어요
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Bottom Info Bar - 모바일 대응 */}
                        <div className="h-16 sm:h-24 border-t border-white/10 bg-black/60 backdrop-blur-xl flex items-center px-4 sm:px-12 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                            <div className="flex-1 flex items-center gap-4 sm:gap-12 text-[9px] sm:text-[12px] font-black tracking-[0.08em] sm:tracking-[0.25em] uppercase text-white/50 overflow-x-auto no-scrollbar whitespace-nowrap">
                                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
                                    30종+ 고성능 소재
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                                    실시간 지능형 견적
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                    ±0.1mm 정밀 제작
                                </div>
                            </div>
                            <div className="ml-3 sm:ml-auto text-right shrink-0 hidden sm:block">
                                <div className="text-[10px] sm:text-[14px] font-black text-white/20 tracking-[0.1em] uppercase">MASTER Pro</div>
                                <div className="text-[7px] sm:text-[10px] font-bold text-teal-400/40 tracking-[0.15em] sm:tracking-[0.3em] uppercase mt-0.5 max-w-[100px] sm:max-w-none leading-tight">
                                    Industrial Intelligence
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 모바일: 업로드 ↔ 뷰어 항상 전환 가능 (기존은 file+분석 후에만 탭 노출 → 업로드 UI 도달 불가) */}
                <div
                    className="lg:hidden fixed inset-x-0 bottom-0 z-[60] flex border-t border-white/15 bg-black/85 backdrop-blur-xl px-2 pt-1.5 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
                    style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
                >
                    <button
                        type="button"
                        onClick={() => setActiveTab('settings')}
                        className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-black transition-colors ${
                            activeTab === 'settings' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-white/55 active:bg-white/10'
                        }`}
                    >
                        <FileBox className="h-5 w-5" />
                        파일 업로드
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('viewer')}
                        className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-black transition-colors ${
                            activeTab === 'viewer' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-white/55 active:bg-white/10'
                        }`}
                    >
                        <Boxes className="h-5 w-5" />
                        3D 뷰어
                    </button>
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
