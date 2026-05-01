-- 중복된 QnA 항목 제거 (동일한 질문과 상점 ID를 가진 항목 중 id가 가장 작은 것만 남김)
DELETE FROM qna
WHERE id NOT IN (
    SELECT MIN(id)
    FROM qna
    GROUP BY question, store_id
);
