-- 사진(이미지) → AI 3D 모델링 FAQ
-- 사이트 FAQ(/qna)·홈 FAQ JSON-LD에 검색 질의(사진 3D 모델링, 이미지 3D 변환)를 노출

INSERT INTO qna (question, answer, category, is_published, display_order, store_id)
SELECT
    '사진(이미지) 파일을 3D 모델링으로 변환할 수 있나요?',
    '가능합니다. WOW3D에서는 JPG·PNG 제품 사진을 올리면 AI가 입체 3D 모델(STL)로 변환하고, 바로 3D 프린팅 자동견적·출력 주문까지 이어집니다. 자동견적에서 「3D 모델이 없어요」를 선택한 뒤 정면 사진을 업로드하면 됩니다. 우·뒤·좌 추가 사진을 함께 올리면 형상 정확도가 올라갈 수 있습니다. 로그인 회원 기준 하루 1회(한국 시간) 이용할 수 있으며, 조립 공차·정밀 치수가 중요한 부품은 STL 또는 STEP 업로드를 권장합니다.',
    'tech',
    1,
    0,
    1
WHERE NOT EXISTS (
    SELECT 1 FROM qna WHERE question = '사진(이미지) 파일을 3D 모델링으로 변환할 수 있나요?'
);

INSERT INTO qna (question, answer, category, is_published, display_order, store_id)
SELECT
    '사진 3D 모델링은 어떤 사진이 좋나요?',
    '물체가 화면 중앙에 크게, 단색·밝은 배경, 한 장에 한 물체, 그림자·반사가 적은 사진이 좋습니다. JPG 또는 PNG(최대 8MB)를 지원하며, 우·뒤·좌 추가 사진을 올리면 형상 정확도가 올라갈 수 있습니다. 생성된 STL로 바로 자동견적·출력 주문을 진행할 수 있습니다.',
    'tech',
    1,
    0,
    1
WHERE NOT EXISTS (
    SELECT 1 FROM qna WHERE question = '사진 3D 모델링은 어떤 사진이 좋나요?'
);

-- 기존 “파일 없어도 상담” 항목을 사진→AI 3D 경로로 갱신
UPDATE qna
SET
    answer = '네. 3D 파일이 없어도 제품 사진(JPG/PNG)을 올리면 AI가 입체 3D 모델(STL)로 변환한 뒤 자동견적·출력 주문까지 진행할 수 있습니다. 스케치·로고는 AI 3D Maker, 정밀 치수·도면 기반 제품은 3D 모델링 의뢰로 상담할 수 있습니다.',
    updated_at = CURRENT_TIMESTAMP
WHERE question = '3D 모델링 파일이 없어도 제작 상담이 가능한가요?';
