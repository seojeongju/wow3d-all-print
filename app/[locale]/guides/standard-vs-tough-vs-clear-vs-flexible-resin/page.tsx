import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema';

export const metadata: Metadata = {
    title: 'Standard vs Tough vs Clear vs Flexible 레진 비교',
    description:
        'SLA와 DLP 3D 프린팅에서 많이 쓰는 Standard, Tough, Clear, Flexible 레진의 차이와 표면 품질, 강도, 투명도, 추천 용도를 비교합니다.',
    alternates: { canonical: absoluteUrl('/guides/standard-vs-tough-vs-clear-vs-flexible-resin') },
};

const faqs = [
    {
        q: '디자인 검토용 외관 시제품에는 어떤 레진이 가장 적합한가요?',
        a: '일반적인 외관 검토와 디자인 확인에는 Standard 레진이 가장 많이 사용됩니다. 표면이 매끄럽고 디테일 표현이 좋아 시각용 프로토타입에 적합합니다.',
    },
    {
        q: '조립 테스트나 기능 시험에는 Tough 레진이 더 적합한가요?',
        a: '대체로 그렇습니다. Tough 레진은 Standard보다 충격과 하중에 더 잘 견디는 편이어서 조립성 검토, 체결 테스트, 기능성 시제품에 더 적합합니다.',
    },
    {
        q: '투명 부품이나 창 구조에는 Clear 레진을 선택하면 되나요?',
        a: '네. 시인성이 중요한 커버, 창, 관찰용 부품은 Clear 레진이 적합합니다. 다만 높은 투명도를 원하면 후연마와 코팅 같은 후처리가 필요할 수 있습니다.',
    },
];

const articleSchema = buildArticleSchema({
    headline: 'Standard vs Tough vs Clear vs Flexible 레진 비교',
    description:
        'SLA 및 DLP 3D 프린팅에서 쓰는 Standard, Tough, Clear, Flexible 레진의 차이와 추천 용도를 비교하는 가이드입니다.',
    path: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin',
});

const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '소재', path: '/materials' },
    { name: '레진 비교 가이드', path: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin' },
]);

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    url: absoluteUrl('/guides/standard-vs-tough-vs-clear-vs-flexible-resin'),
};

export default function ResinGuidePage() {
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
                        Resin Guide
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        Standard, Tough, Clear, Flexible
                        <br />
                        <span className="text-teal-400">레진은 무엇이 다를까요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        SLA와 DLP 출력에서 자주 선택되는 네 가지 레진 소재를 비교했습니다.
                        외관 시제품, 기능성 테스트, 투명 부품, 유연한 부품 중 어떤 목적에 어떤 레진이 맞는지 빠르게 판단할 수 있습니다.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.03]">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead className="bg-white/[0.04]">
                                <tr>
                                    <th className="p-4 text-left">항목</th>
                                    <th className="p-4 text-left">Standard</th>
                                    <th className="p-4 text-left">Tough</th>
                                    <th className="p-4 text-left">Clear</th>
                                    <th className="p-4 text-left">Flexible</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/75">
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">주요 특징</td><td className="p-4">표면 품질·디테일 우수</td><td className="p-4">강도·내충격 우수</td><td className="p-4">투명도·시인성</td><td className="p-4">유연성·완충성</td></tr>
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">추천 용도</td><td className="p-4">시각 프로토타입</td><td className="p-4">조립·기능 시험</td><td className="p-4">커버·창·관찰 부품</td><td className="p-4">그립·완충·연성 부품</td></tr>
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">장점</td><td className="p-4">경제적, 표현력 우수</td><td className="p-4">내구성과 체결성</td><td className="p-4">후처리 시 높은 투명도</td><td className="p-4">변형 허용, 충격 흡수</td></tr>
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">주의점</td><td className="p-4">기능성 하중 한계</td><td className="p-4">단가 상승 가능</td><td className="p-4">후처리 필요</td><td className="p-4">경도·보관 조건 영향</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <h2 className="text-xl font-black mb-3">Standard / Tough</h2>
                            <p className="text-white/65 leading-relaxed break-keep">외관 중심이면 Standard, 기능 시험과 조립성 검토가 중요하면 Tough가 더 적합한 경우가 많습니다.</p>
                        </article>
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <h2 className="text-xl font-black mb-3">Clear / Flexible</h2>
                            <p className="text-white/65 leading-relaxed break-keep">투명 부품은 Clear, 유연하거나 완충이 필요한 구조는 Flexible 레진이 더 적합합니다.</p>
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
