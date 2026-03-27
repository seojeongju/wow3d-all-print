'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CTA() {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* 연한 블랙 및 그라데이션 배경 (Hero와 동일) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            {/* 틸/블루 은은한 포인트 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

            {/* 그리드 배경 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* 배경 글로우 포인트들 */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center p-12 md:p-24 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden relative shadow-2xl shadow-black/50">

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold mb-8 tracking-tight word-keep-all text-white"
                    >
                        지금, 출력을 <span className="text-teal-400">시작하세요</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-white/70 mb-12 max-w-2xl mx-auto break-keep font-medium"
                    >
                        파일을 업로드하고 즉시 견적을 확인해보세요.
                        회원가입 없이도 가격을 확인할 수 있습니다.
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
                                3D 프린팅 무료 견적 받기 <ArrowRight className="ml-2" />
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
