/**
 * 비회원이 고른 사진을 로그인·회원가입 다녀오는 동안 브라우저(IndexedDB)에 임시 보관
 * - 서버로 전송하지 않음. 1시간 지나면 무시
 */

export type PendingPhoto = {
    main: File
    right: File | null
    back: File | null
    left: File | null
    quality: 'fast' | 'standard'
    enhanceContrast: boolean
    useRemoveBg: boolean
}

type StoredPendingPhoto = PendingPhoto & { savedAt: number }

const DB_NAME = 'wow3d-meshy'
const STORE = 'pending-photo'
const KEY = 'current'
const MAX_AGE_MS = 60 * 60 * 1000

function openDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null)
    return new Promise((resolve) => {
        try {
            const req = indexedDB.open(DB_NAME, 1)
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
            }
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => resolve(null)
        } catch {
            resolve(null)
        }
    })
}

async function withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest
): Promise<T | null> {
    const db = await openDb()
    if (!db) return null
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE, mode)
            const req = run(tx.objectStore(STORE))
            let value: T | null = null
            req.onsuccess = () => {
                value = (req.result as T) ?? null
            }
            tx.oncomplete = () => {
                db.close()
                resolve(value)
            }
            tx.onerror = () => {
                db.close()
                resolve(null)
            }
            tx.onabort = () => {
                db.close()
                resolve(null)
            }
        } catch {
            db.close()
            resolve(null)
        }
    })
}

export async function savePendingPhoto(photo: PendingPhoto): Promise<void> {
    const stored: StoredPendingPhoto = { ...photo, savedAt: Date.now() }
    await withStore('readwrite', (s) => s.put(stored, KEY))
}

export async function clearPendingPhoto(): Promise<void> {
    await withStore('readwrite', (s) => s.delete(KEY))
}

/** 보관된 사진을 꺼내고 저장소에서 지움 (만료됐으면 null) */
export async function takePendingPhoto(): Promise<PendingPhoto | null> {
    const stored = await withStore<StoredPendingPhoto>('readonly', (s) => s.get(KEY))
    if (!stored) return null
    await clearPendingPhoto()
    if (!(stored.main instanceof Blob) || Date.now() - stored.savedAt > MAX_AGE_MS) return null
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
