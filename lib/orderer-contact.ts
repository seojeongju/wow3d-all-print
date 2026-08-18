/** 결제 시 customer_note 에 넣는 주문자 한 줄 */
export const ORDERER_NOTE_PREFIX = '[주문자 정보]'

const ORDERER_NOTE_RE = /\[주문자 정보\]\s*이름:\s*(.*?)\s*\/\s*연락처:\s*([^\n]+)/

export type ParsedOrdererInfo = {
    name: string
    phone: string
}

export function parseOrdererInfoFromNote(note?: string | null): ParsedOrdererInfo | null {
    const raw = String(note || '')
    const m = raw.match(ORDERER_NOTE_RE)
    if (!m) return null
    const name = m[1].trim()
    const phone = m[2].trim()
    if (!name && !phone) return null
    return { name, phone }
}

export function stripOrdererInfoFromNote(note?: string | null): string {
    const raw = String(note || '')
    return raw.replace(ORDERER_NOTE_RE, '').replace(/^\s*\n+/, '').trim()
}

export function formatOrdererNoteLine(name: string, phone: string): string {
    return `${ORDERER_NOTE_PREFIX} 이름: ${name.trim()} / 연락처: ${phone.trim()}`
}

/** 관리자 표시용: 주문 컬럼 → 메모 파싱 → 회원 프로필 순 */
export function resolveOrdererPhone(order: {
    orderer_phone?: string | null
    user_phone?: string | null
    customer_note?: string | null
}): string {
    const fromCol = String(order.orderer_phone || '').trim()
    if (fromCol) return fromCol
    const parsed = parseOrdererInfoFromNote(order.customer_note)
    if (parsed?.phone) return parsed.phone
    return String(order.user_phone || '').trim()
}

export function resolveOrdererName(order: {
    orderer_name?: string | null
    user_name?: string | null
    customer_note?: string | null
    recipient_name?: string | null
}): string {
    const fromCol = String(order.orderer_name || '').trim()
    if (fromCol) return fromCol
    const parsed = parseOrdererInfoFromNote(order.customer_note)
    if (parsed?.name) return parsed.name
    const userName = String(order.user_name || '').trim()
    if (userName) return userName
    return String(order.recipient_name || '').trim()
}
