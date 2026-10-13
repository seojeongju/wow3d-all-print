/**
 * 브라우저 STL 자동 리페어 (무료 STL 점검기용) — 슬라이서 자동 리페어(admesh)와 같은 계열의 위상 보정
 * 1) 정점 용접  2) 면적 0 삼각형 제거  3) 미세한 틈 이어붙이기(열린 경계 정점끼리만 병합)  4) 중복 삼각형 제거
 * 5) 다른 면들 안쪽에 갇힌 내부 면 제거(비다양체 정리)  6) 작은 부스러기 조각 제거(선택)  7) 구멍 메우기  8) 면 방향 통일
 * 서로 파고든 면(자기 교차)은 형상을 다시 계산해야 하므로 다루지 않는다.
 */
import * as THREE from 'three'
import { orientMeshConsistently } from '@/lib/mesh-orient'

export const MESH_REPAIR_MAX_TRIANGLES = 2_000_000

/** 좌표 정수화 범위(축당 2^17) — 용접 허용 오차 = 최대 변 길이 / 2^17 */
const AXIS_SPAN = 131_072
/** 틈 이어붙이기 허용 거리 = 최대 변 길이 × 이 값 (100mm 모델 기준 0.01mm) */
const STITCH_RATIO = 1e-4
/** 이보다 긴 구멍 경계는 메우지 않음 (바닥이 통째로 뚫린 스캔 등은 의도와 다를 수 있음) */
const HOLE_MAX_EDGES = 20_000
/** 귀 자르기 삼각분할 상한 — 넘으면 중심점 부채꼴로 메움 */
const EAR_CLIP_MAX_EDGES = 2_000
const INTERNAL_CANDIDATES_MAX = 200
/** 내부 면 판정(감김 수) 계산량 상한: 후보 수 × 2 × 삼각형 수 */
const WINDING_BUDGET = 60_000_000
/** 부스러기 조각: 대각선이 모델의 0.5% 미만이고 삼각형 수도 적은 덩어리 */
const FRAGMENT_DIAG_RATIO = 0.005
const FRAGMENT_TRI_RATIO = 0.01
const FRAGMENT_TRI_MIN = 100

export type MeshRepairOptions = {
    /** 작은 부스러기 조각 제거 */
    removeFragments?: boolean
}

export type MeshRepairReport = {
    trianglesBefore: number
    trianglesAfter: number
    /** 면적이 0이라 지운 삼각형 */
    degenerateRemoved: number
    /** 같은 꼭짓점을 쓰는 중복 삼각형 */
    duplicateRemoved: number
    /** 틈을 잇느라 합친 정점 */
    stitchedVertices: number
    /** 모델 안쪽에 갇혀 비다양체를 만들던 내부 면 */
    internalFacesRemoved: number
    fragmentsRemoved: number
    fragmentTrianglesRemoved: number
    holesFilled: number
    holeTrianglesAdded: number
    /** 너무 크거나 경계가 꼬여 메우지 못한 구멍 */
    holesSkipped: number
    /** 방향을 바로잡은 삼각형 */
    flippedFixed: number
}

export type MeshRepairOutcome =
    | { status: 'ok'; positions: Float32Array; report: MeshRepairReport }
    | { status: 'too_large'; triangles: number }
    | { status: 'empty' }

export function meshRepairChanged(r: MeshRepairReport): boolean {
    return (
        r.degenerateRemoved +
            r.duplicateRemoved +
            r.stitchedVertices +
            r.internalFacesRemoved +
            r.fragmentsRemoved +
            r.holesFilled +
            r.flippedFixed >
        0
    )
}

type Mesh = {
    /** 정점 좌표 (용접 후 대표 좌표 + 구멍 메우기로 추가된 중심점) */
    xyz: number[]
    tri: Int32Array
    alive: Uint8Array
    nt: number
    eps: number
    extent: number
}

type Adjacency = { start: Int32Array; faces: Int32Array }

