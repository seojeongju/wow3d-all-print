/**
 * 3MF 경량 파서 — DOMParser 없이 바이트 단위로 스캔 (Web Worker에서 대용량 3MF 해석용)
 *
 * 지원: 메시 객체, 컴포넌트(중첩), 빌드 항목 변환, Production 확장(p:path 외부 모델 파일), 모델 단위(unit)
 * 미지원(형상에 영향 없음): 색상·재질·텍스처·빔 격자·슬라이스
 */
import { unzipSync } from 'fflate'

export type ThreeMFParsed = {
    position: Float32Array
    index: Uint32Array
    /** 객체(인스턴스)별 인덱스 범위 — 2개 이상일 때만 */
    parts: { start: number; count: number }[] | null
}

type Affine = Float64Array // 3×4 행 우선 [r0c0 r0c1 r0c2 r0c3, r1..., r2...]

type MeshObject = {
    kind: 'mesh'
    positions: GrowF32
    indices: GrowU32
}
type CompositeObject = {
    kind: 'components'
    components: { objectId: string; path: string | null; transform: Affine | null }[]
}
type ObjectDef = MeshObject | CompositeObject

type ModelFile = {
    unit: string
    objects: Map<string, ObjectDef>
    build: { objectId: string; path: string | null; transform: Affine | null }[]
}

class GrowF32 {
    data = new Float32Array(1 << 12)
    length = 0
    push3(a: number, b: number, c: number) {
        if (this.length + 3 > this.data.length) this.grow()
        const d = this.data
        d[this.length] = a
        d[this.length + 1] = b
        d[this.length + 2] = c
        this.length += 3
    }
    private grow() {
        const next = new Float32Array(this.data.length * 2)
        next.set(this.data)
        this.data = next
    }
}

class GrowU32 {
    data = new Uint32Array(1 << 12)
    length = 0
    push3(a: number, b: number, c: number) {
        if (this.length + 3 > this.data.length) this.grow()
        const d = this.data
        d[this.length] = a
        d[this.length + 1] = b
        d[this.length + 2] = c
        this.length += 3
    }
    private grow() {
        const next = new Uint32Array(this.data.length * 2)
        next.set(this.data)
        this.data = next
    }
}

const UNIT_TO_MM: Record<string, number> = {
    micron: 0.001,
    millimeter: 1,
    centimeter: 10,
    inch: 25.4,
    foot: 304.8,
    meter: 1000,
}

const LT = 60
const GT = 62
const SLASH = 47
const QM = 63
const EXCL = 33
const EQ = 61
const DQ = 34
const SQ = 39
const COLON = 58
const DASH = 45

function isSpace(c: number): boolean {
    return c === 32 || c === 9 || c === 10 || c === 13
}

/** 바이트 구간의 10진 실수 파싱 (부호·소수·지수) */
function parseNum(b: Uint8Array, s: number, e: number): number {
    let i = s
    while (i < e && isSpace(b[i])) i++
    let neg = false
    if (b[i] === DASH) {
        neg = true
        i++
    } else if (b[i] === 43) i++
    let v = 0
    let c = 0
    while (i < e && (c = b[i]) >= 48 && c <= 57) {
        v = v * 10 + (c - 48)
        i++
    }
    if (i < e && b[i] === 46) {
        i++
        let f = 0
        let d = 1
        while (i < e && (c = b[i]) >= 48 && c <= 57) {
            if (d < 1e15) {
                f = f * 10 + (c - 48)
                d *= 10
            }
            i++
        }
        v += f / d
    }
    if (i < e && (b[i] === 101 || b[i] === 69)) {
        i++
        let eneg = false
        if (b[i] === DASH) {
            eneg = true
            i++
        } else if (b[i] === 43) i++
        let ex = 0
        while (i < e && (c = b[i]) >= 48 && c <= 57) {
            ex = ex * 10 + (c - 48)
            i++
        }
        v *= Math.pow(10, eneg ? -ex : ex)
    }
    return neg ? -v : v
}

function parseUint(b: Uint8Array, s: number, e: number): number {
    let v = 0
    for (let i = s; i < e; i++) {
        const c = b[i]
        if (c >= 48 && c <= 57) v = v * 10 + (c - 48)
    }
    return v
}

