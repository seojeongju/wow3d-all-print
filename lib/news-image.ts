/**
 * 최신 동향 이미지 업로드 전 자동 맞춤 (브라우저 전용)
 * - 대표 이미지: 1600×900(16:9) JPEG로 통일 — 카드·상세·공유 썸네일 비율 통일
 *   · contain(기본): 원본 전체를 넣고 남는 여백은 같은 이미지를 흐리게 깔아 채움 (배너·글자 이미지용)
 *   · crop: 가운데 기준으로 잘라 꽉 채움 (사진·AI 생성 이미지용)
 * - 본문 이미지: 비율 유지, 긴 변 1600px 이하로 축소
 */

export const NEWS_COVER_WIDTH = 1600
export const NEWS_COVER_HEIGHT = 900
const CONTENT_MAX_EDGE = 1600
const JPEG_QUALITY = 0.85

export type NewsCoverFit = 'contain' | 'crop'

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function renamed(file: File, ext: string): string {
    return `${file.name.replace(/\.[^.]+$/, '') || 'image'}.${ext}`
}

/** ctx.filter(blur)를 지원하지 않는 Safari 구버전도 고려해, 아주 작게 줄였다가 키우는 방식으로 흐림 효과를 낸다 */
function drawBlurredBackground(ctx: CanvasRenderingContext2D, bitmap: ImageBitmap, w: number, h: number) {
    const small = document.createElement('canvas')
    small.width = 32
    small.height = Math.max(1, Math.round((32 * h) / w))
    const sctx = small.getContext('2d')
    if (sctx) {
        const scale = Math.max(small.width / bitmap.width, small.height / bitmap.height)
        const dw = bitmap.width * scale
        const dh = bitmap.height * scale
        sctx.drawImage(bitmap, (small.width - dw) / 2, (small.height - dh) / 2, dw, dh)
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(small, 0, 0, w, h)
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)'
    ctx.fillRect(0, 0, w, h)
}

export async function fitNewsImage(
    file: File,
    role: 'cover' | 'content',
    coverFit: NewsCoverFit = 'contain'
): Promise<File> {
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
            const sourceRatio = sw / sh
            const nearlySame = Math.abs(sourceRatio - targetRatio) / targetRatio < 0.03

            if (coverFit === 'contain' && !nearlySame) {
                canvas.width = NEWS_COVER_WIDTH
                canvas.height = NEWS_COVER_HEIGHT
                drawBlurredBackground(ctx, bitmap, canvas.width, canvas.height)
                const scale = Math.min(canvas.width / sw, canvas.height / sh)
                const dw = Math.round(sw * scale)
                const dh = Math.round(sh * scale)
                ctx.drawImage(bitmap, Math.round((canvas.width - dw) / 2), Math.round((canvas.height - dh) / 2), dw, dh)
            } else {
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
            }
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