function buildAdjacency(m: Mesh): Adjacency {
    const nv = m.xyz.length / 3
    const start = new Int32Array(nv + 1)
    for (let t = 0; t < m.nt; t++) {
        if (!m.alive[t]) continue
        for (let k = 0; k < 3; k++) start[m.tri[t * 3 + k] + 1]++
    }
    for (let v = 0; v < nv; v++) start[v + 1] += start[v]
    const fill = start.slice(0, nv)
    const faces = new Int32Array(start[nv])
    for (let t = 0; t < m.nt; t++) {
        if (!m.alive[t]) continue
        for (let k = 0; k < 3; k++) faces[fill[m.tri[t * 3 + k]]++] = t
    }
    return { start, faces }
}

function hasVertex(m: Mesh, t: number, v: number): boolean {
    return m.tri[t * 3] === v || m.tri[t * 3 + 1] === v || m.tri[t * 3 + 2] === v
}

/** 모서리 u-v를 공유하는 살아 있는 면 수 */
function edgeCount(m: Mesh, adj: Adjacency, u: number, v: number): number {
    let n = 0
    for (let i = adj.start[u]; i < adj.start[u + 1]; i++) if (hasVertex(m, adj.faces[i], v)) n++
    return n
}

function isDegenerate(m: Mesh, t: number): boolean {
    const a = m.tri[t * 3], b = m.tri[t * 3 + 1], c = m.tri[t * 3 + 2]
    if (a === b || b === c || a === c) return true
    const x = m.xyz
    const abx = x[b * 3] - x[a * 3], aby = x[b * 3 + 1] - x[a * 3 + 1], abz = x[b * 3 + 2] - x[a * 3 + 2]
    const acx = x[c * 3] - x[a * 3], acy = x[c * 3 + 1] - x[a * 3 + 1], acz = x[c * 3 + 2] - x[a * 3 + 2]
    const cx = aby * acz - abz * acy
    const cy = abz * acx - abx * acz
    const cz = abx * acy - aby * acx
    const area2Eps = m.eps * m.eps
    return cx * cx + cy * cy + cz * cz <= area2Eps * area2Eps
}

function removeDegenerate(m: Mesh): number {
    let removed = 0
    for (let t = 0; t < m.nt; t++) {
        if (m.alive[t] && isDegenerate(m, t)) {
            m.alive[t] = 0
            removed++
        }
    }
    return removed
}

/** 1) 정점 용접 — 모델 크기에 비례한 격자로 좌표를 정수화해 같은 칸이면 같은 정점 */
function weldInput(position: ArrayLike<number>, index: ArrayLike<number> | null): Mesh | null {
    const count = Math.floor(position.length / 3)
    const nt = Math.floor((index ? index.length : count) / 3)
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    for (let i = 0; i < count; i++) {
        const x = position[i * 3], y = position[i * 3 + 1], z = position[i * 3 + 2]
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (z < minZ) minZ = z
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
        if (z > maxZ) maxZ = z
    }
    const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ)
    if (nt === 0 || !Number.isFinite(extent) || extent <= 0) return null
    const inv = (AXIS_SPAN - 2) / extent
    let cap = 1
    while (cap < count * 2) cap <<= 1
    const mask = cap - 1
    const slot = new Int32Array(cap).fill(-1)
    const q = new Int32Array(count * 3)
    const weld = new Int32Array(count)
    const xyz: number[] = []
    for (let i = 0; i < count; i++) {
        const x = Math.round((position[i * 3] - minX) * inv)
        const y = Math.round((position[i * 3 + 1] - minY) * inv)
        const z = Math.round((position[i * 3 + 2] - minZ) * inv)
        q[i * 3] = x
        q[i * 3 + 1] = y
        q[i * 3 + 2] = z
        let h = Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca77) ^ Math.imul(z, 0xc2b2ae3d)
        h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
        h = (h ^ (h >>> 12)) & mask
        for (;;) {
            const r = slot[h]
            if (r < 0) {
                slot[h] = i
                weld[i] = xyz.length / 3
                xyz.push(position[i * 3], position[i * 3 + 1], position[i * 3 + 2])
                break
            }
            if (q[r * 3] === x && q[r * 3 + 1] === y && q[r * 3 + 2] === z) {
                weld[i] = weld[r]
                break
            }
            h = (h + 1) & mask
        }
    }
    const tri = new Int32Array(nt * 3)
    for (let i = 0; i < nt * 3; i++) tri[i] = weld[index ? index[i] : i]
    return { xyz, tri, alive: new Uint8Array(nt).fill(1), nt, eps: 1 / inv, extent }
}

