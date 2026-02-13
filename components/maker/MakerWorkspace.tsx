'use client';

import React, { useState } from 'react';
import { useMakerStore } from '@/store/useMakerStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Eraser, Undo, Trash2, Box, Download, Settings, Layers } from 'lucide-react';
import { Canvas2D } from '@/components/maker/Canvas2D';
import { Preview3D } from '@/components/maker/Preview3D';
import { ImageUploader } from '@/components/maker/ImageUploader';

export function MakerWorkspace() {
    const {
        tool, setTool,
        strokeWidth, setStrokeWidth,
        extrusionHeight, setExtrusionHeight,
        undo, clearCanvas, triggerExport
    } = useMakerStore();

    const [activeTab, setActiveTab] = useState('draw');

    return (
        <div className="flex flex-col bg-gray-50 h-[700px] border rounded-xl overflow-hidden shadow-sm">
            {/* Header - Simplified for embedded view */}
            <header className="h-14 border-b bg-white flex items-center justify-between px-4 z-10">
                <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-gray-700">Canvas Workspace</span>
                </div>

                <div className="flex gap-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-8">
                        <TabsList className="grid w-[180px] grid-cols-2 h-8">
                            <TabsTrigger value="draw" className="text-xs">2D Draw</TabsTrigger>
                            <TabsTrigger value="3d" className="text-xs">3D View</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="w-px h-6 bg-gray-200 mx-1" />

                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={triggerExport}>
                        <Download className="w-3 h-3 mr-1.5" />
                        STL
                    </Button>
                    <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700">
                        Save
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                <aside className="w-14 bg-white border-r flex flex-col items-center py-4 gap-3 z-10">
                    <ToolbarButton
                        active={tool === 'pen'}
                        onClick={() => setTool('pen')}
                        icon={<Pencil className="w-4 h-4" />}
                        label="Pen"
                    />
                    <ToolbarButton
                        active={tool === 'eraser'}
                        onClick={() => setTool('eraser')}
                        icon={<Eraser className="w-4 h-4" />}
                        label="Eraser"
                    />
                    <div className="w-full h-px bg-gray-200 my-1" />
                    <ToolbarButton
                        onClick={undo}
                        icon={<Undo className="w-4 h-4" />}
                        label="Undo"
                    />
                    <ToolbarButton
                        onClick={clearCanvas}
                        icon={<Trash2 className="w-4 h-4" />}
                        label="Clear"
                        className="text-red-500 hover:bg-red-50"
                    />

                    <div className="w-full h-px bg-gray-200 my-1" />
                    <div className="w-full px-1">
                        <ImageUploader />
                    </div>
                </aside>

                {/* Center Workspace */}
                <main className="flex-1 relative bg-gray-100 flex items-center justify-center overflow-hidden p-4">
                    <div className="relative shadow-lg rounded-lg overflow-hidden bg-white w-full h-full max-w-4xl max-h-[600px]">
                        {/* 2D Canvas Layer */}
                        <div className={`absolute inset-0 ${activeTab === 'draw' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
                            <Canvas2D />
                        </div>

                        {/* 3D Preview Layer */}
                        <div className={`absolute inset-0 ${activeTab === '3d' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'} bg-gray-900`}>
                            <Preview3D />
                        </div>
                    </div>
                </main>

                {/* Right Settings Panel */}
                <aside className="w-72 bg-white border-l p-4 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Tool Settings
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Stroke Width</label>
                                <div className="flex items-center gap-3">
                                    <Slider
                                        value={[strokeWidth]}
                                        min={1} max={50} step={1}
                                        onValueChange={([v]) => setStrokeWidth(v)}
                                        className="flex-1"
                                    />
                                    <span className="text-xs font-medium w-6 text-right">{strokeWidth}px</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            3D Properties
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Extrusion Height (mm)</label>
                                <div className="flex items-center gap-3">
                                    <Slider
                                        value={[extrusionHeight]}
                                        min={1} max={20} step={0.5}
                                        onValueChange={([v]) => setExtrusionHeight(v)}
                                        className="flex-1"
                                    />
                                    <span className="text-xs font-medium w-6 text-right">{extrusionHeight}</span>
                                </div>
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
        <button
            onClick={onClick}
            className={`p-2.5 rounded-lg transition-all group relative flex items-center justify-center
        ${active ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}
        ${className}
      `}
            title={label}
        >
            {icon}
        </button>
    );
}
