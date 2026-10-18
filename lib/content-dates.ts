/**
 * 공개 페이지 콘텐츠 작성일·수정일 (KST 날짜, YYYY-MM-DD).
 *
 * sitemap lastmod와 Article datePublished/dateModified, 화면의 "최종 업데이트" 표시가 모두 이 값을 쓴다.
 * 요청 시각을 lastmod로 내보내면 검색엔진이 lastmod 자체를 무시하므로 실제 날짜만 적는다.
 * - 본문·FAQ·수치 등 콘텐츠를 실질적으로 고쳤을 때만 modified를 갱신한다 (리팩터링·스타일 변경은 제외).
 * - 등록되지 않은 경로는 lastmod를 생략한다.
 * 초기값은 git 이력(페이지·콘텐츠 설정 파일의 최초 추가일·최종 콘텐츠 수정일) 기준.
 */
export type ContentDates = {
    published: string
    modified: string
}

const CONTENT_DATES: Record<string, ContentDates> = {
    '/': { published: '2026-01-23', modified: '2026-10-05' },
    '/quote': { published: '2026-01-23', modified: '2026-10-18' },
    '/price-calculator': { published: '2026-10-12', modified: '2026-10-12' },
    '/stl-checker': { published: '2026-10-12', modified: '2026-10-12' },
    '/custom': { published: '2026-07-31', modified: '2026-10-13' },
    '/print-methods': { published: '2026-01-24', modified: '2026-09-29' },
    '/materials': { published: '2026-01-24', modified: '2026-10-03' },
    '/materials/safety': { published: '2026-09-07', modified: '2026-10-02' },
    '/hardware/3d-printer': { published: '2026-09-07', modified: '2026-10-02' },
    '/experience': { published: '2026-01-23', modified: '2026-09-08' },
    '/expert': { published: '2026-04-13', modified: '2026-10-05' },
    '/expert/showcase/industrial': { published: '2026-09-07', modified: '2026-10-05' },
    '/expert/showcase/medical': { published: '2026-09-07', modified: '2026-10-05' },
    '/expert/showcase/art': { published: '2026-09-07', modified: '2026-10-05' },
    '/expert/showcase/architecture': { published: '2026-09-07', modified: '2026-10-05' },
    '/partnership': { published: '2026-03-03', modified: '2026-09-08' },
    '/partnership/smart-store': { published: '2026-09-07', modified: '2026-10-02' },
    '/contact': { published: '2026-01-25', modified: '2026-10-01' },
    '/makerspace': { published: '2026-09-07', modified: '2026-10-02' },
    '/qna': { published: '2026-03-19', modified: '2026-10-05' },
    '/privacy': { published: '2026-01-26', modified: '2026-09-08' },
    '/terms': { published: '2026-01-26', modified: '2026-09-08' },

    // 서비스
    '/services': { published: '2026-07-29', modified: '2026-10-15' },
    '/services/printing': { published: '2026-07-29', modified: '2026-10-15' },
    '/services/prototype': { published: '2026-07-29', modified: '2026-10-15' },
    '/services/fdm': { published: '2026-07-29', modified: '2026-10-15' },
    '/services/sla': { published: '2026-07-29', modified: '2026-10-15' },
    '/services/graduation': { published: '2026-07-29', modified: '2026-10-15' },
    '/services/capstone': { published: '2026-09-30', modified: '2026-10-15' },
    '/services/small-batch': { published: '2026-07-29', modified: '2026-10-15' },
    '/services/modeling': { published: '2026-07-29', modified: '2026-10-15' },
    '/services/photo-to-3d': { published: '2026-08-18', modified: '2026-10-15' },

    // 활용 사례
    '/use-cases': { published: '2026-10-12', modified: '2026-10-15' },
    '/use-cases/figures-miniatures': { published: '2026-10-12', modified: '2026-10-12' },
    '/use-cases/electronics-enclosures': { published: '2026-10-12', modified: '2026-10-12' },
    '/use-cases/jigs-fixtures': { published: '2026-10-12', modified: '2026-10-12' },
    '/use-cases/replacement-parts': { published: '2026-10-12', modified: '2026-10-12' },
    '/use-cases/architectural-models': { published: '2026-10-12', modified: '2026-10-12' },
    '/use-cases/cosplay-props': { published: '2026-10-12', modified: '2026-10-12' },
    '/use-cases/logos-signage': { published: '2026-10-12', modified: '2026-10-12' },
    '/use-cases/trophies-awards': { published: '2026-10-12', modified: '2026-10-12' },

    // 가이드
    '/guides': { published: '2026-07-28', modified: '2026-10-03' },
    '/guides/photo-to-3d-printing-quote': { published: '2026-08-18', modified: '2026-10-05' },
    '/guides/3d-printing-quote-guide': { published: '2026-07-28', modified: '2026-10-03' },
    '/guides/3d-printing-price-examples': { published: '2026-10-18', modified: '2026-10-18' },
    '/guides/fdm-vs-sla-vs-dlp': { published: '2026-07-28', modified: '2026-09-29' },
    '/guides/3d-printing-file-preparation': { published: '2026-07-28', modified: '2026-09-29' },
    '/guides/3d-printing-turnaround-time': { published: '2026-07-28', modified: '2026-09-29' },
    '/guides/pla-vs-abs-vs-petg': { published: '2026-07-28', modified: '2026-10-03' },
    '/guides/standard-vs-tough-vs-clear-vs-flexible-resin': { published: '2026-07-28', modified: '2026-10-03' },
    '/guides/best-materials-for-3d-printing-prototypes': { published: '2026-07-28', modified: '2026-09-08' },
    '/guides/best-materials-for-transparent-3d-printed-parts': { published: '2026-07-28', modified: '2026-09-08' },
    '/guides/best-materials-for-3d-printed-housings-and-cases': { published: '2026-07-28', modified: '2026-09-08' },
    '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts': { published: '2026-07-28', modified: '2026-09-08' },
    '/guides/best-materials-for-miniatures-and-figurines': { published: '2026-07-28', modified: '2026-09-08' },
    '/guides/how-to-reduce-3d-printing-cost': { published: '2026-07-29', modified: '2026-09-08' },
    '/guides/choosing-infill-density': { published: '2026-07-29', modified: '2026-09-08' },
    '/guides/fixing-stl-file-errors': { published: '2026-07-29', modified: '2026-10-13' },
    '/guides/minimum-wall-thickness': { published: '2026-07-29', modified: '2026-10-13' },
    '/guides/why-support-costs': { published: '2026-07-29', modified: '2026-09-08' },
    '/guides/3d-printing-tolerances': { published: '2026-07-29', modified: '2026-09-08' },
    '/guides/splitting-large-3d-prints': { published: '2026-07-29', modified: '2026-09-08' },
    '/guides/graduation-project-checklist': { published: '2026-07-29', modified: '2026-09-08' },
    '/guides/capstone-design-prototype-guide': { published: '2026-09-30', modified: '2026-09-30' },
}

/** locale 접두어(/en)를 떼고 조회 — 한/영 페이지는 같은 콘텐츠 날짜를 공유 */
export function getContentDates(path: string): ContentDates | null {
    const normalized = path.replace(/^\/en(?=\/|$)/, '') || '/'
    return CONTENT_DATES[normalized] ?? null
}

/** KST 날짜(YYYY-MM-DD)를 해당 날 00:00 KST의 ISO 8601 문자열로 (스키마 datePublished 등) */
export function kstDateToIso(date: string): string {
    return `${date}T00:00:00+09:00`
}
