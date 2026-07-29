import { NextRequest, NextResponse } from 'next/server';
import { isShowcaseSlug } from '@/lib/showcase';
import { getShowcaseDetail } from '@/lib/showcase-public';

/** 공개: 카테고리 상세 + 공개 예시·미디어 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        if (!isShowcaseSlug(slug)) {
            return NextResponse.json({ error: '알 수 없는 카테고리' }, { status: 404 });
        }

        const data = await getShowcaseDetail(slug);
        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.error('GET /api/showcase/[slug]', e);
        return NextResponse.json({ error: '쇼케이스 조회 실패' }, { status: 500 });
    }
}
