'use client';

import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMakerStore } from '@/store/useMakerStore';
import { convertImageToSVG } from '@/lib/image-processor';

export function ImageUploader() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addImportedSvg } = useMakerStore();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsProcessing(true);
            const svgContent = await convertImageToSVG(file);

            addImportedSvg({
                id: crypto.randomUUID(),
                name: file.name,
                svgContent: svgContent
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            alert('이미지가 3D용으로 변환되었습니다. 결과물(3D) 탭에서 확인하세요.');
        } catch (error) {
            console.error('Failed to process image:', error);
            const msg = error instanceof Error ? error.message : '';
            alert(
                msg.includes('decode') || msg.includes('load')
                    ? '이미지를 불러올 수 없습니다. JPG/PNG 파일인지, 손상되지 않았는지 확인해 주세요.'
                    : '이미지를 3D용으로 변환하지 못했습니다. 다른 이미지로 시도해 주세요.'
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
            />

            <div className="group relative w-full flex justify-center mt-2">
                <Button
                    variant="ghost"
                    className="w-12 h-12 p-0 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,118,255,0.15)] flex flex-col items-center justify-center transition-all duration-300"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <ImageIcon className="w-5 h-5" />
                    )}
                </Button>
                {/* Tooltip */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white whitespace-nowrap rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                    <div className="text-xs">이미지 스케치</div>
                    <div className="text-[10px] text-white/50">JPG, PNG 파일</div>
                </div>
            </div>
        </>
    );
}
