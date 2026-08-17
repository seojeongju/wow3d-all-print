'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMakerStore, makerSceneInputFromState } from '@/store/useMakerStore';
import { useFileStore } from '@/store/useFileStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Pencil, Eraser, Undo, Trash2, Box, Download, Settings, Layers, Check,
    ImageIcon, ImagePlus, PanelRightOpen, X, Sparkles, Loader2, ShoppingCart, Zap,
} from 'lucide-react';
import { Canvas2D } from '@/components/maker/Canvas2D';
import { Preview3D } from '@/components/maker/Preview3D';
import { ImageUploader } from '@/components/maker/ImageUploader';
import { Maker3DErrorBoundary } from '@/components/maker/Maker3DErrorBoundary';
import { Exporter } from '@/components/maker/Exporter';
import type { ConvertMode } from '@/lib/image-processor';
import { MakerTemplatePicker } from '@/components/maker/MakerTemplatePicker';
import { buildMakerStlBlob, hasMakerExportContent } from '@/lib/maker-stl-export';
import { getMakerTemplate } from '@/lib/maker-templates';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { showToast } from '@/lib/toast-helper';

/** 3D → 스케치 전환 시 WebGL을 즉시 언마운트하면 Context Lost 발생. 짧은 지연 후 언마운트로 완화 */
const UNMOUNT_3D_DELAY_MS = 180;

