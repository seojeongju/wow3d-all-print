import { getCloudflareContext } from '@opennextjs/cloudflare';

export type QnAItem = {
    id: number;
    question: string;
    answer: string;
    category: string;
    display_order?: number | null;
};

/** 공개 Q&A 목록 (서버 컴포넌트·AEO 스키마용) */
export async function getPublishedQnas(): Promise<QnAItem[]> {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return [];

        const { results } = await env.DB.prepare(
            `SELECT id, question, answer, category, display_order
             FROM qna WHERE is_published = 1
             ORDER BY display_order ASC, created_at DESC`
        ).all() as { results?: QnAItem[] };

        const unique: QnAItem[] = [];
        const seen = new Set<string>();
        for (const item of results ?? []) {
            if (!item.question || seen.has(item.question)) continue;
            seen.add(item.question);
            unique.push(item);
        }
        return unique;
    } catch (e) {
        console.warn('getPublishedQnas failed', e);
        return [];
    }
}
