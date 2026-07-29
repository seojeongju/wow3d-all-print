# SEO 최적화 및 검색엔진 등록 가이드

## 1. 적용된 SEO 설정 요약

- **대표 URL**: `https://www.wow3dp.co.kr` (non-www → www 301, canonical·sitemap 통일)
- **메타데이터**: 루트 `app/layout.tsx` + 페이지별 title/description/canonical
- **robots.txt**: `app/robots.ts` → `/admin/`, `/api/` 등 비공개 경로 차단
- **sitemap.xml**: `app/sitemap.ts` → 서비스·가이드·갤러리·전문가 사례 포함

배포 후 확인:

- **robots.txt**: https://www.wow3dp.co.kr/robots.txt
- **sitemap**: https://www.wow3dp.co.kr/sitemap.xml

---

## 2. 네이버 검색 등록 (네이버 서치어드바이저)

### 2-1. 사이트 등록

1. [네이버 서치어드바이저](https://searchadvisor.naver.com) 로그인
2. **사이트 추가** → `https://www.wow3dp.co.kr`
3. 소유 확인 (HTML 태그 / 파일 / DNS)

### 2-2. 사이트맵 제출

- **요청** → **사이트맵 제출** → `https://www.wow3dp.co.kr/sitemap.xml`

### 2-3. 주요 URL 수집 요청

**요청** → **웹 페이지 수집**에서 아래 URL을 우선 제출하세요.

```
https://www.wow3dp.co.kr/
https://www.wow3dp.co.kr/quote
https://www.wow3dp.co.kr/services
https://www.wow3dp.co.kr/gallery
https://www.wow3dp.co.kr/expert
https://www.wow3dp.co.kr/expert/showcase/industrial
https://www.wow3dp.co.kr/expert/showcase/medical
https://www.wow3dp.co.kr/expert/showcase/art
https://www.wow3dp.co.kr/expert/showcase/architecture
https://www.wow3dp.co.kr/guides
https://www.wow3dp.co.kr/qna
https://www.wow3dp.co.kr/contact
```

서비스 랜딩·가이드는 사이트맵 제출 후 필요 시 개별 수집을 추가합니다.

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
https://www.wow3dp.co.kr/expert
https://www.wow3dp.co.kr/expert/showcase/industrial
https://www.wow3dp.co.kr/expert/showcase/medical
https://www.wow3dp.co.kr/expert/showcase/art
https://www.wow3dp.co.kr/expert/showcase/architecture
https://www.wow3dp.co.kr/guides
https://www.wow3dp.co.kr/qna
```

---

## 4. 추가 권장

- Cloudflare `NEXT_PUBLIC_APP_URL` = `https://www.wow3dp.co.kr`
- apex·www 모두 Worker에 연결해 301이 동작하는지 확인
- OG 이미지: `public/og-image-v2.jpg` (1200×630)

---

## 5. 체크리스트

- [ ] `https://wow3dp.co.kr/` → `https://www.wow3dp.co.kr/` 301 확인
- [ ] https://www.wow3dp.co.kr/robots.txt
- [ ] https://www.wow3dp.co.kr/sitemap.xml (서비스·가이드·expert 포함)
- [ ] 네이버 www 사이트 + 사이트맵 + 주요 URL 수집
- [ ] Google Search Console www 속성 + 사이트맵 + URL 검사
- [ ] Cloudflare `NEXT_PUBLIC_APP_URL` = www
