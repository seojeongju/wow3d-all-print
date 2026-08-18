/** STL 좌표를 견적 치수(mm)에 맞춰 스케일·90° 회전·바닥 정렬 */

export type BakeTargetMm = { x: number; y: number; z: number }

export type BakeRotation = { rotX: number; rotY: number; rotZ: number }

export type StlBBox = {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
    size: { x: number; y: number; z: number }
}

const AXES = [0, 90, 180, 270] as const

function rotXPoint(x: number, y: number, z: number, steps: number): [number, number, number] {
    const n = ((steps % 4) + 4) % 4
    let yy = y
    let zz = z
    for (let i = 0; i < n; i++) {
        const ny = -zz
        zz = yy
        yy = ny
    }
    return [x, yy, zz]
}

function rotYPoint(x: number, y: number, z: number, steps: number): [number, number, number] {
    const n = ((steps % 4) + 4) % 4
    let xx = x
    let zz = z
    for (let i = 0; i < n; i++) {
        const nx = zz
        zz = -xx
        xx = nx
    }
    return [xx, y, zz]
}

function rotZPoint(x: number, y: number, z: number, steps: number): [number, number, number] {
    const n = ((steps % 4) + 4) % 4
    let xx = x
    let yy = y
    for (let i = 0; i < n; i++) {
        const nx = -yy
        yy = xx
        xx = nx
    }
    return [xx, yy, z]
}

/** Three.js Euler XYZ 와 동일: Rx → Ry → Rz, 90° 단위 */
export function rotatePointEulerXyz(
    x: number,
    y: number,
    z: number,
    rotX: number,
    rotY: number,
    rotZ: number
): [number, number, number] {
    let p = rotXPoint(x, y, z, Math.round(rotX / 90))
    p = rotYPoint(p[0], p[1], p[2], Math.round(rotY / 90))
    p = rotZPoint(p[0], p[1], p[2], Math.round(rotZ / 90))
    return p
}

export function isBinaryStl(buf: ArrayBuffer): boolean {
    if (buf.byteLength < 84) return false
    const n = new DataView(buf).getUint32(80, true)
    return n > 0 && n < 100_000_000 && buf.byteLength === 84 + n * 50
}

function emptyBBox(): StlBBox {
    return {
        min: { x: Infinity, y: Infinity, z: Infinity },
        max: { x: -Infinity, y: -Infinity, z: -Infinity },
        size: { x: 0, y: 0, z: 0 },
    }
}

function finishBBox(b: StlBBox): StlBBox {
    const size = {
        x: Math.max(0, b.max.x - b.min.x),
        y: Math.max(0, b.max.y - b.min.y),
        z: Math.max(0, b.max.z - b.min.z),
    }
    return { min: b.min, max: b.max, size }
}

function expand(b: StlBBox, x: number, y: number, z: number): void {
    if (x < b.min.x) b.min.x = x
    if (y < b.min.y) b.min.y = y
    if (z < b.min.z) b.min.z = z
    if (x > b.max.x) b.max.x = x
    if (y > b.max.y) b.max.y = y
    if (z > b.max.z) b.max.z = z
}

function measureBinary(view: DataView, triCount: number): StlBBox {
    const b = emptyBBox()
    for (let t = 0; t < triCount; t++) {
        const base = 84 + t * 50
        for (let v = 0; v < 3; v++) {
            const o = base + 12 + v * 12
            expand(b, view.getFloat32(o, true), view.getFloat32(o + 4, true), view.getFloat32(o + 8, true))
        }
    }
    return finishBBox(b)
}

function parseAsciiVertices(text: string): number[] {
    const out: number[] = []
    const re = /vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
        out.push(Number(m[1]), Number(m[2]), Number(m[3]))
    }
    return out
}

function measureAscii(verts: number[]): StlBBox {
    const b = emptyBBox()
    for (let i = 0; i < verts.length; i += 3) {
        expand(b, verts[i], verts[i + 1], verts[i + 2])
    }
    return finishBBox(b)
}

