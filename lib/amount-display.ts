/**
 * 과거 마이그레이션 오류: 원화인데 1300을 한 번 더 곱해 저장된 금액 보정
 * 조건: 2,600만~1억 400만 원 구간이면서 (금액/1300)이 2만~80만 원인 경우 → /1300 반환
 */
const DOUBLE_1300_MIN = 26_000_000;
const DOUBLE_1300_MAX = 104_000_000;
const DIVIDED_MIN = 20_000;
const DIVIDED_MAX = 800_000;

export function correctDisplayAmount(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return value ?? null;
  const n = Math.round(Number(value));
  if (n < DOUBLE_1300_MIN || n > DOUBLE_1300_MAX) return n;
  const divided = Math.round(n / 1300);
  if (divided >= DIVIDED_MIN && divided <= DIVIDED_MAX) return divided;
  return n;
}
