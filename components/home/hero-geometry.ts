import * as THREE from 'three';

/**
 * 홈 히어로 실사 렌더용 형상 생성 (순수 three — 브라우저·Node 공용).
 * 실제 설계 규칙(인볼류트 치형, 베벨 모서리)으로 만든다.
 */

/** 표준 압력각 20° 인볼류트 스퍼 기어 외곽 + 구멍 */
export function involuteGearShape(
    teeth: number,
    module: number,
    holes: { bore: number; lightening?: { count: number; radius: number; at: number } }
): THREE.Shape {
    const pa = (20 * Math.PI) / 180;
    const r = (module * teeth) / 2;
    const rb = r * Math.cos(pa);
    const ra = r + module;
    const rf = r - 1.25 * module;
    const inv = Math.tan(pa) - pa;
    const beta = Math.PI / (2 * teeth) + inv; // 기초원에서 이 반폭(각도)
    const tMax = Math.sqrt((ra / rb) ** 2 - 1);
    const N = 10;
    const polar = (rad: number, ang: number) => new THREE.Vector2(rad * Math.cos(ang), rad * Math.sin(ang));

    const pts: THREE.Vector2[] = [];
    for (let k = 0; k < teeth; k++) {
        const c = (k * 2 * Math.PI) / teeth;
        if (rf < rb) pts.push(polar(rf, c - beta));
        for (let i = 0; i <= N; i++) {
            const t = (i / N) * tMax;
            pts.push(polar(rb * Math.sqrt(1 + t * t), c - beta + (t - Math.atan(t))));
        }
        const phiMax = tMax - Math.atan(tMax);
        for (let i = 1; i < 4; i++) {
            const a = c - beta + phiMax + ((2 * (beta - phiMax)) * i) / 4;
            pts.push(polar(ra, a));
        }
        for (let i = N; i >= 0; i--) {
            const t = (i / N) * tMax;
            pts.push(polar(rb * Math.sqrt(1 + t * t), c + beta - (t - Math.atan(t))));
        }
        if (rf < rb) pts.push(polar(rf, c + beta));
        // 이뿌리 원호 (다음 이까지)
        const next = c + (2 * Math.PI) / teeth - beta;
        for (let i = 1; i < 3; i++) pts.push(polar(rf, c + beta + ((next - (c + beta)) * i) / 3));
    }

    const shape = new THREE.Shape(pts);
    const bore = new THREE.Path();
    bore.absarc(0, 0, holes.bore, 0, Math.PI * 2, true);
    shape.holes.push(bore);
    if (holes.lightening) {
        const { count, radius, at } = holes.lightening;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + Math.PI / count;
            const h = new THREE.Path();
            h.absarc(at * Math.cos(a), at * Math.sin(a), radius, 0, Math.PI * 2, true);
            shape.holes.push(h);
        }
    }
    return shape;
}

export function extrudeCentered(shape: THREE.Shape, depth: number, bevel = 0.022) {
    const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel * 0.8,
        bevelSegments: 3,
        curveSegments: 40,
    });
    geo.translate(0, 0, -depth / 2);
    geo.computeVertexNormals();
    return geo;
}

export function circleHole(x: number, y: number, r: number) {
    const p = new THREE.Path();
    p.absarc(x, y, r, 0, Math.PI * 2, true);
    return p;
}
