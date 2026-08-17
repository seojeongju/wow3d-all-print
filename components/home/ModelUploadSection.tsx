'use client';

import { useCallback, useState, type DragEvent } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/upload/FileUpload';
import { useFileStore } from '@/store/useFileStore';
import Scene from '@/components/canvas/Scene';
import { getModelFileFromDataTransfer, MODEL_FILE_MAX_BYTES } from '@/lib/model-file';
import { cn } from '@/lib/utils';

export default function ModelUploadSection() {
    const { file, setFile } = useFileStore();
    const [isCardDragging, setIsCardDragging] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    const handleQuoteClick = () => {
        // 이미 파일이 업로드된 경우 견적 페이지로 이동 시 리셋이 필요한 경우에만 사용 (필요 시)
        // 현재는 초기 상태가 비어있으므로 특별한 처리가 없습니다.
    };

    const handleCardDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsCardDragging(true);
    }, []);

    const handleCardDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        // 자식으로 이동할 때 leave가 발생하는 경우 무시
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsCardDragging(false);
    }, []);

    const handleCardDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsCardDragging(false);
            setCardError(null);

            const files = e.dataTransfer?.files;
            if (!files?.length) return;

            const candidate = files[0];
            if (candidate.size > MODEL_FILE_MAX_BYTES) {
                setCardError('파일 크기는 최대 100MB까지 가능합니다.');
                return;
            }

            const model = getModelFileFromDataTransfer(e.dataTransfer);
            if (!model) {
                setCardError('STL, OBJ, 3MF, PLY, STEP, STP 파일만 업로드할 수 있습니다.');
                return;
            }
            setFile(model);
        },
        [setFile]
    );

    return (
        <section id="upload" className="py-24 md:py-32 relative overflow-hidden">
            {/* 연한 블랙 및 그라데이션 배경 (Hero와 동일) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            {/* 틸/블루 은은한 포인트 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

            {/* 그리드 배경 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* 배경 글로우 포인트들 */}
            <div className="absolute left-0 top-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-[130px]" />
            <div className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[150px]" />
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[300px] h-[300px] rounded-full bg-purple-800/10 blur-[100px]" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        파일이 있든 없든 <span className="text-teal-400">실시간 견적</span>
                    </h2>
                    <p className="text-white/95 text-lg max-w-2xl mx-auto font-medium">
                        3D 모델 업로드 즉시 견적 · 사진만 있어도 AI 모델링 후 견적 · 회원가입 없이 확인 가능
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button asChild className="h-12 px-6 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold">
                            <Link href="/quote?entry=file">3D 모델이 있어요</Link>
                        </Button>
                        <Button asChild variant="outline" className="h-12 px-6 rounded-xl border-white/25 bg-white/5 text-white hover:bg-white/10 font-bold">
                            <Link href="/quote?entry=photo">3D 모델이 없어요 (사진 → AI)</Link>
                        </Button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="max-w-5xl mx-auto"
                >
                    <div
                        onDragEnter={handleCardDragOver}
                        onDragOver={handleCardDragOver}
                        onDragLeave={handleCardDragLeave}
                        onDrop={handleCardDrop}
                        className={cn(
                            'rounded-3xl border bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50 transition-all duration-300',
                            isCardDragging
                                ? 'border-teal-400 ring-2 ring-teal-400/40 bg-teal-400/5'
                                : 'border-white/10'
                        )}
                    >
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* 좌: 3D 플레이스홀더 또는 업로드 완료 CTA */}
                            <div className="flex flex-col items-center justify-center p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 min-h-[280px]">
                                {!file ? (
                                    <>
                                        <div className="relative w-full h-full min-h-[300px]">
                                            <div className="absolute inset-0">
                                                <Scene compact />
                                            </div>
                                            {isCardDragging ? (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-none">
                                                    <p className="text-teal-300 font-black text-sm tracking-wide">
                                                        여기에 모델을 놓아 업로드
                                                    </p>
                                                </div>
                                            ) : null}
                                        </div>
                                        <p className="mt-2 text-sm text-white/85 font-medium italic">
                                            샘플 모델을 직접 돌려보고 확대해보세요 · 파일 드래그도 가능합니다
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <p className="text-lg font-semibold text-white mb-2">업로드 완료</p>
                                        <p className="text-sm text-white/85 mb-6 font-medium">상세 견적과 3D 미리보기를 확인하세요</p>
                                        <Link href="/quote" onClick={handleQuoteClick}>
                                            <Button size="lg" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-lg shadow-primary/25">
                                                <Zap className="w-4 h-4" />
                                                견적 확인하기
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* 우: 3D 모델 업로드 */}
                            <div className="p-8 md:p-10 flex flex-col justify-center">
                                <FileUpload variant="dark" />
                                {cardError ? (
                                    <p className="mt-3 text-xs font-bold text-red-300" role="alert">
                                        {cardError}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-white/85 text-xs mt-6 font-medium">
                        최대 100MB · 업로드 파일은 암호화되어 안전하게 처리됩니다
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
