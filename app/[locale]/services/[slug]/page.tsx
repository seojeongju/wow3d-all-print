import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ServiceLandingPage from '@/components/seo/ServiceLandingPage'
import { getServiceBySlug, SERVICE_LANDINGS } from '@/lib/seo-service-pages'
import { absoluteUrl } from '@/lib/site-url'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
    return SERVICE_LANDINGS.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const config = getServiceBySlug(slug)
    if (!config) return {}
    return {
        title: config.title,
        description: config.description,
        keywords: config.keywords,
        alternates: { canonical: absoluteUrl(config.path) },
        openGraph: {
            title: config.title,
            description: config.description,
            url: absoluteUrl(config.path),
            type: 'website',
        },
    }
}

export default async function ServiceSlugPage({ params }: Props) {
    const { slug } = await params
    const config = getServiceBySlug(slug)
    if (!config) notFound()
    return <ServiceLandingPage config={config} />
}