const latin1 = (b: Uint8Array, s: number, e: number): string => {
    let out = ''
    for (let i = s; i < e; i++) out += String.fromCharCode(b[i])
    return out
}

const utf8 = new TextDecoder()

function nameEq(b: Uint8Array, s: number, e: number, name: string): boolean {
    if (e - s !== name.length) return false
    for (let i = 0; i < name.length; i++) if (b[s + i] !== name.charCodeAt(i)) return false
    return true
}

type Attr = { ns: number; ne: number; nl: number; vs: number; ve: number }

/** 태그 속성 구간 [s, e) 순회 — 이름 로컬 시작(nl)은 접두어(p:) 다음 */
function readAttrs(b: Uint8Array, s: number, e: number, out: Attr[]): number {
    let count = 0
    let i = s
    while (i < e) {
        while (i < e && isSpace(b[i])) i++
        if (i >= e || b[i] === SLASH) break
        const ns = i
        let nl = i
        while (i < e && b[i] !== EQ && !isSpace(b[i])) {
            if (b[i] === COLON) nl = i + 1
            i++
        }
        const ne = i
        while (i < e && b[i] !== EQ) i++
        i++
        while (i < e && isSpace(b[i])) i++
        const q = b[i]
        if (q !== DQ && q !== SQ) break
        const vs = ++i
        while (i < e && b[i] !== q) i++
        const ve = i
        i++
        if (count < out.length) {
            const a = out[count]
            a.ns = ns
            a.ne = ne
            a.nl = nl
            a.vs = vs
            a.ve = ve
        } else out.push({ ns, ne, nl, vs, ve })
        count++
    }
    return count
}

function parseTransform(str: string): Affine | null {
    const t = str.trim().split(/\s+/).map(Number)
    if (t.length !== 12 || t.some((v) => !Number.isFinite(v))) return null
    // 3MF: 행벡터 × M (마지막 행이 이동) → 열벡터용 3×4로 전치
    return Float64Array.from([t[0], t[3], t[6], t[9], t[1], t[4], t[7], t[10], t[2], t[5], t[8], t[11]])
}

const IDENTITY: Affine = Float64Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0])

/** A∘B (B 먼저 적용) */
function mul(a: Affine, b: Affine): Affine {
    const r = new Float64Array(12)
    for (let row = 0; row < 3; row++) {
        const a0 = a[row * 4]
        const a1 = a[row * 4 + 1]
        const a2 = a[row * 4 + 2]
        r[row * 4] = a0 * b[0] + a1 * b[4] + a2 * b[8]
        r[row * 4 + 1] = a0 * b[1] + a1 * b[5] + a2 * b[9]
        r[row * 4 + 2] = a0 * b[2] + a1 * b[6] + a2 * b[10]
        r[row * 4 + 3] = a0 * b[3] + a1 * b[7] + a2 * b[11] + a[row * 4 + 3]
    }
    return r
}

function normalizePath(p: string): string {
    return p.replace(/^\/+/, '')
}

