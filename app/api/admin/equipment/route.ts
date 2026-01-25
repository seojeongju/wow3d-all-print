import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/equipment - 장비 설정 목록 (FDM, SLA, DLP)
 */
export async function GET() {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 })
    const { results } = await env.DB.prepare('SELECT * FROM printer_equipment ORDER BY type').all()
    return NextResponse.json({ success: true, data: results || [] })
  } catch (e) {
    console.error('GET /api/admin/equipment', e)
    const msg = String(e instanceof Error ? e.message : e).toLowerCase()
    if (msg.includes('no such table') && msg.includes('printer_equipment')) {
      return NextResponse.json(
        { error: 'printer_equipment 테이블이 없습니다. 터미널에서: npx wrangler d1 execute wow3d-production --remote --file=./schema_equipment.sql' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
  }
}

/**
 * POST /api/admin/equipment - 장비 설정 업데이트 (type 기준 upsert)
 * Body: { type, name?, max_x_mm, max_y_mm, max_z_mm, hourly_rate, layer_heights_json?, is_active? }
 */
export async function POST(req: NextRequest) {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 })
    const body = (await req.json()) as Record<string, unknown>
    const type = body.type as string
    if (!type || !['FDM', 'SLA', 'DLP'].includes(type)) {
      return NextResponse.json({ error: 'type must be FDM, SLA, or DLP' }, { status: 400 })
    }
    const max_x_mm = Number(body.max_x_mm)
    const max_y_mm = Number(body.max_y_mm)
    const max_z_mm = Number(body.max_z_mm)
    const hourly_rate = Number(body.hourly_rate)
    if ([max_x_mm, max_y_mm, max_z_mm, hourly_rate].some((n) => !Number.isFinite(n) || n < 0)) {
      return NextResponse.json({ error: 'max_x_mm, max_y_mm, max_z_mm, hourly_rate must be non-negative numbers' }, { status: 400 })
    }
    const name = typeof body.name === 'string' ? body.name : null
    const layer_heights_json =
      typeof body.layer_heights_json === 'string'
        ? body.layer_heights_json
        : Array.isArray(body.layer_heights_json)
          ? JSON.stringify(body.layer_heights_json)
          : null
    const is_active = body.is_active === false || body.is_active === 0 ? 0 : 1

    // layer_costs_json: 레이어별 시간당 비용(원). {"0.1":6000,"0.2":5000} — 견적 시 해당 레이어 선택 시 적용
    let layer_costs_json: string | null = null
    if (body.layer_costs_json != null) {
      if (typeof body.layer_costs_json === 'string') {
        try {
          const o = JSON.parse(body.layer_costs_json)
          if (o && typeof o === 'object' && !Array.isArray(o)) layer_costs_json = body.layer_costs_json
        } catch { /* invalid */ }
      } else if (typeof body.layer_costs_json === 'object' && !Array.isArray(body.layer_costs_json)) {
        const o = body.layer_costs_json as Record<string, unknown>
        const out: Record<string, number> = {}
        for (const [k, v] of Object.entries(o)) {
          const n = Number(v)
          if (Number.isFinite(n) && n >= 0) out[k] = n
        }
        layer_costs_json = Object.keys(out).length > 0 ? JSON.stringify(out) : null
      }
    }

    const hasLayerCosts = layer_costs_json != null
    const sql = hasLayerCosts
      ? `INSERT INTO printer_equipment (type, name, max_x_mm, max_y_mm, max_z_mm, hourly_rate, layer_heights_json, layer_costs_json, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(type) DO UPDATE SET
           name = excluded.name,
           max_x_mm = excluded.max_x_mm,
           max_y_mm = excluded.max_y_mm,
           max_z_mm = excluded.max_z_mm,
           hourly_rate = excluded.hourly_rate,
           layer_heights_json = excluded.layer_heights_json,
           layer_costs_json = excluded.layer_costs_json,
           is_active = excluded.is_active,
           updated_at = CURRENT_TIMESTAMP`
      : `INSERT INTO printer_equipment (type, name, max_x_mm, max_y_mm, max_z_mm, hourly_rate, layer_heights_json, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(type) DO UPDATE SET
           name = excluded.name,
           max_x_mm = excluded.max_x_mm,
           max_y_mm = excluded.max_y_mm,
           max_z_mm = excluded.max_z_mm,
           hourly_rate = excluded.hourly_rate,
           layer_heights_json = excluded.layer_heights_json,
           is_active = excluded.is_active,
           updated_at = CURRENT_TIMESTAMP`

    if (hasLayerCosts) {
      await env.DB.prepare(sql).bind(type, name, max_x_mm, max_y_mm, max_z_mm, hourly_rate, layer_heights_json, layer_costs_json, is_active).run()
    } else {
      await env.DB.prepare(sql).bind(type, name, max_x_mm, max_y_mm, max_z_mm, hourly_rate, layer_heights_json, is_active).run()
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('POST /api/admin/equipment', e)
    const msg = String(e instanceof Error ? e.message : e).toLowerCase()
    if (msg.includes('no such table') && msg.includes('printer_equipment')) {
      return NextResponse.json(
        { error: 'printer_equipment 테이블이 없습니다. 터미널에서: npx wrangler d1 execute wow3d-production --remote --file=./schema_equipment.sql' },
        { status: 503 }
      )
    }
    if (msg.includes('no such column') && msg.includes('layer_costs_json')) {
      return NextResponse.json(
        { error: 'layer_costs_json 컬럼이 없습니다. 레이어별 단가 저장을 위해 터미널에서 실행하세요: npx wrangler d1 execute wow3d-production --remote --file=./schema_equipment_layer_costs.sql' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 })
  }
}
