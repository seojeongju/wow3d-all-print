-- Q&A 테이블 생성 및 초기 데이터 삽입
-- 실행: npx wrangler d1 execute wow3d-production --file=./migrations/schema_qna.sql

CREATE TABLE IF NOT EXISTS qna (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_published BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  store_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qna_store_id ON qna(store_id);
CREATE INDEX IF NOT EXISTS idx_qna_is_published ON qna(is_published);

-- 초기 샘플 데이터
INSERT INTO qna (question, answer, category, display_order, store_id) VALUES 
('3D 프린팅 출력 비용은 어떻게 산정되나요?', 'WOW3D Pro의 AI 자동 견적 시스템은 업로드하신 모델의 부피(cm³), 표면적, 선택하신 출력 방식(FDM/SLA/DLP), 소재 및 옵션(인필, 레이어 높이 등)을 실시간으로 분석하여 10초 내에 정확한 금액을 산출합니다.', 'quote', 1, 1),
('출력 가능한 파일 형식은 무엇인가요?', '기본적으로 STL, OBJ 파일을 지원합니다. 다른 포맷의 파일은 고객센터로 문의해 주시기 바랍니다.', 'tech', 2, 1),
('배송 기간은 얼마나 걸리나요?', '일반적으로 제작 시작 후 1~3영업일 내에 발송됩니다. 대형 출력물이나 수량이 많은 경우 추가 시간이 소요될 수 있으며, 제작 현황은 [주문조회] 페이지에서 실시간으로 확인 가능합니다.', 'general', 3, 1);
