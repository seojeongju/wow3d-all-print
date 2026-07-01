import {
    DELIVERED_TO_COMPLETED_DAYS,
    SHIPPING_TO_DELIVERED_DAYS,
} from '@/lib/order-status';
import type { Env } from '@/env';

export type AutoStatusTransitionResult = {
    shippingToDelivered: number;
    deliveredToCompleted: number;
    skipped?: boolean;
};

/**
 * 배송중 5일 경과 → 배송완료, 배송완료 2일 경과 → 완료됨
 * 관리자가 중간에 다른 상태로 변경한 주문은 타임스탬프가 초기화되어 대상에서 제외됨.
 */
export async function processAutoOrderStatusTransitions(
    db: Env['DB']
): Promise<AutoStatusTransitionResult> {
    try {
        const toDelivered = await db
            .prepare(
                `UPDATE orders
                 SET status = 'delivered',
                     delivered_at = COALESCE(delivered_at, datetime('now')),
                     updated_at = datetime('now')
                 WHERE status = 'shipping'
                   AND shipping_started_at IS NOT NULL
                   AND datetime(shipping_started_at) <= datetime('now', ? || ' days')`
            )
            .bind(`-${SHIPPING_TO_DELIVERED_DAYS}`)
            .run();

        const toCompleted = await db
            .prepare(
                `UPDATE orders
                 SET status = 'completed',
                     updated_at = datetime('now')
                 WHERE status = 'delivered'
                   AND delivered_at IS NOT NULL
                   AND datetime(delivered_at) <= datetime('now', ? || ' days')`
            )
            .bind(`-${DELIVERED_TO_COMPLETED_DAYS}`)
            .run();

        return {
            shippingToDelivered: (toDelivered.meta as { changes?: number })?.changes ?? 0,
            deliveredToCompleted: (toCompleted.meta as { changes?: number })?.changes ?? 0,
        };
    } catch (e) {
        console.warn('processAutoOrderStatusTransitions skipped (migration may be pending)', e);
        return { shippingToDelivered: 0, deliveredToCompleted: 0, skipped: true };
    }
}

/** 관리자 수동 상태 변경 시 자동 전환 기준 시각 설정/초기화 */
export function statusTimestampSql(
    nextStatus: string,
    prevStatus: string | null | undefined
): { setClause: string; clearAuto: boolean } {
    if (nextStatus === 'shipping') {
        return {
            setClause: `, shipping_started_at = datetime('now'), delivered_at = NULL`,
            clearAuto: false,
        };
    }
    if (nextStatus === 'delivered') {
        return {
            setClause: `, delivered_at = COALESCE(delivered_at, datetime('now'))`,
            clearAuto: false,
        };
    }
    if (nextStatus === 'completed' || nextStatus === 'cancelled') {
        return {
            setClause: `, shipping_started_at = NULL, delivered_at = NULL`,
            clearAuto: true,
        };
    }
    if (prevStatus === 'shipping' || prevStatus === 'delivered') {
        return {
            setClause: `, shipping_started_at = NULL, delivered_at = NULL`,
            clearAuto: true,
        };
    }
    return { setClause: '', clearAuto: false };
}
