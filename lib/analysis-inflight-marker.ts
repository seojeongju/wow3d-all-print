/**
 * 분석 진행 표시(sessionStorage) — 분석 도중 탭이 멈춰 강제 종료·새로고침되면 다음 진입 때 안내하기 위함
 * 정상 종료·실패·취소·페이지 이탈(pagehide) 시 지운다.
 */
const KEY = 'wow3d_model_analysis_inflight'

export type InflightAnalysis = { name: string; size: number; at: number }

let pagehideBound = false

function bindPagehide() {
    if (pagehideBound || typeof window === 'undefined') return
    pagehideBound = true
    window.addEventListener('pagehide', () => clearAnalysisInFlight())
}

export function markAnalysisInFlight(file: { name: string; size: number }): void {
    try {
        bindPagehide()
        sessionStorage.setItem(KEY, JSON.stringify({ name: file.name, size: file.size, at: Date.now() }))
    } catch {
        /* 저장소 차단 시 무시 */
    }
}

export function clearAnalysisInFlight(): void {
    try {
        sessionStorage.removeItem(KEY)
    } catch {
        /* 무시 */
    }
}

/** 이전 방문에서 끝나지 않은 분석 기록을 꺼내고 지운다 (최근 30분 이내만) */
export function takeInterruptedAnalysis(): InflightAnalysis | null {
    try {
        const raw = sessionStorage.getItem(KEY)
        sessionStorage.removeItem(KEY)
        if (!raw) return null
        const v = JSON.parse(raw) as Partial<InflightAnalysis>
        if (typeof v.name !== 'string' || typeof v.size !== 'number' || typeof v.at !== 'number') return null
        if (Date.now() - v.at > 30 * 60 * 1000) return null
        return { name: v.name, size: v.size, at: v.at }
    } catch {
        return null
    }
}
