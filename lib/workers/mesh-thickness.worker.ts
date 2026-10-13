/**
 * 벽 두께 측정 Web Worker — BVH 구성·광선 교차를 메인 스레드(화면) 밖에서 실행
 */
import { measureThickness } from '@/lib/mesh-thickness'
import type { MeshThicknessRequest, MeshThicknessResponse } from '@/lib/mesh-thickness-client'

const ctx = self as unknown as {
    postMessage: (msg: MeshThicknessResponse, transfer?: Transferable[]) => void
    onmessage: ((event: MessageEvent<MeshThicknessRequest>) => void) | null
}

ctx.onmessage = (event) => {
    const { id, position, index } = event.data
    try {
        const outcome = measureThickness(position, index)
        const transfer = outcome.status === 'ok' ? [outcome.result.points.buffer, outcome.result.thickness.buffer] : []
        ctx.postMessage({ id, type: 'done', outcome }, transfer)
    } catch (e) {
        ctx.postMessage({ id, type: 'error', message: e instanceof Error ? e.message : String(e) })
    }
}
