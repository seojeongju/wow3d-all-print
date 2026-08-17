'use client';

// @ts-ignore
import ImageTracer from 'imagetracerjs';
import { stripSvgBackgroundLayers } from '@/lib/svg-background-strip';

const SVG_CONVERT_TIMEOUT_MS = 60000;
const MAX_TRACE_EDGE = 900;

/** 'simple': 로고/텍스트용 고대비. 'detailed': 실루엣 디테일 유지 */
export type ConvertMode = 'simple' | 'detailed';

const TRACE_OPTIONS: Record<ConvertMode, Record<string, number | boolean>> = {
    simple: {
        ltres: 0.4,
        qtres: 0.4,
        pathomit: 2,
        colorsampling: 0,
        numberofcolors: 2,
        mincolorratio: 0,
        colorquantcycles: 2,
        scale: 1,
        simplifytolerance: 0,
        roundcoords: 1,
        lcpr: 0,
        qcpr: 0,
        desc: false,
        viewbox: true,
        blurradius: 0,
        blurdelta: 20,
    },
    detailed: {
        ltres: 0.35,
        qtres: 0.35,
        pathomit: 2,
        colorsampling: 2,
        numberofcolors: 4,
        mincolorratio: 0.005,
        colorquantcycles: 4,
        scale: 1,
        simplifytolerance: 0.15,
        roundcoords: 1,
        lcpr: 0,
        qcpr: 0,
        desc: false,
        viewbox: true,
        blurradius: 0,
        blurdelta: 20,
    },
};

/**
 * 로고/텍스트 이미지를 고대비 흑백으로 만들어 트레이싱 품질을 올립니다.
 * 어두운 배경이면 반전 → 항상 「흰 배경 + 검정 잉크」로 맞춤.
 */
async function preprocessLogoForTrace(
    file: File,
    signal?: AbortSignal,
    mode: ConvertMode = 'simple'
): Promise<string> {
    const checkAbort = () => {
        if (signal?.aborted) throw new DOMException('Conversion aborted', 'AbortError');
    };
    checkAbort();

    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('Failed to read file'));
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });

    checkAbort();
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Image load failed'));
        el.src = dataUrl;
    });

    checkAbort();
    const srcW = Math.max(1, img.naturalWidth || img.width);
    const srcH = Math.max(1, img.naturalHeight || img.height);
    const scale = Math.min(1, MAX_TRACE_EDGE / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const gray = new Float32Array(w * h);
    let sum = 0;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        const a = d[i + 3] / 255;
        // 투명은 흰 배경으로
        const g =
            a < 0.08
                ? 255
                : 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        gray[p] = g;
        sum += g;
    }
    const mean = sum / gray.length;
    // 어두운 배경(평균이 어두움)이면 반전
    const invert = mean < 128;

    // Otsu에 가까운 단순 임계값: 평균과 중간값 사이
    let threshold = mean;
    if (mode === 'simple') {
        // 로고/텍스트는 조금 더 공격적으로 이진화
        threshold = Math.min(200, Math.max(90, mean * 0.92 + 8));
    } else {
        threshold = Math.min(190, Math.max(100, mean));
    }

    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        let g = gray[p];
        if (invert) g = 255 - g;
        const ink = g < threshold ? 0 : 255;
        d[i] = ink;
        d[i + 1] = ink;
        d[i + 2] = ink;
        d[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

function traceDataUrlToSvg(
    dataUrl: string,
    options: Record<string, number | boolean>,
    signal?: AbortSignal
): Promise<string> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Conversion aborted', 'AbortError'));
            return;
        }
        ImageTracer.imageToSVG(
            dataUrl,
            (svgstr: string) => {
                if (signal?.aborted) {
                    reject(new DOMException('Conversion aborted', 'AbortError'));
                    return;
                }
                if (typeof svgstr !== 'string' || !svgstr.trim()) {
                    reject(new Error('ImageTracer returned empty SVG'));
                    return;
                }
                if (!/<\s*path[\s>]/i.test(svgstr) && !/<\s*svg/i.test(svgstr)) {
                    reject(new Error('No vector paths in image'));
                    return;
                }
                const cleaned = stripSvgBackgroundLayers(svgstr);
                if (!/<\s*path[\s>]/i.test(cleaned)) {
                    reject(new Error('No vector paths after background strip'));
                    return;
                }
                resolve(cleaned);
            },
            options as any
        );
    });
}

export async function convertImageToSVG(
    file: File,
    signal?: AbortSignal,
    mode: ConvertMode = 'detailed'
): Promise<string> {
    const options = TRACE_OPTIONS[mode];

    const work = async () => {
        // 1차: 고대비 전처리 후 트레이스 (텍스트·로고에 유리)
        try {
            const prepared = await preprocessLogoForTrace(file, signal, mode);
            return await traceDataUrlToSvg(prepared, options, signal);
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            // 2차: 원본 이미지 직접 트레이스
            const rawUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') resolve(reader.result);
                    else reject(new Error('Failed to read file'));
                };
                reader.onerror = () => reject(new Error('File read failed'));
                reader.readAsDataURL(file);
            });
            return await traceDataUrlToSvg(rawUrl, options, signal);
        }
    };

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Image conversion timed out')), SVG_CONVERT_TIMEOUT_MS)
    );
    return Promise.race([work(), timeoutPromise]);
}

/** 배경 제거 API 호출 후 반환된 이미지로 새 File 생성. API 미설정 시 실패. */
export async function removeBackground(
    file: File,
    signal?: AbortSignal,
    headers?: HeadersInit
): Promise<File> {
    if (file.size > 8 * 1024 * 1024) {
        const err = new Error('이미지는 최대 8MB까지 가능합니다.') as Error & { status?: number };
        err.status = 400;
        throw err;
    }
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/maker/remove-bg', {
        method: 'POST',
        body: formData,
        signal,
        headers,
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg = j?.error || res.statusText || '배경 제거 실패';
        const err = new Error(msg) as Error & { status?: number; remaining?: number };
        err.status = res.status;
        if (typeof j?.remaining === 'number') err.remaining = j.remaining;
        throw err;
    }
    const blob = await res.blob();
    return new File([blob], file.name.replace(/\.[^.]+$/, '.png') || 'no-bg.png', { type: blob.type || 'image/png' });
}
