export type PopupRow = {
  id: number
  store_id: number
  title: string
  body: string | null
  image_key: string | null
  link_url: string | null
  start_at: string | null
  end_at: string | null
  is_visible: number | boolean
  sort_order: number
  dismiss_days: number
  created_at: string
  updated_at: string
}

export type PublicPopup = {
  id: number
  title: string
  body: string | null
  imageUrl: string | null
  linkUrl: string | null
  dismissDays: number
  sortOrder: number
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

export function popupImageUrlFromKey(imageKey: string | null | undefined): string | null {
  if (!imageKey) return null
  const relative = imageKey.replace(/^popup\//, '')
  return `/api/popup/image/${relative}`
}

export function toPublicPopup(row: PopupRow): PublicPopup {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: popupImageUrlFromKey(row.image_key),
    linkUrl: row.link_url,
    dismissDays: Number(row.dismiss_days ?? 1),
    sortOrder: Number(row.sort_order ?? 0),
  }
}

export function validatePopupImage(file: File): string | null {
  if (!file || file.size <= 0) return '이미지 파일이 필요합니다'
  if (file.size > 8 * 1024 * 1024) return '이미지는 8MB 이하만 업로드할 수 있습니다'
  if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'jpg, png, webp, gif 이미지만 업로드할 수 있습니다'
  }
  return null
}

export async function uploadPopupImage(
  bucket: CloudflareEnv['BUCKET'],
  file: File,
  storeId: number
): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const r2Key = `popup/${storeId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const buf = await file.arrayBuffer()
  await bucket.put(r2Key, buf, {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  })
  return r2Key
}

/** 기간·공개 여부 기준 활성 팝업 SQL WHERE (store_id 바인딩 1개) */
export const ACTIVE_POPUPS_WHERE = `
  store_id = ?
  AND is_visible = 1
  AND (start_at IS NULL OR start_at = '' OR datetime(start_at) <= datetime('now'))
  AND (end_at IS NULL OR end_at = '' OR datetime(end_at) >= datetime('now'))
`

export function dismissStorageKey(popupId: number): string {
  return `wow3d_popup_dismiss_${popupId}`
}

export function isPopupDismissed(popupId: number): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(dismissStorageKey(popupId))
    if (!raw) return false
    const until = Number(raw)
    if (!Number.isFinite(until)) return false
    return Date.now() < until
  } catch {
    return false
  }
}

export function dismissPopup(popupId: number, days: number): void {
  if (typeof window === 'undefined') return
  const safeDays = Math.max(0, Math.min(365, Number(days) || 0))
  if (safeDays <= 0) return
  try {
    const until = Date.now() + safeDays * 24 * 60 * 60 * 1000
    localStorage.setItem(dismissStorageKey(popupId), String(until))
  } catch {
    /* ignore */
  }
}
