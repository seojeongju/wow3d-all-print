# SEO 최적화 및 검색엔진 등록 가이드

## 1. 적용된 SEO 설정 요약

- **메타데이터**: 루트 `app/layout.tsx`에서 title, description, keywords, Open Graph, Twitter Card, canonical, robots 설정
- **robots.txt**: `app/robots.ts`로 생성 → `/admin/`, `/api/`, `/auth` 등 비공개 경로 차단, sitemap 위치 안내
- **sitemap.xml**: `app/sitemap.ts`로 생성 → 공개 페이지 목록(메인, 견적, 소재, 하드웨어, 제휴, 문의, 약관 등) 제공
- **사이트 URL**: `NEXT_PUBLIC_APP_URL`이 없으면 `https://wow3dp.co.kr` 사용

배포 후 다음 URL로 확인하세요.

- **robots.txt**: https://wow3dp.co.kr/robots.txt  
- **sitemap**: https://wow3dp.co.kr/sitemap.xml  

---

## 2. 네이버 검색 등록 (네이버 서치어드바이저)

### 2-1. 사이트 등록

1. [네이버 서치어드바이저](https://searchadvisor.naver.com) 로그인 (네이버 계정)
2. **사이트 요약** → **사이트 추가**
3. **사이트 URL**에 `https://wow3dp.co.kr` 입력 후 추가
4. **소유 확인** 방법 선택:
   - **HTML 태그**: 관리자 페이지 등에 메타 태그 넣기 (Next.js에서는 루트 layout에 추가 가능)
   - **파일 업로드**: `public/` 폴더에 확인용 HTML 파일 올리기
   - **DNS**: TXT 레코드 추가 (Cloudflare DNS에서 가능)

### 2-2. 사이트맵 제출

1. 서치어드바이저에서 해당 사이트 선택
2. **요청** → **사이트맵 제출**
3. **사이트맵 URL**에 `https://wow3dp.co.kr/sitemap.xml` 입력 후 제출

### 2-3. URL 제출 (선택)

- **URL 제출** 메뉴에서 중요한 페이지 URL을 직접 제출할 수 있음 (메인, 견적, 문의 등)

---

## 3. 구글 검색 등록 (Google Search Console)

### 3-1. 속성 추가

1. [Google Search Console](https://search.google.com/search-console) 로그인
2. **속성 추가** → **URL 접두어** 선택
3. **URL 접두어**에 `https://wow3dp.co.kr` 입력

### 3-2. 소유권 확인

- **HTML 태그**: `<meta name="google-site-verification" content="…" />` 를 사이트에 추가
- **HTML 파일**: 지정된 파일을 사이트 루트에 업로드 (예: `public/google123.html`)
- **Google Analytics**: GA 추적 코드가 이미 있으면 선택 가능
- **DNS**: Cloudflare 등에서 TXT 레코드 추가

확인 완료 후 Search Console에서 인덱스·검색 현황을 볼 수 있습니다.

### 3-3. 사이트맵 제출

1. 해당 속성 선택 → 왼쪽 **색인 생성** → **Sitemaps**
2. **새 사이트맵 추가**에 `sitemap.xml` 입력 (전체 URL은 `https://wow3dp.co.kr/sitemap.xml`)
3. **제출** 클릭

---

## 4. 추가 권장 사항

- **OG 이미지**: SNS·검색 미리보기용 이미지. `public/og-image.png` (권장 크기 1200×630) 추가 시 자동 반영됨.
- **NEXT_PUBLIC_APP_URL**: Cloudflare Workers 환경 변수에 `https://wow3dp.co.kr` 설정 시 canonical·sitemap URL이 일치합니다.
- **주요 페이지별 메타**: `/quote`, `/materials`, `/contact` 등은 각 layout 또는 page에서 `metadata`로 title/description을 다르게 줄 수 있습니다.

---

## 5. 체크리스트

- [ ] 배포 후 https://wow3dp.co.kr/robots.txt 접속 확인
- [ ] 배포 후 https://wow3dp.co.kr/sitemap.xml 접속 확인
- [ ] 네이버 서치어드바이저에 사이트 추가 및 소유 확인
- [ ] 네이버에서 사이트맵 URL 제출
- [ ] Google Search Console에 속성 추가 및 소유 확인
- [ ] 구글에서 Sitemaps에 `sitemap.xml` 제출
- [ ] (선택) `public/og-image.png` 추가
- [ ] (선택) Cloudflare에 `NEXT_PUBLIC_APP_URL` = `https://wow3dp.co.kr` 설정
