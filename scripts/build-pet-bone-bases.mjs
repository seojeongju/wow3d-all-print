/**
 * 반려동물 이름표 베이스 12종(뼈 인식표)을 만들고 판 외곽을 갱신한다.
 * 실행: node scripts/build-pet-bone-bases.mjs
 * 결과: public/반려동물 템플릿/*.svg, templates.json, lib/name-tag/template-plates.json 의 pet
 */
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const DIR = join(ROOT, 'public', '반려동물 템플릿')
const W = 840
const H = 520
const PAPER = '#f3f1ec'
const INK = '#161616'

function circle(CrossSection, x, y, r, n = 56) {
    return CrossSection.circle(r, n).translate(x, y)
}

function unionAll(CrossSection, parts) {
    let acc = parts[0]
    for (let i = 1; i < parts.length; i++) {
        const next = CrossSection.union([acc, parts[i]])
        acc.delete()
        parts[i].delete()
        acc = next
    }
    return acc
}

function subtractAll(base, holes) {
    let acc = base
    for (const hole of holes) {
        const next = acc.subtract(hole)
        acc.delete()
        hole.delete()
        acc = next
    }
    return acc
}

function smooth(cs) {
    const grown = cs.offset(1.1, 'Round', 2, 8)
    cs.delete()
    const back = grown.offset(-1.1, 'Round', 2, 8)
    grown.delete()
    return back
}

function ringArea(ring) {
    let area = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
    }
    return area / 2
}

function cleanRing(ring) {
    const pts = ring.map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10])
    const out = []
    for (const p of pts) {
        const prev = out[out.length - 1]
        if (prev && Math.hypot(prev[0] - p[0], prev[1] - p[1]) < 0.35) continue
        out.push(p)
    }
    if (out.length > 2) {
        const a = out[0]
        const b = out[out.length - 1]
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.35) out.pop()
    }
    return out
}

/** 가장 큰 고리를 바깥(시계 반대)으로, 나머지는 구멍(시계)으로 맞춘다. */
function normalizeRings(rings) {
    const usable = rings.filter((ring) => ring.length >= 3 && Math.abs(ringArea(ring)) >= 12)
    if (usable.length === 0) return []
    usable.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)))
    if (ringArea(usable[0]) < 0) usable[0].reverse()
    for (let i = 1; i < usable.length; i++) {
        if (ringArea(usable[i]) > 0) usable[i].reverse()
    }
    return usable
}

function toRings(cs) {
    return normalizeRings(cs.toPolygons().map(cleanRing))
}

function bone(CrossSection, cx, cy, opt = {}) {
    const kx = opt.kx ?? 188
    const ky = opt.ky ?? 36
    const kr = opt.kr ?? 64
    const shaft = opt.shaft ?? 30
    return unionAll(CrossSection, [
        circle(CrossSection, cx - kx, cy - ky, kr),
        circle(CrossSection, cx - kx, cy + ky, kr),
        circle(CrossSection, cx + kx, cy - ky, kr),
        circle(CrossSection, cx + kx, cy + ky, kr),
        CrossSection.square([kx * 2 + 8, shaft * 2], true).translate(cx, cy),
    ])
}

function heart(CrossSection, cx, cy, s) {
    const pts = []
    const steps = 96
    for (let i = 0; i < steps; i++) {
        const t = (i / steps) * Math.PI * 2
        const classic =
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t)
        pts.push([cx + 16 * Math.sin(t) ** 3 * s, cy + (-classic - 6) * s])
    }
    return new CrossSection([pts])
}

function paw(CrossSection, cx, cy, s) {
    const toes = [
        [-1.15, -1.22],
        [-0.4, -1.62],
        [0.4, -1.62],
        [1.15, -1.22],
    ]
    const solids = [circle(CrossSection, cx, cy + 3 * s, 30 * s)]
    const holes = [circle(CrossSection, cx, cy + 7 * s, 13.5 * s)]
    for (const [tx, ty] of toes) {
        const x = cx + tx * 23 * s
        const y = cy + ty * 23 * s
        solids.push(circle(CrossSection, x, y, 12.5 * s))
        holes.push(circle(CrossSection, x, y, 6 * s))
    }
    return { solid: unionAll(CrossSection, solids), holes }
}

function feather(CrossSection, x, y, rot, rx, ry) {
    return CrossSection.circle(1, 32).scale([rx, ry]).rotate(rot).translate(x, y)
}

