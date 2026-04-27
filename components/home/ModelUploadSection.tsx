'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Boxes, CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/upload/FileUpload';
import { useFileStore } from '@/store/useFileStore';
import Scene from '@/components/canvas/Scene';

export default function ModelUploadSection() {
    const { file, reset } = useFileStore();

    const handleQuoteClick = () => {
        // 이미 파일이 업로드된 경우 견적 페이지로 이동 시 리셋이 필요한 경우에만 사용 (필요 시)
        // 현재는 초기 상태가 비어있으므로 특별한 처리가 필요 없습니다.
    };

    return (
        <section id="upload" className="py-24 md:py-32 relative overflow-hidden bg-background cyber-grid transition-all duration-500">
            {/* Background Glow Points */}
            <div className="absolute left-[-5%] top-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
            <div className="absolute right-[-5%] bottom-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Boxes className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black tracking-widest text-primary uppercase">Model Integration</span>
                    </div>
                    <h2 className="text-3xl md:text-6xl font-black text-foreground mb-6 tracking-tighter uppercase">
                        3D 모델 분석 및 <span className="text-primary text-glow-mint">자동 견적</span>
                    </h2>
                    <p className="text-foreground/60 text-lg max-w-2xl mx-auto font-bold break-keep">
                        STL, OBJ, STEP 등 다양한 형식을 지원하며,<br />
                        AI 분석을 통해 99% 정확도의 견적을 실시간으로 제공합니다.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border-primary/10">
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* Left: Visualization */}
                            <div className="relative flex flex-col items-center justify-center p-8 md:p-16 border-b md:border-b-0 md:border-r border-primary/10 min-h-[400px] bg-primary/5">
                                <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
                                {!file ? (
                                    <>
                                        <div className="relative w-full h-full min-h-[350px]">
                                            <div className="absolute inset-0">
                                                <Scene compact />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-white/50 backdrop-blur-md border border-primary/20 shadow-lg">
                                            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">
                                                Interactive 3D Preview
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary mb-8 cyber-glow-mint">
                                            <CheckCircle2 className="w-10 h-10" />
                                        </div>
                                        <p className="text-2xl font-black text-foreground mb-4 uppercase tracking-tighter">Analysis Ready</p>
                                        <p className="text-foreground/60 mb-10 font-bold leading-relaxed">모델 업로드가 완료되었습니다.<br />상세 견적 페이지에서 확인하세요.</p>
                                        <Link href="/quote" onClick={handleQuoteClick}>
                                            <Button size="lg" className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/30 transition-all hover:scale-105">
                                                <Zap className="w-5 h-5 fill-current" />
                                                상세 견적 확인
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Right: Upload Area */}
                            <div className="p-8 md:p-16 flex flex-col justify-center bg-white/40">
                                <FileUpload variant="default" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-wrap justify-center gap-8">
                        {[
                            { label: 'Security', value: 'End-to-End Encrypted' },
                            { label: 'File Size', value: 'Up to 100MB' },
                            { label: 'Formats', value: 'STL, STEP, 3MF, OBJ' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">{item.label}:</span>
                                <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
