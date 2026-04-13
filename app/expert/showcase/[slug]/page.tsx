import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { defaultsForSlug, isShowcaseSlug } from '@/lib/showcase';
import ShowcaseDetailClient from './ShowcaseDetailClient';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    if (!isShowcaseSlug(slug)) {
        return { title: '쇼케이스 | 와우3D' };
    }
    const d = defaultsForSlug(slug)!;
    return {
        title: `${d.defaultTitle} | 제작 예시 | 와우3D`,
        description: d.defaultDescription,
    };
}

export default async function ExpertShowcasePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    if (!isShowcaseSlug(slug)) notFound();
    return <ShowcaseDetailClient slug={slug} />;
}
