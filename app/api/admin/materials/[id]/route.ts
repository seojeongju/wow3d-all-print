import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { materialsErrorResponse } from '@/lib/materials-api'

/**
 * PATCH /api/admin/materials/[id] - 소재 수정
 * Body: { name?, type?, pricePerGram?, density?, colors?, is_active?, description?, minPriceKrw? }
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 })
    const numId = parseInt(id, 10)
    if (!Number.isInteger(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const existing = await env.DB.prepare('SELECT * FROM materials WHERE id = ?')
      .bind(numId)
      .first<Record<string, unknown>>()
    if (!existing) return NextResponse.json({ error: 'Material not found' }, { status: 404 })

    const body = (await req.json()) as Record<string, unknown>
    const name = typeof body.name === 'string' ? body.name : (existing.name as string)
    let type =
      typeof body.type === 'string' && /^[A-Za-z][A-Za-z0-9_-]{1,15}$/.test(body.type.trim())
        ? body.type.trim().toUpperCase()
        : (existing.type as string)
    if (type !== existing.type && !['FDM', 'SLA', 'DLP'].includes(type)) {
      const storeId = (existing.store_id as string) || 'default'
      const exists = await env.DB.prepare(
        'SELECT 1 AS ok FROM printer_equipment WHERE store_id = ? AND UPPER(type) = ? LIMIT 1'
      )
        .bind(storeId, type)
        .first<{ ok?: number }>()
      if (!exists) {
        return NextResponse.json(
          { error: `출력방식 "${type}" 장비가 없습니다. 먼저 장비 설정에서 추가하세요.` },
          { status: 400 }
        )
      }
    }
    const pricePerGram = typeof body.pricePerGram === 'number' ? body.pricePerGram : (existing.price_per_gram as number)
    const pricePerMl = body.pricePerMl !== undefined ? (body.pricePerMl != null && body.pricePerMl !== '' ? Number(body.pricePerMl) : null) : (existing.price_per_ml as number | null)
    const density = typeof body.density === 'number' ? body.density : (existing.density as number)
    const colors =
      body.colors !== undefined
        ? Array.isArray(body.colors)
          ? JSON.stringify(body.colors)
          : typeof body.colors === 'string'
            ? body.colors
            : (existing.colors as string)
        : (existing.colors as string)
    const is_active = body.is_active !== undefined ? (body.is_active ? 1 : 0) : (existing.is_active as number)
    const description = body.description !== undefined ? (body.description as string | null) : (existing.description as string | null)
    const minPriceKrw =
      body.minPriceKrw !== undefined
        ? body.minPriceKrw != null && body.minPriceKrw !== '' && Number(body.minPriceKrw) > 0
          ? Number(body.minPriceKrw)
          : null
        : existing.min_price_krw != null && Number(existing.min_price_krw) > 0
          ? Number(existing.min_price_krw)
          : null

    // updated_at = 단가 변경 시각 (장바구니 '단가 변경' 판정 기준) — 색상·설명만 바꾸면 유지
    const prevMin =
      existing.min_price_krw != null && Number(existing.min_price_krw) > 0 ? Number(existing.min_price_krw) : null
    const priceChanged =
      Number(existing.price_per_gram ?? 0) !== Number(pricePerGram ?? 0) ||
      (existing.price_per_ml == null ? null : Number(existing.price_per_ml)) !== (pricePerMl == null ? null : Number(pricePerMl)) ||
      Number(existing.density ?? 0) !== Number(density ?? 0) ||
      prevMin !== minPriceKrw
    try {
      await env.DB.prepare(
        `UPDATE materials SET name=?, type=?, price_per_gram=?, price_per_ml=?, density=?, colors=?, is_active=?, description=?, min_price_krw=?${priceChanged ? ', updated_at=CURRENT_TIMESTAMP' : ''} WHERE id=?`
      )
        .bind(name, type, pricePerGram, pricePerMl, density, colors, is_active, description, minPriceKrw, numId)
        .run()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!(msg.includes('no such column') && msg.includes('min_price_krw'))) throw e
      await env.DB.prepare(
        `UPDATE materials SET name=?, type=?, price_per_gram=?, price_per_ml=?, density=?, colors=?, is_active=?, description=?${priceChanged ? ', updated_at=CURRENT_TIMESTAMP' : ''} WHERE id=?`
      )
        .bind(name, type, pricePerGram, pricePerMl, density, colors, is_active, description, numId)
        .run()
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/materials/[id]', e)
    const { body, status } = materialsErrorResponse(e, 'Failed to update material')
    return NextResponse.json(body, { status })
  }
}
