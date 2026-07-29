import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GuideLandingPage from '@/components/seo/GuideLandingPage'
import { getGuideBySlug, NEW_SEO_GUIDES } from '@/lib/seo-guide-pages'
import { absoluteUrl } from '@/lib/site-url'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
    return NEW_SEO_GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const config = getGuideBySlug(slug)
    if (!config) return {}
    return {
        title: config.title,
        description: config.description,
        alternates: { canonical: absoluteUrl(config.path) },
        openGraph: {
            title: config.title,
            description: config.description,
            url: absoluteUrl(config.path),
            type: 'article',
        },
    }
}

export default async function DynamicSeoGuidePage({ params }: Props) {
    const { slug } = await params
    // 기존 고정 경로 가이드와 충돌하지 않도록 NEW_SEO_GUIDES만 처리
    const config = getGuideBySlug(slug)
    if (!config) notFound()
    return <GuideLandingPage config={config} />
}
