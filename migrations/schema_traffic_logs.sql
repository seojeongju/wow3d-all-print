-- Wow3D Traffic Logs Schema
-- 사용자 유입 경로 분석을 위한 테이블

CREATE TABLE IF NOT EXISTS traffic_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,          -- 방문자 구분을 위한 세션 ID
  user_id INTEGER,          -- 로그인 사용자 ID (연결 가능 시)
  source TEXT,              -- 유입 소스 (google, naver, direct 등)
  medium TEXT,              -- 유입 매체 (organic, cpc, referral 등)
  campaign TEXT,            -- 캠페인 명 (utm_campaign)
  referrer_url TEXT,        -- 전체 레퍼럴 URL
  path TEXT,                -- 방문한 페이지 경로
  ip_address TEXT,          -- 방문자 IP (선택 사항)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_traffic_logs_created_at ON traffic_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_session_id ON traffic_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_source ON traffic_logs(source);
