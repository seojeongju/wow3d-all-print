# 갤러리(출력물) 업로드 보안 점검 요약

## 1. 업로드 가능 경로

| 경로 | 메서드 | 권한 | 비고 |
|------|--------|------|------|
| `/api/gallery` | POST | **관리자만** (`requireAdminAuth`) | 이미지 업로드 → R2 `gallery/` + `gallery_items` INSERT |
| `/api/gallery/[id]` | PUT | **관리자만** | 수정 |
| `/api/gallery/[id]` | DELETE | **관리자만** | 삭제 |
| `/api/files/upload` | POST | 회원 또는 비회원(세션) | **갤러리 아님** → R2 `quotes/` 전용, `gallery_items` 미사용 |

- 갤러리 테이블(`gallery_items`)에 넣는 코드는 **위 POST/PUT/DELETE 뿐**이며, 모두 `requireAdminAuth`로 관리자만 통과합니다.
- `requireAdminAuth`: `Authorization: Bearer <JWT>` 필수, JWT 검증 후 DB에서 `role` 조회, `admin` 또는 `super_admin`만 허용.

## 2. “관리자가 올리지 않은 사진”으로 보일 수 있는 경우

1. **시드 데이터**  
   - `migrations/seed_gallery.sql`로 **갤러리 항목 15건**이 INSERT 됩니다.  
   - 이미지는 `/placeholder-3d.jpg`(실제 파일 없음)라 메인에서는 “이미지 없음”으로 보입니다.  
   - 제목 예: 맞춤형 드론 프레임, 주얼리 캐스팅 마스터, 건축 모형 풀세트 등.  
   - **관리자 업로드가 아니라 DB 시드**이므로, 이 항목들이 “업로드된 사진”처럼 보일 수 있습니다.

2. **관리자 계정/토큰 유출**  
   - 관리자 JWT가 노출되면, 해당 토큰으로 `POST /api/gallery` 호출이 가능합니다.  
   - 비밀번호 재사용, 토큰 로그/캡처 등이 있으면 타인이 “관리자로” 업로드한 것처럼 보일 수 있습니다.

3. **직접 DB/R2 조작**  
   - D1 또는 R2에 직접 접근 가능한 계정이 있다면, 코드를 거치지 않고 갤러리 데이터/이미지가 들어갈 수 있습니다.

## 3. 적용한 대응

- **업로더 추적**: `gallery_items`에 `created_by_user_id` 컬럼 추가(마이그레이션 `schema_gallery_created_by.sql`).  
  - `POST /api/gallery` 호출 시 로그인한 관리자 `userId`를 저장합니다.  
  - 마이그레이션 적용: `npx wrangler d1 migrations apply wow3d-production --remote`  
  - 이후 등록분은 관리자 갤러리 API(`GET /api/admin/gallery`) 또는 D1 콘솔에서 `created_by_user_id`로 누가 올렸는지 확인 가능합니다.  
  - 시드/기존 행은 `created_by_user_id`가 NULL입니다.

## 4. 추가로 권장할 작업

- **시드 데이터 정리**: 메인에 보이는 “이미지 없음” 15건이 시드라면, D1에서 `image_url = '/placeholder-3d.jpg'` 인 항목을 삭제하거나 `is_visible = 0`으로 숨길 수 있습니다.
- **Cloudflare 로그**: Workers 대시보드에서 `POST /api/gallery` 요청 로그를 확인해, 의심스러운 IP/시간대가 없는지 점검할 수 있습니다.
- **관리자 비밀번호**: 관리자 계정 비밀번호 변경 및 로그인 세션 점검을 권장합니다.

이 문서는 점검 시점의 코드·마이그레이션 기준입니다.
