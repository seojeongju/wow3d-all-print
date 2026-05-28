-- orders 테이블에 view_token 추가
ALTER TABLE orders ADD COLUMN view_token TEXT;

-- 기존 레코드에 무작위 UUID 형식 토큰 일괄 부여
UPDATE orders 
SET view_token = lower(
  hex(randomblob(4)) || '-' || 
  hex(randomblob(2)) || '-' || 
  hex(randomblob(2)) || '-' || 
  hex(randomblob(2)) || '-' || 
  hex(randomblob(6))
) 
WHERE view_token IS NULL;
