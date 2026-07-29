/**
 * 사이트 전역 카피 단일 소스.
 * 파일 형식·납기 등 고객/SEO에 노출되는 문구는 여기서만 정의하고 각 UI에서 재사용한다.
 *
 * 실제 동작:
 * - STL/OBJ/3MF/PLY: 메쉬 직접 분석 → 즉시 자동견적
 * - STEP/STP: 브라우저(WASM)에서 메쉬 변환 후 견적 (서버 변환 아님)
 */

export const SUPPORTED_MESH_FORMATS = ['STL', 'OBJ', '3MF', 'PLY'] as const
export const SUPPORTED_CAD_FORMATS = ['STEP', 'STP'] as const
export const SUPPORTED_FORMATS = [...SUPPORTED_MESH_FORMATS, ...SUPPORTED_CAD_FORMATS] as const

/** 짧은 목록: "STL, OBJ, 3MF, PLY, STEP, STP" */
export const FILE_FORMATS_LIST = SUPPORTED_FORMATS.join(', ')

/** 메쉬 즉시 견적 안내 */
export const FILE_FORMAT_MESH_LINE =
    'STL, OBJ, 3MF, PLY 파일은 즉시 자동견적을 지원합니다.'

/** CAD 자동 변환 안내 (서버 변환이 아님 — 업로드 시 자동 변환) */
export const FILE_FORMAT_CAD_LINE =
    'STEP, STP 파일은 업로드 시 자동 변환 후 견적을 제공합니다.'

/** 2문장 표준 안내 */
export const FILE_FORMAT_POLICY = `${FILE_FORMAT_MESH_LINE} ${FILE_FORMAT_CAD_LINE}`

/** 히어로/업로드 한 줄 요약 */
export const FILE_FORMAT_HERO_SUMMARY =
    'STL·OBJ·3MF·PLY는 즉시 자동견적, STEP·STP는 업로드 시 자동 변환 후 견적을 제공합니다.'

/** 업로드 UI용 짧은 안내 */
export const FILE_FORMAT_UPLOAD_HINT =
    'STL, OBJ, 3MF, PLY, STEP, STP 파일을 드래그하거나 클릭하여 업로드하세요'

/** 프로세스/FAQ용 납기 (수령 기준 통일) */
export const TURNAROUND_POLICY =
    '주문 확정 후 제작·검수·발송을 진행하며, 일반적으로 평균 3~7일 내 수령 가능합니다. 공정·수량·후가공에 따라 달라질 수 있습니다.'

/** 프로세스 스텝용 짧은 납기 */
export const TURNAROUND_SHORT =
    '검수·후처리 후 포장하여 발송하며, 평균 3~7일 내 수령 가능합니다.'
