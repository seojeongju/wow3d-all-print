/**
 * public/반려동물베이스 의 PNG 실루엣을 반려동물 이름표 베이스로 만든다.
 * 검은 픽셀이 판이고, 안쪽 투명 영역은 구멍이다.
 * 실행: node scripts/build-pet-png-bases.mjs
 * 결과: public/반려동물 템플릿/*.svg, templates.json, lib/name-tag/template-plates.json 의 pet
 */
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const SOURCE = join(ROOT, 'public', '반려동물베이스')
const DIR = join(ROOT, 'public', '반려동물 템플릿')
const PAPER = '#f3f1ec'
const INK = '#161616'
const TRACE = 420

const NAMES = [
    ['01', '하트 발바닥', '01_하트발바닥.svg'],
    ['02', '뼈 발바닥', '02_뼈발바닥.svg'],
    ['03', '발바닥 뼈', '03_발바닥뼈.svg'],
    ['04', '위 고리', '04_위고리.svg'],
    ['05', '발바닥', '05_발바닥.svg'],
    ['06', '마름모', '06_마름모.svg'],
    ['07', '원형', '07_원형.svg'],
    ['08', '별', '08_별.svg'],
]

function sourceFiles() {
    const files = readdirSync(SOURCE).filter((name) => name.toLowerCase().endsWith('.png'))
    files.sort((a, b) => {
        const na = Number(a.match(/\((\d+)\)/)?.[1] ?? 0)
        const nb = Number(b.match(/\((\d+)\)/)?.[1] ?? 0)
        return na - nb
    })
    if (files.length !== NAMES.length) {
        throw new Error(`PNG ${files.length}개, 기대 ${NAMES.length}개`)
    }
    return files
}

function ringArea(ring) {
    let area = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
    }
    return area / 2
}

function distToSeg(p, a, b) {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = dx * dx + dy * dy
    if (len < 1e-8) return Math.hypot(p[0] - a[0], p[1] - a[1])
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

function rdp(points, epsilon) {
    if (points.length < 3) return points.slice()
    let maxDist = 0
    let index = 0
    const start = points[0]
    const end = points[points.length - 1]
    for (let i = 1; i < points.length - 1; i++) {
        const dist = distToSeg(points[i], start, end)
        if (dist > maxDist) {
            maxDist = dist
            index = i
        }
    }
    if (maxDist <= epsilon) return [start, end]
    const left = rdp(points.slice(0, index + 1), epsilon)
    const right = rdp(points.slice(index), epsilon)
    return left.slice(0, -1).concat(right)
}

function simplifyClosed(ring, epsilon) {
    if (ring.length < 8) return ring
    const simplified = rdp(ring.concat([ring[0]]), epsilon)
    if (simplified.length > 1) simplified.pop()
    return simplified.length >= 3 ? simplified : ring
}

function cleanRing(ring) {
    const pts = ring.map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10])
    const out = []
    for (const p of pts) {
        const prev = out[out.length - 1]
        if (prev && Math.hypot(prev[0] - p[0], prev[1] - p[1]) < 0.35) continue
        out.push(p)
    }
    if (out.length > 2 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 0.35) {
        out.pop()
    }
    return out
}

function normalizeRings(rings) {
    const usable = rings
        .map(cleanRing)
        .filter((ring) => ring.length >= 3 && Math.abs(ringArea(ring)) >= 18)
    if (usable.length === 0) return []
    usable.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)))
    if (ringArea(usable[0]) < 0) usable[0].reverse()
    for (let i = 1; i < usable.length; i++) {
        if (ringArea(usable[i]) > 0) usable[i].reverse()
    }
    return usable
}

function unionTree(CrossSection, parts) {
    if (parts.length === 0) throw new Error('합칠 영역이 없다')
    let level = parts
    while (level.length > 1) {
        const next = []
        for (let i = 0; i < level.length; i += 2) {
            if (i + 1 === level.length) {
                next.push(level[i])
                continue
            }
            const merged = CrossSection.union([level[i], level[i + 1]])
            level[i].delete()
            level[i + 1].delete()
            next.push(merged)
        }
        level = next
    }
    return level[0]
}

function smooth(cs) {
    const grown = cs.offset(0.85, 'Round', 2, 6)
    cs.delete()
    const back = grown.offset(-0.85, 'Round', 2, 6)
    grown.delete()
    return back
}

function assertOneBody(name, cs) {
    const bodies = cs.decompose()
    const areas = bodies.map((body) => body.area())
    for (const body of bodies) body.delete()
    const total = areas.reduce((sum, area) => sum + area, 0)
    const main = Math.max(...areas, 0)
    if (!(main > 0) || main < total * 0.99) {
        throw new Error(`${name}: 덩어리 ${areas.length}개 (${areas.map((area) => Math.round(area)).join(', ')})`)
    }
}

/** 이름 칸으로 쓸 가장 넓은 직사각형. */
function largestSolidRect(mask, width, height) {
    const heights = new Array(width).fill(0)
    let best = { area: 0, x: 0, y: 0, w: 1, h: 1 }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) heights[x] = mask[y * width + x] ? heights[x] + 1 : 0
        const stack = [-1]
        for (let x = 0; x <= width; x++) {
            const h = x === width ? 0 : heights[x]
            while (stack.length > 1 && heights[stack[stack.length - 1]] > h) {
                const heightHere = heights[stack.pop()]
                const left = stack[stack.length - 1]
                const w = x - left - 1
                const area = heightHere * w
                if (area > best.area) {
                    best = { area, x: left + 1, y: y - heightHere + 1, w, h: heightHere }
                }
            }
            stack.push(x)
        }
    }
    return best
}

