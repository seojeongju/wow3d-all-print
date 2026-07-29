import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqPageSchema } from '@/lib/aeo-schema'
import type { GuideLandingConfig } from '@/lib/seo-guide-pages'
import type { QnAItem } from '@/lib/qna'

export default function GuideLandingPage({ config }: { config: GuideLandingConfig }) {
    const faqItems: QnAItem[] = config.faqs.map((f, i) => ({
        id: i + 1,
        question: f.q,
        answer: f.a,
        category: 'guide',
    }))

    const schemas = [
        buildBreadcrumbSchema([
            { name: '홈', path: '/' },
            { name: '가이드', path: '/guides' },
            { name: config.title, path: config.path },
        ]),
        buildArticleSchema({
            headline: config.title,
            description: config.description,
            path: config.path,
        }),
        buildFaqPageSchema(faqItems, config.path),
    ]

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />

            <section className="pt-32 pb-16 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-5xl space-y-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400">
                        {config.eyebrow}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight break-keep">
                        {config.h1}
                        <br />
                        <span className="text-teal-400">{config.h1Accent}</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        {config.description}
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    <div className="grid md:grid-cols-2 gap-5">
                        {config.sections.map((s) => (
                            <article
                                key={s.title}
                                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                            >
                                <h2 className="text-xl font-black mb-3 break-keep">{s.title}</h2>
                                <p className="text-white/65 leading-relaxed break-keep">{s.body}</p>
                            </article>
                        ))}
                    </div>

                    <div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6">FAQ</h2>
                        <div className="space-y-4">
                            {config.faqs.map((f) => (
                                <article
                                    key={f.q}
                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                                >
                                    <h3 className="text-lg font-black mb-2">{f.q}</h3>
                                    <p className="text-white/65 leading-relaxed break-keep">{f.a}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link href={config.ctaHref || '/quote'}>
                            <Button className="h-12 px-6 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black gap-2">
                                {config.ctaLabel || '자동견적 시작'}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Link href="/guides">
                            <Button
                                variant="outline"
                                className="h-12 px-6 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                                가이드 모음
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
