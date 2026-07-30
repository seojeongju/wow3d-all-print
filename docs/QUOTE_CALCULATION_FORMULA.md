# 견적금액 산출식 정리

## 개요
이 문서는 WOW3D 3D 프린팅 서비스의 견적금액 산출 방식을 상세히 설명합니다.

## 단가 입력 위치

현재 시스템에서 단가를 입력하는 곳은 총 **4곳**입니다:

### 1. **기본시간당 비용** (hourly_rate)
- **위치**: `printer_equipment` 테이블 → `hourly_rate` 컬럼
- **단위**: 원(KRW) / 시간
- **용도**: 레이어별 시간당 비용이 설정되지 않은 경우 기본값으로 사용
- **기본값**:
  - FDM: 5,000원/시간
  - SLA: 8,000원/시간
  - DLP: 9,000원/시간

### 2. **레이어 두께별 시간당 비용** (layer_costs_json)
- **위치**: `printer_equipment` 테이블 → `layer_costs_json` 컬럼
- **형식**: JSON 객체 `{"0.1": 6000, "0.2": 5000, "0.3": 4500}`
- **단위**: 원(KRW) / 시간
- **용도**: 레이어 두께에 따라 다른 시간당 비용 적용 (우선순위 높음)
- **예시**:
  - 0.1mm: 6,000원/시간 (정밀)
  - 0.2mm: 5,000원/시간 (표준)
  - 0.3mm: 4,500원/시간 (고속)

### 3. **소재당 단가**
- **위치**: `materials` 테이블
- **FDM 소재**: `price_per_gram` 컬럼 (원/g)
- **SLA/DLP 소재**: `price_per_ml` 컬럼 (원/mL)
- **예시**:
  - PLA: 50원/g
  - Standard Resin: 150원/mL

### 4. **가격정책의 기타 비용** (printer_equipment 테이블)
각 출력 방식별로 다양한 추가 비용 파라미터가 있습니다.

#### FDM 관련 비용
- `fdm_labor_cost_krw`: 인건비 (기본값: 6,500원)
- `fdm_layer_hours_factor`: 레이어당 소요 시간 계수 (기본값: 0.02 시간/레이어)
- `fdm_support_per_cm2_krw`: 지지 구조 단가 (기본값: 26원/cm²)

#### SLA 관련 비용
- `sla_labor_cost_krw`: 인건비 (기본값: 9,100원)
- `sla_layer_exposure_sec`: 레이어당 노출 시간 (기본값: 8초)
- `sla_consumables_krw`: 소모품비 (기본값: 3,900원)
- `sla_post_process_krw`: 후가공 비용 (기본값: 10,400원)

#### DLP 관련 비용
- `dlp_labor_cost_krw`: 인건비 (기본값: 9,100원)
- `dlp_layer_exposure_sec`: 레이어당 노출 시간 (기본값: 3초)
- `dlp_consumables_krw`: 소모품비 (기본값: 3,900원)
- `dlp_post_process_krw`: 후가공 비용 (기본값: 10,400원)

---

## 견적 산출 공식

### 내부 환산 단위
- 비용은 **원화(KRW)** 로 직접 계산·표시합니다. (구 `/1300` 환산은 사용하지 않음)
- 최종 견적은 공급가에 VAT 10%를 적용한 뒤 `roundTo100`으로 100원 단위 정리

### FDM 방식

```
총 견적금액 = 재료비 + 지지구조비 + 장비비 + 인건비
(+ QuotePanel: 최소견적 적용 후 VAT 10% + 100원 반올림)

구현 위치: lib/fdm-quote.ts (QuotePanel / Hero / PricingCalculator 공통)
시간: lib/print-time-estimate.ts

1. 재료비 (Material Cost) — 쉘 + 인필 분리
   shellThicknessMm = 0.8  (대략 perimeter 2줄)
   shellVolCm3 = min(volumeCm3, surfaceAreaCm2 × shellThicknessMm/10)
   infillVolCm3 = max(0, volumeCm3 − shellVolCm3)
   weightGrams = shellVol×density + infillVol×density×(infill/100)
   materialCost = pricePerGram × weightGrams
   ※ 인필 범위 10~100% (기본 20%). 구 density×0.2 floor는 제거 → 10%도 실제 반영

2. 지지구조비 (Support Cost)
   supportEnabled ? fdm_support_per_cm2_krw × (overhangArea 또는 surfaceArea×0.3) : 0

3. 출력 시간 (estTimeHours)  ← 레이어 높이 + 인필 반영 무게
   refLayer = 0.2 mm
   speedModifier = (refLayer / layerHeight) ^ alpha   // alpha 기본 1
   numLayers = ceil(heightMm / layerHeight)
   volumeTime   = (weightGrams + 1)^0.85 × 0.0297 × speedModifier
   movementTime = numLayers × (fdm_layer_hours_factor × 0.08)
   surfaceTime  = (surfaceAreaCm2 + 1)^0.8 × 0.00126 × speedModifier
   estTimeHours = max(0.5, volumeTime + movementTime + surfaceTime)
   ※ 인필↑ → weightGrams↑ → volumeTime↑ (간접)

4. 장비비 (Machine Cost)
   machineRate = layerCosts[layerHeight] 또는 hourlyRate
   effectiveRate = time>10 ? rate×0.7 : time>5 ? rate×0.8 : rate
   machineCost = estTimeHours × effectiveRate

5. 인건비 (Labor Cost)
   fdm_labor_cost_krw (고정)
```

