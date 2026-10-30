/**
 * 서비스 랜딩 Service 스키마용 메타 — SEO/AEO용 구조화 속성만 담는다.
 * 화면 문구는 seo-service-pages*.ts / guide-key-answers.ts와 맞춘다.
 */

export type ServiceSchemaMeta = {
    serviceType: { ko: string; en: string }
    audience: { ko: string; en: string }
    channelPath: string
    relatedHowToPath?: string
    catalogItems: { ko: string[]; en: string[] }
}

export const SERVICE_SCHEMA_META: Record<string, ServiceSchemaMeta> = {
    printing: {
        serviceType: { ko: '3D프린팅출력 · 3D프린터출력 대행', en: '3D printing service bureau' },
        audience: { ko: '시제품·부품 출력이 필요한 개인·기업', en: 'Individuals and businesses needing printed parts' },
        channelPath: '/quote',
        relatedHowToPath: '/quote',
        catalogItems: {
            ko: ['FDM 출력', 'SLA 출력', 'DLP 출력', '파일 자동견적', 'STEP 자동 변환'],
            en: ['FDM printing', 'SLA printing', 'DLP printing', 'Instant file quote', 'STEP auto-convert'],
        },
    },
    prototype: {
        serviceType: { ko: '3D프린팅 시제품 · 목업 제작', en: '3D printed prototypes and mockups' },
        audience: { ko: '디자인 검증·투자 샘플이 필요한 제품팀', en: 'Product teams validating design or investor samples' },
        channelPath: '/quote',
        catalogItems: {
            ko: ['외관 시제품 (SLA/DLP)', '기능 시제품 (FDM)', '후가공(연마·도장)'],
            en: ['Visual prototypes (SLA/DLP)', 'Functional prototypes (FDM)', 'Finishing (sanding, paint)'],
        },
    },
    fdm: {
        serviceType: { ko: 'FDM 3D프린팅 출력 대행', en: 'FDM 3D printing service' },
        audience: { ko: '기능 부품·대형 출력이 필요한 고객', en: 'Customers needing functional or large parts' },
        channelPath: '/quote',
        catalogItems: {
            ko: ['PLA', 'ABS', 'PETG', 'TPU', '대형 분할 출력'],
            en: ['PLA', 'ABS', 'PETG', 'TPU', 'Split large prints'],
        },
    },
    sla: {
        serviceType: { ko: 'SLA·레진 정밀 3D프린팅', en: 'SLA/resin precision 3D printing' },
        audience: { ko: '표면 품질·미세 디테일이 중요한 고객', en: 'Customers needing fine surface and detail' },
        channelPath: '/quote',
        catalogItems: {
            ko: ['Standard 레진', 'Tough 레진', 'Clear 레진', 'Flexible 레진', '세척·경화'],
            en: ['Standard resin', 'Tough resin', 'Clear resin', 'Flexible resin', 'Wash and cure'],
        },
    },
    graduation: {
        serviceType: { ko: '졸업작품 3D프린팅 출력', en: 'Graduation project 3D printing' },
        audience: { ko: '졸업작품·전시 일정이 있는 대학생', en: 'Students with graduation or exhibition deadlines' },
        channelPath: '/quote',
        catalogItems: {
            ko: ['자동견적', '전시용 후가공', '파일 점검 안내'],
            en: ['Instant quote', 'Exhibition finishing', 'File check guidance'],
        },
    },
    capstone: {
        serviceType: { ko: '캡스톤디자인 시제품 제작', en: 'Capstone design prototyping' },
        audience: { ko: '캡스톤·산학협력 프로젝트를 진행하는 팀', en: 'Capstone and industry-academia project teams' },
        channelPath: '/quote',
        relatedHowToPath: '/quote',
        catalogItems: {
            ko: ['아이디어 컨설팅', '3D 모델링 대행', '시제품 출력', '견적서·거래명세서·세금계산서'],
            en: ['Idea consulting', '3D modeling', 'Prototype printing', 'Quote, statement, tax invoice'],
        },
    },
    'small-batch': {
        serviceType: { ko: '3D프린팅 소량생산 · 맞춤 부품', en: '3D printing small-batch and custom parts' },
        audience: { ko: '금형 없이 소량·반복 제작이 필요한 고객', en: 'Customers needing small lots without tooling' },
        channelPath: '/quote',
        catalogItems: {
            ko: ['1개부터 소량 로트', '반복 주문', 'FDM·SLA·DLP 조합'],
            en: ['Small lots from 1 unit', 'Repeat orders', 'FDM/SLA/DLP mix'],
        },
    },
    modeling: {
        serviceType: { ko: '3D 모델링 의뢰 · 출력용 STL 제작', en: '3D modeling for printable STL' },
        audience: { ko: '도면·스케치만 있는 고객', en: 'Customers with drawings or sketches only' },
        channelPath: '/expert',
        catalogItems: {
            ko: ['도면 기반 모델링', '스케치·사진 기반 모델링', '출력용 STL·3MF 전달'],
            en: ['Drawing-based modeling', 'Sketch/photo modeling', 'Printable STL/3MF delivery'],
        },
    },
    'photo-to-3d': {
        serviceType: { ko: '사진(이미지)→AI 3D 모델링 · 자동견적', en: 'Photo-to-AI 3D modeling and quote' },
        audience: { ko: '3D 파일 없이 사진만 있는 고객', en: 'Customers with photos but no 3D file' },
        channelPath: '/quote?entry=photo',
        relatedHowToPath: '/quote',
        catalogItems: {
            ko: ['JPG·PNG → STL', '멀티뷰 추가 사진', '자동견적·주문 연계'],
            en: ['JPG/PNG to STL', 'Multi-view extras', 'Quote and order flow'],
        },
    },
    'name-tag-studio': {
        serviceType: { ko: '네임택 스튜디오 · 3D 이름표 제작', en: 'Name Tag Studio · 3D name tag design' },
        audience: { ko: '문구 중심 이름표·명찰·인식표가 필요한 고객', en: 'Customers needing text-first tags and nameplates' },
        channelPath: '/maker',
        relatedHowToPath: '/guides/name-tag-studio',
        catalogItems: {
            ko: ['문구·폰트·판 편집', '획 0.8mm 검사', 'STL·자동견적 연계'],
            en: ['Text, font, plate editing', '0.8 mm stroke checks', 'STL and live quote handoff'],
        },
    },
    'ai-3d-maker': {
        serviceType: { ko: 'AI 3D Maker · 로고 2.5D 돌출', en: 'AI 3D Maker · logo 2.5D extrusion' },
        audience: { ko: '로고·스케치·배지·키캡 2.5D가 필요한 고객', en: 'Customers needing logo, sketch, badge or keycap 2.5D' },
        channelPath: '/maker?mode=draw',
        relatedHowToPath: '/guides/ai-3d-maker-2-5d',
        catalogItems: {
            ko: ['로고·SVG 실루엣', '배지·키캡 템플릿', 'STL·자동견적 연계'],
            en: ['Logo/SVG silhouette', 'Badge and keycap templates', 'STL and live quote handoff'],
        },
    },
}

export function getServiceSchemaMeta(slug: string): ServiceSchemaMeta | null {
    return SERVICE_SCHEMA_META[slug] ?? null
}
