/**
 * 사진→AI 3D 업로드 전 클라이언트 전처리
 * - 긴 변 maxEdge로 리사이즈
 * - 선택적 대비 강화
 */

const DEFAULT_MAX_EDGE = 1600

function clampByte(n: number): number {
    return Math.max(0, Math.min(255, Math.round(n)))
}

export async function preprocessMeshyImage(
    file: File,
    options?: { enhanceContrast?: boolean; maxEdge?: number }
): Promise<File> {
    const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE
    const enhanceContrast = options?.enhanceContrast ?? true

    const bitmap = await createImageBitmap(file)
    try {
        const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
        const w = Math.max(1, Math.round(bitmap.width * scale))
        const h = Math.max(1, Math.round(bitmap.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return file

        ctx.drawImage(bitmap, 0, 0, w, h)

        if (enhanceContrast) {
            const img = ctx.getImageData(0, 0, w, h)
            const d = img.data
            // 단순 선형 대비: (v - 128) * factor + 128
            const factor = 1.25
            for (let i = 0; i < d.length; i += 4) {
                d[i] = clampByte((d[i] - 128) * factor + 128)
                d[i + 1] = clampByte((d[i + 1] - 128) * factor + 128)
                d[i + 2] = clampByte((d[i + 2] - 128) * factor + 128)
            }
            ctx.putImageData(img, 0, 0)
        }

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', 0.92)
        )
        if (!blob) return file

        const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
        return new File([blob], `${base}-prep.jpg`, { type: 'image/jpeg' })
    } finally {
        bitmap.close()
    }
}
