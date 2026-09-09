import type { ShowcaseSlug } from '@/lib/showcase'

export type ShowcaseProcessStep = {
    n: string
    title: string
    desc: string
}

export type ShowcaseModeledExample = {
    stage: string
    title: string
    description: string
    features: string[]
}

const PROCESS_KO: ShowcaseProcessStep[] = [
    { n: '01', title: '요구 분석', desc: '용도·소재·수량·납기를 정의하고 제작 방향을 잡습니다.' },
    { n: '02', title: '3D 모델링', desc: 'CAD·스캔·수정 설계로 출력 가능한 모델을 완성합니다.' },
    { n: '03', title: '시제품 출력', desc: 'FDM·SLA·DLP 중 최적 공정으로 샘플을 제작합니다.' },
    { n: '04', title: '검증·양산 연계', desc: '치수·기능 검토 후 소량 생산 또는 양산 연결을 지원합니다.' },
]

const PROCESS_EN: ShowcaseProcessStep[] = [
    { n: '01', title: 'Requirements', desc: 'Define use case, material, quantity, and lead time.' },
    { n: '02', title: '3D modeling', desc: 'Finish a printable model via CAD, scan, or design revision.' },
    { n: '03', title: 'Prototype print', desc: 'Build samples with the best of FDM, SLA, or DLP.' },
    { n: '04', title: 'Validate & scale', desc: 'Check fit/function, then support small-batch or production handoff.' },
]

const EXAMPLES_KO: Record<ShowcaseSlug, ShowcaseModeledExample[]> = {
    industrial: [
        {
            stage: 'Stage 01',
            title: '지그·픽스처 요구 정의',
            description:
                '조립 라인에 맞는 클램핑 포인트와 허용 오차를 정리하고, 내구성·교체 주기를 함께 설계합니다.',
            features: ['공정 맞춤', '반복 정밀도', '현장 피드백'],
        },
        {
            stage: 'Stage 02',
            title: '엔지니어링 모델링',
            description:
                '하중·간섭을 고려한 CAD 모델링과 경량화 리브 구조로 기능 검증용 모델을 완성합니다.',
            features: ['경량화', '간섭 검토', '조립성'],
        },
        {
            stage: 'Stage 03',
            title: '고강도 시제품 출력',
            description:
                '엔지니어링 필라멘트·강화 소재로 기능 시험이 가능한 시제품을 출력합니다.',
            features: ['고강도 소재', '기능 시험', '빠른 반복'],
        },
        {
            stage: 'Stage 04',
            title: '라인 투입·개선',
            description:
                '현장 테스트 결과를 반영해 수정 출력하고, 소량 운용·양산 연계까지 지원합니다.',
            features: ['현장 검증', '설계 개선', '소량 공급'],
        },
    ],
    medical: [
        {
            stage: 'Stage 01',
            title: '의료 데이터 리뷰',
            description:
                'CT/MRI·스캔 데이터를 검토하고 수술·피팅 목적에 맞는 모델링 범위를 확정합니다.',
            features: ['데이터 검토', '맞춤 목적', '보안 취급'],
        },
        {
            stage: 'Stage 02',
            title: '해부학 기반 모델링',
            description:
                '1:1 스케일 해부 구조와 가이드 형상을 정밀 모델링해 시술·교육용으로 준비합니다.',
            features: ['1:1 스케일', '정밀 형상', '가이드 설계'],
        },
        {
            stage: 'Stage 03',
            title: '생체적합 시제품',
            description:
                '용도에 맞는 레진·소재로 고정밀 시제품을 출력하고 표면 품질을 다듬습니다.',
            features: ['고정밀', '표면 품질', '맞춤 소재'],
        },
        {
            stage: 'Stage 04',
            title: '피팅·피드백 반영',
            description:
                '착용·시술 시뮬레이션 피드백을 반영해 수정본을 빠르게 재제작합니다.',
            features: ['피팅 검증', '빠른 수정', '반복 제작'],
        },
    ],
    art: [
        {
            stage: 'Stage 01',
            title: '콘셉트·레퍼런스 정리',
            description:
                '캐릭터·작품 콘셉트와 레퍼런스를 정리하고 스케일·디테일 수준을 정의합니다.',
            features: ['콘셉트', '스케일', '디테일 목표'],
        },
        {
            stage: 'Stage 02',
            title: '고해상도 스컬프트',
            description:
                '복잡한 곡면과 미세 디테일을 살린 디지털 스컬프트·모델링을 진행합니다.',
            features: ['고해상도', '곡면 표현', '캐릭터 디테일'],
        },
        {
            stage: 'Stage 03',
            title: '정밀 출력·후가공',
            description:
                '레진 정밀 출력 후 샌딩·도장·풀컬러 등 후가공으로 완성도를 올립니다.',
            features: ['정밀 출력', '후가공', '풀컬러'],
        },
        {
            stage: 'Stage 04',
            title: '전시·양산 샘플',
            description:
                '전시·판매용 마감을 확정하고 필요 시 소량 복제·양산용 마스터를 준비합니다.',
            features: ['전시 마감', '소량 복제', '마스터 제작'],
        },
    ],
    architecture: [
        {
            stage: 'Stage 01',
            title: '스케일·도면 협의',
            description:
                '단지·제품 목업의 축척, 표현 범위, 재질감을 클라이언트와 확정합니다.',
            features: ['축척 설계', '표현 범위', '브리핑'],
        },
        {
            stage: 'Stage 02',
            title: '건축/제품 CAD 정리',
            description:
                '도면·3D 데이터를 출력용으로 정리하고 분할·조립 구조를 모델링합니다.',
            features: ['데이터 정리', '분할 조립', '정밀 스케일'],
        },
        {
            stage: 'Stage 03',
            title: '화이트 데스크 목업',
            description:
                '대형·정밀 출력으로 공간감을 확인하고 표면·엣지 품질을 다듬습니다.',
            features: ['대형 출력', '공간감', '표면 마감'],
        },
        {
            stage: 'Stage 04',
            title: '프레젠테이션 완성',
            description:
                '도장·베이스·조명 연출까지 포함해 분양·디자인 리뷰용 최종 목업을 완성합니다.',
            features: ['프레젠테이션', '도장·연출', '최종 납품'],
        },
    ],
}

