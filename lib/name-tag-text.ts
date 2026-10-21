/**
 * 한글·영문 문구를 폰트 윤곽(path)으로 바꿉니다.
 * 이미지 트레이싱은 획이 뭉개져 글자가 막대로 보입니다.
 */
import { parse, type Font } from 'opentype.js'
import { getNameTagFont, type NameTagFontId } from '@/lib/name-tag-fonts'

const fontPromises = new Map<NameTagFontId, Promise<Font>>()

function loadFont(fontId: NameTagFontId): Promise<Font> {
    const cached = fontPromises.get(fontId)
    if (cached) return cached
    const pending = fetch(getNameTagFont(fontId).file)
        .then(async (res) => {
            if (!res.ok) throw new Error('폰트를 불러오지 못했습니다')
            return parse(await res.arrayBuffer())
        })
        .catch((error: unknown) => {
            fontPromises.delete(fontId)
            throw error
        })
    fontPromises.set(fontId, pending)
    return pending
}

function missingGlyphs(font: Font, text: string): string[] {
    const missing: string[] = []
    for (const char of text) {
        if (char === ' ') continue
        const glyph = font.charToGlyph(char)
        if (!glyph || glyph.name === '.notdef' || glyph.unicode == null) missing.push(char)
    }
    return [...new Set(missing)]
}

export type RenderedNameLine = {
    svg: string
    missing: string[]
}

/** 최대 24자. 비어 있으면 null */
export async function renderNameSvg(name: string, fontId: NameTagFontId): Promise<RenderedNameLine | null> {
    const text = name.replace(/\s+/g, ' ').trim().slice(0, 24)
    if (!text) return null

    const font = await loadFont(fontId)
    const fontSize = 80
    const path = font.getPath(text, 0, 0, fontSize)
    const box = path.getBoundingBox()
    const width = Math.max(1, box.x2 - box.x1)
    const height = Math.max(1, box.y2 - box.y1)
    const pad = fontSize * 0.04
    const pathSvg = path.toSVG({ decimalPlaces: 2, optimize: false, flipY: false })
    return {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" data-glyph="1" viewBox="${box.x1 - pad} ${box.y1 - pad} ${width + pad * 2} ${height + pad * 2}">${pathSvg}</svg>`,
        missing: missingGlyphs(font, text),
    }
}
