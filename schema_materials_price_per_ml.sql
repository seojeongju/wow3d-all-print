-- materials: SLA/DLP용 mL당 단가 (원)
-- 실행: npx wrangler d1 execute wow3d-production --remote --file=./schema_materials_price_per_ml.sql

ALTER TABLE materials ADD COLUMN price_per_ml REAL;
