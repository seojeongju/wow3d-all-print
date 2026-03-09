-- Phase 2: 견적서 발송 일시 (목록/상세에서 견적 발송 여부 표시)
-- orders.quotation_sent_at: NULL = 미발송, 값 있음 = 견적서 발송 일시
ALTER TABLE orders ADD COLUMN quotation_sent_at DATETIME NULL;
