/**
 * 이름표 형상 엔진.
 * 판·글자·테두리를 manifold로 합쳐 하나의 닫힌 메시를 만들고, 출력 가능 여부를 검사한다.
 * 브라우저와 Node(테스트) 양쪽에서 쓰도록 manifold 모듈과 폰트를 주입받는다.
 */
import type { CrossSection, Manifold, ManifoldToplevel } from 'manifold-3d'
import type { Font } from 'opentype.js'
import type { NameTagFontId } from '@/lib/name-tag-fonts'
import type { NameTagDesign } from '@/lib/name-tag/design'
import { missingGlyphs, referenceBox, textOutline, type Polygon } from '@/lib/name-tag/outline'
import { getNameTagTemplate } from '@/lib/name-tag/templates'

/**
 * 출력 검사 기준값 (초안).
 * FDM 0.4mm 노즐 기준으로 잡은 값이며, 실물 출력 테스트 후 확정한다.
 */
export const PRINT_RULES_DRAFT = {
    minStrokeMm: 0.8,
    minTextHeightMm: 4,
    /** 가는 획이 글자 면적에서 이 비율을 넘으면 경고 */
    thinAreaRatio: 0.03,
    /** 음각 후 남아야 하는 바닥 두께 */
    minFloorMm: 0.8,
    holeEdgeMm: 1.6,
    borderWidthMm: 1.2,
    clipAreaRatio: 0.005,
} as const

export type MeshData = {
    positions: Float32Array
    indices: Uint32Array
}

export type NameTagIssue =
    | { code: 'missing-glyph'; level: 'error'; chars: string[] }
    | { code: 'thin-stroke'; level: 'warn'; ratio: number }
    | { code: 'small-text'; level: 'warn'; heightMm: number }
    | { code: 'text-clipped'; level: 'warn'; ratio: number }
    | { code: 'text-shrunk'; level: 'info'; lineIndex: number }
    | { code: 'not-manifold'; level: 'error'; status: string }
    | { code: 'multi-body'; level: 'error'; bodies: number }

export type NameTagBuildResult = {
    /** 판(음각이면 파낸 판) */
    base: MeshData
    /** 양각 글자·테두리. 없으면 null */
    raised: MeshData | null
    /** 음각 바닥 색 표시용 얇은 면. 출력 파일에는 넣지 않는다 */
    engraveFill: MeshData | null
    /** 가는 획 표시용 */
    thin: MeshData | null
    /** 출력 파일용 하나로 합친 형상 */
    solid: MeshData
    stats: {
        volumeMm3: number
        sizeMm: [number, number, number]
        triangles: number
        bodies: number
        status: string
    }
    lines: Array<{ index: number; heightMm: number; shrunk: boolean }>
    issues: NameTagIssue[]
}

type Tracker = <T extends { delete(): void }>(obj: T) => T

function toMeshData(manifold: Manifold): MeshData {
    const mesh = manifold.getMesh()
    const stride = mesh.numProp
    const count = mesh.vertProperties.length / stride
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        positions[i * 3] = mesh.vertProperties[i * stride]
        positions[i * 3 + 1] = mesh.vertProperties[i * stride + 1]
        positions[i * 3 + 2] = mesh.vertProperties[i * stride + 2]
    }
    return { positions, indices: new Uint32Array(mesh.triVerts) }
}

type PlateFrame = {
    plate: CrossSection
    hole: CrossSection | null
    /** 글자를 배치할 수 있는 영역 */
    box: { x0: number; y0: number; x1: number; y1: number }
    margin: number
}

function roundedRect(wasm: ManifoldToplevel, w: number, h: number, r: number, track: Tracker): CrossSection {
    const radius = Math.max(0, Math.min(r, w / 2 - 0.01, h / 2 - 0.01))
    if (radius < 0.05) return track(wasm.CrossSection.square([w, h], true))
    const core = track(wasm.CrossSection.square([w - radius * 2, h - radius * 2], true))
    return track(core.offset(radius, 'Round'))
}

