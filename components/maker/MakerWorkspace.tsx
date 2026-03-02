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
import { motion } from 'framer-motion';

export function MakerWorkspace() {
    const {
        tool, setTool,
        strokeWidth, setStrokeWidth,
        extrusionHeight, setExtrusionHeight,
        undo, clearCanvas, triggerExport
    } = useMakerStore();

    const [activeTab, setActiveTab] = useState('draw');

    return (
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

                        {/* 3D Preview Layer */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === '3d' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            {/* Inner dark gradient for 3D view context */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]" />
                            <Preview3D />
                        </div>
                    </motion.div>
                </main>

                {/* Right Settings Panel */}
                <aside className="w-80 bg-black/40 border-l border-white/10 p-6 flex flex-col gap-8 z-20 backdrop-blur-xl shrink-0 overflow-y-auto custom-scrollbar">

                    {/* Tool Settings */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                        <h3 className="font-semibold text-[13px] text-white/90 mb-5 flex items-center gap-2 uppercase tracking-widest">
                            <Settings className="w-4 h-4 text-primary" />
                            브러쉬 설정
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-medium text-white/70">두께 (Stroke Width)</label>
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{strokeWidth}px</span>
                                </div>
                                <Slider
                                    value={[strokeWidth]}
                                    min={1} max={50} step={1}
                                    onValueChange={([v]) => setStrokeWidth(v)}
                                    className="pt-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3D Properties */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                        {/* Glow effect on hover */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

                        <h3 className="font-semibold text-[13px] text-white/90 mb-5 flex items-center gap-2 uppercase tracking-widest relative">
                            <Layers className="w-4 h-4 text-primary" />
                            3D 변환 설정
                        </h3>

                        <div className="space-y-6 relative">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-medium text-white/70">돌출 높이 (Z-Axis)</label>
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{extrusionHeight}mm</span>
                                </div>
                                <Slider
                                    value={[extrusionHeight]}
                                    min={1} max={50} step={0.5}
                                    onValueChange={([v]) => setExtrusionHeight(v)}
                                    className="pt-2"
                                />
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
