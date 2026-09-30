'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export type QuoteEstimateSnapshot = {
    fileName: string;
    fileSize: number;
    dimensionsX: number;
    dimensionsY: number;
    dimensionsZ: number;
    volumeCm3: number;
    surfaceAreaCm2: number;
    printMethod: 'fdm' | 'sla' | 'dlp';
    materialName: string;
    layerHeight: number;
    fdmInfill: number | null;
    totalPrice: number;
    estimatedTimeHours: number;
    guideSource?: string;
};

/** 조건을 바꾸는 동안에는 기록하지 않고, 멈춘 뒤 한 번만 보낸다 */
const LOG_DEBOUNCE_MS = 2500;
const THUMBNAIL_DELAY_MS = 600;
const THUMBNAIL_MAX_WIDTH = 240;
const THUMBNAIL_QUALITY = 0.72;
/** 뷰어가 숨겨졌을 때 파일을 다시 읽어 그리는 경로의 크기 상한 */
const OFFSCREEN_MAX_FILE_BYTES = 30 * 1024 * 1024;

function authHeaders(): HeadersInit | null {
    const { token, user, sessionId } = useAuthStore.getState();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        if (user?.id) headers['X-User-ID'] = String(user.id);
        return headers;
    }
    if (!sessionId) return null;
    headers['X-Session-ID'] = sessionId;
    return headers;
}

function toJpegThumbnail(source: CanvasImageSource, width: number, height: number): string | null {
    const scale = Math.min(1, THUMBNAIL_MAX_WIDTH / width);
    const out = document.createElement('canvas');
    out.width = Math.round(width * scale);
    out.height = Math.round(height * scale);
    const ctx = out.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, out.width, out.height);
    try {
        ctx.drawImage(source, 0, 0, out.width, out.height);
        return out.toDataURL('image/jpeg', THUMBNAIL_QUALITY);
    } catch {
        return null;
    }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

/**
 * 화면에 보이는 견적 뷰어 캔버스(preserveDrawingBuffer)를 우선 캡처하고,
 * 모바일 탭 전환 등으로 뷰어가 숨겨져 있으면 파일에서 오프스크린 렌더링
 */
async function captureThumbnail(file: File): Promise<string | null> {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-quote-viewer] canvas');
    if (canvas && canvas.getBoundingClientRect().width > 0 && canvas.width > 2 && canvas.height > 2) {
        return toJpegThumbnail(canvas, canvas.width, canvas.height);
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'step' || ext === 'stp' || file.size > OFFSCREEN_MAX_FILE_BYTES) return null;
    const { generateModelThumbnail } = await import('@/lib/modelThumbnail');
    const png = await generateModelThumbnail(file, THUMBNAIL_MAX_WIDTH).catch(() => null);
    const img = png ? await loadImage(png) : null;
    return img ? toJpegThumbnail(img, img.naturalWidth, img.naturalHeight) : null;
}

async function postEstimate(payload: Record<string, unknown>): Promise<number | null> {
    const headers = authHeaders();
    if (!headers) return null;
    try {
        const res = await fetch('/api/quote-estimates', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            keepalive: true,
        });
        if (!res.ok) return null;
        const json = (await res.json().catch(() => null)) as { data?: { id?: number } } | null;
        return json?.data?.id ?? null;
    } catch {
        return null;
    }
}

/**
 * 자동견적 금액이 산출되면 조건·금액을 서버에 기록한다 (저장 버튼과 무관).
 * 파일이 바뀌면 새 기록으로 시작한다.
 */
export function useQuoteEstimateLog(file: File | null, snapshot: QuoteEstimateSnapshot | null) {
    const fileKey = file ? `${file.name}:${file.size}:${file.lastModified}` : null;
    const fileRef = useRef(file);
    fileRef.current = file;
    const logIdRef = useRef<number | null>(null);
    const lastSentRef = useRef('');
    const thumbnailSentRef = useRef(false);
    const pendingQuoteIdRef = useRef<number | null>(null);
    const fileKeyRef = useRef(fileKey);

    useEffect(() => {
        fileKeyRef.current = fileKey;
        logIdRef.current = null;
        lastSentRef.current = '';
        thumbnailSentRef.current = false;
        pendingQuoteIdRef.current = null;
    }, [fileKey]);

    const serialized = snapshot && snapshot.totalPrice > 0 ? JSON.stringify(snapshot) : '';

    useEffect(() => {
        if (!fileKey || !serialized || serialized === lastSentRef.current) return;
        const keyAtSchedule = fileKey;
        const timer = setTimeout(async () => {
            lastSentRef.current = serialized;
            const payload: Record<string, unknown> = JSON.parse(serialized);
            if (logIdRef.current) payload.id = logIdRef.current;
            if (pendingQuoteIdRef.current) payload.quoteId = pendingQuoteIdRef.current;

            const id = await postEstimate(payload);
            if (!id || keyAtSchedule !== fileKeyRef.current) return;
            logIdRef.current = id;
            pendingQuoteIdRef.current = null;

            if (thumbnailSentRef.current) return;
            thumbnailSentRef.current = true;
            window.setTimeout(async () => {
                const current = fileRef.current;
                if (!current || keyAtSchedule !== fileKeyRef.current) return;
                const thumbnail = await captureThumbnail(current).catch(() => null);
                if (thumbnail) void postEstimate({ id, thumbnail });
            }, THUMBNAIL_DELAY_MS);
        }, LOG_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [fileKey, serialized]);

    /** 견적 저장 후 기록과 저장 견적을 연결 (기록 전이면 다음 기록 때 함께 보냄) */
    const linkSavedQuote = useCallback((quoteId: number) => {
        if (!quoteId) return;
        if (logIdRef.current) {
            void postEstimate({ id: logIdRef.current, quoteId });
        } else {
            pendingQuoteIdRef.current = quoteId;
        }
    }, []);

    return { linkSavedQuote };
}
