'use client';

import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convertImageToSVG, removeBackground, type ConvertMode } from '@/lib/image-processor';

type Props = {
    onSvgConverted: (data: { name: string; svgContent: string }) => void;
    convertMode?: ConvertMode;
    useRemoveBg?: boolean;
};

export function ImageUploader({ onSvgConverted, convertMode = 'detailed', useRemoveBg = false }: Props) {
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
            let imageToConvert: File = file;
            if (useRemoveBg) {
                try {
                    imageToConvert = await removeBackground(file, signal);
                } catch (bgErr) {
                    imageToConvert = file;
                    const msg = bgErr instanceof Error ? bgErr.message : '';
                    const status = (bgErr as Error & { status?: number }).status;
                    const isUnavailable = status === 503 || msg.includes('503') || msg.includes('설정되지 않았습니다') || msg.includes('Service Unavailable');
                    const isLimit = status === 402 || msg.includes('한도');
                    if (isUnavailable) {
                        alert('배경 제거 API가 설정되지 않았거나 일시적으로 사용할 수 없습니다. 배경 제거 없이 변환합니다.');
                    } else if (isLimit) {
                        alert('배경 제거 API 한도 초과. 배경 제거 없이 변환합니다.');
                    } else {
                        alert(`배경 제거 실패: ${msg}. 배경 제거 없이 변환합니다.`);
                    }
                }
            }
            const svgContent = await convertImageToSVG(imageToConvert, signal, convertMode);
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

            <div className="flex flex-col items-center gap-1 mt-2">
                <div className="group relative flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            title="이미지 업로드 (JPG, PNG)"
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
                    </div>
                    <span className="text-[9px] font-medium text-white/70 text-center">이미지</span>
                </div>
                {isProcessing && (
                    <span className="text-[10px] text-white/50">3D 변환 중… × 버튼으로 중단</span>
                )}
            </div>
        </>
    );
}
