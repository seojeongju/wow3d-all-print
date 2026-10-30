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
    /** 양각 글자. 없으면 null */
    raised: MeshData | null
    /** 테두리. 판 색으로 그린다. 없으면 null */
    rim: MeshData | null
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

/** 고리의 부호 있는 면적과 무게중심. 귀처럼 얇은 부분은 가운데를 조금만 끌어올린다. */
function ringCentroid(ring: [number, number][]): { area: number; center: [number, number] } | null {
    let twice = 0
    let cx = 0
    let cy = 0
    for (let i = 0; i < ring.length; i++) {
        const [x1, y1] = ring[i]
        const [x2, y2] = ring[(i + 1) % ring.length]
        const cross = x1 * y2 - x2 * y1
        twice += cross
        cx += (x1 + x2) * cross
        cy += (y1 + y2) * cross
    }
    const area = twice / 2
    if (Math.abs(area) < 1e-4) return null
    return { area, center: [cx / (3 * twice), cy / (3 * twice)] }
}

function plateCoversPoint(
    wasm: ManifoldToplevel,
    plate: CrossSection,
    x: number,
    y: number,
    track: Tracker
): boolean {
    const probe = track(track(wasm.CrossSection.square([0.45, 0.45], true)).translate(x, y))
    const hit = track(plate.intersect(probe))
    return hit.area() > 0.02
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
    let box = {
        x0: Math.min(topLeft[0], bottomRight[0]),
        y0: Math.min(topLeft[1], bottomRight[1]),
        x1: Math.max(topLeft[0], bottomRight[0]),
        y1: Math.max(topLeft[1], bottomRight[1]),
    }
    // 베이스를 바꾸면 글자 칸을 실루엣 가운데로 옮긴다. 가운데가 구멍이면 이름 칸 중심을 쓴다.
    let centroid: [number, number] | null = null
    let bestArea = 0
    for (const ring of rings) {
        const found = ringCentroid(ring)
        if (!found || Math.abs(found.area) <= bestArea) continue
        bestArea = Math.abs(found.area)
        centroid = found.center
    }
    const nameCenter = toMm(nx + nw / 2, ny + nh / 2)
    // 반려동물 판은 이름 칸을 실루엣의 빈 자리에 맞춰 두었다. 무게중심은 구멍 위로 갈 수 있다.
    const anchor =
        template.set === 'pet'
            ? nameCenter
            : centroid && plateCoversPoint(wasm, plate, centroid[0], centroid[1], track)
              ? centroid
              : nameCenter
    const width = box.x1 - box.x0
    const height = box.y1 - box.y0
    const bounds = plate.bounds()
    const margin = 1.2
    const halfW = width / 2
    const halfH = height / 2
    const cx = Math.min(bounds.max[0] - margin - halfW, Math.max(bounds.min[0] + margin + halfW, anchor[0]))
    const cy = Math.min(bounds.max[1] - margin - halfH, Math.max(bounds.min[1] + margin + halfH, anchor[1]))
    box = { x0: cx - halfW, y0: cy - halfH, x1: cx + halfW, y1: cy + halfH }
    return { plate, hole: null, box, margin: 1.2 }
}

function plateFrame(wasm: ManifoldToplevel, design: NameTagDesign, track: Tracker): PlateFrame {
    const fromTemplate = templateFrame(wasm, design, track)
    if (fromTemplate) return attachHole(wasm, design, fromTemplate, track)
    const { shape } = design.plate
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

    const box = isCircle
        ? { x0: -w / 2 + margin, y0: -h * 0.34, x1: w / 2 - margin, y1: h * 0.34 }
        : { x0: -w / 2 + margin, y0: -h / 2 + margin, x1: w / 2 - margin, y1: h / 2 - margin }

    if (shape === 'outline') return { plate, hole: null, box, margin }
    return attachHole(wasm, design, { plate, hole: null, box, margin }, track)
}

