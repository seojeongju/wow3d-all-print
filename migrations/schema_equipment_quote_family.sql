-- 장비(출력방식) 추가: 견적 공식은 FDM/SLA/DLP 중 하나를 쓰고, 표시·저장용 type은 따로 둔다
ALTER TABLE printer_equipment ADD COLUMN quote_family TEXT;

-- 기존 FDM·SLA·DLP 행은 자기 type을 견적 공식으로 쓴다
UPDATE printer_equipment
SET quote_family = UPPER(type)
WHERE quote_family IS NULL
  AND UPPER(type) IN ('FDM', 'SLA', 'DLP');
