import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema';

export const metadata: Metadata = {
    title: '하우징·케이스용 3D 프린팅 소재 추천 가이드',
    description:
        '전자기기 하우징, 보호 케이스, 커버, 외장 부품 제작에 적합한 3D 프린팅 소재를 비교합니다. ABS, PETG, Tough 레진의 차이도 함께 설명합니다.',
    alternates: { canonical: absoluteUrl('/guides/best-materials-for-3d-printed-housings-and-cases') },
};

const options = [
    {
        title: '기능성 하우징 기본 추천: ABS',
        detail: '내충격성과 내열성이 중요하고 체결이나 조립 테스트가 필요한 케이스류에 적합합니다. 후가공과 가공성이 좋아 하우징 시제품에서 많이 선택됩니다.',
    },
    {
        title: '균형형 선택: PETG',
        detail: '강도, 내구성, 출력 안정성의 균형이 좋아 보호 케이스, 커버, 범용 외장 부품에 적합합니다. ABS보다 출력 난도가 낮은 편입니다.',
    },
    {
        title: '정밀 외장 부품 대안: Tough 레진',
        detail: '작은 정밀 케이스나 디테일이 중요한 외장 부품에서 유리합니다. 다만 큰 하중이나 열이 걸리는 하우징은 FDM 계열이 더 적합한 경우가 많습니다.',
    },
];

const faqs = [
    {
        q: '전자기기 하우징이나 케이스에는 ABS와 PETG 중 무엇이 더 좋나요?',
        a: '내열성과 조립성, 후가공성이 중요하면 ABS가 더 적합한 경우가 많고, 출력 안정성과 범용 내구성까지 균형 있게 보려면 PETG가 좋은 선택이 될 수 있습니다.',
    },
    {
        q: '작은 정밀 케이스는 레진으로 만드는 것이 더 좋나요?',
        a: '치수 정밀도와 외관 품질이 가장 중요하면 Tough 레진이 유리할 수 있습니다. 하지만 반복 체결이나 내충격성이 중요하면 ABS 또는 PETG를 우선 고려하는 편이 좋습니다.',
    },
    {
        q: '하우징 제작 시 단순 외관용과 기능성 케이스용 소재는 달라야 하나요?',
        a: '네. 외관 목업은 PLA나 Standard 레진도 가능하지만, 실제 사용을 고려한 보호 케이스나 하우징은 PETG, ABS, Tough 레진처럼 더 강한 소재가 적합합니다.',
    },
];

const articleSchema = buildArticleSchema({
    headline: '하우징·케이스용 3D 프린팅 소재 추천 가이드',
    description:
        '전자기기 하우징, 보호 케이스, 외장 커버 제작에 적합한 3D 프린팅 소재로 ABS, PETG, Tough 레진을 비교하는 가이드입니다.',
    path: '/guides/best-materials-for-3d-printed-housings-and-cases',
});

const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '소재', path: '/materials' },
    { name: '하우징·케이스용 소재 추천 가이드', path: '/guides/best-materials-for-3d-printed-housings-and-cases' },
]);

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    url: absoluteUrl('/guides/best-materials-for-3d-printed-housings-and-cases'),
};

export default function HousingMaterialGuidePage() {
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
                        Use Case Guide
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        하우징과 케이스 제작에는
                        <br />
                        <span className="text-teal-400">어떤 소재가 좋을까요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        전자기기 하우징, 보호 케이스, 외장 커버는 단순 외관만이 아니라 조립성, 충격, 열, 후가공까지 고려해야 합니다.
                        이 가이드는 실무에서 많이 선택하는 소재를 목적 기준으로 정리했습니다.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    <div className="grid gap-6">
                        {options.map((item) => (
                            <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                <h2 className="text-2xl font-black mb-3">{item.title}</h2>
                                <p className="text-white/65 leading-relaxed break-keep">{item.detail}</p>
                            </article>
                        ))}
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">하우징 소재 선택 시 체크 포인트</h2>
                        <ul className="space-y-2 text-white/75 leading-relaxed">
                            <li>반복 체결과 조립 테스트가 필요한지</li>
                            <li>내열성과 내충격성이 어느 정도 필요한지</li>
                            <li>매끈한 외관과 치수 정밀도가 더 중요한지</li>
                            <li>후가공, 도장, 연마를 할 계획이 있는지</li>
                        </ul>
                    </article>

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
                                소재 전체 보기
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
