/**
 * IndexNow — 글 발행·수정·삭제 시 검색엔진에 즉시 알림 (네이버 서치어드바이저·Bing 등)
 * 구글은 IndexNow 미지원 → 사이트맵(/sitemap.xml)으로 수집된다.
 * 키는 공개용(검증 파일에 그대로 노출되는 값)이라 비밀값이 아니다. 검증 파일: public/{키}.txt
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { SITE_URL } from '@/lib/site-url'

export const INDEXNOW_KEY = '0edf0def77034e6ea8777e7373d2ca03'

/** api.indexnow.org는 참여 검색엔진(Bing 등)에 공유, 네이버는 전용 엔드포인트로 별도 전송 */
const INDEXNOW_ENDPOINTS = ['https://api.indexnow.org/indexnow', 'https://searchadvisor.naver.com/indexnow']

export type IndexNowResult = { endpoint: string; status: number | null; error?: string }

function isProductionSite(): boolean {
    if (process.env.NODE_ENV !== 'production') return false
    try {
        return new URL(SITE_URL).hostname === 'www.wow3dp.co.kr'
    } catch {
        return false
    }
}

export async function submitIndexNow(urls: string[]): Promise<IndexNowResult[]> {
    const urlList = [...new Set(urls.filter((u) => u.startsWith(SITE_URL)))].slice(0, 100)
    if (!urlList.length || !isProductionSite()) return []

    const host = new URL(SITE_URL).hostname
    const body = JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
    })
    return Promise.all(
        INDEXNOW_ENDPOINTS.map(async (endpoint): Promise<IndexNowResult> => {
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                    body,
                })
                if (!res.ok) {
                    const text = (await res.text().catch(() => '')).slice(0, 200)
                    console.warn('[indexnow] 실패', endpoint, res.status, text)
                    return { endpoint, status: res.status, error: text }
                }
                return { endpoint, status: res.status }
            } catch (e) {
                const error = e instanceof Error ? e.message : String(e)
                console.warn('[indexnow] 오류', endpoint, error)
                return { endpoint, status: null, error }
            }
        })
    )
}

/** 응답을 기다리지 않고 백그라운드로 전송 — 관리자 저장 속도에 영향 없음 */
export function queueIndexNow(urls: string[]): boolean {
    if (!urls.length || !isProductionSite()) return false
    const job = submitIndexNow(urls).then((results) => {
        if (results.length) console.log('[indexnow]', urls.length, '건', results.map((r) => `${r.endpoint}:${r.status}`).join(', '))
    })
    try {
        getCloudflareContext().ctx.waitUntil(job)
    } catch {
        void job
    }
    return true
}

export function newsPostUrl(slug: string): string {
    return `${SITE_URL}/news/${encodeURIComponent(slug)}`
}

/** 최신 동향 글 변경 알림 — 글 주소 + 목록(/news) */
export function newsIndexNowUrls(...slugs: (string | null | undefined)[]): string[] {
    const list = slugs.filter((s): s is string => Boolean(s)).map(newsPostUrl)
    return list.length ? [...list, `${SITE_URL}/news`] : []
}

/** UTC SQL('YYYY-MM-DD HH:MM:SS') 발행 시각이 지금 이전이면 공개 상태 */
export function isPublishedNow(status: string | null | undefined, publishedAt: string | null | undefined): boolean {
    if (status !== 'published' || !publishedAt) return false
    return publishedAt <= new Date().toISOString().slice(0, 19).replace('T', ' ')
}
