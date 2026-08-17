'use client';

import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convertImageToSVG, removeBackground, type ConvertMode } from '@/lib/image-processor';
import { showToast } from '@/lib/toast-helper';

type Props = {
    onSvgConverted: (data: { name: string; svgContent: string }) => void;
    convertMode?: ConvertMode;
    useRemoveBg?: boolean;
    authHeaders?: HeadersInit;
    onRemoveBgDone?: () => void;
};

export function ImageUploader({
    onSvgConverted,
    convertMode = 'detailed',
    useRemoveBg = false,
    authHeaders,
    onRemoveBgDone,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const svgInputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCancel = () => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    };

    const handleSvgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (svgInputRef.current) svgInputRef.current.value = '';
        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            if (typeof text === 'string' && (text.includes('<svg') || text.includes('<SVG'))) {
                onSvgConverted({ name: file.name, svgContent: text });
            } else {
                alert('유효한 SVG 파일이 아닙니다.');
            }
        };
        reader.onerror = () => alert('SVG 파일을 읽지 못했습니다.');
        reader.readAsText(file, 'utf-8');
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
                    imageToConvert = await removeBackground(file, signal, authHeaders);
                    showToast.success('배경 제거 완료', '실루엣만 남긴 뒤 돌출용 SVG로 변환합니다.');
                    onRemoveBgDone?.();
                } catch (bgErr) {
                    imageToConvert = file;
                    const msg = bgErr instanceof Error ? bgErr.message : '';
                    const status = (bgErr as Error & { status?: number }).status;
                    const isUnavailable = status === 503 || msg.includes('설정되지 않았습니다');
                    const isLimit = status === 402 || status === 429 || msg.includes('한도') || msg.includes('크레딧');
                    if (isUnavailable) {
                        showToast.error('배경 제거 불가', 'API가 없거나 일시 중단입니다. 배경 없이 변환합니다.');
                    } else if (isLimit) {
                        showToast.error('배경 제거 한도', `${msg || '오늘 한도에 도달했습니다.'} 배경 없이 변환합니다.`);
                    } else {
                        showToast.error('배경 제거 실패', `${msg || '오류가 발생했습니다.'} 배경 없이 변환합니다.`);
                    }
                    onRemoveBgDone?.();
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
                onChange={handleImageFileChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
            />
            <input
                type="file"
                ref={svgInputRef}
                onChange={handleSvgFileChange}
                accept=".svg,image/svg+xml"
                className="hidden"
            />

            <div className="flex flex-col items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        title="이미지 (PNG, JPEG) → SVG 변환"
                        className="w-12 h-12 p-0 rounded-2xl bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 border border-teal-400/30 flex items-center justify-center transition-all duration-300"
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
                            className="w-9 h-9 p-0 rounded-xl text-white/80 hover:text-white hover:bg-red-500/20 border border-white/20"
                            onClick={handleCancel}
                            title="변환 중단"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                <span className="text-[9px] font-bold text-white/85 text-center">이미지</span>

                <div className="w-8 h-px bg-white/10" />

                <div className="flex flex-col items-center gap-1">
                    <Button
                        variant="ghost"
                        title="SVG 파일 직접 사용 (변환 없음)"
                        className="w-12 h-12 p-0 rounded-2xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 flex items-center justify-center transition-all duration-300"
                        onClick={() => svgInputRef.current?.click()}
                        disabled={isProcessing}
                    >
                        <FileCode className="w-5 h-5" />
                    </Button>
                    <span className="text-[9px] font-bold text-white/85 text-center">SVG</span>
                </div>

                {isProcessing && (
                    <span className="text-[10px] font-bold text-amber-200">변환 중… × 로 중단</span>
                )}
            </div>
        </>
    );
}
