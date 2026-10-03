/**
 * 최신 동향 이미지 업로드 전 자동 맞춤 (브라우저 전용)
 * - 대표 이미지: 가운데 기준 16:9로 잘라 1600×900 JPEG — 카드·상세·공유 썸네일 비율 통일
 * - 본문 이미지: 비율 유지, 긴 변 1600px 이하로 축소
 */

export const NEWS_COVER_WIDTH = 1600
export const NEWS_COVER_HEIGHT = 900
const CONTENT_MAX_EDGE = 1600
const JPEG_QUALITY = 0.85

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function renamed(file: File, ext: string): string {
    return `${file.name.replace(/\.[^.]+$/, '') || 'image'}.${ext}`
}

export async function fitNewsImage(file: File, role: 'cover' | 'content'): Promise<File> {
    /** 움직이는 GIF는 캔버스로 그리면 첫 프레임만 남으므로 그대로 업로드 */
    if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) return file

    let bitmap: ImageBitmap
    try {
        bitmap = await createImageBitmap(file)
    } catch {
        return file
    }
    try {
        const { width: sw, height: sh } = bitmap
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return file
        ctx.imageSmoothingQuality = 'high'

        if (role === 'cover') {
            const targetRatio = NEWS_COVER_WIDTH / NEWS_COVER_HEIGHT
            let cw = sw
            let ch = Math.round(sw / targetRatio)
            if (ch > sh) {
                ch = sh
                cw = Math.round(sh * targetRatio)
            }
            const sx = Math.round((sw - cw) / 2)
            const sy = Math.round((sh - ch) / 2)
            const scale = Math.min(1, NEWS_COVER_WIDTH / cw)
            canvas.width = Math.round(cw * scale)
            canvas.height = Math.round(ch * scale)
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(bitmap, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height)
            const blob = await toBlob(canvas, 'image/jpeg', JPEG_QUALITY)
            return blob ? new File([blob], renamed(file, 'jpg'), { type: 'image/jpeg' }) : file
        }

        const scale = Math.min(1, CONTENT_MAX_EDGE / Math.max(sw, sh))
        const isPng = file.type === 'image/png' || /\.png$/i.test(file.name)
        if (scale === 1 && file.size <= 800 * 1024) return file
        canvas.width = Math.max(1, Math.round(sw * scale))
        canvas.height = Math.max(1, Math.round(sh * scale))
        if (!isPng) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        /** PNG(도표·투명 배경)는 투명도를 지키기 위해 PNG 유지 */
        const blob = isPng ? await toBlob(canvas, 'image/png') : await toBlob(canvas, 'image/jpeg', JPEG_QUALITY)
        if (!blob || blob.size >= file.size) return file
        return new File([blob], renamed(file, isPng ? 'png' : 'jpg'), { type: isPng ? 'image/png' : 'image/jpeg' })
    } finally {
        bitmap.close()
    }
}