function axisError(size: { x: number; y: number; z: number }, target: BakeTargetMm, s: number): number {
    const ex = target.x > 0.01 ? Math.abs(size.x * s - target.x) / target.x : 0
    const ey = target.y > 0.01 ? Math.abs(size.y * s - target.y) / target.y : 0
    const ez = target.z > 0.01 ? Math.abs(size.z * s - target.z) / target.z : 0
    return Math.max(ex, ey, ez)
}

function rotatedSize(
    size: { x: number; y: number; z: number },
    rotX: number,
    rotY: number,
    rotZ: number
): { x: number; y: number; z: number } {
    const c = [
        rotatePointEulerXyz(size.x, 0, 0, rotX, rotY, rotZ),
        rotatePointEulerXyz(0, size.y, 0, rotX, rotY, rotZ),
        rotatePointEulerXyz(0, 0, size.z, rotX, rotY, rotZ),
    ]
    return {
        x: Math.abs(c[0][0]) + Math.abs(c[1][0]) + Math.abs(c[2][0]),
        y: Math.abs(c[0][1]) + Math.abs(c[1][1]) + Math.abs(c[2][1]),
        z: Math.abs(c[0][2]) + Math.abs(c[1][2]) + Math.abs(c[2][2]),
    }
}

export function findBestBakeRotation(
    sourceSize: { x: number; y: number; z: number },
    target: BakeTargetMm
): BakeRotation & { scale: number; error: number } {
    let best = { rotX: 0, rotY: 0, rotZ: 0, scale: 1, error: Infinity }
    for (const rotX of AXES) {
        for (const rotY of AXES) {
            for (const rotZ of AXES) {
                const sz = rotatedSize(sourceSize, rotX, rotY, rotZ)
                const ratios: number[] = []
                if (sz.x > 0.01 && target.x > 0.01) ratios.push(target.x / sz.x)
                if (sz.y > 0.01 && target.y > 0.01) ratios.push(target.y / sz.y)
                if (sz.z > 0.01 && target.z > 0.01) ratios.push(target.z / sz.z)
                if (!ratios.length) continue
                const scale = ratios.reduce((a, b) => a + b, 0) / ratios.length
                const error = axisError(sz, target, scale)
                if (error < best.error) {
                    best = { rotX, rotY, rotZ, scale, error }
                }
            }
        }
    }
    return best
}

function mapVertex(
    x: number,
    y: number,
    z: number,
    rot: BakeRotation,
    sx: number,
    sy: number,
    sz: number,
    ox: number,
    oy: number,
    oz: number
): [number, number, number] {
    const r = rotatePointEulerXyz(x, y, z, rot.rotX, rot.rotY, rot.rotZ)
    return [r[0] * sx + ox, r[1] * sy + oy, r[2] * sz + oz]
}

function setNormalFromTri(view: DataView, base: number): void {
    const ax = view.getFloat32(base + 12, true)
    const ay = view.getFloat32(base + 16, true)
    const az = view.getFloat32(base + 20, true)
    const bx = view.getFloat32(base + 24, true)
    const by = view.getFloat32(base + 28, true)
    const bz = view.getFloat32(base + 32, true)
    const cx = view.getFloat32(base + 36, true)
    const cy = view.getFloat32(base + 40, true)
    const cz = view.getFloat32(base + 44, true)
    const ux = bx - ax
    const uy = by - ay
    const uz = bz - az
    const vx = cx - ax
    const vy = cy - ay
    const vz = cz - az
    let nx = uy * vz - uz * vy
    let ny = uz * vx - ux * vz
    let nz = ux * vy - uy * vx
    const len = Math.hypot(nx, ny, nz) || 1
    view.setFloat32(base, nx / len, true)
    view.setFloat32(base + 4, ny / len, true)
    view.setFloat32(base + 8, nz / len, true)
}

