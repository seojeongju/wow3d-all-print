# 📥 주문 관리 파일 다운로드 기능

## 개요

관리자 대시보드의 주문 관리 페이지에서 주문된 3D 모델 파일을 다운로드할 수 있는 기능을 구현했습니다.

## 구현 날짜
2026-01-26

---

## ✨ 주요 기능

### 1. CSV 다운로드
- **위치**: `/admin/orders` 메인 페이지
- **기능**: 현재 필터링된 주문 목록을 CSV 파일로 내보내기
- **특징**:
  - 한글 엑셀 호환 (BOM 인코딩)
  - 주문번호, 고객명, 이메일, 금액, 상태, 날짜 등 포함
  - 파일명: `wow3d-orders-YYYY-MM-DD.csv`

### 2. 개별 파일 다운로드
- **위치**: 주문 상세 모달 > 주문 항목 테이블
- **기능**: 각 주문 항목의 3D 모델 파일(STL/OBJ) 다운로드
- **특징**:
  - R2 스토리지에서 직접 다운로드
  - 관리자 권한 검증
  - 다운로드 진행 상태 표시 (로딩 스피너)
  - 개별 파일별 로딩 상태 관리
  - 성공/실패 토스트 알림

### 3. 일괄 다운로드 (신규)
- **위치**: 주문 상세 모달 > 주문 항목 섹션 상단
- **기능**: 한 주문의 모든 파일을 순차적으로 다운로드
- **조건**: 2개 이상의 파일이 있을 때만 버튼 표시
- **특징**:
  - 파일 개수 표시
  - 다운로드 간 500ms 지연 (브라우저 처리 시간)
  - 성공/실패 카운트 표시
  - 다운로드 중 버튼 비활성화

---

## 🔧 기술 구현

### Frontend (React/Next.js)

#### 파일: `/app/admin/orders/page.tsx`

**주요 State**:
```typescript
const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
```

**핸들러 함수**:

1. **handleFileDownload**: 개별 파일 다운로드
```typescript
const handleFileDownload = async (itemId: number, quoteId: number, fileName: string) => {
    setDownloadingFileId(itemId);
    try {
        const url = `/api/admin/orders/${detailOrderId}/file?quoteId=${quoteId}`;
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(url, { headers });
        // ... blob 처리 및 다운로드
    } catch (e) {
        // 에러 처리
    } finally {
        setDownloadingFileId(null);
    }
};
```

2. **handleBulkDownload**: 일괄 다운로드
```typescript
const handleBulkDownload = async () => {
    const filesToDownload = detailData.items.filter((it: any) => it.file_url);
    for (const item of filesToDownload) {
        await handleFileDownload(Number(item.id), Number(item.quote_id), String(item.file_name));
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};
```

3. **handleCsvDownload**: CSV 내보내기
```typescript
const handleCsvDownload = () => {
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    // ... 다운로드
};
```

### Backend API

#### 파일: `/app/api/admin/orders/[id]/file/route.ts`

**엔드포인트**: `GET /api/admin/orders/[id]/file`

**Query Parameters**:
- `quoteId`: 다운로드할 견적 ID (선택사항)

**인증**:
- JWT 토큰 필수 (`Authorization: Bearer <token>`)
- 관리자 권한 검증 (`role = 'admin'`)

**처리 흐름**:
1. 사용자 인증 확인
2. 관리자 권한 확인
3. 주문 존재 여부 확인
4. 주문 항목에서 파일 정보 조회
5. R2 스토리지에서 파일 가져오기
6. 파일 다운로드 응답 반환

**R2 Key 처리**:
- URL 형식: `quotes/{quoteId}/{fileName}`
- URL 파싱하여 올바른 R2 key 추출
- 다양한 URL 형식 지원

