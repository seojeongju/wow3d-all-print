import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'

/**
 * GET /api/print-specs - 공개 출력 사양 (최대 크기, 레이어 두께, 시간당 비용)
 * 견적 페이지에서 최대 출력 초과 여부 확인·경고용
 */
export async function GET() {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) {
      return NextResponse.json({
        success: true,
        data: {
          fdm: { max: { x: 220, y: 220, z: 250 }, layerHeights: [0.1, 0.2, 0.3], hourlyRate: 5000 },
          sla: { max: { x: 145, y: 145, z: 175 }, layerHeights: [0.025, 0.05, 0.1], hourlyRate: 8000 },
          dlp: { max: { x: 120, y: 68, z: 200 }, layerHeights: [0.025, 0.05, 0.1], hourlyRate: 9000 },
        },
      })
    }
    const { results } = await env.DB.prepare('SELECT * FROM printer_equipment WHERE is_active = 1').all()
    const rows = (results || []) as Array<{
      type: string
      max_x_mm: number
      max_y_mm: number
      max_z_mm: number
      hourly_rate: number
      layer_heights_json: string | null
      layer_costs_json?: string | null
    }>
    const defaults: Record<string, { max: { x: number; y: number; z: number }; layerHeights: number[]; hourlyRate: number; layerCosts?: Record<string, number> }> = {
      fdm: { max: { x: 220, y: 220, z: 250 }, layerHeights: [0.1, 0.2, 0.3], hourlyRate: 5000 },
      sla: { max: { x: 145, y: 145, z: 175 }, layerHeights: [0.025, 0.05, 0.1], hourlyRate: 8000 },
      dlp: { max: { x: 120, y: 68, z: 200 }, layerHeights: [0.025, 0.05, 0.1], hourlyRate: 9000 },
    }
    const key = (t: string) => t.toLowerCase()
    for (const r of rows) {
      let arr: number[] = []
      try {
        if (r.layer_heights_json) arr = JSON.parse(r.layer_heights_json)
      } catch {}
      if (!Array.isArray(arr) || arr.length === 0) {
        arr = r.type === 'FDM' ? [0.1, 0.2, 0.3] : [0.025, 0.05, 0.1]
      }
      let layerCosts: Record<string, number> | undefined
      try {
        if (r.layer_costs_json && typeof r.layer_costs_json === 'string') {
          const o = JSON.parse(r.layer_costs_json)
          if (o && typeof o === 'object' && !Array.isArray(o)) {
            layerCosts = {}
            for (const [k, v] of Object.entries(o)) {
              const n = Number(v)
              if (Number.isFinite(n) && n >= 0) layerCosts![String(k)] = n
            }
            if (Object.keys(layerCosts).length === 0) layerCosts = undefined
          }
        }
      } catch {}
      const spec = {
        max: { x: r.max_x_mm, y: r.max_y_mm, z: r.max_z_mm },
        layerHeights: arr,
        hourlyRate: r.hourly_rate,
        ...(layerCosts ? { layerCosts } : {}),
      }
      defaults[key(r.type)] = spec
    }
    return NextResponse.json({ success: true, data: defaults })
  } catch (e) {
    console.error('GET /api/print-specs', e)
    return NextResponse.json({
      success: true,
      data: {
        fdm: { max: { x: 220, y: 220, z: 250 }, layerHeights: [0.1, 0.2, 0.3], hourlyRate: 5000 },
        sla: { max: { x: 145, y: 145, z: 175 }, layerHeights: [0.025, 0.05, 0.1], hourlyRate: 8000 },
        dlp: { max: { x: 120, y: 68, z: 200 }, layerHeights: [0.025, 0.05, 0.1], hourlyRate: 9000 },
      },
    })
  }
}
