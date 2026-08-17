'use client';

import { useEffect } from 'react';
import { useFileStore } from '@/store/useFileStore';
import { ensureModelAnalysisForFile } from '@/lib/model-analysis-runner';

/**
 * 견적 페이지 등 어디서든 호출 — Scene 마운트와 무관하게 CPU 분석을 시작합니다.
 * 실제 파싱·분석은 model-parse-cache / model-analysis-runner 와 뷰어가 공유합니다.
 */
export function useCpuModelAnalysis() {
    const file = useFileStore((s) => s.file);
    const baseAnalysis = useFileStore((s) => s.baseAnalysis);

    useEffect(() => {
        if (!file || baseAnalysis) return;
        void ensureModelAnalysisForFile(file);
    }, [file, baseAnalysis]);
}
