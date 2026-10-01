-- SLA/DLP 서포트 단가 (원/cm², 지지면적 = 표면적 × 0.3). NULL이면 코드 기본값(SLA 60, DLP 50) 사용
ALTER TABLE printer_equipment ADD COLUMN sla_support_per_cm2_krw REAL;
ALTER TABLE printer_equipment ADD COLUMN dlp_support_per_cm2_krw REAL;
