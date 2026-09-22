export type PopupSizePreset = 'sm' | 'md' | 'lg' | 'xl'
export type PopupPositionPreset =
  | 'center'
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center'

export const POPUP_SIZE_PRESETS: {
  value: PopupSizePreset
  label: string
  maxWidthPx: number
  imageMaxHPx: number
}[] = [
  { value: 'sm', label: '작음 (320px)', maxWidthPx: 320, imageMaxHPx: 260 },
  { value: 'md', label: '보통 (400px)', maxWidthPx: 400, imageMaxHPx: 360 },
  { value: 'lg', label: '큼 (520px)', maxWidthPx: 520, imageMaxHPx: 440 },
  { value: 'xl', label: '더 큼 (640px)', maxWidthPx: 640, imageMaxHPx: 520 },
]

export const POPUP_POSITION_PRESETS: {
  value: PopupPositionPreset
  label: string
}[] = [
  { value: 'center', label: '화면 중앙' },
  { value: 'top-center', label: '상단 중앙' },
  { value: 'top-left', label: '좌측 상단' },
  { value: 'top-right', label: '우측 상단' },
  { value: 'bottom-left', label: '좌측 하단' },
  { value: 'bottom-right', label: '우측 하단' },
  { value: 'bottom-center', label: '하단 중앙' },
]

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
  size_preset?: string | null
  position_preset?: string | null
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
  sizePreset: PopupSizePreset
  positionPreset: PopupPositionPreset
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

const SIZE_SET = new Set<string>(POPUP_SIZE_PRESETS.map((p) => p.value))
const POSITION_SET = new Set<string>(POPUP_POSITION_PRESETS.map((p) => p.value))

export function normalizePopupSizePreset(v: unknown): PopupSizePreset {
  const s = String(v ?? '').trim().toLowerCase()
  return SIZE_SET.has(s) ? (s as PopupSizePreset) : 'md'
}

export function normalizePopupPositionPreset(v: unknown): PopupPositionPreset {
  const s = String(v ?? '').trim().toLowerCase()
  return POSITION_SET.has(s) ? (s as PopupPositionPreset) : 'center'
}

export function getPopupSizeConfig(preset: PopupSizePreset) {
  return POPUP_SIZE_PRESETS.find((p) => p.value === preset) || POPUP_SIZE_PRESETS[1]
}

/** 뷰포트 기준 초기 좌표 (드래그 전) */
export function resolvePopupPosition(
  position: PopupPositionPreset,
  boxW: number,
  boxH: number,
  viewportW: number,
  viewportH: number
): { x: number; y: number } {
  const margin = 16
  const topSafe = Math.max(80, margin) // 헤더 여유
  const maxX = Math.max(margin, viewportW - boxW - margin)
  const maxY = Math.max(margin, viewportH - Math.min(boxH, viewportH - margin * 2) - margin)

  const centerX = Math.round((viewportW - boxW) / 2)
  const centerY = Math.round((viewportH - boxH) / 2)

  let x = centerX
  let y = Math.max(topSafe, centerY)

  switch (position) {
    case 'top-left':
      x = margin
      y = topSafe
      break
    case 'top-right':
      x = maxX
      y = topSafe
      break
    case 'top-center':
      x = centerX
      y = topSafe
      break
    case 'bottom-left':
      x = margin
      y = maxY
      break
    case 'bottom-right':
      x = maxX
      y = maxY
      break
    case 'bottom-center':
      x = centerX
      y = maxY
      break
    case 'center':
    default:
      x = centerX
      y = Math.max(topSafe, Math.min(maxY, centerY))
      break
  }

  return {
    x: Math.min(maxX, Math.max(margin, x)),
    y: Math.min(maxY, Math.max(margin, y)),
  }
}

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
    sizePreset: normalizePopupSizePreset(row.size_preset),
    positionPreset: normalizePopupPositionPreset(row.position_preset),
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
