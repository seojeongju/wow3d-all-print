/**
 * 금액 단위 및 계산 원칙 (전 프로젝트 공통)
 * ----------------------------------------
 * - 단위: 모든 금액은 원(KRW) 단위로만 저장·전달·표시합니다.
 * - 저장: orders.total_amount, order_items.unit_price/subtotal, quotes.total_price,
 *         expert_quote_data.total_amount 및 items[].unit_price 모두 원(KRW) 숫자입니다.
 * - 계산: 견적 금액 = 소재비+기계비+인건비 등 (QuotePanel), 주문 총액 = Σ(품목 단가×수량).
 * - 금액을 "천 원"이나 배수로 변환·저장하지 마세요.
 *
 * 과거 1000배/1300배 자동 보정은 정상 고액 주문(예: 127만 원)을 1,272원으로
 * 깎는 사고가 있어 제거했습니다. 레거시 이상치는 DB 마이그레이션으로만 처리합니다.
 */

/**
 * 화면 표시용. 입력이 유한하면 원 단위 반올림만 합니다.
 * (과거 /1000·/1300 추정 보정은 고액 정상 금액을 훼손하므로 사용하지 않음)
 */
export function correctDisplayAmount(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return value ?? null;
  return Math.round(Number(value));
}

/**
 * DB/API에 금액을 저장하기 전 호출. 원 단위 반올림만 수행합니다.
 */
export function normalizeAmountBeforeSave(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(Number(value))) return 0;
  return Math.round(Number(value));
}

/** 100원 단위 반올림/반내림/반올림(올림). 자동견적 금액 산출 시 사용 */
export type PriceRoundMode = 'none' | 'round' | 'floor' | 'ceil';

/** 견적 금액 단위 처리: 100원 미만(10원 단위 이하) 절삭 — 클라이언트·서버 재계산·장바구니 공통 */
export const QUOTE_PRICE_ROUND_MODE: PriceRoundMode = 'floor';

/** ×1.1 등 부동소수 오차로 22000이 21999.999…가 되어 한 단위 깎이는 것 방지 */
const ROUND_EPSILON = 1e-6;

export function roundTo100(value: number | null | undefined, mode: PriceRoundMode): number {
  if (value == null || !Number.isFinite(Number(value))) return 0;
  const n = Number(value);
  if (mode === 'none') return Math.round(n);
  const unit = 100;
  switch (mode) {
    case 'round': return Math.round(n / unit) * unit;
    case 'floor': return Math.floor((n + ROUND_EPSILON) / unit) * unit;
    case 'ceil': return Math.ceil((n - ROUND_EPSILON) / unit) * unit;
    default: return Math.round(n);
  }
}

/**
 * 라인 합계를 단가 기준으로 정리: 단가를 100원 단위로 맞추고 합계 = 단가 × 수량.
 * 수량이 2개 이상이어도 견적서의 단가·합계가 100원 단위로 일치함(절삭 시 최대 99원×수량 감소).
 */
export function alignLineToUnitPrice(
  lineTotal: number,
  quantity: number,
  mode: PriceRoundMode = QUOTE_PRICE_ROUND_MODE
): { unitPrice: number; lineTotal: number } {
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const total = Math.max(0, Number(lineTotal) || 0);
  if (mode === 'none') return { unitPrice: total / qty, lineTotal: Math.round(total) };
  const unitPrice = roundTo100(total / qty, mode);
  return { unitPrice, lineTotal: unitPrice * qty };
}

/** 견적 금액 공통 절삭(100원 미만 버림) */
export function floorQuoteAmount(value: number | null | undefined): number {
  return roundTo100(value, QUOTE_PRICE_ROUND_MODE);
}

/**
 * 합계를 가중치 비율로 나누되 각 몫을 unit(기본 100원) 단위로 맞춤.
 * 누적 경계값을 반올림해 몫의 합이 항상 total과 같고 음수가 나오지 않음.
 */
export function allocateByWeights(total: number, weights: number[], unit = 100): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const safeTotal = Math.max(0, Math.round(Number(total) || 0));
  const safeWeights = weights.map((w) => Math.max(0, Number(w) || 0));
  const weightSum = safeWeights.reduce((a, b) => a + b, 0);
  const step = unit > 0 ? unit : 1;

  const shares: number[] = [];
  let cumWeight = 0;
  let prevBoundary = 0;
  for (let i = 0; i < n; i++) {
    cumWeight += weightSum > 0 ? safeWeights[i] : 1;
    const ratio = cumWeight / (weightSum > 0 ? weightSum : n);
    const boundary = i === n - 1 ? safeTotal : Math.min(safeTotal, Math.round((safeTotal * ratio) / step) * step);
    shares.push(Math.max(0, boundary - prevBoundary));
    prevBoundary = Math.max(prevBoundary, boundary);
  }
  return shares;
}