function parseStoredRotation(transform?: BakeRotation | null): BakeRotation | null {
    if (!transform) return null
    const rotX = Number(transform.rotX) || 0
    const rotY = Number(transform.rotY) || 0
    const rotZ = Number(transform.rotZ) || 0
    if (rotX === 0 && rotY === 0 && rotZ === 0) return { rotX: 0, rotY: 0, rotZ: 0 }
    return { rotX, rotY, rotZ }
}

/**
 * STL을 견적 치수(mm)에 맞게 변환합니다.
 * 저장된 회전이 있으면 사용하고, 없으면 치수가 맞도록 90° 조합을 찾습니다.
 */
export function bakeStlToTargetMm(
    input: ArrayBuffer,
    target: BakeTargetMm,
    storedRotation?: BakeRotation | null
): ArrayBuffer {
    const tx = Number(target.x) || 0
    const ty = Number(target.y) || 0
    const tz = Number(target.z) || 0
    if (!(tx > 0.05 && ty > 0.05 && tz > 0.05)) return input

    const copy = input.slice(0)

    if (isBinaryStl(copy)) {
        const view = new DataView(copy)
        const triCount = view.getUint32(80, true)
        const bbox = measureBinary(view, triCount)
        if (!(bbox.size.x > 0.01 && bbox.size.y > 0.01 && bbox.size.z > 0.01)) return input

        const stored = parseStoredRotation(storedRotation)
        const fit = stored
            ? (() => {
                  const sz = rotatedSize(bbox.size, stored.rotX, stored.rotY, stored.rotZ)
                  const ratios: number[] = []
                  if (sz.x > 0.01) ratios.push(tx / sz.x)
                  if (sz.y > 0.01) ratios.push(ty / sz.y)
                  if (sz.z > 0.01) ratios.push(tz / sz.z)
                  const scale = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 1
                  return { ...stored, scale, error: axisError(sz, { x: tx, y: ty, z: tz }, scale) }
              })()
            : findBestBakeRotation(bbox.size, { x: tx, y: ty, z: tz })

        const rot = { rotX: fit.rotX, rotY: fit.rotY, rotZ: fit.rotZ }
        const sz = rotatedSize(bbox.size, rot.rotX, rot.rotY, rot.rotZ)
        const sx = sz.x > 0.01 ? tx / sz.x : 1
        const sy = sz.y > 0.01 ? ty / sz.y : 1
        const szs = sz.z > 0.01 ? tz / sz.z : 1

        if (
            Math.abs(sx - 1) < 0.002 &&
            Math.abs(sy - 1) < 0.002 &&
            Math.abs(szs - 1) < 0.002 &&
            rot.rotX === 0 &&
            rot.rotY === 0 &&
            rot.rotZ === 0
        ) {
            return snapBinaryMinZ(copy, view, triCount)
        }

        let minX = Infinity
        let minY = Infinity
        let minZ = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (let t = 0; t < triCount; t++) {
            const base = 84 + t * 50
            for (let v = 0; v < 3; v++) {
                const o = base + 12 + v * 12
                const p = mapVertex(
                    view.getFloat32(o, true),
                    view.getFloat32(o + 4, true),
                    view.getFloat32(o + 8, true),
                    rot,
                    sx,
                    sy,
                    szs,
                    0,
                    0,
                    0
                )
                if (p[0] < minX) minX = p[0]
                if (p[1] < minY) minY = p[1]
                if (p[2] < minZ) minZ = p[2]
                if (p[0] > maxX) maxX = p[0]
                if (p[1] > maxY) maxY = p[1]
            }
        }
        const ox = -((minX + maxX) / 2)
        const oy = -((minY + maxY) / 2)
        const oz = -minZ
        for (let t = 0; t < triCount; t++) {
            const base = 84 + t * 50
            for (let v = 0; v < 3; v++) {
                const o = base + 12 + v * 12
                const p = mapVertex(
                    view.getFloat32(o, true),
                    view.getFloat32(o + 4, true),
                    view.getFloat32(o + 8, true),
                    rot,
                    sx,
                    sy,
                    szs,
                    ox,
                    oy,
                    oz
                )
                view.setFloat32(o, p[0], true)
                view.setFloat32(o + 4, p[1], true)
                view.setFloat32(o + 8, p[2], true)
            }
            setNormalFromTri(view, base)
        }
        const header = new Uint8Array(copy, 0, 80)
        const label = new TextEncoder().encode('Wow3D baked to quote size')
        header.fill(0)
        header.set(label.subarray(0, Math.min(80, label.length)))
        return copy
    }

    const text = new TextDecoder().decode(copy)
    if (!/facet\s+normal/i.test(text) || !/vertex/i.test(text)) return input
    const verts = parseAsciiVertices(text)
    if (verts.length < 9) return input
    const bbox = measureAscii(verts)
    if (!(bbox.size.x > 0.01 && bbox.size.y > 0.01 && bbox.size.z > 0.01)) return input

    const fit = parseStoredRotation(storedRotation)
        ? { rotX: storedRotation!.rotX, rotY: storedRotation!.rotY, rotZ: storedRotation!.rotZ }
        : findBestBakeRotation(bbox.size, { x: tx, y: ty, z: tz })
    const rot = { rotX: fit.rotX, rotY: fit.rotY, rotZ: fit.rotZ }
    const sz = rotatedSize(bbox.size, rot.rotX, rot.rotY, rot.rotZ)
    const sx = sz.x > 0.01 ? tx / sz.x : 1
    const sy = sz.y > 0.01 ? ty / sz.y : 1
    const szs = sz.z > 0.01 ? tz / sz.z : 1

    const outVerts: number[] = []
    let minX = Infinity
    let minY = Infinity
    let minZ = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (let i = 0; i < verts.length; i += 3) {
        const p = mapVertex(verts[i], verts[i + 1], verts[i + 2], rot, sx, sy, szs, 0, 0, 0)
        outVerts.push(p[0], p[1], p[2])
        if (p[0] < minX) minX = p[0]
        if (p[1] < minY) minY = p[1]
        if (p[2] < minZ) minZ = p[2]
        if (p[0] > maxX) maxX = p[0]
        if (p[1] > maxY) maxY = p[1]
    }
    const ox = -((minX + maxX) / 2)
    const oy = -((minY + maxY) / 2)
    const oz = -minZ
    let vi = 0
    const baked = text.replace(/vertex\s+[^\s]+\s+[^\s]+\s+[^\s]+/gi, () => {
        const x = outVerts[vi] + ox
        const y = outVerts[vi + 1] + oy
        const z = outVerts[vi + 2] + oz
        vi += 3
        return `vertex ${x} ${y} ${z}`
    })
    return new TextEncoder().encode(baked).buffer
}

