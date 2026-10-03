import { absoluteUrl, SITE_URL } from '@/lib/site-url'
import { getAllPublishedNews } from '@/lib/news-public'
import { NEWS_CATEGORY_LABEL_KO, resolveNewsDescription, utcSqlToIso } from '@/lib/news'

export const dynamic = 'force-dynamic'

function xmlEscape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function imageMime(url: string): string {
    if (/\.png$/i.test(url)) return 'image/png'
    if (/\.webp$/i.test(url)) return 'image/webp'
    if (/\.gif$/i.test(url)) return 'image/gif'
    return 'image/jpeg'
}

function rfc822(sql: string | null): string | null {
    const iso = utcSqlToIso(sql)
    return iso ? new Date(iso).toUTCString() : null
}

export async function GET() {
    const posts = await getAllPublishedNews(30)
    const items = posts.map((p) => {
        const url = absoluteUrl(`/news/${encodeURIComponent(p.slug)}`)
        const pubDate = rfc822(p.publishedAt)
        return [
            '    <item>',
            `      <title>${xmlEscape(p.title)}</title>`,
            `      <link>${xmlEscape(url)}</link>`,
            `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
            `      <description>${xmlEscape(resolveNewsDescription(p))}</description>`,
            `      <category>${xmlEscape(NEWS_CATEGORY_LABEL_KO[p.category])}</category>`,
            pubDate ? `      <pubDate>${pubDate}</pubDate>` : '',
            p.coverUrl
                ? `      <enclosure url="${xmlEscape(absoluteUrl(p.coverUrl))}" type="${imageMime(p.coverUrl)}" length="0" />`
                : '',
            '    </item>',
        ]
            .filter(Boolean)
            .join('\n')
    })
    const lastBuild = rfc822(posts[0]?.publishedAt ?? null) ?? new Date().toUTCString()

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        '  <channel>',
        '    <title>와우쓰리디 3D프린팅 최신 동향</title>',
        `    <link>${absoluteUrl('/news')}</link>`,
        '    <description>3D프린팅 소재·장비·산업 동향을 와우쓰리디 실무 관점으로 정리합니다.</description>',
        '    <language>ko-KR</language>',
        `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
        `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
        ...items,
        '  </channel>',
        '</rss>',
    ].join('\n')

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
        },
    })
}
