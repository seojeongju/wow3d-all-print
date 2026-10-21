import { pickWorkPhotos, type WorkPhotoFocus } from '@/lib/seo-work-photos'

export type UseCaseShape = 'solid' | 'general' | 'shell' | 'figure'
export type UseCaseMethod = 'fdm' | 'sla' | 'dlp'

export type UseCaseLink = { href: string; label: string }

export type getUseCaseContent = {
    /** 메타 title */
    title: string
    description: string
    /** 허브 카드·견적 배너에 쓰는 짧은 이름 */
    name: string
    cardDesc: string
    eyebrow: string
    h1: string
    h1Accent: string
    intro: string
    recommendations: Array<{ label: string; method: string; materials: string; why: string }>
    checklist: string[]
    /** 예시 견적 설명 (예: 높이 100mm 피규어 1개) */
    exampleLabel: string
    faqs: Array<{ q: string; a: string }>
    related: UseCaseLink[]
    secondaryCta?: UseCaseLink
}

export type UseCaseConfig = {
    slug: string
    path: string
    focus: WorkPhotoFocus
    /** 가격 계산기 프리셋 */
    example: { w: number; d: number; h: number; shape: UseCaseShape; method: UseCaseMethod; qty: number }
    ko: getUseCaseContent
    en: getUseCaseContent
}

