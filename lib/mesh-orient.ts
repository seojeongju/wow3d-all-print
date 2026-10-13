/**
 * 메쉬 면 방향(감김 순서) 자동 정렬 — 부피·서포트 계산이 일부 뒤집힌 면 때문에 틀어지지 않도록 해석 직후 1회 적용
 * 1) 같은 좌표 정점을 용접하고, 두 면이 공유하는 모서리를 따라 이웃 면의 방향을 맞춤
 * 2) 덩어리마다 다수 방향을 기준으로 삼고, 다른 덩어리 안에 들어 있지 않은 덩어리는 바깥(부피 +)을 향하게 함
 *    (속을 비운 모델의 안쪽 껍데기는 일부러 안쪽을 향하므로 뒤집지 않음)
 */
import type * as THREE from 'three'

export const MESH_ORIENT_MAX_TRIANGLES = 1_000_000
export const MESH_ORIENT_USERDATA_KEY = 'orientFlippedTriangles'

/** 좌표 정수화 범위(축당 2^17) — 용접 허용 오차 = 최대 변 길이 / 2^17 */
const AXIS_SPAN = 131_072
/** 덩어리 포함 판정에 쓰는 상위 덩어리 수 (덩어리가 아주 많은 파일의 비용 제한) */
const CONTAINER_CANDIDATES = 50

export type MeshOrientResult = {
    triangles: number
    /** 방향을 뒤집은 삼각형 수 */
    flipped: number
    /** 너무 커서 정렬을 생략함 */
    skipped: boolean
}

type Shell = {
    start: number
    size: number
    volume: number
    min: [number, number, number]
    max: [number, number, number]
}

function containsBox(outer: Shell, inner: Shell, tol: number): boolean {
    for (let k = 0; k < 3; k++) {
        if (inner.min[k] < outer.min[k] - tol || inner.max[k] > outer.max[k] + tol) return false
    }
    return true
}

