/**
 * 견적 → 방문 세션 유입 경로 귀속 SQL (quotes 별칭 `q` 기준)
 *
 * 회원 견적은 quotes.session_id 없이 저장되므로(비회원 견적 목록 노출 방지),
 * 같은 회원의 방문 기록 중 견적 저장 시각에 가장 가까운(직전 우선) 세션으로 귀속한다.
 */
export const QUOTE_ATTRIBUTION_SESSION_SQL = `COALESCE(
    NULLIF(TRIM(q.session_id), ''),
    (
        SELECT ut.session_id FROM traffic_logs ut
        WHERE q.user_id IS NOT NULL AND ut.user_id = q.user_id AND ut.session_id IS NOT NULL
        ORDER BY CASE WHEN ut.created_at <= q.created_at THEN 0 ELSE 1 END,
            ABS(julianday(ut.created_at) - julianday(q.created_at))
        LIMIT 1
    )
)`;

/**
 * 세션별 첫 방문 기록(first-touch) 1행.
 * created_at은 초 단위라 동률이 생기므로 id 최솟값으로 고른다.
 */
export const FIRST_TOUCH_TRAFFIC_SQL = `(
    SELECT tl.session_id, tl.source, tl.medium
    FROM traffic_logs tl
    INNER JOIN (
        SELECT MIN(id) AS first_id FROM traffic_logs
        WHERE session_id IS NOT NULL
        GROUP BY session_id
    ) f ON f.first_id = tl.id
)`;

/** 방문 기록과 연결되지 않은 견적의 유입 경로 값 */
export const UNKNOWN_TRAFFIC_SOURCE = 'unknown';

const SOURCE_LABELS: Record<string, string> = {
    [UNKNOWN_TRAFFIC_SOURCE]: '경로 미상',
    direct: 'Direct',
    naver: 'Naver',
    google: 'Google',
    kakao: 'Kakao',
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'YouTube',
    referral: 'Referral',
};

export function formatTrafficSourceLabel(source: string | null | undefined): string {
    const key = (source || '').trim();
    if (!key) return SOURCE_LABELS[UNKNOWN_TRAFFIC_SOURCE];
    return SOURCE_LABELS[key.toLowerCase()] ?? key;
}
