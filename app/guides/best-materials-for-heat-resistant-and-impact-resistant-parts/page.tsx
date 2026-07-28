import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GuideCTA from '@/components/guides/GuideCTA';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema';

export const metadata: Metadata = {
    title: '내열·내충격 부품용 3D 프린팅 소재 추천',
    description:
        '내열성과 내충격성이 필요한 3D 프린팅 부품에 적합한 소재를 비교합니다. ABS, PETG, Tough 레진 중심으로 추천 용도를 설명합니다.',
    alternates: { canonical: absoluteUrl('/guides/best-materials-for-heat-resistant-and-impact-resistant-parts') },
};

const options = [
    {
        title: '우선 추천: ABS',
        detail: '내열성과 내충격성이 모두 필요한 기능성 부품에서 가장 먼저 검토할 수 있는 소재입니다. 하우징, 체결 부품, 시험용 구조물에 자주 사용됩니다.',
    },
    {
        title: '균형형 선택: PETG',
        detail: 'ABS보다 출력 안정성이 좋으면서도 PLA보다 강하고 내구성이 뛰어나 범용 기능 부품에 적합합니다. 내충격성과 실사용성을 균형 있게 확보하고 싶을 때 유리합니다.',
    },
    {
        title: '정밀 기능 파트 대안: Tough 레진',
        detail: '작은 정밀 부품이나 치수 정밀도가 중요한 테스트 부품에 적합합니다. 다만 높은 열과 반복 충격이 큰 환경에서는 FDM 계열이 더 유리할 수 있습니다.',
    },
];

const faqs = [
    {
        q: '내열성과 내충격성이 모두 필요한 부품에는 어떤 소재가 가장 적합한가요?',
        a: '일반적으로 ABS를 가장 먼저 검토합니다. 조립성, 후가공성, 기능성 테스트 적합성이 좋아 내열·내충격 성능이 필요한 부품에 많이 사용됩니다.',
    },
    {
        q: 'PETG는 ABS보다 약한가요?',
        a: '항목에 따라 다릅니다. PETG는 출력 안정성과 범용 내구성 측면에서 매우 유용하며, ABS보다 다루기 쉬운 편입니다. 다만 더 높은 내열성이나 특정 기능 시험에는 ABS가 더 적합할 수 있습니다.',
    },
    {
        q: '정밀한 기능 부품은 Tough 레진으로도 가능한가요?',
        a: '작은 정밀 파트나 시제품 검토용으로는 가능합니다. 다만 지속적인 하중, 열, 반복 충격이 큰 환경이면 ABS나 PETG 같은 FDM 소재가 더 적합한 경우가 많습니다.',
    },
];

const articleSchema = buildArticleSchema({
    headline: '내열·내충격 부품용 3D 프린팅 소재 추천',
    description:
        '기능성 부품 제작에서 내열성과 내충격성이 필요할 때 ABS, PETG, Tough 레진 중 어떤 소재가 적합한지 비교하는 가이드입니다.',
    path: '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts',
});

const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '소재', path: '/materials' },
    { name: '내열·내충격 부품용 소재 추천', path: '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts' },
]);

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    url: absoluteUrl('/guides/best-materials-for-heat-resistant-and-impact-resistant-parts'),
};

export default function HeatImpactMaterialGuidePage() {
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
                        내열·내충격 부품에는
                        <br />
                        <span className="text-teal-400">어떤 소재가 좋을까요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        기능성 부품은 단순히 모양만 맞는 것으로 충분하지 않습니다. 열과 충격, 조립성, 후가공 가능성까지 함께 고려해야 하므로
                        용도에 맞는 소재 선택이 중요합니다.
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
                        <h2 className="text-2xl font-black">선택 전 체크 포인트</h2>
                        <ul className="space-y-2 text-white/75 leading-relaxed">
                            <li>지속적인 열에 노출되는 환경인지</li>
                            <li>반복 충격, 낙하, 체결이 발생하는지</li>
                            <li>정밀도보다 내구성이 더 중요한지</li>
                            <li>실사용 부품인지, 시험용 시제품인지</li>
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
                        eyebrow="Functional Parts CTA"
                        title="내열·내충격 조건을 반영해 바로 견적을 받아보세요"
                        description="열, 충격, 체결, 실사용 여부를 고려해 ABS, PETG, Tough 레진 기준으로 실제 제작 견적과 방향을 빠르게 확인할 수 있습니다."
                        secondaryHref="/materials"
                        secondaryLabel="소재 전체 보기"
                    />
                </div>
            </section>

            <Footer />
        </main>
    );
}
