import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { absoluteUrl } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema';
import { NEW_SEO_GUIDES } from '@/lib/seo-guide-pages';

export const metadata: Metadata = {
    title: '3D 프린팅 가이드 모음',
    description:
        '3D 프린팅 견적 계산, 가격 절감, FDM·SLA 비교, 인필, STL 오류, 벽 두께, 서포트, 공차, 대형 분할, 졸업작품 체크리스트까지 WOW3D 가이드.',
    alternates: { canonical: absoluteUrl('/guides') },
};

const guideSections = [
    {
        title: '기본 가이드',
        items: [
            { href: '/guides/photo-to-3d-printing-quote', title: '사진으로 3D 프린팅 견적', desc: '3D 파일 없이 사진→AI 3D→자동견적·주문 절차' },
            { href: '/guides/3d-printing-quote-guide', title: '3D프린팅 비용 계산 방법', desc: '견적 산출 기준과 가격·시간에 영향을 주는 요소' },
            { href: '/guides/how-to-reduce-3d-printing-cost', title: '3D프린팅 가격을 줄이는 방법', desc: '레이어·인필·서포트·소재로 비용 절감' },
            { href: '/guides/fdm-vs-sla-vs-dlp', title: 'FDM과 SLA 차이', desc: 'FDM vs SLA vs DLP 출력 방식 비교' },
            { href: '/guides/pla-vs-abs-vs-petg', title: 'PLA와 PETG 차이', desc: 'FDM 주요 필라멘트 비교' },
            { href: '/guides/3d-printing-file-preparation', title: '파일 준비 가이드', desc: '업로드 전 형식, 단위, 메쉬 오류 점검' },
            { href: '/guides/3d-printing-turnaround-time', title: '시제품 제작 기간', desc: '출력·후처리·검수·배송 납기 안내' },
        ],
    },
    {
        title: '실무 체크',
        items: NEW_SEO_GUIDES.filter((g) =>
            [
                'choosing-infill-density',
                'fixing-stl-file-errors',
                'minimum-wall-thickness',
                'why-support-costs',
                '3d-printing-tolerances',
                'splitting-large-3d-prints',
                'graduation-project-checklist',
            ].includes(g.slug)
        ).map((g) => ({
            href: g.path,
            title: g.title,
            desc: g.description,
        })),
    },
    {
        title: '소재 비교',
        items: [
            { href: '/guides/pla-vs-abs-vs-petg', title: 'PLA vs ABS vs PETG', desc: 'FDM 주요 필라멘트 비교' },
            { href: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin', title: 'Standard vs Tough vs Clear vs Flexible', desc: 'SLA·DLP 주요 레진 비교' },
        ],
    },
    {
        title: '용도별 소재 추천',
        items: [
            { href: '/guides/best-materials-for-3d-printing-prototypes', title: '시제품용 소재 추천', desc: '외관 확인, 기능 검토, 조립 테스트 기준 추천' },
            { href: '/guides/best-materials-for-transparent-3d-printed-parts', title: '투명 부품용 소재 추천', desc: '투명 커버, 관찰창, 시인성 부품 기준 추천' },
            { href: '/guides/best-materials-for-3d-printed-housings-and-cases', title: '하우징·케이스용 소재 추천', desc: '전자기기 하우징, 보호 케이스, 외장 커버 기준 추천' },
            { href: '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts', title: '내열·내충격 부품용 소재 추천', desc: '기능성 부품과 열·충격 환경 기준 추천' },
            { href: '/guides/best-materials-for-miniatures-and-figurines', title: '정밀 모형·피규어용 소재 추천', desc: '미니어처, 피규어, 디오라마용 정밀 소재 추천' },
        ],
    },
];

const schemas = [
    buildCollectionPageSchema({
        name: '3D 프린팅 가이드 모음',
        description:
            '견적 계산, 출력 방식 비교, 파일 준비, 납기, 소재 비교, 용도별 소재 추천 등 WOW3D의 3D 프린팅 가이드 인덱스 페이지입니다.',
        path: '/guides',
    }),
    buildArticleSchema({
        headline: '3D 프린팅 가이드 모음',
        description:
            '3D 프린팅 견적과 제작 준비, 소재 선택, 출력 방식 비교에 필요한 핵심 정보를 한곳에 모은 가이드 허브입니다.',
        path: '/guides',
    }),
    buildBreadcrumbSchema([
        { name: '홈', path: '/' },
        { name: '가이드', path: '/guides' },
    ]),
];

export default function GuidesIndexPage() {
    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />

            <section className="pt-32 pb-20 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-6xl space-y-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        Guide Hub
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        WOW3D 3D 프린팅
                        <br />
                        <span className="text-teal-400">가이드 모음</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        견적 계산 방식, 출력 공정 비교, 파일 준비, 납기, 소재 비교, 용도별 소재 추천까지
                        3D 프린팅 고객이 자주 찾는 핵심 정보를 한곳에서 확인할 수 있도록 정리했습니다.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-6xl space-y-12">
                    {guideSections.map((section) => (
                        <div key={section.title} className="space-y-5">
                            <h2 className="text-2xl md:text-3xl font-black">{section.title}</h2>
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {section.items.map((item) => (
                                    <Link key={item.href} href={item.href} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
                                        <h3 className="text-xl font-black mb-3">{item.title}</h3>
                                        <p className="text-sm text-white/60 break-keep leading-relaxed">{item.desc}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-3">
                        <Link href="/quote">
                            <Button className="rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                                자동견적 시작 <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                        <Link href="/materials">
                            <Button variant="outline" className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                                소재 전체 보기
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