export function MakerWorkspace() {
    const router = useRouter();
    const setFile = useFileStore((s) => s.setFile);
    const {
        tool, setTool,
        strokeWidth, setStrokeWidth,
        strokeColor, setStrokeColor,
        extrusionHeight, setExtrusionHeight,
        basePlateType, setBasePlateType,
        baseHeight, setBaseHeight,
        bevelMm, setBevelMm,
        rimHeightMm, setRimHeightMm,
        baseSizeMm, setBaseSizeMm,
        cornerRadiusMm, setCornerRadiusMm,
        activeTemplateId, applyTemplate,
        showGrid, setShowGrid,
        undo, clearCanvas, triggerExport,
        addImportedSvg,
        importedSvgs,
        removeImportedSvg,
        paths,
        canvasSize,
    } = useMakerStore();

    const [activeTab, setActiveTab] = useState('draw');
    const [show3dCanvas, setShow3dCanvas] = useState(false);
    const [pendingSvg, setPendingSvg] = useState<{ name: string; svgContent: string } | null>(null);
    const [convertMode, setConvertMode] = useState<ConvertMode>('simple');
    const [useRemoveBg, setUseRemoveBg] = useState(false);
    const [removeBgConfigured, setRemoveBgConfigured] = useState<boolean | null>(null);
    const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
    const [isQuoting, setIsQuoting] = useState(false);

    useEffect(() => {
        fetch('/api/maker/remove-bg')
            .then((r) => r.json())
            .then((j: { configured?: boolean }) => setRemoveBgConfigured(!!j?.configured))
            .catch(() => setRemoveBgConfigured(false));
    }, []);

    useEffect(() => {
        if (activeTab === '3d') {
            setShow3dCanvas(true);
        } else {
            const t = setTimeout(() => setShow3dCanvas(false), UNMOUNT_3D_DELAY_MS);
            return () => clearTimeout(t);
        }
    }, [activeTab]);

    const handleAddPendingTo3D = () => {
        if (!pendingSvg) return;
        addImportedSvg({
            id: crypto.randomUUID(),
            name: pendingSvg.name,
            svgContent: pendingSvg.svgContent
        });
        setPendingSvg(null);
        setActiveTab('3d');
    };

    const sceneInput = () => makerSceneInputFromState({
        paths,
        importedSvgs,
        extrusionHeight,
        basePlateType,
        baseHeight,
        bevelMm,
        rimHeightMm,
        baseSizeMm,
        cornerRadiusMm,
        canvasSize,
    });

    const handleApplyTemplate = (id: Parameters<typeof applyTemplate>[0]) => {
        applyTemplate(id);
        const t = getMakerTemplate(id);
        setActiveTab('3d');
        showToast.success(
            t ? `${t.name} 적용` : '템플릿 적용',
            '결과물(3D)에서 판형을 확인한 뒤 로고를 올려 주세요.'
        );
    };

    const handleRequestQuote = async () => {
        if (!hasMakerExportContent(sceneInput())) {
            showToast.error('견적 불가', '템플릿을 고르거나 스케치·로고를 추가한 뒤 다시 시도해 주세요.');
            return;
        }
        setIsQuoting(true);
        try {
            const blob = buildMakerStlBlob(sceneInput());
            if (!blob) {
                showToast.error('견적 불가', '3D 메시를 만들지 못했습니다. 결과물(3D) 탭에서 미리보기를 확인해 주세요.');
                return;
            }
            const file = new File([blob], `wow3d-maker-${Date.now()}.stl`, { type: 'model/stl' });
            setFile(file);
            showToast.success('견적으로 이동', 'Maker 2.5D 모델을 자동견적에 불러왔습니다.');
            router.push('/quote?entry=file');
        } catch (e) {
            console.error(e);
            showToast.error('견적 연동 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
        } finally {
            setIsQuoting(false);
        }
    };

    return (
        <>
        <Exporter />
        <div className="flex flex-col w-full max-w-6xl min-h-[100dvh] md:h-[800px] bg-[#0d0d0d]/80 backdrop-blur-3xl border border-white/10 rounded-none md:rounded-[2rem] overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/5 mx-auto">
            {/* Header */}
            <header className="h-14 md:h-16 border-b border-white/10 bg-white/[0.02] flex items-center justify-between px-3 md:px-6 z-20 shrink-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-400/30 shrink-0">
                        <Box className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="min-w-0">
                        <span className="font-bold text-white tracking-wide text-sm md:text-base truncate block leading-tight">AI 3D Maker</span>
                        <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-teal-400/80">로고·스케치 2.5D</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-9 md:h-10">
                        <TabsList className="grid w-[160px] md:w-[200px] grid-cols-2 h-9 md:h-10 bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-1">
                            <TabsTrigger value="draw" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-teal-500 data-[state=active]:text-slate-950 text-white/50 hover:text-white rounded-md md:rounded-lg transition-all">스케치(2D)</TabsTrigger>
                            <TabsTrigger value="3d" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 hover:text-white rounded-md md:rounded-lg transition-all">결과물(3D)</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="w-px h-5 md:h-6 bg-white/10 hidden sm:block" />

                    <Button variant="outline" size="sm" className="h-9 md:h-10 px-3 md:px-4 text-[10px] md:text-xs font-semibold bg-white/5 border-white/10 text-white hover:bg-white/15 hover:border-white/30 rounded-lg md:rounded-xl transition-all" onClick={triggerExport}>
                        <Download className="w-3.5 h-3.5 md:w-4 md:h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">STL 저장</span>
                    </Button>
                    <Button variant="outline" size="sm" className="md:hidden h-9 w-9 p-0 rounded-lg border-white/20 text-white/80 hover:bg-white/10" onClick={() => setMobileSettingsOpen(true)} aria-label="설정">
                        <PanelRightOpen className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        disabled={isQuoting}
                        onClick={handleRequestQuote}
                        className="hidden sm:flex h-9 md:h-10 px-4 md:px-5 text-[10px] md:text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg md:rounded-xl transition-all gap-1.5"
                    >
                        {isQuoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                        견적 의뢰하기
                    </Button>
                </div>
            </header>

            {/* 역할 구분 배너 */}
            <div className="shrink-0 px-3 md:px-6 py-2.5 bg-gradient-to-r from-teal-500/10 via-transparent to-indigo-500/10 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <p className="text-[11px] md:text-[12px] text-white/65 font-bold leading-relaxed break-keep flex-1">
                    <span className="text-teal-300">Maker</span>는 로고·배지·키캡용 <strong className="text-white/85">실루엣 돌출(2.5D)</strong> 도구입니다.
                    제품 <strong className="text-white/85">실사 사진 → 입체 3D</strong>는 자동견적 AI를 이용하세요.
                </p>
                <Link
                    href="/quote?entry=photo"
                    className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-indigo-400/35 bg-indigo-500/15 px-3 py-1.5 text-[11px] font-black text-indigo-200 hover:bg-indigo-500/25 transition-colors"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    사진으로 입체 3D 만들기
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative min-h-0">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] z-0" />

                {/* Left Toolbar - 모바일에서 축소 */}
                <aside className="w-14 md:w-20 bg-black/40 border-r border-white/10 flex flex-col items-center py-3 md:py-6 gap-2 md:gap-4 z-20 backdrop-blur-xl shrink-0">
                    <ToolbarButton
                        active={tool === 'pen'}
                        onClick={() => setTool('pen')}
                        icon={<Pencil className="w-4 h-4 md:w-5 md:h-5" />}
                        label="펜"
                    />
                    <ToolbarButton
                        active={tool === 'eraser'}
                        onClick={() => setTool('eraser')}
                        icon={<Eraser className="w-4 h-4 md:w-5 md:h-5" />}
                        label="지우개"
                    />
                    <div className="w-6 md:w-8 h-px bg-white/10 my-1 md:my-2" />
                    <ToolbarButton
                        onClick={undo}
                        icon={<Undo className="w-4 h-4 md:w-5 md:h-5" />}
                        label="취소"
                    />
                    <ToolbarButton
                        onClick={clearCanvas}
                        icon={<Trash2 className="w-4 h-4 md:w-5 md:h-5" />}
                        label="지우기"
                        className="hover:text-red-400 hover:bg-red-500/10 text-white/50"
                    />

                    <div className="w-6 md:w-8 h-px bg-white/10 my-1 md:my-2" />
                    <div className="w-full px-1.5 md:px-3 flex justify-center">
                        <ImageUploader
                            onSvgConverted={(data) => setPendingSvg(data)}
                            convertMode={convertMode}
                            useRemoveBg={useRemoveBg}
                        />
                    </div>
                </aside>

                {/* Center Workspace - 모바일에서 남는 공간 전부 사용 */}
                <main className="flex-1 min-w-0 relative flex items-center justify-center p-3 md:p-8 z-10 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="relative w-full h-full max-w-4xl max-h-full md:max-h-[650px] bg-white/[0.02] border border-white/10 rounded-xl md:rounded-[1.5rem] overflow-hidden shadow-2xl backdrop-blur-md"
                    >
                        {/* 2D Canvas Layer */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'draw' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <Canvas2D />
                        </div>

                        {/* 3D Preview Layer: 지연 언마운트로 3D→스케치 전환 시 Context Lost 완화 */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === '3d' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]" />
                            {show3dCanvas && (
                                <Maker3DErrorBoundary onRetry={() => setActiveTab('draw')}>
                                    <Preview3D />
                                </Maker3DErrorBoundary>
                            )}
                        </div>
                    </motion.div>
                </main>

                {/* 모바일: 설정 드로어 백드롭 */}
                {mobileSettingsOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 z-40 md:hidden"
                        onClick={() => setMobileSettingsOpen(false)}
                        aria-hidden
                    />
                )}

                {/* Right Settings Panel - 데스크톱은 레이아웃, 모바일은 슬라이드 드로어 */}
                <aside
                    className={cn(
                        'flex flex-col gap-8 z-20 backdrop-blur-xl overflow-y-auto custom-scrollbar',
                        'bg-black/40 border-l border-white/10',
                        'md:relative md:w-80 md:p-6 md:shrink-0',
                        'fixed top-0 right-0 bottom-0 w-[min(320px,92vw)] p-6 pt-14 transition-transform duration-300 ease-out md:pt-6',
                        mobileSettingsOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
                    )}
                >
                    {/* 모바일 전용: 드로어 헤더(닫기) */}
                    <div className="md:hidden absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 border-b border-white/10 bg-black/60 z-10">
                        <span className="font-bold text-white text-sm">설정</span>
                        <button type="button" onClick={() => setMobileSettingsOpen(false)} className="p-2 rounded-lg text-white/70 hover:bg-white/10" aria-label="닫기">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <MakerTemplatePicker activeId={activeTemplateId} onApply={handleApplyTemplate} />

                    {/* 1. 이미지 또는 SVG 입력 */}
                    <div className="bg-teal-500/5 border border-teal-400/20 rounded-2xl p-5 shadow-xl">
                        <h3 className="font-bold text-[13px] text-white flex items-center gap-2 uppercase tracking-[0.15em] mb-3">
                            <span className="inline-flex w-6 h-6 rounded-full bg-teal-500/30 text-teal-300 text-[11px] font-black items-center justify-center">1</span>
                            로고·SVG 입력
                        </h3>
                        <p className="text-[11px] text-white/70 leading-relaxed break-keep">
                            <strong className="text-white/90">SVG</strong> 또는 단순 로고(PNG/JPEG)를 올려 실루엣을 돌출합니다.
                            제품 실사·인물·입체 피규어 사진은 Maker보다{' '}
                            <Link href="/quote?entry=photo" className="text-indigo-300 font-black underline-offset-2 hover:underline">
                                사진→AI 3D 견적
                            </Link>
                            이 적합합니다.
                        </p>
                    </div>

                    {/* Tool Settings */}
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                        <h3 className="font-bold text-[13px] text-white flex items-center gap-2 uppercase tracking-[0.2em] mb-6">
                            <Settings className="w-4 h-4 text-primary" />
                            브러쉬 설정
                        </h3>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">두께 (Stroke Width)</label>
                                    <span className="text-xs font-black text-primary bg-primary/20 px-3 py-1 rounded-full border border-primary/30">{strokeWidth}px</span>
                                </div>
                                <div className="px-1">
                                    <Slider
                                        value={[strokeWidth]}
                                        min={1} max={50} step={1}
                                        onValueChange={([v]) => setStrokeWidth(v)}
                                        className="cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Brush Color */}
                            <div>
                                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-4 block">색상 (Color)</label>
                                <div className="flex gap-3">
                                    {[
                                        { id: 'white', value: '#ffffff' },
                                        { id: 'neon-blue', value: '#00f0ff' },
                                        { id: 'neon-pink', value: '#ff007f' },
                                        { id: 'neon-green', value: '#39ff14' },
                                        { id: 'neon-yellow', value: '#ccff00' },
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setStrokeColor(c.value)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${strokeColor === c.value
                                                ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                                                : 'border-transparent hover:scale-110'
                                                }`}
                                            style={{
                                                backgroundColor: c.value,
                                                boxShadow: strokeColor === c.value ? `0 0 15px ${c.value}80` : undefined
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3D Properties */}
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 relative overflow-hidden group shadow-xl backdrop-blur-md">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

                        <h3 className="font-bold text-[13px] text-white flex items-center gap-2 uppercase tracking-[0.2em] mb-2 relative">
                            <span className="inline-flex w-6 h-6 rounded-full bg-primary/30 text-primary text-[11px] font-black items-center justify-center">3</span>
                            <Layers className="w-4 h-4 text-primary" />
                            레이어 · 모따기
                        </h3>
                        <p className="text-[10px] text-white/40 font-bold leading-relaxed break-keep mb-5 relative">
                            1층 베이스 → 2층 로고 돌출 → 선택 3층 테두리. 수치는 실제 mm에 가깝게 반영됩니다.
                        </p>

                        <div className="space-y-6 relative">
                            <div>
                                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-3 block">바닥 판형</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        ['none', '없음'],
                                        ['rect', '사각'],
                                        ['circle', '원형'],
                                        ['rounded', '라운드'],
                                    ] as const).map(([type, label]) => (
                                        <Button
                                            key={type}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBasePlateType(type)}
                                            className={`text-[11px] font-bold h-9 border-white/10 transition-all rounded-xl ${basePlateType === type ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {basePlateType !== 'none' && (
                                <>
                                    <MmControl
                                        label="판 크기 (mm)"
                                        value={baseSizeMm}
                                        min={10}
                                        max={80}
                                        step={1}
                                        onChange={setBaseSizeMm}
                                    />
                                    {basePlateType === 'rounded' && (
                                        <MmControl
                                            label="모서리 라운드 (mm)"
                                            value={cornerRadiusMm}
                                            min={0.4}
                                            max={16}
                                            step={0.2}
                                            onChange={setCornerRadiusMm}
                                        />
                                    )}
                                    <MmControl
                                        label="1층 · 베이스 두께 (mm)"
                                        value={baseHeight}
                                        min={0.5}
                                        max={20}
                                        step={0.5}
                                        onChange={setBaseHeight}
                                    />
                                    <MmControl
                                        label="3층 · 테두리 림 (mm)"
                                        value={rimHeightMm}
                                        min={0}
                                        max={8}
                                        step={0.2}
                                        onChange={setRimHeightMm}
                                    />
                                </>
                            )}

                            <div className="h-px bg-white/5" />

                            <MmControl
                                label="2층 · 로고/스케치 돌출 (mm)"
                                value={extrusionHeight}
                                min={0.4}
                                max={50}
                                step={0.2}
                                onChange={setExtrusionHeight}
                            />
                            <MmControl
                                label="모따기 bevel (mm)"
                                value={bevelMm}
                                min={0}
                                max={3}
                                step={0.1}
                                onChange={setBevelMm}
                            />

                            <div className="h-px bg-white/5" />

                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">그리드 표시 (Grid)</label>
                                <button
                                    onClick={() => setShowGrid(!showGrid)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ring-offset-black focus:ring-2 focus:ring-primary/50 ${showGrid ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${showGrid ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 이미지 선택 시 변환 옵션 */}
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <h3 className="font-bold text-[13px] text-white uppercase tracking-[0.15em] mb-4">로고 변환 옵션</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2 block">변환 모드 (실루엣 돌출)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        title="로고·단순 도형에 적합"
                                        onClick={() => setConvertMode('simple')}
                                        className={`h-9 rounded-xl text-center text-[11px] leading-tight px-2 min-w-0 flex items-center justify-center gap-1.5 ${convertMode === 'simple'
                                            ? 'bg-teal-500 border-2 border-teal-400 text-slate-950 font-semibold'
                                            : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white font-medium'}`}
                                    >
                                        {convertMode === 'simple' && <Check className="w-3.5 h-3.5 shrink-0" />}
                                        간단(로고)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        title="단순 실루엣이 필요한 사진용 — 입체 메시가 필요하면 견적 AI 사용"
                                        onClick={() => setConvertMode('detailed')}
                                        className={`h-9 rounded-xl text-center text-[11px] leading-tight px-2 min-w-0 flex items-center justify-center gap-1.5 ${convertMode === 'detailed'
                                            ? 'bg-teal-500 border-2 border-teal-400 text-slate-950 font-semibold'
                                            : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white font-medium'}`}
                                    >
                                        {convertMode === 'detailed' && <Check className="w-3.5 h-3.5 shrink-0" />}
                                        상세(실루엣)
                                    </Button>
                                </div>
                                <p className="text-[10px] text-white/40 mt-1.5 break-keep">
                                    Maker는 항상 <strong className="text-white/60">평면 돌출</strong>입니다. 입체 피규어·제품 사진은{' '}
                                    <Link href="/quote?entry=photo" className="text-indigo-300 hover:underline">사진→AI 3D</Link>를 사용하세요.
                                </p>
                            </div>
                            {convertMode === 'detailed' && (
                                <div className="rounded-xl border border-indigo-400/25 bg-indigo-500/10 p-3 space-y-2">
                                    <p className="text-[11px] text-indigo-100/90 font-bold leading-relaxed break-keep">
                                        실사 입체 모델이 필요하신가요?
                                    </p>
                                    <Link href="/quote?entry=photo" className="inline-flex items-center gap-1.5 text-[11px] font-black text-indigo-200 hover:text-white">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        자동견적 · 사진으로 3D 만들기
                                    </Link>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={useRemoveBg}
                                    onClick={() => setUseRemoveBg((v) => !v)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none ${useRemoveBg ? 'bg-teal-500 border-teal-400' : 'bg-white/10 border-white/20'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${useRemoveBg ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <label className="text-[11px] text-white/70 cursor-pointer" onClick={() => setUseRemoveBg((v) => !v)}>
                                    배경 제거 후 변환
                                </label>
                            </div>
                            <p className="text-[10px] text-white/40">
                                {removeBgConfigured === true && '배경 제거 사용 가능'}
                                {removeBgConfigured === false && 'API 미설정 — 켜도 배경 제거 없이 변환됩니다'}
                                {removeBgConfigured === null && 'remove.bg API 키 설정 시 사용 가능'}
                            </p>
                        </div>
                    </div>

                    {/* 모바일 견적 버튼 */}
                    <div className="md:hidden">
                        <Button
                            disabled={isQuoting}
                            onClick={() => {
                                setMobileSettingsOpen(false)
                                void handleRequestQuote()
                            }}
                            className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black gap-2"
                        >
                            {isQuoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                            견적 의뢰하기
                        </Button>
                    </div>

                    {/* 추가된 이미지(SVG): 스케치 탭에서도 삭제 가능 — 3D 탭 열지 않아도 됨 */}
                    {importedSvgs.length > 0 && (
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 shadow-xl">
                            <h3 className="font-bold text-[13px] text-white flex items-center gap-2 uppercase tracking-[0.15em] mb-4">
                                <ImageIcon className="w-4 h-4 text-primary" />
                                추가된 이미지 ({importedSvgs.length})
                            </h3>
                            <ul className="space-y-2">
                                {importedSvgs.map((svg) => (
                                    <li key={svg.id} className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-white/10">
                                        <span className="text-[11px] text-white/80 truncate flex-1 min-w-0" title={svg.name}>{svg.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 shrink-0 text-white/50 hover:text-red-400 hover:bg-red-500/10"
                                            onClick={() => {
                                                if (window.confirm(`"${svg.name}"을(를) 3D 목록에서 삭제하시겠습니까?`)) {
                                                    removeImportedSvg(svg.id);
                                                }
                                            }}
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[10px] text-white/40 mt-2">3D 보기 없이 여기서 삭제할 수 있습니다.</p>
                        </div>
                    )}

                    {/* 2. SVG 미리보기 — 확인 후 3D에 추가 */}
                    {pendingSvg && (
                        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 shadow-xl">
                            <h3 className="font-bold text-[13px] text-white flex items-center gap-2 uppercase tracking-[0.15em] mb-4">
                                <span className="inline-flex w-6 h-6 rounded-full bg-primary/30 text-primary text-[11px] font-black items-center justify-center">2</span>
                                <ImagePlus className="w-4 h-4 text-primary" />
                                SVG 미리보기
                            </h3>
                            <div className="space-y-4">
                                <div className="text-[11px] text-white/70 space-y-1.5">
                                    <p className="flex items-center gap-2">
                                        <span className="inline-flex w-5 h-5 rounded-full bg-primary/30 text-primary text-[10px] font-bold items-center justify-center">2</span>
                                        SVG 확인 (변환됨 또는 직접 입력)
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="inline-flex w-5 h-5 rounded-full bg-white/10 text-white/70 text-[10px] font-bold items-center justify-center">3</span>
                                        돌출 높이 설정 후 [3D에 추가] → 결과물(3D) 탭에서 확인
                                    </p>
                                </div>
                                <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10 aspect-square max-h-32 flex items-center justify-center">
                                    <img
                                        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(pendingSvg.svgContent)}`}
                                        alt="SVG 미리보기"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                                <p className="text-[10px] text-white/50 truncate" title={pendingSvg.name}>{pendingSvg.name}</p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1 h-10 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                                        onClick={handleAddPendingTo3D}
                                    >
                                        <Check className="w-4 h-4 mr-1.5" />
                                        3D에 추가
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-10 px-4 text-xs rounded-xl border-white/20 text-white/70 hover:bg-white/10"
                                        onClick={() => setPendingSvg(null)}
                                    >
                                        취소
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 도움말: 1 → 2 → 3 작업 순서 */}
                    <div className="mt-auto pt-6 border-t border-white/10">
                        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                            <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div className="text-xs text-white/60 leading-relaxed space-y-1">
                                <span className="text-white/90 font-semibold block mb-1">작업 순서</span>
                                <p><strong className="text-primary font-medium">1</strong> 배지·키캡 템플릿(선택) → <strong className="text-primary font-medium">2</strong> 로고·SVG → <strong className="text-primary font-medium">3</strong> 결과물(3D)에서 레이어·bevel 확인. <strong className="text-white/80">STL 저장</strong> 또는 견적 의뢰.</p>
                                <p className="text-white/50">실사 입체는 사진→AI 3D 견적, 로고 돌출은 Maker입니다.</p>
                            </div>
                        </div>
                    </div>

                </aside>
            </div>
        </div>
        </>
    );
}

function MmControl({
    label,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    step: number
    onChange: (n: number) => void
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-3 gap-2">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">{label}</label>
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => {
                        const n = Number(e.target.value)
                        if (Number.isFinite(n)) onChange(n)
                    }}
                    className="w-16 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-right font-mono text-[11px] text-teal-300 outline-none focus:border-teal-400/50"
                    aria-label={label}
                />
            </div>
            <div className="px-1">
                <Slider
                    value={[value]}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={([v]) => onChange(v)}
                    className="cursor-pointer"
                />
            </div>
        </div>
    )
}

function ToolbarButton({ active, onClick, icon, label, className = '' }: any) {
    return (
        <div className="group relative flex flex-col items-center gap-1">
            <button
                onClick={onClick}
                title={label}
                className={`w-12 h-12 rounded-2xl transition-all duration-300 flex items-center justify-center
                ${active ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,118,255,0.4)]' : 'bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}
                ${className}
            `}
            >
                {icon}
            </button>
            {/* 항상 보이는 라벨 (호버 불필요) */}
            <span className="text-[9px] font-medium text-white/70 group-hover:text-white/90 text-center leading-tight max-w-[48px] truncate">
                {label}
            </span>
        </div>
    );
}