/** 열린 모서리(한 면에만 속한 모서리)를 가진 면의 (면, 꼭짓점 순번) 목록 */
function openHalfEdges(m: Mesh, adj: Adjacency): Array<[number, number]> {
    const out: Array<[number, number]> = []
    for (let t = 0; t < m.nt; t++) {
        if (!m.alive[t]) continue
        for (let k = 0; k < 3; k++) {
            const u = m.tri[t * 3 + k]
            const v = m.tri[t * 3 + ((k + 1) % 3)]
            if (edgeCount(m, adj, u, v) === 1) out.push([t, k])
        }
    }
    return out
}

/** 3) 미세한 틈 이어붙이기 — 열린 경계 위 정점끼리 허용 거리 안이면 하나로 합침 */
function stitchGaps(m: Mesh): number {
    const adj = buildAdjacency(m)
    const open = openHalfEdges(m, adj)
    if (open.length === 0) return 0
    const tol = m.extent * STITCH_RATIO
    const nv = m.xyz.length / 3
    const isBoundary = new Uint8Array(nv)
    for (const [t, k] of open) {
        isBoundary[m.tri[t * 3 + k]] = 1
        isBoundary[m.tri[t * 3 + ((k + 1) % 3)]] = 1
    }
    const target = new Int32Array(nv)
    for (let v = 0; v < nv; v++) target[v] = v
    const grid = new Map<string, number[]>()
    const x = m.xyz
    let merged = 0
    for (let v = 0; v < nv; v++) {
        if (!isBoundary[v]) continue
        const cx = Math.floor(x[v * 3] / tol), cy = Math.floor(x[v * 3 + 1] / tol), cz = Math.floor(x[v * 3 + 2] / tol)
        let into = -1
        search: for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const cell = grid.get(`${cx + dx},${cy + dy},${cz + dz}`)
                    if (!cell) continue
                    for (const w of cell) {
                        const ddx = x[w * 3] - x[v * 3], ddy = x[w * 3 + 1] - x[v * 3 + 1], ddz = x[w * 3 + 2] - x[v * 3 + 2]
                        if (ddx * ddx + ddy * ddy + ddz * ddz <= tol * tol) {
                            into = w
                            break search
                        }
                    }
                }
            }
        }
        if (into >= 0) {
            target[v] = into
            merged++
            continue
        }
        const key = `${cx},${cy},${cz}`
        const cell = grid.get(key)
        if (cell) cell.push(v)
        else grid.set(key, [v])
    }
    if (merged === 0) return 0
    for (let i = 0; i < m.nt * 3; i++) m.tri[i] = target[m.tri[i]]
    return merged
}

/**
 * 4) 같은 세 꼭짓점을 같은 방향으로 쓰는 삼각형은 하나만 남김.
 *    방향이 반대인 겹친 면은 두께 0인 판(양면)일 수 있으므로 내부 면 판정에 맡김
 */
function removeDuplicates(m: Mesh): number {
    const adj = buildAdjacency(m)
    let removed = 0
    for (let t = 0; t < m.nt; t++) {
        if (!m.alive[t]) continue
        const a = m.tri[t * 3], b = m.tri[t * 3 + 1], c = m.tri[t * 3 + 2]
        for (let i = adj.start[a]; i < adj.start[a + 1]; i++) {
            const o = adj.faces[i]
            if (o >= t || !m.alive[o]) continue
            const k = m.tri[o * 3] === a ? 0 : m.tri[o * 3 + 1] === a ? 1 : 2
            if (m.tri[o * 3 + ((k + 1) % 3)] === b && m.tri[o * 3 + ((k + 2) % 3)] === c) {
                m.alive[t] = 0
                removed++
                break
            }
        }
    }
    return removed
}

