# 구글 검색엔진 등록 절차 (Google Search Console)

wow3dp.co.kr 을 구글 검색에 등록하는 단계별 가이드입니다.

---

## 1단계: Search Console 접속 및 속성 추가

1. **[Google Search Console](https://search.google.com/search-console)** 접속 후 **Google 계정으로 로그인**

2. 왼쪽 상단 **속성 추가** 클릭  
   (이미 다른 사이트가 있으면 상단에서 **속성 추가** 선택)

3. **URL 접두어** 선택 후 아래 주소 입력:
   ```
   https://wow3dp.co.kr
   ```
   **계속** 클릭

---

## 2단계: 소유권 확인 (HTML 태그 방식)

1. 소유권 확인 화면에서 **HTML 태그** 방식 선택

2. 구글이 안내하는 메타 태그 예시:
   ```html
   <meta name="google-site-verification" content="긴문자열값" />
   ```
   **content="..."** 안의 **따옴표 사이 값만** 복사합니다.

3. **프로젝트에 반영**
   - **방법 A (권장)**  
     Cloudflare Workers 대시보드 → **wow3d-all-print** → **설정** → **변수**  
     - 이름: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`  
     - 값: (복사한 content 값)  
     저장 후 **재배포**합니다.
   - **방법 B**  
     로컬 `.env.local`에 추가 후 재배포:
     ```
     NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=복사한_content_값
     ```

4. 배포가 끝나면 Search Console으로 돌아가서 **확인** 버튼 클릭  
   → 소유권 확인이 완료되면 해당 속성이 활성화됩니다.

---

## 3단계: 사이트맵 제출

1. Search Console 왼쪽 메뉴 **색인 생성** → **Sitemaps** 클릭

2. **새 사이트맵 추가** 입력란에 아래만 입력:
   ```
   sitemap.xml
   ```
   (전체 URL `https://wow3dp.co.kr/sitemap.xml` 이 아니라 **sitemap.xml** 만 입력)

3. **제출** 클릭

4. 잠시 후 상태가 **성공** 또는 **발견됨**으로 표시되면 제출 완료입니다.

---

## 4단계: URL 검사 (선택)

- **URL 검사** 메뉴에서 `https://wow3dp.co.kr` 또는 중요 페이지 URL을 입력해 **색인 생성 요청**을 할 수 있습니다.  
- 제출한 사이트맵으로도 수집되며, URL 검사는 특정 페이지만 빨리 색인받고 싶을 때 사용하면 됩니다.

---

## 요약 체크리스트

- [ ] Search Console에서 속성 추가 (URL 접두어: https://wow3dp.co.kr)
- [ ] HTML 태그 방식으로 content 값 복사
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 환경 변수 설정 후 재배포
- [ ] Search Console에서 **확인** 클릭 → 소유권 확인 완료
- [ ] **색인 생성** → **Sitemaps** 에서 `sitemap.xml` 제출

---

## 참고

- **색인/노출**: 소유권 확인·사이트맵 제출 후에도 구글이 수집·색인하는 데 며칠 걸릴 수 있습니다.
- **검색 확인**: 구글 검색창에 `site:wow3dp.co.kr` 로 검색해 보면 색인된 페이지를 확인할 수 있습니다.
