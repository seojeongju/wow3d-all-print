import type { PointerEvent } from 'react';

/** 히어로 메인 카드 기울기 — 렌더링 없이 CSS 변수(--rx/--ry/--mx/--my)만 갱신 (.hero-tilt 참고) */
const MAX_TILT_DEG = 6;

let frame = 0;
let reducedMotion: MediaQueryList | null = null;

function prefersReducedMotion() {
    if (typeof window === 'undefined') return true;
    reducedMotion ??= window.matchMedia('(prefers-reduced-motion: reduce)');
    return reducedMotion.matches;
}

export function handleHeroTiltMove(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const el = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const px = (clientX - rect.left) / rect.width;
        const py = (clientY - rect.top) / rect.height;
        el.style.setProperty('--rx', `${((0.5 - py) * MAX_TILT_DEG * 2).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((px - 0.5) * MAX_TILT_DEG * 2).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    });
}

export function handleHeroTiltLeave(e: PointerEvent<HTMLElement>) {
    cancelAnimationFrame(frame);
    const el = e.currentTarget;
    for (const name of ['--rx', '--ry', '--mx', '--my']) el.style.removeProperty(name);
}
