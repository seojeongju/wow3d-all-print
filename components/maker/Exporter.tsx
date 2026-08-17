'use client';

import { useEffect } from 'react';
import { useMakerStore, makerSceneInputFromState } from '@/store/useMakerStore';
import { buildMakerStlBlob, downloadMakerStl } from '@/lib/maker-stl-export';

export function Exporter() {
    const exportTrigger = useMakerStore((s) => s.exportTrigger);
    const paths = useMakerStore((s) => s.paths);
    const importedSvgs = useMakerStore((s) => s.importedSvgs);
    const extrusionHeight = useMakerStore((s) => s.extrusionHeight);
    const basePlateType = useMakerStore((s) => s.basePlateType);
    const baseHeight = useMakerStore((s) => s.baseHeight);
    const bevelMm = useMakerStore((s) => s.bevelMm);
    const rimHeightMm = useMakerStore((s) => s.rimHeightMm);
    const baseSizeMm = useMakerStore((s) => s.baseSizeMm);
    const cornerRadiusMm = useMakerStore((s) => s.cornerRadiusMm);
    const canvasSize = useMakerStore((s) => s.canvasSize);

    useEffect(() => {
        if (exportTrigger === 0) return;

        try {
            const blob = buildMakerStlBlob(makerSceneInputFromState({
                paths,
                importedSvgs,
                extrusionHeight,
                basePlateType,
                baseHeight,
                bevelMm,
                rimHeightMm,
                baseSizeMm,
                cornerRadiusMm,
                canvasSize,
            }));
            if (!blob) {
                alert('저장할 모델이 없습니다. 템플릿을 고르거나 스케치·로고를 넣어 주세요.');
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
        bevelMm,
        rimHeightMm,
        baseSizeMm,
        cornerRadiusMm,
        canvasSize,
    ]);

    return null;
}
