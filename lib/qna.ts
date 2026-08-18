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
        id: -15,
        question: '사진(이미지) 파일을 3D 모델링으로 변환할 수 있나요?',
        answer:
            '가능합니다. WOW3D에서는 JPG·PNG 제품 사진(이미지)을 올리면 AI가 입체 3D 모델(STL)로 변환하고, 바로 3D 프린팅 자동견적·출력 주문까지 이어집니다. 자동견적에서 「3D 모델이 없어요」를 선택한 뒤 정면 사진(이미지)을 업로드하면 됩니다. 우·뒤·좌 추가 사진(이미지)을 함께 올리면 형상 정확도가 올라갈 수 있습니다. 로그인 회원 기준 하루 1회(한국 시간) 이용할 수 있으며, 조립 공차·정밀 치수가 중요한 부품은 STL 또는 STEP 업로드를 권장합니다.',
        category: 'tech',
        display_order: 0,
    },
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
        question: '어떤 3D 파일 형식을 업로드할 수 있나요?',
        answer:
            'STL, OBJ, 3MF, PLY 파일은 즉시 자동견적을 지원합니다. STEP, STP 파일은 업로드 시 자동 변환 후 견적을 제공합니다. 변환이 어려운 CAD 파일은 STL 또는 3MF로 준비하시면 더 안정적입니다.',
        category: 'tech',
        display_order: 3,
    },
    {
        id: -4,
        question: '3D 프린팅 제작 기간은 보통 얼마나 걸리나요?',
        answer:
            '주문 확정 후 제작·검수·발송을 진행하며, 일반적으로 평균 3~7일 내 수령 가능합니다. 공정·수량·후가공에 따라 달라질 수 있으며, 긴급 납기나 특수 작업은 별도 상담이 필요할 수 있습니다.',
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
    {
        id: -9,
        question: '3D 파일 없이 3D 프린팅 견적을 받을 수 있나요?',
        answer:
            '가능합니다. WOW3D 자동견적에서 「3D 모델이 없어요」를 선택하고 JPG 또는 PNG 제품 사진(이미지)을 업로드하면 AI가 3D 메시(STL)를 생성한 뒤 부피·가격 자동견적으로 이어집니다. 정밀 치수·조립 공차가 중요한 부품은 STL 또는 STEP 업로드를 권장합니다.',
        category: 'quote',
        display_order: 9,
    },
    {
        id: -10,
        question: '사진(이미지) 3D 모델링은 어떤 사진(이미지)이 좋나요?',
        answer:
            '물체가 화면 중앙에 크게, 단색·밝은 배경, 한 장에 한 물체, 그림자·반사가 적은 사진(이미지)이 좋습니다. JPG 또는 PNG(최대 8MB)를 지원하며, 우·뒤·좌 추가 사진(이미지)을 올리면 형상 정확도가 올라갈 수 있습니다. 생성된 STL로 바로 자동견적·출력 주문을 진행할 수 있습니다.',
        category: 'tech',
        display_order: 10,
    },
    {
        id: -11,
        question: '사진(이미지)→AI 3D는 하루에 몇 번 사용할 수 있나요?',
        answer:
            '로그인 회원 기준 하루 1회(한국 시간)입니다. 생성에 실패한 경우에는 횟수가 차감되지 않습니다.',
        category: 'quote',
        display_order: 11,
    },
    {
        id: -12,
        question: 'AI 3D Maker와 사진(이미지)→AI 3D 견적의 차이는 무엇인가요?',
        answer:
            'AI 3D Maker는 스케치·로고 PNG의 2.5D 돌출용이고, 사진(이미지)→AI 3D 견적은 실사 사진(이미지) 기반 입체 메시 생성 후 즉시 출력 견적·주문으로 이어집니다.',
        category: 'general',
        display_order: 12,
    },
    {
        id: -13,
        question: '사진(이미지)→3D와 CAD·STL 업로드 중 무엇을 써야 하나요?',
        answer:
            '조립 공차·정밀 치수가 중요하면 STL 또는 STEP 업로드를 권장합니다. 형상 확인·시제품·피규어 아이디어 검증에는 사진(이미지) AI 3D가 적합합니다.',
        category: 'tech',
        display_order: 13,
    },
    {
        id: -14,
        question: 'AI로 만든 3D 모델로 바로 출력 주문할 수 있나요?',
        answer:
            '생성된 STL로 자동견적(소재·레이어·인필) 후 장바구니·주문까지 한 번에 진행할 수 있습니다.',
        category: 'quote',
        display_order: 14,
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

function isPhotoTo3DFaq(item: QnAItem) {
    return /사진|이미지/.test(item.question) && /3D|3d/.test(item.question);
}

/** 홈·FAQ JSON-LD 상단에 사진→3D 항목이 빠지지 않도록 고정 */
export function pickVisibleFaqItems(items: QnAItem[], limit: number): QnAItem[] {
    const photo = items.filter(isPhotoTo3DFaq);
    const rest = items.filter((item) => !isPhotoTo3DFaq(item));
    return dedupeQnas([...photo.slice(0, 2), ...rest]).slice(0, limit);
}