/** 구멍 중심이 판 안쪽(가장자리 여유 포함)에 있는지 본다. */
function insideSection(wasm: ManifoldToplevel, section: CrossSection, x: number, y: number, track: Tracker): boolean {
    const dot = track(track(wasm.CrossSection.circle(0.08, 6)).translate(x, y))
    return track(section.intersect(dot)).area() > 1e-4
}

/** 여유를 둔 안쪽 경계에서 왼쪽·위쪽에 가장 가까운 점을 고른다. */
function edgePoint(section: CrossSection, which: 'left' | 'top'): [number, number] | null {
    const bounds = section.bounds()
    const midX = (bounds.min[0] + bounds.max[0]) / 2
    const midY = (bounds.min[1] + bounds.max[1]) / 2
    let best: [number, number] | null = null
    let bestScore = Infinity
    for (const poly of section.toPolygons()) {
        for (const [x, y] of poly) {
            const score = which === 'left' ? (x - bounds.min[0]) * 10 + Math.abs(y - midY) : (bounds.max[1] - y) * 10 + Math.abs(x - midX)
            if (score < bestScore) {
                bestScore = score
                best = [x, y]
            }
        }
    }
    return best
}

/** 글자 칸이 구멍과 겹치면, 칸을 가장 적게 줄이는 쪽으로 밀어 낸다. */
function avoidHole(
    box: PlateFrame['box'],
    cx: number,
    cy: number,
    reach: number
): PlateFrame['box'] {
    if (cx + reach <= box.x0 || cx - reach >= box.x1 || cy + reach <= box.y0 || cy - reach >= box.y1) return box
    const options = [
        { ...box, x0: Math.max(box.x0, cx + reach) },
        { ...box, x1: Math.min(box.x1, cx - reach) },
        { ...box, y0: Math.max(box.y0, cy + reach) },
        { ...box, y1: Math.min(box.y1, cy - reach) },
    ]
    let best = box
    let bestArea = -1
    for (const candidate of options) {
        const width = candidate.x1 - candidate.x0
        const height = candidate.y1 - candidate.y0
        if (width < 4 || height < 3) continue
        const area = width * height
        if (area > bestArea) {
            bestArea = area
            best = candidate
        }
    }
    return best
}

/**
 * 클릭 좌표가 판 밖이면 경계까지만 들인다. 안쪽 여백까지 끌어당기지 않는다.
 */
function customCenter(
    wasm: ManifoldToplevel,
    plate: CrossSection,
    desired: [number, number],
    track: Tracker
): [number, number] | null {
    if (insideSection(wasm, plate, desired[0], desired[1], track)) return desired
    const bounds = plate.bounds()
    const ax = (bounds.min[0] + bounds.max[0]) / 2
    const ay = (bounds.min[1] + bounds.max[1]) / 2
    if (!insideSection(wasm, plate, ax, ay, track)) return edgePoint(plate, 'left')
    let lo = 0
    let hi = 1
    for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2
        const x = desired[0] * (1 - mid) + ax * mid
        const y = desired[1] * (1 - mid) + ay * mid
        if (insideSection(wasm, plate, x, y, track)) hi = mid
        else lo = mid
    }
    return [desired[0] * (1 - hi) + ax * hi, desired[1] * (1 - hi) + ay * hi]
}

/**
 * 고리 구멍을 판에 뚫는다.
 * 왼쪽·위는 실루엣 안쪽 여유에서 고르고, 클릭 위치는 누른 좌표 그대로 둔다.
 */
