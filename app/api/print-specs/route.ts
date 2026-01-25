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
      fdm_layer_hours_factor?: number | null
      fdm_labor_cost_krw?: number | null
      fdm_support_per_cm2_krw?: number | null
      sla_layer_exposure_sec?: number | null
      sla_labor_cost_krw?: number | null
      sla_consumables_krw?: number | null
      sla_post_process_krw?: number | null
      dlp_layer_exposure_sec?: number | null
      dlp_labor_cost_krw?: number | null
      dlp_consumables_krw?: number | null
      dlp_post_process_krw?: number | null
    }>
    type Spec = { max: { x: number; y: number; z: number }; layerHeights: number[]; hourlyRate: number; layerCosts?: Record<string, number>; fdm_layer_hours_factor?: number; fdm_labor_cost_krw?: number; fdm_support_per_cm2_krw?: number; sla_layer_exposure_sec?: number; sla_labor_cost_krw?: number; sla_consumables_krw?: number; sla_post_process_krw?: number; dlp_layer_exposure_sec?: number; dlp_labor_cost_krw?: number; dlp_consumables_krw?: number; dlp_post_process_krw?: number }
    const defaults: Record<string, Spec> = {
      fdm: { max: { x: 220, y: 220, z: 250 }, layerHeights: [0.1, 0.2, 0.3], hourlyRate: 5000, fdm_layer_hours_factor: 0.02, fdm_labor_cost_krw: 6500, fdm_support_per_cm2_krw: 26 },
      sla: { max: { x: 145, y: 145, z: 175 }, layerHeights: [0.025, 0.05, 0.1], hourlyRate: 8000, sla_layer_exposure_sec: 8, sla_labor_cost_krw: 9100, sla_consumables_krw: 3900, sla_post_process_krw: 10400 },
      dlp: { max: { x: 120, y: 68, z: 200 }, layerHeights: [0.025, 0.05, 0.1], hourlyRate: 9000, dlp_layer_exposure_sec: 3, dlp_labor_cost_krw: 9100, dlp_consumables_krw: 3900, dlp_post_process_krw: 10400 },
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
      const spec: Spec = {
        max: { x: r.max_x_mm, y: r.max_y_mm, z: r.max_z_mm },
        layerHeights: arr,
        hourlyRate: r.hourly_rate,
        ...(layerCosts ? { layerCosts } : {}),
        fdm_layer_hours_factor: r.fdm_layer_hours_factor ?? 0.02,
        fdm_labor_cost_krw: r.fdm_labor_cost_krw ?? 6500,
        fdm_support_per_cm2_krw: r.fdm_support_per_cm2_krw ?? 26,
        sla_layer_exposure_sec: r.sla_layer_exposure_sec ?? 8,
        sla_labor_cost_krw: r.sla_labor_cost_krw ?? 9100,
        sla_consumables_krw: r.sla_consumables_krw ?? 3900,
        sla_post_process_krw: r.sla_post_process_krw ?? 10400,
        dlp_layer_exposure_sec: r.dlp_layer_exposure_sec ?? 3,
        dlp_labor_cost_krw: r.dlp_labor_cost_krw ?? 9100,
        dlp_consumables_krw: r.dlp_consumables_krw ?? 3900,
        dlp_post_process_krw: r.dlp_post_process_krw ?? 10400,
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
