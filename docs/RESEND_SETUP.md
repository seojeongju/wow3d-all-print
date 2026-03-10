# Resend로 견적서 이메일 발송 설정

견적 관리 페이지에서 고객에게 견적서를 이메일로 보내는 기능은 [Resend](https://resend.com) API를 사용합니다.

## 1. Resend 가입 및 API 키 발급

1. [resend.com](https://resend.com) 에서 가입
2. **API Keys** 메뉴에서 API 키 생성
3. (선택) **Domains**에서 도메인 추가 후 인증하면 `wow3dp.co.kr` 등에서 발신 가능

## 2. Cloudflare Workers에 환경 변수 설정

배포 환경(Cloudflare)에서는 **Secrets**로 설정합니다.

```bash
# API 키 (필수)
npx wrangler secret put RESEND_API_KEY
# 프롬프트가 나오면 Resend 대시보드에서 복사한 키 입력

# 발신 주소 (선택, 없으면 onboarding@resend.dev 사용)
npx wrangler secret put RESEND_FROM
# 예: WOW3D 견적서 <quotation@wow3dp.co.kr>

# 앱 URL - 견적서 링크에 사용 (선택)
npx wrangler secret put NEXT_PUBLIC_APP_URL
# 예: https://wow3dp.co.kr
```

## 3. 로컬 개발 시

프로젝트 루트에 `.dev.vars` 파일을 만들고 (git에 커밋하지 마세요):

```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=WOW3D 견적서 <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. 동작

- 견적 관리(`/admin/quotes`)에서 **이메일 발송** 버튼 클릭 시 해당 주문의 고객 이메일(주문 시 입력한 이메일)로 견적서 안내 메일이 발송됩니다.
- `quotation_sent_at`이 기록되며, 발송된 건은 접수일 옆에 **발송됨** 배지로 표시됩니다.
- API 키가 없거나 이메일이 없으면 발송만 건너뛰고, 발송 일시만 기록됩니다.
