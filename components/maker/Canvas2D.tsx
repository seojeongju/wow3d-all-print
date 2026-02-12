'use client';

import React, { useEffect, useRef } from 'react';
import { useMakerStore } from '@/store/useMakerStore';

export function Canvas2D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        paths, currentPath, isDrawing,
        startDrawing, continueDrawing, endDrawing,
        canvasSize, updateCanvasSize,
        tool, strokeWidth, strokeColor
    } = useMakerStore();

    // Initialize and Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;

        // Set initial size
        // updateCanvasSize(containerRef.current.clientWidth, containerRef.current.clientHeight);

        // const resizeObserver = new ResizeObserver((entries) => {
        //   for (const entry of entries) {
        //     updateCanvasSize(entry.contentRect.width, entry.contentRect.height);
        //   }
        // });

        // resizeObserver.observe(containerRef.current);
        // return () => resizeObserver.disconnect();
    }, [updateCanvasSize]);

    // Handle Drawing Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        const { offsetX, offsetY } = e.nativeEvent;
        startDrawing({ x: offsetX, y: offsetY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        continueDrawing({ x: offsetX, y: offsetY });
    };

    const handleMouseUp = () => {
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
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : strokeColor; // Eraser simulates white stroke for now

            ctx.moveTo(currentPath[0].x, currentPath[0].y);
            for (let i = 1; i < currentPath.length; i++) {
                ctx.lineTo(currentPath[i].x, currentPath[i].y);
            }
            ctx.stroke();
        }

    }, [paths, currentPath, strokeWidth, strokeColor, tool]);

    return (
        <div ref={containerRef} className="w-full h-full bg-white cursor-crosshair touch-none">
            <canvas
                ref={canvasRef}
                width={800} // Fixed size for now to match parent
                height={600}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-full"
            />
        </div>
    );
}
