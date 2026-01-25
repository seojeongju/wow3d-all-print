/**
 * materials API 공통 에러 처리
 * - no such table (materials) → 503 + schema_materials.sql 안내
 * - no such column (description) → 503 + schema_materials_alter.sql 안내
 */
export function materialsErrorResponse(
  error: unknown,
  failMsg = 'Failed to fetch materials'
): { body: { error: string }; status: 503 | 500 } {
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  if (msg.includes('no such table') && msg.includes('materials')) {
    return {
      body: {
        error:
          'materials 테이블이 없습니다. npx wrangler d1 execute wow3d-production --remote --file=./schema_materials.sql',
      },
      status: 503,
    };
  }
  if (msg.includes('no such column') && msg.includes('description')) {
    return {
      body: {
        error:
          'materials 테이블에 description 컬럼이 없습니다. npx wrangler d1 execute wow3d-production --remote --file=./schema_materials_alter.sql',
      },
      status: 503,
    };
  }
  if (msg.includes('no such column') && msg.includes('updated_at')) {
    return {
      body: {
        error:
          'materials 테이블에 updated_at 컬럼이 없습니다. npx wrangler d1 execute wow3d-production --remote --file=./schema_materials_alter.sql',
      },
      status: 503,
    };
  }
  if (msg.includes('no such column') && msg.includes('price_per_ml')) {
    return {
      body: {
        error:
          'materials 테이블에 price_per_ml 컬럼이 없습니다. npx wrangler d1 execute wow3d-production --remote --file=./schema_materials_price_per_ml.sql',
      },
      status: 503,
    };
  }
  return { body: { error: failMsg }, status: 500 };
}
