/**
 * 관리자 주문 파일의 짧은 유효기간 서명 링크
 * - Bambu Studio 실행기처럼 로그인 헤더를 보낼 수 없는 프로그램이 파일을 받을 때 사용
 * - 서명에 매장·주문·견적·만료시각을 묶어 다른 파일로 바꿔 쓸 수 없음
 */

import { signServerValue, verifyServerSignature } from '@/lib/api-utils'

export const ADMIN_FILE_LINK_TTL_MS = 10 * 60 * 1000

function payload(storeId: number, orderId: number, quoteId: number, exp: number): string {
    return `admin-order-file:${storeId}:${orderId}:${quoteId}:${exp}`
}

export async function createSignedOrderFileUrl(
    origin: string,
    storeId: number,
    orderId: number,
    quoteId: number
): Promise<string | null> {
    const exp = Date.now() + ADMIN_FILE_LINK_TTL_MS
    const sig = await signServerValue(payload(storeId, orderId, quoteId, exp))
    if (!sig) return null
    const params = new URLSearchParams({
        quoteId: String(quoteId),
        s: String(storeId),
        exp: String(exp),
        sig,
    })
    return `${origin}/api/admin/orders/${orderId}/file?${params.toString()}`
}

/** 서명이 유효하면 매장 ID, 아니면 null */
export async function verifySignedOrderFileParams(
    orderId: number,
    params: URLSearchParams
): Promise<number | null> {
    const sig = params.get('sig')
    const storeId = Number(params.get('s'))
    const quoteId = Number(params.get('quoteId'))
    const exp = Number(params.get('exp'))
    if (!sig || !Number.isInteger(storeId) || !Number.isInteger(quoteId) || !Number.isFinite(exp)) return null
    if (exp < Date.now() || exp > Date.now() + ADMIN_FILE_LINK_TTL_MS + 60_000) return null
    const ok = await verifyServerSignature(payload(storeId, orderId, quoteId, exp), sig)
    return ok ? storeId : null
}
