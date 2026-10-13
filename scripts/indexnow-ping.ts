/**
 * 배포 후 내용이 바뀐 페이지를 IndexNow(Bing·네이버 서치어드바이저)에 알림 — 한국어·영어 주소를 함께 전송
 * 실행: npx --yes tsx scripts/indexnow-ping.ts /quote /qna /guides/minimum-wall-thickness
 * 구글은 IndexNow를 지원하지 않으므로 사이트맵으로 수집된다.
 */
export {}

async function main() {
    const paths = process.argv.slice(2)
    if (!paths.length) {
        console.error('알릴 경로를 하나 이상 넘겨 주세요. 예: /quote /qna')
        process.exit(1)
    }
    // 사이트 주소와 전송 허용 여부가 운영 모드 기준으로 정해지므로 모듈을 불러오기 전에 지정
    Object.assign(process.env, { NODE_ENV: 'production' })
    const { submitIndexNow } = await import('../lib/indexnow')
    const { SITE_URL } = await import('../lib/site-url')

    const urls = paths.flatMap((p) => {
        const path = p === '/' ? '' : p.startsWith('/') ? p : `/${p}`
        return [`${SITE_URL}${path}`, `${SITE_URL}/en${path}`]
    })
    const results = await submitIndexNow(urls)
    if (!results.length) {
        console.error(`전송하지 않음 — 운영 주소가 아닙니다 (SITE_URL=${SITE_URL})`)
        process.exit(1)
    }
    console.log(`[indexnow] ${urls.length}건 전송`)
    for (const url of urls) console.log(`  ${url}`)
    for (const r of results) console.log(`  ${r.endpoint} → ${r.status ?? '실패'}${r.error ? ` (${r.error})` : ''}`)
    if (results.some((r) => r.status == null || r.status >= 400)) process.exit(1)
}

void main()
