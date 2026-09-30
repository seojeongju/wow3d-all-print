-- 캡스톤디자인 시제품 제작 FAQ (공개 /qna · 홈 FAQ · FAQPage JSON-LD)
INSERT INTO qna (question, answer, category, is_published, display_order, store_id)
SELECT '캡스톤디자인 시제품 제작도 가능한가요?',
       '네. 아이디어 컨설팅부터 3D 모델링 대행, 3D프린팅 출력·후가공까지 캡스톤디자인 시제품 제작 전 과정을 지원합니다. 3D 파일이 있으면 자동견적으로 바로 가격을 확인할 수 있고, 아이디어나 스케치만 있다면 문의로 상담해 주세요.',
       'general', 1, 11, 1
WHERE NOT EXISTS (SELECT 1 FROM qna WHERE question = '캡스톤디자인 시제품 제작도 가능한가요?');

INSERT INTO qna (question, answer, category, is_published, display_order, store_id)
SELECT '아이디어만 있어도 시제품 제작을 의뢰할 수 있나요?',
       '가능합니다. 아이디어 컨설팅으로 구조·크기·소재·제작 방식을 함께 정리하고, 스케치나 참고 이미지를 바탕으로 3D 모델링을 대행한 뒤 출력까지 진행합니다.',
       'general', 1, 11, 1
WHERE NOT EXISTS (SELECT 1 FROM qna WHERE question = '아이디어만 있어도 시제품 제작을 의뢰할 수 있나요?');

INSERT INTO qna (question, answer, category, is_published, display_order, store_id)
SELECT '산학협력단 결제용 견적서·세금계산서를 발행해 주나요?',
       '네. 견적서, 거래명세서, 세금계산서 발행이 가능합니다. 필요한 서류 종류와 발행 정보(학교·산학협력단 사업자 정보)를 문의 시 함께 알려주세요.',
       'quote', 1, 11, 1
WHERE NOT EXISTS (SELECT 1 FROM qna WHERE question = '산학협력단 결제용 견적서·세금계산서를 발행해 주나요?');
