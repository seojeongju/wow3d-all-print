import { getCloudflareContext } from '@opennextjs/cloudflare';

export type QnAItem = {
    id: number;
    question: string;
    answer: string;
    category: string;
    display_order?: number | null;
};

export const CURATED_AEO_QNAS: QnAItem[] = [
    {
        id: -1,
        question: '3D 프린팅 견적은 어떤 기준으로 계산되나요?',
        answer:
            'WOW3D의 3D 프린팅 견적은 파일의 부피, 표면적, 크기, 출력 방식(FDM·SLA·DLP), 레이어 높이, 인필, 소재, 후가공 여부를 종합해 계산합니다. 복잡한 형상이나 특수 소재는 관리자 검토 후 수정견적으로 안내될 수 있습니다.',
        category: 'quote',
        display_order: 1,
    },
    {
        id: -2,
        question: 'FDM, SLA, DLP 중 어떤 3D 프린팅 방식을 선택해야 하나요?',
        answer:
            '기능성 시제품, 조립 테스트, 내구성 중심 부품은 일반적으로 FDM이 적합합니다. 표면 품질과 디테일이 중요한 외관 시제품이나 정밀 모델은 SLA 또는 DLP가 더 적합할 수 있습니다.',
        category: 'general',
        display_order: 2,
    },
    {
        id: -3,
        question: 'STL, OBJ, 3MF 파일만 업로드할 수 있나요?',
        answer:
            '자동견적과 즉시 분석은 STL, OBJ, 3MF 같은 메쉬 기반 파일에서 가장 안정적으로 동작합니다. 프로젝트에 따라 다른 형식도 검토할 수 있지만, 가능하면 STL 또는 3MF로 준비하면 견적과 제작 검토가 더 빠릅니다.',
        category: 'tech',
        display_order: 3,
    },
    {
        id: -4,
        question: '3D 프린팅 제작 기간은 보통 얼마나 걸리나요?',
        answer:
            '제작 기간은 출력 시간만이 아니라 파일 검토, 후처리, 검수, 배송까지 함께 고려해야 합니다. 일반적인 주문은 공정과 수량, 후가공 여부에 따라 달라지며, 긴급 납기나 특수 작업은 별도 상담이 필요할 수 있습니다.',
        category: 'quote',
        display_order: 4,
    },
    {
        id: -5,
        question: '레이어 높이가 낮을수록 왜 가격과 시간이 올라가나요?',
        answer:
            '레이어 높이가 낮아질수록 같은 높이의 모델을 더 많은 층으로 출력해야 하므로 장비 가동 시간이 늘어납니다. 예를 들어 FDM 0.1mm는 0.2mm보다 더 정밀하지만 출력 시간이 더 길어지고 견적도 높아질 수 있습니다.',
        category: 'quote',
        display_order: 5,
    },
    {
        id: -6,
        question: '3D 프린팅 전에 파일에서 무엇을 확인해야 하나요?',
        answer:
            '파일 단위(mm), 실제 크기, 벽 두께, 메쉬 오류, 뒤집힌 면, 열린 형상 여부를 먼저 확인하는 것이 좋습니다. 조립 부품이라면 공차와 끼워맞춤 여유도 함께 검토해야 실제 제작 문제가 줄어듭니다.',
        category: 'tech',
        display_order: 6,
    },
    {
        id: -7,
        question: '자동견적 금액과 실제 제작 금액이 달라질 수 있나요?',
        answer:
            '대부분의 일반적인 작업은 자동견적으로 빠르게 확인할 수 있지만, 형상이 매우 복잡하거나 특수 소재, 후가공, 납기 조건이 있는 경우에는 관리자 검토 후 실제 제작 금액이 조정될 수 있습니다.',
        category: 'quote',
        display_order: 7,
    },
    {
        id: -8,
        question: '파일이 열리는데도 출력이 어려운 경우가 있나요?',
        answer:
            '있습니다. 화면에서 모델이 보여도 너무 얇은 벽, 닫히지 않은 메쉬, 비정상 면, 내부 간섭, 서포트가 어려운 구조 등으로 실제 출력이 어려울 수 있습니다. 이런 경우 WOW3D가 파일 검토 후 보완 방향을 안내할 수 있습니다.',
        category: 'tech',
        display_order: 8,
    },
];

function dedupeQnas(items: QnAItem[]) {
    const unique: QnAItem[] = [];
    const seen = new Set<string>();
    for (const item of items) {
        if (!item.question || seen.has(item.question)) continue;
        seen.add(item.question);
        unique.push(item);
    }
    return unique;
}

/** 공개 Q&A 목록 (서버 컴포넌트·AEO 스키마용) */
export async function getPublishedQnas(): Promise<QnAItem[]> {
    try {
        const { env } = await getCloudflareContext({ async: true });
        if (!env?.DB) return CURATED_AEO_QNAS;

        const { results } = await env.DB.prepare(
            `SELECT id, question, answer, category, display_order
             FROM qna WHERE is_published = 1
             ORDER BY display_order ASC, created_at DESC`
        ).all() as { results?: QnAItem[] };
        return dedupeQnas([...(results ?? []), ...CURATED_AEO_QNAS]);
    } catch (e) {
        console.warn('getPublishedQnas failed', e);
        return CURATED_AEO_QNAS;
    }
}
