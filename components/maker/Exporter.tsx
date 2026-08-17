'use client';

import { useEffect } from 'react';
import { useMakerStore } from '@/store/useMakerStore';
import { buildMakerStlBlob, downloadMakerStl } from '@/lib/maker-stl-export';

export function Exporter() {
    const exportTrigger = useMakerStore((s) => s.exportTrigger);
    const paths = useMakerStore((s) => s.paths);
    const importedSvgs = useMakerStore((s) => s.importedSvgs);
    const extrusionHeight = useMakerStore((s) => s.extrusionHeight);
    const basePlateType = useMakerStore((s) => s.basePlateType);
    const baseHeight = useMakerStore((s) => s.baseHeight);
    const canvasSize = useMakerStore((s) => s.canvasSize);

    useEffect(() => {
        if (exportTrigger === 0) return;

        try {
            const blob = buildMakerStlBlob({
                paths,
                importedSvgs,
                extrusionHeight,
                basePlateType,
                baseHeight,
                canvasSize,
            });
            if (!blob) {
                alert('저장할 모델이 없습니다. 스케치를 그리거나 로고·SVG를 넣어 주세요.');
                return;
            }
            downloadMakerStl(blob);
        } catch (e) {
            console.error('STL export failed', e);
            alert('STL 저장에 실패했습니다. 콘솔을 확인해 주세요.');
        }
    }, [
        exportTrigger,
        paths,
        importedSvgs,
        extrusionHeight,
        basePlateType,
        baseHeight,
        canvasSize,
    ]);

    return null;
}
