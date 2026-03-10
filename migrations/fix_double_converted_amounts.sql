-- 보정: 원화인데 1300을 한 번 더 곱해 잘못 들어간 금액 복구
-- 원인: legacy_amounts_to_krw.sql 실행 시 이미 원화(예: 24,259원)로 저장된 건이
--       total_amount < 100000 조건에 걸려 24,259 * 1300 = 31,536,700으로 잘못 변환됨.
--
-- 복구 조건: 금액이 2,600만~1억 400만 원 구간이면서 (금액/1300)이 2만~8만 원인 경우
--
-- 실행 전 반드시 백업 후, 1회만 실행하세요.
--   npx wrangler d1 execute wow3d-production --remote --file=./migrations/fix_double_converted_amounts.sql

-- 1) order_items 먼저 복구 (단가/소계가 비정상 큰 항목만)
UPDATE order_items
SET unit_price = ROUND(unit_price / 1300),
    subtotal = ROUND(subtotal / 1300)
WHERE (unit_price BETWEEN 26000000 AND 104000000 AND ROUND(unit_price / 1300) BETWEEN 20000 AND 80000)
   OR (subtotal BETWEEN 26000000 AND 104000000 AND ROUND(subtotal / 1300) BETWEEN 20000 AND 80000);

-- 2) 주문 총액 복구
UPDATE orders
SET total_amount = ROUND(total_amount / 1300),
    updated_at = CURRENT_TIMESTAMP
WHERE total_amount BETWEEN 26000000 AND 104000000
  AND ROUND(total_amount / 1300) BETWEEN 20000 AND 80000;
