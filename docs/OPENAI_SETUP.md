# OpenAI API로 FAQ 초안 품질 올리기

관리자 **문의 관리 → FAQ 초안 생성**은 OpenAI API 키가 있으면 이를 **최우선**으로 사용합니다.  
키가 없으면 Workers AI → 규칙 기반 폴백 순입니다.

현재 모델: `gpt-4o-mini` (품질·비용 균형)  
Workers AI 폴백: `llama-3.1-8b-instruct-fast` → `glm-4.7-flash` → `llama-4-scout`  
(구 `llama-3.1-8b-instruct`는 2026-05-30 deprecated)

## 1. OpenAI API 키 발급

1. [platform.openai.com](https://platform.openai.com) 가입·로그인  
2. **API keys** → **Create new secret key**  
3. 키를 안전한 곳에 복사 (다시 볼 수 없음)  
4. **Billing**에서 결제 수단·크레딧 확인 (미결제면 API 호출 실패)

권장: 키 이름 예) `wow3d-faq-draft`

## 2. Cloudflare Workers에 Secret 등록 (프로덕션)

프로젝트 루트에서:

```bash
npx wrangler secret put OPENAI_API_KEY
```

프롬프트가 나오면 OpenAI에서 복사한 키를 붙여넣고 Enter.

확인:

```bash
npx wrangler secret list
```

목록에 `OPENAI_API_KEY`가 보이면 됩니다. 값 자체는 표시되지 않습니다.

> Secret만 추가해도 런타임에 주입됩니다.  
> 단, **OpenAI 우선 사용 코드 변경**을 배포한 뒤에야 품질 우선 순서가 적용됩니다.

## 3. 로컬 개발 (선택)

프로젝트 루트 `.dev.vars` (git 커밋 금지):

```
OPENAI_API_KEY=sk-xxxxxxxx
```

`.gitignore`에 `.dev.vars`가 포함되어 있는지 확인하세요.

## 4. 동작 확인

1. `/admin/inquiries` → 문의 상세  
2. **FAQ 초안 생성**  
3. 미리보기 안내의 `provider: openai` 이면 OpenAI 사용 중  

`provider: workers-ai` / `template` 이면 키가 없거나 API 오류입니다.  
특히 `insufficient_quota` / 크레딧 부족이면 [OpenAI Billing](https://platform.openai.com/settings/organization/billing)에서 충전하세요.  
Workers 로그·OpenAI 사용량 대시보드를 확인하세요.

## 5. 비용·보안 참고

- FAQ 초안은 문의당 짧은 호출이라 `gpt-4o-mini` 기준 비용은 보통 매우 작습니다.  
- Secret은 코드·GitHub에 넣지 마세요.  
- 키 유출 시 OpenAI에서 즉시 revoke 후 재발급하세요.
