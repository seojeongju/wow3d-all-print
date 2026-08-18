-- 사진→3D Before/After 쇼케이스 예시 (중복 실행 안전)
-- source_image_url 컬럼 필요: schema_gallery_source_image.sql 선행

INSERT INTO gallery_items (
    store_id, title, description, image_url, source_image_url,
    material, print_method, tags, is_visible, sort_order
)
SELECT
    1,
    '피규어 · 캐릭터 형상 확인 (사진→3D)',
    '단색 배경 캐릭터 사진에서 입체 메시를 생성한 뒤 SLA/DLP로 키캡·피규어 외관 시제품을 출력하는 흐름 예시입니다.',
    '/images/photo-to-3d/keycap-golden-retriever-mesh.png',
    '/images/photo-to-3d/keycap-golden-retriever.png',
    'Standard Resin',
    'SLA',
    '["photo-to-3d","피규어","시제품"]',
    1,
    200
WHERE NOT EXISTS (
    SELECT 1 FROM gallery_items WHERE title = '피규어 · 캐릭터 형상 확인 (사진→3D)'
);

INSERT INTO gallery_items (
    store_id, title, description, image_url, source_image_url,
    material, print_method, tags, is_visible, sort_order
)
SELECT
    1,
    '시제품 · 부품 외관 검증 (사진→3D)',
    '실물·레퍼런스 사진으로 형상을 빠르게 확인하고 FDM 견적·출력까지 이어지는 사례 유형입니다.',
    '/og-image-v2.jpg',
    '/images/expert/industrial.png',
    'PLA',
    'FDM',
    '["photo-to-3d","시제품","부품"]',
    1,
    190
WHERE NOT EXISTS (
    SELECT 1 FROM gallery_items WHERE title = '시제품 · 부품 외관 검증 (사진→3D)'
);

-- 기존 시드 행의 첫 카드 이미지를 키캡 예시로 갱신
UPDATE gallery_items
SET
    description = '단색 배경 캐릭터 사진에서 입체 메시를 생성한 뒤 SLA/DLP로 키캡·피규어 외관 시제품을 출력하는 흐름 예시입니다.',
    image_url = '/images/photo-to-3d/keycap-golden-retriever-mesh.png',
    source_image_url = '/images/photo-to-3d/keycap-golden-retriever.png'
WHERE title = '피규어 · 캐릭터 형상 확인 (사진→3D)';