### SLA/DLP 방식

```
총 견적금액 = 레진비 + 기타비용 + 장비비 + 인건비

구현 위치: lib/resin-quote.ts (QuotePanel / PricingCalculator / 서버 재계산 공통)
시간: lib/print-time-estimate.ts → estimateResinPrintTimeHours

1. 레진비
   resinCost = pricePerMl × volumeCm3  (1 cm³ ≈ 1 mL)

2. 기타비용
   consumables + (postProcessing ? postProcess : 0)

3. 출력 시간
   numLayers = ceil(heightMm / layerHeight)
   rawHours = numLayers × (layerExposureSec + 8.5) / 3600
   estTimeHours = max(0.5, (rawHours + 0.1)^0.9 × 0.953)
   ※ SLA 노출 8s / DLP 노출 3s (DB·장비 설정으로 변경 가능)

4. 장비비
   FDM과 동일하게 시간 × (layerCosts 또는 hourlyRate), 볼륨 디스카운트 적용

5. 인건비
   sla/dlp_labor_cost_krw
```

---

## 비용 우선순위

### 시간당 비용 결정
1. **우선**: `layer_costs_json`에서 해당 레이어 두께 값이 있으면 사용
2. **차선**: 없으면 `hourly_rate` 사용
3. **기본**: 둘 다 없으면 출력방식별 기본값 사용

### 기타 파라미터 결정
1. **우선**: DB에 설정된 값 사용 (`printer_equipment` 테이블)
2. **기본**: NULL이면 코드에 정의된 기본값 사용

---

## 예시 계산

> 참고: 아래 숫자 예시는 구 `/1300` 환산 시절의 참고용입니다.  
> **현재 시간은 `lib/print-time-estimate.ts` + `scripts/verify-print-time.ts` 기준으로 검증하세요.**

### FDM 출력 예시
- **모델 정보**:
  - 부피: 10 cm³
  - 표면적: 50 cm²
  - 높이: 50 mm
  - 레이어 두께: 0.2 mm

- **설정**:
  - 소재: PLA (50원/g, 밀도 1.24)
  - Infill: 20%
  - 지지구조: 사용

- **계산**:
  1. 재료비:
     - adjustedDensity = max(1.24 × 0.2, 1.24 × 0.2) = 0.248
     - weightGrams = 10 × 0.248 = 2.48 g
     - materialCost = (50 / 1300) × 2.48 = 0.0954 단위 = 124원

  2. 지지구조비:
     - supportCost = (26 / 1300) × 50 = 1단위 = 1,300원

  3. 장비비:
     - numLayers = ceil(50 / 0.2) = 250 layers
     - estTimeHours = max(1, 250 × 0.02) = 5 시간
     - machineRate = 5000 / 1300 = 3.846단위
     - machineCost = 5 × 3.846 = 19.23단위 = 25,000원

  4. 인건비:
     - laborCost = 6500 / 1300 = 5단위 = 6,500원

  **총 견적**: (0.0954 + 1 + 19.23 + 5) × 1300 = **32,920원**

---

## 관리자 설정 가이드

### 1. 소재 단가 설정
- 관리 페이지 → 소재 관리
- FDM: `price_per_gram` (원/g) 입력
- SLA/DLP: `price_per_ml` (원/mL) 입력

### 2. 장비 기본 시간당 비용 설정
- 관리 페이지 → 장비 관리
- `hourly_rate` 수정

### 3. 레이어별 시간당 비용 설정
- 관리 페이지 → 장비 관리
- `layer_costs_json` 필드에 JSON 형식으로 입력
- 예: `{"0.1": 6000, "0.2": 5000, "0.3": 4500}`

