# 견적금액 산출식 관리 가이드

## 📌 목차
1. [개요](#개요)
2. [단가 설정 방법](#단가-설정-방법)
3. [자주 묻는 질문](#자주-묻는-질문)
4. [문제 해결](#문제-해결)

---

## 개요

WOW3D 3D 프린팅 자동 견적 시스템은 **4가지 단가 입력 위치**를 통해 견적금액을 계산합니다.

### 견적 구성 요소
- **FDM**: 재료비 + 지지구조비 + 장비비 + 인건비
- **SLA/DLP**: 레진비 + 기타비용(소모품+후가공) + 장비비 + 인건비

### 환산 계수
- 모든 비용은 내부적으로 **원화 ÷ 1300** 으로 계산
- 최종 사용자에게는 **× 1300** 하여 원화(KRW)로 표시

---

## 단가 설정 방법

### ① 기본시간당 비용 (hourly_rate)

**경로**: 관리 페이지 → 장비 관리 → 장비 수정

**설정값 예시**:
- FDM: 5,000원/시간
- SLA: 8,000원/시간
- DLP: 9,000원/시간

**주의사항**:
- 레이어별 시간당 비용이 없을 때 사용되는 **기본값**
- 모든 레이어 두께에 동일하게 적용됨

---

### ② 레이어별 시간당 비용 (layer_costs_json)

**경로**: 관리 페이지 → 장비 관리 → 장비 수정 → 고급 설정

**설정 형식**: JSON 객체
```json
{
  "0.1": 6000,
  "0.2": 5000,
  "0.3": 4500
}
```

**설정 이유**:
- 레이어가 얇을수록 출력 시간이 오래 걸림
- 정밀도에 따라 차등 가격 책정 가능
- ① 기본시간당 비용보다 **우선순위가 높음**

**예시 시나리오**:
```
상황: FDM 0.2mm 레이어로 출력
- layer_costs_json에 "0.2": 5000 설정됨
- hourly_rate는 6000원

결과: 5,000원/시간 적용 (layer_costs_json 우선)
```

---

### ③ 소재당 단가

**경로**: 관리 페이지 → 소재 관리 → 소재 추가/수정

#### FDM 소재
- **필드**: `price_per_gram`
- **단위**: 원/g
- **예시**:
  - PLA: 50원/g
  - ABS: 60원/g
  - PETG: 80원/g
  - TPU: 150원/g

#### SLA/DLP 소재
- **필드**: `price_per_ml`
- **단위**: 원/mL
- **예시**:
  - Standard Resin: 150원/mL
  - Tough Resin: 200원/mL
  - Clear Resin: 180원/mL

**밀도 설정** (FDM만 해당):
- PLA: 1.24 g/cm³
- ABS: 1.04 g/cm³
- PETG: 1.27 g/cm³

---

### ④ 가격정책 비용

**경로**: 데이터베이스 직접 수정 또는 고급 관리 페이지

#### FDM 관련 비용
| 파라미터 | 설명 | 기본값 | 단위 |
|----------|------|--------|------|
| `fdm_labor_cost_krw` | 인건비 | 6,500 | 원 |
| `fdm_layer_hours_factor` | 레이어당 소요 시간 | 0.02 | 시간/레이어 |
| `fdm_support_per_cm2_krw` | 지지 구조 단가 | 26 | 원/cm² |

**SQL 예시**:
```sql
UPDATE printer_equipment 
SET fdm_labor_cost_krw = 7000,
    fdm_layer_hours_factor = 0.025,
    fdm_support_per_cm2_krw = 30
WHERE type = 'FDM';
```

#### SLA 관련 비용
| 파라미터 | 설명 | 기본값 | 단위 |
|----------|------|--------|------|
| `sla_labor_cost_krw` | 인건비 | 9,100 | 원 |
| `sla_layer_exposure_sec` | 레이어당 노출 시간 | 8 | 초 |
| `sla_consumables_krw` | 소모품비 | 3,900 | 원 |
| `sla_post_process_krw` | 후가공 비용 | 10,400 | 원 |

#### DLP 관련 비용
| 파라미터 | 설명 | 기본값 | 단위 |
|----------|------|--------|------|
| `dlp_labor_cost_krw` | 인건비 | 9,100 | 원 |
| `dlp_layer_exposure_sec` | 레이어당 노출 시간 | 3 | 초 |
| `dlp_consumables_krw` | 소모품비 | 3,900 | 원 |
| `dlp_post_process_krw` | 후가공 비용 | 10,400 | 원 |

---

## 자주 묻는 질문

### Q1. 레이어별 시간당 비용을 설정했는데 적용되지 않아요
**확인사항**:
1. JSON 형식이 올바른지 확인 (중괄호, 따옴표, 쉼표)
2. 키가 문자열인지 확인 (`"0.1"`, `"0.2"` 등)
3. 값이 숫자인지 확인 (따옴표 없음)
4. 사용자가 선택한 레이어 두께가 JSON에 있는지 확인

**올바른 예시**:
```json
{"0.1": 6000, "0.2": 5000, "0.3": 4500}
```

**잘못된 예시**:
```json
{0.1: "6000", 0.2: "5000"}  // ❌ 키에 따옴표 없음, 값이 문자열
```

---

### Q2. 소재를 추가했는데 견적 페이지에 안 보여요
**확인사항**:
1. 소재의 `is_active` 필드가 1인지 확인
2. 소재의 `type` 필드가 올바른지 확인 (FDM, SLA, DLP)
3. 브라우저 캐시 문제일 수 있음 → 새로고침 (Ctrl+F5)
4. 45초 대기 (자동 새로고침 주기)

---

### Q3. 견적 금액이 너무 낮거나 높게 나와요
**체크리스트**:
1. **소재 단가 확인**: 원/g 또는 원/mL 단위가 맞는지
2. **시간당 비용 확인**: 너무 낮거나 높지 않은지
3. **밀도 확인** (FDM): 소재별 밀도가 올바른지
4. **레이어당 시간 확인**: `fdm_layer_hours_factor`가 너무 크거나 작지 않은지

**일반적인 범위**:
- FDM 소재: 30~200원/g
- SLA/DLP 소재: 100~300원/mL
- 시간당 비용: 3,000~15,000원/시간

---

### Q4. FDM 지지 구조 비용이 과도하게 높아요
**해결 방법**:
1. `fdm_support_per_cm2_krw` 값 조정 (기본 26원/cm²)
2. 모델의 표면적이 큰 경우 지지 구조 비용이 높아질 수 있음
3. 사용자가 지지 구조를 비활성화할 수 있도록 안내

---

### Q5. SLA/DLP 후가공 비용을 조정하고 싶어요
**방법**:
```sql
-- SLA 후가공 비용 변경
UPDATE printer_equipment 
SET sla_post_process_krw = 15000 
WHERE type = 'SLA';

-- DLP 후가공 비용 변경
UPDATE printer_equipment 
SET dlp_post_process_krw = 12000 
WHERE type = 'DLP';
```

---

## 문제 해결

### 견적이 0원으로 표시됨
**원인**:
- 소재 단가가 설정되지 않음
- 소재가 비활성화됨
- DB 연결 문제

**해결**:
1. 소재 관리에서 가격 확인
2. 네트워크 탭에서 API 응답 확인
3. 브라우저 콘솔에서 에러 확인

---

### 레이어별 비용이 적용되지 않음
**원인**:
- JSON 형식 오류
- 문자열 타입 불일치

**해결**:
1. JSON 유효성 검사 도구 사용
2. DB에서 직접 확인:
   ```sql
   SELECT layer_costs_json FROM printer_equipment WHERE type = 'FDM';
   ```
3. 올바른 형식으로 수정

---

### 시간 계산이 부정확함
**FDM**:
- `fdm_layer_hours_factor` 값 확인
- 일반적으로 0.01~0.05 시간/레이어

**SLA/DLP**:
- `sla_layer_exposure_sec` 또는 `dlp_layer_exposure_sec` 확인
- SLA: 5~15초/레이어
- DLP: 1~5초/레이어

---

## 참고 문서
- [상세 계산 공식](./QUOTE_CALCULATION_FORMULA.md)
- [빠른 참조 가이드](./QUOTE_CALCULATION_QUICK_REFERENCE.md)
- [플로우차트](../public/quote_calculation_flowchart.png)

## 기술 문의
- 구현 파일: `components/quote/QuotePanel.tsx`
- API 엔드포인트: `/api/print-specs`, `/api/materials`
- DB 스키마: `schema_equipment_calc_params.sql`

---

**최종 업데이트**: 2026-01-27  
**작성자**: Antigravity AI
