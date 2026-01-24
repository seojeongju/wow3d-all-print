'use client';

import { motion } from 'framer-motion';

const items = [
    "PLA", "ABS", "PETG", "TPU", "Nylon", "Standard Resin", "Tough Resin",
    "FDM 방식", "SLA 정밀 출력", "DLP 고속 출력", "시제품 제작",
    "졸업작품", "대량 생산", "후가공 서비스"
];

export default function Marquee() {
    return (
        <div id="services" className="py-8 bg-foreground/5 border-y border-border overflow-hidden flex select-none">
            <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                className="flex gap-12 whitespace-nowrap min-w-full"
            >
                {[...items, ...items, ...items, ...items].map((item, i) => (
                    <span key={i} className="text-2xl font-bold uppercase text-muted-foreground/70 tracking-wider hover:text-primary transition-colors cursor-default">
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