function nameBox(rect, viewW, viewH, minX, minY) {
    const cx = rect.x + rect.w / 2 - minX
    const cy = rect.y + rect.h / 2 - minY
    const w = Math.round(Math.max(viewW * 0.22, Math.min(rect.w * 0.78, viewW * 0.72)))
    const h = Math.round(Math.max(viewH * 0.14, Math.min(rect.h * 0.7, viewH * 0.4)))
    const x = Math.round(Math.min(viewW - w, Math.max(0, cx - w / 2)))
    const y = Math.round(Math.min(viewH - h, Math.max(0, cy - h / 2)))
    return [x, y, w, h]
}

async function tracePng(CrossSection, file) {
    const { data, info } = await sharp(join(SOURCE, file))
        .resize(TRACE, TRACE, { fit: 'fill', kernel: 'nearest' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    const width = info.width
    const height = info.height
    const mask = new Uint8Array(width * height)
    const runs = []
    for (let y = 0; y < height; y++) {
        let x = 0
        while (x < width) {
            const solid = data[(y * width + x) * 4 + 3] >= 128
            if (!solid) {
                x += 1
                continue
            }
            let end = x + 1
            while (end < width && data[(y * width + end) * 4 + 3] >= 128) end += 1
            for (let i = x; i < end; i++) mask[y * width + i] = 1
            runs.push(CrossSection.square([end - x, 1], false).translate(x, y))
            x = end
        }
    }
    if (runs.length === 0) throw new Error(`${file}: 실루엣 없음`)
    let plate = unionTree(CrossSection, runs)
    plate = smooth(plate)
    const rings = normalizeRings(plate.toPolygons().map((ring) => simplifyClosed(ring, 0.45)))
    return { plate, rings, mask, width, height, rect: largestSolidRect(mask, width, height) }
}

function svgDoc(rings, viewW, viewH) {
    const d = rings.map((ring) => `M${ring.map(([x, y]) => `${x},${y}`).join('L')}Z`).join('')
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" width="${viewW}" height="${viewH}" role="img">
<rect width="${viewW}" height="${viewH}" fill="${PAPER}"/>
<path fill="${INK}" fill-rule="evenodd" d="${d}"/>
</svg>
`
}

async function main() {
    const files = sourceFiles()
    const { default: Module } = await import('manifold-3d/manifold.js')
    const wasm = await Module()
    wasm.setup()
    const { CrossSection } = wasm

    mkdirSync(DIR, { recursive: true })
    for (const name of readdirSync(DIR)) {
        if (name.endsWith('.svg')) unlinkSync(join(DIR, name))
    }

    const entries = []
    const meta = []
    for (let index = 0; index < files.length; index++) {
        const [id, name, filename] = NAMES[index]
        const traced = await tracePng(CrossSection, files[index])
        assertOneBody(name, traced.plate)
        traced.plate.delete()
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const ring of traced.rings) {
            for (const [x, y] of ring) {
                if (x < minX) minX = x
                if (y < minY) minY = y
                if (x > maxX) maxX = x
                if (y > maxY) maxY = y
            }
        }
        const pad = 10
        minX -= pad
        minY -= pad
        maxX += pad
        maxY += pad
        const viewW = Math.round(maxX - minX)
        const viewH = Math.round(maxY - minY)
        const rings = traced.rings.map((ring) =>
            ring.map(([x, y]) => [Math.round((x - minX) * 10) / 10, Math.round((y - minY) * 10) / 10])
        )
        writeFileSync(join(DIR, filename), svgDoc(rings, viewW, viewH), 'utf8')
        entries.push({
            id: `pet:${id}`,
            name,
            file: `/반려동물 템플릿/${filename}`,
            view: [viewW, viewH],
            nameBox: nameBox(traced.rect, viewW, viewH, minX, minY),
            rings,
        })
        meta.push({ id, name, filename, width: viewW, height: viewH, source: files[index] })
        const points = rings.reduce((sum, ring) => sum + ring.length, 0)
        console.log(`${id} ${name} <= ${files[index]} rings=${rings.length} pts=${points} view=${viewW}x${viewH}`)
    }

    writeFileSync(join(DIR, 'templates.json'), JSON.stringify(meta, null, 2), 'utf8')
    writeFileSync(
        join(DIR, '사용안내.txt'),
        [
            '반려동물 인식표 베이스 8종',
            '',
            '원본 PNG: public/반려동물베이스',
            '01 하트 발바닥, 02 뼈 발바닥, 03 발바닥 뼈, 04 위 고리,',
            '05 발바닥, 06 마름모, 07 원형, 08 별.',
            '',
            '검은 실루엣이 출력 판이고, 실루엣 안의 투명 영역은 구멍이다.',
            '판 좌표는 node scripts/build-pet-png-bases.mjs 로 다시 만든다.',
            '',
        ].join('\n'),
        'utf8'
    )

    const platesPath = join(ROOT, 'lib', 'name-tag', 'template-plates.json')
    const plates = JSON.parse(readFileSync(platesPath, 'utf8'))
    plates.pet = entries
    writeFileSync(platesPath, JSON.stringify(plates))
    console.log(`wrote ${entries.length} pet bases`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