**응답 헤더**:
```typescript
'Content-Type': r2Object.httpMetadata?.contentType || 'application/octet-stream'
'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`
'Content-Length': r2Object.httpMetadata?.contentLength
```

---

## 🎨 UI/UX 개선사항

### 로딩 상태 표시
- **다운로드 전**: 파일 아이콘 + "다운로드" 텍스트
- **다운로드 중**: 회전하는 스피너 + "다운로드 중..." 텍스트
- **버튼 비활성화**: 다운로드 중에는 버튼 클릭 불가

### 사용자 피드백
- ✅ **성공**: "파일 다운로드 완료" 토스트
- ❌ **실패**: "다운로드 실패" + 상세 오류 메시지 토스트
- 📊 **일괄 다운로드**: 성공/실패 개수 표시

### 시각적 요소
- Primary 색상으로 다운로드 버튼 강조
- Hover 시 배경색 변경
- Disabled 시 투명도 50%

---

## 📋 데이터베이스 스키마

### 주요 테이블

**orders**:
- `id`: 주문 ID (PK)
- `order_number`: 주문번호
- `user_id`: 회원 ID (FK, nullable)
- `guest_email`: 비회원 이메일
- `total_amount`: 총 금액
- `status`: 주문 상태

**order_items**:
- `id`: 항목 ID (PK)
- `order_id`: 주문 ID (FK)
- `quote_id`: 견적 ID (FK)
- `quantity`: 수량
- `unit_price`: 단가
- `subtotal`: 소계

**quotes**:
- `id`: 견적 ID (PK)
- `file_name`: 파일명
- `file_url`: R2 스토리지 경로
- `print_method`: 출력 방식

---

## 🔐 보안

### 인증/권한
- JWT 토큰 기반 인증
- 관리자 권한 필수 (`role = 'admin'`)
- 각 요청마다 DB에서 사용자 role 확인

### 파일 접근 제어
- 주문 ID 검증
- 주문 항목-견적 관계 검증
- R2 버킷 접근은 서버사이드에서만 처리

### 오류 처리
- 상세 오류 메시지는 콘솔에만 로깅
- 사용자에게는 일반적인 오류 메시지 표시
- 모든 비정상 케이스에 대한 fallback 처리

---

## 🧪 테스트 시나리오

### 1. CSV 다운로드
- [ ] 전체 주문 목록 다운로드
- [ ] 필터링된 주문 목록 다운로드
- [ ] 한글 파일명 및 내용 확인
- [ ] 엑셀에서 올바르게 열리는지 확인

### 2. 개별 파일 다운로드
- [ ] STL 파일 다운로드
- [ ] OBJ 파일 다운로드
- [ ] 파일명이 올바른지 확인
- [ ] 다운로드 중 로딩 표시 확인
- [ ] 성공/실패 토스트 표시 확인

### 3. 일괄 다운로드
- [ ] 2개 이상 파일이 있을 때 버튼 표시
- [ ] 모든 파일이 순차적으로 다운로드
- [ ] 다운로드 중 버튼 비활성화
- [ ] 성공/실패 카운트 정확성 확인

### 4. 권한 테스트
- [ ] 관리자가 아닌 사용자 접근 차단
- [ ] 토큰 없이 접근 차단
- [ ] 유효하지 않은 토큰 접근 차단

### 5. 오류 처리
- [ ] 존재하지 않는 주문 ID
- [ ] 존재하지 않는 파일
- [ ] R2 버킷 연결 실패
- [ ] 네트워크 오류

---

## 🚀 향후 개선 사항

### 단기
- [ ] 파일 압축 다운로드 (ZIP)
- [ ] 다운로드 진행률 표시 (Progress bar)
- [ ] 파일 미리보기 기능

### 중기
- [ ] 파일 크기 표시
- [ ] 파일 업로드 날짜 표시
- [ ] 썸네일 생성 및 표시

### 장기
- [ ] 대용량 파일 스트리밍 다운로드
- [ ] 다운로드 이력 추적
- [ ] 다운로드 통계 대시보드

---

## 📞 문의

기능 관련 문의사항이나 버그 리포트는 개발팀에 문의해주세요.

**마지막 업데이트**: 2026-01-26
**버전**: v1.0.0