/** 점 p에서 본 살아 있는 면 전체의 감김 수 (닫힌 모델 안쪽이면 약 ±1, 바깥이면 0) */
function windingNumber(m: Mesh, px: number, py: number, pz: number, skip: (t: number) => boolean): number {
    const x = m.xyz
    let sum = 0
    for (let t = 0; t < m.nt; t++) {
        if (!m.alive[t] || skip(t)) continue
        const ia = m.tri[t * 3] * 3, ib = m.tri[t * 3 + 1] * 3, ic = m.tri[t * 3 + 2] * 3
        const ax = x[ia] - px, ay = x[ia + 1] - py, az = x[ia + 2] - pz
        const bx = x[ib] - px, by = x[ib + 1] - py, bz = x[ib + 2] - pz
        const cx = x[ic] - px, cy = x[ic + 1] - py, cz = x[ic + 2] - pz
        const la = Math.hypot(ax, ay, az), lb = Math.hypot(bx, by, bz), lc = Math.hypot(cx, cy, cz)
        const det = ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)
        const div = la * lb * lc + (ax * bx + ay * by + az * bz) * lc + (bx * cx + by * cy + bz * cz) * la + (cx * ax + cy * ay + cz * az) * lb
        sum += 2 * Math.atan2(det, div)
    }
    return sum / (4 * Math.PI)
}

/**
 * 5) 비다양체 정리 — 세 면 이상이 만나는 모서리로 둘러싸인 면 묶음 중
 *    양쪽 면 모두 나머지 형상의 안쪽에 있는 묶음(칸막이처럼 갇힌 내부 면)을 지움.
 *    모서리만 맞닿은 두 덩어리처럼 바깥에 드러난 면은 건드리지 않음
 */
function removeInternalPatches(m: Mesh): number {
    const adj = buildAdjacency(m)
    const nonManifold = new Uint8Array(m.nt)
    let any = false
    for (let t = 0; t < m.nt; t++) {
        if (!m.alive[t]) continue
        for (let k = 0; k < 3; k++) {
            if (edgeCount(m, adj, m.tri[t * 3 + k], m.tri[t * 3 + ((k + 1) % 3)]) > 2) {
                nonManifold[t] = 1
                any = true
            }
        }
    }
    if (!any) return 0

    // 두 면만 공유하는 모서리로 이어진 면 묶음
    const patch = new Int32Array(m.nt).fill(-1)
    const patchFaces: number[][] = []
    let aliveCount = 0
    for (let seed = 0; seed < m.nt; seed++) {
        if (!m.alive[seed]) continue
        aliveCount++
        if (patch[seed] >= 0) continue
        const id = patchFaces.length
        const faces = [seed]
        patch[seed] = id
        for (let head = 0; head < faces.length; head++) {
            const t = faces[head]
            for (let k = 0; k < 3; k++) {
                const u = m.tri[t * 3 + k]
                const v = m.tri[t * 3 + ((k + 1) % 3)]
                if (edgeCount(m, adj, u, v) !== 2) continue
                for (let i = adj.start[u]; i < adj.start[u + 1]; i++) {
                    const o = adj.faces[i]
                    if (o !== t && patch[o] < 0 && hasVertex(m, o, v)) {
                        patch[o] = id
                        faces.push(o)
                    }
                }
            }
        }
        patchFaces.push(faces)
    }

    const candidates = patchFaces
        .map((faces, id) => ({ id, faces }))
        .filter((p) => p.faces.length * 2 <= aliveCount && p.faces.some((t) => nonManifold[t]))
        .sort((a, b) => a.faces.length - b.faces.length)
    const limit = Math.min(INTERNAL_CANDIDATES_MAX, Math.floor(WINDING_BUDGET / Math.max(1, 2 * aliveCount)))

    const x = m.xyz
    const delta = Math.max(m.extent * 1e-4, m.eps * 10)
    let removed = 0
    for (const p of candidates.slice(0, limit)) {
        // 가장 넓은 면의 중심에서 법선 양쪽으로 조금 떨어진 두 점
        let best = -1
        let bestArea = 0
        let nx = 0, ny = 0, nz = 0
        for (const t of p.faces) {
            if (!m.alive[t]) continue
            const ia = m.tri[t * 3] * 3, ib = m.tri[t * 3 + 1] * 3, ic = m.tri[t * 3 + 2] * 3
            const abx = x[ib] - x[ia], aby = x[ib + 1] - x[ia + 1], abz = x[ib + 2] - x[ia + 2]
            const acx = x[ic] - x[ia], acy = x[ic + 1] - x[ia + 1], acz = x[ic + 2] - x[ia + 2]
            const cx = aby * acz - abz * acy, cy = abz * acx - abx * acz, cz = abx * acy - aby * acx
            const area = Math.hypot(cx, cy, cz)
            if (area > bestArea) {
                bestArea = area
                best = t
                nx = cx / area
                ny = cy / area
                nz = cz / area
            }
        }
        if (best < 0) continue
        const ia = m.tri[best * 3] * 3, ib = m.tri[best * 3 + 1] * 3, ic = m.tri[best * 3 + 2] * 3
        const ox = (x[ia] + x[ib] + x[ic]) / 3, oy = (x[ia + 1] + x[ib + 1] + x[ic + 1]) / 3, oz = (x[ia + 2] + x[ib + 2] + x[ic + 2]) / 3
        const skip = (t: number) => patch[t] === p.id
        const front = windingNumber(m, ox + nx * delta, oy + ny * delta, oz + nz * delta, skip)
        if (Math.abs(front) < 0.5) continue
        const back = windingNumber(m, ox - nx * delta, oy - ny * delta, oz - nz * delta, skip)
        if (Math.abs(back) < 0.5) continue
        for (const t of p.faces) {
            if (m.alive[t]) {
                m.alive[t] = 0
                removed++
            }
        }
    }
    return removed
}

