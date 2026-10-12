/**
 * 브라우저에서 메쉬 무결성 점검 (무료 STL 점검기용)
 * - 같은 좌표의 정점을 용접(weld)한 뒤 모서리 공유 횟수로 구멍·비다양체·뒤집힌 면을 판정
 * - 메인 스레드를 오래 막지 않도록 일정 단위마다 양보하고, 너무 큰 메쉬는 점검을 생략
 */
import type * as THREE from 'three'

export const MESH_INSPECT_MAX_TRIANGLES = 3_000_000

const YIELD_EVERY = 60_000

export type MeshInspection = {
    triangles: number
    /** 용접 후 정점 수 */
    vertices: number
    /** 면적이 0인 삼각형 */
    degenerateTriangles: number
    /** 한 면에만 속한 모서리 (구멍 경계) */
    openEdges: number
    /** 열린 모서리로 이어진 구멍 개수 */
    holes: number
    /** 세 면 이상이 공유하는 모서리 */
    nonManifoldEdges: number
    /** 이웃 면과 감김 방향이 어긋난 모서리 */
    flippedEdges: number
    /** 서로 떨어진 덩어리 수 */
    shells: number
    /** 안팎이 뒤집힌 덩어리 수 (부호 부피 < 0) */
    invertedShells: number
}

export type MeshInspectOutcome =
    | { status: 'ok'; result: MeshInspection }
    | { status: 'too_large'; triangles: number }

const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function find(parent: Int32Array, i: number): number {
    while (parent[i] !== i) {
        parent[i] = parent[parent[i]]
        i = parent[i]
    }
    return i
}

function union(parent: Int32Array, a: number, b: number) {
    const ra = find(parent, a)
    const rb = find(parent, b)
    if (ra !== rb) parent[ra] = rb
}

