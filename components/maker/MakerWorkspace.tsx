'use client';

import React, { useState, useEffect } from 'react';
import { useMakerStore } from '@/store/useMakerStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Eraser, Undo, Trash2, Box, Download, Settings, Layers, Zap, ImagePlus, Check, ImageIcon, PanelRightOpen, X } from 'lucide-react';
import { Canvas2D } from '@/components/maker/Canvas2D';
import { Preview3D } from '@/components/maker/Preview3D';
import { ImageUploader } from '@/components/maker/ImageUploader';
import { Maker3DErrorBoundary } from '@/components/maker/Maker3DErrorBoundary';
import { Exporter } from '@/components/maker/Exporter';
import type { ConvertMode } from '@/lib/image-processor';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/** 3D → 스케치 전환 시 WebGL을 즉시 언마운트하면 Context Lost 발생. 짧은 지연 후 언마운트로 완화 */
const UNMOUNT_3D_DELAY_MS = 180;

export function MakerWorkspace() {
    const {
        tool, setTool,
        strokeWidth, setStrokeWidth,
        strokeColor, setStrokeColor,
        extrusionHeight, setExtrusionHeight,
        basePlateType, setBasePlateType,
        showGrid, setShowGrid,
        undo, clearCanvas, triggerExport,
        addImportedSvg,
        importedSvgs,
        removeImportedSvg,
    } = useMakerStore();

    const [activeTab, setActiveTab] = useState('draw');
    const [show3dCanvas, setShow3dCanvas] = useState(false);
    const [pendingSvg, setPendingSvg] = useState<{ name: string; svgContent: string } | null>(null);
    const [convertMode, setConvertMode] = useState<ConvertMode>('detailed');
    const [useRemoveBg, setUseRemoveBg] = useState(false);
    const [removeBgConfigured, setRemoveBgConfigured] = useState<boolean | null>(null);
    const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

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

    return (
        <>
        <Exporter />
        <div className="flex flex-col w-full max-w-6xl min-h-[100dvh] md:h-[800px] glass-card rounded-none md:rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-primary/10 mx-auto transition-all duration-500">
            {/* Header */}
            <header className="h-14 md:h-16 border-b border-primary/10 bg-white/20 backdrop-blur-md flex items-center justify-between px-3 md:px-6 z-20 shrink-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0 cyber-glow-mint">
                        <Box className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-black text-foreground tracking-widest text-sm md:text-base truncate uppercase">AI 3D Maker</span>
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-9 md:h-10">
                        <TabsList className="grid w-[160px] md:w-[220px] grid-cols-2 h-9 md:h-10 bg-primary/5 border border-primary/10 rounded-xl p-1">
                            <TabsTrigger value="draw" className="text-[10px] md:text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground/50 hover:text-foreground rounded-lg transition-all uppercase tracking-tighter">스케치(2D)</TabsTrigger>
                            <TabsTrigger value="3d" className="text-[10px] md:text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground/50 hover:text-foreground rounded-lg transition-all uppercase tracking-tighter">결과물(3D)</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="w-px h-5 md:h-6 bg-primary/10 hidden sm:block" />

                    <Button variant="outline" size="sm" className="h-9 md:h-10 px-3 md:px-4 text-[10px] md:text-xs font-black bg-white/20 border-primary/20 text-primary hover:bg-primary/10 rounded-xl transition-all uppercase tracking-tight" onClick={triggerExport}>
                        <Download className="w-3.5 h-3.5 md:w-4 md:h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">STL 저장</span>
                    </Button>
                    <Button size="sm" className="hidden sm:flex h-9 md:h-10 px-4 md:px-6 text-[10px] md:text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_14px_0_rgba(0,255,204,0.4)] rounded-xl transition-all uppercase tracking-widest">
                        견적 의뢰하기
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative min-h-0 cyber-grid">
                {/* Left Toolbar */}
                <aside className="w-14 md:w-20 bg-white/10 border-r border-primary/10 flex flex-col items-center py-3 md:py-6 gap-2 md:gap-4 z-20 backdrop-blur-xl shrink-0">
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
                    <div className="w-6 md:w-8 h-px bg-primary/10 my-1 md:my-2" />
                    <ToolbarButton
                        onClick={undo}
                        icon={<Undo className="w-4 h-4 md:w-5 md:h-5" />}
                        label="취소"
                    />
                    <ToolbarButton
                        onClick={clearCanvas}
                        icon={<Trash2 className="w-4 h-4 md:w-5 md:h-5" />}
                        label="지우기"
                        className="hover:text-red-500 hover:bg-red-500/10 text-foreground/40"
                    />

                    <div className="w-6 md:w-8 h-px bg-primary/10 my-1 md:my-2" />
                    <div className="w-full px-1.5 md:px-3 flex justify-center">
                        <ImageUploader
                            onSvgConverted={(data) => setPendingSvg(data)}
                            convertMode={convertMode}
                            useRemoveBg={useRemoveBg}
                        />
                    </div>
                </aside>

                {/* Center Workspace */}
                <main className="flex-1 min-w-0 relative flex items-center justify-center p-3 md:p-8 z-10 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full h-full max-w-4xl max-h-full md:max-h-[650px] glass-effect rounded-[2rem] overflow-hidden shadow-2xl"
                    >
                        {/* 2D Canvas Layer */}
                        <div className={`absolute inset-0 transition-opacity duration-500 ${activeTab === 'draw' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <Canvas2D />
                        </div>

                        {/* 3D Preview Layer */}
                        <div className={`absolute inset-0 transition-opacity duration-500 ${activeTab === '3d' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] dark:from-[#0a0a0f] dark:to-[#12121a]" />
                            {show3dCanvas && (
                                <Maker3DErrorBoundary onRetry={() => setActiveTab('draw')}>
                                    <Preview3D />
                                </Maker3DErrorBoundary>
                            )}
                        </div>
                    </motion.div>
                </main>

                {/* Right Settings Panel */}
                <aside
                    className={cn(
                        'flex flex-col gap-8 z-20 backdrop-blur-xl overflow-y-auto custom-scrollbar',
                        'bg-white/10 border-l border-primary/10',
                        'md:relative md:w-80 md:p-6 md:shrink-0',
                        'fixed top-0 right-0 bottom-0 w-[min(340px,92vw)] p-6 pt-14 transition-transform duration-500 ease-out md:pt-6',
                        mobileSettingsOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
                    )}
                >
                    {/* Settings Sections with Glass Cards */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                        <h3 className="font-black text-[11px] text-primary flex items-center gap-2 uppercase tracking-[0.2em] mb-3">
                            <span className="inline-flex w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black items-center justify-center cyber-glow-mint">1</span>
                            STEP: INPUT
                        </h3>
                        <p className="text-[11px] text-foreground/60 leading-relaxed font-bold">
                            이미지 또는 SVG를 선택하세요. <span className="text-primary">SVG</span> 직접 입력이 가장 정교합니다.
                        </p>
                    </div>

                    <div className="bg-white/40 border border-primary/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-8">
                        <h3 className="font-black text-[11px] text-foreground/70 flex items-center gap-2 uppercase tracking-[0.2em]">
                            <Settings className="w-4 h-4 text-primary" />
                            브러쉬 설정
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">두께</label>
                                    <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{strokeWidth}px</span>
                                </div>
                                <Slider
                                    value={[strokeWidth]}
                                    min={1} max={50} step={1}
                                    onValueChange={([v]) => setStrokeWidth(v)}
                                    className="accent-primary"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-4 block">색상</label>
                                <div className="flex flex-wrap gap-2.5">
                                    {[
                                        { id: 'mint', value: '#00ffcc' },
                                        { id: 'white', value: '#ffffff' },
                                        { id: 'blue', value: '#00f0ff' },
                                        { id: 'pink', value: '#ff007f' },
                                        { id: 'black', value: '#1a1a1a' },
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setStrokeColor(c.value)}
                                            className={`w-7 h-7 rounded-full border-2 transition-all duration-300 ${strokeColor === c.value
                                                ? 'border-primary scale-110 shadow-[0_0_10px_rgba(0,255,204,0.5)]'
                                                : 'border-transparent hover:scale-110 hover:border-primary/30'
                                                }`}
                                            style={{ backgroundColor: c.value }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/40 border border-primary/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-8">
                        <h3 className="font-black text-[11px] text-foreground/70 flex items-center gap-2 uppercase tracking-[0.2em]">
                            <Layers className="w-4 h-4 text-primary" />
                            3D 속성
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">돌출 높이</label>
                                    <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{extrusionHeight}mm</span>
                                </div>
                                <Slider
                                    value={[extrusionHeight]}
                                    min={1} max={50} step={0.5}
                                    onValueChange={([v]) => setExtrusionHeight(v)}
                                    className="accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">그리드 표시</label>
                                <button
                                    onClick={() => setShowGrid(!showGrid)}

                    {/* 이미지 선택 시 변환 옵션 (1단계에서 이미지 사용 시만 해당) */}
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <h3 className="font-bold text-[13px] text-white uppercase tracking-[0.15em] mb-4">이미지 선택 시 변환 옵션</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2 block">변환 모드 (돌출 시)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        title="로고·단순 도형에 적합"
                                        onClick={() => setConvertMode('simple')}
                                        className={`h-9 rounded-xl text-center text-[11px] leading-tight px-2 min-w-0 flex items-center justify-center gap-1.5 ${convertMode === 'simple'
                                            ? 'bg-primary border-2 border-primary text-primary-foreground font-semibold ring-2 ring-primary/50 ring-offset-2 ring-offset-[#0d0d0d]'
                                            : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white font-medium'}`}
                                    >
                                        {convertMode === 'simple' && <Check className="w-3.5 h-3.5 shrink-0" />}
                                        간단(로고)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        title="사진·실물·펜 등 디테일 권장"
                                        onClick={() => setConvertMode('detailed')}
                                        className={`h-9 rounded-xl text-center text-[11px] leading-tight px-2 min-w-0 flex items-center justify-center gap-1.5 ${convertMode === 'detailed'
                                            ? 'bg-primary border-2 border-primary text-primary-foreground font-semibold ring-2 ring-primary/50 ring-offset-2 ring-offset-[#0d0d0d]'
                                            : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white font-medium'}`}
                                    >
                                        {convertMode === 'detailed' && <Check className="w-3.5 h-3.5 shrink-0" />}
                                        상세(사진·실물)
                                    </Button>
                                </div>
                                <p className="text-[10px] text-white/40 mt-1.5">사진·펜 등은 상세 권장</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={useRemoveBg}
                                    onClick={() => setUseRemoveBg((v) => !v)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none ${useRemoveBg ? 'bg-primary border-primary' : 'bg-white/10 border-white/20'}`}
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
                                <p><strong className="text-primary font-medium">1</strong> 이미지 또는 SVG 입력 → <strong className="text-primary font-medium">2</strong> SVG 미리보기 → <strong className="text-primary font-medium">3</strong> 3D 돌출(결과물 탭). <strong className="text-white/80">STL 저장</strong>으로 내보내기.</p>
                                <p className="text-white/50">SVG 파일 직접 입력 시 변환 없이 사용해 가장 안정적입니다. 스케치(2D)는 그리면 결과물(3D)에서 바로 확인됩니다.</p>
                            </div>
                        </div>
                    </div>

                </aside>
            </div>
        </div>
        </>
    );
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
