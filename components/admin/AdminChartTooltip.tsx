'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type AdminChartTooltipRow = {
    label: string;
    value: string;
    color: string;
};

export type AdminChartHover = {
    index: number;
    x: number;
    y: number;
};

export function useAdminChartHover() {
    const [hover, setHover] = useState<AdminChartHover | null>(null);

    const show = useCallback((index: number, clientX: number, clientY: number) => {
        setHover({ index, x: clientX, y: clientY });
    }, []);

    const hide = useCallback(() => setHover(null), []);

    const fromPointer = useCallback(
        (index: number, e: React.PointerEvent) => {
            show(index, e.clientX, e.clientY);
        },
        [show],
    );

    return { hover, show, hide, fromPointer };
}

export function formatChartTooltipDate(dateStr: string): string {
    const parts = dateStr.split('-').map(Number);
    const m = parts[1];
    const d = parts[2];
    if (!m || !d) return dateStr;
    return `${m}월 ${d}일`;
}

export function ChartDayHitArea({
    x,
    y,
    width,
    height,
    active,
    onMove,
    onLeave,
}: {
    x: number;
    y: number;
    width: number;
    height: number;
    active?: boolean;
    onMove: (e: React.PointerEvent<SVGRectElement>) => void;
    onLeave: () => void;
}) {
    return (
        <g>
            {active && (
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="rgba(255,255,255,0.07)"
                    rx={3}
                    pointerEvents="none"
                />
            )}
            <rect
                x={x}
                y={y}
                width={Math.max(width, 1)}
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onPointerMove={onMove}
                onPointerLeave={onLeave}
            />
        </g>
    );
}

export function AdminChartTooltip({
    hover,
    title,
    rows,
}: {
    hover: AdminChartHover | null;
    title: string;
    rows: AdminChartTooltipRow[];
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted || !hover || rows.length === 0) return null;

    const pad = 10;
    const approxW = 210;
    const approxH = 36 + rows.length * 22;
    let left = hover.x + 14;
    let top = hover.y - approxH - 10;
    if (left + approxW > window.innerWidth - pad) left = hover.x - approxW - 8;
    if (left < pad) left = pad;
    if (top < pad) top = hover.y + 18;

    return createPortal(
        <div
            role="tooltip"
            className="pointer-events-none fixed z-[80] min-w-[168px] max-w-[240px] rounded-xl border border-white/12 bg-[#161616]/95 px-3 py-2.5 shadow-2xl shadow-black/50 backdrop-blur-md"
            style={{ left, top }}
        >
            <p className="mb-2 text-[11px] font-black tracking-wide text-white">{title}</p>
            <ul className="space-y-1">
                {rows.map((r) => (
                    <li key={r.label} className="flex items-center justify-between gap-4 text-[11px]">
                        <span className="flex min-w-0 items-center gap-1.5 font-medium text-white/55">
                            <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: r.color }}
                            />
                            <span className="truncate">{r.label}</span>
                        </span>
                        <span className="shrink-0 tabular-nums font-black text-white">{r.value}</span>
                    </li>
                ))}
            </ul>
        </div>,
        document.body,
    );
}
