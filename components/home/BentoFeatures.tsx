'use client';

import { motion } from 'framer-motion';
import { Zap, Box, Ruler, Truck, ShieldCheck, Palette } from 'lucide-react';

const features = [
    {
        title: "Instant AI Quote",
        description: "Upload your STL/OBJ files and get a price in seconds. No waiting for emails.",
        icon: Zap,
        className: "md:col-span-2 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-primary/20",
        iconColor: "text-primary"
    },
    {
        title: "30+ Materials",
        description: "PLA, ABS, PETG, Resin, Nylon, and more.",
        icon: Box,
        className: "md:col-span-1 bg-card",
        iconColor: "text-blue-500"
    },
    {
        title: "Industrial Precision",
        description: "Tolerance down to ±0.05mm for functional parts.",
        icon: Ruler,
        className: "md:col-span-1 bg-card",
        iconColor: "text-green-500"
    },
    {
        title: "Fast Shipping",
        description: "Dispatch as fast as 24 hours for urgent orders.",
        icon: Truck,
        className: "md:col-span-2 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20",
        iconColor: "text-orange-500"
    },
    {
        title: "Quality Guaranteed",
        description: "Every part is inspected before shipping.",
        icon: ShieldCheck,
        className: "md:col-span-1 bg-card",
        iconColor: "text-teal-500"
    },
    {
        title: "Full Color",
        description: "Vibrant colors and painting services available.",
        icon: Palette,
        className: "md:col-span-2 bg-card",
        iconColor: "text-pink-500"
    }
];

export default function BentoFeatures() {
    return (
        <section className="py-24 bg-secondary/30 relative">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose Wow3D?</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        We combine advanced technology with expert craftsmanship.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`group relative p-8 rounded-3xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 ${feature.className}`}
                        >
                            <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
                                <feature.icon className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-2xl bg-background shadow-sm flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform ${feature.iconColor}`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
