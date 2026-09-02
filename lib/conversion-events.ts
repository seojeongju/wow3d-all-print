export const CONVERSION_EVENT_CATEGORY = {
    HERO: 'hero',
    QUOTE: 'quote',
    CHECKOUT: 'checkout',
} as const;

export type ConversionEventCategory =
    (typeof CONVERSION_EVENT_CATEGORY)[keyof typeof CONVERSION_EVENT_CATEGORY];

/** 메인 히어로 전환 추적 이벤트 */
export const HERO_CONVERSION_EVENTS = {
    VIEW: 'hero_view',
    CTA_FILE: 'hero_cta_file',
    CTA_PHOTO: 'hero_cta_photo',
    FORK_FILE: 'hero_fork_file',
    FORK_PHOTO: 'hero_fork_photo',
    DROP_FILE: 'hero_drop_file',
    DROP_PHOTO: 'hero_drop_photo',
    DROP_ZONE_CLICK_FILE: 'hero_drop_zone_click_file',
    DROP_ZONE_CLICK_PHOTO: 'hero_drop_zone_click_photo',
    PANEL_CTA_FILE: 'hero_panel_cta_file',
    PANEL_CTA_PHOTO: 'hero_panel_cta_photo',
    SAMPLE_TRY: 'hero_sample_try',
    TERTIARY: 'hero_tertiary',
} as const;

/** /quote 퍼널 이벤트 */
export const QUOTE_CONVERSION_EVENTS = {
    PAGE_VIEW: 'quote_page_view',
    ENTRY_FILE: 'quote_entry_file',
    ENTRY_PHOTO: 'quote_entry_photo',
    FILE_UPLOADED: 'quote_file_uploaded',
    ANALYSIS_COMPLETE: 'quote_analysis_complete',
    ESTIMATE_VIEW: 'quote_estimate_view',
    ADD_TO_CART: 'quote_add_to_cart',
} as const;

/** 결제·주문 이벤트 */
export const CHECKOUT_CONVERSION_EVENTS = {
    START: 'checkout_start',
    ORDER_COMPLETE: 'order_complete',
} as const;

export type HeroConversionEventName =
    (typeof HERO_CONVERSION_EVENTS)[keyof typeof HERO_CONVERSION_EVENTS];

export const ALLOWED_CONVERSION_EVENT_NAMES = new Set<string>([
    ...Object.values(HERO_CONVERSION_EVENTS),
    ...Object.values(QUOTE_CONVERSION_EVENTS),
    ...Object.values(CHECKOUT_CONVERSION_EVENTS),
]);

export type FunnelEventRow = {
    eventName: string;
    label: string;
    count: number;
    sessions: number;
};

/** @deprecated FunnelEventRow 사용 */
export type HeroFunnelEventRow = FunnelEventRow;

export type HeroFunnelSummary = {
    views: number;
    fileIntent: number;
    photoIntent: number;
    sampleTry: number;
    fileIntentRate: number;
    photoIntentRate: number;
};

export type QuoteFunnelSummary = {
    pageViews: number;
    fileEntries: number;
    photoEntries: number;
    fileUploaded: number;
    analysisComplete: number;
    estimateView: number;
    addToCart: number;
    /** estimateView / pageViews (%) */
    estimateRate: number;
    /** addToCart / pageViews (%) */
    cartRate: number;
};

export type ConversionFunnelTrendPoint = {
    date: string;
    heroView: number;
    quotePageView: number;
    quoteEstimate: number;
    quoteAddToCart: number;
    orderComplete: number;
};

export const HERO_EVENT_LABELS: Record<string, string> = {
    [HERO_CONVERSION_EVENTS.VIEW]: '히어로 노출',
    [HERO_CONVERSION_EVENTS.CTA_FILE]: '3D 파일 CTA',
    [HERO_CONVERSION_EVENTS.CTA_PHOTO]: '사진 CTA',
    [HERO_CONVERSION_EVENTS.FORK_FILE]: 'Fork · 3D 파일',
    [HERO_CONVERSION_EVENTS.FORK_PHOTO]: 'Fork · 사진',
    [HERO_CONVERSION_EVENTS.DROP_FILE]: 'Drop · 3D 파일',
    [HERO_CONVERSION_EVENTS.DROP_PHOTO]: 'Drop · 사진',
    [HERO_CONVERSION_EVENTS.DROP_ZONE_CLICK_FILE]: 'Drop Zone 클릭 · 3D',
    [HERO_CONVERSION_EVENTS.DROP_ZONE_CLICK_PHOTO]: 'Drop Zone 클릭 · 사진',
    [HERO_CONVERSION_EVENTS.PANEL_CTA_FILE]: '패널 CTA · 3D',
    [HERO_CONVERSION_EVENTS.PANEL_CTA_PHOTO]: '패널 CTA · 사진',
    [HERO_CONVERSION_EVENTS.SAMPLE_TRY]: '샘플 견적 체험',
    [HERO_CONVERSION_EVENTS.TERTIARY]: '보조 링크',
};

export const QUOTE_EVENT_LABELS: Record<string, string> = {
    [QUOTE_CONVERSION_EVENTS.PAGE_VIEW]: '견적 페이지 진입',
    [QUOTE_CONVERSION_EVENTS.ENTRY_FILE]: '3D 파일 경로 선택',
    [QUOTE_CONVERSION_EVENTS.ENTRY_PHOTO]: '사진 경로 선택',
    [QUOTE_CONVERSION_EVENTS.FILE_UPLOADED]: '파일 업로드',
    [QUOTE_CONVERSION_EVENTS.ANALYSIS_COMPLETE]: '분석 완료',
    [QUOTE_CONVERSION_EVENTS.ESTIMATE_VIEW]: '견적 금액 확인',
    [QUOTE_CONVERSION_EVENTS.ADD_TO_CART]: '장바구니 담기',
};

