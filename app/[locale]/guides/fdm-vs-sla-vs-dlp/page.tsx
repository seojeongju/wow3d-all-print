import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { absoluteUrl } from '@/lib/site-url';
import {
    ALL_PRINT_METHOD_COMPARE_ROWS,
    GUIDE_PRINT_METHOD_SUMMARIES,
    PRINT_METHOD_FAQS,
} from '@/lib/print-methods-data';

export const metadata: Metadata = {
    title: '3D 프린팅 공정 비교 가이드 — FDM vs SLA vs DLP vs SLS vs PolyJet',
    description:
        'FDM·SLA·DLP(WOW3D 제공)와 분말 소결(SLS/SLM/DMLS), 재료 분사(PolyJet/MJP) 공정의 차이, 추천 용도, 표면 품질, 비용을 한눈에 비교합니다.',
    alternates: { canonical: absoluteUrl('/guides/fdm-vs-sla-vs-dlp') },
    openGraph: {
        title: '3D 프린팅 공정 비교 가이드',
        description:
            'FDM·SLA·DLP와 SLS/SLM/DMLS, PolyJet/MJP 등 주요 3D 프린팅 방식의 차이와 추천 용도를 비교 안내합니다.',
        url: absoluteUrl('/guides/fdm-vs-sla-vs-dlp'),
    },
};

const COLUMN_HEADERS = [
    { key: 'fdm', label: 'FDM', accent: 'text-amber-300' },
    { key: 'sla', label: 'SLA', accent: 'text-cyan-300' },
    { key: 'dlp', label: 'DLP', accent: 'text-violet-300' },
    { key: 'powder', label: 'SLS / SLM / DMLS', accent: 'text-rose-300' },
    { key: 'jetting', label: 'PolyJet / MJP', accent: 'text-sky-300' },
] as const;

