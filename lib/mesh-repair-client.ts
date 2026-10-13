/**
 * STL 자동 리페어 실행기 — Web Worker에서 리페어하고, Worker를 쓸 수 없으면 메인 스레드에서 실행
 */
import type * as THREE from 'three'
import { encodeBinaryStl, repairMesh, type MeshRepairOptions, type MeshRepairReport } from '@/lib/mesh-repair'

export type MeshRepairJobResult =
    | { status: 'ok'; report: MeshRepairReport; stl: ArrayBuffer }
    | { status: 'too_large'; triangles: number }
    | { status: 'empty' }

export type MeshRepairRequest = {
    id: number
    position: Float32Array
    index: Uint32Array | null
    options: MeshRepairOptions
}

export type MeshRepairResponse =
    | { id: number; type: 'done'; result: MeshRepairJobResult }
    | { id: number; type: 'error'; message: string }

const REPAIR_TIMEOUT_MS = 180_000

/** Worker로 넘길 수 있게 위치·인덱스를 일반 배열로 복사 */
export function readGeometryArrays(geometry: THREE.BufferGeometry): { position: Float32Array; index: Uint32Array | null } {
    const pos = geometry.getAttribute('position')
    let position: Float32Array
    if (pos.array instanceof Float32Array && pos.itemSize === 3 && !('isInterleavedBufferAttribute' in pos)) {
        position = pos.array.slice(0, pos.count * 3)
    } else {
        position = new Float32Array(pos.count * 3)
        for (let i = 0; i < pos.count; i++) {
            position[i * 3] = pos.getX(i)
            position[i * 3 + 1] = pos.getY(i)
            position[i * 3 + 2] = pos.getZ(i)
        }
    }
    const idx = geometry.getIndex()
    const index = idx ? Uint32Array.from(idx.array as ArrayLike<number>) : null
    return { position, index }
}

function repairOnMainThread(req: Omit<MeshRepairRequest, 'id'>): MeshRepairJobResult {
    const outcome = repairMesh(req.position, req.index, req.options)
    if (outcome.status !== 'ok') return outcome
    return { status: 'ok', report: outcome.report, stl: encodeBinaryStl(outcome.positions) }
}

export function runMeshRepair(geometry: THREE.BufferGeometry, options: MeshRepairOptions): Promise<MeshRepairJobResult> {
    const req = readGeometryArrays(geometry)
    if (typeof Worker === 'undefined') return Promise.resolve().then(() => repairOnMainThread({ ...req, options }))

    return new Promise((resolve, reject) => {
        let worker: Worker
        try {
            worker = new Worker(new URL('./workers/mesh-repair.worker.ts', import.meta.url))
        } catch {
            resolve(repairOnMainThread({ ...req, options }))
            return
        }
        const timer = setTimeout(() => {
            worker.terminate()
            reject(new Error('timeout'))
        }, REPAIR_TIMEOUT_MS)
        const finish = () => {
            clearTimeout(timer)
            worker.terminate()
        }
        worker.onmessage = (event: MessageEvent<MeshRepairResponse>) => {
            finish()
            const msg = event.data
            if (msg.type === 'done') resolve(msg.result)
            else reject(new Error(msg.message))
        }
        // 배열은 Worker로 넘기지 않고 복사 전송 — Worker 로드 실패 시 메인 스레드에서 다시 쓰기 위해
        worker.onerror = (event) => {
            event.preventDefault()
            finish()
            try {
                resolve(repairOnMainThread({ ...req, options }))
            } catch (e) {
                reject(e)
            }
        }
        const message: MeshRepairRequest = { id: 1, ...req, options }
        worker.postMessage(message)
    })
}
