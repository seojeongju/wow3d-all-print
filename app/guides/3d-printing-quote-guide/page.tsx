import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calculator, Layers, Printer, Clock } from 'lucide-react';
import { absoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
    title: '3D 프린팅 견적 계산 방식 가이드',
    description:
        '3D 프린팅 견적이 어떻게 계산되는지, FDM·SLA·DLP 방식별 가격과 출력 시간이 어떤 요소에 따라 달라지는지 설명합니다.',
    alternates: { canonical: absoluteUrl('/guides/3d-printing-quote-guide') },
    openGraph: {
        title: '3D 프린팅 견적 계산 방식 가이드',
        description:
            '3D 프린팅 견적 산출 기준, 레이어 높이, 인필, 소재, 후가공이 가격과 시간에 미치는 영향을 정리했습니다.',
        url: absoluteUrl('/guides/3d-printing-quote-guide'),
        type: 'article',
    },
};

const guideFaq = [
    {
        q: '3D 프린팅 견적은 어떤 기준으로 계산되나요?',
        a: 'WOW3D의 자동견적은 재료비, 장비 가동 시간, 레이어 높이, 인필, 서포트, 후가공 여부를 종합해 계산합니다. 출력 방식이 FDM인지 SLA/DLP인지에 따라 시간 계산식과 비용 항목이 달라집니다.',
    },
    {
        q: '레이어 높이가 낮을수록 왜 가격이 올라가나요?',
        a: '레이어 높이가 낮아질수록 같은 높이의 모델을 더 많은 층으로 쌓아야 하므로 출력 시간이 늘어납니다. 예를 들어 FDM 0.1mm는 0.2mm 대비 더 많은 레이어와 더 긴 장비 시간이 필요합니다.',
    },
    {
        q: '인필 20%와 100%의 차이는 무엇인가요?',
        a: '인필은 내부 채움 밀도를 뜻합니다. 인필이 높을수록 재료 사용량과 출력 시간이 증가해 견적이 올라갈 수 있지만, 강도와 내구성이 필요한 부품에는 더 적합할 수 있습니다.',
    },
    {
        q: 'FDM, SLA, DLP 중 어떤 방식을 선택해야 하나요?',
        a: '기능성 시제품과 내구성 부품은 FDM, 표면 품질과 디테일이 중요한 모델은 SLA 또는 DLP가 적합합니다. 동일한 형상이라도 목적에 따라 최적의 출력 방식이 달라집니다.',
    },
    {
        q: '자동견적 금액과 실제 제작 금액이 달라질 수 있나요?',
        a: '대부분의 일반적인 모델은 자동견적으로 빠르게 확인할 수 있지만, 복잡한 형상, 특수 소재, 후가공 요구, 파일 오류 여부에 따라 관리자가 추가 검토 후 수정견적을 안내할 수 있습니다.',
    },
];

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guideFaq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
        },
    })),
    url: absoluteUrl('/guides/3d-printing-quote-guide'),
};

const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '3D 프린팅 견적 계산 방식 가이드',
    description:
        '3D 프린팅 자동견적에서 레이어 높이, 인필, 소재, 후가공이 가격과 출력 시간에 어떤 영향을 주는지 설명하는 가이드입니다.',
    author: {
        '@type': 'Organization',
        name: '(주)와우쓰리디',
    },
    publisher: {
        '@type': 'Organization',
        name: '(주)와우쓰리디',
    },
    mainEntityOfPage: absoluteUrl('/guides/3d-printing-quote-guide'),
};

