-- 파일 형식·납기 FAQ를 실제 기능과 통일
-- 메쉬: 즉시 자동견적 / STEP·STP: 업로드 시 자동 변환 / 납기: 평균 3~7일 내 수령

UPDATE qna
SET answer = 'STL, OBJ, 3MF, PLY 파일은 즉시 자동견적을 지원합니다. STEP, STP 파일은 업로드 시 자동 변환 후 견적을 제공합니다. 변환이 어려운 경우 STL 또는 3MF로 준비하시면 더 안정적입니다.',
    updated_at = CURRENT_TIMESTAMP
WHERE question IN (
    '출력 가능한 파일 형식은 무엇인가요?',
    '3D 프린터 출력대행은 어떤 파일 형식을 지원하나요?'
);

UPDATE qna
SET answer = '와우쓰리디에서는 3D 모델 파일을 업로드하면 AI가 부피와 표면적을 분석해 3D 프린팅 자동견적을 실시간으로 제공합니다. STL, OBJ, 3MF, PLY 파일은 즉시 자동견적을 지원하며, STEP·STP 파일은 업로드 시 자동 변환 후 견적을 확인할 수 있습니다.',
    updated_at = CURRENT_TIMESTAMP
WHERE question = '3D 프린팅 자동견적은 어떻게 받나요?';

UPDATE qna
SET answer = '주문 확정 후 제작·검수·발송을 진행하며, 일반적으로 평균 3~7일 내 수령 가능합니다. 공정·수량·후가공에 따라 달라질 수 있으며, 대형 출력물이나 수량이 많은 경우 추가 시간이 소요될 수 있습니다. 제작 현황은 주문조회 페이지에서 확인할 수 있습니다.',
    updated_at = CURRENT_TIMESTAMP
WHERE question IN (
    '배송 기간은 얼마나 걸리나요?',
    '3D 프린팅 출력물은 얼마나 걸리나요?'
);
