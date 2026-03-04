-- company_info 테이블 생성 (스토어별 회사 정보)
CREATE TABLE IF NOT EXISTS company_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL UNIQUE DEFAULT 1,
  -- 사업자 정보
  business_number TEXT,           -- 사업자등록번호 (예: 123-45-67890)
  company_name TEXT,              -- 상호(법인명)
  representative TEXT,            -- 대표자명
  business_type TEXT,             -- 업태
  business_item TEXT,             -- 종목
  -- 연락처/주소
  address TEXT,                   -- 사업장 주소
  phone TEXT,                     -- 대표 전화
  fax TEXT,                       -- 팩스
  email TEXT,                     -- 이메일
  website TEXT,                   -- 웹사이트
  -- 로고
  logo_url TEXT,                  -- 회사 로고 이미지 URL (R2 저장)
  -- 견적서 추가 문구
  estimate_header_note TEXT,      -- 견적서 상단 추가 문구
  estimate_footer_note TEXT,      -- 견적서 하단 추가 문구 (특이사항)
  estimate_valid_days INTEGER DEFAULT 14,  -- 견적 유효기간 (일)
  -- 은행 정보
  bank_name TEXT,                 -- 은행명
  bank_account TEXT,              -- 계좌번호
  bank_holder TEXT,               -- 예금주
  -- 메타
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE INDEX IF NOT EXISTS idx_company_info_store_id ON company_info(store_id);

-- 기본 회사 정보 삽입 (store_id=1 기본값)
INSERT OR IGNORE INTO company_info (store_id, company_name, representative, business_type, business_item, estimate_valid_days)
VALUES (1, '와우쓰리디(Wow3D)', '서정주', '제조업', '3D프린팅', 14);
