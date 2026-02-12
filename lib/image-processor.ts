'use client';

// @ts-ignore
import ImageTracer from 'imagetracerjs';

export async function convertImageToSVG(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;

            img.onload = () => {
                // Create an offscreen canvas to process the image
                // Or directly use ImageTracer.imageToSVG(src, callback, options)

                // Options for better results (customizable)
                const options = {
                    ltres: 1,
                    qtres: 1,
                    pathomit: 8,
                    colorsampling: 2, // 0: disabled, 1: random, 2: deterministic
                    numberofcolors: 2, // Reduced colors for cleaner SVG (Black/White style)
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

                // ImageTracer reads from URL/Base64
                ImageTracer.imageToSVG(img.src, (svgstr: string) => {
                    resolve(svgstr);
                }, options);
            };

            img.onerror = reject;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
