'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMakerStore } from '@/store/useMakerStore';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

/** Get canvas-space coordinates (0..width, 0..height) from client position. Required when canvas is CSS-scaled. */
function getCanvasPoint(canvas: HTMLCanvasElement | null, clientX: number, clientY: number): { x: number; y: number } | null {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
}

function svgDataUrl(svgContent: string): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}

export function Canvas2D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const svgImageCache = useRef<Map<string, HTMLImageElement>>(new Map());
    const [svgLoadTick, setSvgLoadTick] = useState(0);

    const {
        paths, currentPath, isDrawing,
        startDrawing, continueDrawing, endDrawing,
        updateCanvasSize,
        tool, strokeWidth, strokeColor,
        importedSvgs, baseSizeMm,
    } = useMakerStore();

    useEffect(() => {
        updateCanvasSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    }, [updateCanvasSize]);

    // 불러온 SVG → Image 캐시 (2D 탭에서 다시 보이도록)
    useEffect(() => {
        const cache = svgImageCache.current;
        const liveKeys = new Set<string>();

        importedSvgs.forEach((svg) => {
            const key = `${svg.id}:${svg.svgContent.length}:${svg.svgContent.slice(0, 48)}`;
            liveKeys.add(key);
            if (cache.has(key)) return;

            const img = new Image();
            img.decoding = 'async';
            img.onload = () => setSvgLoadTick((n) => n + 1);
            img.onerror = () => {
                cache.delete(key);
                setSvgLoadTick((n) => n + 1);
            };
            img.src = svgDataUrl(svg.svgContent);
            cache.set(key, img);
        });

        for (const key of cache.keys()) {
            if (!liveKeys.has(key)) cache.delete(key);
        }
    }, [importedSvgs]);

    const getPoint = useCallback((e: { clientX: number; clientY: number }) => {
        return getCanvasPoint(canvasRef.current, e.clientX, e.clientY);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        const point = getPoint(e.nativeEvent);
        if (point) startDrawing(point);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const point = getPoint(e.nativeEvent);
        if (point) continueDrawing(point);
    };

    const handleMouseUp = () => {
        if (isDrawing) endDrawing();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const point = getCanvasPoint(canvasRef.current, touch.clientX, touch.clientY);
        if (point) startDrawing(point);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        const touch = e.touches[0];
        const point = getCanvasPoint(canvasRef.current, touch.clientX, touch.clientY);
        if (point) continueDrawing(point);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        e.preventDefault();
        if (isDrawing) endDrawing();
    };

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const sizeRef = Math.max(10, baseSizeMm);
        const fitPx = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.55;

        importedSvgs.forEach((svg) => {
            const key = `${svg.id}:${svg.svgContent.length}:${svg.svgContent.slice(0, 48)}`;
            const img = svgImageCache.current.get(key);
            if (!img || !img.complete || img.naturalWidth <= 0) return;

            const scale = Math.min(2.5, Math.max(0.2, svg.scale ?? 1));
            const maxSide = fitPx * scale;
            const aspect = img.naturalWidth / img.naturalHeight;
            let drawW: number;
            let drawH: number;
            if (aspect >= 1) {
                drawW = maxSide;
                drawH = maxSide / aspect;
            } else {
                drawH = maxSide;
                drawW = maxSide * aspect;
            }

            const cx = CANVAS_WIDTH / 2 + ((svg.offsetXMm ?? 0) / sizeRef) * fitPx;
            const cy = CANVAS_HEIGHT / 2 - ((svg.offsetYMm ?? 0) / sizeRef) * fitPx;
            const rot = ((svg.rotationDeg ?? 0) * Math.PI) / 180;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);

            // 어두운 캔버스에서도 검정 로고가 보이도록 밝은 받침
            const pad = 14;
            ctx.fillStyle = 'rgba(244, 244, 245, 0.96)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            const plateW = drawW + pad * 2;
            const plateH = drawH + pad * 2;
            const r = 12;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(-plateW / 2, -plateH / 2, plateW, plateH, r);
            } else {
                ctx.rect(-plateW / 2, -plateH / 2, plateW, plateH);
            }
            ctx.fill();
            ctx.stroke();

            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        });

        paths.forEach(path => {
            if (path.points.length < 2) return;

            ctx.beginPath();
            ctx.lineWidth = path.width;
            ctx.strokeStyle = path.color;

            ctx.moveTo(path.points[0].x, path.points[0].y);
            for (let i = 1; i < path.points.length; i++) {
                ctx.lineTo(path.points[i].x, path.points[i].y);
            }
            ctx.stroke();
        });

        if (currentPath.length > 1) {
            ctx.beginPath();
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : strokeColor;

            ctx.moveTo(currentPath[0].x, currentPath[0].y);
            for (let i = 1; i < currentPath.length; i++) {
                ctx.lineTo(currentPath[i].x, currentPath[i].y);
            }
            ctx.stroke();
        }

    }, [paths, currentPath, strokeWidth, strokeColor, tool, importedSvgs, baseSizeMm, svgLoadTick]);

    return (
        <div ref={containerRef} className="w-full h-full bg-[#0f172a] cursor-crosshair touch-none">
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className="w-full h-full"
            />
        </div>
    );
}
