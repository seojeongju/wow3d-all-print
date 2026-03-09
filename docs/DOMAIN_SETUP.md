# wow3dp.co.kr 도메인 연결 가이드

## 1. wrangler.toml 설정 (완료)

프로젝트에 다음 Custom Domain이 설정되어 있습니다.

- `wow3dp.co.kr`
- `www.wow3dp.co.kr`

배포 시(`npm run deploy` 또는 GitHub Actions) 이 도메인들이 Worker에 자동으로 연결됩니다.

---

## 2. Cloudflare에서 해야 할 작업

### 2-1. 도메인을 Cloudflare에 추가 (아직 없다면)

1. [Cloudflare 대시보드](https://dash.cloudflare.com) 로그인
2. **웹사이트** → **사이트 추가** → `wow3dp.co.kr` 입력
3. 요금제 선택 후, 도메인 등록처에서 **네임서버를 Cloudflare 안내대로 변경**
4. 활성화되면 해당 도메인의 **Zone**이 생성됨 (같은 계정, Workers가 있는 계정과 동일해야 함)

### 2-2. Custom Domain이 동작하는 조건

- **wow3dp.co.kr** 이 **같은 Cloudflare 계정**의 **Zone**으로 추가되어 있어야 함
- Zone이 없으면 Wrangler 배포 시 Custom Domain 연결이 실패할 수 있음

### 2-3. 배포 후 확인

1. [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages) → **wow3d-all-print** Worker 선택
2. **설정** → **도메인 및 경로** 에서 `wow3dp.co.kr`, `www.wow3dp.co.kr` 이 보이면 연결된 것

---

## 3. 프로덕션 URL (선택)

앱 내에서 절대 URL을 쓸 때(예: 견적서 링크 이메일) `NEXT_PUBLIC_APP_URL` 을 사용합니다.

- **Cloudflare Workers 대시보드** → Worker **설정** → **변수** 에서 추가:
  - 변수 이름: `NEXT_PUBLIC_APP_URL`
  - 값: `https://wow3dp.co.kr`
- 또는 배포 스크립트/CI에서 환경 변수로 설정

---

## 4. 요약 체크리스트

- [ ] wow3dp.co.kr 도메인이 Cloudflare에 사이트(Zone)로 추가됨
- [ ] 도메인 등록처에서 네임서버를 Cloudflare로 변경함
- [ ] `npm run deploy` 또는 main/master 푸시로 배포 실행
- [ ] (선택) `NEXT_PUBLIC_APP_URL` = `https://wow3dp.co.kr` 설정
- [ ] 브라우저에서 https://wow3dp.co.kr 접속 확인