export const USE_CASES: UseCaseConfig[] = [
    {
        slug: 'figures-miniatures',
        path: '/use-cases/figures-miniatures',
        focus: 'resin',
        example: { w: 50, d: 50, h: 100, shape: 'figure', method: 'dlp', qty: 1 },
        ko: {
            title: '피규어·미니어처 3D프린팅 출력 | 레진 DLP·SLA 고해상도',
            description:
                '피규어·미니어처·흉상 3D프린팅은 레진(DLP·SLA)이 표면이 매끈하고 디테일이 살아납니다. 추천 소재, 서포트·도색 팁, 예상 가격을 확인하고 파일만 올려 바로 견적을 받아보세요.',
            name: '피규어·미니어처',
            cardDesc: '얼굴·손가락 같은 미세 디테일이 중요한 출력물. 레진 DLP·SLA 추천',
            eyebrow: 'Use Case · Figures',
            h1: '피규어·미니어처 출력은',
            h1Accent: '레진으로 디테일을 살리세요',
            intro:
                '피규어는 0.05mm 수준의 적층 높이와 매끈한 표면이 결과물의 인상을 좌우합니다. FDM은 적층 줄이 보여 후가공이 많이 들지만, 레진(DLP·SLA)은 출력 직후부터 표면이 매끈해 도색 전 손질이 훨씬 적습니다.',
            recommendations: [
                {
                    label: '추천',
                    method: 'DLP 레진',
                    materials: 'Standard 레진(회색·흰색)',
                    why: '작은 피규어·미니어처에 가장 많이 쓰는 조합입니다. 디테일 재현이 좋고 도료가 잘 먹습니다.',
                },
                {
                    label: '큰 사이즈',
                    method: 'SLA 레진',
                    materials: 'Standard·Tough 레진',
                    why: '높이 15cm 이상 흉상·스태츄는 SLA가 유리합니다. 얇은 무기·장식은 Tough 레진이 덜 부러집니다.',
                },
            ],
            checklist: [
                '속이 꽉 찬 모델은 레진 사용량이 많아집니다. 두께 2~3mm로 속을 비우고 배수 구멍을 2개 이상 뚫으면 비용이 줄어듭니다.',
                '칼·창 같은 얇은 부품은 최소 1mm 이상 두께를 확보하세요. 너무 얇으면 서포트 제거 중 부러집니다.',
                '서포트 자국이 남기 때문에 얼굴·정면 같은 중요한 면은 요청사항에 적어주시면 반대쪽에 서포트를 배치합니다.',
                '여러 파트로 나뉜 키트형 모델은 조립 공차(0.1~0.2mm)를 미리 반영하면 접착이 쉬워집니다.',
            ],
            exampleLabel: '높이 100mm 피규어 1개 (DLP 레진)',
            faqs: [
                {
                    q: '피규어를 FDM으로 출력하면 안 되나요?',
                    a: '가능하지만 적층 줄이 보여 사포·퍼티 작업이 많이 필요합니다. 높이 20cm 이상 대형이거나 비용이 우선이면 FDM도 선택지지만, 디테일이 중요한 피규어는 레진을 권장합니다.',
                },
                {
                    q: '도색까지 맡길 수 있나요?',
                    a: '기본 견적은 출력과 서포트 제거까지입니다. 도색·사포 등 후가공이 필요하면 견적 요청사항에 적어주시면 별도로 안내드립니다.',
                },
                {
                    q: '레진 피규어는 잘 깨지지 않나요?',
                    a: 'Standard 레진은 단단하지만 충격에는 약한 편입니다. 얇은 돌출부가 많거나 자주 만지는 용도라면 Tough 레진을 선택하세요.',
                },
            ],
            related: [
                { href: '/guides/best-materials-for-miniatures-and-figurines', label: '미니어처·피규어 소재 가이드' },
                { href: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin', label: '레진 종류별 비교' },
                { href: '/guides/fdm-vs-sla-vs-dlp', label: 'FDM vs SLA vs DLP' },
            ],
            secondaryCta: { href: '/services/photo-to-3d', label: '사진으로 피규어 만들기' },
        },
        en: {
            title: '3D Printing Figures & Miniatures | High-Detail Resin DLP/SLA',
            description:
                'Resin (DLP/SLA) gives figures, miniatures and busts smooth surfaces and crisp detail. See recommended materials, support and painting tips, a sample price, and upload your file for an instant quote.',
            name: 'Figures & Miniatures',
            cardDesc: 'Faces, fingers and fine detail matter most. Resin DLP/SLA recommended',
            eyebrow: 'Use Case · Figures',
            h1: 'Print figures and miniatures',
            h1Accent: 'in resin for crisp detail',
            intro:
                'For figures, fine layer height (around 0.05mm) and a smooth surface define the result. FDM leaves visible layer lines that need a lot of sanding, while resin (DLP/SLA) comes off the printer smooth and needs far less prep before painting.',
            recommendations: [
                {
                    label: 'Recommended',
                    method: 'DLP resin',
                    materials: 'Standard resin (grey / white)',
                    why: 'The most common choice for small figures and miniatures. Great detail and takes paint well.',
                },
                {
                    label: 'Large size',
                    method: 'SLA resin',
                    materials: 'Standard / Tough resin',
                    why: 'Busts and statues taller than 15cm suit SLA. Tough resin keeps thin weapons and ornaments from snapping.',
                },
            ],
            checklist: [
                'Solid models use a lot of resin. Hollow them to a 2–3mm wall and add at least two drain holes to cut cost.',
                'Keep thin parts such as swords or spears at least 1mm thick, or they may break when supports are removed.',
                'Supports leave small marks. Tell us which faces matter (e.g. the face or front) and we will support the other side.',
                'For multi-part kits, build in 0.1–0.2mm assembly clearance so the parts glue together easily.',
            ],
            exampleLabel: 'One 100mm-tall figure (DLP resin)',
            faqs: [
                {
                    q: 'Can I print a figure with FDM?',
                    a: 'Yes, but layer lines will need sanding and filler. FDM can make sense for figures over 20cm or when cost comes first; for detailed figures we recommend resin.',
                },
                {
                    q: 'Can you paint the figure too?',
                    a: 'The standard quote covers printing and support removal. If you need painting or sanding, add it to the quote notes and we will follow up separately.',
                },
                {
                    q: 'Are resin figures fragile?',
                    a: 'Standard resin is hard but less impact-resistant. For many thin protrusions or parts that get handled often, choose Tough resin.',
                },
            ],
            related: [
                { href: '/guides/best-materials-for-miniatures-and-figurines', label: 'Materials for miniatures & figures' },
                { href: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin', label: 'Resin types compared' },
                { href: '/guides/fdm-vs-sla-vs-dlp', label: 'FDM vs SLA vs DLP' },
            ],
            secondaryCta: { href: '/services/photo-to-3d', label: 'Turn a photo into a figure' },
        },
    },
    {
        slug: 'electronics-enclosures',
        path: '/use-cases/electronics-enclosures',
        focus: 'fdm',
        example: { w: 100, d: 80, h: 40, shape: 'shell', method: 'fdm', qty: 1 },
        ko: {
            title: '전자기기 케이스·하우징 3D프린팅 | PETG·ABS 시제품 케이스',
            description:
                '아두이노·라즈베리파이·PCB 케이스와 제품 시제품 하우징을 3D프린팅으로 제작하세요. 소재 선택(PETG·ABS·PC), 벽 두께·공차·나사 보스 설계 팁과 예상 가격을 안내합니다.',
            name: '전자기기 케이스',
            cardDesc: 'PCB·아두이노 케이스, 제품 하우징 시제품. FDM PETG·ABS 추천',
            eyebrow: 'Use Case · Enclosures',
            h1: '전자기기 케이스는',
            h1Accent: '공차와 소재가 핵심입니다',
            intro:
                '케이스는 PCB·커넥터·나사가 정확히 맞아야 하고, 기기 발열도 견뎌야 합니다. 대부분 FDM으로 충분하며, 외관 시제품처럼 표면 품질이 중요하면 레진을 함께 고려합니다.',
            recommendations: [
                {
                    label: '추천',
                    method: 'FDM',
                    materials: 'PETG',
                    why: 'PLA보다 열과 충격에 강하고 출력 안정성이 좋아 일반 전자기기 케이스에 가장 무난합니다.',
                },
                {
                    label: '발열·내구',
                    method: 'FDM',
                    materials: 'ABS·PC',
                    why: '모터·전원부처럼 열이 나거나 차량 내부에 두는 케이스는 ABS, 더 높은 강도가 필요하면 PC를 권장합니다.',
                },
                {
                    label: '외관 시제품',
                    method: 'SLA 레진',
                    materials: 'Standard·Tough 레진',
                    why: '투자·전시용 목업처럼 매끈한 외관이 중요하면 SLA로 출력 후 도장하는 방식이 깔끔합니다.',
                },
            ],
            checklist: [
                '벽 두께는 FDM 기준 1.6~2.4mm가 적당합니다. 너무 얇으면 휘거나 갈라집니다.',
                'PCB·뚜껑이 끼워지는 부분은 0.2~0.4mm 여유 공차를 주세요. 딱 맞게 설계하면 조립이 안 될 수 있습니다.',
                '나사 보스는 외경을 나사 지름의 2~2.5배로, 셀프태핑이면 구멍을 나사 지름보다 0.3~0.5mm 작게 잡으세요.',
                '스냅핏 고리는 PETG처럼 탄성이 있는 소재가 유리하고, 적층 방향과 수직으로 힘을 받지 않게 배치하세요.',
                '통풍 구멍·커넥터 구멍은 실제 부품 치수보다 0.5mm 정도 크게 내는 것이 안전합니다.',
            ],
            exampleLabel: '100×80×40mm 케이스 1개 (FDM)',
            faqs: [
                {
                    q: '케이스 상판·하판을 따로 올려도 되나요?',
                    a: '네. 파일을 여러 개 올리거나 한 파일에 함께 배치해도 됩니다. 함께 조립되는 부품은 같은 소재·색상으로 주문하면 결과가 일정합니다.',
                },
                {
                    q: '인서트 너트를 넣을 수 있나요?',
                    a: '열 압입 인서트용 구멍을 설계해 주시면 출력 후 직접 압입하실 수 있습니다. 압입 작업이 필요하면 요청사항에 적어주세요.',
                },
                {
                    q: '양산 전에 몇 개만 먼저 만들어볼 수 있나요?',
                    a: '1개부터 주문 가능하며, 수십~수백 개 소량 생산도 별도로 상담해 드립니다.',
                },
            ],
            related: [
                { href: '/guides/best-materials-for-3d-printed-housings-and-cases', label: '하우징·케이스 소재 가이드' },
                { href: '/guides/pla-vs-abs-vs-petg', label: 'PLA vs ABS vs PETG' },
                { href: '/services/small-batch', label: '소량 생산 서비스' },
            ],
        },
        en: {
            title: '3D Printing Electronics Enclosures & Housings | PETG/ABS Prototype Cases',
            description:
                'Print Arduino, Raspberry Pi and PCB cases or product housing prototypes. Learn material choice (PETG, ABS, PC), wall thickness, clearance and screw boss tips, and see a sample price.',
            name: 'Electronics Enclosures',
            cardDesc: 'PCB and Arduino cases, product housing prototypes. FDM PETG/ABS recommended',
            eyebrow: 'Use Case · Enclosures',
            h1: 'For electronics enclosures,',
            h1Accent: 'clearance and material are key',
            intro:
                'An enclosure has to fit PCBs, connectors and screws precisely and survive the heat of the device. FDM is enough for most cases; consider resin when surface quality matters, such as appearance prototypes.',
            recommendations: [
                {
                    label: 'Recommended',
                    method: 'FDM',
                    materials: 'PETG',
                    why: 'Tougher and more heat-tolerant than PLA, and prints reliably. The safe default for most electronics cases.',
                },
                {
                    label: 'Heat & durability',
                    method: 'FDM',
                    materials: 'ABS / PC',
                    why: 'Use ABS for cases near motors, power supplies or inside cars; PC when you need even more strength.',
                },
                {
                    label: 'Appearance prototype',
                    method: 'SLA resin',
                    materials: 'Standard / Tough resin',
                    why: 'For investor or exhibition mock-ups, print in SLA and paint for a clean finish.',
                },
            ],
            checklist: [
                'Aim for 1.6–2.4mm walls with FDM. Thinner walls can warp or crack.',
                'Leave 0.2–0.4mm clearance where PCBs or lids fit in. A zero-clearance design may not assemble.',
                'Make screw bosses 2–2.5× the screw diameter; for self-tapping screws make the hole 0.3–0.5mm smaller than the screw.',
                'Snap-fit hooks work best in flexible materials such as PETG, and should not be loaded across the layer lines.',
                'Make vent and connector openings about 0.5mm larger than the actual part.',
            ],
            exampleLabel: 'One 100×80×40mm case (FDM)',
            faqs: [
                {
                    q: 'Can I upload the top and bottom shells separately?',
                    a: 'Yes. Upload several files or place them together in one file. Ordering mating parts in the same material and color keeps the result consistent.',
                },
                {
                    q: 'Can you add threaded inserts?',
                    a: 'Design holes for heat-set inserts and you can press them in after printing. If you need us to install them, add it to the quote notes.',
                },
                {
                    q: 'Can I make a few units before mass production?',
                    a: 'You can order from a single unit, and we also quote small batches of tens to hundreds of parts.',
                },
            ],
            related: [
                { href: '/guides/best-materials-for-3d-printed-housings-and-cases', label: 'Materials for housings & cases' },
                { href: '/guides/pla-vs-abs-vs-petg', label: 'PLA vs ABS vs PETG' },
                { href: '/services/small-batch', label: 'Small-batch production' },
            ],
        },
    },
    {
        slug: 'jigs-fixtures',
        path: '/use-cases/jigs-fixtures',
        focus: 'fdm',
        example: { w: 120, d: 80, h: 30, shape: 'solid', method: 'fdm', qty: 2 },
        ko: {
            title: '지그·고정구 3D프린팅 제작 | 생산라인·검사 지그',
            description:
                '조립 지그, 검사 지그, 고정구, 드릴 가이드를 3D프린팅으로 빠르게 제작하세요. 가공 대비 짧은 납기와 낮은 비용, 소재 선택(PETG·PC·ABS)과 설계 팁을 안내합니다.',
            name: '지그·고정구',
            cardDesc: '조립·검사 지그, 드릴 가이드. 가공보다 빠르고 저렴한 FDM 추천',
            eyebrow: 'Use Case · Jigs & Fixtures',
            h1: '지그·고정구는',
            h1Accent: '3D프린팅이 가장 빠릅니다',
            intro:
                '지그는 생산라인에서 매일 쓰이지만 수량이 적고 설계 변경이 잦습니다. CNC 가공보다 납기와 비용이 크게 줄고, 형상이 복잡해도 가격 차이가 적어 현장 개선용으로 많이 쓰입니다.',
            recommendations: [
                {
                    label: '추천',
                    method: 'FDM',
                    materials: 'PETG',
                    why: '충격과 마모에 적당히 강하고 치수 안정성이 좋아 일반 조립·검사 지그에 무난합니다.',
                },
                {
                    label: '고강도·내열',
                    method: 'FDM',
                    materials: 'PC·ABS',
                    why: '반복 하중이 크거나 열풍·건조 공정 근처에서 쓰는 지그는 PC 또는 ABS를 권장합니다.',
                },
                {
                    label: '정밀 위치결정',
                    method: 'SLA 레진',
                    materials: 'Tough 레진',
                    why: '작은 부품을 정밀하게 맞춰야 하는 검사 지그는 치수 정밀도가 높은 SLA가 유리합니다.',
                },
            ],
            checklist: [
                '부품이 닿는 면에는 0.1~0.3mm 공차를 주고, 처음에는 1~2개로 맞춤 확인 후 수량을 늘리세요.',
                '하중을 받는 방향이 적층 방향과 수직이 되도록 설계하면 층간 분리로 깨지는 일이 줄어듭니다.',
                '마모가 심한 위치결정 핀·부싱은 금속 핀을 압입하는 구조로 설계하면 수명이 길어집니다.',
                '두꺼운 블록형 지그는 내부 채움(인필)으로 출력해 무게와 비용을 줄일 수 있습니다.',
            ],
            exampleLabel: '120×80×30mm 지그 2개 (FDM)',
            faqs: [
                {
                    q: '금속 가공 지그를 대체할 수 있나요?',
                    a: '하중이 크지 않은 조립·검사·보관용 지그는 대부분 대체 가능합니다. 절삭력이 직접 걸리거나 고온 환경은 금속이 적합하므로 용도를 알려주시면 판단을 도와드립니다.',
                },
                {
                    q: '도면만 있고 3D 파일이 없어요.',
                    a: '2D 도면이나 실측 치수로 3D 모델링부터 진행할 수 있습니다. 모델링 서비스를 이용하세요.',
                },
                {
                    q: '같은 지그를 여러 개 주문하면 단가가 내려가나요?',
                    a: '수량이 늘면 출력 준비 비용이 나뉘어 단가가 낮아집니다. 계산기에서 수량을 바꿔 차이를 확인해 보세요.',
                },
            ],
            related: [
                { href: '/guides/3d-printing-tolerances', label: '3D프린팅 공차 가이드' },
                { href: '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts', label: '내열·내충격 소재 가이드' },
                { href: '/services/modeling', label: '3D 모델링 서비스' },
            ],
        },
        en: {
            title: '3D Printing Jigs & Fixtures | Assembly and Inspection Jigs',
            description:
                'Print assembly jigs, inspection fixtures and drill guides fast. Shorter lead times and lower cost than machining, plus material choice (PETG, PC, ABS) and design tips.',
            name: 'Jigs & Fixtures',
            cardDesc: 'Assembly and inspection jigs, drill guides. FDM is faster and cheaper than machining',
            eyebrow: 'Use Case · Jigs & Fixtures',
            h1: 'For jigs and fixtures,',
            h1Accent: '3D printing is the fastest route',
            intro:
                'Jigs are used every day on the line, but in small quantities with frequent design changes. Printing cuts lead time and cost compared with CNC, and complex shapes cost little extra, which makes it ideal for shop-floor improvements.',
            recommendations: [
                {
                    label: 'Recommended',
                    method: 'FDM',
                    materials: 'PETG',
                    why: 'Reasonably tough and wear-resistant with good dimensional stability. A solid default for assembly and inspection jigs.',
                },
                {
                    label: 'Strength & heat',
                    method: 'FDM',
                    materials: 'PC / ABS',
                    why: 'For heavy repeated loads or jigs near hot-air or drying processes, use PC or ABS.',
                },
                {
                    label: 'Precise locating',
                    method: 'SLA resin',
                    materials: 'Tough resin',
                    why: 'Inspection jigs that locate small parts precisely benefit from the higher accuracy of SLA.',
                },
            ],
            checklist: [
                'Give contact faces 0.1–0.3mm clearance, and test-fit one or two units before ordering more.',
                'Orient the design so loads run across rather than along the layer lines to avoid delamination.',
                'For high-wear locating pins and bushings, design pockets for pressed-in metal pins to extend life.',
                'Thick block-shaped jigs can be printed with infill to save weight and cost.',
            ],
            exampleLabel: 'Two 120×80×30mm jigs (FDM)',
            faqs: [
                {
                    q: 'Can printed jigs replace machined metal ones?',
                    a: 'Most assembly, inspection and storage jigs without heavy loads can be replaced. Metal is still better under direct cutting forces or high heat; tell us the use case and we will help you decide.',
                },
                {
                    q: 'I only have a drawing, not a 3D file.',
                    a: 'We can model it from 2D drawings or measurements. Use our modeling service.',
                },
                {
                    q: 'Is the unit price lower for multiple jigs?',
                    a: 'Yes. Setup cost is shared across units, so the unit price drops. Change the quantity in the calculator to compare.',
                },
            ],
            related: [
                { href: '/guides/3d-printing-tolerances', label: '3D printing tolerances' },
                { href: '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts', label: 'Heat & impact-resistant materials' },
                { href: '/services/modeling', label: '3D modeling service' },
            ],
        },
    },
    {
        slug: 'replacement-parts',
        path: '/use-cases/replacement-parts',
        focus: 'fdm',
        example: { w: 40, d: 30, h: 20, shape: 'solid', method: 'fdm', qty: 2 },
        ko: {
            title: '단종·파손 부품 3D프린팅 복원 | 교체 부품 제작',
            description:
                '구할 수 없는 단종 부품, 깨진 플라스틱 부품을 3D프린팅으로 다시 만드세요. 3D 파일이 없어도 실측·사진으로 모델링부터 진행할 수 있습니다. 소재 선택과 예상 가격을 안내합니다.',
            name: '단종·교체 부품',
            cardDesc: '깨지거나 단종된 플라스틱 부품 복원. 파일이 없으면 모델링부터',
            eyebrow: 'Use Case · Replacement Parts',
            h1: '구할 수 없는 부품,',
            h1Accent: '3D프린팅으로 다시 만드세요',
            intro:
                '가전·가구·차량의 작은 플라스틱 부품 하나 때문에 제품 전체를 버리는 경우가 많습니다. 원본 부품이나 치수만 있으면 3D 모델로 복원해 같은 형태로 출력할 수 있습니다.',
            recommendations: [
                {
                    label: '추천',
                    method: 'FDM',
                    materials: 'PETG·ABS',
                    why: '일상적인 하중과 온도를 견디는 범용 조합입니다. 실외·차량용은 ABS가 더 안전합니다.',
                },
                {
                    label: '유연 부품',
                    method: 'FDM',
                    materials: 'TPU',
                    why: '고무 패킹·완충 패드·캡처럼 휘어져야 하는 부품은 TPU로 출력합니다.',
                },
                {
                    label: '작고 정밀한 부품',
                    method: 'SLA 레진',
                    materials: 'Tough 레진',
                    why: '기어·클립처럼 작고 정밀한 부품은 레진이 형상을 더 정확하게 재현합니다.',
                },
            ],
            checklist: [
                '파손된 원본이 있으면 버리지 말고 함께 실측하세요. 끼워지는 상대 부품 치수도 함께 재면 정확도가 올라갑니다.',
                '힘을 받다 부러진 부품은 원래보다 살짝 두껍게 보강하는 것을 권장합니다.',
                '기어·나사산은 FDM보다 레진이 정밀하며, 작동 부위에는 0.2mm 정도 여유를 두세요.',
                '처음에는 1~2개만 출력해 맞춤을 확인한 뒤 필요한 수량을 주문하세요.',
            ],
            exampleLabel: '40×30×20mm 부품 2개 (FDM)',
            faqs: [
                {
                    q: '3D 파일이 없는데 부품만 있어요.',
                    a: '부품 사진과 주요 치수를 보내주시면 3D 모델링부터 진행합니다. 모양이 단순하면 모델링 비용도 크지 않습니다.',
                },
                {
                    q: '원래 부품만큼 튼튼한가요?',
                    a: '사출 부품과 완전히 같지는 않지만, 소재와 두께를 조정하면 일상 사용에는 충분한 강도를 낼 수 있습니다. 용도를 알려주시면 소재를 추천해 드립니다.',
                },
                {
                    q: '정품 부품을 복제해도 되나요?',
                    a: '개인 수리 목적의 교체 부품 제작은 일반적으로 가능하지만, 상표·디자인 권리가 있는 부품의 판매 목적 복제는 제한될 수 있습니다.',
                },
            ],
            related: [
                { href: '/services/modeling', label: '3D 모델링 서비스' },
                { href: '/guides/3d-printing-tolerances', label: '3D프린팅 공차 가이드' },
                { href: '/guides/pla-vs-abs-vs-petg', label: 'PLA vs ABS vs PETG' },
            ],
            secondaryCta: { href: '/services/modeling', label: '파일 없이 모델링 의뢰' },
        },
        en: {
            title: '3D Printing Replacement & Discontinued Parts',
            description:
                'Recreate discontinued or broken plastic parts with 3D printing. No 3D file? We can model from measurements or photos. See material choices and a sample price.',
            name: 'Replacement Parts',
            cardDesc: 'Recreate broken or discontinued plastic parts. No file? We model it first',
            eyebrow: 'Use Case · Replacement Parts',
            h1: 'Can’t find the part?',
            h1Accent: 'Print a new one',
            intro:
                'Appliances, furniture and vehicles are often thrown away over one small plastic part. With the original part or its dimensions, we can rebuild the 3D model and print it in the same shape.',
            recommendations: [
                {
                    label: 'Recommended',
                    method: 'FDM',
                    materials: 'PETG / ABS',
                    why: 'An all-round choice for everyday loads and temperatures. ABS is safer outdoors or in vehicles.',
                },
                {
                    label: 'Flexible parts',
                    method: 'FDM',
                    materials: 'TPU',
                    why: 'Gaskets, bumpers and caps that need to bend are printed in TPU.',
                },
                {
                    label: 'Small precise parts',
                    method: 'SLA resin',
                    materials: 'Tough resin',
                    why: 'Small precise parts such as gears and clips are reproduced more accurately in resin.',
                },
            ],
            checklist: [
                'Keep the broken original and measure it, along with the mating part, for better accuracy.',
                'If the part broke under load, reinforce it slightly thicker than the original.',
                'Gears and threads are more precise in resin; leave about 0.2mm clearance on moving surfaces.',
                'Print one or two first to check the fit, then order the quantity you need.',
            ],
            exampleLabel: 'Two 40×30×20mm parts (FDM)',
            faqs: [
                {
                    q: 'I have the part but no 3D file.',
                    a: 'Send photos and key dimensions and we will model it first. Simple shapes keep the modeling cost low.',
                },
                {
                    q: 'Will it be as strong as the original?',
                    a: 'Not identical to an injection-molded part, but adjusting material and thickness gives enough strength for everyday use. Tell us the use and we will recommend a material.',
                },
                {
                    q: 'Can I copy an OEM part?',
                    a: 'Making a replacement for personal repair is generally fine, but copying trademarked or design-protected parts for sale may be restricted.',
                },
            ],
            related: [
                { href: '/services/modeling', label: '3D modeling service' },
                { href: '/guides/3d-printing-tolerances', label: '3D printing tolerances' },
                { href: '/guides/pla-vs-abs-vs-petg', label: 'PLA vs ABS vs PETG' },
            ],
            secondaryCta: { href: '/services/modeling', label: 'Request modeling without a file' },
        },
    },
    {
        slug: 'architectural-models',
        path: '/use-cases/architectural-models',
        focus: 'mixed',
        example: { w: 200, d: 150, h: 80, shape: 'general', method: 'fdm', qty: 1 },
        ko: {
            title: '건축 모형 3D프린팅 출력 | 졸업작품·공모전 모형',
            description:
                '건축 졸업작품, 공모전, 분양 모형을 3D프린팅으로 출력하세요. 축척별 최소 두께, 대형 모형 분할 출력, FDM·레진 선택 기준과 예상 가격을 안내합니다.',
            name: '건축 모형',
            cardDesc: '졸업작품·공모전·매스 모형. 축척과 최소 두께가 관건',
            eyebrow: 'Use Case · Architecture',
            h1: '건축 모형은',
            h1Accent: '축척과 두께부터 확인하세요',
            intro:
                '건축 모형은 실제 건물을 1/100, 1/200 등으로 줄이기 때문에 창틀·난간처럼 얇은 요소가 출력 가능한 두께보다 얇아지기 쉽습니다. 축척에 맞춰 두께를 정리하면 실패 없이 출력할 수 있습니다.',
            recommendations: [
                {
                    label: '매스·대형 모형',
                    method: 'FDM',
                    materials: 'PLA (흰색·회색)',
                    why: '덩어리 형태의 매스 모형이나 대지 모형은 FDM이 비용 대비 효율이 가장 좋습니다.',
                },
                {
                    label: '디테일 모형',
                    method: 'SLA 레진',
                    materials: 'Standard 레진',
                    why: '창호·난간·계단 같은 세부가 많은 상세 모형은 레진이 선명하게 표현합니다.',
                },
            ],
            checklist: [
                '벽·기둥은 FDM 최소 1.2mm, 레진 최소 0.8mm 이상으로 두께를 확보하세요. 축척 변환 후 두께를 꼭 확인하세요.',
                '출력 장비보다 큰 모형은 층별·동별로 나눠 출력한 뒤 조립합니다. 분할 위치에 맞춤 핀을 넣으면 조립이 쉬워집니다.',
                'SketchUp·Rhino에서 내보낸 파일은 구멍이 있거나 면이 뒤집혀 있는 경우가 많습니다. 무료 STL 점검기로 먼저 확인하세요.',
                '마감 일정이 정해져 있다면 주문 시 마감일을 알려주세요. 대형 모형은 출력에 며칠이 걸릴 수 있습니다.',
            ],
            exampleLabel: '200×150×80mm 모형 1개 (FDM)',
            faqs: [
                {
                    q: '졸업 전시 일정에 맞출 수 있나요?',
                    a: '모형 크기와 수량에 따라 다르지만 보통 수일 내 출고됩니다. 마감일을 알려주시면 일정에 맞는 방식을 안내드립니다.',
                },
                {
                    q: 'SketchUp 파일도 되나요?',
                    a: 'STL·OBJ·3MF·STEP 등으로 내보내서 올려주세요. 내보낸 파일에 오류가 있으면 STL 점검기로 미리 확인할 수 있습니다.',
                },
                {
                    q: '여러 색으로 출력할 수 있나요?',
                    a: '파트별로 색을 나눠 출력한 뒤 조립하는 방식이 가장 깔끔합니다. 건축 모형은 보통 흰색 단색으로 출력해 재질감을 통일합니다.',
                },
            ],
            related: [
                { href: '/services/graduation', label: '졸업작품 출력 서비스' },
                { href: '/guides/minimum-wall-thickness', label: '최소 벽 두께 가이드' },
                { href: '/guides/splitting-large-3d-prints', label: '대형 출력물 분할 가이드' },
            ],
            secondaryCta: { href: '/stl-checker', label: '무료 STL 점검기' },
        },
        en: {
            title: '3D Printing Architectural Models | Student & Competition Models',
            description:
                'Print architecture thesis, competition and sales models. Learn the minimum thickness per scale, how to split large models, when to use FDM or resin, and see a sample price.',
            name: 'Architectural Models',
            cardDesc: 'Thesis, competition and massing models. Scale and minimum thickness matter',
            eyebrow: 'Use Case · Architecture',
            h1: 'For architectural models,',
            h1Accent: 'check scale and thickness first',
            intro:
                'Architectural models shrink buildings to 1:100 or 1:200, so thin elements such as window frames and railings easily fall below printable thickness. Adjust thickness to the scale and the print will succeed.',
            recommendations: [
                {
                    label: 'Massing / large',
                    method: 'FDM',
                    materials: 'PLA (white / grey)',
                    why: 'For massing and site models, FDM gives the best value.',
                },
                {
                    label: 'Detailed models',
                    method: 'SLA resin',
                    materials: 'Standard resin',
                    why: 'Detailed models with windows, railings and stairs come out crisp in resin.',
                },
            ],
            checklist: [
                'Keep walls and columns at least 1.2mm for FDM and 0.8mm for resin. Always recheck thickness after scaling.',
                'Models larger than the printer are split by floor or block and assembled. Add alignment pins at the split for easy assembly.',
                'Files exported from SketchUp or Rhino often have holes or flipped faces. Run them through the free STL checker first.',
                'If you have a fixed deadline, tell us when you order. Large models can take several days to print.',
            ],
            exampleLabel: 'One 200×150×80mm model (FDM)',
            faqs: [
                {
                    q: 'Can you meet my exhibition deadline?',
                    a: 'It depends on size and quantity, but most orders ship within a few days. Tell us your deadline and we will suggest a suitable method.',
                },
                {
                    q: 'Do you accept SketchUp files?',
                    a: 'Export to STL, OBJ, 3MF or STEP and upload. You can check the export for errors with the STL checker first.',
                },
                {
                    q: 'Can it be printed in multiple colors?',
                    a: 'Printing parts in separate colors and assembling them gives the cleanest result. Architectural models are usually printed in white for a uniform look.',
                },
            ],
            related: [
                { href: '/services/graduation', label: 'Graduation project printing' },
                { href: '/guides/minimum-wall-thickness', label: 'Minimum wall thickness' },
                { href: '/guides/splitting-large-3d-prints', label: 'Splitting large prints' },
            ],
            secondaryCta: { href: '/stl-checker', label: 'Free STL checker' },
        },
    },
    {
        slug: 'cosplay-props',
        path: '/use-cases/cosplay-props',
        focus: 'fdm',
        example: { w: 250, d: 120, h: 60, shape: 'general', method: 'fdm', qty: 1 },
        ko: {
            title: '코스프레 소품·무기 3D프린팅 | 대형 소품 분할 출력',
            description:
                '코스프레 무기·헬멧·액세서리를 3D프린팅으로 제작하세요. 대형 소품 분할 출력, 가벼운 내부 채움, 도색 전 후가공 팁과 예상 가격을 안내합니다.',
            name: '코스프레 소품',
            cardDesc: '무기·헬멧·액세서리. 크고 가볍게, 분할 출력 후 조립',
            eyebrow: 'Use Case · Cosplay',
            h1: '코스프레 소품은',
            h1Accent: '크고 가볍게 만드세요',
            intro:
                '코스프레 소품은 크기가 크고 행사장에서 오래 들고 다녀야 하므로 무게가 중요합니다. FDM으로 내부를 적당히 비워 가볍게 출력하고, 부위별로 나눠 출력한 뒤 조립·도색하는 방식이 일반적입니다.',
            recommendations: [
                {
                    label: '추천',
                    method: 'FDM',
                    materials: 'PLA',
                    why: '가볍고 사포·도색이 쉬워 무기·갑옷 파츠에 가장 많이 씁니다.',
                },
                {
                    label: '실외 행사·여름',
                    method: 'FDM',
                    materials: 'PETG',
                    why: '한여름 차 안처럼 뜨거운 곳에 두면 PLA는 휠 수 있습니다. 실외 행사가 많다면 PETG가 안전합니다.',
                },
                {
                    label: '장신구·디테일 파츠',
                    method: 'DLP 레진',
                    materials: 'Standard 레진',
                    why: '반지·엠블럼처럼 작고 디테일한 파츠는 레진으로 따로 출력해 붙이면 완성도가 올라갑니다.',
                },
            ],
            checklist: [
                '300mm를 넘는 소품은 파츠로 나눠 출력합니다. 분할면에 맞춤 핀·홈을 넣으면 정렬이 쉽고 튼튼합니다.',
                '긴 무기는 내부에 금속봉·카본 파이프를 넣을 수 있도록 관통 구멍을 설계하면 휘거나 부러지지 않습니다.',
                '착용 소품(헬멧 등)은 실제 머리 둘레를 재서 스케일을 맞추고, 안쪽 여유를 1~2cm 두세요.',
                'FDM 출력물은 적층 줄이 있으므로 프라이머·퍼티 작업 후 도색하면 매끈해집니다.',
            ],
            exampleLabel: '250×120×60mm 소품 1개 (FDM)',
            faqs: [
                {
                    q: '1m가 넘는 무기도 만들 수 있나요?',
                    a: '파츠로 나눠 출력하면 가능합니다. 분할 위치를 정하기 어렵다면 요청사항에 적어주세요. 분할 설계는 별도로 상담해 드립니다.',
                },
                {
                    q: '도색된 상태로 받을 수 있나요?',
                    a: '기본은 출력과 서포트 제거까지입니다. 후가공·도색이 필요하면 견적 요청사항에 적어주시면 가능 여부를 안내드립니다.',
                },
                {
                    q: '행사 날짜가 정해져 있어요.',
                    a: '대형 소품은 출력 시간이 길어 여유 있게 주문하시는 것이 좋습니다. 주문 시 행사일을 알려주세요.',
                },
            ],
            related: [
                { href: '/guides/splitting-large-3d-prints', label: '대형 출력물 분할 가이드' },
                { href: '/guides/pla-vs-abs-vs-petg', label: 'PLA vs ABS vs PETG' },
                { href: '/expert', label: '대형 출력 장비 보기' },
            ],
        },
        en: {
            title: '3D Printing Cosplay Props & Weapons | Large Split Prints',
            description:
                'Print cosplay weapons, helmets and accessories. Tips on splitting large props, light infill, finishing before paint, and a sample price.',
            name: 'Cosplay Props',
            cardDesc: 'Weapons, helmets, accessories. Big and light, printed in parts and assembled',
            eyebrow: 'Use Case · Cosplay',
            h1: 'Make cosplay props',
            h1Accent: 'big but light',
            intro:
                'Cosplay props are large and carried around all day, so weight matters. The usual approach is to print in FDM with light infill, split by section, then assemble and paint.',
            recommendations: [
                {
                    label: 'Recommended',
                    method: 'FDM',
                    materials: 'PLA',
                    why: 'Light and easy to sand and paint. The most common choice for weapons and armor pieces.',
                },
                {
                    label: 'Outdoor / summer',
                    method: 'FDM',
                    materials: 'PETG',
                    why: 'PLA can warp in a hot car. For outdoor events, PETG is safer.',
                },
                {
                    label: 'Jewelry & details',
                    method: 'DLP resin',
                    materials: 'Standard resin',
                    why: 'Print small detailed parts such as rings and emblems separately in resin and attach them.',
                },
            ],
            checklist: [
                'Props over 300mm are printed in parts. Alignment pins and slots at the joints make them strong and easy to line up.',
                'For long weapons, design a through-hole for a metal rod or carbon tube so they do not bend or snap.',
                'For wearables such as helmets, scale to your actual head size and leave 1–2cm of inner clearance.',
                'FDM parts have layer lines; primer and filler before paint give a smooth finish.',
            ],
            exampleLabel: 'One 250×120×60mm prop (FDM)',
            faqs: [
                {
                    q: 'Can you make weapons longer than 1m?',
                    a: 'Yes, by printing in parts. If you are unsure where to split, add a note and we will discuss splitting separately.',
                },
                {
                    q: 'Can I get it painted?',
                    a: 'The standard quote covers printing and support removal. If you need finishing or painting, add it to the notes and we will tell you what is possible.',
                },
                {
                    q: 'I have a fixed event date.',
                    a: 'Large props take longer to print, so order with some margin and tell us the event date.',
                },
            ],
            related: [
                { href: '/guides/splitting-large-3d-prints', label: 'Splitting large prints' },
                { href: '/guides/pla-vs-abs-vs-petg', label: 'PLA vs ABS vs PETG' },
                { href: '/expert', label: 'Large-format printers' },
            ],
        },
    },
    {
        slug: 'logos-signage',
        path: '/use-cases/logos-signage',
        focus: 'fdm',
        example: { w: 200, d: 60, h: 10, shape: 'solid', method: 'fdm', qty: 1 },
        ko: {
            title: '로고·간판·네임플레이트 3D프린팅 | 입체 로고 제작',
            description:
                '회사 로고, 매장 사인, 네임플레이트, 입체 문자를 3D프린팅으로 제작하세요. 로고 이미지만 있어도 AI 3D 메이커로 입체화할 수 있습니다. 두께·글자 크기 설계 팁과 예상 가격을 안내합니다.',
            name: '로고·사인물',
            cardDesc: '입체 로고·네임플레이트·매장 사인. 이미지만 있어도 시작 가능',
            eyebrow: 'Use Case · Logos & Signage',
            h1: '로고·사인물을',
            h1Accent: '입체로 만들어 보세요',
            intro:
                '평면 로고를 두께가 있는 입체로 만들면 매장·사무실·부스에서 존재감이 커집니다. 로고 파일(AI·SVG)이나 이미지만 있어도 3D 모델로 만들어 출력할 수 있습니다.',
            recommendations: [
                {
                    label: '추천',
                    method: 'FDM',
                    materials: 'PLA (컬러)',
                    why: '색상 선택지가 많고 평평한 판형 출력에 유리해 로고·네임플레이트에 가장 많이 씁니다.',
                },
                {
                    label: '실외 간판',
                    method: 'FDM',
                    materials: 'PETG·ABS',
                    why: '햇빛·온도 변화가 있는 실외에는 PLA보다 PETG나 ABS가 오래갑니다.',
                },
                {
                    label: '작은 엠블럼',
                    method: 'DLP 레진',
                    materials: 'Standard 레진',
                    why: '배지·키링 크기의 작은 엠블럼은 레진이 가장자리를 선명하게 표현합니다.',
                },
            ],
            checklist: [
                '글자 획 두께는 최소 1.5mm(FDM) 이상, 글자 높이는 10mm 이상을 권장합니다.',
                '돌출 문자는 바탕판 위로 2~5mm 정도 올리면 그림자가 생겨 잘 보입니다.',
                '여러 색 로고는 색별로 나눠 출력한 뒤 붙이는 방식이 깔끔합니다.',
                '벽 부착용은 뒷면에 양면테이프 자리나 나사 구멍을 미리 설계하세요.',
            ],
            exampleLabel: '200×60×10mm 로고 1개 (FDM)',
            faqs: [
                {
                    q: '로고 이미지(JPG·PNG)만 있어요.',
                    a: 'AI 3D 메이커에서 이미지를 입체 모델로 바꿀 수 있고, 정확한 형태가 필요하면 모델링 서비스로 제작해 드립니다.',
                },
                {
                    q: '조명이 들어가는 간판도 되나요?',
                    a: '빛이 통하는 반투명 소재나 Clear 레진으로 출력할 수 있습니다. LED 배치 구조는 설계 단계에서 함께 상담해 드립니다.',
                },
                {
                    q: '같은 로고를 여러 개 만들 수 있나요?',
                    a: '수량을 늘릴수록 단가가 낮아집니다. 기념품·굿즈용 소량 생산도 가능합니다.',
                },
            ],
            related: [
                { href: '/maker', label: 'AI 3D 메이커' },
                { href: '/services/modeling', label: '3D 모델링 서비스' },
                { href: '/services/small-batch', label: '소량 생산 서비스' },
            ],
            secondaryCta: { href: '/maker', label: '이미지로 입체 로고 만들기' },
        },
        en: {
            title: '3D Printing Logos, Signs & Nameplates | 3D Logo Fabrication',
            description:
                'Print company logos, store signs, nameplates and 3D lettering. Only have a logo image? Turn it into 3D with the AI 3D Maker. Tips on thickness and letter size, plus a sample price.',
            name: 'Logos & Signage',
            cardDesc: '3D logos, nameplates and store signs. You can start from just an image',
            eyebrow: 'Use Case · Logos & Signage',
            h1: 'Bring your logo',
            h1Accent: 'into three dimensions',
            intro:
                'A flat logo turned into a thick 3D piece stands out in a store, office or booth. A logo file (AI/SVG) or even an image is enough to create a 3D model and print it.',
            recommendations: [
                {
                    label: 'Recommended',
                    method: 'FDM',
                    materials: 'PLA (colors)',
                    why: 'Lots of colors and great for flat plate-like prints. The most common choice for logos and nameplates.',
                },
                {
                    label: 'Outdoor signs',
                    method: 'FDM',
                    materials: 'PETG / ABS',
                    why: 'Outdoors with sun and temperature swings, PETG or ABS outlast PLA.',
                },
                {
                    label: 'Small emblems',
                    method: 'DLP resin',
                    materials: 'Standard resin',
                    why: 'Badge or keyring-sized emblems get crisp edges in resin.',
                },
            ],
            checklist: [
                'Keep letter strokes at least 1.5mm thick (FDM) and letters at least 10mm tall.',
                'Raise letters 2–5mm above the base plate so they cast a shadow and read well.',
                'Multi-color logos look cleanest when each color is printed separately and assembled.',
                'For wall mounting, design a recess for tape or screw holes on the back.',
            ],
            exampleLabel: 'One 200×60×10mm logo (FDM)',
            faqs: [
                {
                    q: 'I only have a logo image (JPG/PNG).',
                    a: 'The AI 3D Maker can turn an image into a 3D model, and our modeling service can build an exact model if you need precision.',
                },
                {
                    q: 'Can you make illuminated signs?',
                    a: 'We can print in translucent materials or Clear resin that lets light through. We can discuss the LED layout at the design stage.',
                },
                {
                    q: 'Can I order several of the same logo?',
                    a: 'Yes, and the unit price drops with quantity. Small batches for merchandise or gifts are possible.',
                },
            ],
            related: [
                { href: '/maker', label: 'AI 3D Maker' },
                { href: '/services/modeling', label: '3D modeling service' },
                { href: '/services/small-batch', label: 'Small-batch production' },
            ],
            secondaryCta: { href: '/maker', label: 'Make a 3D logo from an image' },
        },
    },
    {
        slug: 'trophies-awards',
        path: '/use-cases/trophies-awards',
        focus: 'resin',
        example: { w: 80, d: 80, h: 150, shape: 'figure', method: 'sla', qty: 1 },
        ko: {
            title: '트로피·상패·기념품 3D프린팅 | 맞춤 트로피 제작',
            description:
                '대회 트로피, 사내 시상, 기념품을 세상에 하나뿐인 형태로 3D프린팅하세요. 레진·FDM 선택, 받침 설계, 금속 느낌 도장 팁과 예상 가격을 안내합니다.',
            name: '트로피·기념품',
            cardDesc: '대회·사내 시상용 맞춤 트로피, 기념품. 매끈한 레진 SLA 추천',
            eyebrow: 'Use Case · Trophies',
            h1: '트로피·기념품을',
            h1Accent: '세상에 하나뿐인 형태로',
            intro:
                '기성품 트로피 대신 행사·브랜드에 맞는 모양으로 만들면 기억에 남는 기념품이 됩니다. 매끈한 표면이 중요한 경우가 많아 레진 출력 후 도장하는 방식을 주로 권장합니다.',
            recommendations: [
                {
                    label: '추천',
                    method: 'SLA 레진',
                    materials: 'Standard 레진',
                    why: '표면이 매끈해 금·은 도장이나 펄 도장 결과가 깔끔합니다.',
                },
                {
                    label: '대량·저예산',
                    method: 'FDM',
                    materials: 'PLA (실크 컬러)',
                    why: '광택이 있는 실크 PLA는 도장 없이도 금속 느낌을 낼 수 있어 수량이 많은 기념품에 좋습니다.',
                },
            ],
            checklist: [
                '받침(베이스)은 넓고 무겁게 설계해야 쓰러지지 않습니다. 높이의 1/2 이상 폭을 권장합니다.',
                '수상자 이름·문구는 별도 명판으로 출력하거나 각인 형태로 넣으면 개별 제작이 쉽습니다.',
                '높은 트로피는 몸체와 받침을 나눠 출력하고 조립하면 서포트 자국이 줄어듭니다.',
                '행사일이 정해져 있다면 도장·후가공 기간을 포함해 여유 있게 주문하세요.',
            ],
            exampleLabel: '높이 150mm 트로피 1개 (SLA 레진)',
            faqs: [
                {
                    q: '금색 트로피처럼 만들 수 있나요?',
                    a: '레진 출력 후 금속 도장으로 표현할 수 있습니다. 도장이 필요하면 견적 요청사항에 적어주세요. 도장 없이 실크 PLA로 금속 느낌을 내는 방법도 있습니다.',
                },
                {
                    q: '수상자별로 이름을 다르게 넣을 수 있나요?',
                    a: '이름 부분만 바꾼 파일을 여러 개 올리시거나, 명판을 따로 출력해 붙이는 방식으로 가능합니다.',
                },
                {
                    q: '로고만 있는데 트로피 디자인도 해주시나요?',
                    a: '네, 모델링 서비스로 로고를 활용한 트로피 디자인부터 진행할 수 있습니다.',
                },
            ],
            related: [
                { href: '/services/modeling', label: '3D 모델링 서비스' },
                { href: '/services/sla', label: 'SLA 레진 출력' },
                { href: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin', label: '레진 종류별 비교' },
            ],
            secondaryCta: { href: '/services/modeling', label: '트로피 디자인 의뢰' },
        },
        en: {
            title: '3D Printing Trophies, Awards & Keepsakes | Custom Trophies',
            description:
                'Print one-of-a-kind trophies for competitions, company awards and keepsakes. Resin vs FDM, base design, metallic paint tips and a sample price.',
            name: 'Trophies & Awards',
            cardDesc: 'Custom trophies for events and company awards. Smooth SLA resin recommended',
            eyebrow: 'Use Case · Trophies',
            h1: 'Trophies and keepsakes',
            h1Accent: 'in a shape that is truly yours',
            intro:
                'A trophy shaped around your event or brand is far more memorable than an off-the-shelf one. A smooth surface usually matters, so we generally recommend printing in resin and painting.',
            recommendations: [
                {
                    label: 'Recommended',
                    method: 'SLA resin',
                    materials: 'Standard resin',
                    why: 'A smooth surface gives clean results with gold, silver or pearl paint.',
                },
                {
                    label: 'Volume / budget',
                    method: 'FDM',
                    materials: 'PLA (silk colors)',
                    why: 'Glossy silk PLA looks metallic without paint, which suits larger keepsake runs.',
                },
            ],
            checklist: [
                'Make the base wide and heavy so it does not tip over; at least half the height in width is a good rule.',
                'Print winner names on a separate plate or engrave them so each piece is easy to personalize.',
                'Print tall trophies as body and base separately to reduce support marks.',
                'If the event date is fixed, order early enough to cover painting and finishing.',
            ],
            exampleLabel: 'One 150mm-tall trophy (SLA resin)',
            faqs: [
                {
                    q: 'Can it look like a gold trophy?',
                    a: 'Yes, by painting the resin print with metallic paint; add it to the quote notes. Silk PLA can also look metallic without paint.',
                },
                {
                    q: 'Can each trophy have a different name?',
                    a: 'Upload one file per name, or print name plates separately and attach them.',
                },
                {
                    q: 'I only have a logo. Can you design the trophy?',
                    a: 'Yes. Our modeling service can design a trophy around your logo.',
                },
            ],
            related: [
                { href: '/services/modeling', label: '3D modeling service' },
                { href: '/services/sla', label: 'SLA resin printing' },
                { href: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin', label: 'Resin types compared' },
            ],
            secondaryCta: { href: '/services/modeling', label: 'Request a trophy design' },
        },
    },
]

export function getUseCaseBySlug(slug: string): UseCaseConfig | undefined {
    return USE_CASES.find((u) => u.slug === slug)
}

export function getUseCaseContent(config: UseCaseConfig, locale: string): getUseCaseContent {
    return locale === 'en' ? config.en : config.ko
}

/** 본문 사진 그리드와 og:image가 같은 조합을 쓰도록 공용 */
export function pickUseCaseWorkPhotos(config: UseCaseConfig, locale: string) {
    return pickWorkPhotos({ seed: `use-case:${config.slug}`, locale, focus: config.focus })
}

/** 가격 계산기 프리셋 링크 */
export function buildUseCaseCalculatorHref(config: UseCaseConfig): string {
    const { w, d, h, shape, method, qty } = config.example
    const params = new URLSearchParams({
        w: String(w),
        d: String(d),
        h: String(h),
        shape,
        method,
        qty: String(qty),
    })
    return `/price-calculator?${params.toString()}`
}

/** 견적 페이지 진입 링크 (출처·주제는 견적에 기록되고 배너로 표시됨) */
export function buildUseCaseQuoteHref(config: UseCaseConfig, locale: string): string {
    const params = new URLSearchParams({
        entry: 'file',
        guide_source: `use_case_${config.slug.replace(/-/g, '_')}`,
        guide_topic: getUseCaseContent(config, locale).name,
    })
    return `/quote?${params.toString()}`
}

/**
 * 서비스 → 관련 활용 사례 (주제 클러스터 내부 링크: 서비스 ↔ 활용 사례 ↔ 가이드 ↔ 견적).
 * 서비스 페이지 하단 "관련 활용 사례"에 쓰인다. 슬러그는 USE_CASES에 있는 값만.
 */
const SERVICE_USE_CASES: Record<string, string[]> = {
    printing: ['figures-miniatures', 'electronics-enclosures', 'replacement-parts'],
    prototype: ['electronics-enclosures', 'jigs-fixtures', 'architectural-models'],
    fdm: ['jigs-fixtures', 'replacement-parts', 'electronics-enclosures'],
    sla: ['figures-miniatures', 'trophies-awards', 'architectural-models'],
    graduation: ['architectural-models', 'cosplay-props', 'figures-miniatures'],
    capstone: ['electronics-enclosures', 'jigs-fixtures', 'replacement-parts'],
    'small-batch': ['logos-signage', 'trophies-awards', 'jigs-fixtures'],
    modeling: ['replacement-parts', 'cosplay-props', 'logos-signage'],
    'photo-to-3d': ['figures-miniatures', 'cosplay-props', 'trophies-awards'],
}

export function getServiceUseCases(serviceSlug: string, locale: string): { href: string; name: string; desc: string }[] {
    return (SERVICE_USE_CASES[serviceSlug] ?? []).flatMap((slug) => {
        const config = getUseCaseBySlug(slug)
        if (!config) return []
        const c = getUseCaseContent(config, locale)
        return [{ href: config.path, name: c.name, desc: c.cardDesc }]
    })
}
