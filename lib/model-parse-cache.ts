/**
 * 동일 File 객체에 대한 arrayBuffer·geometry 파싱을 1회만 수행 (대용량 Meshy STL 중복 파싱 방지)
 */
import * as THREE from 'three'
import { parseModelArrayBuffer } from '@/lib/parseModelGeometry'

const bufferCache = new WeakMap<File, Promise<ArrayBuffer>>()
const geometryCache = new WeakMap<File, Promise<THREE.BufferGeometry | null>>()

export function invalidateModelParseCache(file: File | null | undefined): void {
    if (!file) return
    bufferCache.delete(file)
    geometryCache.delete(file)
}

export function getFileArrayBuffer(file: File): Promise<ArrayBuffer> {
    let pending = bufferCache.get(file)
    if (!pending) {
        pending = file.arrayBuffer()
        bufferCache.set(file, pending)
    }
    return pending
}

export async function getParsedModelGeometry(file: File): Promise<THREE.BufferGeometry | null> {
    let pending = geometryCache.get(file)
    if (!pending) {
        pending = (async () => {
            const buf = await getFileArrayBuffer(file)
            return parseModelArrayBuffer(file.name, buf)
        })()
        geometryCache.set(file, pending)
    }
    return pending
}