export async function inspectMesh(
    geometry: THREE.BufferGeometry,
    isCancelled: () => boolean = () => false
): Promise<MeshInspectOutcome | null> {
    const pos = geometry.getAttribute('position')
    if (!pos) return null
    const index = geometry.getIndex()
    const cornerCount = index ? index.count : pos.count
    const triangles = Math.floor(cornerCount / 3)
    if (triangles > MESH_INSPECT_MAX_TRIANGLES) return { status: 'too_large', triangles }

    // 1) 정점 용접 — 모델 크기에 비례한 허용 오차로 좌표를 정수화
    geometry.computeBoundingBox()
    const bb = geometry.boundingBox
    const diag = bb ? bb.min.distanceTo(bb.max) : 1
    const eps = Math.max(diag * 1e-6, 1e-6)
    const weldId = new Int32Array(pos.count)
    const keyToId = new Map<string, number>()
    for (let i = 0; i < pos.count; i++) {
        const key = `${Math.round(pos.getX(i) / eps)},${Math.round(pos.getY(i) / eps)},${Math.round(pos.getZ(i) / eps)}`
        let id = keyToId.get(key)
        if (id === undefined) {
            id = keyToId.size
            keyToId.set(key, id)
        }
        weldId[i] = id
        if (i % YIELD_EVERY === 0) {
            await yieldToMain()
            if (isCancelled()) return null
        }
    }
    const vertexCount = keyToId.size
    keyToId.clear()

    const corner = (t: number, k: number) => (index ? index.getX(t * 3 + k) : t * 3 + k)

    // 2) 모서리 집계 — 값 = 공유 횟수 * ORIENT_SPAN + (방향 합 + ORIENT_OFFSET)
    const ORIENT_OFFSET = 1 << 10
    const ORIENT_SPAN = 1 << 11
    const edges = new Map<number, number>()
    const parent = new Int32Array(vertexCount)
    for (let i = 0; i < vertexCount; i++) parent[i] = i
    const validTri = new Uint8Array(triangles)
    let degenerate = 0

    const addEdge = (u: number, v: number) => {
        const lo = u < v ? u : v
        const hi = u < v ? v : u
        const key = lo * vertexCount + hi
        const dir = u < v ? 1 : -1
        const prev = edges.get(key)
        if (prev === undefined) {
            edges.set(key, ORIENT_SPAN + ORIENT_OFFSET + dir)
        } else {
            const count = Math.floor(prev / ORIENT_SPAN)
            const sum = (prev % ORIENT_SPAN) - ORIENT_OFFSET
            const nextSum = Math.max(-ORIENT_OFFSET + 1, Math.min(ORIENT_OFFSET - 1, sum + dir))
            edges.set(key, (count + 1) * ORIENT_SPAN + nextSum + ORIENT_OFFSET)
        }
    }

    const area2Eps = eps * eps
    for (let t = 0; t < triangles; t++) {
        const ia = corner(t, 0)
        const ib = corner(t, 1)
        const ic = corner(t, 2)
        const a = weldId[ia]
        const b = weldId[ib]
        const c = weldId[ic]
        let isDegenerate = a === b || b === c || a === c
        if (!isDegenerate) {
            const abx = pos.getX(ib) - pos.getX(ia)
            const aby = pos.getY(ib) - pos.getY(ia)
            const abz = pos.getZ(ib) - pos.getZ(ia)
            const acx = pos.getX(ic) - pos.getX(ia)
            const acy = pos.getY(ic) - pos.getY(ia)
            const acz = pos.getZ(ic) - pos.getZ(ia)
            const cx = aby * acz - abz * acy
            const cy = abz * acx - abx * acz
            const cz = abx * acy - aby * acx
            isDegenerate = cx * cx + cy * cy + cz * cz <= area2Eps * area2Eps
        }
        if (isDegenerate) {
            degenerate++
        } else {
            validTri[t] = 1
            addEdge(a, b)
            addEdge(b, c)
            addEdge(c, a)
            union(parent, a, b)
            union(parent, b, c)
        }
        if (t % YIELD_EVERY === 0) {
            await yieldToMain()
            if (isCancelled()) return null
        }
    }

    // 3) 모서리 판정 + 구멍(열린 모서리 연결 덩어리) 집계
    let openEdges = 0
    let nonManifoldEdges = 0
    let flippedEdges = 0
    const holeParent = new Map<number, number>()
    const holeFind = (i: number): number => {
        let r = i
        while (holeParent.get(r) !== r) r = holeParent.get(r)!
        holeParent.set(i, r)
        return r
    }
    const holeUnion = (a: number, b: number) => {
        if (!holeParent.has(a)) holeParent.set(a, a)
        if (!holeParent.has(b)) holeParent.set(b, b)
        const ra = holeFind(a)
        const rb = holeFind(b)
        if (ra !== rb) holeParent.set(ra, rb)
    }
    let processed = 0
    for (const [key, value] of edges) {
        const count = Math.floor(value / ORIENT_SPAN)
        const sum = (value % ORIENT_SPAN) - ORIENT_OFFSET
        if (count === 1) {
            openEdges++
            holeUnion(Math.floor(key / vertexCount), key % vertexCount)
        } else if (count > 2) {
            nonManifoldEdges++
        } else if (sum !== 0) {
            flippedEdges++
        }
        if (++processed % YIELD_EVERY === 0) {
            await yieldToMain()
            if (isCancelled()) return null
        }
    }
    edges.clear()
    let holes = 0
    for (const [k] of holeParent) if (holeFind(k) === k) holes++

    // 4) 덩어리별 부호 부피·범위 — 음수인데 다른 덩어리 안에 있지 않으면 안팎이 뒤집힌 덩어리
    //    (속을 비운 모델의 안쪽 껍데기는 일부러 안쪽을 향하므로 제외)
    type ShellStat = { volume: number; min: [number, number, number]; max: [number, number, number] }
    const shellStats = new Map<number, ShellStat>()
    for (let t = 0; t < triangles; t++) {
        if (!validTri[t]) continue
        const ia = corner(t, 0)
        const ib = corner(t, 1)
        const ic = corner(t, 2)
        const ax = pos.getX(ia), ay = pos.getY(ia), az = pos.getZ(ia)
        const bx = pos.getX(ib), by = pos.getY(ib), bz = pos.getZ(ib)
        const cx = pos.getX(ic), cy = pos.getY(ic), cz = pos.getZ(ic)
        const v = (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6
        const root = find(parent, weldId[ia])
        let s = shellStats.get(root)
        if (!s) {
            s = { volume: 0, min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
            shellStats.set(root, s)
        }
        s.volume += v
        for (const [x, y, z] of [[ax, ay, az], [bx, by, bz], [cx, cy, cz]]) {
            if (x < s.min[0]) s.min[0] = x
            if (y < s.min[1]) s.min[1] = y
            if (z < s.min[2]) s.min[2] = z
            if (x > s.max[0]) s.max[0] = x
            if (y > s.max[1]) s.max[1] = y
            if (z > s.max[2]) s.max[2] = z
        }
        if (t % YIELD_EVERY === 0) {
            await yieldToMain()
            if (isCancelled()) return null
        }
    }
    const volumeEps = Math.max(diag * diag * diag * 1e-9, 1e-12)
    const tol = eps * 4
    const shellList = [...shellStats.values()]
    const containers = [...shellList].sort((a, b) => Math.abs(b.volume) - Math.abs(a.volume)).slice(0, 50)
    const isInside = (inner: ShellStat) =>
        containers.some(
            (c) =>
                c !== inner &&
                Math.abs(c.volume) > Math.abs(inner.volume) &&
                [0, 1, 2].every((k) => inner.min[k] >= c.min[k] - tol && inner.max[k] <= c.max[k] + tol)
        )
    let invertedShells = 0
    for (const s of shellList) if (s.volume < -volumeEps && !isInside(s)) invertedShells++

    return {
        status: 'ok',
        result: {
            triangles,
            vertices: vertexCount,
            degenerateTriangles: degenerate,
            openEdges,
            holes,
            nonManifoldEdges,
            flippedEdges,
            shells: shellStats.size,
            invertedShells,
        },
    }
}

export type MeshVerdict = 'good' | 'warn' | 'fix'

/**
 * 출력 관점 판정: 구멍·비다양체는 수정 권장, 뒤집힌 면은 확인 필요.
 * 면적 0 삼각형은 CAD 내보내기에서 흔하고 슬라이서가 무시하므로 판정에 넣지 않는다.
 */
export function meshVerdict(r: MeshInspection): MeshVerdict {
    if (r.openEdges > 0 || r.nonManifoldEdges > 0) return 'fix'
    if (r.flippedEdges > 0 || r.invertedShells > 0) return 'warn'
    return 'good'
}