function wing(CrossSection, cx, cy, dir) {
    const s = dir
    const tilt = s > 0 ? -52 : 52
    return unionAll(CrossSection, [
        feather(CrossSection, cx + s * 28, cy - 6, tilt * 0.35, 34, 13),
        feather(CrossSection, cx + s * 46, cy - 30, tilt, 40, 14),
    ])
}

function attachLoop(CrossSection, plate, x, y, outer, inner) {
    const withLoop = unionAll(CrossSection, [plate, circle(CrossSection, x, y, outer)])
    return subtractAll(withLoop, [circle(CrossSection, x, y, inner)])
}

function assertOneBody(name, cs) {
    const bodies = cs.decompose()
    const areas = bodies.map((body) => body.area())
    for (const body of bodies) body.delete()
    const total = areas.reduce((sum, area) => sum + area, 0)
    const main = Math.max(...areas)
    if (!(main > 0) || main < total * 0.99) {
        throw new Error(`${name}: 덩어리 ${areas.length}개 (${areas.map((area) => Math.round(area)).join(', ')})`)
    }
}

function pathOf(rings) {
    return rings.map((ring) => `M${ring.map(([x, y]) => `${x},${y}`).join('L')}Z`).join('')
}

function fillPath(rings) {
    return `<path fill="${INK}" fill-rule="evenodd" d="${pathOf(rings)}"/>`
}

function strokePath(rings, width) {
    return `<path fill="none" stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" d="${pathOf(rings)}"/>`
}

