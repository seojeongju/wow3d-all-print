'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Cuboid } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

export default function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    return (
        <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-background">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
                <div className="absolute right-0 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-purple-500/20 opacity-20 blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 z-10 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-left"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-secondary mb-6 backdrop-blur-md"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next Gen 3D Printing</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                        Bring Your <br />
                        <span className="text-primary relative">
                            Imagination
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        </span>
                        <br />
                        To Life.
                    </h1>

                    <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                        Professional 3D printing service with instant AI quotes.
                        From prototype to mass production, we deliver precision in every layer.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/quote">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-[0_4px_14px_0_rgb(0,118,255,39%)] hover:shadow-[0_6px_20px_rgba(0,118,255,23%)] hover:scale-[1.02] transition-all">
                                Start Printing <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full hover:bg-secondary/80 backdrop-blur-sm">
                            View Materials
                        </Button>
                    </div>

                    <div className="mt-12 flex items-center gap-8 text-muted-foreground">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-400" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="font-bold text-foreground">1,000+</div>
                            <div className="text-sm">Makers satisfied</div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Visual - Abstract 3D Composition */}
                <div className="relative h-[600px] w-full hidden lg:block perspective-1000">
                    <motion.div
                        style={{ y: y1, rotateX: 5, rotateY: -5 }}
                        className="absolute right-0 top-10 w-[400px] h-[500px] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-[40px] border border-white/20 backdrop-blur-xl z-10 flex items-center justify-center group"
                    >
                        <div className="absolute inset-0 bg-grid-white/[0.05] rounded-[40px]" />
                        {/* Fake Interface Elements */}
                        <div className="absolute top-8 left-8 right-8 h-4 bg-white/10 rounded-full" />
                        <div className="absolute top-16 left-8 w-2/3 h-4 bg-white/10 rounded-full" />

                        {/* Floating Cube */}
                        <motion.div
                            animate={{ rotate: 360, y: [0, -20, 0] }}
                            transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                            className="relative"
                        >
                            <div className="w-40 h-40 bg-gradient-to-tr from-primary to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center opacity-90">
                                <Cuboid className="w-20 h-20 text-white" />
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        style={{ y: y2 }}
                        className="absolute left-10 bottom-20 w-[280px] h-[350px] bg-card rounded-[30px] shadow-2xl border border-border p-6 z-20"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold">AI Quoting</div>
                                <div className="text-xs text-muted-foreground">Analysis Complete</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full w-[90%] bg-green-500 rounded-full" />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Printability</span>
                                <span className="font-bold text-green-500">98%</span>
                            </div>
                            <div className="mt-8 p-4 bg-secondary/50 rounded-xl">
                                <div className="text-xs text-muted-foreground mb-1">Estimated Cost</div>
                                <div className="text-2xl font-bold">$ 24.50</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
