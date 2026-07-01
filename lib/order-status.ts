export const ORDER_STATUS_VALUES = [
    'pending',
    'confirmed',
    'quote_sent',
    'payment_confirmed',
    'production',
    'shipping',
    'delivered',
    'completed',
    'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

/** 배송중 → 배송완료 자동 전환 (일) */
export const SHIPPING_TO_DELIVERED_DAYS = 5;
/** 배송완료 → 완료됨 자동 전환 (일) */
export const DELIVERED_TO_COMPLETED_DAYS = 2;

export const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: '접수 대기',
    confirmed: '주문 확인',
    quote_sent: '견적 발송',
    payment_confirmed: '결제 확인',
    production: '제작 중',
    shipping: '배송 중',
    delivered: '배송 완료',
    completed: '완료됨',
    cancelled: '취소',
};

export function isOrderStatus(value: string): value is OrderStatus {
    return (ORDER_STATUS_VALUES as readonly string[]).includes(value);
}
