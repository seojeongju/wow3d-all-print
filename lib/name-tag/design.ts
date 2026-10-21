/**
 * 이름표 디자인 모델 (버전 1).
 * 미리보기·STL·견적 전달·공유가 모두 이 JSON 하나를 입력으로 쓴다.
 */
import { isNameTagFontId, type NameTagFontId } from '@/lib/name-tag-fonts'

export const NAME_TAG_DESIGN_VERSION = 1

export const PLATE_SHAPES = ['rounded', 'capsule', 'rect', 'circle', 'outline'] as const
export type PlateShape = (typeof PLATE_SHAPES)[number]

export const HOLE_POSITIONS = ['left', 'top', 'none'] as const
export type HolePosition = (typeof HOLE_POSITIONS)[number]

export const RELIEF_MODES = ['emboss', 'engrave'] as const
export type ReliefMode = (typeof RELIEF_MODES)[number]

export const TEXT_ALIGNS = ['left', 'center', 'right'] as const
export type TextAlign = (typeof TEXT_ALIGNS)[number]

export const MAX_LINES = 3
export const MAX_LINE_CHARS = 24

export type NameTagLine = {
    text: string
    fontId: NameTagFontId
    /** 줄 높이 비율. 1이 기본, 다른 줄과의 상대 크기 */
    size: number
}

export type NameTagDesign = {
    version: typeof NAME_TAG_DESIGN_VERSION
    lines: NameTagLine[]
    align: TextAlign
    /** 자간 (em 비율, -0.05 ~ 0.3) */
    letterSpacing: number
    plate: {
        shape: PlateShape
        widthMm: number
        heightMm: number
        thicknessMm: number
    }
    hole: {
        position: HolePosition
        diameterMm: number
    }
    relief: {
        mode: ReliefMode
        /** 양각 높이 또는 음각 깊이 */
        depthMm: number
    }
    border: boolean
    colors: {
        plate: string
        text: string
    }
}

export const NAME_TAG_LIMITS = {
    widthMm: [25, 150],
    heightMm: [12, 100],
    thicknessMm: [1.6, 5],
    holeMm: [2.5, 8],
    depthMm: [0.4, 2],
    lineSize: [0.4, 1.6],
    letterSpacing: [-0.05, 0.3],
} as const

export const DEFAULT_NAME_TAG_DESIGN: NameTagDesign = {
    version: NAME_TAG_DESIGN_VERSION,
    lines: [{ text: '', fontId: 'gowun-dodum', size: 1 }],
    align: 'center',
    letterSpacing: 0,
    plate: { shape: 'rounded', widthMm: 60, heightMm: 24, thicknessMm: 2.4 },
    hole: { position: 'left', diameterMm: 4 },
    relief: { mode: 'emboss', depthMm: 1 },
    border: false,
    colors: { plate: '#f4f4f5', text: '#0f172a' },
}

function clamp(value: unknown, [min, max]: readonly [number, number], fallback: number): number {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
    return Math.min(max, Math.max(min, n))
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
    return allowed.includes(value as T) ? (value as T) : fallback
}

