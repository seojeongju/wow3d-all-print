/**
 * 폰트 윤곽 → mm 단위 다각형.
 * 구멍(ㅇ·ㅁ 안쪽 등)은 윤곽 방향으로 표현되므로 NonZero 채움 규칙으로 해석한다.
 */
import type { Font, PathCommand } from 'opentype.js'

export type Vec2 = [number, number]
export type Polygon = Vec2[]

/** 곡선을 나눌 때 허용하는 최대 직선 오차(mm) */
const CURVE_TOLERANCE_MM = 0.05

function segmentsFor(length: number): number {
    return Math.min(24, Math.max(2, Math.ceil(Math.sqrt(length / CURVE_TOLERANCE_MM))))
}

function dist(ax: number, ay: number, bx: number, by: number): number {
    return Math.hypot(bx - ax, by - ay)
}

/** opentype 경로(y 아래 방향)를 y 위 방향 다각형으로 바꾼다. */
export function commandsToPolygons(commands: PathCommand[]): Polygon[] {
    const polygons: Polygon[] = []
    let current: Polygon = []
    let x = 0
    let y = 0
    const push = (px: number, py: number) => {
        const last = current[current.length - 1]
        if (last && Math.abs(last[0] - px) < 1e-6 && Math.abs(last[1] + py) < 1e-6) return
        current.push([px, -py])
    }
    const close = () => {
        if (current.length >= 3) {
            const first = current[0]
            const last = current[current.length - 1]
            if (Math.abs(first[0] - last[0]) < 1e-6 && Math.abs(first[1] - last[1]) < 1e-6) current.pop()
            if (current.length >= 3) polygons.push(current)
        }
        current = []
    }
    for (const cmd of commands) {
        switch (cmd.type) {
            case 'M':
                close()
                x = cmd.x
                y = cmd.y
                push(x, y)
                break
            case 'L':
                x = cmd.x
                y = cmd.y
                push(x, y)
                break
            case 'Q': {
                const n = segmentsFor(dist(x, y, cmd.x1, cmd.y1) + dist(cmd.x1, cmd.y1, cmd.x, cmd.y))
                for (let i = 1; i <= n; i++) {
                    const t = i / n
                    const u = 1 - t
                    push(u * u * x + 2 * u * t * cmd.x1 + t * t * cmd.x, u * u * y + 2 * u * t * cmd.y1 + t * t * cmd.y)
                }
                x = cmd.x
                y = cmd.y
                break
            }
            case 'C': {
                const n = segmentsFor(
                    dist(x, y, cmd.x1, cmd.y1) + dist(cmd.x1, cmd.y1, cmd.x2, cmd.y2) + dist(cmd.x2, cmd.y2, cmd.x, cmd.y)
                )
                for (let i = 1; i <= n; i++) {
                    const t = i / n
                    const u = 1 - t
                    push(
                        u * u * u * x + 3 * u * u * t * cmd.x1 + 3 * u * t * t * cmd.x2 + t * t * t * cmd.x,
                        u * u * u * y + 3 * u * u * t * cmd.y1 + 3 * u * t * t * cmd.y2 + t * t * t * cmd.y
                    )
                }
                x = cmd.x
                y = cmd.y
                break
            }
            case 'Z':
                close()
                break
        }
    }
    close()
    return polygons
}

export type TextOutline = {
    polygons: Polygon[]
    /** 잉크 경계 (mm, y 위 방향, 기준선 y=0) */
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

/** emMm 크기로 문구 윤곽을 만든다. 글자가 없으면 null */
export function textOutline(font: Font, text: string, emMm: number, letterSpacing = 0): TextOutline | null {
    const path = font.getPath(text, 0, 0, emMm, { kerning: true, letterSpacing })
    const polygons = commandsToPolygons(path.commands)
    if (polygons.length === 0) return null
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const poly of polygons) {
        for (const [px, py] of poly) {
            if (px < minX) minX = px
            if (px > maxX) maxX = px
            if (py < minY) minY = py
            if (py > maxY) maxY = py
        }
    }
    return { polygons, bounds: { minX, minY, maxX, maxY } }
}

const referenceCache = new WeakMap<Font, { top: number; bottom: number }>()

/**
 * 줄 높이 기준(1em당). 한글·영문 대문자 높이를 기준으로 잡아
 * 글자 구성과 관계없이 같은 크기로 보이게 한다.
 */
export function referenceBox(font: Font): { top: number; bottom: number } {
    const cached = referenceCache.get(font)
    if (cached) return cached
    const outline = textOutline(font, '한H', 1)
    const box = outline
        ? { top: outline.bounds.maxY, bottom: outline.bounds.minY }
        : { top: font.ascender / font.unitsPerEm, bottom: 0 }
    referenceCache.set(font, box)
    return box
}

export function missingGlyphs(font: Font, text: string): string[] {
    const missing: string[] = []
    for (const char of text) {
        if (char.trim() === '') continue
        const glyph = font.charToGlyph(char)
        // 한글 폰트는 글자 이름이 전부 .notdef인 경우가 있어, 없는 글자는 0번 글리프로만 본다.
        if (!glyph || glyph.index === 0 || glyph.unicode == null) missing.push(char)
    }
    return [...new Set(missing)]
}