export default function QuoteGuidePage() {
    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([faqSchema, articleSchema]) }}
            />

            <section className="pt-32 pb-20 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="max-w-3xl space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/10 border border-teal-400/20 px-4 py-2 text-[11px] font-black tracking-[0.25em] uppercase text-teal-300">
                            <Calculator className="w-4 h-4" /> Pricing Guide
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                            3D 프린팅 견적은
                            <br />
                            <span className="text-teal-400">어떻게 계산되나요?</span>
                        </h1>
                        <p className="text-lg text-white/70 leading-relaxed break-keep">
                            WOW3D의 3D 프린팅 자동견적은 재료비, 출력 시간, 레이어 높이, 내부 채움 밀도,
                            서포트, 후가공 여부를 종합해 계산합니다. 이 페이지는 고객이 실제로 많이 묻는
                            질문에 맞춰 3D 프린팅 가격과 제작 시간을 이해하기 쉽게 설명합니다.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-12">
                    <div className="grid md:grid-cols-3 gap-6">
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <Printer className="w-8 h-8 text-teal-400 mb-4" />
                            <h2 className="text-xl font-black mb-3">출력 방식</h2>
                            <p className="text-white/65 leading-relaxed">
                                FDM, SLA, DLP 방식마다 장비 시간과 재료 단가가 다르므로 같은 모델도 견적이 달라집니다.
                            </p>
                        </article>
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <Layers className="w-8 h-8 text-teal-400 mb-4" />
                            <h2 className="text-xl font-black mb-3">레이어·인필</h2>
                            <p className="text-white/65 leading-relaxed">
                                더 정밀한 레이어 높이와 높은 인필은 재료 사용량과 출력 시간을 늘려 가격에 영향을 줍니다.
                            </p>
                        </article>
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <Clock className="w-8 h-8 text-teal-400 mb-4" />
                            <h2 className="text-xl font-black mb-3">출력 시간</h2>
                            <p className="text-white/65 leading-relaxed">
                                장비 가동 시간은 자동견적의 핵심 요소이며, 레이어 높이와 모델 형상에 따라 크게 달라질 수 있습니다.
                            </p>
                        </article>
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">WOW3D 자동견적의 핵심 기준</h2>
                        <p className="text-white/70 leading-relaxed break-keep">
                            3D 프린팅 비용은 단순히 모델 크기만으로 정해지지 않습니다. WOW3D는 파일을 업로드하면
                            부피, 표면적, 치수, 출력 방식, 레이어 높이, 인필, 후가공 여부를 반영해 실시간으로 견적을 계산합니다.
                        </p>
                        <ul className="space-y-2 text-white/75 leading-relaxed">
                            <li>재료비: 필라멘트 또는 레진 사용량에 비례</li>
                            <li>장비비: 출력 시간과 출력 방식별 시간당 비용 반영</li>
                            <li>옵션비: 서포트, 후가공, 특수 요구사항 반영</li>
                            <li>검토 보정: 복잡 형상, 특수 소재, 납기 조건에 따른 관리자 확인</li>
                        </ul>
                    </article>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">레이어 높이와 출력 시간의 관계</h2>
                        <p className="text-white/70 leading-relaxed break-keep">
                            레이어 높이가 작을수록 더 많은 층을 쌓아야 하므로 출력 시간이 증가합니다.
                            예를 들어 FDM 0.1mm는 0.2mm보다 더 많은 레이어와 더 긴 장비 시간이 필요하며,
                            표면 표현은 좋아지지만 견적은 높아질 수 있습니다.
                        </p>
                        <div className="rounded-2xl bg-black/20 border border-white/10 p-5 text-sm text-white/70">
                            0.1mm: 정밀도 우선 / 0.2mm: 표준 / 0.3mm: 속도 우선
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-6">
                        <h2 className="text-2xl font-black">자주 묻는 질문</h2>
                        <div className="space-y-5">
                            {guideFaq.map((item) => (
                                <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                                    <h3 className="text-lg font-black text-white mb-2">{item.q}</h3>
                                    <p className="text-white/68 leading-relaxed break-keep">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </article>

                    <div className="rounded-[2rem] border border-teal-400/20 bg-teal-400/5 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black">바로 자동견적 받아보기</h2>
                            <p className="text-white/70 break-keep">
                                STL, OBJ, 3MF 파일을 업로드하고 FDM / SLA / DLP 옵션을 바꿔 실제 견적을 확인해 보세요.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/quote">
                                <Button className="h-12 px-6 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                                    견적 받기 <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                            <Link href="/print-methods">
                                <Button variant="outline" className="h-12 px-6 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                                    방식 비교 보기
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
