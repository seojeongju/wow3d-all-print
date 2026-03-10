-- FDM/SLA/DLP 타입별 기본금액(최소 견적). 자동견적이 이 금액 미만이면 기본금액으로 책정
-- 기존 printer_equipment 테이블에 컬럼 추가 (없으면 스킵)

ALTER TABLE printer_equipment ADD COLUMN min_price_krw INTEGER DEFAULT NULL;
