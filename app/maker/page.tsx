'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMakerStore } from '@/store/useMakerStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Eraser, Undo, Trash2, Box, Download, Settings, Layers } from 'lucide-react';
import { Canvas2D } from '@/components/maker/Canvas2D';
import { Preview3D } from '@/components/maker/Preview3D';
import { ImageUploader } from '@/components/maker/ImageUploader';

export default function MakerPage() {
    const {
        tool, setTool,
        strokeWidth, setStrokeWidth,
        extrusionHeight, setExtrusionHeight,
        undo, clearCanvas
    } = useMakerStore();

    const [activeTab, setActiveTab] = useState('draw');

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <Box className="w-6 h-6 text-indigo-600" />
                    <h1 className="font-bold text-lg text-gray-800">Smart Maker Canvas</h1>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export STL
                    </Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        Save Project
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                <aside className="w-16 bg-white border-r flex flex-col items-center py-4 gap-4 z-10">
                    <ToolbarButton
                        active={tool === 'pen'}
                        onClick={() => setTool('pen')}
                        icon={<Pencil className="w-5 h-5" />}
                        label="Pen"
                    />
                    <ToolbarButton
                        active={tool === 'eraser'}
                        onClick={() => setTool('eraser')}
                        icon={<Eraser className="w-5 h-5" />}
                        label="Eraser"
                    />
                    <div className="w-full h-px bg-gray-200 my-2" />
                    <ToolbarButton
                        onClick={undo}
                        icon={<Undo className="w-5 h-5" />}
                        label="Undo"
                    />
                    <ToolbarButton
                        onClick={clearCanvas}
                        icon={<Trash2 className="w-5 h-5" />}
                        label="Clear"
                        className="text-red-500 hover:bg-red-50"
                    />

                    <div className="w-full h-px bg-gray-200 my-2" />
                    <div className="w-full px-2">
                        <ImageUploader />
                    </div>
                </aside>

                {/* Center Workspace */}
                <main className="flex-1 relative bg-gray-100 flex items-center justify-center overflow-hidden">
                    <div className="relative shadow-xl rounded-lg overflow-hidden bg-white" style={{ width: '800px', height: '600px' }}>
                        {/* 2D Canvas Layer */}
                        <div className={`absolute inset-0 ${activeTab === 'draw' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
                            <Canvas2D />
                        </div>

                        {/* 3D Preview Layer (Placeholder) */}
                        <div className={`absolute inset-0 ${activeTab === '3d' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'} bg-gray-900`}>
                            <Preview3D />
                        </div>
                    </div>

                    {/* View Toggle (Floating) */}
                    <div className="absolute top-4 bg-white p-1 rounded-full shadow-lg border">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[200px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="draw">2D Draw</TabsTrigger>
                                <TabsTrigger value="3d">3D View</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </main>

                {/* Right Settings Panel */}
                <aside className="w-80 bg-white border-l p-4 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Tool Settings
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Stroke Width</label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[strokeWidth]}
                                        min={1} max={50} step={1}
                                        onValueChange={([v]) => setStrokeWidth(v)}
                                        className="flex-1"
                                    />
                                    <span className="text-sm font-medium w-8">{strokeWidth}px</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            3D Properties
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Extrusion Height (mm)</label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[extrusionHeight]}
                                        min={1} max={20} step={0.5}
                                        onValueChange={([v]) => setExtrusionHeight(v)}
                                        className="flex-1"
                                    />
                                    <span className="text-sm font-medium w-8">{extrusionHeight}</span>
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
            className={`p-3 rounded-xl transition-all group relative flex items-center justify-center
        ${active ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}
        ${className}
      `}
            title={label}
        >
            {icon}
        </button>
    );
}
