import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'
import { loadPublicMaterials } from '@/lib/pricing-public-data'

/**
 * GET /api/materials - 견적용 소재 목록 (관리자 “소재”와 동일 소스, is_active=1 또는 NULL)
 * id, name, type, price_per_gram, price_per_ml, density
 * - FDM: price_per_gram(원/g), density 사용
 * - SLA/DLP: price_per_ml(원/mL) 사용, 없으면 0 처리
 * - 관리자에서 추가·수정한 소재와 동일 테이블(materials) 참조
 */
export async function GET() {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) {
      return NextResponse.json({ success: true, data: [] })
    }
    const data = await loadPublicMaterials(env.DB)
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('GET /api/materials', e)
    return NextResponse.json({ success: true, data: [] })
  }
}
