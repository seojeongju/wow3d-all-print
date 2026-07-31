# SEO 최적화 및 검색엔진 등록 가이드

## 1. 적용된 SEO 설정 요약

- **대표 URL**: `https://www.wow3dp.co.kr` (non-www → www 301, canonical·sitemap 통일)
- **메타데이터**: 루트 `app/layout.tsx` + 페이지별 title/description/canonical
  - materials / partnership / experience / gallery / expert / services / guides / quote / contact / qna
- **robots.txt**: `app/robots.ts` → `/admin/`, `/api/` 등 비공개 경로 차단
- **sitemap.xml**: `app/sitemap.ts` → 서비스·가이드·갤러리·전문가 사례 포함 (`/maker`·`/quotes` 제외)
- **llms.txt**: `app/llms.txt/route.ts` 단일 소스 (www URL)

배포 후 확인:

- **robots.txt**: https://www.wow3dp.co.kr/robots.txt
- **sitemap**: https://www.wow3dp.co.kr/sitemap.xml
- **llms.txt**: https://www.wow3dp.co.kr/llms.txt

---

## 2. 네이버 검색 등록 (네이버 서치어드바이저)

### 2-1. 사이트 등록

1. [네이버 서치어드바이저](https://searchadvisor.naver.com) 로그인
2. **사이트 추가** → `https://www.wow3dp.co.kr`
3. 소유 확인 (HTML 태그 / 파일 / DNS) — 메타 `a5e68284…` 배포됨

### 2-2. 사이트맵 제출

- **요청** → **사이트맵 제출** → `https://www.wow3dp.co.kr/sitemap.xml`

### 2-3. 주요 URL 수집 요청

**요청** → **웹 페이지 수집**에서 아래 URL을 우선 제출하세요.

```
https://www.wow3dp.co.kr/
https://www.wow3dp.co.kr/quote
https://www.wow3dp.co.kr/services
https://www.wow3dp.co.kr/gallery
https://www.wow3dp.co.kr/materials
https://www.wow3dp.co.kr/expert
https://www.wow3dp.co.kr/expert/showcase/industrial
https://www.wow3dp.co.kr/expert/showcase/medical
https://www.wow3dp.co.kr/expert/showcase/art
https://www.wow3dp.co.kr/expert/showcase/architecture
https://www.wow3dp.co.kr/guides
https://www.wow3dp.co.kr/qna
https://www.wow3dp.co.kr/contact
https://www.wow3dp.co.kr/partnership
```

---

## 3. 구글 검색 등록 (Google Search Console)

### 3-1. 속성

1. [Google Search Console](https://search.google.com/search-console)
2. **URL 접두어** 속성: `https://www.wow3dp.co.kr`
3. (권장) 기존 apex 속성이 있으면 www 속성으로 이전·통합

### 3-2. 사이트맵

- **Sitemaps** → `sitemap.xml` 제출  
  (= `https://www.wow3dp.co.kr/sitemap.xml`)

### 3-3. URL 검사 · 색인 생성 요청

**URL 검사**에 아래를 넣고 **색인 생성 요청**을 차례로 실행하세요.

```
https://www.wow3dp.co.kr/
https://www.wow3dp.co.kr/quote
https://www.wow3dp.co.kr/services
https://www.wow3dp.co.kr/gallery
https://www.wow3dp.co.kr/materials
https://www.wow3dp.co.kr/expert
https://www.wow3dp.co.kr/expert/showcase/industrial
https://www.wow3dp.co.kr/expert/showcase/medical
https://www.wow3dp.co.kr/expert/showcase/art
https://www.wow3dp.co.kr/expert/showcase/architecture
https://www.wow3dp.co.kr/guides
https://www.wow3dp.co.kr/qna
https://www.wow3dp.co.kr/partnership
```

---

## 4. 추가 권장

- Cloudflare `NEXT_PUBLIC_APP_URL` = `https://www.wow3dp.co.kr`
- apex·www 모두 Worker에 연결해 301이 동작하는지 확인
- OG 이미지: `public/og-image-v2.jpg` (1200×630)
- WebSite JSON-LD는 SearchAction 없이 제공 (잘못된 `/qna?q=` 검색 제거)

---

## 5. 체크리스트

- [x] `https://wow3dp.co.kr/` → `https://www.wow3dp.co.kr/` 301 확인
- [x] https://www.wow3dp.co.kr/robots.txt
- [x] https://www.wow3dp.co.kr/sitemap.xml (서비스·가이드·expert·materials 포함, maker/quotes 제외)
- [x] 네이버 www 소유확인 메타 배포 (`a5e68284…`)
- [x] materials / partnership / experience 전용 canonical·title
- [x] QnA 메타 단일화 + FAQ JSON-LD를 1페이지 가시 항목과 맞춤
- [x] 잘못된 WebSite SearchAction 제거
- [ ] 네이버 서치어드바이저: www 소유확인 완료 → 사이트맵 제출 → 주요 URL 수집
- [ ] Google Search Console: www 속성 → 사이트맵 제출 → URL 검사/색인 요청
- [x] Cloudflare `NEXT_PUBLIC_APP_URL` = `https://www.wow3dp.co.kr` (wrangler 설정)