export const CHECKOUT_EVENT_LABELS: Record<string, string> = {
    [CHECKOUT_CONVERSION_EVENTS.START]: '결제 시작',
    [CHECKOUT_CONVERSION_EVENTS.ORDER_COMPLETE]: '주문 완료',
};

export const ALL_FUNNEL_EVENT_LABELS: Record<string, string> = {
    ...HERO_EVENT_LABELS,
    ...QUOTE_EVENT_LABELS,
    ...CHECKOUT_EVENT_LABELS,
};

const FILE_INTENT_EVENTS = new Set<string>([
    HERO_CONVERSION_EVENTS.CTA_FILE,
    HERO_CONVERSION_EVENTS.FORK_FILE,
    HERO_CONVERSION_EVENTS.DROP_FILE,
    HERO_CONVERSION_EVENTS.DROP_ZONE_CLICK_FILE,
    HERO_CONVERSION_EVENTS.PANEL_CTA_FILE,
]);

const PHOTO_INTENT_EVENTS = new Set<string>([
    HERO_CONVERSION_EVENTS.CTA_PHOTO,
    HERO_CONVERSION_EVENTS.FORK_PHOTO,
    HERO_CONVERSION_EVENTS.DROP_PHOTO,
    HERO_CONVERSION_EVENTS.DROP_ZONE_CLICK_PHOTO,
    HERO_CONVERSION_EVENTS.PANEL_CTA_PHOTO,
]);

export function buildHeroFunnelSummary(rows: FunnelEventRow[]): HeroFunnelSummary {
    const byName = new Map(rows.map((r) => [r.eventName, r]));
    const views = byName.get(HERO_CONVERSION_EVENTS.VIEW)?.sessions ?? 0;
    const fileIntent = rows
        .filter((r) => FILE_INTENT_EVENTS.has(r.eventName))
        .reduce((sum, r) => sum + r.count, 0);
    const photoIntent = rows
        .filter((r) => PHOTO_INTENT_EVENTS.has(r.eventName))
        .reduce((sum, r) => sum + r.count, 0);
    const sampleTry = byName.get(HERO_CONVERSION_EVENTS.SAMPLE_TRY)?.count ?? 0;

    return {
        views,
        fileIntent,
        photoIntent,
        sampleTry,
        fileIntentRate: views > 0 ? Math.round((fileIntent / views) * 1000) / 10 : 0,
        photoIntentRate: views > 0 ? Math.round((photoIntent / views) * 1000) / 10 : 0,
    };
}

export function buildQuoteFunnelSummary(rows: FunnelEventRow[]): QuoteFunnelSummary {
    const byName = new Map(rows.map((r) => [r.eventName, r]));
    const pageViews = byName.get(QUOTE_CONVERSION_EVENTS.PAGE_VIEW)?.sessions ?? 0;
    const estimateView = byName.get(QUOTE_CONVERSION_EVENTS.ESTIMATE_VIEW)?.sessions ?? 0;
    const addToCart = byName.get(QUOTE_CONVERSION_EVENTS.ADD_TO_CART)?.count ?? 0;

    return {
        pageViews,
        fileEntries: byName.get(QUOTE_CONVERSION_EVENTS.ENTRY_FILE)?.count ?? 0,
        photoEntries: byName.get(QUOTE_CONVERSION_EVENTS.ENTRY_PHOTO)?.count ?? 0,
        fileUploaded: byName.get(QUOTE_CONVERSION_EVENTS.FILE_UPLOADED)?.count ?? 0,
        analysisComplete: byName.get(QUOTE_CONVERSION_EVENTS.ANALYSIS_COMPLETE)?.sessions ?? 0,
        estimateView,
        addToCart,
        estimateRate: pageViews > 0 ? Math.round((estimateView / pageViews) * 1000) / 10 : 0,
        cartRate: pageViews > 0 ? Math.round((addToCart / pageViews) * 1000) / 10 : 0,
    };
}

const TREND_EVENT_MAP: Record<keyof Omit<ConversionFunnelTrendPoint, 'date'>, string> = {
    heroView: HERO_CONVERSION_EVENTS.VIEW,
    quotePageView: QUOTE_CONVERSION_EVENTS.PAGE_VIEW,
    quoteEstimate: QUOTE_CONVERSION_EVENTS.ESTIMATE_VIEW,
    quoteAddToCart: QUOTE_CONVERSION_EVENTS.ADD_TO_CART,
    orderComplete: CHECKOUT_CONVERSION_EVENTS.ORDER_COMPLETE,
};

/** 일별 raw rows → 차트 포인트 (빈 날짜 0 채움) */
export function buildConversionFunnelTrend(
    dailyRows: { date: string; eventName: string; count: number }[],
    dayCount = 14,
): ConversionFunnelTrendPoint[] {
    const byDate = new Map<string, ConversionFunnelTrendPoint>();

    for (let i = dayCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        byDate.set(key, {
            date: key,
            heroView: 0,
            quotePageView: 0,
            quoteEstimate: 0,
            quoteAddToCart: 0,
            orderComplete: 0,
        });
    }

    for (const row of dailyRows) {
        const point = byDate.get(row.date);
        if (!point) continue;
        for (const [field, eventName] of Object.entries(TREND_EVENT_MAP) as [
            keyof Omit<ConversionFunnelTrendPoint, 'date'>,
            string,
        ][]) {
            if (row.eventName === eventName) {
                point[field] += row.count;
            }
        }
    }

    return Array.from(byDate.values());
}

export function formatFunnelDateLabel(isoDate: string): string {
    const [, m, d] = isoDate.split('-');
    return `${Number(m)}/${Number(d)}`;
}
