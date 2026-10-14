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
