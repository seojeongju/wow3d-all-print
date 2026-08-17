'use client';

import { useEffect, useRef } from 'react';
import { useFileStore } from '@/store/useFileStore';
import { analyzeGeometryBoundingBox, analyzeGeometryProgressive } from '@/lib/geometry';
import { parseModelArrayBuffer } from '@/lib/parseModelGeometry';

const PARSE_TIMEOUT_MS = 120_000;
const ANALYSIS_TIMEOUT_MS = 180_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`${label} 시간 초과 (${Math.round(ms / 1000)}초)`));
        }, ms);
        promise
            .then((v) => {
                clearTimeout(timer);
                resolve(v);
            })
            .catch((e) => {
                clearTimeout(timer);
                reject(e);
            });
    });
}

/**
 * WebGL Context Lost 등으로 R3F 캔버스가 실패해도, 동일 파일에 대해 CPU로 부피·치수 분석을 완료해
 * 견적 단계가 "정밀 분석 중"에 멈추지 않게 합니다.
 * 대용량 AI STL은 1차 바운딩 박스 근사 → 샘플링 정밀 분석 순으로 진행합니다.
 */
export function useCpuModelAnalysis() {
    const file = useFileStore((s) => s.file);
    const baseAnalysis = useFileStore((s) => s.baseAnalysis);
    const setAnalysis = useFileStore((s) => s.setAnalysis);
    const setAnalysisError = useFileStore((s) => s.setAnalysisError);
    const runId = useRef(0);

    useEffect(() => {
        if (!file || baseAnalysis) return;

        const id = ++runId.current;
        let cancelled = false;

        setAnalysisError(null);

        (async () => {
            try {
                const buf = await withTimeout(file.arrayBuffer(), PARSE_TIMEOUT_MS, '파일 읽기');
                if (cancelled || id !== runId.current) return;

                const geo = await withTimeout(
                    parseModelArrayBuffer(file.name, buf),
                    PARSE_TIMEOUT_MS,
                    '모델 파싱'
                );
                if (cancelled || id !== runId.current) {
                    geo?.dispose();
                    return;
                }
                if (!geo) {
                    setAnalysisError('모델 파일을 해석할 수 없습니다. STL/OBJ 등 지원 형식인지 확인해 주세요.');
                    return;
                }

                const applyPartial = (data: Parameters<typeof setAnalysis>[0]) => {
                    if (cancelled || id !== runId.current) return;
                    setAnalysis(data);
                };

                const refined = await withTimeout(
                    analyzeGeometryProgressive(geo, applyPartial),
                    ANALYSIS_TIMEOUT_MS,
                    '모델 분석'
                );

                if (!cancelled && id === runId.current) {
                    setAnalysis(refined);
                    setAnalysisError(null);
                }

                geo.dispose();
            } catch (e) {
                if (cancelled || id !== runId.current) return;
                console.error('CPU model analysis:', e);

                const message =
                    e instanceof Error ? e.message : '모델 분석 중 오류가 발생했습니다.';

                try {
                    const buf = await file.arrayBuffer();
                    const geo = await parseModelArrayBuffer(file.name, buf);
                    if (geo && !cancelled && id === runId.current) {
                        const fallback = analyzeGeometryBoundingBox(geo);
                        geo.dispose();
                        setAnalysis(fallback);
                        setAnalysisError(
                            `${message} 바운딩 박스 근사값으로 견적을 진행합니다. 정밀 치수가 필요하면 메쉬를 단순화해 주세요.`
                        );
                        return;
                    }
                    geo?.dispose();
                } catch {
                    /* ignore fallback errors */
                }

                setAnalysisError(message);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [file, baseAnalysis, setAnalysis, setAnalysisError]);
}
