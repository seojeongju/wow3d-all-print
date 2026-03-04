# AI 3D Maker 콘솔 에러 정리

콘솔에 보이는 메시지 의미와 대응을 정리했습니다.

---

## 1. WebGL Context Lost (가장 중요)

**메시지 예:**
- `WebGL: CONTEXT_LOST_WEBGL: loseContext:`
- `THREE.WebGLRenderer: Context Lost.`

**의미:** 브라우저/GPU가 WebGL 컨텍스트를 회수했습니다. 탭 전환, 다른 3D/동영상 사용, 메모리 부족 등으로 자주 발생합니다.

**현재 대응:**
- `ContextLossHandler`가 `webglcontextlost` 이벤트를 감지하면 에러를 던지고, `Maker3DErrorBoundary`가 「3D 미리보기를 불러올 수 없습니다」 화면과 **스케치(2D)로 돌아가기** 버튼을 띄웁니다.
- 사용자는 **스케치(2D) 탭**으로 돌아가면 다시 그리기/이미지 업로드를 이어갈 수 있습니다.

**추가 완화:**
- 3D 탭을 선택했을 때만 Canvas를 마운트하도록 되어 있어, 2D만 쓸 때는 WebGL을 쓰지 않습니다.
- DPR·그림자 등 GPU 부하를 낮춰 Context Lost 발생 가능성을 줄였습니다.

---

## 2. INVALID_OPERATION: delete: object does not belong to this context

**의미:** Context가 이미 사라진 뒤에 WebGL 객체(버퍼, 텍스처 등)를 지우려 해서 나는 오류입니다. Context Lost 이후 Three.js가 정리(dispose)를 시도할 때 흔히 발생합니다.

**대응:** Context Lost가 나면 우리 쪽에서는 더 이상 GL 호출을 하지 않고 에러 바운더리로 넘깁니다. 브라우저/Three 내부 정리 과정에서 한 번 나올 수 있으며, **스케치로 돌아가기** 후 다시 3D 탭을 열면 새 컨텍스트로 정상 동작합니다.

---

## 3. THREE.WebGLProgram 경고 (X4122, X4008)

**예:**
- `warning X4122: sum of ... cannot be represented accurately in double precision`
- `warning X4008: floating point division by zero`

**의미:** GPU 셰이더에서 부동소수점 정밀도 문제나 0으로 나누기가 발생했다는 경고입니다. Three.js 내부 셰이더(광원, 그림자, 재질)에서 나올 수 있습니다.

**대응:**
- GLB 스케일 계산 시 `maxDim`이 0이 되지 않도록 이미 `0.001` 이상으로 제한해 두었습니다.
- 그래도 내부 셰이더에서 나오는 경우, 무시해도 동작에는 큰 문제가 없는 경우가 많고, Context Lost를 줄이는 것이 우선입니다.

---

## 4. Violation (handler took … ms)

**예:**
- `'webglcontextrestored' handler took 391ms`
- `requestAnimationFrame handler took 1507ms`
- `'load' handler took 1567ms`

**의미:** 해당 이벤트/프레임 처리에 오래 걸려서 브라우저가 “느리다”고 알려주는 경고입니다. 3D 씬이 무겁거나, GLB 로드·컨텍스트 복구 시 한 번에 많은 일을 하면 나올 수 있습니다.

**대응:**
- DPR 상한을 낮추고, 그림자 맵 크기·광원 수를 이미 제한해 두었습니다.
- GLB는 필요한 만큼만 로드하고, 3D 탭을 켤 때만 Canvas가 마운트되도록 해 두었습니다.

---

## 요약

| 메시지 유형 | 심각도 | 사용자 동작 |
|------------|--------|-------------|
| Context Lost | 높음 | 「스케치(2D)로 돌아가기」 후 다시 사용 |
| INVALID_OPERATION (delete) | 보통 (Context Lost 후 이어짐) | 위와 동일 |
| WebGLProgram 경고 | 낮음 | 특별 조치 없음 (무시 가능) |
| Violation (handler took … ms) | 낮음 | 3D 탭/모델 수 줄이면 완화 가능 |

Context Lost가 반복되면 다른 탭의 동영상/3D를 닫거나, 브라우저를 새로 고친 뒤 다시 시도해 보시면 됩니다.
