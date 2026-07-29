import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileCheck, FolderOpen, Wrench } from 'lucide-react';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema';

export const metadata: Metadata = {
    title: '3D 프린팅 파일 준비 가이드',
    description:
        'STL, OBJ, 3MF, STEP 등 3D 프린팅 업로드 전 확인해야 할 파일 형식, 크기, 두께, 메쉬 오류, 방향, 공차 체크 포인트를 정리했습니다.',
    alternates: { canonical: absoluteUrl('/guides/3d-printing-file-preparation') },
};

const faqItems = [
    {
        q: '3D 프린팅 견적용으로 어떤 파일 형식이 가장 좋나요?',
        a: 'STL, OBJ, 3MF, PLY 파일은 즉시 자동견적을 지원합니다. STEP, STP는 업로드 시 자동 변환 후 견적을 제공합니다. 형상만 필요하면 STL이 가장 보편적이며, 색상·메타데이터가 필요하면 OBJ 또는 3MF가 유리할 수 있습니다.',
    },
    {
        q: '파일이 열리는데도 출력이 안 되는 이유는 무엇인가요?',
        a: '메쉬가 닫혀 있지 않거나 면이 뒤집혀 있거나, 너무 얇은 벽 두께 때문에 실제 출력이 어려운 경우가 많습니다. 육안으로 보여도 출력 가능성은 별도 검토가 필요합니다.',
    },
    {
        q: 'STEP 파일도 업로드할 수 있나요?',
        a: '가능합니다. STEP·STP 파일은 업로드 시 자동 변환 후 견적을 제공합니다. 변환이 어렵거나 형상이 복잡한 경우 STL 또는 3MF로 함께 준비하시면 더 안정적입니다.',
    },
];

const articleSchema = buildArticleSchema({
    headline: '3D 프린팅 파일 준비 가이드',
    description:
        '3D 프린팅 자동견적 전에 파일 형식, 두께, 메쉬 오류, 방향, 수량 단위를 어떻게 준비해야 하는지 설명하는 가이드입니다.',
    path: '/guides/3d-printing-file-preparation',
});

const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '가이드', path: '/guides/3d-printing-quote-guide' },
    { name: '3D 프린팅 파일 준비 가이드', path: '/guides/3d-printing-file-preparation' },
]);

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
        },
    })),
    url: absoluteUrl('/guides/3d-printing-file-preparation'),
};

const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '3D 프린팅 업로드 전 파일 준비 방법',
    description: '3D 프린팅 자동견적과 제작 검토를 위해 파일을 준비하는 기본 절차입니다.',
    step: [
        { '@type': 'HowToStep', position: 1, name: '파일 형식 확인', text: 'STL, OBJ, 3MF처럼 메쉬 기반 형식인지 확인합니다.' },
        { '@type': 'HowToStep', position: 2, name: '치수와 단위 확인', text: 'mm 단위와 실제 제작 크기가 의도한 값인지 확인합니다.' },
        { '@type': 'HowToStep', position: 3, name: '두께와 메쉬 오류 검토', text: '얇은 벽, 구멍, 뒤집힌 노멀, 비정상 면 등을 수정합니다.' },
        { '@type': 'HowToStep', position: 4, name: '출력 목적 메모', text: '외관용인지 기능성 부품인지, 후가공이 필요한지 함께 전달합니다.' },
    ],
};

export default function FilePreparationGuidePage() {
    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([articleSchema, breadcrumbSchema, faqSchema, howToSchema]) }}
            />

            <section className="pt-32 pb-20 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-5xl space-y-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        File Guide
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        3D 프린팅 전
                        <br />
                        <span className="text-teal-400">파일은 어떻게 준비하나요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        자동견적이 잘 나오고 실제 제작 검토까지 빠르게 이어지려면 업로드 전 파일 상태가 중요합니다.
                        이 페이지는 STL, OBJ, 3MF, STEP 파일을 준비할 때 가장 많이 놓치는 포인트를 정리한 가이드입니다.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-12">
                    <div className="grid md:grid-cols-3 gap-6">
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <FileCheck className="w-8 h-8 text-teal-400 mb-4" />
                            <h2 className="text-xl font-black mb-3">파일 형식</h2>
                            <p className="text-white/65 leading-relaxed break-keep">STL, OBJ, 3MF가 가장 일반적이며 자동 분석 안정성도 좋습니다.</p>
                        </article>
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <Wrench className="w-8 h-8 text-teal-400 mb-4" />
                            <h2 className="text-xl font-black mb-3">두께·메쉬</h2>
                            <p className="text-white/65 leading-relaxed break-keep">너무 얇은 벽, 열린 메쉬, 뒤집힌 노멀은 출력 실패 원인이 될 수 있습니다.</p>
                        </article>
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <FolderOpen className="w-8 h-8 text-teal-400 mb-4" />
                            <h2 className="text-xl font-black mb-3">제작 목적</h2>
                            <p className="text-white/65 leading-relaxed break-keep">외관 확인용인지 기능 부품인지 알려주면 공정 선택과 납기 안내가 더 정확해집니다.</p>
                        </article>
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">업로드 전 체크리스트</h2>
                        <ul className="space-y-2 text-white/75 leading-relaxed">
                            <li>파일 단위가 mm 기준인지 확인</li>
                            <li>실제 원하는 최종 크기와 치수가 맞는지 확인</li>
                            <li>벽 두께가 너무 얇지 않은지 확인</li>
                            <li>메쉬가 닫혀 있고 비정상 면이 없는지 확인</li>
                            <li>조립 부품이라면 공차와 끼워맞춤 여유를 고려</li>
                            <li>후가공, 도색, 표면 품질 요구사항을 함께 전달</li>
                        </ul>
                    </article>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
                        <h2 className="text-2xl font-black">자주 묻는 질문</h2>
                        <div className="space-y-5">
                            {faqItems.map((item) => (
                                <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                                    <h3 className="text-lg font-black text-white mb-2">{item.q}</h3>
                                    <p className="text-white/68 leading-relaxed break-keep">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </article>

                    <div className="rounded-[2rem] border border-teal-400/20 bg-teal-400/5 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black">파일 준비가 끝났다면 바로 견적 확인</h2>
                            <p className="text-white/70 break-keep">
                                업로드 후 출력 방식과 소재를 바꿔 보면서 예상 시간과 가격을 실시간으로 비교해 볼 수 있습니다.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/quote">
                                <Button className="h-12 px-6 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                                    견적 받기 <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                            <Link href="/guides/fdm-vs-sla-vs-dlp">
                                <Button variant="outline" className="h-12 px-6 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                                    공정 비교 보기
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
