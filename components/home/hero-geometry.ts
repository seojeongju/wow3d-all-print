import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

/**
 * 홈 히어로 실사 렌더용 형상 생성 (순수 three — 브라우저·Node 공용).
 * 실제 설계 규칙(인볼류트 치형, 베벨 모서리, vase mode 단일 벽, 자이로이드 TPMS)으로 만든다.
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

export function roundedRectShape(w: number, h: number, r: number) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
}

export function circleHole(x: number, y: number, r: number) {
    const p = new THREE.Path();
    p.absarc(x, y, r, 0, Math.PI * 2, true);
    return p;
}

/** 장공(슬롯) 구멍 */
export function slotHole(cx: number, cy: number, len: number, r: number) {
    const p = new THREE.Path();
    p.absarc(cx + len / 2, cy, r, -Math.PI / 2, Math.PI / 2, true);
    p.absarc(cx - len / 2, cy, r, Math.PI / 2, (Math.PI * 3) / 2, true);
    return p;
}

/** 나선 화병 — 7개 골이 높이에 따라 비틀리는 단일 벽 (vase mode) + 바닥 */
export function spiralVaseGeometry() {
    const segU = 192;
    const segV = 150;
    const H = 2.3;
    const lobes = 7;
    const radiusAt = (v: number) =>
        0.42 + 0.3 * Math.sin(Math.PI * Math.min(1, v * 1.05)) - 0.1 * v + 0.12 * Math.max(0, (v - 0.86) / 0.14) ** 2;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let j = 0; j <= segV; j++) {
        const v = j / segV;
        const twist = v * Math.PI * 1.25;
        const base = radiusAt(v);
        for (let i = 0; i <= segU; i++) {
            const th = (i / segU) * Math.PI * 2;
            const rr = base * (1 + 0.085 * Math.cos(lobes * (th + twist)));
            positions.push(rr * Math.cos(th), v * H, rr * Math.sin(th));
        }
    }
    const row = segU + 1;
    for (let j = 0; j < segV; j++) {
        for (let i = 0; i < segU; i++) {
            const a = j * row + i;
            indices.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
        }
    }
    // 바닥 (중심 팬)
    const center = positions.length / 3;
    positions.push(0, 0, 0);
    for (let i = 0; i < segU; i++) indices.push(center, i + 1, i);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    geo.translate(0, -H / 2, 0);
    return geo;
}

/** 자이로이드 격자 구 — 마칭 큐브로 한 번 생성 (격자 ∩ 구) */
export function createGyroidMesh(material: THREE.Material, resolution: number) {
    const mc = new MarchingCubes(resolution, material, false, false, 160000);
    mc.isolation = 0;
    const size = mc.size;
    const half = size / 2;
    const freq = Math.PI * 2 * 1.55;
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const px = (x - half) / half;
                const py = (y - half) / half;
                const pz = (z - half) / half;
                const qx = px * freq;
                const qy = py * freq;
                const qz = pz * freq;
                const g = Math.sin(qx) * Math.cos(qy) + Math.sin(qy) * Math.cos(qz) + Math.sin(qz) * Math.cos(qx);
                const shell = 0.42 - Math.abs(g);
                const sphere = (0.8 - Math.sqrt(px * px + py * py + pz * pz)) * 6;
                mc.field[x + y * size + z * size * size] = Math.min(shell, sphere);
            }
        }
    }
    mc.update();
    mc.frustumCulled = false;
    return mc;
}
