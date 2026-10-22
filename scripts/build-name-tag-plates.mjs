/**
 * 어린이 이름표 SVG의 색 영역을 하나의 판 외곽으로 합친다.
 * 반려동물 베이스는 scripts/build-pet-png-bases.mjs 가 만든다.
 * 결과: lib/name-tag/template-plates.json
 * 실행: node scripts/build-name-tag-plates.mjs [파일명 일부...]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SETS = [
    {
        id: 'kids',
        dir: '어린이 이름표 템플릿',
        meta: 'templates.json',
        fileKey: 'file',
        nameOf: (row) => row.name,
    },
]

function tokens(d) {
    return d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? []
}

/** M/L/H/V/Z 경로를 닫힌 고리로 나눈다. 곡선 명령이 있으면 그 경로는 버린다. */
function parseRings(d) {
    const t = tokens(d)
    const rings = []
    let i = 0
    let cx = 0
    let cy = 0
    let sx = 0
    let sy = 0
    let cur = []
    const isCmd = (value) => value !== undefined && /[a-zA-Z]/.test(value)
    const num = () => Number(t[i++])
    while (i < t.length) {
        const cmd = t[i++]
        if (!isCmd(cmd)) return []
        const rel = cmd === cmd.toLowerCase()
        const kind = cmd.toUpperCase()
        if (kind === 'M' || kind === 'L') {
            if (kind === 'M' && cur.length >= 3) rings.push(cur)
            if (kind === 'M') cur = []
            while (i < t.length && !isCmd(t[i])) {
                const x = num()
                const y = num()
                cx = rel ? cx + x : x
                cy = rel ? cy + y : y
                if (cur.length === 0) {
                    sx = cx
                    sy = cy
                }
                cur.push([cx, cy])
            }
        } else if (kind === 'H' || kind === 'V') {
            while (i < t.length && !isCmd(t[i])) {
                const n = num()
                if (kind === 'H') cx = rel ? cx + n : n
                else cy = rel ? cy + n : n
                cur.push([cx, cy])
            }
        } else if (kind === 'Z') {
            if (cur.length >= 3) rings.push(cur)
            cur = []
            cx = sx
            cy = sy
        } else {
            return []
        }
    }
    if (cur.length >= 3) rings.push(cur)
    return rings
}

function ringArea(ring) {
    let area = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
    }
    return area / 2
}

function distPointLine(p, a, b) {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy)
    if (len < 1e-9) return Math.hypot(p[0] - a[0], p[1] - a[1])
    return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len
}

function rdp(points, eps) {
    if (points.length < 3) return points
    let max = 0
    let index = 0
    const end = points.length - 1
    for (let i = 1; i < end; i++) {
        const d = distPointLine(points[i], points[0], points[end])
        if (d > max) {
            max = d
            index = i
        }
    }
    if (max <= eps) return [points[0], points[end]]
    const left = rdp(points.slice(0, index + 1), eps)
    const right = rdp(points.slice(index), eps)
    return left.slice(0, -1).concat(right)
}

function simplifyClosed(ring, eps) {
    if (ring.length < 8) return ring
    let left = 0
    let right = 0
    for (let i = 1; i < ring.length; i++) {
        if (ring[i][0] < ring[left][0]) left = i
        if (ring[i][0] > ring[right][0]) right = i
    }
    if (left === right) return ring
    const chain = (from, to) => {
        const pts = []
        for (let i = from; i !== to; i = (i + 1) % ring.length) pts.push(ring[i])
        pts.push(ring[to])
        return rdp(pts, eps)
    }
    const a = chain(left, right)
    const b = chain(right, left)
    const merged = a.slice(0, -1).concat(b.slice(0, -1))
    return merged.length >= 3 ? merged : ring
}

function dedupe(ring) {
    const out = []
    for (const p of ring) {
        const prev = out[out.length - 1]
        if (prev && Math.hypot(prev[0] - p[0], prev[1] - p[1]) < 0.2) continue
        out.push(p)
    }
    if (out.length > 2) {
        const first = out[0]
        const last = out[out.length - 1]
        if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.2) out.pop()
    }
    return out
}

function roundRing(ring) {
    return dedupe(ring.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]))
}

function bbox(ring) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of ring) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

function nameBoxFromRings(rings, viewW, viewH, row) {
    if (Array.isArray(row.name_center) && typeof row.name_width_ratio === 'number') {
        const w = viewW * row.name_width_ratio
        const h = viewH * 0.3
        const x = Math.min(viewW - w, Math.max(0, row.name_center[0] - w / 2))
        const y = Math.min(viewH - h, Math.max(0, row.name_center[1] - h / 2))
        return [Math.round(x), Math.round(y), Math.round(w), Math.round(h)]
    }
    let best = null
    let bestArea = 0
    for (const ring of rings) {
        const box = bbox(ring)
        if (box.w < viewW * 0.42 || box.w > viewW * 0.78) continue
        if (box.h < viewH * 0.12 || box.h > viewH * 0.4) continue
        if (box.w / box.h < 1.5) continue
        const mid = box.minX + box.w / 2
        if (Math.abs(mid - viewW / 2) > viewW * 0.16) continue
        const area = Math.abs(ringArea(ring))
        if (area > bestArea) {
            bestArea = area
            best = [Math.round(box.minX), Math.round(box.minY), Math.round(box.w), Math.round(box.h)]
        }
    }
    if (best) return best
    const w = Math.round(viewW * 0.62)
    const h = Math.round(viewH * 0.28)
    return [Math.round((viewW - w) / 2), Math.round(viewH * 0.5), w, h]
}

