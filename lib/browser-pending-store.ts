/**
 * 로그인·회원가입을 다녀오는 동안 브라우저(IndexedDB)에 값 하나를 임시 보관
 * - 서버로 전송하지 않음. 꺼내면 지우고, 보관 시간이 지나면 무시
 */

type Stored<T> = { value: T; savedAt: number }

const KEY = 'current'

function openDb(dbName: string, storeName: string): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null)
    return new Promise((resolve) => {
        try {
            const req = indexedDB.open(dbName, 1)
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(storeName)) req.result.createObjectStore(storeName)
            }
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => resolve(null)
        } catch {
            resolve(null)
        }
    })
}

async function withStore<R>(
    dbName: string,
    storeName: string,
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest
): Promise<R | null> {
    const db = await openDb(dbName, storeName)
    if (!db) return null
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(storeName, mode)
            const req = run(tx.objectStore(storeName))
            let value: R | null = null
            req.onsuccess = () => {
                value = (req.result as R) ?? null
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

export function createPendingStore<T>(dbName: string, storeName: string, maxAgeMs: number) {
    const clear = async (): Promise<void> => {
        await withStore(dbName, storeName, 'readwrite', (s) => s.delete(KEY))
    }
    return {
        async save(value: T): Promise<void> {
            const stored: Stored<T> = { value, savedAt: Date.now() }
            await withStore(dbName, storeName, 'readwrite', (s) => s.put(stored, KEY))
        },
        clear,
        /** 보관된 값을 꺼내고 저장소에서 지움 (없거나 만료됐으면 null) */
        async take(): Promise<T | null> {
            const stored = await withStore<Stored<T>>(dbName, storeName, 'readonly', (s) => s.get(KEY))
            if (!stored) return null
            await clear()
            if (Date.now() - stored.savedAt > maxAgeMs) return null
            return stored.value ?? null
        },
    }
}
