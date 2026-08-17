'use client';

import { useEffect, useRef } from 'react';
import { useMakerStore, makerSceneInputFromState } from '@/store/useMakerStore';
import { buildMakerStlBlob, downloadMakerStl } from '@/lib/maker-stl-export';

/**
 * STL 저장은 exportTrigger가 증가할 때만 실행합니다.
 * paths/importedSvgs를 deps에 넣으면 취소·지우기 때도 다운로드가 다시 뜹니다.
 */
export function Exporter() {
    const exportTrigger = useMakerStore((s) => s.exportTrigger);
    const lastHandled = useRef(0);

    useEffect(() => {
        if (exportTrigger === 0 || exportTrigger === lastHandled.current) return;
        lastHandled.current = exportTrigger;

        const s = useMakerStore.getState();
        try {
            const blob = buildMakerStlBlob(makerSceneInputFromState({
                paths: s.paths,
                importedSvgs: s.importedSvgs,
                extrusionHeight: s.extrusionHeight,
                basePlateType: s.basePlateType,
                baseHeight: s.baseHeight,
                bevelMm: s.bevelMm,
                rimHeightMm: s.rimHeightMm,
                baseSizeMm: s.baseSizeMm,
                cornerRadiusMm: s.cornerRadiusMm,
                mxStem: s.mxStem,
                backMount: s.backMount,
                baseColor: s.baseColor,
                logoColor: s.logoColor,
                rimColor: s.rimColor,
                canvasSize: s.canvasSize,
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
    }, [exportTrigger]);

    return null;
}
