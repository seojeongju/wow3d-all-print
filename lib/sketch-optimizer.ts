export interface Point {
    x: number;
    y: number;
}

/**
 * Douglas-Peucker 알고리즘: 포인트를 단순화하여 노이즈를 제거합니다.
 */
export function simplifyPoints(points: Point[], epsilon: number): Point[] {
    if (points.length <= 2) return points;

    let maxDist = 0;
    let index = 0;

    for (let i = 1; i < points.length - 1; i++) {
        const dist = getLineDistance(points[i], points[0], points[points.length - 1]);
        if (dist > maxDist) {
            index = i;
            maxDist = dist;
        }
    }

    if (maxDist > epsilon) {
        const left = simplifyPoints(points.slice(0, index + 1), epsilon);
        const right = simplifyPoints(points.slice(index), epsilon);
        return [...left.slice(0, left.length - 1), ...right];
    } else {
        return [points[0], points[points.length - 1]];
    }
}

function getLineDistance(p: Point, p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (dx === 0 && dy === 0) return Math.hypot(p.x - p1.x, p.y - p1.y);

    const t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dx * dx + dy * dy);
    if (t < 0) return Math.hypot(p.x - p1.x, p.y - p1.y);
    if (t > 1) return Math.hypot(p.x - p2.x, p.y - p2.y);

    return Math.hypot(p.x - (p1.x + t * dx), p.y - (p1.y + t * dy));
}

/**
 * Chaikin 알고리즘: 각진 선을 부드러운 곡선으로 다듬습니다.
 */
export function smoothPoints(points: Point[], iterations: number = 2): Point[] {
    if (points.length < 2) return points;

    let result = [...points];

    for (let i = 0; i < iterations; i++) {
        const nextResult: Point[] = [result[0]];

        for (let j = 0; j < result.length - 1; j++) {
            const p0 = result[j];
            const p1 = result[j + 1];

            // Q = 0.75*P0 + 0.25*P1
            // R = 0.25*P0 + 0.75*P1
            nextResult.push({
                x: 0.75 * p0.x + 0.25 * p1.x,
                y: 0.75 * p0.y + 0.25 * p1.y
            });
            nextResult.push({
                x: 0.25 * p0.x + 0.75 * p1.x,
                y: 0.25 * p0.y + 0.75 * p1.y
            });
        }

        nextResult.push(result[result.length - 1]);
        result = nextResult;
    }

    return result;
}