/** 6) 작은 부스러기 조각 제거 — 본체 외에 아주 작은 덩어리만 */
function removeFragments(m: Mesh): { shells: number; triangles: number } {
    const nv = m.xyz.length / 3
    const parent = new Int32Array(nv)
    for (let i = 0; i < nv; i++) parent[i] = i
    const find = (i: number): number => {
        while (parent[i] !== i) {
            parent[i] = parent[parent[i]]
            i = parent[i]
        }
        return i
    }
    let aliveCount = 0
    for (let t = 0; t < m.nt; t++) {
        if (!m.alive[t]) continue
        aliveCount++
        const a = find(m.tri[t * 3]), b = find(m.tri[t * 3 + 1]), c = find(m.tri[t * 3 + 2])
        parent[a] = c
        parent[b] = c
    }
    type Shell = { tris: number; min: [number, number, number]; max: [number, number, number] }
    const shells = new Map<number, Shell>()
    const x = m.xyz
    for (let t = 0; t < m.nt; t++) {
        if (!m.alive[t]) continue
        const root = find(m.tri[t * 3])
        let s = shells.get(root)
        if (!s) {
            s = { tris: 0, min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
            shells.set(root, s)
        }
        s.tris++
        for (let k = 0; k < 3; k++) {
            const i = m.tri[t * 3 + k] * 3
            for (let d = 0; d < 3; d++) {
                if (x[i + d] < s.min[d]) s.min[d] = x[i + d]
                if (x[i + d] > s.max[d]) s.max[d] = x[i + d]
            }
        }
    }
    if (shells.size <= 1) return { shells: 0, triangles: 0 }
    const maxDiag = m.extent * Math.sqrt(3)
    const small = new Set<number>()
    for (const [root, s] of shells) {
        const diag = Math.hypot(s.max[0] - s.min[0], s.max[1] - s.min[1], s.max[2] - s.min[2])
        if (diag < maxDiag * FRAGMENT_DIAG_RATIO && s.tris <= Math.max(aliveCount * FRAGMENT_TRI_RATIO, FRAGMENT_TRI_MIN)) {
            small.add(root)
        }
    }
    if (small.size === 0 || small.size === shells.size) return { shells: 0, triangles: 0 }
    let triangles = 0
    for (let t = 0; t < m.nt; t++) {
        if (m.alive[t] && small.has(find(m.tri[t * 3]))) {
            m.alive[t] = 0
            triangles++
        }
    }
    return { shells: small.size, triangles }
}

/** 면 방향 통일 — 구멍 경계를 따라가려면 경계 면들의 감김 방향이 맞아야 하므로 메우기 전에도 실행 */
function orientInPlace(m: Mesh): number {
    const faces: number[] = []
    for (let t = 0; t < m.nt; t++) if (m.alive[t]) faces.push(t)
    if (faces.length === 0) return 0
    const index = new Uint32Array(faces.length * 3)
    faces.forEach((t, i) => {
        index[i * 3] = m.tri[t * 3]
        index[i * 3 + 1] = m.tri[t * 3 + 1]
        index[i * 3 + 2] = m.tri[t * 3 + 2]
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(m.xyz), 3))
    geo.setIndex(new THREE.BufferAttribute(index, 1))
    const { flipped } = orientMeshConsistently(geo, { maxTriangles: MESH_REPAIR_MAX_TRIANGLES })
    geo.dispose()
    if (flipped > 0) {
        faces.forEach((t, i) => {
            m.tri[t * 3] = index[i * 3]
            m.tri[t * 3 + 1] = index[i * 3 + 1]
            m.tri[t * 3 + 2] = index[i * 3 + 2]
        })
    }
    return flipped
}

/** 구멍 경계(꼭짓점 순서 = 새 면의 감김 방향)를 삼각형으로 채움 */
function triangulateLoop(m: Mesh, loop: number[], out: number[]): void {
    const x = m.xyz
    const n = loop.length
    if (n === 3) {
        out.push(loop[0], loop[1], loop[2])
        return
    }
    // 뉴웰 법선
    let nx = 0, ny = 0, nz = 0
    for (let i = 0; i < n; i++) {
        const a = loop[i] * 3, b = loop[(i + 1) % n] * 3
        nx += (x[a + 1] - x[b + 1]) * (x[a + 2] + x[b + 2])
        ny += (x[a + 2] - x[b + 2]) * (x[a] + x[b])
        nz += (x[a] - x[b]) * (x[a + 1] + x[b + 1])
    }
    const len = Math.hypot(nx, ny, nz)
    const fan = (poly: number[]) => {
        let sx = 0, sy = 0, sz = 0
        for (const v of poly) {
            sx += x[v * 3]
            sy += x[v * 3 + 1]
            sz += x[v * 3 + 2]
        }
        const c = x.length / 3
        x.push(sx / poly.length, sy / poly.length, sz / poly.length)
        for (let i = 0; i < poly.length; i++) out.push(poly[i], poly[(i + 1) % poly.length], c)
    }
    if (len <= 0 || n > EAR_CLIP_MAX_EDGES) {
        fan(loop)
        return
    }
    nx /= len
    ny /= len
    nz /= len
    // 법선에 수직인 평면 좌표계 (u, w, n이 오른손 좌표계 → 경계 순서가 반시계)
    let ux = 0, uy = 0, uz = 0
    if (Math.abs(nx) < 0.9) {
        uy = -nz
        uz = ny
    } else {
        ux = nz
        uz = -nx
    }
    const ul = Math.hypot(ux, uy, uz)
    ux /= ul
    uy /= ul
    uz /= ul
    const wx = ny * uz - nz * uy, wy = nz * ux - nx * uz, wz = nx * uy - ny * ux
    const px = new Float64Array(n), py = new Float64Array(n)
    for (let i = 0; i < n; i++) {
        const v = loop[i] * 3
        px[i] = x[v] * ux + x[v + 1] * uy + x[v + 2] * uz
        py[i] = x[v] * wx + x[v + 1] * wy + x[v + 2] * wz
    }
    const cross = (a: number, b: number, c: number) => (px[b] - px[a]) * (py[c] - py[a]) - (py[b] - py[a]) * (px[c] - px[a])
    const inside = (p: number, a: number, b: number, c: number) =>
        cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0
    const idx: number[] = []
    for (let i = 0; i < n; i++) idx.push(i)
    let guard = 0
    while (idx.length > 3 && guard < n * n) {
        let clipped = false
        for (let i = 0; i < idx.length; i++) {
            guard++
            const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length]
            if (cross(a, b, c) <= 0) continue
            let blocked = false
            for (const p of idx) {
                if (p === a || p === b || p === c) continue
                if (inside(p, a, b, c)) {
                    blocked = true
                    break
                }
            }
            if (blocked) continue
            out.push(loop[a], loop[b], loop[c])
            idx.splice(i, 1)
            clipped = true
            break
        }
        // 평면에 펼치면 꼬이는 경계 — 남은 부분은 중심점 부채꼴로
        if (!clipped) {
            fan(idx.map((i) => loop[i]))
            return
        }
    }
    if (idx.length === 3) out.push(loop[idx[0]], loop[idx[1]], loop[idx[2]])
}

