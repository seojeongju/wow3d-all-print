/**
 * 운영(또는 지정) 사이트의 영문 페이지 HTML에서 화면 텍스트에 섞인 한글을 찾는다.
 * 사용: npx --yes tsx scripts/scan-en-pages.ts [baseUrl]
 */
const BASE = (process.argv[2] || 'https://www.wow3dp.co.kr').replace(/\/$/, '');
const HANGUL_RUN = /[가-힣][가-힣0-9A-Za-z·\s(),.\-/&%+~:!?'"’]*[가-힣)]/g;

async function getSitemapUrls(): Promise<string[]> {
    const res = await fetch(`${BASE}/sitemap.xml`);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    const hrefs = [...xml.matchAll(/hreflang="en"\s+href="([^"]+)"/g)].map((m) => m[1].trim());
    const all = new Set<string>();
    for (const u of [...locs, ...hrefs]) {
        const p = new URL(u).pathname;
        const enPath = p.startsWith('/en') ? p : `/en${p === '/' ? '' : p}`;
        all.add(enPath || '/en');
    }
    return [...all].sort();
}

function visibleText(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<(?:img|input)[^>]*?(?:alt|placeholder|aria-label|title)="([^"]*)"[^>]*>/gi, ' [$1] ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ');
}

function metaText(html: string): string[] {
    const out: string[] = [];
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1];
    if (title) out.push(`title: ${title}`);
    for (const m of html.matchAll(/<meta[^>]+(?:name|property)="(description|og:title|og:description)"[^>]+content="([^"]*)"/gi)) {
        out.push(`${m[1]}: ${m[2]}`);
    }
    return out;
}

async function main() {
    const urls = await getSitemapUrls();
    console.log(`대상 ${urls.length}개 페이지 (${BASE})`);
    const summary: { path: string; count: number }[] = [];
    const concurrency = 6;
    let idx = 0;
    const results = new Map<string, string[]>();
    await Promise.all(
        Array.from({ length: concurrency }, async () => {
            while (idx < urls.length) {
                const p = urls[idx++];
                try {
                    const res = await fetch(`${BASE}${p}`, { headers: { 'Accept-Language': 'en' } });
                    const html = await res.text();
                    const hits = new Set<string>();
                    for (const m of metaText(html)) if (/[가-힣]/.test(m)) hits.add(`(meta) ${m.slice(0, 120)}`);
                    for (const m of visibleText(html).matchAll(HANGUL_RUN)) hits.add(m[0].trim().slice(0, 100));
                    results.set(p, [`HTTP ${res.status}`, ...hits]);
                    summary.push({ path: p, count: hits.size });
                } catch (e) {
                    results.set(p, [`ERROR ${(e as Error).message}`]);
                }
            }
        }),
    );
    for (const { path, count } of summary.sort((a, b) => b.count - a.count)) {
        if (!count) continue;
        const lines = results.get(path)!;
        console.log(`\n## ${path} (${count}) ${lines[0]}`);
        for (const l of lines.slice(1, 40)) console.log(`  - ${l}`);
        if (lines.length > 41) console.log(`  ... 외 ${lines.length - 41}개`);
    }
    const clean = summary.filter((s) => s.count === 0).length;
    console.log(`\n한글 없음 ${clean}개 / 한글 있음 ${summary.length - clean}개`);
}

void main();