function svgDoc(body, minX, minY, viewW, viewH) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${viewW} ${viewH}" width="${viewW}" height="${viewH}" role="img">
<rect x="${minX}" y="${minY}" width="${viewW}" height="${viewH}" fill="${PAPER}"/>
${body}
</svg>
`
}

function nameBox(cx, cy, bw, bh, viewW, viewH) {
    const w = Math.round(Math.min(bw, viewW * 0.8))
    const h = Math.round(Math.min(bh, viewH * 0.45))
    const x = Math.round(Math.min(viewW - w, Math.max(0, cx - w / 2)))
    const y = Math.round(Math.min(viewH - h, Math.max(0, cy - h / 2)))
    return [x, y, w, h]
}

async function main() {
    const { default: Module } = await import('manifold-3d/manifold.js')
    const wasm = await Module()
    wasm.setup()
    const { CrossSection } = wasm

    const cx = 420
    const cy = 268
    // 고리 중심은 뼈대 윗변에 겹치고, 구멍은 뼈대 바깥에 둔다.
    const loopTop = { x: cx, y: cy - 48, outer: 34, inner: 14 }
    const loopRight = { x: cx + 188, y: cy - 114, outer: 32, inner: 13 }

    const specs = []

    const push = (spec) => specs.push(spec)

    {
        const plate = smooth(bone(CrossSection, cx, cy))
        push({
            id: '01',
            name: '기본 뼈',
            file: '01_기본뼈.svg',
            plate,
            nameAt: [cx, cy, 300, 72],
            body: () => fillPath(toRings(plate)),
        })
    }
    {
        const plate = smooth(bone(CrossSection, cx, cy))
        const rings = toRings(plate)
        push({
            id: '02',
            name: '뼈 테두리',
            file: '02_뼈테두리.svg',
            plate,
            nameAt: [cx, cy, 300, 72],
            body: () => strokePath([rings[0]], 28),
        })
    }
    {
        let plate = bone(CrossSection, cx, cy)
        plate = attachLoop(CrossSection, plate, loopRight.x, loopRight.y, loopRight.outer, loopRight.inner)
        plate = smooth(plate)
        push({
            id: '03',
            name: '오른쪽 고리',
            file: '03_오른쪽고리.svg',
            plate,
            nameAt: [cx, cy, 280, 72],
            body: () => fillPath(toRings(plate)),
        })
    }
    {
        let plate = bone(CrossSection, cx, cy)
        plate = attachLoop(CrossSection, plate, cx + 36, cy - 46, 28, 12)
        const cut = heart(CrossSection, cx - 188, cy + 2, 1.85)
        plate = subtractAll(plate, [cut])
        plate = smooth(plate)
        push({
            id: '04',
            name: '하트 홈',
            file: '04_하트홈.svg',
            plate,
            nameAt: [cx + 20, cy, 250, 68],
            body: () => fillPath(toRings(plate)),
        })
    }
    {
        let plate = bone(CrossSection, cx, cy)
        plate = attachLoop(CrossSection, plate, loopTop.x, loopTop.y, loopTop.outer, loopTop.inner)
        plate = smooth(plate)
        push({
            id: '05',
            name: '위 고리',
            file: '05_위고리.svg',
            plate,
            nameAt: [cx, cy, 280, 72],
            body: () => fillPath(toRings(plate)),
        })
    }
    {
        let plate = bone(CrossSection, cx, cy)
        plate = attachLoop(CrossSection, plate, loopTop.x, loopTop.y, loopTop.outer, loopTop.inner)
        plate = smooth(plate)
        const rings = toRings(plate)
        push({
            id: '06',
            name: '테두리 위 고리',
            file: '06_테두리위고리.svg',
            plate,
            nameAt: [cx, cy, 280, 72],
            body: () => `${strokePath([rings[0]], 28)}${rings.slice(1).map((ring) => strokePath([ring], 10)).join('')}`,
        })
    }
    {
        const bar = bone(CrossSection, cx, cy, { kx: 210, ky: 30, kr: 52, shaft: 24 })
        const barRings = toRings(bar)
        let plate = unionAll(CrossSection, [heart(CrossSection, cx, cy - 8, 10.2), bar])
        plate = smooth(plate)
        const plateRings = toRings(plate)
        push({
            id: '07',
            name: '하트 뼈',
            file: '07_하트뼈.svg',
            plate,
            nameAt: [cx, cy, 240, 56],
            body: () =>
                `${fillPath(plateRings)}<path fill="${PAPER}" stroke="${INK}" stroke-width="10" stroke-linejoin="round" d="${pathOf(barRings)}"/>`,
        })
    }
    {
        const bar = smooth(bone(CrossSection, cx, cy))
        const barRings = toRings(bar)
        const mark = paw(CrossSection, cx, cy - 46, 1.2)
        const drawn = subtractAll(paw(CrossSection, cx, cy - 46, 1.2).solid, paw(CrossSection, cx, cy - 46, 1.2).holes)
        const pawRings = toRings(drawn)
        drawn.delete()
        let plate = unionAll(CrossSection, [bar, mark.solid])
        plate = subtractAll(plate, mark.holes)
        plate = smooth(plate)
        push({
            id: '08',
            name: '발바닥',
            file: '08_발바닥.svg',
            plate,
            nameAt: [cx, cy + 8, 260, 64],
            body: () => `${strokePath([barRings[0]], 28)}${fillPath(pawRings)}`,
        })
    }
    {
        let plate = bone(CrossSection, cx, cy)
        plate = attachLoop(CrossSection, plate, loopRight.x, loopRight.y, loopRight.outer, loopRight.inner)
        plate = smooth(plate)
        const cuts = [
            [cx - 188, cy - 38, 0.68],
            [cx - 188, cy + 40, 0.64],
        ].map(([x, y, s]) => paw(CrossSection, x, y, s).solid)
        plate = subtractAll(plate, cuts)
        push({
            id: '09',
            name: '발바닥 고리',
            file: '09_발바닥고리.svg',
            plate,
            nameAt: [cx + 24, cy, 240, 68],
            body: () => fillPath(toRings(plate)),
        })
    }
    {
        const bar = bone(CrossSection, cx, cy - 36, { kx: 176, ky: 32, kr: 58, shaft: 28 })
        const disk = circle(CrossSection, cx, cy + 78, 118)
        const diskRing = toRings(disk)
        const barDraw = toRings(
            subtractAll(
                unionAll(CrossSection, [
                    bone(CrossSection, cx, cy - 36, { kx: 176, ky: 32, kr: 58, shaft: 28 }),
                    circle(CrossSection, cx, cy - 78, 30),
                ]),
                [circle(CrossSection, cx, cy - 78, 13)]
            )
        )
        let plate = unionAll(CrossSection, [bar, disk])
        plate = attachLoop(CrossSection, plate, cx, cy - 78, 30, 13)
        plate = smooth(plate)
        push({
            id: '10',
            name: '원형 펜던트',
            file: '10_원형펜던트.svg',
            plate,
            nameAt: [cx, cy + 90, 150, 90],
            body: () => `${strokePath(diskRing, 26)}${fillPath(barDraw)}`,
        })
    }
    {
        let plate = bone(CrossSection, cx, cy)
        plate = attachLoop(CrossSection, plate, loopTop.x, loopTop.y, loopTop.outer, loopTop.inner)
        plate = smooth(plate)
        const plateRings = toRings(plate)
        push({
            id: '11',
            name: '가운데 원',
            file: '11_가운데원.svg',
            plate,
            nameAt: [cx, cy, 140, 110],
            body: () =>
                `${fillPath(plateRings)}<circle cx="${cx}" cy="${cy + 28}" r="42" fill="${PAPER}" stroke="${INK}" stroke-width="11"/><circle cx="${loopTop.x}" cy="${loopTop.y}" r="${loopTop.outer}" fill="${INK}"/><circle cx="${loopTop.x}" cy="${loopTop.y}" r="${loopTop.inner}" fill="${PAPER}"/>`,
        })
    }
    {
        const bar = bone(CrossSection, cx, cy + 36, { kx: 200, ky: 34, kr: 60, shaft: 28 })
        const barRings = toRings(bar)
        const mark = paw(CrossSection, cx, cy - 8, 1.05)
        const decor = subtractAll(
            unionAll(CrossSection, [
                paw(CrossSection, cx, cy - 8, 1.05).solid,
                wing(CrossSection, cx, cy - 20, -1),
                wing(CrossSection, cx, cy - 20, 1),
                circle(CrossSection, cx, cy - 70, 34),
            ]),
            [...paw(CrossSection, cx, cy - 8, 1.05).holes, circle(CrossSection, cx, cy - 70, 16)]
        )
        const decorRings = toRings(decor)
        decor.delete()
        let plate = unionAll(CrossSection, [
            bar,
            mark.solid,
            wing(CrossSection, cx, cy - 20, -1),
            wing(CrossSection, cx, cy - 20, 1),
            circle(CrossSection, cx, cy - 70, 34),
        ])
        plate = subtractAll(plate, [...mark.holes, circle(CrossSection, cx, cy - 70, 16)])
        plate = smooth(plate)
        push({
            id: '12',
            name: '엔젤',
            file: '12_엔젤.svg',
            plate,
            nameAt: [cx, cy + 36, 270, 60],
            body: () => `${strokePath([barRings[0]], 26)}${fillPath(decorRings)}`,
        })
    }

    for (const name of readdirSync(DIR)) {
        if (name.endsWith('.svg')) unlinkSync(join(DIR, name))
    }

    const entries = []
    const meta = []
    for (const spec of specs) {
        assertOneBody(spec.name, spec.plate)
        const rawRings = toRings(spec.plate)
        if (rawRings.length === 0) throw new Error(`${spec.name}: 외곽 없음`)
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const ring of rawRings) {
            for (const [x, y] of ring) {
                if (x < minX) minX = x
                if (y < minY) minY = y
                if (x > maxX) maxX = x
                if (y > maxY) maxY = y
            }
        }
        const pad = 16
        minX -= pad
        minY -= pad
        maxX += pad
        maxY += pad
        const viewW = Math.round(maxX - minX)
        const viewH = Math.round(maxY - minY)
        const rings = rawRings.map((ring) => ring.map(([x, y]) => [Math.round((x - minX) * 10) / 10, Math.round((y - minY) * 10) / 10]))
        writeFileSync(join(DIR, spec.file), svgDoc(spec.body(), minX, minY, viewW, viewH), 'utf8')
        const [nx, ny, nw, nh] = spec.nameAt
        entries.push({
            id: `pet:${spec.id}`,
            name: spec.name,
            file: `/반려동물 템플릿/${spec.file}`,
            view: [viewW, viewH],
            nameBox: nameBox(nx - minX, ny - minY, nw, nh, viewW, viewH),
            rings,
        })
        meta.push({
            id: spec.id,
            name: spec.name,
            filename: spec.file,
            width: viewW,
            height: viewH,
        })
        const points = rings.reduce((sum, ring) => sum + ring.length, 0)
        console.log(`${spec.id} ${spec.name} rings=${rings.length} pts=${points}`)
        spec.plate.delete()
    }

    writeFileSync(join(DIR, 'templates.json'), JSON.stringify(meta, null, 2), 'utf8')
    writeFileSync(
        join(DIR, '사용안내.txt'),
        [
            '반려동물 인식표 뼈 베이스 12종',
            '',
            '01 기본 뼈, 02 뼈 테두리, 03 오른쪽 고리, 04 하트 홈,',
            '05 위 고리, 06 테두리 위 고리, 07 하트 뼈, 08 발바닥,',
            '09 발바닥 고리, 10 원형 펜던트, 11 가운데 원, 12 엔젤.',
            '',
            '썸네일의 테두리·흰 원·하트 위 뼈는 이름표 그림이고, 출력 판은 한 덩어리 실루엣이다.',
            '고리 안쪽, 하트 홈, 발바닥 패드, 헤일로 안쪽은 판에 뚫린 구멍이다.',
            '판 좌표는 node scripts/build-pet-bone-bases.mjs 로 다시 만든다.',
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
