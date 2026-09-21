'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function Marquee() {
    const t = useTranslations('Home');
    const items = (t.raw('marqueeItems') as string[]) || [];
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="py-8 bg-foreground/5 border-y border-border overflow-hidden flex select-none">
            <motion.div
                // SSR/CSR 동일 시작점 — 마운트 후에만 무한 스크롤 (React #418 방지)
                animate={mounted ? { x: [0, -1000] } : { x: 0 }}
                transition={
                    mounted
                        ? { repeat: Infinity, duration: 40, ease: 'linear' }
                        : { duration: 0 }
                }
                className="flex gap-12 whitespace-nowrap min-w-full"
            >
                {[...items, ...items, ...items, ...items].map((item, i) => (
                    <span
                        key={i}
                        className="text-2xl font-bold uppercase text-muted-foreground tracking-wider hover:text-primary transition-colors cursor-default"
                    >
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
