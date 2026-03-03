'use client';

import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convertImageToSVG } from '@/lib/image-processor';

type Props = {
    onSvgConverted: (data: { name: string; svgContent: string }) => void;
};

export function ImageUploader({ onSvgConverted }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCancel = () => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;
        setIsProcessing(true);
        if (fileInputRef.current) fileInputRef.current.value = '';

        try {
            const svgContent = await convertImageToSVG(file, signal);
            onSvgConverted({ name: file.name, svgContent });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            console.error('Failed to process image:', error);
            const msg = error instanceof Error ? error.message : '';
            alert(
                msg.includes('decode') || msg.includes('load')
                    ? '이미지를 불러올 수 없습니다. JPG/PNG 파일인지, 손상되지 않았는지 확인해 주세요.'
                    : '이미지를 3D용으로 변환하지 못했습니다. 다른 이미지로 시도해 주세요.'
            );
        } finally {
            setIsProcessing(false);
            abortRef.current = null;
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

            <div className="flex flex-col items-center gap-2 mt-2">
                <div className="group relative flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="w-12 h-12 p-0 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,118,255,0.15)] flex items-center justify-center transition-all duration-300"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <ImageIcon className="w-5 h-5" />
                        )}
                    </Button>
                    {isProcessing && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-9 h-9 p-0 rounded-xl text-white/60 hover:text-white hover:bg-red-500/20 border border-white/10"
                            onClick={handleCancel}
                            title="변환 중단"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white whitespace-nowrap rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                        <div className="text-xs">이미지 스케치</div>
                        <div className="text-[10px] text-white/50">JPG, PNG · 변환 중 취소 가능</div>
                    </div>
                </div>
                {isProcessing && (
                    <span className="text-[10px] text-white/50">3D 변환 중… × 버튼으로 중단</span>
                )}
            </div>
        </>
    );
}
