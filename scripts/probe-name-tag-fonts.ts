/**
 * 이름표 후보 폰트의 가는 획 비율을 재본다.
 * 실행: npx tsx scripts/probe-name-tag-fonts.ts
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'opentype.js'
import { DEFAULT_NAME_TAG_DESIGN, normalizeNameTagDesign } from '../lib/name-tag/design'
import { buildNameTag, PRINT_RULES_DRAFT } from '../lib/name-tag/build'

async function main() {
    const { default: Module } = await import('manifold-3d/manifold.js')
    const wasm = await Module()
    wasm.setup()

    const dir = join(process.cwd(), 'public', 'fonts')
    const files = readdirSync(dir).filter((f) => f.endsWith('.ttf')).sort()
    const samples = ['서정주', '하준', 'WOW3D']

    console.log(`기준: thinAreaRatio > ${PRINT_RULES_DRAFT.thinAreaRatio} 이면 경고`)
    console.log('file\tthin%\tissues\tsamples')

    for (const file of files) {
        const bytes = readFileSync(join(dir, file))
        const font = parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
        const fonts = new Map([['probe', font]])
        let maxThin = 0
        const codes = new Set<string>()
        for (const text of samples) {
            const design = normalizeNameTagDesign({
                ...DEFAULT_NAME_TAG_DESIGN,
                lines: [{ text, fontId: 'probe', size: 1 }],
            })
            // normalize가 프리셋 id만 허용하므로 직접 덮어쓴다
            design.lines[0].fontId = 'probe'
            const result = buildNameTag(wasm, design, fonts as never)
            if (!result) continue
            for (const issue of result.issues) {
                codes.add(issue.code)
                if (issue.code === 'thin-stroke') maxThin = Math.max(maxThin, issue.ratio)
            }
        }
        const pct = (maxThin * 100).toFixed(1)
        const pass = maxThin <= PRINT_RULES_DRAFT.thinAreaRatio ? 'PASS' : 'THIN'
        console.log(`${pass}\t${pct}%\t${[...codes].join(',') || '-'}\t${file}`)
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
