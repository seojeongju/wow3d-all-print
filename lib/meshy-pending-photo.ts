/**
 * 비회원이 고른 사진을 로그인·회원가입 다녀오는 동안 브라우저(IndexedDB)에 임시 보관
 * - 서버로 전송하지 않음. 1시간 지나면 무시
 */
import { createPendingStore } from '@/lib/browser-pending-store'

export type PendingPhoto = {
    main: File
    right: File | null
    back: File | null
    left: File | null
    quality: 'fast' | 'standard'
    enhanceContrast: boolean
    useRemoveBg: boolean
}

const store = createPendingStore<PendingPhoto>('wow3d-meshy', 'pending-photo', 60 * 60 * 1000)

export async function savePendingPhoto(photo: PendingPhoto): Promise<void> {
    await store.save(photo)
}

export async function clearPendingPhoto(): Promise<void> {
    await store.clear()
}

/** 보관된 사진을 꺼내고 저장소에서 지움 (만료됐으면 null) */
export async function takePendingPhoto(): Promise<PendingPhoto | null> {
    const stored = await store.take()
    if (!stored || !(stored.main instanceof Blob)) return null
    return {
        main: stored.main,
        right: stored.right ?? null,
        back: stored.back ?? null,
        left: stored.left ?? null,
        quality: stored.quality === 'fast' ? 'fast' : 'standard',
        enhanceContrast: stored.enhanceContrast !== false,
        useRemoveBg: !!stored.useRemoveBg,
    }
}
