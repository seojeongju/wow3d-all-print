/**
 * 이름표 형상 엔진 검사.
 * 프리셋 × 폰트 × 대표 문구 조합으로 단일 매니폴드·부피 일치·출력 검사를 확인한다.
 * 실행: npm run test:name-tag
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse, type Font } from 'opentype.js'
import { NAME_TAG_FONTS, type NameTagFontId } from '../lib/name-tag-fonts'
import {
    applyNameTagPreset,
    DEFAULT_NAME_TAG_DESIGN,
    NAME_TAG_PRESETS,
    normalizeNameTagDesign,
    type NameTagDesign,
    type NameTagPresetId,
} from '../lib/name-tag/design'
import { buildNameTag, meshToStl, type MeshData } from '../lib/name-tag/build'

const SAMPLES: Array<[string, string]> = [
    ['하준', '3학년 2반'],
    ['김와우', '010-1234-5678'],
    ['콩이', '보호자 연락처'],
    ['WOW3D', 'Maker Lab'],
    ['뷁똠햏', '쀍쀏'],
    ['이서윤', 'Seoyun Lee'],
    ['A-3', '공구함'],
    ['팀장 박지훈', '개발팀'],
    ['ㅇㅇ', '@#&'],
    ['가나다라마바사아자차카타파하', '긴 문구도 판에 맞게 줄어듭니다'],
]

/** STL 바이너리에서 부피를 다시 계산한다 (발산 정리) */
function stlVolume(buffer: ArrayBuffer): number {
    const view = new DataView(buffer)
    const count = view.getUint32(80, true)
    let volume = 0
    for (let t = 0; t < count; t++) {
        const o = 84 + t * 50 + 12
        const v = (k: number) => view.getFloat32(o + k * 4, true)
        const [ax, ay, az, bx, by, bz, cx, cy, cz] = [v(0), v(1), v(2), v(3), v(4), v(5), v(6), v(7), v(8)]
        volume += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6
    }
    return volume
}

function assertClosedMesh(mesh: MeshData, label: string) {
    const edges = new Map<string, number>()
    for (let t = 0; t < mesh.indices.length; t += 3) {
        for (let k = 0; k < 3; k++) {
            const a = mesh.indices[t + k]
            const b = mesh.indices[t + ((k + 1) % 3)]
            const key = `${a}>${b}`
            edges.set(key, (edges.get(key) ?? 0) + 1)
        }
    }
    for (const [key, count] of edges) {
        const [a, b] = key.split('>')
        assert.equal(count, 1, `${label}: 같은 방향 모서리 중복 ${key}`)
        assert.ok(edges.has(`${b}>${a}`), `${label}: 열린 모서리 ${key}`)
    }
}

async function main() {
    // manifold-3d는 ESM 전용이라 동적 import로 불러온다
    const { default: Module } = await import('manifold-3d/manifold.js')
    const wasm = await Module()
    wasm.setup()

    const fonts = new Map<NameTagFontId, Font>()
    for (const font of NAME_TAG_FONTS) {
        const bytes = readFileSync(join(process.cwd(), 'public', font.file))
        fonts.set(font.id, parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)))
    }

    const variants: Array<[string, (d: NameTagDesign) => NameTagDesign]> = [
        ['기본', (d) => d],
        ['음각', (d) => ({ ...d, relief: { mode: 'engrave', depthMm: 0.8 } })],
        ['글자외곽', (d) => ({ ...d, plate: { ...d.plate, shape: 'outline' } })],
        ['테두리', (d) => ({ ...d, border: true })],
    ]

    let cases = 0
    const warnings = new Map<string, number>()
    const missingByFont = new Map<string, Set<string>>()
    const started = Date.now()
    for (const presetId of Object.keys(NAME_TAG_PRESETS) as NameTagPresetId[]) {
        for (const font of NAME_TAG_FONTS) {
            for (const [first, second] of SAMPLES) {
                for (const [variantName, variant] of variants) {
                    const base = applyNameTagPreset(DEFAULT_NAME_TAG_DESIGN, presetId)
                    const withText = normalizeNameTagDesign({
                        ...base,
                        lines: base.lines.map((line, i) => ({
                            ...line,
                            fontId: font.id,
                            text: i === 0 ? first : i === 1 ? second : '',
                        })),
                    })
                    const design = normalizeNameTagDesign(variant(withText))
                    const label = `${presetId}/${font.id}/${first}/${variantName}`
                    const result = buildNameTag(wasm, design, fonts)
                    assert.ok(result, `${label}: 결과 없음`)
                    assert.equal(result.stats.status, 'NoError', `${label}: 매니폴드 오류`)
                    assert.equal(result.stats.bodies, 1, `${label}: 덩어리 ${result.stats.bodies}개`)
                    assertClosedMesh(result.solid, label)
                    const stl = meshToStl(result.solid)
                    const vol = stlVolume(stl)
                    const diff = Math.abs(vol - result.stats.volumeMm3) / result.stats.volumeMm3
                    assert.ok(diff < 0.01, `${label}: 부피 차이 ${(diff * 100).toFixed(2)}%`)
                    for (const issue of result.issues) {
                        if (issue.code === 'missing-glyph') {
                            const key = `${font.id}`
                            const set = missingByFont.get(key) ?? new Set<string>()
                            issue.chars.forEach((c) => set.add(c))
                            missingByFont.set(key, set)
                        } else {
                            assert.notEqual(issue.level, 'error', `${label}: ${issue.code}`)
                            assert.notEqual(issue.code, 'text-clipped', `${label}: 자동 배치한 글자가 판에 잘림`)
                        }
                        warnings.set(issue.code, (warnings.get(issue.code) ?? 0) + 1)
                    }
                    cases++
                }
            }
        }
    }

    // 폰트에 없는 글자는 오류로 잡아야 한다
    const emoji = buildNameTag(
        wasm,
        normalizeNameTagDesign({ ...DEFAULT_NAME_TAG_DESIGN, lines: [{ text: '하준🐶', fontId: 'jua', size: 1 }] }),
        fonts
    )
    assert.ok(emoji?.issues.some((i) => i.code === 'missing-glyph'), '없는 글자 미검출')

    // 작은 판 + 세 줄은 작은 글자·가는 획 경고가 나와야 한다
    const tiny = buildNameTag(
        wasm,
        normalizeNameTagDesign({
            ...DEFAULT_NAME_TAG_DESIGN,
            plate: { shape: 'rect', widthMm: 25, heightMm: 12, thicknessMm: 2 },
            lines: [
                { text: '김와우', fontId: 'gowun-dodum', size: 1 },
                { text: '3학년 2반', fontId: 'gowun-dodum', size: 1 },
                { text: '010-1234-5678', fontId: 'gowun-dodum', size: 1 },
            ],
        }),
        fonts
    )
    assert.ok(tiny?.issues.some((i) => i.code === 'small-text'), '작은 글자 미검출')
    assert.ok(tiny?.issues.some((i) => i.code === 'thin-stroke'), '가는 획 미검출')

    console.log(`✅ 이름표 형상 ${cases}건 통과 (${((Date.now() - started) / 1000).toFixed(1)}초)`)
    console.log('   경고 집계:', Object.fromEntries(warnings))
    for (const [fontId, chars] of missingByFont) console.log(`   ${fontId} 폰트에 없는 글자: ${[...chars].join(' ')}`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
