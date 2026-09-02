export const CONVERSION_EVENT_CATEGORY = {
    HERO: 'hero',
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

export type HeroConversionEventName =
    (typeof HERO_CONVERSION_EVENTS)[keyof typeof HERO_CONVERSION_EVENTS];

export const ALLOWED_CONVERSION_EVENT_NAMES = new Set<string>([
    ...Object.values(HERO_CONVERSION_EVENTS),
]);

export type HeroFunnelEventRow = {
    eventName: string;
    label: string;
    count: number;
    sessions: number;
};

export type HeroFunnelSummary = {
    /** hero_view 세션 수 (근사 히어로 도달) */
    views: number;
    /** 3D 파일 관련 intent 합계 */
    fileIntent: number;
    /** 사진 관련 intent 합계 */
    photoIntent: number;
    sampleTry: number;
    /** fileIntent / views (%) */
    fileIntentRate: number;
    /** photoIntent / views (%) */
    photoIntentRate: number;
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

export function buildHeroFunnelSummary(rows: HeroFunnelEventRow[]): HeroFunnelSummary {
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
