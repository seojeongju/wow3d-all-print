# 다국어 확장 개발 계획 (vi / zh / ja)

**상태:** 계획만 확정 · 구현은 이후 단계적으로 진행  
**작성일:** 2026-10-17  
**현재 지원:** `ko`, `en` (`next-intl`, `localePrefix: as-needed`)  
**추가 목표:** 베트남어(`vi`), 중국어 간체(`zh`), 일본어(`ja`)

---

## 1. 목적

- 베트남·중국·일본 유학생·외국인 고객이 **자기 언어로 견적·주문**할 수 있게 한다.
- 마케팅 문구용 전량 번역보다 **전환 경로의 신뢰 가능한 현지화**를 우선한다.
- 관리자(`/admin`)는 한국어 유지.

---

## 2. 범위 원칙

| 포함 | 제외(당분간) |
|------|----------------|
| 견적·장바구니·결제·인증·문의·핵심 메일 | `/admin` 전체 |
| 홈 CTA·얇은 벽 등 전환 관련 안내 | 가이드/활용사례 전량 |
| URL·스위치·hreflang·로케일 유틸 | 중국어 번체(`zh-TW`) |
| EN 폴백으로 빈 화면 방지 | Accept-Language 강제 리다이렉트 |

**폴백:** 미번역 키/콘텐츠 → `en` → `ko`  
**감지:** `localeDetection: false` 유지 (수동 전환). 자동 이동은 하지 않음.

---

## 3. 로케일·URL

| 코드 | 언어 | URL |
|------|------|-----|
| `ko` | 한국어 (default) | `/…` (prefix 없음) |
| `en` | 영어 | `/en/…` |
| `vi` | 베트남어 | `/vi/…` |
| `zh` | 중국어 간체 | `/zh/…` |
| `ja` | 일본어 | `/ja/…` |

- `i18n/routing.ts`의 `locales`에 추가.
- `middleware.ts` admin 리다이렉트 `(en|ko)` → 전체 로케일.

---

## 4. 단계별 개발 계획

### Phase 0 — 기반 (구현 착수 시 1차)

**목표:** 새 로케일로 접속해도 앱이 깨지지 않음 (초기 문구는 EN 복사본 허용).

- [ ] `lib/locale.ts` (가칭) 추가  
  - `APP_LOCALES`, `toOgLocale`, `toDateLocale`, `localePathPrefix`, `pickLocalized`
- [ ] `i18n/routing.ts`에 `vi`, `zh`, `ja` 등록
- [ ] `messages/vi.json`, `zh.json`, `ja.json` 생성 (`en.json` 복사로 시작)
- [ ] `LocaleSwitcher`에 3개 언어 추가
- [ ] `middleware` admin locale 패턴 확장
- [ ] `hreflang` / `metadata.alternates.languages`를 `routing.locales` 기준으로 일반화
- [ ] `locale === 'en' ? … : …` 이분 분기 중 **경로·날짜·OG**부터 유틸로 교체
- [ ] (권장) Phase 0~1 동안 신규 로케일 페이지 `noindex` 여부 검토 — EN 복붙 중복 SEO 방지

**완료 기준:** `/vi/quote`, `/zh/quote`, `/ja/quote` 접속·견적 UI 동작 (문구는 영어여도 됨).

---

### Phase 1 — 전환 경로 현지화 (핵심)

**목표:** 해당 언어로 견적 저장 → 장바구니 → 주문/문의까지 가능. 메일도 동일 언어.

#### 1-A. 메시지 네임스페이스 (우선순위로 번역·검수)

- [ ] `Quote`, `QuotePanel`, `ImageTo3D`
- [ ] `Cart`, `Checkout`, `OrderComplete`
- [ ] `Auth`, `Contact`, `Common`, `Nav`, `Footer`, `LocaleSwitcher`
- [ ] `Quote.health` (얇은 벽·리페어 안내)
- [ ] `Home` (히어로·주요 CTA)
- [ ] `MyAccount`, `SavedQuotes`, `PhotoGuide` (여유 시)

#### 1-B. 트랜잭션·하드코딩

