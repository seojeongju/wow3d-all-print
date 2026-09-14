/**
 * 관리자 대시보드 차트 팔레트
 * — 어스톤 그린 / 세이지 / 샌드 / 오커 (레퍼런스 대시보드 톤)
 */
export const ADMIN_CHART = {
    forest: '#265C43',
    sage: '#5A906E',
    mist: '#A3C1AD',
    sand: '#CDBE9A',
    ochre: '#B07D31',
    overdue: '#A62626',
    cream: '#FDFCF8',
    ink: '#1A1A1A',
    muted: '#757575',
    grid: 'rgba(38, 92, 67, 0.18)',
    hit: 'rgba(38, 92, 67, 0.14)',
    tableHeader: '#265C43',
    tableHeaderDeep: '#1E4A36',
    lineStroke: '#0f0f0f',
} as const;

/** 막대/도넛 세그먼트용 순차 색상 (5단계) */
export const ADMIN_CHART_SEQUENCE = [
    ADMIN_CHART.forest,
    ADMIN_CHART.sage,
    ADMIN_CHART.mist,
    ADMIN_CHART.sand,
    ADMIN_CHART.ochre,
] as const;

export const ADMIN_SALES_SERIES_COLORS = {
    amount: ADMIN_CHART.forest,
    paidAmount: ADMIN_CHART.sage,
    outstandingAmount: ADMIN_CHART.sand,
    orderCount: ADMIN_CHART.ochre,
} as const;

export const ADMIN_VISITOR_SERIES_COLORS = {
    pageViews: ADMIN_CHART.forest,
    uniqueSessions: ADMIN_CHART.sage,
    memberSessions: ADMIN_CHART.mist,
    quotePageViews: ADMIN_CHART.ochre,
} as const;

export const ADMIN_FUNNEL_SERIES_COLORS = {
    heroView: ADMIN_CHART.forest,
    quotePageView: ADMIN_CHART.sage,
    quoteEstimate: ADMIN_CHART.mist,
    quoteAddToCart: ADMIN_CHART.sand,
    orderComplete: ADMIN_CHART.ochre,
} as const;
