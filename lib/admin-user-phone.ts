/**
 * 관리자 회원 목록용 연락처.
 * users.phone이 비어 있으면 최근 주문의 수령인 연락처를 표시한다.
 * (주문 접수 시 비어 있던 users.phone은 주문자·수령인 번호로 동기화한다.)
 */
export function adminUserDisplayPhoneSql(userIdColumn = 'users.id'): string {
    return `COALESCE(
        NULLIF(TRIM(users.phone), ''),
        (
            SELECT NULLIF(TRIM(o.recipient_phone), '')
            FROM orders o
            WHERE o.user_id = ${userIdColumn}
              AND TRIM(COALESCE(o.recipient_phone, '')) != ''
            ORDER BY o.created_at DESC, o.id DESC
            LIMIT 1
        )
    )`
}

/** 회원 검색 시 users.phone + 주문 수령인 연락처까지 포함 */
export function adminUserPhoneSearchSql(): string {
    return `(
        COALESCE(users.phone, '') LIKE ?
        OR EXISTS (
            SELECT 1 FROM orders o
            WHERE o.user_id = users.id
              AND COALESCE(o.recipient_phone, '') LIKE ?
        )
    )`
}