/**
 * 7) 구멍 메우기 — 열린 모서리를 이어 닫힌 경계를 찾고 삼각형으로 채움.
 *    경계는 방향과 무관하게 따라간 뒤, 주변 면 다수와 반대 방향(= 새 면이 이웃과 일관된 방향)으로 맞춤
 */
function fillHoles(m: Mesh): { filled: number; added: number; skipped: number; triangles: number[] } {
    const adj = buildAdjacency(m)
    const open = openHalfEdges(m, adj)
    const result = { filled: 0, added: 0, skipped: 0, triangles: [] as number[] }
    if (open.length === 0) return result
    // 경계 모서리 e: 기존 면이 지나는 방향 faceFrom → faceTo
    const faceFrom = new Int32Array(open.length)
    const faceTo = new Int32Array(open.length)
    const incident = new Map<number, number[]>()
    const link = (v: number, e: number) => {
        const list = incident.get(v)
        if (list) list.push(e)
        else incident.set(v, [e])
    }
    open.forEach(([t, k], e) => {
        faceFrom[e] = m.tri[t * 3 + k]
        faceTo[e] = m.tri[t * 3 + ((k + 1) % 3)]
        link(faceFrom[e], e)
        link(faceTo[e], e)
    })
    const used = new Uint8Array(open.length)
    const nextEdge = (v: number): number => {
        const list = incident.get(v)
        if (!list) return -1
        for (const e of list) if (!used[e]) return e
        return -1
    }
    for (let e0 = 0; e0 < open.length; e0++) {
        if (used[e0]) continue
        used[e0] = 1
        const start = faceTo[e0]
        const loop = [start]
        let cur = faceFrom[e0]
        // 경계를 기존 면과 반대로 지난 횟수 - 같은 방향으로 지난 횟수
        let opposite = 1
        let closed = false
        while (loop.length <= HOLE_MAX_EDGES) {
            if (cur === start) {
                closed = true
                break
            }
            loop.push(cur)
            const e = nextEdge(cur)
            if (e < 0) break
            used[e] = 1
            if (faceFrom[e] === cur) {
                opposite--
                cur = faceTo[e]
            } else {
                opposite++
                cur = faceFrom[e]
            }
        }
        if (!closed || loop.length < 3) {
            result.skipped++
            continue
        }
        if (opposite < 0) loop.reverse()
        const before = result.triangles.length
        triangulateLoop(m, loop, result.triangles)
        result.filled++
        result.added += (result.triangles.length - before) / 3
    }
    return result
}

