# wow3dp.co.kr 도메인 연결 가이드

## 1. Custom Domain 연결 (대시보드에서 관리)

Custom Domain은 **Cloudflare 대시보드**에서 연결합니다. (wrangler.toml에 routes를 두면 CI 배포가 실패할 수 있어 대시보드만 사용)

- **Workers & Pages** → **wow3d-all-print** → **설정** → **도메인 및 경로** → **+ Add** → **Custom Domain**
- `wow3dp.co.kr`, `www.wow3dp.co.kr` 추가

---

## 2. Cloudflare에서 해야 할 작업

### 2-1. 도메인을 Cloudflare에 추가 (아직 없다면)

1. [Cloudflare 대시보드](https://dash.cloudflare.com) 로그인
2. **웹사이트** → **사이트 추가** → `wow3dp.co.kr` 입력
3. 요금제 선택 후, 도메인 등록처에서 **네임서버를 Cloudflare 안내대로 변경**
4. 활성화되면 해당 도메인의 **Zone**이 생성됨 (같은 계정, Workers가 있는 계정과 동일해야 함)

### 2-2. Custom Domain이 동작하는 조건

- **wow3dp.co.kr** 이 **같은 Cloudflare 계정**의 **Zone**으로 추가되어 있어야 함
- 도메인은 **대시보드**에서 Worker에 연결 (CI 배포 실패 방지)

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

## 4. Error 522 (Connection timed out) 해결

사이트가 **Worker**로만 동작하므로 **오리진 서버(별도 IP)가 없습니다**.  
DNS에 **A 레코드**가 있으면 Cloudflare가 그 IP로 접속을 시도해 522가 납니다.

**조치:** Cloudflare **DNS**에서 아래 레코드를 **삭제**하세요.

1. [Cloudflare 대시보드](https://dash.cloudflare.com) → **wow3dp.co.kr** Zone 선택
2. **DNS** → **레코드** 이동
3. **A 레코드** 중 다음을 찾아 **삭제**:
   - **이름** `@`(또는 `wow3dp.co.kr`), **콘텐츠** `115.68.229.23`
   - **이름** `www`, **콘텐츠** `115.68.229.23`

삭제 후 Worker의 Custom Domain만 남으므로, 트래픽이 Worker로 가서 522가 사라집니다.  
(Worker Custom Domain은 **도메인 및 경로**에 등록된 상태로 동작하며, A 레코드가 없어도 됩니다.)

---

## 5. ERR_CONNECTION_TIMED_OUT / "연결할 수 없음" 해결

브라우저에서 **응답 시간 초과**가 나면, 도메인이 **Worker가 아닌 다른 IP**로 가고 있거나 **Custom Domain이 Worker에 안 붙어 있을** 가능성이 큽니다.

### 5-1. Cloudflare DNS 확인 (wow3dp.co.kr Zone)

1. **웹사이트** → **wow3dp.co.kr** → **DNS** → **레코드**
2. **A 레코드**가 **115.68.229.23** 등 **예전 서버 IP**를 가리키고 있으면 → **삭제**하세요.  
   (이 IP로 가면 Worker가 아니라 그 서버로 가서, 응답 없으면 타임아웃이 납니다.)
3. **Custom Domain**을 Worker에 붙이면 Cloudflare가 필요한 레코드를 만들어 줍니다.  
   **A 레코드를 지운 뒤**에도 **Worker 쪽 설정**이 있어야 합니다.

### 5-2. Worker에 Custom Domain이 붙어 있는지 확인

1. **Workers & Pages** → **wow3d-all-print** → **설정** → **도메인 및 경로**
2. **Custom Domain**에 **wow3dp.co.kr**, **www.wow3dp.co.kr** 이 **둘 다** 있는지 확인
3. 없으면 **+ Add** → **Custom Domain** → 위 두 개 입력 후 저장

### 5-3. workers.dev로 먼저 확인

- **https://wow3d-all-print.jayseo36.workers.dev** 로 접속해 보세요.
- 여기서는 열리는데 wow3dp.co.kr만 안 되면 → **도메인/DNS 또는 Custom Domain 연결** 문제입니다.
- workers.dev도 안 되면 → 배포/Worker 자체 문제일 수 있습니다.

---

## 6. 요약 체크리스트

- [ ] wow3dp.co.kr 도메인이 Cloudflare에 사이트(Zone)로 추가됨
- [ ] 도메인 등록처에서 네임서버를 Cloudflare로 변경함
- [ ] `npm run deploy` 또는 main/master 푸시로 배포 실행
- [ ] (선택) `NEXT_PUBLIC_APP_URL` = `https://wow3dp.co.kr` 설정
- [ ] 브라우저에서 https://wow3dp.co.kr 접속 확인
- [ ] 522 발생 시: DNS에서 A 레코드(115.68.229.23) 삭제 후 재확인
- [ ] **연결 시간 초과** 시: DNS에 예전 IP용 A 레코드 없애기 + Worker **도메인 및 경로**에 wow3dp.co.kr, www 추가 확인

---

## 7. 사이트 연결이 자주 끊기는 경우 (ERR_CONNECTION_TIMED_OUT)

연결이 **간헐적으로** 또는 **특정 환경에서만** 안 될 때 의심할 수 있는 원인과 대응입니다.

### 7-1. 가능한 원인

| 원인 | 설명 |
|------|------|
| **Cold Start** | Cloudflare Worker가 한동안 요청이 없으면 슬립했다가, 첫 요청 시 깨우는 시간(수 초)이 걸릴 수 있음. 그 사이에 브라우저가 타임아웃하면 연결 실패로 보임. |
| **Worker 실행 시간** | Next.js(OpenNext) 앱은 무거워서 첫 응답까지 시간이 걸릴 수 있음. 무료 플랜 CPU 시간 제한(예: 10ms)을 넘기면 Worker가 중단될 수 있음. |
| **사용자 네트워크** | 특정 통신사/회사망/공유기에서 Cloudflare IP로 가는 경로가 느리거나 차단되는 경우. |
| **Cloudflare 장애** | [Cloudflare Status](https://www.cloudflarestatus.com/) 에서 전역/지역 장애 확인. |
| **DNS 캐시** | PC/공유기가 예전 IP를 캐시해 두고 있으면, 그 IP(응답 없는 서버)로 접속 시도 → 타임아웃. |

### 7-2. 사용자 측에서 확인할 것

1. **workers.dev로 접속**  
   `https://wow3d-all-print.jayseo36.workers.dev` 가 잘 열리면, 도메인/경로 문제일 가능성이 큼. wow3dp.co.kr만 안 되면 DNS·Custom Domain 설정을 다시 확인.
2. **다른 네트워크에서 시도**  
   휴대폰 데이터만 켜서 wow3dp.co.kr 접속. 여기서는 되는데 특정 Wi‑Fi/회사망에서만 안 되면 해당 네트워크(방화벽, 프록시) 이슈.
3. **DNS 캐시 비우기**  
   Windows: `ipconfig /flushdns` 실행 후 브라우저 완전 종료 후 재접속.
4. **DNS 서버 변경**  
   PC 또는 공유기 DNS를 Google(8.8.8.8) 또는 Cloudflare(1.1.1.1)로 바꿔서 테스트.

### 7-3. 운영 측에서 할 수 있는 것

- **Cloudflare 유료 플랜**  
  Workers Paid 플랜이면 CPU 시간·요청 제한이 늘어나 Cold Start·무거운 페이지에서 더 안정적일 수 있음.
- **Keep-Alive(Keep-Warm)**  
  Cron Trigger로 1~5분마다 `https://wow3d-all-print.jayseo36.workers.dev` 또는 `https://wow3dp.co.kr` 를 호출해 두면, Worker가 자주 슬립하지 않아 Cold Start로 인한 타임아웃이 줄어들 수 있음. (Cloudflare 대시보드 → Workers → Triggers → Cron Triggers)
- **모니터링**  
  Cloudflare 대시보드 **Analytics**에서 요청 수·에러율·응답 시간을 보고, 특정 시간대에만 실패하는지 확인.