function attachHole(wasm: ManifoldToplevel, design: NameTagDesign, frame: PlateFrame, track: Tracker): PlateFrame {
    if (design.hole.position === 'none') return frame
    const radius = design.hole.diameterMm / 2
    const clearance = Math.max(PRINT_RULES_DRAFT.holeEdgeMm, radius * 0.9)

    let center: [number, number] | null = null
    if (design.hole.position === 'custom') {
        if (design.hole.xMm == null || design.hole.yMm == null) return frame
        center = customCenter(wasm, frame.plate, [design.hole.xMm, design.hole.yMm], track)
    } else {
        const inset = track(frame.plate.offset(-(radius + clearance)))
        if (inset.isEmpty()) return { ...frame, hole: null }
        center = edgePoint(inset, design.hole.position === 'top' ? 'top' : 'left')
    }
    if (!center) return { ...frame, hole: null }

    const hole = track(track(wasm.CrossSection.circle(radius, 48)).translate(center[0], center[1]))
    return { ...frame, hole, box: avoidHole(frame.box, center[0], center[1], radius + clearance) }
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

/** 폰트에 없는 글자는 빼고, 남는 글자만 윤곽으로 쓴다. */
function drawableText(font: Font, text: string): string {
    const missing = new Set(missingGlyphs(font, text))
    if (missing.size === 0) return text
    return [...text]
        .filter((char) => char.trim() === '' || !missing.has(char))
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
}

type PlateLimit = { minX: number; maxX: number; minY: number; maxY: number }

function inkBounds(polygons: Polygon[]): { minX: number; maxX: number; minY: number; maxY: number } | null {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const poly of polygons) {
        for (const [x, y] of poly) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
    }
    if (!Number.isFinite(minX)) return null
    return { minX, maxX, minY, maxY }
}

function shiftPlaced(lines: PlacedLine[], dx: number, dy: number): PlacedLine[] {
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return lines
    return lines.map((line) => ({
        ...line,
        polygons: shiftPolys(line.polygons, dx, dy),
        platePolygons: shiftPolys(line.platePolygons, dx, dy),
    }))
}

/** 요청한 이동이 판 밖으로 나가면, 글자가 판 안에 남는 만큼만 옮긴다. */
function clampTextOffset(lines: PlacedLine[], dx: number, dy: number, limit: PlateLimit): [number, number] {
    const bounds = inkBounds(lines.flatMap((line) => line.polygons))
    if (!bounds) return [0, 0]
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY
    const limitW = limit.maxX - limit.minX
    const limitH = limit.maxY - limit.minY
    let x = dx
    let y = dy
    if (width >= limitW - 0.05) {
        x = (limit.minX + limit.maxX) / 2 - (bounds.minX + bounds.maxX) / 2
    } else {
        if (bounds.minX + x < limit.minX) x = limit.minX - bounds.minX
        if (bounds.maxX + x > limit.maxX) x = limit.maxX - bounds.maxX
    }
    if (height >= limitH - 0.05) {
        y = (limit.minY + limit.maxY) / 2 - (bounds.minY + bounds.maxY) / 2
    } else {
        if (bounds.minY + y < limit.minY) y = limit.minY - bounds.minY
        if (bounds.maxY + y > limit.maxY) y = limit.maxY - bounds.maxY
    }
    return [x, y]
}

/**
 * 글자 크기 1은 이름 칸에 맞는 크기이고, 슬라이더 값은 그 배율이다.
 * 칸보다 커져도 판 안쪽까지는 키우고, 그 다음에 위치를 옮긴다.
 */
