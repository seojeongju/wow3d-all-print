/** 서비스 랜딩 페이지 인포그래픽 공통 타입 */

export type InfoIcon =
    | 'idea'
    | 'modeling'
    | 'quote'
    | 'print'
    | 'delivery'
    | 'docs'
    | 'schedule'
    | 'photo'
    | 'scan'
    | 'wallet'
    | 'finish'
    | 'unit'
    | 'wall'
    | 'mesh'
    | 'split'
    | 'support'
    | 'repeat'
    | 'focus'
    | 'sun'
    | 'images'
    | 'resin'
    | 'gauge'
    | 'file'
    | 'eye'
    | 'factory'
    | 'layers'
    | 'upload'
    | 'saving'

export type InfoTone = 'teal' | 'sky' | 'amber' | 'violet'

export type ServiceInfographicContent = {
    stats: { value: string; label: string; sub: string }[]
    scope: { heading: string; items: { icon: InfoIcon; title: string; body: string }[] }
    process: {
        eyebrow: string
        heading: string
        body: string
        startLabel: string
        outputLabel: string
        steps: {
            icon: InfoIcon
            title: string
            body: string
            output: string
            /** 이 단계에서 시작하는 고객 유형 */
            entry?: { label: string; href: string; cta: string }
        }[]
    }
    /** 마감일 역산 일정 (캡스톤·졸업작품) */
    timeline?: {
        eyebrow: string
        heading: string
        body: string
        /** 축 눈금 (마감일 기준 남은 일수, 큰 값부터) */
        ticks: number[]
        /** 모바일에서도 표시할 눈금 (나머지는 좁은 화면에서 숨김) */
        mobileTicks: number[]
        dayLabel: (d: number) => string
        bars: { label: string; detail: string; from: number; to: number; tone: InfoTone }[]
        deadline: { day: number; label: string }
        note: string
    }
    match: {
        eyebrow: string
        heading: string
        body: string
        metrics: string[]
        note: string
        cards: {
            purpose: string
            method: string
            materials: string
            why: string
            /** metrics 순서와 같은 1~5 점수 */
            scores: number[]
            tone: Exclude<InfoTone, 'amber'>
        }[]
    }
    /** 결제 증빙 서류 흐름 (캡스톤) */
    docs?: {
        eyebrow: string
        heading: string
        body: string
        items: { step: string; title: string; when: string; body: string }[]
        note: string
    }
    /** 출력 전 파일 점검표 (졸업작품) */
    checklist?: {
        eyebrow: string
        heading: string
        body: string
        items: { icon: InfoIcon; title: string; body: string; badge: string }[]
        cta: { label: string; href: string; icon?: InfoIcon }
        guide?: { label: string; href: string }
    }
    /** 입력 묶음 → 결과 흐름 + 팁 패널 (묶음 주문, 파일 형식별 처리 등) */
    team?: {
        eyebrow: string
        heading: string
        body: string
        groups: { label: string; files: string[]; result: string }[]
        tipsHeading: string
        tips: string[]
        /** 팁 패널 제목 아이콘 (기본: 저금통) */
        tipsIcon?: InfoIcon
        tipIcons?: InfoIcon[]
        /** 입력 칩 아이콘 (기본: 파일) */
        chipIcon?: InfoIcon
    }
}
