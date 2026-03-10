/**
 * 금액 단위 및 계산 원칙 (전 프로젝트 공통)
 * ----------------------------------------
 * - 단위: 모든 금액은 원(KRW) 단위로만 저장·전달·표시합니다.
 * - 저장: orders.total_amount, order_items.unit_price/subtotal, quotes.total_price,
 *         expert_quote_data.total_amount 및 items[].unit_price 모두 원(KRW) 숫자입니다.
 * - 계산: 견적 금액 = 소재비+기계비+인건비 등 (QuotePanel), 주문 총액 = Σ(품목 단가×수량).
 * - 금액을 "천 원"이나 배수로 변환·저장하지 마세요. 저장 전 normalizeAmountBeforeSave()로
 *   과거 1000배/1300배 오류만 정규화합니다.
 *
 * 과거 마이그레이션/저장 오류 보정
 * - 1300배: 2,600만~1억 400만 원이면서 (금액/1300)이 2만~80만 원 → /1300
 * - 1000배: 100만~1억 원이면서 (금액/1000)이 1천~10만 원 → /1000
 */
const DOUBLE_1300_MIN = 26_000_000;
const DOUBLE_1300_MAX = 104_000_000;
const DIVIDED_1300_MIN = 20_000;
const DIVIDED_1300_MAX = 800_000;
const DOUBLE_1000_MIN = 1_000_000;
const DOUBLE_1000_MAX = 100_000_000;
const DIVIDED_1000_MIN = 1_000;
const DIVIDED_1000_MAX = 100_000;

export function correctDisplayAmount(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return value ?? null;
  const n = Math.round(Number(value));
  if (n >= DOUBLE_1300_MIN && n <= DOUBLE_1300_MAX) {
    const by1300 = Math.round(n / 1300);
    if (by1300 >= DIVIDED_1300_MIN && by1300 <= DIVIDED_1300_MAX) return by1300;
  }
  if (n >= DOUBLE_1000_MIN && n <= DOUBLE_1000_MAX) {
    const by1000 = Math.round(n / 1000);
    if (by1000 >= DIVIDED_1000_MIN && by1000 <= DIVIDED_1000_MAX) return by1000;
  }
  return n;
}

/**
 * DB/API에 금액을 저장하기 전 호출. 1000배/1300배 잘못 저장된 값이 들어오면 원래 금액으로 정규화해 반환.
 * 그 외에는 입력값을 그대로 반환(유한한 숫자만, 아니면 0).
 */
export function normalizeAmountBeforeSave(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(Number(value))) return 0;
  const n = Math.round(Number(value));
  const corrected = correctDisplayAmount(n);
  return corrected ?? n;
}

/** 100원 단위 반올림/반내림/반올림(올림). 자동견적 금액 산출 시 사용 */
export type PriceRoundMode = 'none' | 'round' | 'floor' | 'ceil';

export function roundTo100(value: number | null | undefined, mode: PriceRoundMode): number {
  if (value == null || !Number.isFinite(Number(value))) return 0;
  const n = Number(value);
  if (mode === 'none') return Math.round(n);
  const unit = 100;
  switch (mode) {
    case 'round': return Math.round(n / unit) * unit;
    case 'floor': return Math.floor(n / unit) * unit;
    case 'ceil': return Math.ceil(n / unit) * unit;
    default: return Math.round(n);
  }
}
