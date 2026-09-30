/**
 * 회원 활동 단계 (관리자 전용 내부 구분, 별도 저장 없이 활동 기록에서 계산)
 * 가입만 → 견적 확인 → 견적 저장 → 장바구니 → 주문 완료
 */
export const MEMBER_STAGES = ['joined', 'estimated', 'saved', 'cart', 'ordered'] as const;
export type MemberStage = (typeof MEMBER_STAGES)[number];

export const MEMBER_STAGE_LABELS: Record<MemberStage, string> = {
    joined: '가입만',
    estimated: '견적 확인',
    saved: '견적 저장',
    cart: '장바구니',
    ordered: '주문 완료',
};

export function isMemberStage(v: string | null | undefined): v is MemberStage {
    return !!v && (MEMBER_STAGES as readonly string[]).includes(v);
}

/** users 테이블 행 기준 단계 계산 SQL (userIdColumn: 바깥 쿼리의 사용자 id 컬럼) */
export function memberStageSql(userIdColumn = 'users.id'): string {
    return `CASE
        WHEN EXISTS (SELECT 1 FROM orders o WHERE o.user_id = ${userIdColumn} AND o.status != 'cancelled') THEN 'ordered'
        WHEN EXISTS (SELECT 1 FROM cart c WHERE c.user_id = ${userIdColumn}) THEN 'cart'
        WHEN EXISTS (SELECT 1 FROM quotes q WHERE q.user_id = ${userIdColumn} AND q.total_price > 0) THEN 'saved'
        WHEN EXISTS (SELECT 1 FROM quote_estimate_logs e WHERE e.user_id = ${userIdColumn}) THEN 'estimated'
        ELSE 'joined'
    END`;
}

export function estimateCountSql(userIdColumn = 'users.id'): string {
    return `(SELECT COUNT(*) FROM quote_estimate_logs e WHERE e.user_id = ${userIdColumn})`;
}