export function orientMeshConsistently(
    geometry: THREE.BufferGeometry,
    opts: { maxTriangles?: number } = {}
): MeshOrientResult {
    const pos = geometry.getAttribute('position')
    if (!pos) return { triangles: 0, flipped: 0, skipped: false }
    const index = geometry.getIndex()
    const triangles = Math.floor((index ? index.count : pos.count) / 3)
    if (triangles === 0) return { triangles, flipped: 0, skipped: false }
    if (triangles > (opts.maxTriangles ?? MESH_ORIENT_MAX_TRIANGLES)) return { triangles, flipped: 0, skipped: true }

    const idx = index ? index.array : null
    const corner = (i: number) => (idx ? idx[i] : i)
    // 일반 xyz 배열이면 그대로, 아니면(인터리브·정규화) 한 번 복사해 연속 배열로 읽음
    const plain =
        !(pos as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute && pos.itemSize === 3 && !pos.normalized
    let xyz: ArrayLike<number>
    if (plain) {
        xyz = pos.array
    } else {
        const copy = new Float64Array(pos.count * 3)
        for (let i = 0; i < pos.count; i++) {
            copy[i * 3] = pos.getX(i)
            copy[i * 3 + 1] = pos.getY(i)
            copy[i * 3 + 2] = pos.getZ(i)
        }
        xyz = copy
    }

    // 1) 정점 용접
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    for (let i = 0; i < pos.count; i++) {
        const x = xyz[i * 3], y = xyz[i * 3 + 1], z = xyz[i * 3 + 2]
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (z < minZ) minZ = z
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
        if (z > maxZ) maxZ = z
    }
    const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ)
    if (!Number.isFinite(extent) || extent <= 0) return { triangles, flipped: 0, skipped: false }
    const inv = (AXIS_SPAN - 2) / extent
    const eps = 1 / inv
    const q = new Int32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
        q[i * 3] = Math.round((xyz[i * 3] - minX) * inv)
        q[i * 3 + 1] = Math.round((xyz[i * 3 + 1] - minY) * inv)
        q[i * 3 + 2] = Math.round((xyz[i * 3 + 2] - minZ) * inv)
    }
    // 개방 주소 해시(선형 탐사) — 칸에는 대표 정점 번호를 저장
    let cap = 1
    while (cap < pos.count * 2) cap <<= 1
    const mask = cap - 1
    const slot = new Int32Array(cap).fill(-1)
    const weld = new Int32Array(pos.count)
    let vertexCount = 0
    for (let i = 0; i < pos.count; i++) {
        const x = q[i * 3], y = q[i * 3 + 1], z = q[i * 3 + 2]
        let h = Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca77) ^ Math.imul(z, 0xc2b2ae3d)
        h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
        h = (h ^ (h >>> 12)) & mask
        for (;;) {
            const r = slot[h]
            if (r < 0) {
                slot[h] = i
                weld[i] = vertexCount++
                break
            }
            if (q[r * 3] === x && q[r * 3 + 1] === y && q[r * 3 + 2] === z) {
                weld[i] = weld[r]
                break
            }
            h = (h + 1) & mask
        }
    }

    const tv = new Int32Array(triangles * 3)
    const valid = new Uint8Array(triangles)
    for (let t = 0; t < triangles; t++) {
        const a = weld[corner(t * 3)], b = weld[corner(t * 3 + 1)], c = weld[corner(t * 3 + 2)]
        tv[t * 3] = a
        tv[t * 3 + 1] = b
        tv[t * 3 + 2] = c
        if (a !== b && b !== c && a !== c) valid[t] = 1
    }

    // 2) 정점 → 삼각형 인접 목록 (모서리 u-v의 이웃 면은 u에 붙은 면 중 v도 가진 면)
    const adjStart = new Int32Array(vertexCount + 1)
    for (let t = 0; t < triangles; t++) {
        if (!valid[t]) continue
        for (let k = 0; k < 3; k++) adjStart[tv[t * 3 + k] + 1]++
    }
    for (let v = 0; v < vertexCount; v++) adjStart[v + 1] += adjStart[v]
    const adjFill = adjStart.slice(0, vertexCount)
    const adj = new Int32Array(adjStart[vertexCount])
    for (let t = 0; t < triangles; t++) {
        if (!valid[t]) continue
        for (let k = 0; k < 3; k++) adj[adjFill[tv[t * 3 + k]]++] = t
    }

    /** 모서리 u→v를 공유하는 유일한 이웃 면 (없거나 셋 이상이 공유하면 -1) */
    const soleNeighbor = (t: number, u: number, v: number): number => {
        let found = -1
        for (let i = adjStart[u]; i < adjStart[u + 1]; i++) {
            const o = adj[i]
            if (o === t) continue
            if (tv[o * 3] === v || tv[o * 3 + 1] === v || tv[o * 3 + 2] === v) {
                if (found >= 0) return -1
                found = o
            }
        }
        return found
    }

    // 3) 덩어리별 너비 우선 탐색으로 방향 전파
    const flip = new Uint8Array(triangles)
    const visited = new Uint8Array(triangles)
    const order = new Int32Array(triangles)
    const shells: Shell[] = []
    const p = new Float64Array(9)
    let orderLen = 0
    for (let seed = 0; seed < triangles; seed++) {
        if (!valid[seed] || visited[seed]) continue
        const start = orderLen
        visited[seed] = 1
        order[orderLen++] = seed
        for (let head = start; head < orderLen; head++) {
            const t = order[head]
            for (let k = 0; k < 3; k++) {
                const u = tv[t * 3 + k]
                const v = tv[t * 3 + ((k + 1) % 3)]
                const o = soleNeighbor(t, u, v)
                if (o < 0 || visited[o]) continue
                // 이웃 면은 같은 모서리를 반대 방향(v→u)으로 지나야 일관됨
                const sameDir =
                    (tv[o * 3] === u && tv[o * 3 + 1] === v) ||
                    (tv[o * 3 + 1] === u && tv[o * 3 + 2] === v) ||
                    (tv[o * 3 + 2] === u && tv[o * 3] === v)
                flip[o] = sameDir ? flip[t] ^ 1 : flip[t]
                visited[o] = 1
                order[orderLen++] = o
            }
        }

        const shell: Shell = {
            start,
            size: orderLen - start,
            volume: 0,
            min: [Infinity, Infinity, Infinity],
            max: [-Infinity, -Infinity, -Infinity],
        }
        let flips = 0
        for (let i = start; i < orderLen; i++) {
            const t = order[i]
            flips += flip[t]
            for (let k = 0; k < 3; k++) {
                const ci = corner(t * 3 + k) * 3
                const x = xyz[ci], y = xyz[ci + 1], z = xyz[ci + 2]
                p[k * 3] = x
                p[k * 3 + 1] = y
                p[k * 3 + 2] = z
                if (x < shell.min[0]) shell.min[0] = x
                if (y < shell.min[1]) shell.min[1] = y
                if (z < shell.min[2]) shell.min[2] = z
                if (x > shell.max[0]) shell.max[0] = x
                if (y > shell.max[1]) shell.max[1] = y
                if (z > shell.max[2]) shell.max[2] = z
            }
            const v = (p[0] * (p[4] * p[8] - p[5] * p[7]) - p[1] * (p[3] * p[8] - p[5] * p[6]) + p[2] * (p[3] * p[7] - p[4] * p[6])) / 6
            shell.volume += flip[t] ? -v : v
        }
        // 탐색 시작 면이 뒤집힌 면이었을 수 있으므로 다수 방향을 원래 의도로 봄
        if (flips * 2 > shell.size) {
            for (let i = start; i < orderLen; i++) flip[order[i]] ^= 1
            shell.volume = -shell.volume
        }
        shells.push(shell)
    }

    // 4) 다른 덩어리 안에 있지 않은 덩어리는 바깥을 향하게
    const tol = eps * 4
    const containers = [...shells].sort((a, b) => Math.abs(b.volume) - Math.abs(a.volume)).slice(0, CONTAINER_CANDIDATES)
    for (const shell of shells) {
        if (shell.volume >= 0) continue
        const inside = containers.some(
            (c) => c !== shell && Math.abs(c.volume) > Math.abs(shell.volume) && containsBox(c, shell, tol)
        )
        if (inside) continue
        for (let i = shell.start; i < shell.start + shell.size; i++) flip[order[i]] ^= 1
    }

    // 5) 적용 — 인덱스가 있으면 인덱스만, 없으면 모든 정점 속성의 2·3번째 꼭짓점을 맞바꿈
    let flipped = 0
    for (let t = 0; t < triangles; t++) if (flip[t]) flipped++
    if (flipped === 0) return { triangles, flipped, skipped: false }

    if (index) {
        const arr = index.array as Uint32Array | Uint16Array
        for (let t = 0; t < triangles; t++) {
            if (!flip[t]) continue
            const tmp = arr[t * 3 + 1]
            arr[t * 3 + 1] = arr[t * 3 + 2]
            arr[t * 3 + 2] = tmp
        }
        index.needsUpdate = true
    } else {
        for (const attr of Object.values(geometry.attributes)) {
            if ((attr as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute) continue
            const arr = attr.array as Float32Array
            const s = attr.itemSize
            for (let t = 0; t < triangles; t++) {
                if (!flip[t]) continue
                const b = (t * 3 + 1) * s
                const c = (t * 3 + 2) * s
                for (let k = 0; k < s; k++) {
                    const tmp = arr[b + k]
                    arr[b + k] = arr[c + k]
                    arr[c + k] = tmp
                }
            }
            attr.needsUpdate = true
        }
    }
    return { triangles, flipped, skipped: false }
}
