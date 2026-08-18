import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import GuideCTA from '@/components/guides/GuideCTA'
import { absoluteUrl } from '@/lib/site-url'
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/aeo-schema'
import {
    buildPhotoTo3DHowToSchema,
    MAKER_VS_PHOTO_ROWS,
    PHOTO_TO_3D_FAQS,
    PHOTO_TO_3D_GUIDE_DESCRIPTION,
    PHOTO_TO_3D_GUIDE_PATH,
    PHOTO_TO_3D_GUIDE_TITLE,
    PHOTO_TO_3D_QUOTE_PATH,
    buildPhotoTo3DShowcaseSchema,
} from '@/lib/seo-photo-to-3d'
import PhotoTo3DBeforeAfter from '@/components/seo/PhotoTo3DBeforeAfter'
import { getPhotoTo3DShowcaseItems } from '@/lib/photo-to-3d-showcase'
import { Check, X } from 'lucide-react'

export const metadata: Metadata = {
    title: PHOTO_TO_3D_GUIDE_TITLE,
    description: PHOTO_TO_3D_GUIDE_DESCRIPTION,
    keywords: [
        '사진(이미지) 3D 모델링',
        '이미지 3D 변환',
        '사진(이미지)으로 3D 프린팅',
        '3D 파일 없이 견적',
        'AI 3D 모델링',
        '제품 사진(이미지) 3D 출력',
    ],
    alternates: { canonical: absoluteUrl(PHOTO_TO_3D_GUIDE_PATH) },
    openGraph: {
        title: PHOTO_TO_3D_GUIDE_TITLE,
        description: PHOTO_TO_3D_GUIDE_DESCRIPTION,
        url: absoluteUrl(PHOTO_TO_3D_GUIDE_PATH),
        type: 'article',
    },
}

const steps = [
    {
        title: '로그인 · 사진(이미지) 업로드',
        body: '자동견적에서 「3D 모델이 없어요」를 선택합니다. 물체가 중앙에 크게 나온 JPG/PNG 정면 사진(이미지)을 올리고, 가능하면 우·뒤·좌 추가 사진(이미지)도 함께 업로드하세요.',
    },
    {
        title: 'AI 3D 모델 생성',
        body: 'AI가 사진(이미지)을 분석해 입체 3D 메시(STL)를 생성합니다. 완료되면 3D 뷰어에서 형상·치수를 확인할 수 있습니다.',
    },
    {
        title: '자동견적 · 옵션 선택',
        body: 'FDM·SLA·DLP, 소재, 레이어 높이, 인필을 선택하면 부피·시간·가격이 실시간으로 반영됩니다.',
    },
    {
        title: '주문 · 3D 프린팅 출력',
        body: '견적이 맞으면 장바구니·주문으로 이어 실제 3D 프린팅 출력을 진행합니다.',
    },
]

const goodPhoto = [
    '물체가 화면 중앙에 크게',
    '단색·밝은 배경',
    '정면 또는 살짝 사선',
    '한 장에 한 물체',
]

const badPhoto = [
    '여러 물체가 한 장에',
    '복잡한 배경·손·테이블 혼잡',
    '너무 어둡거나 흐림',
    '극단적 클로즈업·잘림',
]

const articleSchema = buildArticleSchema({
    headline: '사진(이미지)으로 3D 프린팅 견적 받는 방법',
    description: PHOTO_TO_3D_GUIDE_DESCRIPTION,
    path: PHOTO_TO_3D_GUIDE_PATH,
})

const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '가이드', path: '/guides' },
    { name: '사진(이미지)→3D 프린팅 견적', path: PHOTO_TO_3D_GUIDE_PATH },
])

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PHOTO_TO_3D_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    url: absoluteUrl(PHOTO_TO_3D_GUIDE_PATH),
}

const howToSchema = buildPhotoTo3DHowToSchema()

