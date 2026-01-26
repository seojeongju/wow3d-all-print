import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'

/**
 * GET /api/materials - 견적용 자재 목록 (공개, is_active=1)
 * id, name, type, price_per_gram, price_per_ml, density
 * - FDM: price_per_gram(원/g), density 사용
 * - SLA/DLP: price_per_ml(원/mL) 사용, 없으면 0 처리
 */
export async function GET() {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) {
      return NextResponse.json({ success: true, data: [] })
    }
    const { results } = await env.DB.prepare(
      'SELECT id, name, type, price_per_gram, price_per_ml, density FROM materials WHERE is_active = 1 ORDER BY type, name'
    ).all()
    const rows = (results || []) as Array<{ id: number; name: string; type: string; price_per_gram: number; price_per_ml?: number | null; density: number }>
    return NextResponse.json(
      {
        success: true,
        data: rows.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          price_per_gram: Number(r.price_per_gram) || 0,
          price_per_ml: r.price_per_ml != null && Number.isFinite(r.price_per_ml) ? Number(r.price_per_ml) : null,
          density: Number(r.density) || 1.24,
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e) {
    console.error('GET /api/materials', e)
    return NextResponse.json({ success: true, data: [] })
  }
}
