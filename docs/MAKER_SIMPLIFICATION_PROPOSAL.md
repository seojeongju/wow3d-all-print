# AI 3D Maker 기능 축소 제안

현재 상황을 반영해 **손글씨(스케치) 3D**는 유지하고, **이미지/텍스트 3D**는 축소·정리하는 방안을 제안합니다.

---

## 1. 현재 상태 정리

| 기능 | 동작 | 비고 |
|------|------|------|
| **손글씨(스케치) → 3D** | ✅ 안정적으로 동작 | 2D 경로 → 돌출 → 3D 미리보기·STL 저장. WebGL 부하 적음. |
| **이미지 → 3D (돌출 SVG)** | ⚠️ 동작하나 단순 이미지는 납작해 보임 | ImageTracer → SVG → 돌출. 실루엣 2.5D. |
| **이미지 → 3D (AI 3D / Tripo3D)** | ⚠️ API·폴링·GLB 로드 시 WebGL 부하·Context Lost 발생 | 이미지 업로드 → Tripo task → 폴링 → GLB 표시. |
| **텍스트 → 3D (Tripo3D)** | ⚠️ 위와 동일 | prompt → task → 폴링 → GLB. |

**콘솔 이슈:** `CONTEXT_LOST_WEBGL`, `THREE.WebGLRenderer: Context Lost`, Violation(handler 지연) 등이 이미지/텍스트 3D 사용 시 자주 발생.

---

## 2. 축소 방향 (제안)

**핵심:**  
- **스케치 3D**를 메인 기능으로 유지하고,  
- **이미지/텍스트 3D**는 제거하거나, “실험적/베타”로 한정해 노출을 줄인다.

---

## 3. 옵션 비교

### 옵션 A: 이미지·텍스트 3D 완전 제거 (가장 단순)

- **유지:** 스케치(2D) → 결과물(3D) → STL 저장, 돌출 높이·바닥 판·그리드 설정.
- **제거:**  
  - 이미지 업로드 버튼 및 ImageUploader  
  - 이미지 생성 방식(돌출/AI 3D), 이미지 변환 품질, pending SVG 카드  
  - 텍스트 → 3D 입력·버튼  
  - Tripo3D API 호출·폴링·tripoModels, Preview3D 내 GLB 표시
- **효과:** WebGL 사용처가 스케치 돌출만 남아 Context Lost·Violation이 크게 줄어듦. UI·코드 모두 단순해짐.
- **단점:** 이미지/텍스트로 3D 만들기는 불가.

---

### 옵션 B: 이미지·텍스트 3D를 “베타”로만 노출 (권장)

- **유지:**  
  - 스케치 3D (메인)  
  - 이미지 돌출(SVG)·AI 3D, 텍스트 3D **기능 자체는 유지**하되, **접근을 한 곳으로 모음**.
- **변경:**  
  - 오른쪽 패널에서 **「이미지 생성 방식」「이미지 변환 품질」「텍스트 → 3D」** 블록을 **하나의 접이식 섹션**으로 묶고, 제목을 **「베타: 이미지·텍스트 3D」** 등으로 표시.  
  - 기본은 **접혀 있음(closed)**.  
  - 안내 문구: “실험 기능입니다. WebGL 오류가 나면 스케치(2D)로 돌아가 주세요.”
- **효과:**  
  - 일반 사용자는 스케치만 쓰면 되어 에러 체감이 줄어듦.  
  - 필요한 사용자만 펼쳐서 이미지/텍스트 3D 사용 가능.
- **단점:** 코드/API는 그대로라, 사용 시에는 여전히 Context Lost 가능성 있음.

---

### 옵션 C: 이미지는 유지, 텍스트 3D만 제거

- **유지:** 스케치 3D + 이미지(돌출 SVG + 선택 시 AI 3D).  
- **제거:** 텍스트 → 3D 입력·버튼 및 관련 API 호출·폴링.  
- **효과:** 텍스트 3D로 인한 사용 시나리오가 사라져 일부 부하 감소.  
- **단점:** 이미지 AI 3D(GLB) 사용 시에는 여전히 WebGL 부하·Context Lost 가능.

---

### 옵션 D: Tripo3D(GLB)만 제거, 이미지 돌출(SVG)은 유지

- **유지:** 스케치 3D + **이미지 → SVG → 돌출** (2.5D만).  
- **제거:**  
  - 이미지 생성 방식 중 “AI 3D” 옵션  
  - Tripo3D 호출·폴링·tripoModels·Preview3D의 GLB  
  - 텍스트 → 3D 전체  
- **효과:** GLB 로드가 사라져 WebGL 사용이 스케치+SVG 돌출만 남음. Context Lost 가능성이 줄어듦.  
- **단점:** “이미지 한 장으로 진짜 입체 메시”는 불가.

---

## 4. 권장안: **옵션 B (베타로 접기)** 또는 **옵션 D (Tripo 제거)**

- **에러를 최대한 줄이고 싶다면:** **옵션 D**.  
  - 스케치 3D + 이미지 돌출(SVG)만 남기고, Tripo3D·텍스트 3D 제거.  
  - “손글씨 3D는 완벽, 이미지/텍스트 3D는 문제 많다”는 결론에 가장 잘 맞음.
- **이미지/텍스트 3D를 아예 없애고 싶지 않다면:** **옵션 B**.  
  - 기능은 유지하되 “베타” 접이식으로 숨겨서, 대부분 사용자는 스케치만 쓰게 함.

---

## 5. 옵션 D 적용 시 구체 작업 (참고)

- **MakerWorkspace**  
  - 이미지 생성 방식 UI에서 “AI 3D” 제거(또는 비활성화).  
  - “텍스트 → 3D” 섹션 제거.  
  - tripoPending·tripoModels·handleTripoTaskId·handleTextTo3D·textPrompt 등 상태/핸들러 제거.  
  - ImageUploader는 “돌출(SVG)”만 사용하도록 (useTripo3D/onTripoTaskId 제거).
- **Preview3D**  
  - tripoModels·GlbFromUrl·GLB 로드 제거.  
  - hasContent에서 hasTripo 제거.
- **스토어**  
  - tripoModels, addTripoModel, removeTripoModel, TripoModel 타입 제거(또는 나중을 위해 남겨두고 사용처만 제거).
- **API**  
  - `/api/maker/tripo3d` 는 삭제하지 않고 비공개로 두거나, 필요 시 제거.
- **도움말**  
  - “AI 3D”, “텍스트 3D” 관련 문구 삭제 또는 “베타” 안내로 수정.

원하시는 옵션(A/B/C/D)을 정해 주시면, 그에 맞춰 수정할 파일과 패치 단위로 더 쪼개서 제안하겠습니다.

---

## 6. 적용 완료: 옵션 D (2025-01-25)

**옵션 D**가 적용되었습니다.

- **MakerWorkspace**: 이미지 생성 방식(돌출 vs AI 3D) 제거, 텍스트→3D 섹션 제거, tripoPending/tripoModels/폴링 제거. ImageUploader는 SVG 변환만 사용.
- **Preview3D**: tripoModels·GlbFromUrl·useGLTF 제거. hasContent는 paths + importedSvgs + base만 사용.
- **useMakerStore**: tripoModels, addTripoModel, removeTripoModel, TripoModel 타입 제거.
- **ImageUploader**: useTripo3D, onTripoTaskId 제거. 이미지 → SVG 변환만 수행.
- **API**: `/api/maker/tripo3d` 라우트 제거(dead code 방지).
- **도움말**: AI 3D·텍스트 3D 언급 제거. 스케치 + 이미지→SVG→돌출 + STL 저장만 안내.
