import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GuideCTA from '@/components/guides/GuideCTA';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema';

export const metadata: Metadata = {
    title: '정밀 모형·피규어용 3D 프린팅 소재 추천',
    description:
        '정밀 모형, 피규어, 디오라마, 캐릭터 모델 제작에 적합한 3D 프린팅 소재를 비교합니다. Standard 레진, Clear 레진, PLA의 차이도 함께 설명합니다.',
    alternates: { canonical: absoluteUrl('/guides/best-materials-for-miniatures-and-figurines') },
};

const options = [
    {
        title: '가장 일반적인 추천: Standard 레진',
        detail: '미세 디테일, 매끄러운 표면, 작은 형상 표현이 중요할 때 가장 많이 쓰입니다. 피규어, 미니어처, 디오라마, 외관용 정밀 모델에 적합합니다.',
    },
    {
        title: '특수 표현용 대안: Clear 레진',
        detail: '투명 파츠나 반투명 효과가 필요한 정밀 모형에서 유리합니다. 창, 광학 효과, 액세서리 표현처럼 시인성이 중요한 요소에 적합합니다.',
    },
    {
        title: '저예산 대형 목업 대안: PLA',
        detail: '세밀한 디테일보다는 큰 형태 확인과 전시용 목업이 목적이라면 PLA도 고려할 수 있습니다. 다만 표면 품질과 미세 조형성은 레진보다 제한적입니다.',
    },
];

const faqs = [
    {
        q: '피규어나 미니어처는 FDM보다 레진이 더 적합한가요?',
        a: '대부분 그렇습니다. 작은 디테일과 매끄러운 표면이 중요하기 때문에 Standard 레진이나 유사한 정밀 레진이 더 적합한 경우가 많습니다.',
    },
    {
        q: '도색용 피규어 출력에는 어떤 소재가 좋은가요?',
        a: '일반적으로 Standard 레진이 가장 무난합니다. 표면 정리가 쉽고 디테일 표현이 좋아 프라이머와 도색 작업으로 이어가기 좋습니다.',
    },
    {
        q: '큰 전시용 모형은 PLA로도 충분한가요?',
        a: '세밀한 조형이 핵심이 아니라면 가능합니다. 큰 부피의 형태 확인, 전시 목업, 예산 절감이 더 중요할 때 PLA가 효율적인 선택이 될 수 있습니다.',
    },
];

const articleSchema = buildArticleSchema({
    headline: '정밀 모형·피규어용 3D 프린팅 소재 추천',
    description:
        '미니어처, 피규어, 정밀 외관 모델 제작에 적합한 소재로 Standard 레진, Clear 레진, PLA를 비교하는 가이드입니다.',
    path: '/guides/best-materials-for-miniatures-and-figurines',
});

const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '소재', path: '/materials' },
    { name: '정밀 모형·피규어용 소재 추천', path: '/guides/best-materials-for-miniatures-and-figurines' },
]);

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    url: absoluteUrl('/guides/best-materials-for-miniatures-and-figurines'),
};

export default function MiniatureMaterialGuidePage() {
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
                        정밀 모형과 피규어에는
                        <br />
                        <span className="text-teal-400">어떤 소재가 좋을까요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        미니어처, 피규어, 디오라마 같은 정밀 모델은 표면 품질과 작은 디테일 표현이 핵심입니다.
                        이 가이드는 외관 중심 모델에 어떤 소재가 적합한지 목적 기준으로 정리했습니다.
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
                            <li>미세 디테일과 표면 품질이 얼마나 중요한지</li>
                            <li>도색과 후처리를 할 예정인지</li>
                            <li>투명 파츠나 특수 표현이 필요한지</li>
                            <li>소형 정밀 모델인지, 대형 전시 목업인지</li>
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
                        eyebrow="Miniature CTA"
                        title="정밀 모델과 피규어 조건으로 바로 견적을 받아보세요"
                        description="미세 디테일, 도색 예정 여부, 투명 파츠 유무까지 고려해 Standard 레진이나 대안 소재 조건으로 제작 견적을 확인할 수 있습니다."
                        secondaryHref="/materials"
                        secondaryLabel="소재 전체 보기"
                    />
                </div>
            </section>

            <Footer />
        </main>
    );
}
