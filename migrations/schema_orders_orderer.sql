-- 주문자(결제자) 연락처를 배송 수령인과 분리 저장
ALTER TABLE orders ADD COLUMN orderer_name TEXT;
ALTER TABLE orders ADD COLUMN orderer_phone TEXT;