function templateFrame(wasm: ManifoldToplevel, design: NameTagDesign, track: Tracker): PlateFrame | null {
    const template = getNameTagTemplate(design.baseId)
    if (!template) return null
    const [viewW, viewH] = template.view
    const scale = design.plate.widthMm / viewW
    const toMm = (x: number, y: number): [number, number] => [(x - viewW / 2) * scale, (viewH / 2 - y) * scale]
    const rings = template.rings.map((ring) => ring.map(([x, y]) => toMm(x, y)))
    const plate = track(new wasm.CrossSection(rings, 'NonZero'))
    const [nx, ny, nw, nh] = template.nameBox
    const padX = nw * 0.08
    const padY = nh * 0.12
    const topLeft = toMm(nx + padX, ny + padY)
    const bottomRight = toMm(nx + nw - padX, ny + nh - padY)
    const box = {
        x0: Math.min(topLeft[0], bottomRight[0]),
        y0: Math.min(topLeft[1], bottomRight[1]),
        x1: Math.max(topLeft[0], bottomRight[0]),
        y1: Math.max(topLeft[1], bottomRight[1]),
    }
    return { plate, hole: null, box, margin: 1.2 }
}

function plateFrame(wasm: ManifoldToplevel, design: NameTagDesign, track: Tracker): PlateFrame {
    const fromTemplate = templateFrame(wasm, design, track)
    if (fromTemplate) return placeHole(wasm, design, fromTemplate, track)
    const { shape } = design.plate
    const d = design.hole.diameterMm
    const edge = Math.max(PRINT_RULES_DRAFT.holeEdgeMm, d * 0.45)
    const isCircle = shape === 'circle'
    const w = design.plate.widthMm
    const h = isCircle ? w : design.plate.heightMm
    const border = design.border ? PRINT_RULES_DRAFT.borderWidthMm + 0.6 : 0
    const margin = Math.max(1.5, Math.min(w, h) * 0.08) + border

    let plate: CrossSection
    if (isCircle) plate = track(wasm.CrossSection.circle(w / 2, 96))
    else if (shape === 'capsule') plate = roundedRect(wasm, w, h, h / 2, track)
    else if (shape === 'rect') plate = roundedRect(wasm, w, h, 0.8, track)
    else plate = roundedRect(wasm, w, h, Math.min(w, h) * 0.22, track)

    let hole: CrossSection | null = null
    let box = isCircle
        ? { x0: -w / 2 + margin, y0: -h * 0.34, x1: w / 2 - margin, y1: h * 0.34 }
        : { x0: -w / 2 + margin, y0: -h / 2 + margin, x1: w / 2 - margin, y1: h / 2 - margin }

    if (shape === 'outline') return { plate, hole: null, box, margin }
    if (design.hole.position === 'left') {
        const cx = isCircle ? -w / 2 + edge + d / 2 : -w / 2 + edge + d / 2 + (shape === 'capsule' ? h * 0.12 : 0)
        hole = track(track(wasm.CrossSection.circle(d / 2, 48)).translate(cx, 0))
        box = { ...box, x0: Math.max(box.x0, cx + d / 2 + edge) }
    } else if (design.hole.position === 'top') {
        const cy = h / 2 - edge - d / 2
        hole = track(track(wasm.CrossSection.circle(d / 2, 48)).translate(0, cy))
        box = { ...box, y1: Math.min(box.y1, cy - d / 2 - edge * 0.8) }
    }
    return { plate, hole, box, margin }
}

