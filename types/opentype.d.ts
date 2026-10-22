/** opentype.js 2.x는 타입 선언을 포함하지 않는다. 이름표에서 쓰는 부분만 적는다. */
declare module 'opentype.js' {
    export type PathCommand =
        | { type: 'M' | 'L'; x: number; y: number }
        | { type: 'Q'; x1: number; y1: number; x: number; y: number }
        | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
        | { type: 'Z' }

    export type GlyphPath = {
        commands: PathCommand[]
        getBoundingBox: () => { x1: number; y1: number; x2: number; y2: number }
        toSVG: (options?: { decimalPlaces?: number; optimize?: boolean; flipY?: boolean }) => string
    }

    export type Font = {
        unitsPerEm: number
        ascender: number
        descender: number
        getPath: (
            text: string,
            x: number,
            y: number,
            fontSize: number,
            options?: { kerning?: boolean; letterSpacing?: number }
        ) => GlyphPath
        charToGlyph: (char: string) => { unicode?: number | null; name?: string }
        names?: {
            fontFamily?: Record<string, string>
            fullName?: Record<string, string>
            postScriptName?: Record<string, string>
            [key: string]: unknown
        }
    }

    export function parse(buffer: ArrayBuffer | Uint8Array): Font
}
