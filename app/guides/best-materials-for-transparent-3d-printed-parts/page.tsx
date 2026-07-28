import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GuideCTA from '@/components/guides/GuideCTA';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema';

export const metadata: Metadata = {
    title: '투명 부품용 3D 프린팅 소재 추천 가이드',
    description:
        '투명 커버, 관찰창, 창 구조, 시인성 부품 제작에 적합한 3D 프린팅 소재를 비교합니다. Clear 레진과 PETG의 차이도 함께 설명합니다.',
    alternates: { canonical: absoluteUrl('/guides/best-materials-for-transparent-3d-printed-parts') },
};

const options = [
    {
        title: '최우선 추천: Clear 레진',
        detail: '투명도와 시인성이 가장 중요할 때 적합합니다. SLA·DLP 기반으로 매끄러운 표면과 높은 디테일을 얻기 좋고, 후연마와 코팅을 하면 더 높은 투명도를 기대할 수 있습니다.',
    },
    {
        title: '대안 선택: PETG',
        detail: '완전한 투명 표현보다는 반투명 커버, 보호창, 기능성 케이스에 적합합니다. FDM 방식이라 구조적 강도와 내구성이 필요한 경우 고려하기 좋습니다.',
    },
    {
        title: '피해야 할 경우가 많은 소재: 일반 PLA/ABS',
        detail: '투명 표현 자체가 핵심이라면 PLA나 ABS는 적합성이 떨어질 수 있습니다. 표면층과 광투과 특성 때문에 깨끗한 투명도를 얻기 어렵습니다.',
    },
];

const faqs = [
    {
        q: '투명 부품은 3D 프린팅으로 정말 투명하게 만들 수 있나요?',
        a: '가능하지만 방식과 후처리에 따라 차이가 큽니다. 일반적으로 Clear 레진이 가장 유리하며, 완전한 유리 수준의 투명도를 원하면 추가 연마와 코팅이 필요할 수 있습니다.',
    },
    {
        q: '투명 커버나 창 구조는 PETG와 Clear 레진 중 무엇이 더 좋나요?',
        a: '시인성과 외관이 가장 중요하면 Clear 레진이 더 적합합니다. 구조 강도와 범용 기능성이 더 중요하고 약간의 반투명 표현이 허용된다면 PETG도 좋은 선택입니다.',
    },
    {
        q: '투명 부품 제작 시 후처리가 꼭 필요한가요?',
        a: '높은 투명도를 원한다면 대부분 필요합니다. 레진은 세척, 경화, 연마, 코팅 과정을 거치면 더 좋은 투명 표현을 얻을 수 있습니다.',
    },
];

const articleSchema = buildArticleSchema({
    headline: '투명 부품용 3D 프린팅 소재 추천 가이드',
    description:
        '투명 커버, 관찰창, 시인성 부품에 적합한 3D 프린팅 소재로 Clear 레진과 PETG를 비교하는 가이드입니다.',
    path: '/guides/best-materials-for-transparent-3d-printed-parts',
});

const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '소재', path: '/materials' },
    { name: '투명 부품용 소재 추천 가이드', path: '/guides/best-materials-for-transparent-3d-printed-parts' },
]);

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    url: absoluteUrl('/guides/best-materials-for-transparent-3d-printed-parts'),
};

export default function TransparentPartsGuidePage() {
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
                        투명 부품 제작에는
                        <br />
                        <span className="text-teal-400">어떤 소재가 좋을까요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        투명 커버, 관찰창, 보호창, 시인성 부품은 일반 부품과 소재 선택 기준이 다릅니다.
                        이 가이드는 투명 표현과 기능성 사이에서 어떤 소재를 선택해야 하는지 목적 기준으로 정리했습니다.
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
                        <h2 className="text-2xl font-black">투명 부품 제작 시 체크 포인트</h2>
                        <ul className="space-y-2 text-white/75 leading-relaxed">
                            <li>완전한 투명도가 필요한지, 반투명 정도면 충분한지</li>
                            <li>외관이 중요한지, 구조 강도가 중요한지</li>
                            <li>연마와 코팅 같은 후처리를 허용할 수 있는지</li>
                            <li>실내 전시용인지, 실제 기능 부품인지</li>
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

                    <GuideCTA
                        eyebrow="Transparent Parts CTA"
                        title="투명 커버와 관찰창 부품 조건으로 바로 견적을 받아보세요"
                        description="투명도, 시인성, 후처리 허용 범위를 고려해 Clear 레진이나 PETG 조건으로 실제 견적과 제작 가능성을 확인할 수 있습니다."
                        secondaryHref="/materials"
                        secondaryLabel="소재 전체 보기"
                    />
                </div>
            </section>

            <Footer />
        </main>
    );
}