/** 템플릿 판의 경계 안쪽에 고리 구멍을 둔다. */
function placeHole(wasm: ManifoldToplevel, design: NameTagDesign, frame: PlateFrame, track: Tracker): PlateFrame {
    if (design.hole.position === 'none') return frame
    const d = design.hole.diameterMm
    const edge = Math.max(PRINT_RULES_DRAFT.holeEdgeMm, d * 0.45)
    const bounds = frame.plate.bounds()
    let { box } = frame
    let hole: CrossSection
    if (design.hole.position === 'left') {
        const cx = bounds.min[0] + edge + d / 2
        hole = track(track(wasm.CrossSection.circle(d / 2, 48)).translate(cx, (bounds.min[1] + bounds.max[1]) / 2))
        box = { ...box, x0: Math.max(box.x0, cx + d / 2 + edge) }
    } else {
        const cy = bounds.max[1] - edge - d / 2
        hole = track(track(wasm.CrossSection.circle(d / 2, 48)).translate((bounds.min[0] + bounds.max[0]) / 2, cy))
        box = { ...box, y1: Math.min(box.y1, cy - d / 2 - edge * 0.8) }
    }
    return { ...frame, hole, box }
}

type PlacedLine = {
    polygons: Polygon[]
    /** 자간 0 배치. 글자 외곽 판은 이 윤곽으로만 만들어 자간에 크기가 끌려가지 않는다 */
    platePolygons: Polygon[]
    heightMm: number
    shrunk: boolean
    index: number
}

/** 줄이 차지하는 높이 구간에서 쓸 수 있는 좌우 범위 */
type RangeFor = (yBottom: number, yTop: number) => [number, number]

/** 판 안쪽 영역을 가로로 잘라, 줄 위·아래 끝 중 좁은 쪽 폭을 쓴다 (원·캡슐 모서리 잘림 방지). */
function plateRange(wasm: ManifoldToplevel, inner: CrossSection, box: PlateFrame['box'], track: Tracker): RangeFor {
    const span = (box.x1 - box.x0) * 4 + 200
    const at = (y: number): [number, number] | null => {
        const band = track(track(wasm.CrossSection.square([span, 0.02], true)).translate(0, y))
        const cut = track(inner.intersect(band))
        if (cut.isEmpty()) return null
        const b = cut.bounds()
        return [b.min[0], b.max[0]]
    }
    return (yBottom, yTop) => {
        let x0 = box.x0
        let x1 = box.x1
        for (const y of [yBottom, (yBottom + yTop) / 2, yTop]) {
            const r = at(y)
            if (!r) continue
            x0 = Math.max(x0, r[0])
            x1 = Math.min(x1, r[1])
        }
        return x1 - x0 < 1 ? [box.x0, box.x1] : [x0, x1]
    }
}

function alignX(minX: number, maxX: number, rx0: number, rx1: number, align: NameTagDesign['align']): number {
    if (align === 'left') return rx0 - minX
    if (align === 'right') return rx1 - maxX
    return (rx0 + rx1) / 2 - (minX + maxX) / 2
}

function shiftPolys(polygons: Polygon[], dx: number, dy: number): Polygon[] {
    return polygons.map((poly) => poly.map(([x, y]) => [x + dx, y + dy] as [number, number]))
}

