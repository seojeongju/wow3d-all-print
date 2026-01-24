'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Upload, Settings, CheckCircle } from 'lucide-react';
import { useRef } from 'react';

const steps = [
    {
        id: "01",
        title: "Upload File",
        description: "Drag & drop your STL or OBJ files. Our secure cloud engine analyzes your design instantly.",
        icon: Upload,
        color: "bg-blue-500"
    },
    {
        id: "02",
        title: "Instant Quote",
        description: "Choose materials, colors, and infill. See the price update in real-time as you customize.",
        icon: Settings,
        color: "bg-purple-500"
    },
    {
        id: "03",
        title: "We Print & Ship",
        description: "Our industrial printers get to work. We inspect, pack, and ship your parts within days.",
        icon: CheckCircle,
        color: "bg-green-500"
    }
];

export default function ProcessSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <section ref={containerRef} className="py-24 bg-background relative">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

                    {/* Sticky Left Side */}
                    <div className="lg:w-1/3 lg:h-[calc(100vh-100px)] lg:sticky lg:top-24 flex flex-col justify-center mb-12 lg:mb-0">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            From File to <br />
                            <span className="text-primary">Physical Part</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8">
                            Three simple steps to bring your ideas into the real world.
                        </p>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden hidden lg:block">
                            <motion.div
                                style={{ scaleX: scrollYProgress }}
                                className="h-full bg-primary origin-left"
                            />
                        </div>
                    </div>

                    {/* Right Side Steps */}
                    <div className="lg:w-2/3 space-y-24 pb-24">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className="flex gap-8 group"
                            >
                                <div className="flex flex-col items-center">
                                    <div className={`w-16 h-16 rounded-2xl ${step.color} shadow-lg shadow-current/20 flex items-center justify-center text-white text-2xl font-bold mb-4 group-hover:scale-110 transition-transform`}>
                                        <step.icon className="w-8 h-8" />
                                    </div>
                                    {index !== steps.length - 1 && (
                                        <div className="w-0.5 h-full bg-gradient-to-b from-border to-transparent" />
                                    )}
                                </div>
                                <div className="pt-2">
                                    <span className="text-6xl font-black text-muted/30 -ml-4 block mb-2">{step.id}</span>
                                    <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                                    <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
