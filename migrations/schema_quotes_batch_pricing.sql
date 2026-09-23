-- 수량 배치 견적: 변동비·셋업·최소금액 스냅샷 (라인당 최소 1회 적용용)
ALTER TABLE quotes ADD COLUMN variable_cost_krw REAL;
ALTER TABLE quotes ADD COLUMN setup_cost_krw REAL;
ALTER TABLE quotes ADD COLUMN min_price_krw REAL;
