/**
 * 장비 최대 출력 크기(빌드 볼륨) 판정 — 견적 화면·장바구니·주문 공통
 * - 축 정렬 회전(90° 단위)을 허용: 세 변을 정렬해 장비 치수와 비교
 * - 측정 오차로 경계값(예: 300.0001mm)이 걸리지 않도록 허용 오차 적용
 */

export type BuildDims = { x: number; y: number; z: number }

export type PrintMethodKey = 'fdm' | 'sla' | 'dlp'

const BUILD_TOLERANCE_MM = 0.5

function sortedDesc(d: BuildDims): [number, number, number] {
    const arr = [d.x, d.y, d.z].map((n) => Math.max(0, Number(n) || 0))
    arr.sort((a, b) => b - a)
    return [arr[0], arr[1], arr[2]]
}

/** 회전해서라도 장비에 들어가면 true (장비 치수가 없거나 0이면 판정 불가 → true) */
export function fitsBuildVolume(dims: BuildDims, max: BuildDims | null | undefined): boolean {
    if (!max) return true
    const m = sortedDesc(max)
    if (!(m[2] > 0)) return true
    const d = sortedDesc(dims)
    return d.every((v, i) => v <= m[i] + BUILD_TOLERANCE_MM)
}

export function formatBuildDims(d: BuildDims): string {
    return `${Math.round(d.x)}×${Math.round(d.y)}×${Math.round(d.z)}mm`
}

export function toPrintMethodKey(method: string | null | undefined): PrintMethodKey | null {
    const m = String(method || '').trim().toLowerCase()
    return m === 'fdm' || m === 'sla' || m === 'dlp' ? m : null
}

type D1Like = {
    prepare: (sql: string) => {
        all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>
    }
}

/**
 * 활성 장비의 최대 출력 크기 (방식별). 장비 행이 없으면 해당 방식은 제외 → 검사 생략
 */
export async function loadBuildMaxByMethod(db: D1Like): Promise<Partial<Record<PrintMethodKey, BuildDims>>> {
    const out: Partial<Record<PrintMethodKey, BuildDims>> = {}
    try {
        const { results } = await db
            .prepare('SELECT type, max_x_mm, max_y_mm, max_z_mm FROM printer_equipment WHERE is_active = 1')
            .all<{ type: string; max_x_mm: number; max_y_mm: number; max_z_mm: number }>()
        for (const r of results || []) {
            const key = toPrintMethodKey(r.type)
            if (!key) continue
            out[key] = { x: Number(r.max_x_mm) || 0, y: Number(r.max_y_mm) || 0, z: Number(r.max_z_mm) || 0 }
        }
    } catch (e) {
        console.warn('[build-volume] printer_equipment 조회 실패 — 크기 검사 생략', e)
    }
    return out
}

/** 크기 초과 시 사용자 안내 문구, 들어가면 null */
export function buildVolumeErrorMessage(
    method: string | null | undefined,
    dims: BuildDims,
    maxByMethod: Partial<Record<PrintMethodKey, BuildDims>>,
    label?: string
): string | null {
    const key = toPrintMethodKey(method)
    if (!key) return null
    const max = maxByMethod[key]
    if (!max || fitsBuildVolume(dims, max)) return null
    const who = label ? `${label}: ` : ''
    return `${who}모델 크기(${formatBuildDims(dims)})가 ${key.toUpperCase()} 장비 최대 출력 크기(${formatBuildDims(max)})를 초과해 주문할 수 없습니다. 분할 출력 상담을 문의해 주세요.`
}
