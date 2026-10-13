/**
 * 벽(살) 두께 추정 — 표면에서 면적 비례로 점을 뽑아 법선 반대(안쪽)로 광선을 쏴 맞은편 벽까지 거리를 잰다
 * - 삼각형 BVH로 광선 교차를 가속, 거리는 모델 좌표 단위(mm로 가정)
 * - 면 방향이 바깥을 향하도록 정렬된 메쉬를 전제로 함 (해석 단계에서 orientMeshConsistently 적용)
 */

export const MESH_THICKNESS_MAX_TRIANGLES = 2_000_000
export const MESH_THICKNESS_SAMPLES = 6000

const LEAF_SIZE = 8
const STACK_SIZE = 256

export type MeshThicknessResult = {
    /** 측정에 성공한 표본 위치 (3개씩) — thickness와 같은 순서 */
    points: Float32Array
    /** 표본별 두께 (모델 좌표 단위) */
    thickness: Float32Array
}

export type MeshThicknessOutcome =
    | { status: 'ok'; result: MeshThicknessResult }
    | { status: 'too_large'; triangles: number }
    | { status: 'empty' }

type Bvh = {
    bounds: Float32Array
    /** 잎: 삼각형 시작 위치, 가지: 왼쪽 자식 (오른쪽은 +1) */
    first: Uint32Array
    /** 잎의 삼각형 수 (0이면 가지) */
    count: Uint32Array
    order: Uint32Array
}

function buildBvh(tri: Float32Array, triCount: number): Bvh {
    const triMin = new Float32Array(triCount * 3)
    const triMax = new Float32Array(triCount * 3)
    const centroid = new Float32Array(triCount * 3)
    for (let t = 0; t < triCount; t++) {
        const o = t * 9
        for (let k = 0; k < 3; k++) {
            const a = tri[o + k]
            const b = tri[o + 3 + k]
            const c = tri[o + 6 + k]
            triMin[t * 3 + k] = Math.min(a, b, c)
            triMax[t * 3 + k] = Math.max(a, b, c)
            centroid[t * 3 + k] = (a + b + c) / 3
        }
    }

    const maxNodes = Math.max(1, 2 * Math.ceil(triCount / LEAF_SIZE) * 2)
    let bounds = new Float32Array(maxNodes * 6)
    let first = new Uint32Array(maxNodes)
    let count = new Uint32Array(maxNodes)
    const order = new Uint32Array(triCount)
    for (let i = 0; i < triCount; i++) order[i] = i

    let nodeCount = 1
    const grow = () => {
        const size = first.length * 2
        const b = new Float32Array(size * 6)
        b.set(bounds)
        bounds = b
        const f = new Uint32Array(size)
        f.set(first)
        first = f
        const c = new Uint32Array(size)
        c.set(count)
        count = c
    }

    // [노드, 시작, 끝]
    const stack: number[] = [0, 0, triCount]
    while (stack.length > 0) {
        const end = stack.pop()!
        const start = stack.pop()!
        const node = stack.pop()!

        let minX = Infinity, minY = Infinity, minZ = Infinity
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
        let cMinX = Infinity, cMinY = Infinity, cMinZ = Infinity
        let cMaxX = -Infinity, cMaxY = -Infinity, cMaxZ = -Infinity
        for (let i = start; i < end; i++) {
            const t = order[i] * 3
            if (triMin[t] < minX) minX = triMin[t]
            if (triMin[t + 1] < minY) minY = triMin[t + 1]
            if (triMin[t + 2] < minZ) minZ = triMin[t + 2]
            if (triMax[t] > maxX) maxX = triMax[t]
            if (triMax[t + 1] > maxY) maxY = triMax[t + 1]
            if (triMax[t + 2] > maxZ) maxZ = triMax[t + 2]
            const cx = centroid[t], cy = centroid[t + 1], cz = centroid[t + 2]
            if (cx < cMinX) cMinX = cx
            if (cy < cMinY) cMinY = cy
            if (cz < cMinZ) cMinZ = cz
            if (cx > cMaxX) cMaxX = cx
            if (cy > cMaxY) cMaxY = cy
            if (cz > cMaxZ) cMaxZ = cz
        }
        const b = node * 6
        bounds[b] = minX
        bounds[b + 1] = minY
        bounds[b + 2] = minZ
        bounds[b + 3] = maxX
        bounds[b + 4] = maxY
        bounds[b + 5] = maxZ

        const n = end - start
        if (n <= LEAF_SIZE) {
            first[node] = start
            count[node] = n
            continue
        }

        const ex = cMaxX - cMinX, ey = cMaxY - cMinY, ez = cMaxZ - cMinZ
        const axis = ex >= ey && ex >= ez ? 0 : ey >= ez ? 1 : 2
        const split = axis === 0 ? (cMinX + cMaxX) / 2 : axis === 1 ? (cMinY + cMaxY) / 2 : (cMinZ + cMaxZ) / 2
        let mid = start
        for (let i = start; i < end; i++) {
            if (centroid[order[i] * 3 + axis] < split) {
                const tmp = order[i]
                order[i] = order[mid]
                order[mid] = tmp
                mid++
            }
        }
        // 중심점이 모두 같은 쪽이면 개수로 반 나눔
        if (mid === start || mid === end) mid = start + (n >> 1)

        while (nodeCount + 2 > first.length) grow()
        const left = nodeCount
        nodeCount += 2
        first[node] = left
        count[node] = 0
        stack.push(left + 1, mid, end, left, start, mid)
    }

    return { bounds, first, count, order }
}

