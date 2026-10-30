-- 소재별 기본(최소) 견적금액. NULL이면 해당 출력방식 장비 min_price_krw 폴백
ALTER TABLE materials ADD COLUMN min_price_krw REAL;