export default async function PhotoTo3DPrintingGuidePage() {
    const showcaseItems = await getPhotoTo3DShowcaseItems()
    const showcaseSchema = buildPhotoTo3DShowcaseSchema(showcaseItems)

    const schemas = [articleSchema, breadcrumbSchema, faqSchema, howToSchema, showcaseSchema]

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(schemas),
                }}
            />

            <section className="pt-32 pb-20 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-5xl space-y-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        Photo → AI 3D
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        사진(이미지) 한 장으로
                        <br />
                        <span className="text-teal-400">3D 프린팅 견적</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        STL·STEP 파일이 없어도 제품·피규어 사진(이미지)(JPG/PNG)만으로 AI 3D 모델링 후 자동견적·출력
                        주문까지 WOW3D에서 한 번에 진행할 수 있습니다. 형상 확인·시제품 검증용으로 적합하며,
                        정밀 치수·조립 공차가 필요한 부품은 CAD 파일 업로드를 권장합니다.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            href={PHOTO_TO_3D_QUOTE_PATH}
                            className="inline-flex items-center rounded-2xl bg-teal-400 px-6 py-3 text-sm font-black text-slate-950 hover:bg-teal-300 transition-colors"
                        >
                            사진(이미지)으로 3D 견적 시작
                        </Link>
                        <Link
                            href="/guides/3d-printing-file-preparation"
                            className="inline-flex items-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-black text-white hover:bg-white/10 transition-colors"
                        >
                            STL 파일 업로드 가이드
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-12">
                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-6">
                        <h2 className="text-2xl font-black">진행 순서</h2>
                        <ol className="space-y-4">
                            {steps.map((step, i) => (
                                <li
                                    key={step.title}
                                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-sm font-black text-teal-300">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <h3 className="text-lg font-black mb-1">{step.title}</h3>
                                        <p className="text-white/68 leading-relaxed break-keep">{step.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </article>

                    <PhotoTo3DBeforeAfter items={showcaseItems} />

                    <div className="grid md:grid-cols-2 gap-5">
                        <article className="rounded-2xl border border-teal-400/20 bg-teal-500/5 p-6 space-y-3">
                            <h2 className="text-lg font-black text-teal-200">좋은 사진(이미지) 예</h2>
                            <ul className="space-y-2">
                                {goodPhoto.map((t) => (
                                    <li key={t} className="flex items-start gap-2 text-sm text-white/75 break-keep">
                                        <Check className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </article>
                        <article className="rounded-2xl border border-red-400/20 bg-red-500/5 p-6 space-y-3">
                            <h2 className="text-lg font-black text-red-200">피해야 할 사진(이미지)</h2>
                            <ul className="space-y-2">
                                {badPhoto.map((t) => (
                                    <li key={t} className="flex items-start gap-2 text-sm text-white/75 break-keep">
                                        <X className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5 overflow-x-auto">
                        <h2 className="text-2xl font-black">AI 3D Maker vs 사진(이미지)→AI 3D 견적</h2>
                        <p className="text-white/65 text-sm break-keep leading-relaxed">
                            WOW3D에는 스케치·로고용 2.5D Maker와 실사 사진(이미지) 기반 입체 3D 견적이 별도로 있습니다.
                            목적에 맞게 선택하세요.
                        </p>
                        <table className="w-full min-w-[480px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/45">
                                    <th className="py-2 pr-4 font-black">구분</th>
                                    <th className="py-2 pr-4 font-black">AI 3D Maker</th>
                                    <th className="py-2 font-black">사진(이미지)→AI 3D 견적</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MAKER_VS_PHOTO_ROWS.map((row) => (
                                    <tr key={row.label} className="border-b border-white/5">
                                        <td className="py-3 pr-4 font-bold text-white/50">{row.label}</td>
                                        <td className="py-3 pr-4 text-white/75 break-keep">{row.maker}</td>
                                        <td className="py-3 text-teal-200/90 break-keep">{row.photo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link href="/maker" className="text-sm font-bold text-white/60 hover:text-white underline-offset-2 hover:underline">
                                AI 3D Maker 보기
                            </Link>
                            <Link href={PHOTO_TO_3D_QUOTE_PATH} className="text-sm font-bold text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline">
                                사진(이미지)→AI 3D 견적 시작
                            </Link>
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-6">
                        <h2 className="text-2xl font-black">자주 묻는 질문</h2>
                        <div className="space-y-5">
                            {PHOTO_TO_3D_FAQS.map((item) => (
                                <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                                    <h3 className="text-lg font-black text-white mb-2">{item.q}</h3>
                                    <p className="text-white/68 leading-relaxed break-keep">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </article>

                    <GuideCTA
                        eyebrow="Photo to 3D Quote"
                        title="사진(이미지)으로 3D 프린팅 견적 받기"
                        description="로그인 후 제품 사진(이미지)을 업로드하면 AI 3D 모델 생성과 자동견적이 이어집니다. 하루 1회(한국 시간) 이용 가능합니다."
                        primaryHref={PHOTO_TO_3D_QUOTE_PATH}
                        primaryLabel="사진(이미지) 업로드 · AI 3D 시작"
                        secondaryHref="/services/photo-to-3d"
                        secondaryLabel="서비스 소개 보기"
                        trackingSource="photo_to_3d"
                        trackingTopic="사진(이미지)→AI 3D 견적 가이드"
                    />
                </div>
            </section>

            <Footer />
        </main>
    )
}