/** 줄마다 높이를 나눈다. 폭이 넘치면 자간을 뺀 글자 크기만 줄이고, 자간은 그 위에 더한다. */
function layoutLines(
    design: NameTagDesign,
    fonts: Map<NameTagFontId, Font>,
    box: PlateFrame['box'],
    rangeFor: RangeFor
): PlacedLine[] {
    const active = design.lines
        .map((line, index) => ({ ...line, text: line.text.replace(/\s+/g, ' ').trim(), index }))
        .filter((line) => line.text.length > 0)
    if (active.length === 0) return []

    const availH = Math.max(1, box.y1 - box.y0)
    const gapRatio = 0.22
    const totalSize = active.reduce((sum, line) => sum + line.size, 0)
    const avgSize = totalSize / active.length
    const unit = availH / (totalSize + gapRatio * avgSize * (active.length - 1))
    const gap = gapRatio * avgSize * unit

    const placed: PlacedLine[] = []
    let slotTop = box.y1
    for (const line of active) {
        const font = fonts.get(line.fontId)
        const slotH = line.size * unit
        if (!font) {
            slotTop -= slotH + gap
            continue
        }
        const ref = referenceBox(font)
        const refH = Math.max(0.1, ref.top - ref.bottom)
        const [rx0, rx1] = rangeFor(slotTop - slotH, slotTop)
        const availW = Math.max(1, rx1 - rx0)
        let emMm = slotH / refH
        let fitted = textOutline(font, line.text, emMm, 0)
        let shrunk = false
        if (fitted) {
            const inkW = fitted.bounds.maxX - fitted.bounds.minX
            if (inkW > availW) {
                emMm *= availW / inkW
                fitted = textOutline(font, line.text, emMm, 0)
                shrunk = true
            }
        }
        const spaced = fitted ? textOutline(font, line.text, emMm, design.letterSpacing) ?? fitted : null
        if (fitted && spaced) {
            const slotCenter = slotTop - slotH / 2
            const dy = slotCenter - ((ref.top + ref.bottom) / 2) * emMm
            const plateDx = alignX(fitted.bounds.minX, fitted.bounds.maxX, rx0, rx1, design.align)
            const textDx = alignX(spaced.bounds.minX, spaced.bounds.maxX, rx0, rx1, design.align)
            placed.push({
                polygons: shiftPolys(spaced.polygons, textDx, dy),
                platePolygons: shiftPolys(fitted.polygons, plateDx, dy),
                heightMm: refH * emMm,
                shrunk,
                index: line.index,
            })
        }
        slotTop -= slotH + gap
    }
    return placed
}

export function collectMissingGlyphs(design: NameTagDesign, fonts: Map<NameTagFontId, Font>): string[] {
    const missing = new Set<string>()
    for (const line of design.lines) {
        const font = fonts.get(line.fontId)
        if (!font) continue
        for (const char of missingGlyphs(font, line.text)) missing.add(char)
    }
    return [...missing]
}

