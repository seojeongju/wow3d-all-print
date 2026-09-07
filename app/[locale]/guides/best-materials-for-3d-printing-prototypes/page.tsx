import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GuideCTA from '@/components/guides/GuideCTA';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema';

export const metadata: Metadata = {
    title: '시제품용 3D 프린팅 소재 추천 가이드',
    description:
        '시제품 제작 목적에 따라 PLA, PETG, ABS, Tough 레진, Standard 레진 중 어떤 3D 프린팅 소재가 적합한지 추천합니다.',
    alternates: { canonical: absoluteUrl('/guides/best-materials-for-3d-printing-prototypes') },
};

const prototypeCases = [
    {
        title: '외관 확인용 시제품',
        material: 'PLA 또는 Standard 레진',
        reason: '빠른 제작과 시각적 확인이 중요할 때 적합합니다. 형태 검토, 디자인 확인, 전시용 목업에 많이 사용됩니다.',
    },
    {
        title: '조립성 테스트용 시제품',
        material: 'ABS 또는 Tough 레진',
        reason: '끼워맞춤, 체결, 하중 검토가 필요한 경우 더 적합합니다. 기능성 검토나 구조 테스트에 유리합니다.',
    },
    {
        title: '균형형 기능 시제품',
        material: 'PETG',
        reason: 'PLA보다 강하고 ABS보다 다루기 쉬워 범용 기능 시제품에 많이 선택됩니다.',
    },
    {
        title: '투명 커버·창 구조 시제품',
        material: 'Clear 레진',
        reason: '시인성과 투명 표현이 중요할 때 적합합니다. 관찰창, 커버, 시각 확인 부품에 유리합니다.',
    },
];

const faqs = [
    {
        q: '시제품 제작에는 PLA, ABS, PETG 중 어떤 소재를 가장 많이 쓰나요?',
        a: '용도에 따라 다르지만, 일반적인 외관 시제품은 PLA, 기능성과 내구성이 필요한 시제품은 PETG 또는 ABS가 많이 사용됩니다.',
    },
    {
        q: '디자인 확인만 할 건데 꼭 강한 소재를 써야 하나요?',
        a: '아닙니다. 외관과 크기, 형태만 확인하는 목적이라면 PLA나 Standard 레진처럼 비교적 경제적이고 표면 품질이 좋은 소재가 더 효율적일 수 있습니다.',
    },
    {
        q: '조립 테스트가 필요한 시제품은 레진보다 FDM이 더 적합한가요?',
        a: '대체로 반복 체결, 하우징 테스트, 기능성 검토에는 ABS나 PETG 같은 FDM 소재가 더 적합한 경우가 많습니다. 다만 정밀 체결 검토에는 Tough 레진도 좋은 선택이 될 수 있습니다.',
    },
];

const articleSchema = buildArticleSchema({
    headline: '시제품용 3D 프린팅 소재 추천 가이드',
    description:
        '외관 확인, 조립 테스트, 기능성 검토, 투명 부품 제작 등 시제품 목적에 따라 어떤 3D 프린팅 소재가 적합한지 설명하는 가이드입니다.',
    path: '/guides/best-materials-for-3d-printing-prototypes',
});

const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '소재', path: '/materials' },
    { name: '시제품용 소재 추천 가이드', path: '/guides/best-materials-for-3d-printing-prototypes' },
]);

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    url: absoluteUrl('/guides/best-materials-for-3d-printing-prototypes'),
};

export default function PrototypeMaterialGuidePage() {
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
                        시제품 제작에는
                        <br />
                        <span className="text-teal-400">어떤 소재가 좋을까요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        시제품 목적이 외관 확인인지, 조립성 테스트인지, 기능성 검토인지에 따라 적합한 3D 프린팅 소재가 달라집니다.
                        이 가이드는 실무에서 가장 많이 비교하는 소재 선택 기준을 목적별로 정리했습니다.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    <div className="grid md:grid-cols-2 gap-6">
                        {prototypeCases.map((item) => (
                            <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">Use Case</p>
                                <h2 className="text-2xl font-black mb-3">{item.title}</h2>
                                <p className="text-white mb-3 font-bold">{item.material}</p>
                                <p className="text-white/65 leading-relaxed break-keep">{item.reason}</p>
                            </article>
                        ))}
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">시제품용 소재를 고를 때 체크할 기준</h2>
                        <ul className="space-y-2 text-white/75 leading-relaxed">
                            <li>외관 확인이 우선인지, 기능 시험이 우선인지</li>
                            <li>조립성과 체결 테스트가 필요한지</li>
                            <li>내열성, 내충격성, 투명성 같은 성능 요구가 있는지</li>
                            <li>제작 속도와 예산 중 무엇이 더 중요한지</li>
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
                        eyebrow="Prototype CTA"
                        title="시제품 목적에 맞는 소재로 바로 견적을 받아보세요"
                        description="외관 확인용인지, 조립 테스트용인지, 기능 검토용인지에 따라 적합한 소재를 적용해 바로 견적과 예상 시간을 확인할 수 있습니다."
                        trackingSource="prototypes"
                        trackingTopic="시제품용 소재 추천"
                        secondaryHref="/materials"
                        secondaryLabel="소재 전체 보기"
                    />
                </div>
            </section>

            <Footer />
        </main>
    );
}
