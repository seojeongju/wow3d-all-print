/**
 * STL 자동 리페어 Web Worker — 리페어·STL 변환을 메인 스레드(화면) 밖에서 실행
 */
import { encodeBinaryStl, repairMesh } from '@/lib/mesh-repair'
import type { MeshRepairRequest, MeshRepairResponse } from '@/lib/mesh-repair-client'

const ctx = self as unknown as {
    postMessage: (msg: MeshRepairResponse, transfer?: Transferable[]) => void
    onmessage: ((event: MessageEvent<MeshRepairRequest>) => void) | null
}

ctx.onmessage = (event) => {
    const { id, position, index, options } = event.data
    try {
        const outcome = repairMesh(position, index, options)
        if (outcome.status !== 'ok') {
            ctx.postMessage({ id, type: 'done', result: outcome })
            return
        }
        const stl = encodeBinaryStl(outcome.positions)
        ctx.postMessage({ id, type: 'done', result: { status: 'ok', report: outcome.report, stl } }, [stl])
    } catch (e) {
        ctx.postMessage({ id, type: 'error', message: e instanceof Error ? e.message : String(e) })
    }
}