/** 글자가 없으면 null. 만든 WASM 객체는 모두 해제한다. */
export function buildNameTag(
    wasm: ManifoldToplevel,
    design: NameTagDesign,
    fonts: Map<NameTagFontId, Font>
): NameTagBuildResult | null {
    const { CrossSection, Manifold } = wasm
    const owned: Array<{ delete(): void }> = []
    const track: Tracker = (obj) => {
        owned.push(obj)
        return obj
    }
    try {
        const issues: NameTagIssue[] = []
        const missing = collectMissingGlyphs(design, fonts)
        if (missing.length > 0) issues.push({ code: 'missing-glyph', level: 'error', chars: missing })

        const frame = plateFrame(wasm, design, track)
        const rangeFor: RangeFor =
            design.plate.shape === 'outline' && !design.baseId
                ? () => [frame.box.x0, frame.box.x1]
                : plateRange(wasm, track(frame.plate.offset(-frame.margin, 'Round')), frame.box, track)
        const lines = layoutLines(design, fonts, frame.box, rangeFor)
        if (lines.length === 0) return null

        const textPolys = lines.flatMap((line) => line.polygons)
        const rawText = track(new CrossSection(textPolys, 'NonZero'))
        if (rawText.isEmpty()) return null

        const T = design.plate.thicknessMm
        let plate = frame.plate
        if (design.plate.shape === 'outline' && !design.baseId) {
            const margin = Math.max(2, Math.min(...lines.map((l) => l.heightMm)) * 0.18) + (design.border ? 1.8 : 0)
            const closing = 3
            const plateInk = track(new CrossSection(lines.flatMap((line) => line.platePolygons), 'NonZero'))
            plate = track(track(plateInk.offset(margin + closing, 'Round', 2, 48)).offset(-closing, 'Round', 2, 48))
            const pieces = plate.decompose()
            pieces.forEach((piece) => track(piece))
            // 줄·단어 사이가 멀어 판이 여러 조각이면 감싸는 볼록 외곽으로 잇는다
            if (pieces.length > 1) plate = track(plate.hull())
            if (design.hole.position !== 'none') {
                const d = design.hole.diameterMm
                const edge = Math.max(PRINT_RULES_DRAFT.holeEdgeMm, d * 0.45)
                const b = plate.bounds()
                // 구멍이 글자 여백을 파고들지 않도록 판 가장자리 바깥쪽에 둔다
                const center: [number, number] =
                    design.hole.position === 'left'
                        ? [b.min[0] - d / 2 + 0.4, (b.min[1] + b.max[1]) / 2]
                        : [(b.min[0] + b.max[0]) / 2, b.max[1] + d / 2 - 0.4]
                const ringR = d / 2 + edge
                const tab = track(track(CrossSection.circle(ringR, 48)).translate(center))
                // 볼록 외곽은 경계 상자 모서리에서 멀 수 있으므로 가장 가까운 판 꼭짓점까지 다리를 놓는다
                let nearest: [number, number] = center
                let best = Infinity
                for (const poly of plate.toPolygons()) {
                    for (const [px, py] of poly) {
                        const dd = (px - center[0]) ** 2 + (py - center[1]) ** 2
                        if (dd < best) {
                            best = dd
                            nearest = [px, py]
                        }
                    }
                }
                const len = Math.sqrt(best) || 1
                const inward: [number, number] = [
                    nearest[0] + ((nearest[0] - center[0]) / len) * ringR,
                    nearest[1] + ((nearest[1] - center[1]) / len) * ringR,
                ]
                const anchor = track(track(CrossSection.circle(ringR, 48)).translate(inward))
                const bridge = track(CrossSection.hull([tab, anchor]))
                plate = track(CrossSection.union([plate, bridge]))
                frame.hole = track(track(CrossSection.circle(d / 2, 48)).translate(center))
            } else {
                frame.hole = null
            }
        }

        const plateWithHole = frame.hole ? track(plate.subtract(frame.hole)) : plate
        const textLimit = track(plateWithHole.offset(design.border ? -(PRINT_RULES_DRAFT.borderWidthMm + 0.4) : -0.4))
        const text = track(rawText.intersect(textLimit))
        const rawArea = rawText.area()
        const clipRatio = rawArea > 0 ? 1 - text.area() / rawArea : 0
        if (clipRatio > PRINT_RULES_DRAFT.clipAreaRatio) issues.push({ code: 'text-clipped', level: 'warn', ratio: clipRatio })

        const r = PRINT_RULES_DRAFT.minStrokeMm / 2
        const opened = track(track(text.offset(-r, 'Round', 2, 24)).offset(r, 'Round', 2, 24))
        const thinCs = track(text.subtract(opened))
        const thinRatio = text.area() > 0 ? thinCs.area() / text.area() : 0
        if (thinRatio > PRINT_RULES_DRAFT.thinAreaRatio) issues.push({ code: 'thin-stroke', level: 'warn', ratio: thinRatio })

        const minHeight = Math.min(...lines.map((l) => l.heightMm))
        if (minHeight < PRINT_RULES_DRAFT.minTextHeightMm) issues.push({ code: 'small-text', level: 'warn', heightMm: minHeight })
        for (const line of lines) if (line.shrunk) issues.push({ code: 'text-shrunk', level: 'info', lineIndex: line.index })

        const baseSolid = track(plateWithHole.extrude(T))
        const rim = design.border
            ? track(plateWithHole.subtract(track(plateWithHole.offset(-PRINT_RULES_DRAFT.borderWidthMm, 'Round'))))
            : null

        let base: Manifold
        let raised: Manifold | null = null
        let engraveFill: Manifold | null = null
        let thinTop = T
        if (design.relief.mode === 'engrave') {
            const depth = Math.min(design.relief.depthMm, T - PRINT_RULES_DRAFT.minFloorMm)
            const pocket = track(track(text.extrude(depth + 1)).translate(0, 0, T - depth))
            base = track(baseSolid.subtract(pocket))
            engraveFill = track(track(text.extrude(0.05)).translate(0, 0, T - depth))
            if (rim) raised = track(track(rim.extrude(design.relief.depthMm)).translate(0, 0, T))
        } else {
            base = baseSolid
            const top = rim ? track(CrossSection.union(text, rim)) : text
            raised = track(track(top.extrude(design.relief.depthMm)).translate(0, 0, T))
            thinTop = T + design.relief.depthMm
        }
        const thin =
            thinRatio > PRINT_RULES_DRAFT.thinAreaRatio
                ? track(track(thinCs.extrude(0.06)).translate(0, 0, thinTop + 0.01))
                : null

        const solid = raised ? track(Manifold.union(base, raised)) : base
        const status = solid.status()
        if (status !== 'NoError') issues.push({ code: 'not-manifold', level: 'error', status })
        const bodies = track(solid).decompose()
        bodies.forEach((body) => track(body))
        if (bodies.length > 1) issues.push({ code: 'multi-body', level: 'error', bodies: bodies.length })

        const box = solid.boundingBox()
        return {
            base: toMeshData(base),
            raised: raised ? toMeshData(raised) : null,
            engraveFill: engraveFill ? toMeshData(engraveFill) : null,
            thin: thin ? toMeshData(thin) : null,
            solid: toMeshData(solid),
            stats: {
                volumeMm3: solid.volume(),
                sizeMm: [box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]],
                triangles: solid.numTri(),
                bodies: bodies.length,
                status,
            },
            lines: lines.map((l) => ({ index: l.index, heightMm: l.heightMm, shrunk: l.shrunk })),
            issues,
        }
    } finally {
        const seen = new Set<{ delete(): void }>()
        for (const obj of owned) {
            if (seen.has(obj)) continue
            seen.add(obj)
            obj.delete()
        }
    }
}

