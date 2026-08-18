import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { absoluteUrl } from '@/lib/site-url'
import { SERVICE_LANDINGS } from '@/lib/seo-service-pages'
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema'

export const metadata: Metadata = {
    title: '3D프린팅출력·3D프린터출력 서비스 | 출력대행·시제품·FDM·SLA',
    description:
        '3D프린팅출력, 3D프린터출력, 시제품 제작, FDM·SLA 출력, 사진(이미지)→AI 3D, 졸업작품, 소량생산, 3D 모델링 의뢰까지 WOW3D 서비스를 한곳에서 확인하세요.',
    alternates: { canonical: absoluteUrl('/services') },
    openGraph: {
        title: '3D프린팅 서비스 | WOW3D',
        description: '자동견적과 연결된 핵심 전환 서비스 페이지 모음',
        url: absoluteUrl('/services'),
    },
}

const schemas = [
    buildCollectionPageSchema({
        name: 'WOW3D 3D프린팅 서비스',
        description: '출력대행, 시제품, FDM, SLA, 사진(이미지)→AI 3D, 졸업작품, 소량생산, 모델링 등 핵심 전환 서비스',
        path: '/services',
    }),
    buildBreadcrumbSchema([
        { name: '홈', path: '/' },
        { name: '서비스', path: '/services' },
    ]),
]

export default function ServicesHubPage() {
    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />

            <section className="pt-32 pb-16 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-6xl space-y-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">Services</p>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                        핵심 전환 <span className="text-teal-400">서비스</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 break-keep leading-relaxed">
                        검색으로 들어온 고객이 바로 견적·주문으로 이어질 수 있도록,
                        키워드별 전용 랜딩을 분리했습니다.
                    </p>
                    <Link href="/quote">
                        <Button className="mt-2 h-12 px-6 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black gap-2">
                            3D프린팅 자동견적 <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-6xl grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <Link
                        href="/quote"
                        className="rounded-3xl border border-teal-400/30 bg-teal-400/10 p-6 hover:bg-teal-400/15 transition-colors"
                    >
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300 mb-2">
                            Auto Quote
                        </p>
                        <h2 className="text-xl font-black mb-2">3D프린팅 자동견적</h2>
                        <p className="text-sm text-white/65 break-keep">
                            3D프린팅 견적 · 3D프린터 출력 가격을 즉시 확인
                        </p>
                    </Link>
                    {SERVICE_LANDINGS.map((s) => (
                        <Link
                            key={s.slug}
                            href={s.path}
                            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors"
                        >
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400/80 mb-2">
                                {s.eyebrow}
                            </p>
                            <h2 className="text-xl font-black mb-2">
                                {s.h1} {s.h1Accent}
                            </h2>
                            <p className="text-sm text-white/60 break-keep leading-relaxed">
                                {s.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    )
}
