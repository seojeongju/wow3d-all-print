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
        canvasSize
    } = useMakerStore();

    const [activeTab, setActiveTab] = useState('draw');
    const [show3dCanvas, setShow3dCanvas] = useState(false);
    const [pendingSvg, setPendingSvg] = useState<{ name: string; svgContent: string } | null>(null);
    const [convertMode, setConvertMode] = useState<ConvertMode>('detailed');
    const [useRemoveBg, setUseRemoveBg] = useState(false);
    const [removeBgConfigured, setRemoveBgConfigured] = useState<boolean | null>(null);

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

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                    {/* Main Workspace */}
                    <main className="flex-1 relative bg-[#f8fafc] overflow-hidden">
                        <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

                        {activeTab === 'draw' ? (
                            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
                                <div className="w-full h-full max-w-[800px] max-h-[800px] aspect-square bg-white rounded-3xl shadow-2xl border border-primary/10 overflow-hidden relative">
                                    <Canvas2D />
                                    
                                    {/* 2D Floating Toolbar */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-3 bg-white/80 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-2xl z-20">
                                        <ToolbarButton active={tool === 'pen'} onClick={() => setTool('pen')} icon={<Pencil className="w-4 h-4" />} label="그리기" />
                                        <ToolbarButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser className="w-4 h-4" />} label="지우개" />
                                        <div className="w-px h-8 bg-primary/10 mx-1" />
                                        <ToolbarButton onClick={undo} icon={<Undo className="w-4 h-4" />} label="되돌리기" />
                                        <ToolbarButton onClick={clearCanvas} icon={<Trash2 className="w-4 h-4" />} label="전체삭제" className="hover:text-red-500 hover:bg-red-50" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-slate-900">
                                <Maker3DErrorBoundary onRetry={() => setActiveTab('draw')}>
                                    {show3dCanvas && <Preview3D />}
                                </Maker3DErrorBoundary>
                                
                                {/* 3D Floating Controls */}
                                <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
                                    <div className="p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Extrusion</span>
                                            <span className="text-xs font-bold">{extrusionHeight}mm</span>
                                        </div>
                                        <Slider
                                            value={[extrusionHeight]}
                                            onValueChange={(v) => setExtrusionHeight(v[0])}
                                            min={1}
                                            max={50}
                                            step={1}
                                            className="w-40"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Right Sidebar - Settings & Assets */}
                    <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-primary/10 bg-white/40 backdrop-blur-xl flex flex-col z-10 shrink-0 overflow-y-auto">
                        <div className="p-6 space-y-8">
                            {/* 섹션: 이미지 변환 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ImagePlus className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">이미지 가져오기</h3>
                                </div>
                                <div className="glass-card p-4 bg-primary/5 border-primary/10">
                                    <ImageUploader 
                                        onSvgConverted={(data) => setPendingSvg(data)} 
                                        convertMode={convertMode}
                                        useRemoveBg={useRemoveBg}
                                    />
                                </div>

                                {pendingSvg && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-primary/10 border border-primary/20 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-primary truncate max-w-[150px]">{pendingSvg.name}</span>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg hover:bg-red-50 hover:text-red-500" onClick={() => setPendingSvg(null)}>
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        <Button className="w-full h-10 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20" onClick={handleAddPendingTo3D}>
                                            <Check className="w-4 h-4 mr-2" />
                                            3D 모델로 추가
                                        </Button>
                                    </motion.div>
                                )}
                            </div>

                            <div className="h-px bg-primary/10" />

                            {/* 섹션: 레이어 관리 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Layers className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">레이어 관리</h3>
                                </div>
                                
                                {importedSvgs.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-primary/10 rounded-2xl bg-primary/5">
                                        <p className="text-[11px] font-bold text-foreground/30 uppercase tracking-tighter">추가된 모델이 없습니다</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {importedSvgs.map((svg) => (
                                            <div key={svg.id} className="flex items-center justify-between p-3 bg-white/60 border border-primary/10 rounded-xl group hover:border-primary/30 transition-all">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                        <ImageIcon className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-bold text-foreground/70 truncate">{svg.name}</span>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImportedSvg(svg.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 안내 섹션 */}
                            <div className="p-5 bg-foreground/5 rounded-2xl border border-foreground/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Workflow Tip</span>
                                </div>
                                <div className="text-xs text-foreground/60 leading-relaxed space-y-1">
                                    <span className="text-foreground/90 font-bold block mb-1 uppercase tracking-tighter">작업 가이드</span>
                                    <p><strong className="text-primary font-black">01</strong> 이미지 업로드 및 변환</p>
                                    <p><strong className="text-primary font-black">02</strong> 3D 모델 추가 버튼 클릭</p>
                                    <p><strong className="text-primary font-black">03</strong> 결과물 탭에서 두께 조절 및 STL 저장</p>
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
                ${active ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,255,204,0.4)]' : 'bg-primary/5 text-foreground/40 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/10'}
                ${className}
            `}
            >
                {icon}
            </button>
            <span className="text-[9px] font-black text-foreground/40 group-hover:text-primary text-center leading-tight max-w-[48px] truncate uppercase tracking-tighter transition-colors">
                {label}
            </span>
        </div>
    );
}
