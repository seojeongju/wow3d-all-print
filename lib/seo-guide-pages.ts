export type GuideLandingConfig = {
    slug: string
    path: string
    title: string
    h1: string
    h1Accent: string
    description: string
    eyebrow: string
    sections: { title: string; body: string }[]
    faqs: { q: string; a: string }[]
    ctaHref?: string
    ctaLabel?: string
}

export const NEW_SEO_GUIDES: GuideLandingConfig[] = [
    {
        slug: 'how-to-reduce-3d-printing-cost',
        path: '/guides/how-to-reduce-3d-printing-cost',
        title: '3D프린팅 가격을 줄이는 방법',
        h1: '3D프린팅 가격을',
        h1Accent: '줄이는 방법',
        description:
            '레이어 높이, 인필, 서포트, 소재, 분할 출력을 조절해 3D프린팅 견적을 합리적으로 낮추는 방법을 정리했습니다.',
        eyebrow: 'Cost Saving',
        sections: [
            {
                title: '레이어 높이를 적절히 올리기',
                body: '초정밀이 필요하지 않다면 FDM 0.2mm 전후처럼 레이어를 조금 높여 출력 시간을 줄일 수 있습니다. 시간이 줄면 장비비가 함께 내려갑니다.',
            },
            {
                title: '인필을 용도에 맞게 낮추기',
                body: '외형 확인용 시제품은 인필 15~20%로도 충분한 경우가 많습니다. 강도가 필요한 기능 부품만 인필을 올리는 것이 효율적입니다.',
            },
            {
                title: '서포트가 덜 생기도록 방향 조정',
                body: '오버행이 많은 자세는 서포트 재료와 후처리 시간을 늘립니다. 방향을 바꿔 서포트를 줄이면 비용이 줄어듭니다.',
            },
            {
                title: '소재·공정을 목적에 맞게 선택',
                body: '시각 검증만 필요하다면 고가 엔지니어링 소재 대신 PLA나 Standard 레진으로도 충분한 경우가 많습니다.',
            },
        ],
        faqs: [
            {
                q: '가장 빠르게 가격을 낮추는 방법은?',
                a: '인필을 낮추고 레이어 높이를 올리는 것이 즉시 효과가 큽니다. 자동견적에서 옵션을 바꿔 비교해 보세요.',
            },
            {
                q: '품질을 유지하면서 비용을 줄일 수 있나요?',
                a: '외관이 중요한 면만 정밀하게, 내부·비가시 영역은 경제적으로 설정하면 균형이 맞습니다.',
            },
        ],
        ctaHref: '/quote',
        ctaLabel: '옵션 바꿔 견적 비교하기',
    },
    {
        slug: 'choosing-infill-density',
        path: '/guides/choosing-infill-density',
        title: '인필 밀도 선택 방법',
        h1: '인필 밀도',
        h1Accent: '선택 방법',
        description:
            '인필(내부 채움) 밀도가 3D프린팅 강도·무게·가격·출력 시간에 미치는 영향을 용도별로 안내합니다.',
        eyebrow: 'Infill',
        sections: [
            {
                title: '인필이란?',
                body: '모델 내부를 얼마나 채울지 정하는 비율입니다. 높을수록 재료와 시간이 늘고 강도가 올라가며, 낮을수록 가볍고 경제적입니다.',
            },
            {
                title: '용도별 권장 범위',
                body: '외형 목업 10~20%, 일반 시제품 20~40%, 기능·하중 부품 40~80%를 출발점으로 두고 테스트하세요.',
            },
            {
                title: '가격과의 관계',
                body: '인필이 올라가면 재료비와 출력 시간이 함께 증가합니다. 자동견적에서 값을 바꿔 차이를 바로 확인할 수 있습니다.',
            },
        ],
        faqs: [
            {
                q: '인필 100%가 항상 좋나요?',
                a: '아닙니다. 무게·비용·시간이 크게 늘고, 많은 용도에서는 중밀도 인필로도 충분합니다.',
            },
            {
                q: '얇은 벽만 있는 모델도 인필이 중요한가요?',
                a: '벽이 얇으면 인필 효과가 제한적일 수 있어, 벽 두께 설계가 더 중요할 수 있습니다.',
            },
        ],
        ctaHref: '/quote',
        ctaLabel: '인필별 견적 확인',
    },
    {
        slug: 'fixing-stl-file-errors',
        path: '/guides/fixing-stl-file-errors',
        title: 'STL 파일 오류 해결 방법',
        h1: 'STL 파일 오류',
        h1Accent: '해결 방법',
        description:
            '열린 메쉬, 뒤집힌 면, 비정상 교차 등 STL 오류를 점검하고 3D프린팅 전에 고치는 방법을 정리했습니다.',
        eyebrow: 'STL Repair',
        sections: [
            {
                title: '자주 발생하는 오류',
                body: '열린 구멍(non-manifold), 뒤집힌 노멀, 겹친 면, 내부 간섭, 단위 불일치(mm vs inch)가 대표적입니다.',
            },
            {
                title: '업로드 전 점검',
                body: '슬라이서나 메쉬 검사 도구로 오류를 확인하고, 가능하면 닫힌 솔리드(watertight)로 만드세요.',
            },
            {
                title: '그래도 출력이 어렵다면',
                body: '화면에서 보여도 너무 얇은 벽·서포트 불가 구조는 출력이 어려울 수 있습니다. WOW3D가 검토 후 보완을 안내할 수 있습니다.',
            },
        ],
        faqs: [
            {
                q: 'STL이 열려도 견적이 나오나요?',
                a: '분석은 가능할 수 있지만, 제작 단계에서 수정이 필요할 수 있습니다. 오류가 있으면 미리 고치는 것이 빠릅니다.',
            },
            {
                q: 'STEP 파일은 오류가 없나요?',
                a: 'CAD 원본은 정확하지만, 메쉬 변환 과정에서 해상도·면 문제가 생길 수 있어 변환 후 확인이 필요합니다.',
            },
        ],
        ctaHref: '/guides/3d-printing-file-preparation',
        ctaLabel: '파일 준비 가이드 보기',
    },
    {
        slug: 'minimum-wall-thickness',
        path: '/guides/minimum-wall-thickness',
        title: '3D프린팅 최소 벽 두께',
        h1: '최소 벽 두께',
        h1Accent: '가이드',
        description:
            'FDM·SLA별 3D프린팅 최소 벽 두께 기준과, 깨짐·미출력을 줄이기 위한 설계 팁을 안내합니다.',
        eyebrow: 'Wall Thickness',
        sections: [
            {
                title: '왜 벽 두께가 중요한가',
                body: '너무 얇으면 출력 중 무너지거나 후처리·배송 중 파손됩니다. 공정·소재마다 권장 최소값이 다릅니다.',
            },
            {
                title: '실무 출발점',
                body: 'FDM은 보통 1.0~1.5mm 이상, SLA/DLP 소형은 0.6~1.0mm 전후를 출발점으로 두고 형상에 맞게 조정하세요.',
            },
            {
                title: '얇은 핀·문자·리브',
                body: '미세한 돌기와 문자는 공정 해상도보다 작으면 뭉개집니다. 중요 디테일은 두께를 키우거나 각인 깊이를 조정하세요.',
            },
        ],
        faqs: [
            {
                q: '최소 두께만 지키면 안전한가요?',
                a: '최소값은 출발점입니다. 하중·조립·후가공이 있으면 더 두껍게 설계하는 것이 안전합니다.',
            },
            {
                q: '투명 레진도 같은가요?',
                a: 'Clear 레진은 두께에 따라 투명도가 달라질 수 있어, 시각 목적에 맞춰 두께를 조율합니다.',
            },
        ],
        ctaHref: '/quote',
        ctaLabel: '파일 올려 출력 가능성 확인',
    },
    {
        slug: 'why-support-costs',
        path: '/guides/why-support-costs',
        title: '서포트 비용이 발생하는 이유',
        h1: '서포트 비용이',
        h1Accent: '발생하는 이유',
        description:
            '3D프린팅 서포트가 왜 필요한지, 재료·시간·후처리 비용에 어떻게 반영되는지 설명합니다.',
        eyebrow: 'Support Cost',
        sections: [
            {
                title: '서포트란?',
                body: '오버행·브리지 등 공중에 떠 있는 형상을 받치는 임시 구조입니다. 출력 후 제거·마감이 필요합니다.',
            },
            {
                title: '비용이 늘어나는 요인',
                body: '서포트 재료, 추가 출력 시간, 제거 인력·후처리가 견적에 반영될 수 있습니다.',
            },
            {
                title: '비용을 줄이는 방법',
                body: '모델 방향을 바꿔 오버행을 줄이거나, 분할 출력·필렛 설계로 서포트 의존도를 낮출 수 있습니다.',
            },
        ],
        faqs: [
            {
                q: '서포트 없는 출력이 항상 가능한가요?',
                a: '형상과 공정에 따라 다릅니다. 45도 이상 오버행은 서포트가 필요한 경우가 많습니다.',
            },
            {
                q: 'SLA도 서포트가 있나요?',
                a: '네. 레진 출력도 빌드 플랫폼 부착과 오버행 지지용 서포트가 일반적입니다.',
            },
        ],
        ctaHref: '/guides/how-to-reduce-3d-printing-cost',
        ctaLabel: '가격 절감 가이드 보기',
    },
    {
        slug: '3d-printing-tolerances',
        path: '/guides/3d-printing-tolerances',
        title: '3D프린팅 공차',
        h1: '3D프린팅',
        h1Accent: '공차 가이드',
        description:
            '조립 부품을 위한 3D프린팅 공차·끼워맞춤 여유를 공정별로 이해하는 실무 가이드입니다.',
        eyebrow: 'Tolerance',
        sections: [
            {
                title: '공차가 필요한 이유',
                body: '출력물에는 수축·팽창·레이어 오차·후처리 편차가 있습니다. CAD 치수 그대로 끼우면 빡세거나 헐거울 수 있습니다.',
            },
            {
                title: '실무 여유',
                body: 'FDM 조립은 면당 0.2~0.4mm, SLA는 0.1~0.25mm 정도의 여유를 두고 테스트하는 경우가 많습니다. 소재·크기별로 시편이 안전합니다.',
            },
            {
                title: '중요 치수는 검증 출력',
                body: '핵심 결합부만 먼저 소형 시편으로 출력해 공차를 확정한 뒤 본품을 진행하면 실패 비용이 줄어듭니다.',
            },
        ],
        faqs: [
            {
                q: '금속 가공과 같은 공차가 나오나요?',
                a: '일반적으로 절삭 가공보다 여유가 필요합니다. 초정밀 결합은 후가공이나 다른 공정을 검토하세요.',
            },
            {
                q: '공차 요구가 까다로우면?',
                a: '문의 시 목표 공차와 결합 방식을 알려주시면 공정·여유 설계를 함께 검토합니다.',
            },
        ],
        ctaHref: '/services/prototype',
        ctaLabel: '시제품 제작 보기',
    },
    {
        slug: 'splitting-large-3d-prints',
        path: '/guides/splitting-large-3d-prints',
        title: '대형 출력물 분할 방법',
        h1: '대형 출력물',
        h1Accent: '분할 방법',
        description:
            '빌드 볼륨을 넘는 대형 모델을 분할·조립해 3D프린팅하는 방법과 설계 포인트를 안내합니다.',
        eyebrow: 'Large Prints',
        sections: [
            {
                title: '언제 분할이 필요한가',
                body: '장비 최대 출력 크기를 초과하거나, 방향·서포트·재료 낭비를 줄이고 싶을 때 분할이 유리합니다.',
            },
            {
                title: '분할 설계 팁',
                body: '눈에 덜 띄는 면으로 자르고, 핀·슬롯·볼트 자리 등 정렬 구조를 넣어 조립 정밀도를 높이세요.',
            },
            {
                title: '접착·조립',
                body: '소재에 맞는 접착제·나사 결합을 선택하고, 하중 경로가 분할면을 피하도록 설계하면 내구성이 좋아집니다.',
            },
        ],
        faqs: [
            {
                q: '분할하면 견적은 어떻게 되나요?',
                a: '부품별로 출력되므로 총 재료·시간이 합산됩니다. 다만 대형 단일 실패 리스크는 줄어듭니다.',
            },
            {
                q: '대형 FDM 출력도 의뢰할 수 있나요?',
                a: '네. 가능 여부와 분할 방안은 파일 업로드 또는 문의로 확인하세요.',
            },
        ],
        ctaHref: '/services/fdm',
        ctaLabel: 'FDM 출력 서비스',
    },
    {
        slug: 'graduation-project-checklist',
        path: '/guides/graduation-project-checklist',
        title: '졸업작품 출력 준비 체크리스트',
        h1: '졸업작품 출력',
        h1Accent: '체크리스트',
        description:
            '대학생·졸업작품 3D프린팅 전 확인해야 할 납기, 파일, 벽 두께, 예산, 후가공 체크리스트입니다.',
        eyebrow: 'Graduation Checklist',
        sections: [
            {
                title: '일정',
                body: '제출일 기준으로 제작·배송 여유를 두고, 가능하면 1주 이상 전에 견적·주문을 진행하세요. 평균 수령은 3~7일입니다.',
            },
            {
                title: '파일',
                body: '단위(mm), 실제 크기, 메쉬 오류, 분할 필요 여부를 확인하세요. STL·3MF가 가장 안정적입니다.',
            },
            {
                title: '설계·옵션',
                body: '최소 벽 두께, 인필, 서포트, 후가공(도장 등)을 미리 정하면 당일 변경이 줄어듭니다.',
            },
            {
                title: '예산',
                body: '자동견적으로 1차 금액을 확인한 뒤, 옵션을 조정해 예산에 맞추세요.',
            },
        ],
        faqs: [
            {
                q: '파일이 없으면 어떻게 하나요?',
                a: '3D 모델링 의뢰 또는 제품개발 문의를 통해 출력용 파일 제작을 상담할 수 있습니다.',
            },
            {
                q: '졸업작품만의 특별 팁이 있나요?',
                a: '발표용 외관이 중요하면 SLA, 구조·기능 시연이 중요하면 FDM을 우선 검토하세요.',
            },
        ],
        ctaHref: '/services/graduation',
        ctaLabel: '졸업작품 3D프린팅 서비스',
    },
]

export function getGuideBySlug(slug: string) {
    return NEW_SEO_GUIDES.find((g) => g.slug === slug)
}
