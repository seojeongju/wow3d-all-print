import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema';

export const metadata: Metadata = {
    title: 'PLA vs ABS vs PETG 소재 비교 가이드',
    description:
        'PLA, ABS, PETG 3D 프린팅 소재의 차이와 내열성, 강도, 후가공성, 추천 용도를 비교해 어떤 필라멘트가 적합한지 안내합니다.',
    alternates: { canonical: absoluteUrl('/guides/pla-vs-abs-vs-petg') },
};

const faqs = [
    {
        q: '초보자나 일반 시제품에는 PLA, ABS, PETG 중 어떤 소재가 가장 적합한가요?',
        a: '일반적으로 출력 안정성과 다루기 쉬운 특성 때문에 PLA가 가장 무난합니다. 기능성 테스트나 내열성이 더 필요하면 PETG나 ABS를 검토하는 것이 좋습니다.',
    },
    {
        q: '내열성과 내충격성이 중요하면 PLA보다 ABS가 더 좋은가요?',
        a: '대체로 그렇습니다. ABS는 PLA보다 내열성과 내충격성이 우수해 하우징, 기능 시험용 부품, 자동차·가전 부품 시제품에 더 적합한 경우가 많습니다.',
    },
    {
        q: 'PETG는 PLA와 ABS 사이의 중간 성격이라고 봐도 되나요?',
        a: '실무에서는 그렇게 보는 경우가 많습니다. PETG는 PLA보다 더 강하고 내구성이 좋으면서 ABS보다 출력 난도가 낮아 균형형 소재로 많이 선택됩니다.',
    },
];

const articleSchema = buildArticleSchema({
    headline: 'PLA vs ABS vs PETG 소재 비교 가이드',
    description:
        '3D 프린팅에서 많이 쓰는 PLA, ABS, PETG의 차이와 추천 용도를 비교해 적합한 FDM 소재를 선택하는 가이드입니다.',
    path: '/guides/pla-vs-abs-vs-petg',
});

const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '소재', path: '/materials' },
    { name: 'PLA vs ABS vs PETG 비교 가이드', path: '/guides/pla-vs-abs-vs-petg' },
]);

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    url: absoluteUrl('/guides/pla-vs-abs-vs-petg'),
};

export default function PlaAbsPetgGuidePage() {
    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([articleSchema, breadcrumbSchema, faqSchema]) }}
            />

            <section className="pt-32 pb-20 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-5xl space-y-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        Material Guide
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        PLA, ABS, PETG는
                        <br />
                        <span className="text-teal-400">무엇이 다를까요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        FDM 3D 프린팅에서 가장 많이 비교되는 PLA, ABS, PETG 소재의 차이를 정리했습니다.
                        강도, 내열성, 출력 난이도, 후가공성, 추천 용도를 기준으로 어떤 필라멘트가 맞는지 판단할 수 있습니다.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.03]">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-white/[0.04]">
                                <tr>
                                    <th className="p-4 text-left">항목</th>
                                    <th className="p-4 text-left">PLA</th>
                                    <th className="p-4 text-left">ABS</th>
                                    <th className="p-4 text-left">PETG</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/75">
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">특징</td><td className="p-4">출력이 쉬움, 시각용 시제품 적합</td><td className="p-4">내열·내충격 우수</td><td className="p-4">강도와 출력 안정성의 균형</td></tr>
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">추천 용도</td><td className="p-4">디자인 목업, 교육, 전시</td><td className="p-4">하우징, 기능 시험, 조립 부품</td><td className="p-4">기능 부품, 보호 케이스, 야외 구조물</td></tr>
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">장점</td><td className="p-4">초보자 친화적, 깔끔한 표면</td><td className="p-4">가공성과 내구성 우수</td><td className="p-4">내충격·내습·반투명 옵션</td></tr>
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">주의점</td><td className="p-4">내열·내충격 한계</td><td className="p-4">수축과 냄새, 환기 필요</td><td className="p-4">습기 관리와 세팅 최적화 필요</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <h2 className="text-xl font-black mb-3">PLA</h2>
                            <p className="text-white/65 leading-relaxed break-keep">출력이 쉬워 일반 시제품과 교육용 제작에 적합합니다. 외관 확인용, 전시용, 초기 아이디어 검증에 많이 쓰입니다.</p>
                        </article>
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <h2 className="text-xl font-black mb-3">ABS</h2>
                            <p className="text-white/65 leading-relaxed break-keep">내열성과 내충격성이 좋아 하우징, 기능 시험, 조립성 검토 부품에 적합합니다. 출력 환경 관리가 더 중요합니다.</p>
                        </article>
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <h2 className="text-xl font-black mb-3">PETG</h2>
                            <p className="text-white/65 leading-relaxed break-keep">PLA보다 강하고 ABS보다 다루기 쉬운 편이라 균형형 기능성 소재로 많이 선택됩니다.</p>
                        </article>
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">자주 묻는 질문</h2>
                        <div className="space-y-5">
                            {faqs.map((item) => (
                                <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                                    <h3 className="text-lg font-black text-white mb-2">{item.q}</h3>
                                    <p className="text-white/68 leading-relaxed break-keep">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </article>

                    <div className="flex gap-3">
                        <Link href="/materials">
                            <Button variant="outline" className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                                전체 소재 보기
                            </Button>
                        </Link>
                        <Link href="/quote">
                            <Button className="rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                                자동견적 시작 <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
