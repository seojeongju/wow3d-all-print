# 견적 산출 공식 요약 (Quick Reference)

## 4가지 단가 입력 위치

### 📋 요약표

| 번호 | 입력 항목 | DB 위치 | 단위 | 용도 |
|------|-----------|---------|------|------|
| **1** | 기본시간당 비용 | `printer_equipment.hourly_rate` | 원/시간 | 레이어별 비용이 없을 때 기본값 |
| **2** | 레이어별 시간당 비용 | `printer_equipment.layer_costs_json` | 원/시간 | 레이어 두께별 차등 적용 (우선순위 높음) |
| **3** | 소재당 단가 | `materials.price_per_gram` (FDM)<br>`materials.price_per_ml` (SLA/DLP) | 원/g<br>원/mL | 재료비 계산 |
| **4** | 가격정책 비용 | `printer_equipment.*_labor_cost_krw`<br>`printer_equipment.*_support_per_cm2_krw` 등 | 원 | 인건비, 지지구조비, 소모품비, 후가공비 |

---

## 총 견적금액 공식

### FDM 방식
```
총 견적금액 = 재료비 + 지지구조비 + 장비비 + 인건비

재료비      = (price_per_gram / 1300) × 소요무게(g)
지지구조비  = (fdm_support_per_cm2_krw / 1300) × 표면적(cm²)  [선택사항]
장비비      = 출력시간(h) × (hourlyRate 또는 layerCosts / 1300)
인건비      = fdm_labor_cost_krw / 1300
```

### SLA/DLP 방식
```
총 견적금액 = 레진비 + 기타비용 + 장비비 + 인건비

레진비    = (price_per_ml / 1300) × 부피(mL)
기타비용  = 소모품비 + 후가공비  [후가공비는 선택사항]
장비비    = 출력시간(h) × (hourlyRate 또는 layerCosts / 1300)
인건비    = sla_labor_cost_krw 또는 dlp_labor_cost_krw / 1300
```

---

## 우선순위 규칙

### 시간당 비용 결정 순서
1. ✅ **우선**: `layer_costs_json`에서 해당 레이어 두께 값 찾기
2. ⚠️ **차선**: 없으면 `hourly_rate` 사용
3. ℹ️ **기본**: 둘 다 없으면 코드 기본값 (FDM: 5000, SLA: 8000, DLP: 9000)

---

## 빠른 설정 가이드

### 1️⃣ 소재 단가 설정
- **경로**: 관리 페이지 → 소재 관리
- **FDM**: `price_per_gram` 입력 (예: PLA 50원/g)
- **SLA/DLP**: `price_per_ml` 입력 (예: Standard 150원/mL)

### 2️⃣ 시간당 비용 설정
- **기본 설정**: 관리 페이지 → 장비 관리 → `hourly_rate`
- **레이어별 설정** (추천): `layer_costs_json` 필드
  ```json
  {"0.1": 6000, "0.2": 5000, "0.3": 4500}
  ```

### 3️⃣ 가격정책 파라미터 설정
- **FDM**: 
  - `fdm_labor_cost_krw`: 인건비 (기본 6,500원)
  - `fdm_layer_hours_factor`: 레이어당 시간 (기본 0.02h)
  - `fdm_support_per_cm2_krw`: 지지 단가 (기본 26원/cm²)
  
- **SLA/DLP**:
  - `*_labor_cost_krw`: 인건비 (기본 9,100원)
  - `*_layer_exposure_sec`: 레이어 노출시간 (SLA: 8초, DLP: 3초)
  - `*_consumables_krw`: 소모품비 (기본 3,900원)
  - `*_post_process_krw`: 후가공비 (기본 10,400원)

---

## 예시 계산 (요약)

### FDM 예시
```
모델: 10cm³, 표면적 50cm², 높이 50mm, 레이어 0.2mm
소재: PLA (50원/g, 밀도 1.24), Infill 20%, 지지구조 사용

재료비:     124원
지지구조비: 1,300원
장비비:     25,000원  (5시간 × 5,000원/h)
인건비:     6,500원
───────────────────
총 견적:    32,924원
```

### SLA 예시
```
모델: 5cm³, 높이 30mm, 레이어 0.05mm
소재: Standard (150원/mL), 후가공 사용

레진비:   750원
기타비용: 14,300원  (소모품 3,900원 + 후가공 10,400원)
장비비:   4,000원  (0.5시간 × 8,000원/h)
인건비:   9,100원
───────────────────
총 견적:   28,150원
```

---

## 상세 문서
더 자세한 내용은 [QUOTE_CALCULATION_FORMULA.md](./QUOTE_CALCULATION_FORMULA.md) 참조

## 구현 파일
- 프론트엔드 계산 로직: `components/quote/QuotePanel.tsx` (line 146~208)
- 백엔드 API: `app/api/print-specs/route.ts`
- 데이터베이스: `schema_equipment_calc_params.sql`, `schema_materials.sql`
