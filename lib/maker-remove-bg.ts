/** Maker 배경 제거(remove.bg) 한도 */

export const REMOVE_BG_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const REMOVE_BG_GUEST_DAILY_LIMIT = 2
export const REMOVE_BG_USER_DAILY_LIMIT = 5

export function isAllowedRemoveBgImage(file: { type?: string; name?: string }): boolean {
    const type = (file.type || '').toLowerCase()
    if (type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png') return true
    const name = (file.name || '').toLowerCase()
    return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

export function parseRemoveBgError(status: number, bodyText: string): string {
    let title = ''
    try {
        const j = JSON.parse(bodyText) as {
            errors?: { title?: string; code?: string }[]
            error?: string
        }
        title = j.errors?.[0]?.title || j.errors?.[0]?.code || j.error || ''
    } catch {
        /* ignore */
    }
    if (status === 402 || /credit|quota|insufficient/i.test(title) || /한도/.test(title)) {
        return '배경 제거 API 크레딧(한도)이 부족합니다. 배경 없이 변환하거나 내일 다시 시도해 주세요.'
    }
    if (status === 429 || /rate/i.test(title)) {
        return '배경 제거 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
    }
    if (status === 400) {
        return title || '배경 제거할 수 없는 이미지입니다. JPG/PNG로 다시 올려 주세요.'
    }
    return title || '배경 제거에 실패했습니다.'
}
