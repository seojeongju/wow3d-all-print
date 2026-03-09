-- 마이그레이션: 기존 "단위" 금액을 원화(KRW)로 일괄 변환
-- 배경: 과거에는 금액을 1300으로 나눈 값으로 저장하고 표시 시 ×1300으로 원화처럼 보여줌.
--       이제부터는 금액을 원화로만 저장·표시하므로, 기존 데이터를 원화로 바꿀 때 1회만 실행.
--
-- 실행 방법 (Cloudflare D1):
--   npx wrangler d1 execute <DB_NAME> --remote --file=./migrations/legacy_amounts_to_krw.sql
--
-- 주의: 이 스크립트는 한 번만 실행하세요. 이미 원화로 저장된 DB에서 다시 실행하면 금액이 1300배로 불어납니다.

UPDATE quotes
SET total_price = ROUND(total_price * 1300)
WHERE total_price IS NOT NULL AND total_price > 0 AND total_price < 100000;

UPDATE orders
SET total_amount = ROUND(total_amount * 1300)
WHERE total_amount IS NOT NULL AND total_amount > 0 AND total_amount < 100000;

UPDATE order_items
SET unit_price = ROUND(unit_price * 1300),
    subtotal = ROUND(subtotal * 1300)
WHERE (unit_price IS NOT NULL AND unit_price > 0 AND unit_price < 100000)
   OR (subtotal IS NOT NULL AND subtotal > 0 AND subtotal < 100000);