function parseModelXml(b: Uint8Array): ModelFile {
    const model: ModelFile = { unit: 'millimeter', objects: new Map(), build: [] }
    const attrs: Attr[] = []
    const n = b.length
    let i = 0
    let current: { id: string; def: ObjectDef | null } | null = null
    let inBuild = false

    const attrStr = (count: number, local: string, full?: string): string | null => {
        for (let k = 0; k < count; k++) {
            const a = attrs[k]
            if (full ? nameEq(b, a.ns, a.ne, full) : nameEq(b, a.nl, a.ne, local)) return latin1(b, a.vs, a.ve)
        }
        return null
    }
    const pathAttr = (count: number): string | null => {
        for (let k = 0; k < count; k++) {
            const a = attrs[k]
            if (a.nl !== a.ns && nameEq(b, a.nl, a.ne, 'path')) return normalizePath(utf8.decode(b.subarray(a.vs, a.ve)))
        }
        return null
    }

    while (i < n) {
        const lt = b.indexOf(LT, i)
        if (lt < 0) break
        let j = lt + 1
        const c0 = b[j]
        if (c0 === QM || c0 === EXCL) {
            if (c0 === EXCL && b[j + 1] === DASH && b[j + 2] === DASH) {
                let k = j + 3
                for (;;) {
                    const g = b.indexOf(GT, k)
                    if (g < 0) return model
                    if (b[g - 1] === DASH && b[g - 2] === DASH) {
                        i = g + 1
                        break
                    }
                    k = g + 1
                }
            } else {
                const g = b.indexOf(GT, j)
                if (g < 0) break
                i = g + 1
            }
            continue
        }
        const closing = c0 === SLASH
        if (closing) j++
        let ls = j
        while (j < n) {
            const c = b[j]
            if (isSpace(c) || c === SLASH || c === GT) break
            if (c === COLON) ls = j + 1
            j++
        }
        const le = j
        // 태그 끝 '>' (따옴표 안의 '>' 무시)
        let k = j
        let quote = 0
        while (k < n) {
            const c = b[k]
            if (quote) {
                if (c === quote) quote = 0
            } else if (c === DQ || c === SQ) quote = c
            else if (c === GT) break
            k++
        }
        if (k >= n) break
        const selfClosing = b[k - 1] === SLASH
        i = k + 1
        const len = le - ls

        if (closing) {
            if (len === 6 && nameEq(b, ls, le, 'object')) {
                if (current?.def) model.objects.set(current.id, current.def)
                current = null
            } else if (len === 5 && nameEq(b, ls, le, 'build')) inBuild = false
            continue
        }

        if (len === 6 && b[ls] === 118 /* v */ && nameEq(b, ls, le, 'vertex')) {
            const def = current?.def
            if (!def || def.kind !== 'mesh') continue
            const cnt = readAttrs(b, le, k, attrs)
            let x = 0
            let y = 0
            let z = 0
            for (let a = 0; a < cnt; a++) {
                const at = attrs[a]
                if (at.ne - at.nl !== 1) continue
                const ch = b[at.nl]
                if (ch === 120) x = parseNum(b, at.vs, at.ve)
                else if (ch === 121) y = parseNum(b, at.vs, at.ve)
                else if (ch === 122) z = parseNum(b, at.vs, at.ve)
            }
            def.positions.push3(x, y, z)
            continue
        }
        if (len === 8 && b[ls] === 116 /* t */ && nameEq(b, ls, le, 'triangle')) {
            const def = current?.def
            if (!def || def.kind !== 'mesh') continue
            const cnt = readAttrs(b, le, k, attrs)
            let v1 = 0
            let v2 = 0
            let v3 = 0
            for (let a = 0; a < cnt; a++) {
                const at = attrs[a]
                if (at.ne - at.nl !== 2 || b[at.nl] !== 118) continue
                const d = b[at.nl + 1]
                if (d === 49) v1 = parseUint(b, at.vs, at.ve)
                else if (d === 50) v2 = parseUint(b, at.vs, at.ve)
                else if (d === 51) v3 = parseUint(b, at.vs, at.ve)
            }
            def.indices.push3(v1, v2, v3)
            continue
        }
        if (len === 6 && nameEq(b, ls, le, 'object')) {
            const cnt = readAttrs(b, le, k, attrs)
            const id = attrStr(cnt, 'id')
            current = id != null && !selfClosing ? { id, def: null } : null
            continue
        }
        if (len === 4 && nameEq(b, ls, le, 'mesh')) {
            if (current && !current.def) {
                current.def = { kind: 'mesh', positions: new GrowF32(), indices: new GrowU32() }
            }
            continue
        }
        if (len === 9 && nameEq(b, ls, le, 'component')) {
            if (!current) continue
            if (!current.def) current.def = { kind: 'components', components: [] }
            if (current.def.kind !== 'components') continue
            const cnt = readAttrs(b, le, k, attrs)
            const objectId = attrStr(cnt, 'objectid')
            if (objectId == null) continue
            const tr = attrStr(cnt, 'transform')
            current.def.components.push({ objectId, path: pathAttr(cnt), transform: tr ? parseTransform(tr) : null })
            continue
        }
        if (len === 5 && nameEq(b, ls, le, 'build')) {
            inBuild = !selfClosing
            continue
        }
        if (len === 4 && inBuild && nameEq(b, ls, le, 'item')) {
            const cnt = readAttrs(b, le, k, attrs)
            const objectId = attrStr(cnt, 'objectid')
            if (objectId == null) continue
            const tr = attrStr(cnt, 'transform')
            model.build.push({ objectId, path: pathAttr(cnt), transform: tr ? parseTransform(tr) : null })
            continue
        }
        if (len === 5 && nameEq(b, ls, le, 'model')) {
            const cnt = readAttrs(b, le, k, attrs)
            const unit = attrStr(cnt, 'unit')
            if (unit) model.unit = unit.trim().toLowerCase()
        }
    }
    return model
}

