'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import {
    ArrowRight,
    Camera,
    Gift,
    MessageSquare,
    Sparkles,
    Zap,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
    getAllCustomProducts,
    getProductMainImage,
    type CustomProductDef,
} from '@/lib/custom-products'

function methodLabel(method: CustomProductDef['method'], t: ReturnType<typeof useTranslations<'CustomProducts'>>) {
    if (method === 'mixed') return t('methodMixed')
    return t(`method.${method}` as 'method.fdm')
}

export default function CustomHubClient() {
    const t = useTranslations('CustomProducts')
    const products = getAllCustomProducts()

    return (
        <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col relative overflow-hidden">
            <Header />

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05]" />
                <div className="absolute top-[12%] right-[8%] w-[36%] h-[36%] bg-teal-500/10 rounded-full blur-[120px]" />
            </div>

            <section className="relative z-10 pt-36 md:pt-44 pb-10 md:pb-14 px-6">
                <div className="container mx-auto max-w-6xl text-center space-y-5 md:space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-400/15 border border-teal-400/30 text-teal-300 text-[11px] font-black uppercase tracking-[0.25em]">
                        <Gift className="w-3.5 h-3.5" />
                        {t('hubEyebrow')}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
                        {t('hubTitle')}{' '}
                        <span className="text-teal-400">{t('hubTitleAccent')}</span>
                    </h1>
                    <p className="text-white/50 text-base md:text-lg font-bold max-w-2xl mx-auto break-keep leading-relaxed">
                        {t('hubSubtitle')}
                    </p>
                </div>
            </section>

            <section className="relative z-10 pb-16 md:pb-24 px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {products.map((product, idx) => (
                            <ProductCard key={product.slug} product={product} index={idx} t={t} />
                        ))}
                    </div>

                    <div className="mt-12 md:mt-16 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                        <div className="flex-1 space-y-2">
                            <h2 className="text-xl md:text-2xl font-black text-white">{t('hubCtaTitle')}</h2>
                            <p className="text-sm font-bold text-white/45 break-keep">{t('hubCtaDesc')}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            <Link href="/quote">
                                <Button className="h-12 px-6 rounded-xl bg-teal-400 text-slate-950 font-black gap-2 w-full sm:w-auto">
                                    <Zap className="w-4 h-4" />
                                    {t('ctaQuote')}
                                </Button>
                            </Link>
                            <Link href="/expert#inquiry">
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 rounded-xl border-white/15 bg-white/5 text-white font-black gap-2 w-full sm:w-auto"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    {t('ctaInquiry')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}

function ProductCard({
    product,
    index,
    t,
}: {
    product: CustomProductDef
    index: number
    t: ReturnType<typeof useTranslations<'CustomProducts'>>
}) {
    const title = t(`products.${product.slug}.title`)
    const summary = t(`products.${product.slug}.summary`)
    const priceNote = t(`products.${product.slug}.priceNote`)
    const mainImage = getProductMainImage(product)

    return (
        <Link href={`/custom/${product.slug}`} className="block group h-full">
            <motion.article
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="h-full rounded-2xl border border-white/10 bg-[#121826]/80 overflow-hidden hover:border-teal-400/40 hover:bg-[#121826] transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
                <div className="relative aspect-square overflow-hidden bg-black/30">
                    <img
                        src={mainImage}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            ;(e.target as HTMLImageElement).src = '/placeholder-3d.svg'
                        }}
                    />
                    <span className="absolute top-3 left-3 rounded-md border border-teal-400/30 bg-black/55 backdrop-blur px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-300">
                        {methodLabel(product.method, t)}
                    </span>
                </div>
                <div className="p-4 md:p-5 flex flex-col flex-1 gap-3">
                    <h2 className="text-[15px] md:text-base font-black text-white group-hover:text-teal-300 transition-colors break-keep leading-snug line-clamp-2">
                        {title}
                    </h2>
                    <p className="text-[12px] font-bold text-white/45 leading-relaxed break-keep line-clamp-2">
                        {summary}
                    </p>
                    <p className="mt-auto text-sm font-black text-teal-300 break-keep">{priceNote}</p>
                    <div className="flex items-center gap-1.5 text-[12px] font-black text-white/50">
                        {product.primaryCta === 'photo' ? (
                            <Camera className="w-3.5 h-3.5 text-teal-400" />
                        ) : (
                            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                        )}
                        {t('viewDetail')}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </motion.article>
        </Link>
    )
}
