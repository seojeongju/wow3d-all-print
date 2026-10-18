# CLAUDE.md

## 언어 규칙 (예외 없음)
- 사용자에게 보내는 모든 답변·진행 상황 안내·결과 보고·질문은 **한국어**로 작성한다.
- 코드 주석·로그 메시지·커밋 메시지도 한국어로 작성한다.
- 영어 오류 메시지·명령 출력은 원문을 인용하고, 설명은 한국어로 덧붙인다.
- 코드 식별자(변수·함수·파일명)와 기술 용어는 원문을 유지한다.
- 대화가 길어지거나 요약된 뒤에도 이 규칙을 계속 지킨다.

## 프로젝트 개요
WOW3D 3D 프린팅 자동 견적·주문 플랫폼 (https://www.wow3dp.co.kr)
- Next.js App Router + TypeScript + Tailwind + shadcn/ui, Three.js(React Three Fiber), Zustand
- Cloudflare Workers(OpenNext) · D1(`DB`, wow3d-production) · R2(`BUCKET`) · Workers AI(`AI`) — `wrangler.toml` 참고
- 다국어 페이지: `app/[locale]`, 번역: `messages/ko.json`·`messages/en.json`
- 관리자: `app/admin`, `app/api/admin`, `components/admin`
- 크론(`scripts/worker-entry.mjs`): 매일 00:00 KST 배송 상태 자동 전환, 10:00 KST 견적 리마인드 메일

## 주요 명령
- 개발 서버: `npm run dev`
- 타입 검사: `npx tsc --noEmit` / 린트: `npm run lint`
- 배포: `npm run deploy` (opennextjs-cloudflare build → wrangler deploy)
- D1 마이그레이션: `npm run db:migrations:apply`
- 견적 테스트: `npm run test:fdm`, `test:resin`, `test:order-prices`, `test:search`

## 배포 관례
- `main`에 푸시하면 GitHub Actions(`.github/workflows/deploy.yml`)가 자동으로 배포한다.
- 커밋은 `main`에 직접 하고, 메시지는 한국어 한 줄 요약 + 필요 시 본문으로 쓴다.
- 커밋·푸시·배포는 사용자가 요청할 때만 진행한다.

## 날짜·시간 규칙 (한국시간 KST)
- D1의 `created_at` 등은 UTC(`YYYY-MM-DD HH:MM:SS`)로 저장된다.
- 화면 표시는 `lib/date-utils.ts` 헬퍼를 사용한다: `formatKoreanDate`, `formatKoreanDateTime`, `formatKoreanDateTimeShort`, `formatKoreanPattern`, `formatKoreanDateISO`, `kstTodayISO`.
  - `new Date(DB문자열)`, timeZone 없는 `toLocale*`, `toISOString().slice(0, 10)`로 날짜를 만들지 않는다.
- SQL 날짜 집계는 `kstDateSql(col)`(= `date(col, '+9 hours')`), 오늘·이번 달 경계는 `kstStartUtcSql(...)`를 사용한다.
- 예외: 팝업 `start_at`/`end_at`은 KST 벽시계 시간으로 저장한다 (`lib/popup.ts`).

## SEO·AEO·GEO 규칙
- 구조화 데이터는 `lib/aeo-schema.ts` 빌더를 쓴다. 회사·사이트·본점·대표는 고정 `@id`(`ORG_ID`, `WEBSITE_ID`, `HQ_LOCALBUSINESS_ID`, `CEO_PERSON_ID`)로 참조하고, 새 엔티티 객체를 따로 만들지 않는다.
  - 전역 엔티티는 `components/layout/DocumentShell.tsx`가 `@graph`로 한 번만 출력한다. 페이지는 자기 WebPage·Article·FAQ·Breadcrumb만 출력한다.
  - FAQPage·HowTo 스키마 내용은 반드시 화면에 보이는 문구와 같아야 한다.
- 콘텐츠 날짜: 가이드·서비스·활용사례 등 공개 페이지의 본문·FAQ·수치를 고치면 `lib/content-dates.ts`의 `modified`를 그날(KST) 날짜로 바꾼다. 새 공개 페이지를 만들면 같은 파일에 등록한다.
  - 이 값이 sitemap lastmod, Article `datePublished`/`dateModified`, 화면 "최종 업데이트"에 함께 쓰인다. 리팩터링·스타일 변경만 했을 때는 바꾸지 않는다.
- 새 공개 페이지 추가 시 함께 등록: `app/sitemap.ts`(PUBLIC_PAGES), `lib/content-dates.ts`, 가이드면 `lib/llms-content.ts`·`lib/guides-hub-data.ts`·`lib/search/static-docs.ts`. 비공개 페이지는 `robots: { index: false }`와 `app/robots.ts` 차단 목록에 넣는다.
- 가이드 핵심 답변(`lib/guide-key-answers.ts`)·가격 예시 등 수치는 본문·견적 코드에 실제로 있는 값만 쓴다. 지어낸 수치·후기·평점은 넣지 않는다.
- 페이지 제목(`title`)에 브랜드를 넣지 않는다 — 레이아웃 템플릿이 `| (주)와우쓰리디 WOW3D`(영문 `| WOW3D`)를 붙인다. 홈만 `absolute` 제목.
- 클라이언트 전용 페이지는 서버 HTML이 비므로, 검색·AI가 읽을 h1·핵심 설명·FAQ를 서버 컴포넌트로 함께 출력한다 (예: `components/seo/QuoteSeoSection.tsx`).
