import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'
import { loadPrintSpecs, PRINT_SPECS_NO_DB, PRINT_SPECS_ON_ERROR } from '@/lib/pricing-public-data'

/**
 * GET /api/print-specs - 공개 출력 사양 (최대 크기, 레이어 두께, 시간당 비용)
 * 견적 페이지에서 최대 출력 초과 여부 확인·경고용
 */
export async function GET() {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) {
      return NextResponse.json({ success: true, data: PRINT_SPECS_NO_DB })
    }
    const data = await loadPrintSpecs(env.DB)
    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('GET /api/print-specs', e)
    return NextResponse.json({ success: true, data: PRINT_SPECS_ON_ERROR })
  }
}
