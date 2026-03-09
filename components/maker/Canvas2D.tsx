'use client';

import React, { useCallback, useEffect, useRef } from 'react';
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

export function Canvas2D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        paths, currentPath, isDrawing,
        startDrawing, continueDrawing, endDrawing,
        updateCanvasSize,
        tool, strokeWidth, strokeColor
    } = useMakerStore();

    useEffect(() => {
        updateCanvasSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    }, [updateCanvasSize]);

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

        // Clear Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw Grid (Optional)
        // drawGrid(ctx, canvas.width, canvas.height);

        // Draw Saved Paths
        paths.forEach(path => {
            if (path.points.length < 2) return;

            ctx.beginPath();
            ctx.lineWidth = path.width;
            ctx.strokeStyle = path.color;

            ctx.moveTo(path.points[0].x, path.points[0].y);
            for (let i = 1; i < path.points.length; i++) {
                // Simple smoothing using quadratic curves could be added here
                ctx.lineTo(path.points[i].x, path.points[i].y);
            }
            ctx.stroke();
        });

        // Draw Current Path
        if (currentPath.length > 1) {
            ctx.beginPath();
            ctx.lineWidth = strokeWidth;
            // Eraser 컬러를 캔버스 배경색과 일치시킴
            ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : strokeColor;

            ctx.moveTo(currentPath[0].x, currentPath[0].y);
            for (let i = 1; i < currentPath.length; i++) {
                ctx.lineTo(currentPath[i].x, currentPath[i].y);
            }
            ctx.stroke();
        }

    }, [paths, currentPath, strokeWidth, strokeColor, tool]);

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
