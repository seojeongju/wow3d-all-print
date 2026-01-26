'use client';

import { motion } from 'framer-motion';
import { Boxes, CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/upload/FileUpload';
import { useFileStore } from '@/store/useFileStore';

export default function ModelUploadSection() {
    const { file } = useFileStore();

    return (
        <section id="upload" className="py-24 md:py-32 bg-[#0a0a0a] relative overflow-hidden">
            {/* 그리드 배경 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] -z-10" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        3D 모델을 업로드하고 <span className="text-primary">실시간 견적</span> 받기
                    </h2>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        STL, OBJ, 3MF, PLY, STEP, STP 지원 · 회원가입 없이 견적 확인 가능
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="rounded-3xl border border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40">
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* 좌: 3D 플레이스홀더 또는 업로드 완료 CTA */}
                            <div className="flex flex-col items-center justify-center p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 min-h-[280px]">
                                {!file ? (
                                    <>
                                        {/* 그라데이션 3D 큐브 아이콘 (이미지 1 스타일) */}
                                        <motion.div
                                            animate={{ rotate: [0, 5, -5, 0], y: [0, -8, 0] }}
                                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-40 h-40 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-primary/90 via-primary/70 to-purple-600 flex items-center justify-center shadow-xl shadow-primary/20 rotate-6"
                                        >
                                            <Boxes className="w-20 h-20 md:w-24 md:h-24 text-white/95" strokeWidth={1.5} />
                                        </motion.div>
                                        <p className="mt-6 text-sm text-white/40 font-medium">
                                            파일을 업로드하면 3D 미리보기가 활성화됩니다
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <p className="text-lg font-semibold text-white mb-2">업로드 완료</p>
                                        <p className="text-sm text-white/50 mb-6">상세 견적과 3D 미리보기를 확인하세요</p>
                                        <Link href="/quote">
                                            <Button size="lg" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-lg shadow-primary/25">
                                                <Zap className="w-4 h-4" />
                                                견적 확인하기
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* 우: 3D 모델 업로드 (이미지 2 스타일) */}
                            <div className="p-8 md:p-10 flex flex-col justify-center">
                                <FileUpload variant="dark" />
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-white/40 text-xs mt-6">
                        최대 100MB · 업로드 파일은 암호화되어 안전하게 처리됩니다
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