const EXAMPLES_EN: Record<ShowcaseSlug, ShowcaseModeledExample[]> = {
    industrial: [
        {
            stage: 'Stage 01',
            title: 'Jig & fixture requirements',
            description:
                'Define clamping points and tolerances for the assembly line, plus durability and replacement cycles.',
            features: ['Process fit', 'Repeat accuracy', 'Shop-floor feedback'],
        },
        {
            stage: 'Stage 02',
            title: 'Engineering modeling',
            description:
                'CAD with load/interference checks and lightweight ribs for functional validation models.',
            features: ['Lightweighting', 'Interference check', 'Assemblability'],
        },
        {
            stage: 'Stage 03',
            title: 'High-strength prototype',
            description:
                'Print testable prototypes with engineering filaments and reinforced materials.',
            features: ['High-strength', 'Functional tests', 'Fast iteration'],
        },
        {
            stage: 'Stage 04',
            title: 'Line trial & improve',
            description:
                'Iterate from field tests and support small-run supply or production handoff.',
            features: ['Field validation', 'Design revise', 'Small-batch supply'],
        },
    ],
    medical: [
        {
            stage: 'Stage 01',
            title: 'Medical data review',
            description:
                'Review CT/MRI or scan data and lock the modeling scope for surgical or fitting goals.',
            features: ['Data review', 'Purpose-fit', 'Secure handling'],
        },
        {
            stage: 'Stage 02',
            title: 'Anatomy-based modeling',
            description:
                'Build 1:1 anatomical structures and guide geometry for procedure or training use.',
            features: ['1:1 scale', 'Precise form', 'Guide design'],
        },
        {
            stage: 'Stage 03',
            title: 'Biocompatible-ready sample',
            description:
                'Print high-detail samples with suitable resins and refine surface quality.',
            features: ['High precision', 'Surface quality', 'Material match'],
        },
        {
            stage: 'Stage 04',
            title: 'Fit & iterate',
            description:
                'Apply fitting or simulation feedback and quickly reprint revised versions.',
            features: ['Fit check', 'Fast revise', 'Repeat builds'],
        },
    ],
    art: [
        {
            stage: 'Stage 01',
            title: 'Concept & references',
            description:
                'Align character or artwork concept, references, scale, and detail targets.',
            features: ['Concept', 'Scale', 'Detail goals'],
        },
        {
            stage: 'Stage 02',
            title: 'High-res sculpt',
            description:
                'Digital sculpting and modeling that preserve complex curves and micro-detail.',
            features: ['High resolution', 'Curved forms', 'Character detail'],
        },
        {
            stage: 'Stage 03',
            title: 'Precision print & finish',
            description:
                'Resin printing plus sanding, paint, or full-color finishing for presentation quality.',
            features: ['Precision print', 'Finishing', 'Full color'],
        },
        {
            stage: 'Stage 04',
            title: 'Exhibit & master',
            description:
                'Lock exhibit-ready finish and prepare masters for small replication when needed.',
            features: ['Exhibit finish', 'Small replication', 'Master prep'],
        },
    ],
    architecture: [
        {
            stage: 'Stage 01',
            title: 'Scale & drawing briefing',
            description:
                'Confirm scale, scope of representation, and material feel with the client.',
            features: ['Scale plan', 'Scope', 'Briefing'],
        },
        {
            stage: 'Stage 02',
            title: 'CAD preparation',
            description:
                'Clean drawings/3D data for printing and model split/assembly strategy.',
            features: ['Data cleanup', 'Split assembly', 'Accurate scale'],
        },
        {
            stage: 'Stage 03',
            title: 'White desk mock-up',
            description:
                'Large or precise prints to validate spatial feel, then refine edges and surfaces.',
            features: ['Large format', 'Spatial feel', 'Surface finish'],
        },
        {
            stage: 'Stage 04',
            title: 'Presentation ready',
            description:
                'Paint, base, and lighting cues for sales or design-review mock-ups.',
            features: ['Presentation', 'Paint & staging', 'Final delivery'],
        },
    ],
}

export function getShowcaseProcessSteps(locale: string): ShowcaseProcessStep[] {
    return locale.startsWith('en') ? PROCESS_EN : PROCESS_KO
}

export function getShowcaseModeledExamples(
    slug: ShowcaseSlug,
    locale: string,
): ShowcaseModeledExample[] {
    const table = locale.startsWith('en') ? EXAMPLES_EN : EXAMPLES_KO
    return table[slug]
}