function color(value: unknown, fallback: string): string {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

/** 외부 입력(공유 링크·저장본·견적 전달)을 허용 범위 안의 디자인으로 바꾼다. */
export function normalizeNameTagDesign(raw: unknown): NameTagDesign {
    const d = DEFAULT_NAME_TAG_DESIGN
    type Loose = Record<string, unknown>
    const obj = (value: unknown): Loose => (value && typeof value === 'object' ? (value as Loose) : {})
    const input = obj(raw)
    const rawLines: unknown[] = Array.isArray(input.lines) ? input.lines.slice(0, MAX_LINES) : []
    const lines = rawLines.map((line) => {
        const l = (line && typeof line === 'object' ? line : {}) as Record<string, unknown>
        return {
            text: typeof l.text === 'string' ? l.text.slice(0, MAX_LINE_CHARS) : '',
            fontId: isNameTagFontId(l.fontId) ? l.fontId : d.lines[0].fontId,
            size: clamp(l.size, NAME_TAG_LIMITS.lineSize, 1),
        }
    })
    const plate = obj(input.plate)
    const hole = obj(input.hole)
    const relief = obj(input.relief)
    const colors = obj(input.colors)
    return {
        version: NAME_TAG_DESIGN_VERSION,
        lines: lines.length > 0 ? lines : d.lines,
        align: pick(input.align, TEXT_ALIGNS, d.align),
        letterSpacing: clamp(input.letterSpacing, NAME_TAG_LIMITS.letterSpacing, 0),
        plate: {
            shape: pick(plate.shape, PLATE_SHAPES, d.plate.shape),
            widthMm: clamp(plate.widthMm, NAME_TAG_LIMITS.widthMm, d.plate.widthMm),
            heightMm: clamp(plate.heightMm, NAME_TAG_LIMITS.heightMm, d.plate.heightMm),
            thicknessMm: clamp(plate.thicknessMm, NAME_TAG_LIMITS.thicknessMm, d.plate.thicknessMm),
        },
        hole: {
            position: pick(hole.position, HOLE_POSITIONS, d.hole.position),
            diameterMm: clamp(hole.diameterMm, NAME_TAG_LIMITS.holeMm, d.hole.diameterMm),
        },
        relief: {
            mode: pick(relief.mode, RELIEF_MODES, d.relief.mode),
            depthMm: clamp(relief.depthMm, NAME_TAG_LIMITS.depthMm, d.relief.depthMm),
        },
        border: input.border === true,
        colors: {
            plate: color(colors.plate, d.colors.plate),
            text: color(colors.text, d.colors.text),
        },
    }
}

export function nameTagHasText(design: NameTagDesign): boolean {
    return design.lines.some((line) => line.text.trim().length > 0)
}

export type NameTagPresetId = 'bag' | 'pet' | 'label' | 'desk' | 'badge'

/** 용도별 시작점. 문구는 비워 두고 판·구멍·줄 구성만 정한다. */
export const NAME_TAG_PRESETS: Record<NameTagPresetId, (fontId: NameTagFontId) => Partial<NameTagDesign>> = {
    bag: (fontId) => ({
        lines: [
            { text: '', fontId, size: 1 },
            { text: '', fontId, size: 0.6 },
        ],
        plate: { shape: 'capsule', widthMm: 60, heightMm: 30, thicknessMm: 2.4 },
        hole: { position: 'left', diameterMm: 4 },
    }),
    pet: (fontId) => ({
        lines: [
            { text: '', fontId, size: 1 },
            { text: '', fontId, size: 0.55 },
        ],
        plate: { shape: 'circle', widthMm: 32, heightMm: 32, thicknessMm: 2.4 },
        hole: { position: 'top', diameterMm: 3.5 },
    }),
    label: (fontId) => ({
        lines: [{ text: '', fontId, size: 1 }],
        plate: { shape: 'rect', widthMm: 50, heightMm: 16, thicknessMm: 1.8 },
        hole: { position: 'none', diameterMm: 4 },
    }),
    desk: (fontId) => ({
        lines: [
            { text: '', fontId, size: 1 },
            { text: '', fontId, size: 0.5 },
        ],
        plate: { shape: 'rounded', widthMm: 120, heightMm: 40, thicknessMm: 3 },
        hole: { position: 'none', diameterMm: 4 },
        border: true,
    }),
    badge: (fontId) => ({
        lines: [
            { text: '', fontId, size: 0.55 },
            { text: '', fontId, size: 1 },
        ],
        plate: { shape: 'rounded', widthMm: 70, heightMm: 30, thicknessMm: 2.4 },
        hole: { position: 'top', diameterMm: 4 },
        border: true,
    }),
}

/** 프리셋을 적용하되 이미 입력한 문구는 줄 순서대로 옮긴다. */
export function applyNameTagPreset(design: NameTagDesign, presetId: NameTagPresetId): NameTagDesign {
    const fontId = design.lines[0]?.fontId ?? DEFAULT_NAME_TAG_DESIGN.lines[0].fontId
    const preset = NAME_TAG_PRESETS[presetId](fontId)
    const lines = (preset.lines ?? design.lines).map((line, i) => ({
        ...line,
        text: design.lines[i]?.text ?? '',
        fontId: design.lines[i]?.fontId ?? line.fontId,
    }))
    return normalizeNameTagDesign({ ...design, ...preset, lines })
}
