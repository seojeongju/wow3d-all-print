'use client';

import { motion } from 'framer-motion';

const items = [
    "PLA", "ABS", "PETG", "TPU", "Nylon", "Resin Standard", "Resin Tough",
    "FDM Technology", "SLA Precision", "DLP Speed", "Industrial Grade",
    "Prototyping", "End-use Parts"
];

export default function Marquee() {
    return (
        <div className="py-8 bg-foreground/5 border-y border-border overflow-hidden flex select-none">
            <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                className="flex gap-12 whitespace-nowrap min-w-full"
            >
                {[...items, ...items, ...items, ...items].map((item, i) => (
                    <span key={i} className="text-2xl font-bold uppercase text-muted-foreground/50 tracking-wider">
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
