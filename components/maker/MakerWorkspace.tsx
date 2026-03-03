'use client';

import React, { useState } from 'react';
import { useMakerStore } from '@/store/useMakerStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Eraser, Undo, Trash2, Box, Download, Settings, Layers, Zap } from 'lucide-react';
import { Canvas2D } from '@/components/maker/Canvas2D';
import { Preview3D } from '@/components/maker/Preview3D';
import { ImageUploader } from '@/components/maker/ImageUploader';
import { Maker3DErrorBoundary } from '@/components/maker/Maker3DErrorBoundary';
import { Exporter } from '@/components/maker/Exporter';
import { motion } from 'framer-motion';

export function MakerWorkspace() {
    const {
        tool, setTool,
        strokeWidth, setStrokeWidth,
        strokeColor, setStrokeColor,
        extrusionHeight, setExtrusionHeight,
        basePlateType, setBasePlateType,
        showGrid, setShowGrid,
        undo, clearCanvas, triggerExport
    } = useMakerStore();

    const [activeTab, setActiveTab] = useState('draw');

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
                        <ImageUploader />
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

                    {/* Helper text */}
                    <div className="mt-auto pt-6 border-t border-white/10">
                        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                            <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div className="text-xs text-white/60 leading-relaxed">
                                <span className="text-white/90 font-semibold block mb-1">스마트 AI 렌더링</span>
                                2D 스케치를 그리면 실시간으로 뒷단에서 3D 모델로 계산됩니다. <strong className="text-primary font-medium">결과물(3D)</strong> 탭을 클릭하여 확인하세요.
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
        <div className="group relative">
            <button
                onClick={onClick}
                className={`w-12 h-12 rounded-2xl transition-all duration-300 flex items-center justify-center
                ${active ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,118,255,0.4)]' : 'bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}
                ${className}
            `}
            >
                {icon}
            </button>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] whitespace-nowrap rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                {label}
            </div>
        </div>
    );
}
