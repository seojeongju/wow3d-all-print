'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 화면 근처(rootMargin)에 들어올 때 children을 처음 마운트한다 — 한 번 보이면 계속 유지.
 * three.js처럼 무거운 컴포넌트를 첫 로딩에서 빼기 위해 사용하며, 그 전에는 같은 높이의 자리만 차지해 레이아웃이 흔들리지 않는다.
 */
export default function LazyMount({
    children,
    minHeight,
    rootMargin = '600px 0px',
}: {
    children: ReactNode;
    /** 마운트 전 자리 높이(px) — 실제 높이와 비슷하게 */
    minHeight: number;
    rootMargin?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || visible) return;
        if (typeof IntersectionObserver === 'undefined') {
            setVisible(true);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setVisible(true);
                    io.disconnect();
                }
            },
            { rootMargin }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [visible, rootMargin]);

    return (
        <div ref={ref} className="flex w-full justify-center" style={visible ? undefined : { minHeight }}>
            {visible ? children : null}
        </div>
    );
}