- [ ] 견적/주문/리마인드 메일 (`lib/quote-email` 등) 로케일 맵 확장
- [ ] DB·리마인드 등의 `locale` 타입 `'ko'|'en'` → `AppLocale`
- [ ] `toast-helper` 등 UI 로케일 판별 일반화
- [ ] Meshy/면책 문구처럼 `ko`/`en` 상수만 있는 구간 정리

#### 1-C. 품질

- [ ] vi / zh: MT 후 원어민·유학생 1회 검수
- [ ] ja: UI + 가격·견적 안내 톤 검수
- [ ] 용어집(간단): FDM/SLA/DLP, 인필, 레이어, 견적, 장바구니
- [ ] (권장) CI: 새 키가 5개 메시지 파일에 모두 있는지 diff 검사

**완료 기준:** vi/zh/ja로 견적·장바구니·문의 E2E 스모크 통과. 저장 메일 언어 일치.

---

### Phase 2 — 콘텐츠·SEO (트래픽 보고 선택)

- [ ] `pickLocalized`로 `use-case-pages` / `seo-guide-pages` / `service-infographics` 폴백
- [ ] 상위 전환 기여 페이지만 번역 (전량 금지)
- [ ] sitemap을 `routing.locales` 루프로 생성
- [ ] 미번역 페이지 EN 표시 시 안내 배너(선택)
- [ ] 랜딩·마케팅에 「VI · ZH · JA · EN · KO」 배지
- [ ] 약관/개인정보: 요약 또는 EN 병기, **법적 본문은 KO** 명시

**완료 기준:** 선택한 콘텐츠 URL만 해당 언어로 index·노출.

---

## 5. 기술 메모 (구현 시 참고)

### 메시지

- 소스 오브 트루스: `messages/ko.json` (기능 추가 시 KO 먼저 → EN → vi/zh/ja).
- `i18n/request.ts`의 dynamic import 패턴 유지. 5개 파일 항상 존재.

### 콘텐츠 모듈

```ts
// 권장 패턴
pickLocalized({ ko, en, vi?, zh?, ja? }, locale) // 없으면 en
```

### 비대상 유지

- `/admin`, 관리자 알림 메일(KO)
- 문의 답변 **본문**은 관리자 작성 언어 그대로 (시스템 푸터만 다국어 가능)

---

## 6. 작업 순서 (착수 시 체크리스트)

1. Phase 0 기반 머지 (라우팅·스위치·EN 복사 메시지·유틸)
2. Quote/Cart/Checkout/Auth/Contact 번역·검수
3. 메일·locale DB 필드 확장
4. Home CTA·얇은 벽 안내
5. 스모크 테스트 후 `noindex` 해제 여부 결정
6. Phase 2는 지표 보고 페이지 단위로 추가

---

## 7. 성공 지표 (나중에 측정)

- 로케일별 견적 시작 / 저장 / 주문 전환
- `/vi` `/zh` `/ja` 세션의 문의·견적 비율
- LocaleSwitcher 사용 후 이탈

---

## 8. 관련 코드 (현황)

| 경로 | 역할 |
|------|------|
| `i18n/routing.ts` | locales, defaultLocale, prefix |
| `i18n/request.ts` | 메시지 로드 |
| `i18n/navigation.ts` | Link / router |
| `middleware.ts` | intl + admin 리다이렉트 |
| `messages/ko.json`, `en.json` | UI 문자열 |
| `components/layout/LocaleSwitcher.tsx` | 언어 전환 |
| `lib/quote-email.ts` 등 | 메일 이분 분기 (부채) |
| `lib/use-case-pages.ts`, `lib/seo-guide-pages.ts` | 콘텐츠 ko/en 분기 (Phase 2) |

---

## 9. 결정 요약

- **지금:** 이 문서에 계획만 고정. 기능 구현은 하지 않음.
- **나중:** Phase 0 → 1 순으로 천천히 진행. Phase 2는 필수 아님.
- **강점 메시지:** “다국어 전 사이트”보다 **“유학생도 자기 언어로 즉시 견적”**이 정직하고 효과적임.
