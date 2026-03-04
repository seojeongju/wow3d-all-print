'use client';

import React, { useState } from 'react';
import { useMakerStore } from '@/store/useMakerStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Eraser, Undo, Trash2, Box, Download, Settings, Layers, Zap, ImagePlus, Check } from 'lucide-react';
import { Canvas2D } from '@/components/maker/Canvas2D';
import { Preview3D } from '@/components/maker/Preview3D';
import { ImageUploader } from '@/components/maker/ImageUploader';
import { Maker3DErrorBoundary } from '@/components/maker/Maker3DErrorBoundary';
import { Exporter } from '@/components/maker/Exporter';
import type { ConvertMode } from '@/lib/image-processor';
import { motion } from 'framer-motion';

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
    } = useMakerStore();

    const [activeTab, setActiveTab] = useState('draw');
    const [pendingSvg, setPendingSvg] = useState<{ name: string; svgContent: string } | null>(null);
    const [convertMode, setConvertMode] = useState<ConvertMode>('detailed');
    const [useRemoveBg, setUseRemoveBg] = useState(false);

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
        <div className="flex flex-col w-full max-w-6xl h-[800px] bg-[#0d0d0d]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/5 mx-auto">
            {/* Header */}
            <header className="h-16 border-b border-white/10 bg-white/[0.02] flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Box className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-white tracking-wide">AI 3D Maker</span>
                </div>

                <div className="flex items-center gap-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-10">
                        <TabsList className="grid w-[200px] grid-cols-2 h-10 bg-white/5 border border-white/10 rounded-xl">
                            <TabsTrigger value="draw" className="text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">스케치(2D)</TabsTrigger>
                            <TabsTrigger value="3d" className="text-xs font-semibold data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg transition-all">결과물(3D)</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <Button variant="outline" size="sm" className="h-10 px-4 text-xs font-semibold border-white/20 text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all" onClick={triggerExport}>
                        <Download className="w-4 h-4 mr-2" />
                        STL 저장
                    </Button>
                    <Button size="sm" className="h-10 px-6 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_14px_0_rgba(0,118,255,0.4)] rounded-xl transition-all">
                        견적 의뢰하기
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] z-0" />

                {/* Left Toolbar */}
                <aside className="w-20 bg-black/40 border-r border-white/10 flex flex-col items-center py-6 gap-4 z-20 backdrop-blur-xl">
                    <ToolbarButton
                        active={tool === 'pen'}
                        onClick={() => setTool('pen')}
                        icon={<Pencil className="w-5 h-5" />}
                        label="펜"
                    />
                    <ToolbarButton
                        active={tool === 'eraser'}
                        onClick={() => setTool('eraser')}
                        icon={<Eraser className="w-5 h-5" />}
                        label="지우개"
                    />
                    <div className="w-8 h-px bg-white/10 my-2" />
                    <ToolbarButton
                        onClick={undo}
                        icon={<Undo className="w-5 h-5" />}
                        label="실행 취소"
                    />
                    <ToolbarButton
                        onClick={clearCanvas}
                        icon={<Trash2 className="w-5 h-5" />}
                        label="전체 지우기"
                        className="hover:text-red-400 hover:bg-red-500/10 text-white/50"
                    />

                    <div className="w-8 h-px bg-white/10 my-2" />
                    <div className="w-full px-3 flex justify-center">
                        <ImageUploader
                            onSvgConverted={(data) => setPendingSvg(data)}
                            convertMode={convertMode}
                            useRemoveBg={useRemoveBg}
                        />
                    </div>
                </aside>

                {/* Center Workspace */}
                <main className="flex-1 relative flex items-center justify-center p-8 z-10 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="relative w-full h-full max-w-4xl max-h-[650px] bg-white/[0.02] border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl backdrop-blur-md"
                    >
                        {/* 2D Canvas Layer */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'draw' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <Canvas2D />
                        </div>

                        {/* 3D Preview Layer: 결과물(3D) 탭 선택 시에만 WebGL 마운트 → Context Lost 방지 */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === '3d' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]" />
                            {activeTab === '3d' && (
                                <Maker3DErrorBoundary onRetry={() => setActiveTab('draw')}>
                                    <Preview3D />
                                </Maker3DErrorBoundary>
                            )}
                        </div>
                    </motion.div>
                </main>

                {/* Right Settings Panel */}
                <aside className="w-80 bg-black/40 border-l border-white/10 p-6 flex flex-col gap-8 z-20 backdrop-blur-xl shrink-0 overflow-y-auto custom-scrollbar">

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
                        {/* Glow effect on hover */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

                        <h3 className="font-bold text-[13px] text-white flex items-center gap-2 uppercase tracking-[0.2em] mb-6 relative">
                            <Layers className="w-4 h-4 text-primary" />
                            3D 변환 설정
                        </h3>

                        <div className="space-y-8 relative">
                            {/* Extrusion Height */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">돌출 높이 (Z-Axis)</label>
                                    <span className="text-xs font-black text-primary bg-primary/20 px-3 py-1 rounded-full border border-primary/30">{extrusionHeight}mm</span>
                                </div>
                                <div className="px-1">
                                    <Slider
                                        value={[extrusionHeight]}
                                        min={1} max={50} step={0.5}
                                        onValueChange={([v]) => setExtrusionHeight(v)}
                                        className="cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            {/* Base Plate Type */}
                            <div>
                                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-4 block">바닥 판형 (Base Plate)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['none', 'rect'] as const).map((type) => (
                                        <Button
                                            key={type}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBasePlateType(type)}
                                            className={`text-[12px] font-bold h-10 border-white/10 transition-all rounded-xl ${basePlateType === type ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {type === 'none' ? '없음' : '사각형'}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            {/* Grid Visibility */}
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

                    {/* 이미지 변환 품질: 간단/상세, 배경 제거 */}
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <h3 className="font-bold text-[13px] text-white uppercase tracking-[0.15em] mb-4">이미지 변환 품질</h3>
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
                                            ? 'bg-primary border-2 border-primary text-white font-semibold ring-2 ring-primary/50 ring-offset-2 ring-offset-[#0d0d0d]'
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
                                            ? 'bg-primary border-2 border-primary text-white font-semibold ring-2 ring-primary/50 ring-offset-2 ring-offset-[#0d0d0d]'
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
                            <p className="text-[10px] text-white/40">remove.bg API 키 설정 시 사용 가능</p>
                        </div>
                    </div>

                    {/* 이미지 → SVG 변환 결과: 돌출 높이 지정 후 3D에 추가 */}
                    {pendingSvg && (
                        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 shadow-xl">
                            <h3 className="font-bold text-[13px] text-white flex items-center gap-2 uppercase tracking-[0.15em] mb-4">
                                <ImagePlus className="w-4 h-4 text-primary" />
                                이미지 → SVG → 돌출
                            </h3>
                            <div className="space-y-4">
                                <div className="text-[11px] text-white/70 space-y-1.5">
                                    <p className="flex items-center gap-2">
                                        <span className="inline-flex w-5 h-5 rounded-full bg-primary/30 text-primary text-[10px] font-bold items-center justify-center">1</span>
                                        SVG 변환 완료
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="inline-flex w-5 h-5 rounded-full bg-white/10 text-white/70 text-[10px] font-bold items-center justify-center">2</span>
                                        아래 돌출 높이를 지정한 뒤
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="inline-flex w-5 h-5 rounded-full bg-white/10 text-white/70 text-[10px] font-bold items-center justify-center">3</span>
                                        [3D에 추가]를 누르세요.
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

                    {/* 도움말: 스케치/이미지 → 돌출 3D 출력 */}
                    <div className="mt-auto pt-6 border-t border-white/10">
                        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                            <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div className="text-xs text-white/60 leading-relaxed space-y-1">
                                <span className="text-white/90 font-semibold block mb-1">작업 순서</span>
                                <p><strong className="text-primary font-medium">이미지</strong>: 업로드 → SVG 변환 → 돌출 높이 지정 → [3D에 추가]. <strong className="text-primary font-medium">스케치(2D)</strong>: 그리면 결과물(3D) 탭에서 확인. <strong className="text-white/80">STL 저장</strong>으로 내보내기.</p>
                                <p className="text-white/50">돌출은 실루엣을 높이로 올린 2.5D 형태입니다. 로고·단순 도형에 적합합니다.</p>
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
