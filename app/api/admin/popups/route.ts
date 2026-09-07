import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import {
  popupImageUrlFromKey,
  uploadPopupImage,
  validatePopupImage,
  type PopupRow,
} from '@/lib/popup'

function parseBool(v: FormDataEntryValue | null | undefined, fallback = false): boolean {
  if (v == null || v === '') return fallback
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'on' || s === 'yes'
}

function parseIntOr(v: FormDataEntryValue | null | undefined, fallback: number): number {
  if (v == null || v === '') return fallback
  const n = parseInt(String(v), 10)
  return Number.isFinite(n) ? n : fallback
}

function emptyToNull(v: FormDataEntryValue | null | undefined): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

/**
 * GET /api/admin/popups
 */
export async function GET(request: NextRequest) {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) {
      return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })
    }

    const admin = await requireAdminAuth(request, env.DB)
    if (admin instanceof Response) return admin

    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20))
    const offset = (page - 1) * limit
    const q = url.searchParams.get('q')?.trim() || ''
    const visibleParam = (url.searchParams.get('visible') || 'all').toLowerCase()

    let where = 'WHERE store_id = ?'
    const binds: (string | number)[] = [admin.storeId]

    if (visibleParam === '1' || visibleParam === 'visible') {
      where += ' AND is_visible = 1'
    } else if (visibleParam === '0' || visibleParam === 'hidden') {
      where += ' AND (is_visible = 0 OR is_visible IS NULL)'
    }

    if (q) {
      where += ` AND (
        LOWER(COALESCE(title, '')) LIKE LOWER(?)
        OR LOWER(COALESCE(body, '')) LIKE LOWER(?)
      )`
      binds.push(`%${q.replace(/[%_]/g, '')}%`, `%${q.replace(/[%_]/g, '')}%`)
    }

    try {
      const countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM popups ${where}`)
        .bind(...binds)
        .first<{ cnt?: number }>()
      const total = Number(countRow?.cnt ?? 0)

      const { results } = await env.DB.prepare(
        `SELECT * FROM popups ${where}
         ORDER BY sort_order ASC, created_at DESC
         LIMIT ? OFFSET ?`
      )
        .bind(...binds, limit, offset)
        .all()

      const items = ((results || []) as PopupRow[]).map((row) => ({
        ...row,
        image_url: popupImageUrlFromKey(row.image_key),
      }))

      return NextResponse.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        },
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('no such table')) {
        return NextResponse.json({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit, total: 0, totalPages: 1 },
            needsMigration: true,
          },
        })
      }
      throw e
    }
  } catch (e) {
    console.error('GET /api/admin/popups', e)
    return NextResponse.json({ error: '팝업 목록 조회 실패' }, { status: 500 })
  }
}

/**
 * POST /api/admin/popups — multipart
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) {
      return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })
    }

    const admin = await requireAdminAuth(request, env.DB)
    if (admin instanceof Response) return admin

    const formData = await request.formData()
    const title = String(formData.get('title') || '').trim()
    const body = emptyToNull(formData.get('body'))
    const linkUrl = emptyToNull(formData.get('link_url'))
    const startAt = emptyToNull(formData.get('start_at'))
    const endAt = emptyToNull(formData.get('end_at'))
    const isVisible = parseBool(formData.get('is_visible'), false)
    const sortOrder = parseIntOr(formData.get('sort_order'), 0)
    const dismissDays = Math.max(0, Math.min(365, parseIntOr(formData.get('dismiss_days'), 1)))
    const imageFile = formData.get('image') as File | null

    if (!title) {
      return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 })
    }

    let imageKey: string | null = null
    if (imageFile && imageFile.size > 0) {
      const err = validatePopupImage(imageFile)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
      if (!env.BUCKET) {
        return NextResponse.json({ error: 'R2 BUCKET이 없습니다' }, { status: 503 })
      }
      imageKey = await uploadPopupImage(env.BUCKET, imageFile, admin.storeId)
    }

    const result = await env.DB.prepare(
      `INSERT INTO popups (
        store_id, title, body, image_key, link_url,
        start_at, end_at, is_visible, sort_order, dismiss_days,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(
        admin.storeId,
        title,
        body,
        imageKey,
        linkUrl,
        startAt,
        endAt,
        isVisible ? 1 : 0,
        sortOrder,
        dismissDays
      )
      .run()

    const id = result.meta?.last_row_id
    return NextResponse.json(
      {
        success: true,
        data: {
          id,
          image_key: imageKey,
          image_url: popupImageUrlFromKey(imageKey),
        },
      },
      { status: 201 }
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('POST /api/admin/popups', e)
    if (msg.includes('no such table')) {
      return NextResponse.json(
        { error: '팝업 테이블이 없습니다. DB 마이그레이션을 적용해주세요.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: '팝업 생성 실패' }, { status: 500 })
  }
}