function findRootModelPath(files: Record<string, Uint8Array>): string | null {
    const rels = files['_rels/.rels']
    if (rels) {
        const text = utf8.decode(rels)
        const re = /<Relationship\b[^>]*>/g
        let m: RegExpExecArray | null
        while ((m = re.exec(text))) {
            const tag = m[0]
            if (!/Type\s*=\s*["'][^"']*\/3dmodel["']/i.test(tag)) continue
            const target = /Target\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
            if (target && files[normalizePath(target)]) return normalizePath(target)
        }
    }
    if (files['3D/3dmodel.model']) return '3D/3dmodel.model'
    return Object.keys(files).find((p) => p.toLowerCase().endsWith('.model')) ?? null
}

/** 3MF ArrayBuffer → 병합 메시 (단위 mm). 형상이 없으면 null */
export function parseThreeMF(buffer: ArrayBuffer): ThreeMFParsed | null {
    const files = unzipSync(new Uint8Array(buffer), {
        filter: (f) => f.name === '_rels/.rels' || f.name.toLowerCase().endsWith('.model'),
    })
    const rootPath = findRootModelPath(files)
    if (!rootPath) return null

    const models = new Map<string, ModelFile>()
    const getModel = (path: string): ModelFile | null => {
        const hit = models.get(path)
        if (hit) return hit
        const bytes = files[path]
        if (!bytes) return null
        const parsed = parseModelXml(bytes)
        models.set(path, parsed)
        delete files[path]
        return parsed
    }

    const root = getModel(rootPath)
    if (!root || root.build.length === 0) return null
    const unitScale = UNIT_TO_MM[root.unit] ?? 1
    const rootMatrix: Affine = Float64Array.from([unitScale, 0, 0, 0, 0, unitScale, 0, 0, 0, 0, unitScale, 0])

    const instances: { mesh: MeshObject; matrix: Affine }[] = []
    const visit = (path: string, objectId: string, matrix: Affine, depth: number) => {
        if (depth > 32) return
        const model = getModel(path)
        const def = model?.objects.get(objectId)
        if (!def) return
        if (def.kind === 'mesh') {
            if (def.positions.length >= 9 && def.indices.length >= 3) instances.push({ mesh: def, matrix })
            return
        }
        for (const comp of def.components) {
            const next = comp.transform ? mul(matrix, comp.transform) : matrix
            visit(comp.path ?? path, comp.objectId, next, depth + 1)
        }
    }
    for (const item of root.build) {
        const m = item.transform ? mul(rootMatrix, item.transform) : mul(rootMatrix, IDENTITY)
        visit(item.path ?? rootPath, item.objectId, m, 0)
    }
    if (instances.length === 0) return null

    let vTotal = 0
    let iTotal = 0
    for (const inst of instances) {
        vTotal += inst.mesh.positions.length
        iTotal += inst.mesh.indices.length
    }
    const position = new Float32Array(vTotal)
    const index = new Uint32Array(iTotal)
    const parts: { start: number; count: number }[] = []
    let vOff = 0
    let iOff = 0
    for (const { mesh, matrix: t } of instances) {
        const src = mesh.positions.data
        const vLen = mesh.positions.length
        const vertexCount = vLen / 3
        for (let p = 0; p < vLen; p += 3) {
            const x = src[p]
            const y = src[p + 1]
            const z = src[p + 2]
            position[vOff + p] = t[0] * x + t[1] * y + t[2] * z + t[3]
            position[vOff + p + 1] = t[4] * x + t[5] * y + t[6] * z + t[7]
            position[vOff + p + 2] = t[8] * x + t[9] * y + t[10] * z + t[11]
        }
        const isrc = mesh.indices.data
        const iLen = mesh.indices.length
        const base = vOff / 3
        for (let q = 0; q < iLen; q++) {
            const v = isrc[q]
            index[iOff + q] = (v < vertexCount ? v : 0) + base
        }
        parts.push({ start: iOff, count: iLen })
        vOff += vLen
        iOff += iLen
    }

    return { position, index, parts: parts.length > 1 ? parts : null }
}
