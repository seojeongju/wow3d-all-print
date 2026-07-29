import { NextResponse } from 'next/server';
import { getShowcaseCategories } from '@/lib/showcase-public';

/** 공개: /expert 카드용 카테고리 목록 */
export async function GET() {
    try {
        const items = await getShowcaseCategories();
        return NextResponse.json({ success: true, data: { items } });
    } catch (e) {
        console.error('GET /api/showcase/categories', e);
        return NextResponse.json({ error: '쇼케이스 목록 조회 실패' }, { status: 500 });
    }
}