export function repairMesh(
    position: ArrayLike<number>,
    index: ArrayLike<number> | null,
    options: MeshRepairOptions = {}
): MeshRepairOutcome {
    const trianglesBefore = Math.floor((index ? index.length : position.length / 3) / 3)
    if (trianglesBefore > MESH_REPAIR_MAX_TRIANGLES) return { status: 'too_large', triangles: trianglesBefore }
    const m = weldInput(position, index)
    if (!m) return { status: 'empty' }

    let degenerateRemoved = removeDegenerate(m)
    const stitchedVertices = stitchGaps(m)
    if (stitchedVertices > 0) degenerateRemoved += removeDegenerate(m)
    const duplicateRemoved = removeDuplicates(m)
    const internalFacesRemoved = removeInternalPatches(m)
    const fragments = options.removeFragments ? removeFragments(m) : { shells: 0, triangles: 0 }
    const flippedBeforeFill = orientInPlace(m)
    const holes = fillHoles(m)

    let kept = 0
    for (let t = 0; t < m.nt; t++) if (m.alive[t]) kept++
    const total = kept + holes.triangles.length / 3
    if (total === 0) return { status: 'empty' }
    const positions = new Float32Array(total * 9)
    const x = m.xyz
    let o = 0
    const put = (v: number) => {
        positions[o++] = x[v * 3]
        positions[o++] = x[v * 3 + 1]
        positions[o++] = x[v * 3 + 2]
    }
    for (let t = 0; t < m.nt; t++) {
        if (!m.alive[t]) continue
        put(m.tri[t * 3])
        put(m.tri[t * 3 + 1])
        put(m.tri[t * 3 + 2])
    }
    for (const v of holes.triangles) put(v)

    // 8) 메운 뒤 닫힌 덩어리 기준으로 다시 방향 통일 + 안팎이 뒤집힌 덩어리 바로잡기
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const { flipped } = orientMeshConsistently(geo, { maxTriangles: MESH_REPAIR_MAX_TRIANGLES })
    const out = geo.getAttribute('position').array as Float32Array
    geo.dispose()

    return {
        status: 'ok',
        positions: out,
        report: {
            trianglesBefore,
            trianglesAfter: total,
            degenerateRemoved,
            duplicateRemoved,
            stitchedVertices,
            internalFacesRemoved,
            fragmentsRemoved: fragments.shells,
            fragmentTrianglesRemoved: fragments.triangles,
            holesFilled: holes.filled,
            holeTrianglesAdded: holes.added,
            holesSkipped: holes.skipped,
            flippedFixed: flippedBeforeFill + flipped,
        },
    }
}

