/**
 * 관리자가 아직 손대지 않은 견적 요청(주문).
 * 접수대기 상태이면서 견적서 미발송 · 수정견적 미작성인 건.
 * orders 테이블 별칭 `o` 기준.
 */
export const UNREVIEWED_QUOTE_SQL =
    "o.status = 'pending' AND o.quotation_sent_at IS NULL AND IFNULL(o.has_expert_quote, 0) = 0";

/** 견적 관리 목록 필터 쿼리 값 (`/admin/quotes?review=unreviewed`) */
export const QUOTE_REVIEW_UNREVIEWED = 'unreviewed';
