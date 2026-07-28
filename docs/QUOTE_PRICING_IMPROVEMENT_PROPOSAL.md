# 자동견적 금액 – 사이즈 커질 때 급격한 상승 완화 제안

## 원인

현재 FDM 견적 시간 공식은 **부피(무게)·레이어 수·표면적에 선형**이라, 크기가 커질수록 견적이 과하게 증가합니다.

- **volumeTime** = 무게(g) × 0.015 → 부피가 2배면 2배
- **movementTime** = 레이어 수 × (0.02×0.08) → 높이 2배면 약 2배
- **surfaceTime** = 표면적(cm²) × 0.0005 → 표면 2배면 2배

예: 정육면체 한 변 10cm → 20cm로 키우면 부피 8배, 표면 4배.  
→ 시간·장비비가 거의 선형으로 따라가서 **실제 체감보다 견적이 많이 뛰는** 느낌이 듦.

---

## 수정 방향 제안

### 1. **부피 기반 시간을 서브리니어로** (권장·적용)

- **현재**: `volumeTime = weightGrams × 0.015` (완전 선형)
- **변경**: `volumeTime = (weightGrams + 1)^0.9 × 0.0236`
  - 작은 부품(예: 100g)은 기존과 비슷하게 유지
  - 큰 부품일수록 “g당 추가 시간”이 조금씩 줄어들어, 크기 커져도 견적이 덜 급격히 증가

효과: 큰 사이즈에서 장비비 상승이 완만해지고, 소형은 기존과 유사하게 유지.

### 2. **표면적 기여 완화** (선택)

- **현재**: `surfaceTime = surfaceAreaCm2 × 0.0005`
- **변경 예**: `surfaceTime = (surfaceAreaCm2 + 1)^0.85 × k` (k는 기존 곡선과 비슷하게 맞추기)
- 또는 계수만 축소: `0.0005` → `0.0003` 등

큰 모델에서 표면적이 시간을 너무 키우는 경우에만 적용해도 됨.

### 3. **장비비 “볼륨 디스카운트”** (선택)

- 예: 예상 시간이 5시간 넘으면 시간당 단가를 10% 할인 등
- `effectiveRate = rateKRW * (estTimeHours > 5 ? 0.9 : 1)`
- 대형 주문에 대한 정책으로만 도입할 때 유용.

### 4. **계수만 조정** (가장 단순)

- `materialTimeFactor` 0.015 → 0.010 등으로 낮춰서, 큰 부품의 “시간 누적”을 전반적으로 줄이기
- 장점: 구현 간단. 단점: 소형 견적도 같이 내려감.

---

## 적용된 변경 (이번 수정)

### FDM (보완)
- **부피 시간**: `volumeTime = (weightGrams + 1)^0.85 × 0.0297` (지수 0.85로 대형 더 완만, 100g 근처 유지)
- **표면 시간**: `surfaceTime = (surfaceAreaCm2 + 1)^0.8 × 0.00126` (지수 0.8로 대형 더 완만)

### SLA / DLP
- **예상 시간** 서브리니어: `rawEstTimeHours = numLayers × (노출+지연)/3600` 후  
  `estTimeHours = max(0.5, (rawEstTimeHours + 0.1)^0.9 × 0.953)`
- 약 1시간 구간은 기존과 비슷, 장시간 작업은 완만하게 증가.

적용 위치: QuotePanel(/quote), 관리자 PricingCalculator, Hero.  
공통 모듈: `lib/print-time-estimate.ts`

### 레이어 높이 차별화 (2026-07 적용)
- **문제**: 고객 견적에서 `volumeTime`/`surfaceTime`이 레이어 높이와 무관해 0.1·0.2·0.3 차이가 거의 없음
- **수정**: `speedModifier = (0.2 / layerHeight)^alpha` (alpha 기본 1)를 부피·표면 시간에 곱함
- **검증**: `npx tsx scripts/verify-print-time.ts` → 0.1≈2.0×, 0.3≈0.67× (0.2 대비)
- **완화**: 체감이 과하면 `estimateFdmPrintTimeHours({ layerSpeedAlpha: 0.85 })` 로 조정


### 볼륨 디스카운트 (2단계)
- **FDM / SLA / DLP** 공통: **5h 초과** 시 20% 할인(0.8배), **10h 초과** 시 30% 할인(0.7배)  
  `effectiveRate = estTimeHours > 10 ? rate * 0.7 : estTimeHours > 5 ? rate * 0.8 : rate`
