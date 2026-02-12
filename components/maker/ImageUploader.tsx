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

            // Clear input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Failed to process image:', error);
            alert('이미지 변환에 실패했습니다.');
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

            <Button
                variant="ghost"
                className="w-full flex justify-start gap-3 px-3 py-6 h-auto"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
            >
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <ImageIcon className="w-5 h-5" />
                    )}
                </div>
                <div className="text-left">
                    <div className="font-medium text-sm">Upload Image</div>
                    <div className="text-xs text-gray-500">JPG, PNG to 3D</div>
                </div>
            </Button>
        </>
    );
}