function pathNodes(svg) {
    const nodes = []
    const re = /<path\b[^>]*\bfill="([^"]+)"[^>]*\bd="([^"]+)"/g
    let match
    while ((match = re.exec(svg))) nodes.push(match[2])
    if (nodes.length > 0) return nodes
    const fallback = /<path\b[^>]*\bd="([^"]+)"/g
    while ((match = fallback.exec(svg))) nodes.push(match[1])
    return nodes
}

function viewSize(svg, row) {
    const box = svg.match(/viewBox="\s*0\s+0\s+([\d.]+)\s+([\d.]+)"/)
    if (box) return [Number(box[1]), Number(box[2])]
    return [Number(row.width) || 800, Number(row.height) || 500]
}

async function main() {
    const filter = process.argv.slice(2)
    const { default: Module } = await import('manifold-3d/manifold.js')
    const wasm = await Module()
    wasm.setup()
    const { CrossSection } = wasm
    const plates = { kids: [], pet: [] }
    const previewDir = join(ROOT, 'tmp-plate-preview')
    mkdirSync(previewDir, { recursive: true })

    for (const set of SETS) {
        const dir = join(ROOT, 'public', set.dir)
        const rows = JSON.parse(readFileSync(join(dir, set.meta), 'utf8'))
        for (const row of rows) {
            const file = row[set.fileKey]
            if (filter.length > 0 && !filter.some((part) => file.includes(part) || row.id.includes(part))) continue
            const started = Date.now()
            const svg = readFileSync(join(dir, file), 'utf8')
            const [viewW, viewH] = viewSize(svg, row)
            const sections = []
            const nameRings = []
            for (const d of pathNodes(svg)) {
                const rings = parseRings(d)
                    .map((ring) => simplifyClosed(dedupe(ring), 1.6))
                    .filter((ring) => ring.length >= 3 && Math.abs(ringArea(ring)) >= 12)
                if (rings.length === 0) continue
                for (const ring of rings) nameRings.push(ring)
                try {
                    const raw = new CrossSection(rings, 'EvenOdd')
                    if (raw.isEmpty()) {
                        raw.delete()
                        continue
                    }
                    // 추적 틈을 메우려고 조금 키운 뒤 합친다
                    const cs = raw.offset(2.2, 'Round', 2, 8)
                    raw.delete()
                    if (!cs.isEmpty()) sections.push(cs)
                    else cs.delete()
                } catch {
                    // 자기교차가 심한 조각은 외곽 합체에서 뺀다
                }
            }
            if (sections.length === 0) {
                console.log(`skip ${file}: 경로 없음`)
                continue
            }
            let acc = sections[0]
            for (let i = 1; i < sections.length; i++) {
                const next = CrossSection.union([acc, sections[i]])
                acc.delete()
                sections[i].delete()
                acc = next
                if (i % 30 === 0) {
                    const simplified = acc
                        .toPolygons()
                        .map((ring) => simplifyClosed(ring.map((p) => [p[0], p[1]]), 1.4))
                        .filter((ring) => ring.length >= 3)
                    const rebuilt = new CrossSection(simplified, 'NonZero')
                    acc.delete()
                    acc = rebuilt
                }
            }
            const closed = acc.offset(2.4, 'Round', 2, 12)
            acc.delete()
            const restored = closed.offset(-4.2, 'Round', 2, 12)
            closed.delete()
            const bodies = restored.decompose()
            let plate = restored
            if (bodies.length > 1) {
                plate = bodies.reduce((best, body) => (body.area() > best.area() ? body : best))
            }
            const outer = plate
                .toPolygons()
                .map((ring) => ring.map((p) => [p[0], p[1]]))
                .reduce((best, ring) => (Math.abs(ringArea(ring)) > Math.abs(ringArea(best)) ? ring : best))
            const rings = [roundRing(simplifyClosed(outer, 1.8))].filter((ring) => ring.length >= 3)
            restored.delete()
            for (const body of bodies) body.delete()
            if (rings.length === 0) {
                console.log(`skip ${file}: 외곽 없음`)
                continue
            }
            const entry = {
                id: `${set.id}:${row.id}`,
                name: set.nameOf(row),
                file: `/${set.dir}/${file}`,
                view: [viewW, viewH],
                nameBox: nameBoxFromRings(nameRings, viewW, viewH, row),
                rings,
            }
            plates[set.id].push(entry)
            const dAttr = rings
                .map((ring) => `M${ring.map(([x, y]) => `${x},${y}`).join('L')}Z`)
                .join(' ')
            const [nx, ny, nw, nh] = entry.nameBox
            writeFileSync(
                join(previewDir, `${entry.id.replace(':', '_')}.svg`),
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}"><path d="${dAttr}" fill="#ddd" stroke="#111" stroke-width="2"/><rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" fill="none" stroke="#e11" stroke-width="3"/></svg>`
            )
            const points = rings.reduce((sum, ring) => sum + ring.length, 0)
            console.log(`${entry.id} ${entry.name} rings=${rings.length} pts=${points} ${Date.now() - started}ms`)
        }
    }

    if (filter.length === 0) {
        const out = join(ROOT, 'lib', 'name-tag', 'template-plates.json')
        const prev = JSON.parse(readFileSync(out, 'utf8'))
        plates.pet = prev.pet ?? []
        writeFileSync(out, JSON.stringify(plates))
        console.log(`wrote ${out}`)
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