/** 원점에서 dir 방향으로 가장 가까운 교차 — 맞은 삼각형과 거리를 반환 (없으면 hitTri = -1) */
function raycast(
    bvh: Bvh,
    tri: Float32Array,
    ox: number, oy: number, oz: number,
    dx: number, dy: number, dz: number,
    tMin: number,
    tMax: number,
    skip: number,
    stack: Uint32Array,
    out: { t: number; tri: number }
) {
    // 축과 나란한 면은 방향 성분이 0 — 0 × ∞ = NaN이 되지 않게 아주 작은 값으로 대체
    const ix = 1 / (dx || 1e-30), iy = 1 / (dy || 1e-30), iz = 1 / (dz || 1e-30)
    let best = tMax
    let bestTri = -1
    let sp = 0
    stack[sp++] = 0
    while (sp > 0) {
        const node = stack[--sp]
        const b = node * 6
        let t1 = (bvh.bounds[b] - ox) * ix
        let t2 = (bvh.bounds[b + 3] - ox) * ix
        let lo = Math.min(t1, t2)
        let hi = Math.max(t1, t2)
        t1 = (bvh.bounds[b + 1] - oy) * iy
        t2 = (bvh.bounds[b + 4] - oy) * iy
        lo = Math.max(lo, Math.min(t1, t2))
        hi = Math.min(hi, Math.max(t1, t2))
        t1 = (bvh.bounds[b + 2] - oz) * iz
        t2 = (bvh.bounds[b + 5] - oz) * iz
        lo = Math.max(lo, Math.min(t1, t2))
        hi = Math.min(hi, Math.max(t1, t2))
        if (!(hi >= lo) || hi < tMin || lo > best) continue

        const cnt = bvh.count[node]
        if (cnt === 0) {
            if (sp + 2 > stack.length) continue
            stack[sp++] = bvh.first[node]
            stack[sp++] = bvh.first[node] + 1
            continue
        }
        const end = bvh.first[node] + cnt
        for (let i = bvh.first[node]; i < end; i++) {
            const t = bvh.order[i]
            if (t === skip) continue
            const o = t * 9
            const ax = tri[o], ay = tri[o + 1], az = tri[o + 2]
            const e1x = tri[o + 3] - ax, e1y = tri[o + 4] - ay, e1z = tri[o + 5] - az
            const e2x = tri[o + 6] - ax, e2y = tri[o + 7] - ay, e2z = tri[o + 8] - az
            const px = dy * e2z - dz * e2y
            const py = dz * e2x - dx * e2z
            const pz = dx * e2y - dy * e2x
            const det = e1x * px + e1y * py + e1z * pz
            if (det > -1e-12 && det < 1e-12) continue
            const inv = 1 / det
            const sx = ox - ax, sy = oy - ay, sz = oz - az
            const u = (sx * px + sy * py + sz * pz) * inv
            if (u < 0 || u > 1) continue
            const qx = sy * e1z - sz * e1y
            const qy = sz * e1x - sx * e1z
            const qz = sx * e1y - sy * e1x
            const v = (dx * qx + dy * qy + dz * qz) * inv
            if (v < 0 || u + v > 1) continue
            const dist = (e2x * qx + e2y * qy + e2z * qz) * inv
            if (dist > tMin && dist < best) {
                best = dist
                bestTri = t
            }
        }
    }
    out.t = best
    out.tri = bestTri
}