### 4. 가격정책 파라미터 설정
- DB 직접 수정 또는 관리 페이지에서 설정
- FDM: `fdm_labor_cost_krw`, `fdm_layer_hours_factor`, `fdm_support_per_cm2_krw`
- SLA: `sla_labor_cost_krw`, `sla_layer_exposure_sec`, `sla_consumables_krw`, `sla_post_process_krw`
- DLP: `dlp_labor_cost_krw`, `dlp_layer_exposure_sec`, `dlp_consumables_krw`, `dlp_post_process_krw`

---

## 구현 파일 위치

### 프론트엔드
- **FDM 견적**: `lib/fdm-quote.ts` — QuotePanel / Hero / PricingCalculator
- **SLA/DLP 견적**: `lib/resin-quote.ts` — QuotePanel / PricingCalculator
- **견적 저장 스토어**: `store/useQuoteStore.ts`

### 백엔드 API
- **견적 저장(서버 재계산)**: `app/api/quotes/route.ts` — FDM `lib/server-fdm-quote.ts`, SLA/DLP `lib/server-resin-quote.ts`
- **출력 스펙 조회**: `app/api/print-specs/route.ts`
- **소재 조회**: `app/api/materials/route.ts`

### 데이터베이스
- **장비 테이블**: `printer_equipment`
- **소재 테이블**: `materials`
- **스키마 파일**:
  - `schema_equipment.sql`
  - `schema_equipment_calc_params.sql`
  - `schema_equipment_layer_costs.sql`
  - `schema_materials.sql`
  - `schema_materials_price_per_ml.sql`

---

## 참고 사항

1. **환산 계수 (1300)**: 내부 계산의 정밀도를 위해 사용되며, 최종 사용자에게는 원화(KRW)로 표시됩니다.

2. **레이어별 시간당 비용**: 레이어 두께가 얇을수록 정밀도는 높지만 시간이 오래 걸리므로, 시간당 비용을 높게 설정하는 것이 일반적입니다.

3. **Infill 밀도**: FDM에서 인필이 낮을수록 내부 재료·시간이 줄어듭니다. 외벽(쉘)은 인필과 무관하게 반영되며, UI 최소는 10%(권장 기본 20%)입니다.

4. **지지 구조**: 복잡한 형상의 경우 지지 구조가 필요하며, 이는 표면적에 비례하여 비용이 증가합니다.

5. **후가공**: SLA/DLP는 출력 후 세척, 경화 등의 후가공이 필요하며, 이 비용은 선택 사항입니다.

---

**최종 업데이트**: 2026-07-30

### 인필 캘리브레이션 체크리스트 (운영)

동일 샘플(예: `test_cube.stl`)로 슬라이서 실측과 자동견적을 비교합니다.

1. 인필 20% / 40% / 80% / 100% 각각에서 슬라이서 예상 필라멘트(g)·시간 기록
2. `/quote` 동일 옵션 견적 재료량·시간 기록
3. 재료량 오차 ±20% 이내, 시간 오차 ±30% 이내를 1차 목표로 둠
4. 체계적으로 어긋나면 `FDM_SHELL_THICKNESS_MM` 또는 `print-time-estimate` 계수 조정
5. FDM 견적 저장 시 `/api/quotes`는 서버 재계산값(`pricingSource: server`)을 우선 저장
6. SLA/DLP도 동일하게 서버 재계산 후 저장 (후가공·레이어 두께·레진 단가 반영)

### 레진(SLA/DLP) 캘리브레이션 체크리스트

1. 대표 모델 1~3개(소·중·대)를 Chitubox/Lychee 등에서 슬라이싱
2. 레이어 0.025 / 0.05 / 0.1 mm 각각 예상 레진량(mL)·시간(h) 기록
3. `/quote` 동일 조건 견적과 비교 — 재료량 ±20%, 시간 ±30% 목표
4. 후가공 ON/OFF 시 견적 차이가 `sla_post_process_krw` / `dlp_post_process_krw`와 일치하는지 확인
5. FDM 대비 비율: `npm run calibrate:quotes` — DLP≈3.5×, SLA≈6× (±10%) 목표
6. 비율이 어긋나면 `docs/QUOTE_FDM_SLA_DLP_RATIO_PROPOSAL.md` 계수(시간당비용·노출시간·인건비·레진단가) 조정

### 캘리브레이션 스크립트

```bash
npm run calibrate:quotes          # 비율·인필·레이어 민감도 리포트
npm run test:fdm                  # FDM 단위 검증
npm run test:resin                # SLA/DLP 단위 검증
```

슬라이서 실측 비교: `scripts/calibrate-samples.json`에 `materialAmount`·`hours` 입력 후 재실행
