/** 사진→AI 3D 진행 중 job ID (새로고침·폴링 복구용) */
export const MESHY_ACTIVE_JOB_LS_KEY = 'wow3d-meshy-active-job'

export function saveMeshyActiveJob(jobId: number): void {
    try {
        localStorage.setItem(MESHY_ACTIVE_JOB_LS_KEY, String(jobId))
    } catch {
        /* ignore */
    }
}

export function clearMeshyActiveJob(): void {
    try {
        localStorage.removeItem(MESHY_ACTIVE_JOB_LS_KEY)
    } catch {
        /* ignore */
    }
}

export function readMeshyActiveJobId(): number | null {
    try {
        const v = localStorage.getItem(MESHY_ACTIVE_JOB_LS_KEY)
        const n = Number(v)
        return Number.isInteger(n) && n > 0 ? n : null
    } catch {
        return null
    }
}