/** 결과가 실행마다 같도록 고정 시드 난수 */
function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function measureThickness(
    position: Float32Array,
    index: Uint32Array | null,
    sampleCount: number = MESH_THICKNESS_SAMPLES
): MeshThicknessOutcome {
    const triCount = Math.floor((index ? index.length : position.length / 3) / 3)
    if (triCount === 0) return { status: 'empty' }
    if (triCount > MESH_THICKNESS_MAX_TRIANGLES) return { status: 'too_large', triangles: triCount }

    const tri = new Float32Array(triCount * 9)
    for (let t = 0; t < triCount; t++) {
        for (let c = 0; c < 3; c++) {
            const v = index ? index[t * 3 + c] : t * 3 + c
            tri[t * 9 + c * 3] = position[v * 3]
            tri[t * 9 + c * 3 + 1] = position[v * 3 + 1]
            tri[t * 9 + c * 3 + 2] = position[v * 3 + 2]
        }
    }

    // 면 법선(바깥 방향)·누적 면적
    const normal = new Float32Array(triCount * 3)
    const cumArea = new Float64Array(triCount)
    let total = 0
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    for (let t = 0; t < triCount; t++) {
        const o = t * 9
        const e1x = tri[o + 3] - tri[o], e1y = tri[o + 4] - tri[o + 1], e1z = tri[o + 5] - tri[o + 2]
        const e2x = tri[o + 6] - tri[o], e2y = tri[o + 7] - tri[o + 1], e2z = tri[o + 8] - tri[o + 2]
        const nx = e1y * e2z - e1z * e2y
        const ny = e1z * e2x - e1x * e2z
        const nz = e1x * e2y - e1y * e2x
        const len = Math.hypot(nx, ny, nz)
        if (len > 0) {
            normal[t * 3] = nx / len
            normal[t * 3 + 1] = ny / len
            normal[t * 3 + 2] = nz / len
            total += len / 2
        }
        cumArea[t] = total
        for (let k = 0; k < 9; k += 3) {
            const x = tri[o + k], y = tri[o + k + 1], z = tri[o + k + 2]
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (z < minZ) minZ = z
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
            if (z > maxZ) maxZ = z
        }
    }
    if (total <= 0) return { status: 'empty' }
    const diag = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ)
    const eps = Math.max(diag * 1e-6, 1e-6)

    const bvh = buildBvh(tri, triCount)
    const stack = new Uint32Array(STACK_SIZE)
    const hit = { t: 0, tri: -1 }
    const rand = mulberry32(0x5eed)

    const points = new Float32Array(sampleCount * 3)
    const thickness = new Float32Array(sampleCount)
    let n = 0
    for (let s = 0; s < sampleCount; s++) {
        // 면적에 비례해 삼각형 선택
        const r = rand() * total
        let lo = 0, hi = triCount - 1
        while (lo < hi) {
            const mid = (lo + hi) >> 1
            if (cumArea[mid] < r) lo = mid + 1
            else hi = mid
        }
        const t = lo
        const nx = normal[t * 3], ny = normal[t * 3 + 1], nz = normal[t * 3 + 2]
        if (nx === 0 && ny === 0 && nz === 0) continue

        let u = rand(), v = rand()
        if (u + v > 1) {
            u = 1 - u
            v = 1 - v
        }
        const o = t * 9
        const px = tri[o] + u * (tri[o + 3] - tri[o]) + v * (tri[o + 6] - tri[o])
        const py = tri[o + 1] + u * (tri[o + 4] - tri[o + 1]) + v * (tri[o + 7] - tri[o + 1])
        const pz = tri[o + 2] + u * (tri[o + 5] - tri[o + 2]) + v * (tri[o + 8] - tri[o + 2])

        raycast(bvh, tri, px, py, pz, -nx, -ny, -nz, eps, diag * 2, t, stack, hit)
        if (hit.tri < 0) continue
        // 맞은편 면이 같은 쪽(바깥)을 향해야 벽을 관통한 것 — 내부 면·뒤집힌 면에 맞으면 제외
        const h = hit.tri * 3
        if (normal[h] * -nx + normal[h + 1] * -ny + normal[h + 2] * -nz <= 0) continue

        points[n * 3] = px
        points[n * 3 + 1] = py
        points[n * 3 + 2] = pz
        thickness[n] = hit.t
        n++
    }

    return {
        status: 'ok',
        result: { points: points.slice(0, n * 3), thickness: thickness.slice(0, n) },
    }
}

export type ThicknessSummary = {
    /** 측정 표본 수 */
    samples: number
    /** 기준보다 얇은 표본 수 */
    thinCount: number
    /** 얇은 표면 비율 (0~1, 면적 기준) */
    thinRatio: number
    /** 가장 얇은 곳 추정 (mm, 극단값 몇 개는 제외) */
    minMm: number | null
    /** 얇은 표본 위치 (모델 좌표, 3개씩) */
    thinPoints: Float32Array
}

/** 측정값을 출력 배율·기준 두께로 집계 */
export function summarizeThickness(r: MeshThicknessResult, minWallMm: number, scale: number): ThicknessSummary {
    const samples = r.thickness.length
    const limit = minWallMm / Math.max(scale, 1e-9)
    const thinIdx: number[] = []
    for (let i = 0; i < samples; i++) if (r.thickness[i] < limit) thinIdx.push(i)
    const thinPoints = new Float32Array(thinIdx.length * 3)
    thinIdx.forEach((i, k) => {
        thinPoints[k * 3] = r.points[i * 3]
        thinPoints[k * 3 + 1] = r.points[i * 3 + 1]
        thinPoints[k * 3 + 2] = r.points[i * 3 + 2]
    })
    let minMm: number | null = null
    if (thinIdx.length > 0) {
        const sorted = thinIdx.map((i) => r.thickness[i]).sort((a, b) => a - b)
        minMm = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.02))] * scale
    }
    return {
        samples,
        thinCount: thinIdx.length,
        thinRatio: samples > 0 ? thinIdx.length / samples : 0,
        minMm,
        thinPoints,
    }
}
