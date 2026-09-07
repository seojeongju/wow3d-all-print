import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { ACTIVE_POPUPS_WHERE, toPublicPopup, type PopupRow } from '@/lib/popup'

/**
 * GET /api/popups/active?store_id=1
 * 공개 활성 팝업 목록
 */
export async function GET(request: NextRequest) {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) {
      return NextResponse.json({ success: true, data: { items: [] } })
    }

    const storeId = Math.max(
      1,
      parseInt(new URL(request.url).searchParams.get('store_id') || '1', 10) || 1
    )

    try {
      const { results } = await env.DB.prepare(
        `SELECT * FROM popups
         WHERE ${ACTIVE_POPUPS_WHERE}
         ORDER BY sort_order ASC, id DESC
         LIMIT 10`
      )
        .bind(storeId)
        .all()

      return NextResponse.json(
        {
          success: true,
          data: {
            items: ((results || []) as PopupRow[]).map(toPublicPopup),
          },
        },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('no such table')) {
        return NextResponse.json({ success: true, data: { items: [] } })
      }
      throw e
    }
  } catch (e) {
    console.error('GET /api/popups/active', e)
    return NextResponse.json({ success: true, data: { items: [] } })
  }
}
