import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absoluteUrl } from '@/lib/site-url';
import { isShowcaseSlug } from '@/lib/showcase';
import { getShowcaseDetail } from '@/lib/showcase-public';
import ShowcaseDetailClient from './ShowcaseDetailClient';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    if (!isShowcaseSlug(slug)) {
        return { title: '쇼케이스 | 와우쓰리디' };
    }
    const data = await getShowcaseDetail(slug);
    return {
        title: `${data.title} | 3D프린팅 제작 사례`,
        description: data.description,
        alternates: { canonical: absoluteUrl(`/expert/showcase/${slug}`) },
        openGraph: {
            title: `${data.title} | WOW3D 제작 사례`,
            description: data.description,
            url: absoluteUrl(`/expert/showcase/${slug}`),
        },
    };
}

export default async function ExpertShowcasePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    if (!isShowcaseSlug(slug)) notFound();
    const data = await getShowcaseDetail(slug);
    return <ShowcaseDetailClient slug={slug} initialData={data} />;
}
