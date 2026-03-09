# 네이버 검색엔진 등록 절차 (서치어드바이저)

wow3dp.co.kr 을 네이버 검색에 등록하는 단계별 가이드입니다.

---

## 1단계: 서치어드바이저 접속 및 사이트 추가

1. **[네이버 서치어드바이저](https://searchadvisor.naver.com)** 접속 후 **네이버 로그인**  
   (또는 [https://searchadvisor.naver.com/console/board](https://searchadvisor.naver.com/console/board) )

2. 왼쪽 메뉴에서 **사이트 요약** 클릭

3. **사이트 추가** 버튼 클릭

4. **사이트 URL** 입력란에 아래 주소 **그대로** 입력 후 추가  
   ```
   https://wow3dp.co.kr
   ```

---

## 2단계: 소유 확인 (HTML 태그 방식)

1. 추가한 사이트(**wow3dp.co.kr**)를 클릭해 들어갑니다.

2. **소유 확인** 단계에서 확인 방법을 선택합니다.  
   → **「HTML 태그」** 방식 선택

3. 네이버가 안내하는 **메타 태그**가 표시됩니다. 예시:
   ```html
   <meta name="naver-site-verification" content="여기_긴_문자열_값" />
   ```
   → **content="..."** 안의 **따옴표 사이 값만** 복사합니다. (긴 영문·숫자 조합)

4. **프로젝트에 값 반영**  
   - **방법 A (권장)**  
     Cloudflare Workers 대시보드에서 환경 변수 추가:  
     - 이름: `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`  
     - 값: (방금 복사한 content 값)  
     저장 후 **한 번 재배포**합니다.  
   - **방법 B**  
     로컬 `.env.local`에 다음 한 줄 추가 후 재배포:
     ```
     NEXT_PUBLIC_NAVER_SITE_VERIFICATION=여기_복사한_content_값
     ```

5. 배포가 끝난 뒤 **서치어드바이저**로 돌아가서 **「확인」** 버튼을 누릅니다.  
   → 소유 확인이 완료되면 사이트 상태가 **「소유 확인됨」**으로 바뀝니다.

---

## 3단계: 사이트맵 제출

1. 서치어드바이저 왼쪽 메뉴에서 **요청** → **사이트맵 제출** (또는 **사이트맵 제출** 메뉴) 클릭

2. **사이트맵 URL** 입력란에 아래 주소 입력:
   ```
   https://wow3dp.co.kr/sitemap.xml
   ```

3. **제출** 버튼 클릭

---

## 4단계: URL 제출 (선택)

검색 수집을 더 빨리 받고 싶다면 **URL 제출**에서 주요 주소를 직접 넣을 수 있습니다.

1. **요청** → **URL 제출** (또는 **URL 제출** 메뉴) 이동

2. 아래 URL을 한 줄씩 입력 후 제출 (또는 한 번에 여러 줄 입력 가능한 경우 붙여넣기):
   ```
   https://wow3dp.co.kr/
   https://wow3dp.co.kr/quote
   https://wow3dp.co.kr/quotes
   https://wow3dp.co.kr/print-methods
   https://wow3dp.co.kr/materials
   https://wow3dp.co.kr/contact
   https://wow3dp.co.kr/partnership
   ```

---

## 요약 체크리스트

- [ ] 서치어드바이저에서 사이트 추가 (https://wow3dp.co.kr)
- [ ] HTML 태그 방식으로 content 값 복사
- [ ] `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` 환경 변수 설정 후 재배포
- [ ] 서치어드바이저에서 「확인」 클릭 → 소유 확인 완료
- [ ] 사이트맵 제출: https://wow3dp.co.kr/sitemap.xml
- [ ] (선택) URL 제출로 주요 페이지 제출

---

## 참고

- **수집/노출**: 소유 확인·사이트맵 제출 후에도 네이버가 수집·노출하는 데 며칠에서 1~2주 걸릴 수 있습니다.
- **robots.txt**: 이미 `https://wow3dp.co.kr/robots.txt` 에서 네이버 봇(Yeti)이 공개 페이지를 수집하도록 설정되어 있습니다.
