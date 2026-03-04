'use client';

// @ts-ignore
import ImageTracer from 'imagetracerjs';

const SVG_CONVERT_TIMEOUT_MS = 60000;

/** 'simple': 로고/아이콘용 적은 경로. 'detailed': 사진/실물(펜 등)용 디테일 유지 */
export type ConvertMode = 'simple' | 'detailed';

const TRACE_OPTIONS: Record<ConvertMode, Record<string, number | boolean>> = {
    simple: {
        ltres: 1,
        qtres: 1,
        pathomit: 8,
        colorsampling: 2,
        numberofcolors: 2,
        mincolorratio: 0.02,
        colorquantcycles: 3,
        scale: 1,
        simplifytolerance: 0,
        roundcoords: 1,
        lcpr: 0,
        qcpr: 0,
        desc: false,
        viewbox: true,
        blurradius: 0,
        blurdelta: 20
    },
    detailed: {
        ltres: 0.5,
        qtres: 0.5,
        pathomit: 4,
        colorsampling: 2,
        numberofcolors: 6,
        mincolorratio: 0.01,
        colorquantcycles: 5,
        scale: 1,
        simplifytolerance: 0.2,
        roundcoords: 1,
        lcpr: 0,
        qcpr: 0,
        desc: false,
        viewbox: true,
        blurradius: 0,
        blurdelta: 24
    }
};

export async function convertImageToSVG(file: File, signal?: AbortSignal, mode: ConvertMode = 'detailed'): Promise<string> {
    const checkAbort = () => {
        if (signal?.aborted) throw new DOMException('Conversion aborted', 'AbortError');
    };
    const options = TRACE_OPTIONS[mode];

    const svgPromise = new Promise<string>((resolve, reject) => {
        checkAbort();
        const reader = new FileReader();
        reader.onload = (e) => {
            checkAbort();
            const dataUrl = e.target?.result as string;
            if (!dataUrl || typeof dataUrl !== 'string') {
                reject(new Error('Failed to read file'));
                return;
            }
            const img = new Image();
            img.onload = () => {
                checkAbort();
                ImageTracer.imageToSVG(img.src, (svgstr: string) => {
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
                    resolve(svgstr);
                }, options as any);
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = dataUrl;
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Image conversion timed out')), SVG_CONVERT_TIMEOUT_MS)
    );
    return Promise.race([svgPromise, timeoutPromise]);
}

/** 배경 제거 API 호출 후 반환된 이미지로 새 File 생성. API 미설정 시 실패. */
export async function removeBackground(file: File, signal?: AbortSignal): Promise<File> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/maker/remove-bg', {
        method: 'POST',
        body: formData,
        signal
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg = j?.error || res.statusText || '배경 제거 실패';
        const err = new Error(msg) as Error & { status?: number };
        err.status = res.status;
        throw err;
    }
    const blob = await res.blob();
    return new File([blob], file.name.replace(/\.[^.]+$/, '.png') || 'no-bg.png', { type: blob.type || 'image/png' });
}
