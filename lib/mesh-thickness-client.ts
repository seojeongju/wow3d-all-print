/**
 * 벽 두께 측정 실행기 — Web Worker에서 측정하고, Worker를 쓸 수 없으면 메인 스레드에서 실행
 */
import type * as THREE from 'three'
import { readGeometryArrays } from '@/lib/mesh-repair-client'
import { measureThickness, type MeshThicknessOutcome } from '@/lib/mesh-thickness'

export type MeshThicknessRequest = {
    id: number
    position: Float32Array
    index: Uint32Array | null
}

export type MeshThicknessResponse =
    | { id: number; type: 'done'; outcome: MeshThicknessOutcome }
    | { id: number; type: 'error'; message: string }

const THICKNESS_TIMEOUT_MS = 120_000

export function runMeshThickness(geometry: THREE.BufferGeometry): Promise<MeshThicknessOutcome> {
    const req = readGeometryArrays(geometry)
    if (typeof Worker === 'undefined') return Promise.resolve().then(() => measureThickness(req.position, req.index))

    return new Promise((resolve, reject) => {
        let worker: Worker
        try {
            worker = new Worker(new URL('./workers/mesh-thickness.worker.ts', import.meta.url))
        } catch {
            resolve(measureThickness(req.position, req.index))
            return
        }
        const timer = setTimeout(() => {
            worker.terminate()
            reject(new Error('timeout'))
        }, THICKNESS_TIMEOUT_MS)
        const finish = () => {
            clearTimeout(timer)
            worker.terminate()
        }
        worker.onmessage = (event: MessageEvent<MeshThicknessResponse>) => {
            finish()
            const msg = event.data
            if (msg.type === 'done') resolve(msg.outcome)
            else reject(new Error(msg.message))
        }
        // 배열은 복사 전송 — Worker 로드 실패 시 메인 스레드에서 다시 쓰기 위해
        worker.onerror = (event) => {
            event.preventDefault()
            finish()
            try {
                resolve(measureThickness(req.position, req.index))
            } catch (e) {
                reject(e)
            }
        }
        const message: MeshThicknessRequest = { id: 1, ...req }
        worker.postMessage(message)
    })
}