function snapBinaryMinZ(copy: ArrayBuffer, view: DataView, triCount: number): ArrayBuffer {
    const bbox = measureBinary(view, triCount)
    const oz = -bbox.min.z
    if (Math.abs(oz) < 1e-6) return copy
    for (let t = 0; t < triCount; t++) {
        const base = 84 + t * 50
        for (let v = 0; v < 3; v++) {
            const o = base + 12 + v * 12 + 8
            view.setFloat32(o, view.getFloat32(o, true) + oz, true)
        }
    }
    return copy
}

export function parseModelTransformJson(raw: unknown): BakeRotation | null {
    if (raw == null) return null
    try {
        const o = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (!o || typeof o !== 'object') return null
        const r = o as Record<string, unknown>
        return {
            rotX: Number(r.rotX) || 0,
            rotY: Number(r.rotY) || 0,
            rotZ: Number(r.rotZ) || 0,
        }
    } catch {
        return null
    }
}

export function quoteSizedFileName(fileName: string | null | undefined, target: BakeTargetMm): string {
    const base = (fileName || 'model.stl').replace(/\.[^.]+$/, '')
    const tag = `${Math.round(target.x)}x${Math.round(target.y)}x${Math.round(target.z)}mm`
    return `${base}_${tag}.stl`
}