function layoutLines(
    design: NameTagDesign,
    fonts: Map<NameTagFontId, Font>,
    box: PlateFrame['box'],
    rangeFor: RangeFor,
    plateLimit: PlateLimit
): PlacedLine[] {
    const active = design.lines
        .map((line, index) => {
            const text = line.text.replace(/\s+/g, ' ').trim()
            const font = fonts.get(line.fontId)
            return { ...line, text: font ? drawableText(font, text) : text, index }
        })
        .filter((line) => line.text.length > 0)
    if (active.length === 0) return []

    const availH = Math.max(1, box.y1 - box.y0)
    const gapRatio =
        typeof design.lineGap === 'number' && Number.isFinite(design.lineGap)
            ? Math.min(0.55, Math.max(0.05, design.lineGap))
            : 0.22
    const count = active.length
    const unit = availH / (count + gapRatio * (count - 1))
    const [boxX0, boxX1] = rangeFor(box.y0, box.y1)
    const availW = Math.max(1, boxX1 - boxX0)

    const measured: Array<{
        line: (typeof active)[number]
        font: Font
        em: number
        refH: number
        refMid: number
    }> = []
    for (const line of active) {
        const font = fonts.get(line.fontId)
        if (!font) continue
        const ref = referenceBox(font)
        const refH = Math.max(0.1, ref.top - ref.bottom)
        let em = unit / refH
        const fitted = textOutline(font, line.text, em, 0)
        if (fitted) {
            const inkW = fitted.bounds.maxX - fitted.bounds.minX
            if (inkW > availW && inkW > 0) em *= availW / inkW
        }
        em *= line.size
        measured.push({ line, font, em, refH, refMid: (ref.top + ref.bottom) / 2 })
    }
    if (measured.length === 0) return []

    const sizeScale = measured.reduce((sum, item) => sum + item.line.size, 0) / measured.length
    let gap = gapRatio * unit * sizeScale
    let blockH = measured.reduce((sum, item) => sum + item.refH * item.em, 0) + gap * (measured.length - 1)
    let blockW = 0
    for (const item of measured) {
        const outline = textOutline(item.font, item.line.text, item.em, 0)
        const inkW = outline ? outline.bounds.maxX - outline.bounds.minX : 0
        if (inkW > blockW) blockW = inkW
    }
    const plateW = Math.max(1, plateLimit.maxX - plateLimit.minX)
    const plateH = Math.max(1, plateLimit.maxY - plateLimit.minY)
    let fit = 1
    if (blockW > plateW) fit = Math.min(fit, plateW / blockW)
    if (blockH > plateH) fit = Math.min(fit, plateH / blockH)
    if (fit < 1) {
        for (const item of measured) item.em *= fit
        gap *= fit
        blockH *= fit
    }

    const placed: PlacedLine[] = []
    const slack = availH - blockH
    let slotTop = box.y1 - slack / 2
    for (const item of measured) {
        const slotH = item.refH * item.em
        let [rx0, rx1] = rangeFor(slotTop - slotH, slotTop)
        if (rx1 - rx0 < 1) {
            rx0 = boxX0
            rx1 = boxX1
        }
        const lineAlign = item.line.align ?? design.align
        const lineSpacing =
            item.line.letterSpacing != null && Number.isFinite(item.line.letterSpacing)
                ? Number(item.line.letterSpacing)
                : design.letterSpacing
        const fitted = textOutline(item.font, item.line.text, item.em, 0)
        const spaced = fitted ? textOutline(item.font, item.line.text, item.em, lineSpacing) ?? fitted : null
        if (fitted && spaced) {
            const slotCenter = slotTop - slotH / 2
            const dy = slotCenter - item.refMid * item.em
            const plateDx = alignX(fitted.bounds.minX, fitted.bounds.maxX, rx0, rx1, lineAlign)
            const textDx = alignX(spaced.bounds.minX, spaced.bounds.maxX, rx0, rx1, lineAlign)
            placed.push({
                polygons: shiftPolys(spaced.polygons, textDx, dy),
                platePolygons: shiftPolys(fitted.polygons, plateDx, dy),
                heightMm: item.refH * item.em,
                shrunk: fit < 0.995,
                index: item.line.index,
            })
        }
        slotTop -= slotH + gap
    }

    const [dx, dy] = clampTextOffset(placed, design.textArea.xMm, design.textArea.yMm, plateLimit)
    return shiftPlaced(placed, dx, dy)
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

/** 그릴 글자가 없어도 판은 돌려준다. 만든 WASM 객체는 모두 해제한다. */
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
        const textBox = frame.box
        const plateBounds = frame.plate.bounds()
        const inset = Math.max(frame.margin, 1.2)
        const plateLimit: PlateLimit = {
            minX: plateBounds.min[0] + inset,
            maxX: plateBounds.max[0] - inset,
            minY: plateBounds.min[1] + inset,
            maxY: plateBounds.max[1] - inset,
        }

        const rangeFor: RangeFor =
            design.plate.shape === 'outline' && !design.baseId
                ? () => [textBox.x0, textBox.x1]
                : plateRange(wasm, track(frame.plate.offset(-frame.margin, 'Round')), textBox, track)
        const lines = layoutLines(design, fonts, textBox, rangeFor, plateLimit)
        const textPolys = lines.flatMap((line) => line.polygons)
        if (textPolys.length === 0) {
            const plateWithHole = frame.hole ? track(frame.plate.subtract(frame.hole)) : frame.plate
            const baseSolid = track(plateWithHole.extrude(design.plate.thicknessMm))
            let rimMesh: Manifold | null = null
            if (design.border) {
                const rim = track(plateWithHole.subtract(track(plateWithHole.offset(-PRINT_RULES_DRAFT.borderWidthMm, 'Round'))))
                rimMesh = track(track(rim.extrude(design.relief.depthMm)).translate(0, 0, design.plate.thicknessMm))
            }
            const solid = rimMesh ? track(Manifold.union(baseSolid, rimMesh)) : baseSolid
            const status = solid.status()
            if (status !== 'NoError') issues.push({ code: 'not-manifold', level: 'error', status })
            const bodies = track(solid).decompose()
            bodies.forEach((body) => track(body))
            if (bodies.length > 1) issues.push({ code: 'multi-body', level: 'error', bodies: bodies.length })
            const box = solid.boundingBox()
            return {
                base: toMeshData(baseSolid),
                raised: null,
                rim: rimMesh ? toMeshData(rimMesh) : null,
                engraveFill: null,
                thin: null,
                solid: toMeshData(solid),
                stats: {
                    volumeMm3: solid.volume(),
                    sizeMm: [box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]] as [number, number, number],
                    triangles: solid.numTri(),
                    bodies: bodies.length,
                    status,
                },
                lines: [],
                issues,
            }
        }

        const rawText = track(new CrossSection(textPolys, 'NonZero'))

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
            if (design.hole.position === 'custom') {
                const fitted = attachHole(wasm, design, { ...frame, plate, hole: null }, track)
                frame.hole = fitted.hole
            } else if (design.hole.position !== 'none') {
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
        let rimMesh: Manifold | null = null
        let engraveFill: Manifold | null = null
        let thinTop = T
        if (rim) rimMesh = track(track(rim.extrude(design.relief.depthMm)).translate(0, 0, T))
        if (design.relief.mode === 'engrave') {
            const depth = Math.min(design.relief.depthMm, T - PRINT_RULES_DRAFT.minFloorMm)
            const pocket = track(track(text.extrude(depth + 1)).translate(0, 0, T - depth))
            base = track(baseSolid.subtract(pocket))
            engraveFill = track(track(text.extrude(0.05)).translate(0, 0, T - depth))
        } else {
            base = baseSolid
            raised = track(track(text.extrude(design.relief.depthMm)).translate(0, 0, T))
            thinTop = T + design.relief.depthMm
        }
        const thin =
            thinRatio > PRINT_RULES_DRAFT.thinAreaRatio
                ? track(track(thinCs.extrude(0.06)).translate(0, 0, thinTop + 0.01))
                : null

        let solid = base
        if (raised) solid = track(Manifold.union(solid, raised))
        if (rimMesh) solid = track(Manifold.union(solid, rimMesh))
        const status = solid.status()
        if (status !== 'NoError') issues.push({ code: 'not-manifold', level: 'error', status })
        const bodies = track(solid).decompose()
        bodies.forEach((body) => track(body))
        if (bodies.length > 1) issues.push({ code: 'multi-body', level: 'error', bodies: bodies.length })

        const box = solid.boundingBox()
        return {
            base: toMeshData(base),
            raised: raised ? toMeshData(raised) : null,
            rim: rimMesh ? toMeshData(rimMesh) : null,
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
    const header = 'WOW3D Name Tag Studio'
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
