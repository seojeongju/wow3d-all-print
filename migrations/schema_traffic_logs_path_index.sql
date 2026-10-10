-- 메인 공개 지표(app/api/stats/public): 최근 1주일 견적 페이지(/quote) PV를 경로·시각 인덱스로 집계
-- 적용: npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_traffic_logs_path_index.sql
CREATE INDEX IF NOT EXISTS idx_traffic_logs_path_created ON traffic_logs(path, created_at);
