/**
 * 픽셀 트레이스로 생긴 계단 외곽을 윤곽선 방향으로 평균내 곡선으로 만든다.
 * 반경은 트레이스 픽셀 단위. 긴 계단(5px 전후)을 없애고 별 꼭짓점 같은 큰 꺾임은 남긴다.
 */
const SPACING = 0.75
const SIGMA = 5.5
const SIMPLIFY = 0.28

function dist(a, b) {
    return Math.hypot(b[0] - a[0], b[1] - a[1])
}

function resampleClosed(ring, spacing) {
    const lens = []
    let total = 0
    for (let i = 0; i < ring.length; i++) {
        const len = dist(ring[i], ring[(i + 1) % ring.length])
        lens.push(len)
        total += len
    }
    if (total < spacing * 8) return ring.map((point) => point.slice())
    const count = Math.round(total / spacing)
    const step = total / count
    const out = []
    let seg = 0
    let acc = 0
    for (let n = 0; n < count; n++) {
        const target = n * step
        while (seg < ring.length && acc + lens[seg] < target - 1e-8) {
            acc += lens[seg]
            seg += 1
        }
        const index = seg % ring.length
        const len = lens[index] || 1
        const t = Math.min(1, Math.max(0, (target - acc) / len))
        const a = ring[index]
        const b = ring[(index + 1) % ring.length]
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    }
    return out
}

function gaussianClosed(ring, sigmaPx, spacing) {
    const sigma = sigmaPx / spacing
    const radius = Math.max(1, Math.ceil(sigma * 3))
    const weights = []
    let weightSum = 0
    for (let k = -radius; k <= radius; k++) {
        const weight = Math.exp(-(k * k) / (2 * sigma * sigma))
        weights.push(weight)
        weightSum += weight
    }
    return ring.map((_, index) => {
        let x = 0
        let y = 0
        for (let k = -radius; k <= radius; k++) {
            const point = ring[(index + k + ring.length) % ring.length]
            const weight = weights[k + radius]
            x += point[0] * weight
            y += point[1] * weight
        }
        return [x / weightSum, y / weightSum]
    })
}

function distToSeg(point, a, b) {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = dx * dx + dy * dy
    if (len < 1e-8) return Math.hypot(point[0] - a[0], point[1] - a[1])
    let t = ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / len
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy))
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

export function smoothOutline(ring) {
    const sampled = resampleClosed(ring, SPACING)
    const curved = gaussianClosed(gaussianClosed(sampled, SIGMA, SPACING), SIGMA * 0.65, SPACING)
    return simplifyClosed(curved, SIMPLIFY)
}
