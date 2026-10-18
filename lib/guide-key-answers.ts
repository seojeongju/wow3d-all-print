/**
 * 가이드 "핵심 답변" (AEO — 결론 먼저).
 * 페이지 상단에 질문에 대한 답을 2~3문장으로 먼저 보여 줘 검색 스니펫·AI 답변이 그대로 인용하기 쉽게 한다.
 * 수치는 각 가이드 본문·FAQ(lib/seo-guide-pages*.ts)에 이미 있는 값만 사용한다 — 본문 수치를 바꾸면 여기도 함께 수정.
 */
export type GuideKeyAnswer = { ko: string; en: string }

export const GUIDE_KEY_ANSWERS: Record<string, GuideKeyAnswer> = {
    'how-to-reduce-3d-printing-cost': {
        ko: '3D프린팅 가격을 가장 빨리 낮추는 방법은 인필을 낮추고 레이어 높이를 올리는 것입니다. 외형 확인용이면 인필 15~20%, FDM 레이어 0.2mm 전후로도 충분한 경우가 많고, 서포트가 덜 생기는 방향으로 놓고 PLA·Standard 레진처럼 목적에 맞는 소재를 고르면 비용이 더 줄어듭니다.',
        en: 'The fastest way to lower a 3D printing price is to reduce infill and raise the layer height. For visual prototypes, 15–20% infill and an FDM layer height around 0.2 mm are often enough; orienting the part to need less support and choosing a fit-for-purpose material such as PLA or Standard resin cuts cost further.',
    },
    'choosing-infill-density': {
        ko: '인필은 외형 목업 10~20%, 일반 시제품 20~40%, 기능·하중 부품 40~80%를 출발점으로 잡으세요. 인필이 높을수록 강도는 올라가지만 재료비와 출력 시간이 함께 늘어나며, 100%가 항상 좋은 것은 아닙니다.',
        en: 'Start with 10–20% infill for visual mock-ups, 20–40% for general prototypes and 40–80% for functional or load-bearing parts. Higher infill adds strength but also material cost and print time, and 100% is rarely necessary.',
    },
    'fixing-stl-file-errors': {
        ko: 'STL 오류(열린 구멍, 뒤집힌 면, 겹친 면, 단위 불일치)는 출력 전에 점검해 닫힌 솔리드로 만들어야 합니다. 와우쓰리디 무료 STL 점검기나 자동견적에 올리면 구멍 메우기·틈 이어붙이기·면 방향 통일을 자동으로 처리하고, 자동으로 고칠 수 없는 오류는 담당자가 검토합니다.',
        en: 'STL errors — open holes, flipped normals, overlapping faces and unit mismatches — should be fixed before printing so the model is a closed (watertight) solid. Upload to WOW3D’s free STL checker or instant quote and holes, gaps and face orientation are repaired automatically; errors that can’t be fixed automatically are reviewed by our team.',
    },
    'minimum-wall-thickness': {
        ko: '3D프린팅 최소 벽 두께는 FDM 1.0~1.5mm 이상, SLA·DLP 소형 부품 0.6~1.0mm 전후가 출발점입니다. 와우쓰리디 자동견적은 FDM 1mm·SLA/DLP 0.6mm보다 얇은 부분이 많으면 경고하고 위치를 표시하며, 하중·조립이 있는 부품은 더 두껍게 설계하는 것이 안전합니다.',
        en: 'A safe starting point for minimum wall thickness is 1.0–1.5 mm or more for FDM and about 0.6–1.0 mm for small SLA/DLP parts. WOW3D’s instant quote warns and highlights areas thinner than 1 mm (FDM) or 0.6 mm (SLA/DLP); parts under load or assembly should be designed thicker.',
    },
    'why-support-costs': {
        ko: '서포트는 공중에 떠 있는 오버행·브리지를 받치는 임시 구조로, 서포트 재료·추가 출력 시간·제거와 후처리 작업이 견적에 반영됩니다. 45도 이상 오버행에는 서포트가 필요한 경우가 많으며, 모델 방향을 바꾸거나 분할 출력·필렛 설계로 서포트를 줄이면 비용을 낮출 수 있습니다.',
        en: 'Supports are temporary structures that hold up overhangs and bridges, so their material, extra print time and removal/finishing work are included in the quote. Overhangs beyond 45 degrees usually need support; reorienting the model, splitting it or adding fillets reduces support and cost.',
    },
    '3d-printing-tolerances': {
        ko: '3D프린팅 조립 부품은 CAD 치수 그대로가 아니라 여유를 두고 설계해야 합니다. FDM은 면당 0.2~0.4mm, SLA는 0.1~0.25mm 정도에서 시작해 테스트하는 경우가 많고, 핵심 결합부는 작은 시편으로 먼저 출력해 공차를 확정하는 것이 안전합니다.',
        en: 'Parts that fit together need clearance rather than exact CAD dimensions. A common starting point is 0.2–0.4 mm per face for FDM and 0.1–0.25 mm for SLA, and it is safest to print a small test coupon of critical joints before the final part.',
    },
    'splitting-large-3d-prints': {
        ko: '장비 최대 출력 크기를 넘는 모델은 여러 부품으로 나눠 출력한 뒤 조립합니다. 눈에 덜 띄는 면으로 자르고 핀·슬롯 같은 정렬 구조를 넣으면 조립 정밀도가 올라가며, 견적은 부품별 재료·출력 시간을 합산해 정해집니다.',
        en: 'Models larger than the printer’s build volume are printed in several parts and assembled. Cut along less visible faces and add alignment features such as pins or slots; the quote is the sum of each part’s material and print time.',
    },
    'graduation-project-checklist': {
        ko: '졸업작품 3D프린팅은 제출일 1주 이상 전에 견적·주문하는 것이 안전합니다(평균 수령 3~7일). 파일 단위(mm)·실제 크기·메쉬 오류를 확인하고, 발표용 외관이 중요하면 SLA, 구조·기능 시연이 중요하면 FDM을 우선 검토하세요.',
        en: 'For a graduation project, get your quote and order in at least a week before the deadline (orders typically arrive in 3–7 days). Check units (mm), real size and mesh errors, and choose SLA when appearance matters most or FDM for structural and functional demos.',
    },
    'capstone-design-prototype-guide': {
        ko: '캡스톤디자인 시제품은 최종 발표 3~4주 전에 FDM PLA로 1차 출력을 시작하고, 최소 2주 전에는 최종 주문을 마치는 것을 권장합니다. CAD를 다루지 못해도 스케치·도면으로 3D 모델링을 맡길 수 있고, 산학협력단 결제용 견적서·거래명세서·세금계산서를 발행합니다.',
        en: 'For a capstone design prototype, start a first FDM PLA print 3–4 weeks before the final presentation and place the final order at least 2 weeks before. Teams without CAD skills can outsource 3D modeling from sketches or drawings, and we issue the quotes, statements and tax invoices universities need for payment.',
    },
}

export function getGuideKeyAnswer(slug: string, locale: string): string | null {
    const entry = GUIDE_KEY_ANSWERS[slug]
    if (!entry) return null
    return locale === 'en' ? entry.en : entry.ko
}
