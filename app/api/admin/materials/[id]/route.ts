import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { materialsErrorResponse } from '@/lib/materials-api'

/**
 * PATCH /api/admin/materials/[id] - 자재 수정
 * Body: { name?, type?, pricePerGram?, density?, colors?, is_active?, description? }
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
    const type = typeof body.type === 'string' && /^(FDM|SLA|DLP)$/i.test(body.type) ? body.type.toUpperCase() : (existing.type as string)
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

    await env.DB.prepare(
      `UPDATE materials SET name=?, type=?, price_per_gram=?, price_per_ml=?, density=?, colors=?, is_active=?, description=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
    )
      .bind(name, type, pricePerGram, pricePerMl, density, colors, is_active, description, numId)
      .run()

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/materials/[id]', e)
    const { body, status } = materialsErrorResponse(e, 'Failed to update material')
    return NextResponse.json(body, { status })
  }
}