export default function CompareGuidePage() {
    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <section className="pt-32 pb-20">
                <div className="container mx-auto max-w-5xl space-y-6 px-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        Compare Guide
                    </div>
                    <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
                        3D 프린팅 공정,
                        <br />
                        <span className="text-teal-400">무엇이 다를까요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg leading-relaxed text-white/70 break-keep">
                        WOW3D가 제공하는 FDM·SLA·DLP와 함께, 업계에서 자주 쓰이는 분말 소결(SLS/SLM/DMLS)·
                        재료 분사(PolyJet/MJP) 방식까지 한 페이지에서 비교해 보세요. 비용, 표면 품질, 강도,
                        서포트 필요 여부에 따라 적합한 공정이 달라집니다.
                    </p>
                </div>
            </section>

            <section className="pb-24">
                <div className="container mx-auto max-w-5xl space-y-10 px-6">
                    {/* 5-way comparison table */}
                    <div>
                        <h2 className="mb-4 text-2xl font-black">전체 공정 한눈에 비교</h2>
                        <p className="mb-5 text-sm text-white/55 break-keep">
                            SLS/SLM/DMLS, PolyJet/MJP는 WOW3D에서 직접 제공하지 않는 참고 공정입니다.
                            유사 요구사항은 FDM·SLA·DLP 대안 또는 제작 상담으로 안내해 드립니다.
                        </p>
                        <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.03]">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className="bg-white/[0.04]">
                                    <tr>
                                        <th className="p-4 text-left font-black">항목</th>
                                        {COLUMN_HEADERS.map((col) => (
                                            <th key={col.key} className={`p-4 text-left font-black ${col.accent}`}>
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-white/75">
                                    {ALL_PRINT_METHOD_COMPARE_ROWS.map((row) => (
                                        <tr key={row.label} className="border-t border-white/10">
                                            <td className="p-4 font-bold text-white">{row.label}</td>
                                            {COLUMN_HEADERS.map((col) => (
                                                <td key={col.key} className="p-4">
                                                    {row[col.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* WOW3D 제공 */}
                    <div>
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-400">
                            WOW3D 제공
                        </p>
                        <h2 className="mb-5 text-2xl font-black">바로 견적·제작 가능한 공정</h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            {GUIDE_PRINT_METHOD_SUMMARIES.filter((m) => m.category === 'wow3d').map((method) => (
                                <article
                                    key={method.id}
                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                                >
                                    <div className="mb-3 flex items-center gap-2">
                                        <h3 className="text-xl font-black">{method.name}</h3>
                                        <span className="rounded-full border border-teal-400/30 bg-teal-400/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-teal-300">
                                            제공
                                        </span>
                                    </div>
                                    <p className="mb-1 text-xs font-bold text-white/45">{method.nameKo}</p>
                                    <p className="leading-relaxed text-white/65 break-keep">{method.summary}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* 참고 공정 */}
                    <div>
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-white/40">
                            Reference
                        </p>
                        <h2 className="mb-5 text-2xl font-black">다른 3D 프린팅 방식 (참고)</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {GUIDE_PRINT_METHOD_SUMMARIES.filter((m) => m.category === 'reference').map(
                                (method) => (
                                    <article
                                        key={method.id}
                                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                                    >
                                        <div className="mb-3 flex items-center gap-2">
                                            <h3 className="text-xl font-black">{method.name}</h3>
                                            <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/50">
                                                정보 안내
                                            </span>
                                        </div>
                                        <p className="mb-3 text-xs font-bold text-white/45">{method.nameKo}</p>
                                        <p className="mb-4 leading-relaxed text-white/65 break-keep">
                                            {method.summary}
                                        </p>
                                        {'subtypes' in method && method.subtypes && (
                                            <div className="space-y-2 border-t border-white/10 pt-4">
                                                {method.subtypes.map((sub) => (
                                                    <div key={sub.name}>
                                                        <p className="text-sm font-black text-white/80">{sub.name}</p>
                                                        <p className="text-xs leading-relaxed text-white/55 break-keep">
                                                            {sub.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                ),
                            )}
                        </div>
                    </div>

                    {/* 선택 가이드 */}
                    <div className="rounded-[2rem] border border-teal-400/15 bg-teal-400/5 p-8">
                        <h2 className="mb-4 text-2xl font-black">이렇게 선택해 보세요</h2>
                        <ul className="space-y-3 text-white/70">
                            <li className="flex gap-3 break-keep">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                                <span>
                                    <strong className="text-white">기능 시험·조립 부품</strong> → FDM이 비용 대비
                                    효율이 좋습니다.
                                </span>
                            </li>
                            <li className="flex gap-3 break-keep">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                                <span>
                                    <strong className="text-white">외관·정밀 디테일</strong> → SLA 또는 DLP를
                                    고려하세요.
                                </span>
                            </li>
                            <li className="flex gap-3 break-keep">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                                <span>
                                    <strong className="text-white">서포트 없는 복잡 형상·금속 부품</strong> →
                                    SLS/SLM/DMLS(참고)가 적합할 수 있습니다.
                                </span>
                            </li>
                            <li className="flex gap-3 break-keep">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                                <span>
                                    <strong className="text-white">멀티컬러·최고 해상도 외관 모형</strong> →
                                    PolyJet/MJP(참고)를 검토해 보세요.
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* FAQ */}
                    <div className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
                        <h2 className="text-2xl font-black">자주 묻는 질문</h2>
                        {PRINT_METHOD_FAQS.map((item) => (
                            <div key={item.q} className="rounded-2xl border border-white/10 bg-black/15 p-5">
                                <h3 className="mb-2 text-lg font-black break-keep">{item.q}</h3>
                                <p className="leading-relaxed text-white/68 break-keep">{item.a}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link href="/quote">
                            <Button className="rounded-2xl bg-teal-400 font-black text-slate-950 hover:bg-teal-300">
                                자동견적 받기 <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/print-methods">
                            <Button
                                variant="outline"
                                className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                                출력 방식 상세 보기
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button
                                variant="outline"
                                className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                                제작 상담
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
}
