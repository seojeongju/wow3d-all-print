-- 회원 견적 유입 귀속(lib/quote-attribution.ts): user_id로 견적 직전 방문 세션 조회
-- 적용: npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_traffic_logs_user_index.sql
CREATE INDEX IF NOT EXISTS idx_traffic_logs_user_created ON traffic_logs(user_id, created_at);
