/** 관리자 AI 3D 목록 — STL 썸네일 생성 동시 실행 제한 + 세션 캐시 */

const CACHE_VERSION = 'stl-v2'
const sessionCache = new Map<string, string>()
let activeTasks = 0
const waitQueue: Array<() => void> = []
/** WebGL 컨텍스트는 기기당 제한이 커서 동시 1개만 허용 (Context Lost 방지) */
const MAX_CONCURRENT_STL_THUMBNAILS = 1
/** 작업 사이 GPU 컨텍스트 정리 여유 */
const TASK_GAP_MS = 120

function cacheKey(jobId: number): string {
    return `${CACHE_VERSION}:${jobId}`
}

export function getCachedAdminJobThumbnail(jobId: number): string | undefined {
    return sessionCache.get(cacheKey(jobId))
}

export function setCachedAdminJobThumbnail(jobId: number, url: string): void {
    sessionCache.set(cacheKey(jobId), url)
}

function scheduleNext(): void {
    const next = waitQueue.shift()
    if (!next) return
    setTimeout(next, TASK_GAP_MS)
}

export function runAdminThumbnailTask<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        const run = () => {
            activeTasks++
            fn()
                .then(resolve, reject)
                .finally(() => {
                    activeTasks--
                    scheduleNext()
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
