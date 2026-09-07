import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import {
  popupImageUrlFromKey,
  uploadPopupImage,
  validatePopupImage,
  type PopupRow,
} from '@/lib/popup'

function parseBool(v: FormDataEntryValue | null | undefined): boolean | undefined {
  if (v == null || v === '') return undefined
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'on' || s === 'yes'
}

function parseIntOrUndef(v: FormDataEntryValue | null | undefined): number | undefined {
  if (v == null || v === '') return undefined
  const n = parseInt(String(v), 10)
  return Number.isFinite(n) ? n : undefined
}

function emptyToNull(v: FormDataEntryValue | null | undefined): string | null | undefined {
  if (v == null) return undefined
  const s = String(v).trim()
  return s ? s : null
}

/**
 * PUT /api/admin/popups/[id] — multipart 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idRaw } = await params
  const id = parseInt(idRaw, 10)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
  }

  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) {
      return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })
    }

    const admin = await requireAdminAuth(request, env.DB)
    if (admin instanceof Response) return admin

    const existing = await env.DB.prepare(
      `SELECT * FROM popups WHERE id = ? AND store_id = ?`
    )
      .bind(id, admin.storeId)
      .first<PopupRow>()

    if (!existing) {
      return NextResponse.json({ error: '팝업을 찾을 수 없습니다' }, { status: 404 })
    }

    const formData = await request.formData()
    const title = String(formData.get('title') ?? existing.title).trim()
    if (!title) {
      return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 })
    }

    const body = emptyToNull(formData.get('body'))
    const linkUrl = emptyToNull(formData.get('link_url'))
    const startAt = emptyToNull(formData.get('start_at'))
    const endAt = emptyToNull(formData.get('end_at'))
    const isVisible = parseBool(formData.get('is_visible'))
    const sortOrder = parseIntOrUndef(formData.get('sort_order'))
    const dismissDaysRaw = parseIntOrUndef(formData.get('dismiss_days'))
    const clearImage = String(formData.get('clear_image') || '') === '1'
    const imageFile = formData.get('image') as File | null

    let imageKey = existing.image_key
    const oldKey = existing.image_key

    if (clearImage) {
      imageKey = null
    }

    if (imageFile && imageFile.size > 0) {
      const err = validatePopupImage(imageFile)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
      if (!env.BUCKET) {
        return NextResponse.json({ error: 'R2 BUCKET이 없습니다' }, { status: 503 })
      }
      imageKey = await uploadPopupImage(env.BUCKET, imageFile, admin.storeId)
    }

    await env.DB.prepare(
      `UPDATE popups SET
        title = ?,
        body = ?,
        link_url = ?,
        start_at = ?,
        end_at = ?,
        is_visible = ?,
        sort_order = ?,
        dismiss_days = ?,
        image_key = ?,
        updated_at = datetime('now')
      WHERE id = ? AND store_id = ?`
    )
      .bind(
        title,
        body === undefined ? existing.body : body,
        linkUrl === undefined ? existing.link_url : linkUrl,
        startAt === undefined ? existing.start_at : startAt,
        endAt === undefined ? existing.end_at : endAt,
        isVisible === undefined ? (existing.is_visible ? 1 : 0) : isVisible ? 1 : 0,
        sortOrder === undefined ? existing.sort_order : sortOrder,
        dismissDaysRaw === undefined
          ? existing.dismiss_days
          : Math.max(0, Math.min(365, dismissDaysRaw)),
        imageKey,
        id,
        admin.storeId
      )
      .run()

    if (
      env.BUCKET &&
      oldKey &&
      oldKey !== imageKey &&
      (clearImage || (imageFile && imageFile.size > 0))
    ) {
      try {
        await env.BUCKET.delete(oldKey)
      } catch (e) {
        console.warn('popup old image delete failed', oldKey, e)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        image_key: imageKey,
        image_url: popupImageUrlFromKey(imageKey),
      },
    })
  } catch (e) {
    console.error('PUT /api/admin/popups/[id]', e)
    return NextResponse.json({ error: '팝업 수정 실패' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/popups/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idRaw } = await params
  const id = parseInt(idRaw, 10)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
  }

  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) {
      return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })
    }

    const admin = await requireAdminAuth(request, env.DB)
    if (admin instanceof Response) return admin

    const existing = await env.DB.prepare(
      `SELECT image_key FROM popups WHERE id = ? AND store_id = ?`
    )
      .bind(id, admin.storeId)
      .first<{ image_key: string | null }>()

    if (!existing) {
      return NextResponse.json({ error: '팝업을 찾을 수 없습니다' }, { status: 404 })
    }

    await env.DB.prepare(`DELETE FROM popups WHERE id = ? AND store_id = ?`)
      .bind(id, admin.storeId)
      .run()

    if (env.BUCKET && existing.image_key) {
      try {
        await env.BUCKET.delete(existing.image_key)
      } catch (e) {
        console.warn('popup image delete failed', existing.image_key, e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/popups/[id]', e)
    return NextResponse.json({ error: '팝업 삭제 실패' }, { status: 500 })
  }
}
