'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { ShowcaseSlug } from '@/lib/showcase';
import type { ShowcaseDetail } from '@/lib/showcase-public';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ShowcaseDetailClient({
    slug,
    initialData,
}: {
    slug: ShowcaseSlug;
    initialData: ShowcaseDetail;
}) {
    const data = initialData;

    return (
        <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col selection:bg-teal-500/30 overflow-hidden relative font-sans">
            <Header />

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute top-[20%] right-[5%] w-[45%] h-[45%] bg-teal-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 flex-1">
                <div className="container mx-auto max-w-6xl px-6 pt-28 pb-16">
                    <Link
                        href="/expert"
                        className="inline-flex items-center gap-2 text-sm font-bold text-teal-400/80 hover:text-teal-300 mb-10 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        전문가 서비스로 돌아가기
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-20"
                    >
                        <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                            <img
                                src={data.heroImageUrl}
                                alt={`${data.title} 대표 이미지`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-3d.svg';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        </div>
                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight break-keep leading-tight">
                                {data.title}
                            </h1>
                            <p className="text-lg text-white/60 font-medium leading-relaxed break-keep">
                                {data.description}
                            </p>
                            {data.features.length > 0 && (
                                <ul className="space-y-3 pt-2">
                                    {data.features.map((f, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center gap-3 text-sm font-bold text-teal-400/90"
                                        >
                                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>

                    <section className="border-t border-white/10 pt-16">
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">
                            제작 예시
                        </h2>
                        <p className="text-white/45 text-sm font-medium mb-12 max-w-xl break-keep">
                            실제 진행한 샘플·사례 이미지와 영상입니다. 관리자가 등록한 콘텐츠가 없으면 이 섹션은 비어
                            있을 수 있습니다.
                        </p>

                        {data.examples.length === 0 ? (
                            <p className="text-white/35 text-center py-16 rounded-3xl border border-dashed border-white/10">
                                등록된 제작 예시가 없습니다. 곧 업데이트될 예정입니다.
                            </p>
                        ) : (
                            <div className="space-y-16">
                                {data.examples.map((ex) => (
                                    <motion.article
                                        key={ex.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className="rounded-[2rem] bg-white/[0.03] border border-white/10 p-8 md:p-10"
                                    >
                                        <h3 className="text-xl md:text-2xl font-black text-white mb-3">
                                            {ex.title}
                                        </h3>
                                        {ex.description && (
                                            <p className="text-white/55 text-sm md:text-base font-medium leading-relaxed mb-6 break-keep whitespace-pre-wrap">
                                                {ex.description}
                                            </p>
                                        )}
                                        {ex.features.length > 0 && (
                                            <ul className="flex flex-wrap gap-2 mb-8">
                                                {ex.features.map((f, i) => (
                                                    <li
                                                        key={i}
                                                        className="text-xs font-bold px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/25"
                                                    >
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {ex.media.length > 0 && (
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {ex.media.map((m) =>
                                                    m.kind === 'video' ? (
                                                        <video
                                                            key={m.id}
                                                            src={m.url}
                                                            controls
                                                            className="w-full rounded-2xl border border-white/10 bg-black max-h-[360px]"
                                                            preload="metadata"
                                                        />
                                                    ) : (
                                                        <a
                                                            key={m.id}
                                                            href={m.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block rounded-2xl overflow-hidden border border-white/10"
                                                        >
                                                            <img
                                                                src={m.url}
                                                                alt={ex.title}
                                                                className="w-full h-full object-cover max-h-[360px] hover:scale-[1.02] transition-transform"
                                                            />
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </motion.article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <Footer />
        </main>
    );
}
