'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function Marquee() {
    const t = useTranslations('Home');
    const items = (t.raw('marqueeItems') as string[]) || [];

    return (
        <div className="py-8 bg-foreground/5 border-y border-border overflow-hidden flex select-none">
            <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                className="flex gap-12 whitespace-nowrap min-w-full"
            >
                {[...items, ...items, ...items, ...items].map((item, i) => (
                    <span key={i} className="text-2xl font-bold uppercase text-muted-foreground tracking-wider hover:text-primary transition-colors cursor-default">
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
