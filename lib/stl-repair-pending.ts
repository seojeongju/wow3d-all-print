/**
 * STL 점검기: 리페어 결과를 로그인 다녀오는 동안 브라우저(IndexedDB)에 임시 보관 — 서버로 전송하지 않음
 */
import { createPendingStore } from '@/lib/browser-pending-store'
import type { MeshInspection } from '@/lib/mesh-inspect'
import type { MeshRepairReport } from '@/lib/mesh-repair'

export type PendingRepair = {
    original: File
    repaired: File
    report: MeshRepairReport
    before: MeshInspection
    beforeVolume: number | null
}

const store = createPendingStore<PendingRepair>('wow3d-stl-checker', 'pending-repair', 60 * 60 * 1000)

export const savePendingRepair = (value: PendingRepair) => store.save(value)

export async function takePendingRepair(): Promise<PendingRepair | null> {
    const v = await store.take()
    if (!v || !(v.original instanceof Blob) || !(v.repaired instanceof Blob) || !v.report || !v.before) return null
    return v
}
