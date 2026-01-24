'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CTA() {
    return (
        <section className="py-32 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center p-12 md:p-24 rounded-[3rem] bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 backdrop-blur-3xl overflow-hidden relative">

                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold mb-8 tracking-tight"
                    >
                        Ready to <span className="text-primary">Print?</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
                    >
                        Upload your design now and get an instant quote.
                        No sign-up required to see the price.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap justify-center gap-4"
                    >
                        <Link href="/quote">
                            <Button size="lg" className="h-16 px-10 text-xl rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300">
                                Get Instant Quote <ArrowRight className="ml-2" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10" />
        </section>
    );
}
