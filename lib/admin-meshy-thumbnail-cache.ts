/** 관리자 AI 3D 목록 — STL 썸네일 생성 동시 실행 제한 + 세션 캐시 */

const sessionCache = new Map<number, string>()
let activeTasks = 0
const waitQueue: Array<() => void> = []
const MAX_CONCURRENT_STL_THUMBNAILS = 2

export function getCachedAdminJobThumbnail(jobId: number): string | undefined {
    return sessionCache.get(jobId)
}

export function setCachedAdminJobThumbnail(jobId: number, url: string): void {
    sessionCache.set(jobId, url)
}

export function runAdminThumbnailTask<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        const run = () => {
            activeTasks++
            fn()
                .then(resolve, reject)
                .finally(() => {
                    activeTasks--
                    const next = waitQueue.shift()
                    if (next) next()
                })
        }
        if (activeTasks < MAX_CONCURRENT_STL_THUMBNAILS) run()
        else waitQueue.push(run)
    })
}

export function withThumbnailTimeout<T>(promise: Promise<T>, ms = 20_000): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('thumbnail_timeout')), ms)
        promise.then(
            (v) => {
                clearTimeout(timer)
                resolve(v)
            },
            (e) => {
                clearTimeout(timer)
                reject(e)
            }
        )
    })
}
