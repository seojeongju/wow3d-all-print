'use client';

import { useEffect, useRef } from 'react';
import { useFileStore } from '@/store/useFileStore';
import { analyzeGeometry } from '@/lib/geometry';
import { parseModelArrayBuffer } from '@/lib/parseModelGeometry';

/**
 * WebGL Context Lost 등으로 R3F 캔버스가 실패해도, 동일 파일에 대해 CPU로 먼저 부피·치수 분석을 완료해
 * 견적 단계가 "정밀 분석 중"에 멈추지 않게 합니다.
 */
export function useCpuModelAnalysis() {
    const file = useFileStore((s) => s.file);
    const analysis = useFileStore((s) => s.analysis);
    const setAnalysis = useFileStore((s) => s.setAnalysis);
    const runId = useRef(0);

    useEffect(() => {
        if (!file || analysis) return;

        const id = ++runId.current;
        let cancelled = false;

        (async () => {
            try {
                const buf = await file.arrayBuffer();
                if (cancelled || id !== runId.current) return;

                const geo = await parseModelArrayBuffer(file.name, buf);
                if (cancelled || id !== runId.current) {
                    geo?.dispose();
                    return;
                }
                if (!geo) return;

                const data = analyzeGeometry(geo);
                geo.dispose();

                if (cancelled || id !== runId.current) return;
                setAnalysis(data);
            } catch (e) {
                console.error('CPU model analysis:', e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [file, analysis, setAnalysis]);
}
