/** opentype.js 2.x는 타입 선언을 포함하지 않는다. 이름표에서 쓰는 부분만 적는다. */
declare module 'opentype.js' {
    export type Font = {
        getPath: (text: string, x: number, y: number, fontSize: number) => GlyphPath
    }

    export type GlyphPath = {
        getBoundingBox: () => { x1: number; y1: number; x2: number; y2: number }
        toSVG: (options?: { decimalPlaces?: number; optimize?: boolean; flipY?: boolean }) => string
    }

    export function parse(buffer: ArrayBuffer | Uint8Array): Font
}