/** 리페어 파일 이름 — 관리자가 주문 파일에서 자동 리페어 여부를 알아볼 수 있게 접미사를 붙임 */
export function repairedFileName(name: string): string {
    const base = name.replace(/\.[^.]+$/, '')
    return `${base}_repaired.stl`
}

/** 바이너리 STL의 경계 상자 크기 [x, y, z] */
export function binaryStlSize(stl: ArrayBuffer): [number, number, number] | null {
    if (stl.byteLength < 84) return null
    const view = new DataView(stl)
    const triangles = view.getUint32(80, true)
    if (84 + triangles * 50 > stl.byteLength || triangles === 0) return null
    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]
    for (let t = 0; t < triangles; t++) {
        const o = 84 + t * 50 + 12
        for (let v = 0; v < 3; v++) {
            for (let k = 0; k < 3; k++) {
                const x = view.getFloat32(o + v * 12 + k * 4, true)
                if (x < min[k]) min[k] = x
                if (x > max[k]) max[k] = x
            }
        }
    }
    return [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
}

/** 삼각형 목록(9개 좌표씩) → 바이너리 STL */
export function encodeBinaryStl(positions: Float32Array, header = 'WOW3D repaired STL'): ArrayBuffer {
    const triangles = Math.floor(positions.length / 9)
    const buffer = new ArrayBuffer(84 + triangles * 50)
    const view = new DataView(buffer)
    for (let i = 0; i < Math.min(80, header.length); i++) view.setUint8(i, header.charCodeAt(i) & 0x7f)
    view.setUint32(80, triangles, true)
    let o = 84
    for (let t = 0; t < triangles; t++) {
        const p = t * 9
        const abx = positions[p + 3] - positions[p], aby = positions[p + 4] - positions[p + 1], abz = positions[p + 5] - positions[p + 2]
        const acx = positions[p + 6] - positions[p], acy = positions[p + 7] - positions[p + 1], acz = positions[p + 8] - positions[p + 2]
        let nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx
        const len = Math.hypot(nx, ny, nz)
        if (len > 0) {
            nx /= len
            ny /= len
            nz /= len
        }
        view.setFloat32(o, nx, true)
        view.setFloat32(o + 4, ny, true)
        view.setFloat32(o + 8, nz, true)
        o += 12
        for (let k = 0; k < 9; k++) {
            view.setFloat32(o, positions[p + k], true)
            o += 4
        }
        view.setUint16(o, 0, true)
        o += 2
    }
    return buffer
}
