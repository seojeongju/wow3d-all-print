'use client';

// @ts-ignore
import ImageTracer from 'imagetracerjs';

const SVG_CONVERT_TIMEOUT_MS = 60000;

export async function convertImageToSVG(file: File, signal?: AbortSignal): Promise<string> {
    const checkAbort = () => {
        if (signal?.aborted) throw new DOMException('Conversion aborted', 'AbortError');
    };

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
                const options = {
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
                };
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
                }, options);
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
