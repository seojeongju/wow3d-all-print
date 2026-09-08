'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Image as ImageIcon, Loader2, X, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convertImageToSVG, removeBackground, type ConvertMode } from '@/lib/image-processor';
import { stripSvgBackgroundLayers } from '@/lib/svg-background-strip';
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
    convertMode = 'simple',
    useRemoveBg = false,
    authHeaders,
    onRemoveBgDone,
}: Props) {
    const t = useTranslations('Maker');
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
                const cleaned = stripSvgBackgroundLayers(text);
                onSvgConverted({ name: file.name, svgContent: cleaned });
            } else {
                alert(t('invalidSvg'));
            }
        };
        reader.onerror = () => alert(t('svgReadFail'));
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
                    showToast.success(t('toastBgRemovedTitle'), t('toastBgRemovedDesc'));
                    onRemoveBgDone?.();
                } catch (bgErr) {
                    imageToConvert = file;
                    const msg = bgErr instanceof Error ? bgErr.message : '';
                    const status = (bgErr as Error & { status?: number }).status;
                    const isUnavailable = status === 503 || msg.includes('설정되지 않았습니다');
                    const isLimit = status === 402 || status === 429 || msg.includes('한도') || msg.includes('크레딧');
                    if (isUnavailable) {
                        showToast.error(t('toastRemoveBgUnavailableTitle'), t('toastBgUnavailableDesc'));
                    } else if (isLimit) {
                        showToast.error(t('toastBgLimitTitle'), t('toastBgLimitDesc', { msg: msg || t('toastRemoveBgLimit') }));
                    } else {
                        showToast.error(t('toastBgFailTitle'), t('toastBgFailDesc', { msg: msg || t('toastQuoteFailRetry') }));
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
                    ? t('imageLoadFail')
                    : t('imageConvertFail')
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
                        title={t('imageUploadTitle')}
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
                            title={t('cancelConvertTitle')}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                <span className="text-[9px] font-bold text-white/85 text-center">{t('imageLabel')}</span>

                <div className="w-8 h-px bg-white/10" />

                <div className="flex flex-col items-center gap-1">
                    <Button
                        variant="ghost"
                        title={t('svgUploadTitle')}
                        className="w-12 h-12 p-0 rounded-2xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 flex items-center justify-center transition-all duration-300"
                        onClick={() => svgInputRef.current?.click()}
                        disabled={isProcessing}
                    >
                        <FileCode className="w-5 h-5" />
                    </Button>
                    <span className="text-[9px] font-bold text-white/85 text-center">SVG</span>
                </div>

                {isProcessing && (
                    <span className="text-[10px] font-bold text-amber-200">{t('converting')}</span>
                )}
            </div>
        </>
    );
}