/** 단일 메시를 바이너리 STL(mm)로 쓴다. */
export function meshToStl(mesh: MeshData): ArrayBuffer {
    const triCount = mesh.indices.length / 3
    const buffer = new ArrayBuffer(84 + triCount * 50)
    const view = new DataView(buffer)
    const header = 'WOW3D name tag'
    for (let i = 0; i < header.length; i++) view.setUint8(i, header.charCodeAt(i))
    view.setUint32(80, triCount, true)
    const p = mesh.positions
    let offset = 84
    for (let t = 0; t < triCount; t++) {
        const a = mesh.indices[t * 3] * 3
        const b = mesh.indices[t * 3 + 1] * 3
        const c = mesh.indices[t * 3 + 2] * 3
        const ux = p[b] - p[a]
        const uy = p[b + 1] - p[a + 1]
        const uz = p[b + 2] - p[a + 2]
        const vx = p[c] - p[a]
        const vy = p[c + 1] - p[a + 1]
        const vz = p[c + 2] - p[a + 2]
        let nx = uy * vz - uz * vy
        let ny = uz * vx - ux * vz
        let nz = ux * vy - uy * vx
        const len = Math.hypot(nx, ny, nz) || 1
        nx /= len
        ny /= len
        nz /= len
        for (const value of [nx, ny, nz]) {
            view.setFloat32(offset, value, true)
            offset += 4
        }
        for (const idx of [a, b, c]) {
            view.setFloat32(offset, p[idx], true)
            view.setFloat32(offset + 4, p[idx + 1], true)
            view.setFloat32(offset + 8, p[idx + 2], true)
            offset += 12
        }
        view.setUint16(offset, 0, true)
        offset += 2
    }
    return buffer
}
