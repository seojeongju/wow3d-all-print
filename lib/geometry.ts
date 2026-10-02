import * as THREE from 'three';
import {
    P2S_MAX_SLOW_WALL_TO_SURFACE_RATIO,
    P2S_PROFILE,
    p2sOverhangWallExtra,
    p2sShellSolidFraction,
} from '@/lib/print-time-estimate';
import { layFlatMatrix, type Vec3Tuple } from '@/lib/stl-bake';

/** 원본 좌표에서 출력 시 위(+Z)를 향하게 되는 축 */
export type UpAxisKey = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';
export const UP_AXIS_KEYS: readonly UpAxisKey[] = ['+x', '-x', '+y', '-y', '+z', '-z'];

export type OrientationSupport = {
    /** 서포트가 필요한 오버행 면적 (cm², 바닥 접촉면 제외) */
    overhangArea: number;
    /** 오버행 아래 그림자 부피 — 서포트가 채울 공간 (cm³, 채움률 적용 전) */
    supportVolume: number;
    /** 측면 면적 Σ A·sinθ (cm²) — 레이어별 벽 경로 길이 × 레이어 높이의 합 */
    lateralArea?: number;
    /** 위를 향한 면의 수평 투영 면적 (cm²) — 윗면 솔리드, 벽이 덮는 경사면 제외 */
    topArea?: number;
    /** 아래를 향한 면의 수평 투영 면적 (cm², 바닥 접촉 포함) — 바닥 솔리드, 벽이 덮는 경사면 제외 */
    bottomArea?: number;
    /** 베드에 닿는 면적 (cm²) — 첫 레이어 */
    bedArea?: number;
    /** 외벽 오버행 감속으로 늘어나는 시간을 외벽 속도 기준 측면 면적으로 환산한 추가분 (cm²) */
    slowWallArea?: number;
    /** 측면 중 곡선 윤곽 부분 (cm²) — 곡선 벽은 꼭짓점마다 감속 */
    curvedWallArea?: number;
    /** 단면 윤곽 루프(섬·구멍) 수 × 높이 (루프·mm) — 레이어 높이로 나누면 벽 루프 수 */
    contourLoops?: number;
    /** 다중 객체: 이 축을 위로 세웠을 때 객체별 높이(mm)의 합 */
    partHeightSum?: number;
};

const ORIENTATION_AREA_KEYS = ['lateralArea', 'topArea', 'bottomArea', 'bedArea', 'curvedWallArea'] as const;

/** 축에 맞지 않은 평면을 바닥에 놓는 배치 (슬라이서 '면에 놓기') */
export type FaceOrientation = OrientationSupport & {
    /** 바닥에 놓을 평면의 바깥 법선 (원본 좌표, 단위 벡터) */
    down: Vec3Tuple;
    /** 이 면을 바닥에 놓았을 때 AABB (mm, layFlatMatrix 기준 축) */
    box: { x: number; y: number; z: number };
};

export interface GeometryAnalysis {
    volume: number; // cm³
    surfaceArea: number; // cm²
    overhangArea?: number; // cm² (Optional for backward compatibility)
    /** 출력 시 그 축을 위로 세웠을 때의 서포트 지표 (슬라이서식 바닥 배치 기준) */
    orientations?: Partial<Record<UpAxisKey, OrientationSupport>>;
    /** 축에 맞지 않은 큰 평면을 바닥에 놓는 배치 후보 */
    faceOrientations?: FaceOrientation[];
    /** 현재 배치의 서포트 그림자 부피 (cm³) — applyTransformToAnalysis가 채움 */
    supportVolume?: number;
    /** 현재 배치의 측면·윗면·바닥·베드 접촉 면적 (cm²) — 출력 시간 산출용 */
    lateralArea?: number;
    topArea?: number;
    bottomArea?: number;
    bedArea?: number;
    slowWallArea?: number;
    curvedWallArea?: number;
    contourLoops?: number;
    /** 다중 객체 3MF 플레이트의 객체 수 (단일 객체면 없음) */
    partCount?: number;
    /** 현재 배치의 객체별 높이(mm) 합 */
    partHeightSum?: number;
    /** 이웃 객체 중심 간 평균 거리(mm) */
    partSpacing?: number;
    boundingBox: {
        x: number; // mm
        y: number; // mm
        z: number; // mm
    };
}

/** 전체 삼각형 루프 없이 즉시 치수만 산출 (대용량·AI 메쉬 1차 통과용) */
export const LARGE_MESH_TRIANGLE_THRESHOLD = 120_000;
/** 유기적 형상의 AABB 표면 대비 최대 배수 (내부면·샘플링 폭주 방지) */
export const MAX_SURFACE_TO_AABB_RATIO = 3;
export const MAX_OVERHANG_TO_SURFACE_RATIO = 0.55;

/** Bambu Studio 기본 서포트 임계각 30° — 수평면 기준 30° 미만으로 눕은 아랫면만 지지 */
export const SUPPORT_THRESHOLD_ANGLE_DEG = 30;
const SUPPORT_NORMAL_THRESHOLD = Math.cos((SUPPORT_THRESHOLD_ANGLE_DEG * Math.PI) / 180);
/** 바닥 접촉면 판정 허용 오차 (mm, 최소값) */
const BED_CONTACT_TOLERANCE_MM = 0.3;
const BED_CONTACT_TOLERANCE_RATIO = 0.002;

/** 서포트 착지면 격자 — 셀 크기 = 투영 최대 치수 / 이 값 (하한 SUPPORT_GRID_MIN_CELL_MM) */
const SUPPORT_GRID_CELLS = 200;
const SUPPORT_GRID_MIN_CELL_MM = 0.5;
/** 오버행 면에서 이 간격 안의 표면은 착지면으로 보지 않음 (수치 오차) */
const SUPPORT_LANDING_GAP_MM = 0.05;

type MeshPositions = THREE.BufferAttribute | THREE.InterleavedBufferAttribute;

/**
 * 투영 평면 (u, v) 격자 셀마다 모델 표면 높이 w를 법선 부호별(0: +w, 1: -w)로 모아
 * 오버행 면에서 내린 서포트 기둥이 바로 아래(위) 모델 표면에서 끝나는 높이를 구함.
 * Bambu 기본값은 서포트가 모델 위에도 서므로 기둥을 베드까지 잡으면 모델 위 오버행이 과대.
 * rows: (u, v, w) 축 단위벡터 9개 — 오른손 좌표계여야 2D 부호 면적 = 법선의 w 성분 부호
 */
class SurfaceColumnGrid {
    private readonly rows: readonly number[];
    private u0 = Infinity;
    private v0 = Infinity;
    private wMin = Infinity;
    private wMax = -Infinity;
    private cs = 1;
    private nu = 1;
    private nv = 1;
    private readonly start: [Int32Array, Int32Array];
    private readonly vals: [Float32Array, Float32Array];
    // 생성 중 수집 버퍼 (셀, 높이, 법선 부호)
    private eCell = new Int32Array(1 << 16);
    private eW = new Float32Array(1 << 16);
    private eList = new Uint8Array(1 << 16);
    private eLen = 0;
    // columnHeight 질의 상태
    private list = 0;
    private qDown = true;
    private qSum = 0;

    /** tris: 삼각형당 정점 좌표 9개 (meshTriangleCoords) */
    constructor(tris: ArrayLike<number>, rows: readonly number[]) {
        this.rows = rows;
        const [r0, r1, r2, r3, r4, r5, r6, r7, r8] = rows;
        let u1 = -Infinity;
        let v1 = -Infinity;
        for (let i = 0; i + 2 < tris.length; i += 3) {
            const x = tris[i], y = tris[i + 1], z = tris[i + 2];
            const u = r0 * x + r1 * y + r2 * z;
            const v = r3 * x + r4 * y + r5 * z;
            const w = r6 * x + r7 * y + r8 * z;
            if (u < this.u0) this.u0 = u;
            if (u > u1) u1 = u;
            if (v < this.v0) this.v0 = v;
            if (v > v1) v1 = v;
            if (w < this.wMin) this.wMin = w;
            if (w > this.wMax) this.wMax = w;
        }
        const span = Math.max(u1 - this.u0, v1 - this.v0, 0);
        this.cs = Math.max(SUPPORT_GRID_MIN_CELL_MM, span / SUPPORT_GRID_CELLS);
        this.nu = Math.floor(Math.max(0, u1 - this.u0) / this.cs) + 1;
        this.nv = Math.floor(Math.max(0, v1 - this.v0) / this.cs) + 1;
        const cells = this.nu * this.nv;

        const t = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i + 8 < tris.length; i += 9) {
            for (let j = 0; j < 9; j += 3) {
                const x = tris[i + j], y = tris[i + j + 1], z = tris[i + j + 2];
                t[j] = r0 * x + r1 * y + r2 * z;
                t[j + 1] = r3 * x + r4 * y + r5 * z;
                t[j + 2] = r6 * x + r7 * y + r8 * z;
            }
            const area2 = (t[3] - t[0]) * (t[7] - t[1]) - (t[6] - t[0]) * (t[4] - t[1]);
            if (Math.abs(area2) < 1e-12) continue;
            this.list = area2 > 0 ? 0 : 1;
            this.scan(t, false);
        }

        // 셀별로 묶기 (계수 정렬)
        this.start = [new Int32Array(cells + 1), new Int32Array(cells + 1)];
        for (let e = 0; e < this.eLen; e++) this.start[this.eList[e]][this.eCell[e] + 1]++;
        for (const s of this.start) {
            for (let c = 0; c < cells; c++) s[c + 1] += s[c];
        }
        this.vals = [new Float32Array(this.start[0][cells]), new Float32Array(this.start[1][cells])];
        const cursor = [this.start[0].slice(0, cells), this.start[1].slice(0, cells)];
        for (let e = 0; e < this.eLen; e++) {
            const l = this.eList[e];
            this.vals[l][cursor[l][this.eCell[e]]++] = this.eW[e];
        }
        this.eCell = new Int32Array(0);
        this.eW = new Float32Array(0);
        this.eList = new Uint8Array(0);
    }

    private push(cell: number, w: number): void {
        if (this.eLen === this.eCell.length) {
            const cap = this.eLen * 2;
            const c = new Int32Array(cap), wv = new Float32Array(cap), l = new Uint8Array(cap);
            c.set(this.eCell);
            wv.set(this.eW);
            l.set(this.eList);
            this.eCell = c;
            this.eW = wv;
            this.eList = l;
        }
        this.eCell[this.eLen] = cell;
        this.eW[this.eLen] = w;
        this.eList[this.eLen++] = this.list;
    }

    /** 셀에서 높이 w의 오버행 점으로부터 착지면(없으면 베드)까지 기둥 높이를 qSum에 더함 */
    private addColumn(cell: number, w: number): void {
        const vals = this.vals[this.list];
        const end = this.start[this.list][cell + 1];
        let col: number;
        if (this.qDown) {
            let best = this.wMin;
            for (let i = this.start[this.list][cell]; i < end; i++) {
                const v = vals[i];
                if (v < w - SUPPORT_LANDING_GAP_MM && v > best) best = v;
            }
            col = w - best;
        } else {
            let best = this.wMax;
            for (let i = this.start[this.list][cell]; i < end; i++) {
                const v = vals[i];
                if (v > w + SUPPORT_LANDING_GAP_MM && v < best) best = v;
            }
            col = best - w;
        }
        this.qSum += Math.max(0, col);
    }

    /** 삼각형 (u, v, w)×3 안에 중심이 든 셀마다 수집(query=false) 또는 기둥 합산. 방문 셀 수 반환 */
    private scan(t: readonly number[], query: boolean): number {
        const ua = t[0], va = t[1], wa = t[2], ub = t[3], vb = t[4], wb = t[5], uc = t[6], vc = t[7], wc = t[8];
        const d = (vb - vc) * (ua - uc) + (uc - ub) * (va - vc);
        if (Math.abs(d) < 1e-12) return 0;
        const cs = this.cs;
        const i0 = Math.max(0, Math.ceil((Math.min(ua, ub, uc) - this.u0) / cs - 0.5));
        const i1 = Math.min(this.nu - 1, Math.floor((Math.max(ua, ub, uc) - this.u0) / cs - 0.5));
        if (i0 > i1) return 0;
        const j0 = Math.max(0, Math.ceil((Math.min(va, vb, vc) - this.v0) / cs - 0.5));
        const j1 = Math.min(this.nv - 1, Math.floor((Math.max(va, vb, vc) - this.v0) / cs - 0.5));
        if (j0 > j1) return 0;
        let n = 0;
        for (let i = i0; i <= i1; i++) {
            const pu = this.u0 + (i + 0.5) * cs;
            for (let j = j0; j <= j1; j++) {
                const pv = this.v0 + (j + 0.5) * cs;
                const l1 = ((vb - vc) * (pu - uc) + (uc - ub) * (pv - vc)) / d;
                const l2 = ((vc - va) * (pu - uc) + (ua - uc) * (pv - vc)) / d;
                const l3 = 1 - l1 - l2;
                if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
                const w = l1 * wa + l2 * wb + l3 * wc;
                if (query) this.addColumn(i * this.nv + j, w);
                else this.push(i * this.nv + j, w);
                n++;
            }
        }
        return n;
    }

    /**
     * 오버행 삼각형 (u, v, w)×3에서 내린 서포트 기둥의 평균 높이(mm).
     * land: 착지면 법선 부호(0: +w, 1: -w), down: 중력이 -w 방향이면 true. 착지면이 없으면 베드(w 끝)까지.
     */
    columnHeight(t: readonly number[], land: number, down: boolean): number {
        this.list = land;
        this.qDown = down;
        this.qSum = 0;
        const n = this.scan(t, true);
        if (n > 0) return this.qSum / n;
        // 셀 중심을 덮지 못한 작은 삼각형은 무게중심의 셀로
        const gu = (t[0] + t[3] + t[6]) / 3, gv = (t[1] + t[4] + t[7]) / 3, gw = (t[2] + t[5] + t[8]) / 3;
        const i = Math.min(this.nu - 1, Math.max(0, Math.floor((gu - this.u0) / this.cs)));
        const j = Math.min(this.nv - 1, Math.max(0, Math.floor((gv - this.v0) / this.cs)));
        this.addColumn(i * this.nv + j, gw);
        return this.qSum;
    }

    /** 원본 좌표 삼각형을 이 격자의 (u, v, w)로 */
    projectTriangle(p: readonly THREE.Vector3[], out: number[]): number[] {
        const r = this.rows;
        for (let j = 0; j < 3; j++) {
            const { x, y, z } = p[j];
            out[j * 3] = r[0] * x + r[1] * y + r[2] * z;
            out[j * 3 + 1] = r[3] * x + r[4] * y + r[5] * z;
            out[j * 3 + 2] = r[6] * x + r[7] * y + r[8] * z;
        }
        return out;
    }

    /** 좌표 배열의 삼각형 t를 이 격자의 (u, v, w)로 */
    projectAt(tris: ArrayLike<number>, t: number, out: number[]): number[] {
        const r = this.rows;
        for (let j = 0; j < 9; j += 3) {
            const x = tris[t * 9 + j], y = tris[t * 9 + j + 1], z = tris[t * 9 + j + 2];
            out[j] = r[0] * x + r[1] * y + r[2] * z;
            out[j + 1] = r[3] * x + r[4] * y + r[5] * z;
            out[j + 2] = r[6] * x + r[7] * y + r[8] * z;
        }
        return out;
    }

    /** 베드 높이 (w 최솟값) */
    get bedW(): number {
        return this.wMin;
    }
}

/** 삼각형당 정점 좌표 9개 — 비인덱스 Float32 position은 복사 없이 그대로 */
function meshTriangleCoords(pos: MeshPositions, index: THREE.BufferAttribute | null): ArrayLike<number> {
    if (!index && pos instanceof THREE.BufferAttribute && pos.itemSize === 3 && pos.array instanceof Float32Array) {
        return pos.array.subarray(0, Math.floor(pos.count / 3) * 9);
    }
    const triCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
    const out = new Float32Array(triCount * 9);
    const n = triCount * 3;
    if (index && pos instanceof THREE.BufferAttribute && pos.itemSize === 3 && !pos.normalized && index.itemSize === 1) {
        const pa = pos.array;
        const ia = index.array;
        for (let i = 0; i < n; i++) {
            const vi = ia[i] * 3;
            out[i * 3] = pa[vi];
            out[i * 3 + 1] = pa[vi + 1];
            out[i * 3 + 2] = pa[vi + 2];
        }
        return out;
    }
    for (let i = 0; i < n; i++) {
        const vi = index ? index.getX(i) : i;
        out[i * 3] = pos.getX(vi);
        out[i * 3 + 1] = pos.getY(vi);
        out[i * 3 + 2] = pos.getZ(vi);
    }
    return out;
}

/**
 * 평면 배치(rows 셋째 행 = 위 방향) 서포트 그림자 부피(mm³) — 착지면 격자 기준.
 * sign: 감김이 정상이면 1 (바깥 법선 = sign × 삼각형 법선)
 */
function faceSupportVolumeMm3(tris: ArrayLike<number>, rows: readonly number[], sign: number, bedTol: number): number {
    const grid = new SurfaceColumnGrid(tris, rows);
    const land = sign > 0 ? 0 : 1;
    const t = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const triCount = Math.floor(tris.length / 9);
    let vol = 0;
    for (let i = 0; i < triCount; i++) {
        grid.projectAt(tris, i, t);
        const ux = t[3] - t[0], uy = t[4] - t[1], uz = t[5] - t[2];
        const wx = t[6] - t[0], wy = t[7] - t[1], wz = t[8] - t[2];
        const cw = ux * wy - uy * wx;
        const len = Math.hypot(uy * wz - uz * wy, uz * wx - ux * wz, cw);
        if (!(len > 0) || (sign * cw) / len >= -SUPPORT_NORMAL_THRESHOLD) continue;
        if ((t[2] + t[5] + t[8]) / 3 - grid.bedW <= bedTol) continue;
        vol += (Math.abs(cw) / 2) * grid.columnHeight(t, land, true);
    }
    return vol;
}

/** 축 k가 높이(w)인 오른손 좌표계 (u = k+1, v = k+2) */
function axisGridRows(k: number): number[] {
    const r = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    r[(k + 1) % 3] = 1;
    r[3 + ((k + 2) % 3)] = 1;
    r[6 + k] = 1;
    return r;
}

/** 단면 루프 수 샘플링 높이 개수 */
const CONTOUR_SLICES = 64;
/** 곡선 판정: 윤곽을 이 간격(mm)으로 재표본화했을 때 꺾임각이 CURVE_MIN_TURN_DEG 이상인 길이 비율 */
const CURVE_RESAMPLE_MM = 2;
const CURVE_MIN_TURN_DEG = 0.5;
const CURVE_MIN_TURN_COS = Math.cos((CURVE_MIN_TURN_DEG * Math.PI) / 180);

export type ContourStats = {
    /** 단면 윤곽 루프(섬·구멍) 수를 높이로 적분 (루프·mm) */
    loopsMm: number;
    /** 윤곽 길이 중 곡선(재표본 꺾임각 ≥ CURVE_MIN_TURN_DEG) 비율 0~1 */
    curvedFraction: number;
};

/**
 * 높이(rows 셋째 행) 방향으로 균등 단면을 잘라 윤곽 루프를 따라가며 루프 수와 곡선 비율을 구함.
 * 루프마다 진입 이동·리트랙션·Z 리프트가 붙고, 곡선 벽은 꼭짓점마다 감속해 벽 속도에 못 미침.
 * 교차점은 같은 모서리를 공유하는 두 삼각형이 비트 단위로 같은 값을 내도록 낮은 정점 기준으로 보간
 */
export function contourStats(
    tris: ArrayLike<number>,
    rows: readonly number[],
    slices: number = CONTOUR_SLICES
): ContourStats {
    const empty = { loopsMm: 0, curvedFraction: 0 };
    const triCount = Math.floor(tris.length / 9);
    if (!triCount) return empty;
    const [r0, r1, r2, r3, r4, r5, r6, r7, r8] = rows;
    let wMin = Infinity;
    let wMax = -Infinity;
    for (let i = 0; i < triCount * 3; i++) {
        const w = r6 * tris[i * 3] + r7 * tris[i * 3 + 1] + r8 * tris[i * 3 + 2];
        if (w < wMin) wMin = w;
        if (w > wMax) wMax = w;
    }
    const H = wMax - wMin;
    if (!(H > 0)) return empty;
    const dz = H / slices;

    let cap = 1 << 16;
    let segSlice = new Int32Array(cap);
    let seg = new Float64Array(cap * 4);
    let n = 0;
    const push = (s: number, a: number, b: number, c: number, d: number) => {
        if (n === cap) {
            cap *= 2;
            const ns = new Int32Array(cap);
            ns.set(segSlice);
            segSlice = ns;
            const nv = new Float64Array(cap * 4);
            nv.set(seg);
            seg = nv;
        }
        segSlice[n] = s;
        seg[n * 4] = a;
        seg[n * 4 + 1] = b;
        seg[n * 4 + 2] = c;
        seg[n * 4 + 3] = d;
        n++;
    };

    const u = [0, 0, 0];
    const v = [0, 0, 0];
    const w = [0, 0, 0];
    const cut = [0, 0, 0, 0];
    const edgePoint = (a: number, b: number, plane: number, out: number[], o: number) => {
        const lo = w[a] < w[b] ? a : b;
        const hi = lo === a ? b : a;
        const t = (plane - w[lo]) / (w[hi] - w[lo]);
        out[o] = u[lo] + t * (u[hi] - u[lo]);
        out[o + 1] = v[lo] + t * (v[hi] - v[lo]);
    };
    for (let t = 0; t < triCount; t++) {
        const o = t * 9;
        const w0 = r6 * tris[o] + r7 * tris[o + 1] + r8 * tris[o + 2];
        const w1 = r6 * tris[o + 3] + r7 * tris[o + 4] + r8 * tris[o + 5];
        const w2 = r6 * tris[o + 6] + r7 * tris[o + 7] + r8 * tris[o + 8];
        const lo = Math.min(w0, w1, w2);
        const hi = Math.max(w0, w1, w2);
        const s0 = Math.max(0, Math.ceil((lo - wMin) / dz - 0.5));
        const s1 = Math.min(slices - 1, Math.floor((hi - wMin) / dz - 0.5));
        if (s0 > s1) continue;
        w[0] = w0;
        w[1] = w1;
        w[2] = w2;
        for (let j = 0; j < 3; j++) {
            const x = tris[o + j * 3], y = tris[o + j * 3 + 1], z = tris[o + j * 3 + 2];
            u[j] = r0 * x + r1 * y + r2 * z;
            v[j] = r3 * x + r4 * y + r5 * z;
        }
        for (let s = s0; s <= s1; s++) {
            const plane = wMin + (s + 0.5) * dz;
            const a0 = w[0] >= plane, a1 = w[1] >= plane, a2 = w[2] >= plane;
            if (a0 === a1 && a1 === a2) continue;
            // 혼자 반대편인 정점에서 나가는 두 모서리
            const solo = a0 === a1 ? 2 : a0 === a2 ? 1 : 0;
            edgePoint(solo, (solo + 1) % 3, plane, cut, 0);
            edgePoint(solo, (solo + 2) % 3, plane, cut, 2);
            push(s, cut[0], cut[1], cut[2], cut[3]);
        }
    }
    if (!n) return empty;

    // 높이별로 모아 같은 좌표의 끝점을 해시로 한 점으로 묶고 점마다 이어진 두 끝을 기록
    const order = new Int32Array(n);
    const counts = new Int32Array(slices + 1);
    for (let i = 0; i < n; i++) counts[segSlice[i] + 1]++;
    for (let s = 0; s < slices; s++) counts[s + 1] += counts[s];
    const fill = counts.slice(0, slices);
    for (let i = 0; i < n; i++) order[fill[segSlice[i]]++] = i;

    let maxM = 0;
    for (let s = 0; s < slices; s++) maxM = Math.max(maxM, counts[s + 1] - counts[s]);
    let tableSize = 1;
    while (tableSize < maxM * 4) tableSize <<= 1;
    const table = new Int32Array(tableSize);
    const px = new Float64Array(maxM * 2);
    const py = new Float64Array(maxM * 2);
    const id = new Int32Array(maxM * 2);
    const inc = new Int32Array(maxM * 4);
    const visited = new Uint8Array(maxM);
    const bits = new Float64Array(2);
    const words = new Uint32Array(bits.buffer);

    const curve = new ContourCurveMeter();
    let loops = 0;
    for (let s = 0; s < slices; s++) {
        const a = counts[s];
        const m = counts[s + 1] - a;
        if (!m) continue;
        // 끝 p = 선분 × 2 + (0: 시작, 1: 끝), +0은 -0을 0으로 맞춰 해시 비트를 같게 함
        for (let i = 0; i < m; i++) {
            const g = order[a + i] * 4;
            px[i * 2] = seg[g] + 0;
            py[i * 2] = seg[g + 1] + 0;
            px[i * 2 + 1] = seg[g + 2] + 0;
            py[i * 2 + 1] = seg[g + 3] + 0;
        }
        let size = 1;
        while (size < m * 4) size <<= 1;
        const mask = size - 1;
        table.fill(-1, 0, size);
        let unique = 0;
        for (let p = 0; p < m * 2; p++) {
            bits[0] = px[p];
            bits[1] = py[p];
            let h = Math.imul(words[0] ^ words[1], 0x9e3779b1) ^ Math.imul(words[2] ^ words[3], 0x85ebca77);
            h = (h ^ (h >>> 15)) & mask;
            for (;;) {
                const q = table[h];
                if (q < 0) {
                    table[h] = p;
                    id[p] = unique++;
                    break;
                }
                if (px[q] === px[p] && py[q] === py[p]) {
                    id[p] = id[q];
                    break;
                }
                h = (h + 1) & mask;
            }
        }
        inc.fill(-1, 0, unique * 2);
        for (let p = 0; p < m * 2; p++) {
            const slot = id[p] * 2;
            if (inc[slot] < 0) inc[slot] = p;
            else if (inc[slot + 1] < 0) inc[slot + 1] = p;
        }

        // 선분을 이어 따라가며 루프마다 곡선 길이 측정 (비다양체 점은 끊긴 열린 경로로)
        visited.fill(0, 0, m);
        for (let start = 0; start < m; start++) {
            if (visited[start]) continue;
            loops++;
            curve.begin();
            let cur = start;
            let e = 0;
            let closed = false;
            for (;;) {
                visited[cur] = 1;
                curve.add(px[cur * 2 + e], py[cur * 2 + e]);
                const out = cur * 2 + (1 - e);
                const slot = id[out] * 2;
                const next = inc[slot] === out ? inc[slot + 1] : inc[slot];
                if (next < 0) {
                    curve.add(px[out], py[out]);
                    break;
                }
                if (visited[next >> 1]) {
                    closed = next >> 1 === start;
                    if (!closed) curve.add(px[out], py[out]);
                    break;
                }
                cur = next >> 1;
                e = next & 1;
            }
            curve.end(closed);
        }
    }
    return { loopsMm: loops * dz, curvedFraction: curve.fraction };
}

/** 윤곽 점열을 일정 간격으로 재표본화해 꺾임각이 임계 이상인 길이를 누적 */
class ContourCurveMeter {
    private xs: number[] = [];
    private ys: number[] = [];
    private lens: number[] = [];
    private total = 0;
    private curved = 0;

    begin(): void {
        this.xs.length = 0;
        this.ys.length = 0;
    }

    add(x: number, y: number): void {
        this.xs.push(x);
        this.ys.push(y);
    }

    end(closed: boolean): void {
        const { xs, ys, lens } = this;
        const np = xs.length;
        if (np < 2) return;
        const segs = closed ? np : np - 1;
        lens.length = segs;
        let per = 0;
        for (let i = 0; i < segs; i++) {
            const j = i + 1 < np ? i + 1 : 0;
            const dx = xs[j] - xs[i], dy = ys[j] - ys[i];
            lens[i] = Math.sqrt(dx * dx + dy * dy);
            per += lens[i];
        }
        if (!(per > 0)) return;
        const count = Math.max(closed ? 3 : 2, Math.round(per / CURVE_RESAMPLE_MM));
        const ds = per / (closed ? count : count - 1);
        // 호 길이 k·ds 지점 좌표
        const rx = new Float64Array(count);
        const ry = new Float64Array(count);
        let i = 0;
        let acc = 0;
        for (let k = 0; k < count; k++) {
            const target = k * ds;
            while (acc + lens[i] < target && i < segs - 1) acc += lens[i++];
            const j = i + 1 < np ? i + 1 : 0;
            const f = lens[i] > 0 ? Math.min(1, (target - acc) / lens[i]) : 0;
            rx[k] = xs[i] + f * (xs[j] - xs[i]);
            ry[k] = ys[i] + f * (ys[j] - ys[i]);
        }
        let curved = 0;
        const first = closed ? 0 : 1;
        const last = closed ? count : count - 1;
        for (let k = first; k < last; k++) {
            const pk = k > 0 ? k - 1 : count - 1;
            const nk = k + 1 < count ? k + 1 : 0;
            const ax = rx[k] - rx[pk], ay = ry[k] - ry[pk];
            const bx = rx[nk] - rx[k], by = ry[nk] - ry[k];
            const la2 = ax * ax + ay * ay, lb2 = bx * bx + by * by;
            if (la2 > 0 && lb2 > 0 && ax * bx + ay * by < CURVE_MIN_TURN_COS * Math.sqrt(la2 * lb2)) curved++;
        }
        const samples = last - first;
        this.total += per;
        if (samples > 0) this.curved += (per * curved) / samples;
    }

    get fraction(): number {
        return this.total > 0 ? Math.min(1, this.curved / this.total) : 0;
    }
}

export function aabbVolumeCm3(box: { x: number; y: number; z: number }): number {
    const x = Math.max(0, Number(box.x) || 0);
    const y = Math.max(0, Number(box.y) || 0);
    const z = Math.max(0, Number(box.z) || 0);
    return (x * y * z) / 1000;
}

export function aabbSurfaceCm2(box: { x: number; y: number; z: number }): number {
    const x = Math.max(0, Number(box.x) || 0);
    const y = Math.max(0, Number(box.y) || 0);
    const z = Math.max(0, Number(box.z) || 0);
    return (2 * (x * y + y * z + x * z)) / 100;
}

/**
 * 고폴리·비밀폐 메쉬에서 삼각형 합·샘플 보간이 부피/표면을 수천 배로 부풀리는 것을 막습니다.
 */
export function sanitizeGeometryAnalysis(analysis: GeometryAnalysis): GeometryAnalysis {
    const box = analysis.boundingBox;
    const maxVol = aabbVolumeCm3(box);
    const aabbSurf = aabbSurfaceCm2(box);
    const maxSurf = aabbSurf > 0 ? aabbSurf * MAX_SURFACE_TO_AABB_RATIO : Math.max(0, analysis.surfaceArea);

    const volume =
        maxVol > 0 ? Math.min(Math.max(0, analysis.volume), maxVol) : Math.max(0, analysis.volume);
    const surfaceArea =
        maxSurf > 0 ? Math.min(Math.max(0, analysis.surfaceArea), maxSurf) : Math.max(0, analysis.surfaceArea);
    const maxOverhang = surfaceArea * MAX_OVERHANG_TO_SURFACE_RATIO;
    const clampOverhang = (v: number) => Math.min(Math.max(0, Number(v) || 0), maxOverhang);
    // 서포트는 모델 AABB 안의 빈 공간만 채움
    const maxSupportVolume = Math.max(0, maxVol - volume);
    const clampSupportVolume = (v: number) => {
        const n = Math.max(0, Number(v) || 0);
        return maxVol > 0 ? Math.min(n, maxSupportVolume) : n;
    };

    const clampArea = (v: number) => Math.min(Math.max(0, Number(v) || 0), surfaceArea);
    type AreaKey = (typeof ORIENTATION_AREA_KEYS)[number] | 'slowWallArea' | 'contourLoops';
    const pickAreas = (src: Partial<Record<AreaKey, number>>) => {
        const out: Partial<Record<AreaKey, number>> = {};
        if (src.contourLoops != null) out.contourLoops = Math.max(0, Number(src.contourLoops) || 0);
        for (const k of ORIENTATION_AREA_KEYS) {
            if (src[k] != null) out[k] = clampArea(src[k]!);
        }
        if (src.slowWallArea != null) {
            out.slowWallArea = Math.min(
                Math.max(0, Number(src.slowWallArea) || 0),
                surfaceArea * P2S_MAX_SLOW_WALL_TO_SURFACE_RATIO
            );
        }
        return out;
    };

    const overhangArea =
        analysis.overhangArea == null ? undefined : clampOverhang(analysis.overhangArea);
    const supportVolume =
        analysis.supportVolume == null ? undefined : clampSupportVolume(analysis.supportVolume);

    let orientations: GeometryAnalysis['orientations'];
    if (analysis.orientations) {
        orientations = {};
        for (const key of UP_AXIS_KEYS) {
            const o = analysis.orientations[key];
            if (!o) continue;
            orientations[key] = {
                overhangArea: clampOverhang(o.overhangArea),
                supportVolume: clampSupportVolume(o.supportVolume),
                ...pickAreas(o),
                ...(o.partHeightSum != null ? { partHeightSum: o.partHeightSum } : {}),
            };
        }
    }
    const faceOrientations = analysis.faceOrientations?.map((f) => ({
        down: f.down,
        box: f.box,
        overhangArea: clampOverhang(f.overhangArea),
        supportVolume: Math.min(
            Math.max(0, Number(f.supportVolume) || 0),
            Math.max(0, aabbVolumeCm3(f.box) - volume)
        ),
        ...pickAreas(f),
    }));

    return {
        ...analysis,
        volume,
        surfaceArea,
        overhangArea,
        ...(supportVolume !== undefined ? { supportVolume } : {}),
        ...pickAreas(analysis),
        ...(orientations ? { orientations } : {}),
        ...(faceOrientations ? { faceOrientations } : {}),
    };
}

export function getTriangleCount(geometry: THREE.BufferGeometry): number {
    if (!geometry.attributes.position) return 0;
    const index = geometry.index;
    if (index) return Math.floor(index.count / 3);
    return Math.floor(geometry.attributes.position.count / 3);
}

function getBoundingBoxSize(geometry: THREE.BufferGeometry): THREE.Vector3 {
    if (!geometry.boundingBox) {
        geometry.computeBoundingBox();
    }
    const size = new THREE.Vector3();
    geometry.boundingBox!.getSize(size);
    return size;
}

/** 바운딩 박스 기반 근사 견적 — 파싱 직후 UI 잠금 해제용 */
export function analyzeGeometryBoundingBox(geometry: THREE.BufferGeometry): GeometryAnalysis {
    if (!geometry.attributes.position) {
        throw new Error('Invalid geometry');
    }

    const size = getBoundingBoxSize(geometry);
    const bboxVolumeMm3 = size.x * size.y * size.z;
    const approxFill = 0.38;

    return sanitizeGeometryAnalysis({
        volume: (bboxVolumeMm3 * approxFill) / 1000,
        surfaceArea: (2 * (size.x * size.y + size.y * size.z + size.x * size.z)) / 100,
        overhangArea: 0,
        boundingBox: {
            x: size.x,
            y: size.y,
            z: size.z,
        },
    });
}

type AnalyzeOptions = {
    /** 1 = 전체, N = N번째 삼각형만 샘플 */
    sampleStride?: number;
    includeOverhang?: boolean;
};

function analyzeGeometryInternal(geometry: THREE.BufferGeometry, options: AnalyzeOptions = {}): GeometryAnalysis {
    if (!geometry.attributes.position) {
        throw new Error('Invalid geometry');
    }

    const sampleStride = Math.max(1, options.sampleStride ?? 1);
    const includeOverhang = options.includeOverhang ?? true;

    const pos = geometry.attributes.position;
    const index = geometry.index;

    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const bbox = geometry.boundingBox!;
    const bboxMin = [bbox.min.x, bbox.min.y, bbox.min.z];
    const bboxMax = [bbox.max.x, bbox.max.y, bbox.max.z];
    const bedTol = [0, 1, 2].map((k) =>
        Math.max(BED_CONTACT_TOLERANCE_MM, (bboxMax[k] - bboxMin[k]) * BED_CONTACT_TOLERANCE_RATIO)
    );

    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    const cross = new THREE.Vector3();

    let volume = 0;
    let surfaceArea = 0;

    // [축 k][면 방향: 0=법선 -k, 1=법선 +k][기준 바닥: 0=min_k(+k 위), 1=max_k(-k 위)]
    // 감김 방향이 뒤집힌 메쉬는 법선 부호가 반대이므로, 둘 다 누적 후 부피 부호로 선택
    const ovArea = [0, 1, 2].map(() => [[0, 0], [0, 0]]);
    const ovVol = [0, 1, 2].map(() => [[0, 0], [0, 0]]);
    const bedArea = [0, 1, 2].map(() => [[0, 0], [0, 0]]);
    // 축 k 기준 측면(Σ A·sinθ), 법선 +k / -k 쪽 면의 윗면·아랫면 솔리드 투영과 오버행 감속 외벽
    const lateral = [0, 0, 0];
    const topSolid = [[0, 0], [0, 0], [0, 0]];
    const bottomSolid = [[0, 0], [0, 0], [0, 0]];
    const slowWall = [[0, 0], [0, 0], [0, 0]];
    const centroid = [0, 0, 0];
    const normal = [0, 0, 0];
    const clusters = new Map<number, NormalCluster>();
    const tris = includeOverhang ? meshTriangleCoords(pos, index) : null;
    const grids = tris ? [0, 1, 2].map((k) => new SurfaceColumnGrid(tris, axisGridRows(k))) : [];
    const tri = [p1, p2, p3];
    const t9 = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    const processTriangle = (i0: number, i1: number, i2: number) => {
        p1.fromBufferAttribute(pos, i0);
        p2.fromBufferAttribute(pos, i1);
        p3.fromBufferAttribute(pos, i2);
        volume += p1.dot(cross.copy(p2).cross(p3)) / 6.0;

        e1.subVectors(p2, p1);
        e2.subVectors(p3, p1);
        cross.crossVectors(e1, e2);
        const len = cross.length();
        const area = len * 0.5;
        surfaceArea += area;

        if (!includeOverhang || !(len > 0)) return;

        normal[0] = cross.x / len;
        normal[1] = cross.y / len;
        normal[2] = cross.z / len;
        centroid[0] = (p1.x + p2.x + p3.x) / 3;
        centroid[1] = (p1.y + p2.y + p3.y) / 3;
        centroid[2] = (p1.z + p2.z + p3.z) / 3;
        addToNormalCluster(clusters, normal, area);

        for (let k = 0; k < 3; k++) {
            const nk = normal[k];
            const absNk = Math.abs(nk);
            const projected = area * absNk;
            const sin = Math.sqrt(Math.max(0, 1 - nk * nk));
            lateral[k] += area * sin;
            const side = nk > 0 ? 1 : 0;
            topSolid[k][side] += projected * p2sShellSolidFraction(absNk, sin, P2S_PROFILE.topShellLayers);
            bottomSolid[k][side] += projected * p2sShellSolidFraction(absNk, sin, P2S_PROFILE.bottomShellLayers);
            slowWall[k][side] += area * sin * p2sOverhangWallExtra(absNk, sin);

            const face = nk < -SUPPORT_NORMAL_THRESHOLD ? 0 : nk > SUPPORT_NORMAL_THRESHOLD ? 1 : -1;
            if (face < 0) continue;
            const hFromMin = centroid[k] - bboxMin[k];
            const hFromMax = bboxMax[k] - centroid[k];
            // 착지면 = 오버행 면과 반대 부호 법선의 표면 → 법선 -k 면(face 0)은 +k 목록(0)
            if (hFromMin > bedTol[k] || hFromMax > bedTol[k]) grids[k].projectTriangle(tri, t9);
            // 바닥에 닿는 면은 서포트 대상 아님 (첫 레이어 면적으로 집계)
            if (hFromMin > bedTol[k]) {
                ovArea[k][face][0] += area;
                ovVol[k][face][0] += projected * grids[k].columnHeight(t9, face, true);
            } else {
                bedArea[k][face][0] += projected;
            }
            if (hFromMax > bedTol[k]) {
                ovArea[k][face][1] += area;
                ovVol[k][face][1] += projected * grids[k].columnHeight(t9, face, false);
            } else {
                bedArea[k][face][1] += projected;
            }
        }
    };

    if (index) {
        const triCount = Math.floor(index.count / 3);
        for (let t = 0; t < triCount; t += sampleStride) {
            const i = t * 3;
            processTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
        }
    } else {
        const triCount = Math.floor(pos.count / 3);
        for (let t = 0; t < triCount; t += sampleStride) {
            const i = t * 3;
            processTriangle(i, i + 1, i + 2);
        }
    }

    const scale = sampleStride;
    const size = getBoundingBoxSize(geometry);

    let orientations: GeometryAnalysis['orientations'];
    if (includeOverhang) {
        // 바깥 법선(정상 감김): +k가 위면 법선 -k 면이 오버행
        const outward = volume >= 0;
        const down = outward ? 0 : 1;
        const up = outward ? 1 : 0;
        const axes = ['x', 'y', 'z'] as const;
        const cm2 = (mm2: number) => (mm2 * scale) / 100;
        orientations = {};
        // 실제로 +k / -k를 향하는 면 (감김이 뒤집힌 메쉬는 법선 부호 반대)
        const plus = outward ? 1 : 0;
        const minus = 1 - plus;
        for (let k = 0; k < 3; k++) {
            orientations[`+${axes[k]}`] = {
                overhangArea: cm2(ovArea[k][down][0]),
                supportVolume: (ovVol[k][down][0] * scale) / 1000,
                lateralArea: cm2(lateral[k]),
                topArea: cm2(topSolid[k][plus]),
                bottomArea: cm2(bottomSolid[k][minus]),
                bedArea: cm2(bedArea[k][down][0]),
                slowWallArea: cm2(slowWall[k][minus]),
            };
            orientations[`-${axes[k]}`] = {
                overhangArea: cm2(ovArea[k][up][1]),
                supportVolume: (ovVol[k][up][1] * scale) / 1000,
                lateralArea: cm2(lateral[k]),
                topArea: cm2(topSolid[k][minus]),
                bottomArea: cm2(bottomSolid[k][plus]),
                bedArea: cm2(bedArea[k][up][1]),
                slowWallArea: cm2(slowWall[k][plus]),
            };
        }
    }

    if (orientations && tris) {
        const axes = ['x', 'y', 'z'] as const;
        for (let k = 0; k < 3; k++) {
            const c = contourStats(tris, axisGridRows(k));
            for (const sign of ['+', '-'] as const) {
                const o = orientations[`${sign}${axes[k]}`]!;
                o.contourLoops = c.loopsMm;
                o.curvedWallArea = (o.lateralArea ?? 0) * c.curvedFraction;
            }
        }
    }

    const faceOrientations = tris
        ? buildFaceOrientations(pos, index, tris, clusters, volume >= 0 ? 1 : -1, surfaceArea)
        : [];

    const placed = orientations?.['+z'];
    return sanitizeGeometryAnalysis({
        volume: (Math.abs(volume) * scale) / 1000,
        surfaceArea: (surfaceArea * scale) / 100,
        overhangArea: placed?.overhangArea,
        supportVolume: placed?.supportVolume,
        ...(placed
            ? {
                  lateralArea: placed.lateralArea,
                  topArea: placed.topArea,
                  bottomArea: placed.bottomArea,
                  bedArea: placed.bedArea,
                  slowWallArea: placed.slowWallArea,
                  curvedWallArea: placed.curvedWallArea,
                  contourLoops: placed.contourLoops,
              }
            : {}),
        ...(orientations ? { orientations } : {}),
        ...(faceOrientations.length ? { faceOrientations } : {}),
        boundingBox: {
            x: size.x,
            y: size.y,
            z: size.z,
        },
    });
}

type NormalCluster = { area: number; nx: number; ny: number; nz: number };

const NORMAL_CLUSTER_BINS = 50;
/** 평면 후보 최소 면적 — max(1cm², 표면적의 1%) */
const FACE_MIN_AREA_MM2 = 100;
const FACE_MIN_AREA_RATIO = 0.01;
/** 이보다 축에 가까운 법선은 6방향 배치가 이미 다룸 */
const FACE_AXIS_ALIGNED_COS = 0.995;
/** 격자 경계에 걸쳐 나뉜 같은 평면을 합치는 법선 유사도 */
const FACE_MERGE_COS = 0.998;
const FACE_MERGE_SCAN_MAX = 4000;
const FACE_PRESELECT = 8;
const FACE_CANDIDATES_MAX = 3;
/** 평면 면적 중 이 비율 이상이 베드에 닿아야 '면에 놓기' 후보 */
const FACE_MIN_BED_FRACTION = 0.5;

/** 법선 방향 격자(약 1.1°)로 면적·가중 법선 누적 */
function addToNormalCluster(clusters: Map<number, NormalCluster>, n: number[], area: number): void {
    const B = NORMAL_CLUSTER_BINS;
    const key =
        (Math.round(n[0] * B) + B) * (2 * B + 1) * (2 * B + 1) +
        (Math.round(n[1] * B) + B) * (2 * B + 1) +
        (Math.round(n[2] * B) + B);
    let c = clusters.get(key);
    if (!c) clusters.set(key, (c = { area: 0, nx: 0, ny: 0, nz: 0 }));
    c.area += area;
    c.nx += n[0] * area;
    c.ny += n[1] * area;
    c.nz += n[2] * area;
}

/**
 * 축에 맞지 않은 큰 평면 중 모델의 바깥 끝에 있는 면(바닥에 놓을 수 있는 면)을 골라
 * 그 면을 바닥에 놓았을 때의 서포트·면적·AABB를 계산.
 * sign: 감김이 정상이면 1, 뒤집혔으면 -1 (바깥 법선 = sign × 삼각형 법선)
 */
function buildFaceOrientations(
    pos: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
    index: THREE.BufferAttribute | null,
    tris: ArrayLike<number>,
    clusters: Map<number, NormalCluster>,
    sign: number,
    surfaceMm2: number
): FaceOrientation[] {
    const minArea = Math.max(FACE_MIN_AREA_MM2, surfaceMm2 * FACE_MIN_AREA_RATIO);
    // 이웃 격자로 나뉜 같은 방향 면을 합침
    const groups: NormalCluster[] = [];
    let scanned = 0;
    for (const c of [...clusters.values()].sort((a, b) => b.area - a.area)) {
        if (c.area < minArea * 0.1 || ++scanned > FACE_MERGE_SCAN_MAX) break;
        const cl = Math.hypot(c.nx, c.ny, c.nz);
        if (!(cl > 0)) continue;
        const g = groups.find((g) => {
            const gl = Math.hypot(g.nx, g.ny, g.nz);
            return (g.nx * c.nx + g.ny * c.ny + g.nz * c.nz) / (gl * cl) > FACE_MERGE_COS;
        });
        if (g) {
            g.area += c.area;
            g.nx += c.nx;
            g.ny += c.ny;
            g.nz += c.nz;
        } else {
            groups.push({ ...c });
        }
    }

    type Cand = { n: Vec3Tuple; area: number; rows: number[] };
    const pre: Cand[] = [];
    for (const c of groups.sort((a, b) => b.area - a.area)) {
        if (c.area < minArea || pre.length >= FACE_PRESELECT) break;
        const len = Math.hypot(c.nx, c.ny, c.nz);
        const n: Vec3Tuple = [(sign * c.nx) / len, (sign * c.ny) / len, (sign * c.nz) / len];
        if (Math.max(Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2])) >= FACE_AXIS_ALIGNED_COS) continue;
        pre.push({ n, area: c.area, rows: layFlatMatrix(n) });
    }
    if (!pre.length) return [];

    // 정점 범위: 법선 방향(높이)과 배치 후 X·Y
    const ext = pre.map(() => [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity]);
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        for (let j = 0; j < pre.length; j++) {
            const { n, rows } = pre[j];
            const e = ext[j];
            const d = x * n[0] + y * n[1] + z * n[2];
            const px = rows[0] * x + rows[1] * y + rows[2] * z;
            const py = rows[3] * x + rows[4] * y + rows[5] * z;
            if (d < e[0]) e[0] = d;
            if (d > e[1]) e[1] = d;
            if (px < e[2]) e[2] = px;
            if (px > e[3]) e[3] = px;
            if (py < e[4]) e[4] = py;
            if (py > e[5]) e[5] = py;
        }
    }

    const chosen = pre.map((c, j) => {
        const e = ext[j];
        const height = e[1] - e[0];
        const tol = Math.max(BED_CONTACT_TOLERANCE_MM, height * BED_CONTACT_TOLERANCE_RATIO);
        return { ...c, maxD: e[1], tol, box: { x: e[3] - e[2], y: e[5] - e[4], z: height } };
    });

    const acc = chosen.map(() => ({
        overhang: 0, supportVol: 0, bed: 0, lateral: 0, top: 0, bottom: 0, slow: 0,
    }));
    const triCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
    const v = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let t = 0; t < triCount; t++) {
        for (let j = 0; j < 3; j++) {
            const vi = index ? index.getX(t * 3 + j) : t * 3 + j;
            v[j * 3] = pos.getX(vi);
            v[j * 3 + 1] = pos.getY(vi);
            v[j * 3 + 2] = pos.getZ(vi);
        }
        const ux = v[3] - v[0], uy = v[4] - v[1], uz = v[5] - v[2];
        const wx = v[6] - v[0], wy = v[7] - v[1], wz = v[8] - v[2];
        const cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
        const len = Math.hypot(cx, cy, cz);
        if (!(len > 0)) continue;
        const area = len / 2;
        const gx = (v[0] + v[3] + v[6]) / 3, gy = (v[1] + v[4] + v[7]) / 3, gz = (v[2] + v[5] + v[8]) / 3;
        for (let j = 0; j < chosen.length; j++) {
            const { n, maxD, tol } = chosen[j];
            const a = acc[j];
            // 위 방향 = -n
            const nu = (-sign * (cx * n[0] + cy * n[1] + cz * n[2])) / len;
            const absNu = Math.abs(nu);
            const projected = area * absNu;
            const sin = Math.sqrt(Math.max(0, 1 - nu * nu));
            a.lateral += area * sin;
            if (nu > 0) {
                a.top += projected * p2sShellSolidFraction(absNu, sin, P2S_PROFILE.topShellLayers);
                continue;
            }
            a.bottom += projected * p2sShellSolidFraction(absNu, sin, P2S_PROFILE.bottomShellLayers);
            a.slow += area * sin * p2sOverhangWallExtra(absNu, sin);
            if (nu >= -SUPPORT_NORMAL_THRESHOLD) continue;
            const h = maxD - (gx * n[0] + gy * n[1] + gz * n[2]);
            if (h > tol) {
                a.overhang += area;
                a.supportVol += projected * h;
            } else {
                a.bed += projected;
            }
        }
    }

    // 평면이 법선 방향 끝(=놓았을 때 바닥)에 있어 실제로 베드에 닿는 후보만
    const placeable = chosen
        .map((c, j) => ({ c, a: acc[j] }))
        .filter(({ c, a }) => a.bed >= c.area * FACE_MIN_BED_FRACTION)
        .sort((p, q) => q.a.bed - p.a.bed)
        .slice(0, FACE_CANDIDATES_MAX);
    for (const { c, a } of placeable) {
        if (a.supportVol > 0) a.supportVol = faceSupportVolumeMm3(tris, c.rows, sign, c.tol);
    }

    return placeable.map(({ c, a }) => {
        const contour = contourStats(tris, c.rows);
        return {
            down: c.n,
            box: c.box,
            overhangArea: a.overhang / 100,
            supportVolume: a.supportVol / 1000,
            lateralArea: a.lateral / 100,
            topArea: a.top / 100,
            bottomArea: a.bottom / 100,
            bedArea: a.bed / 100,
            slowWallArea: a.slow / 100,
            curvedWallArea: (a.lateral / 100) * contour.curvedFraction,
            contourLoops: contour.loopsMm,
        };
    });
}

/** 병합 지오메트리 안의 개별 객체 범위 (index가 있으면 index 원소 단위, 없으면 정점 단위) */
export type ModelPartRange = { start: number; count: number };
export const MODEL_PARTS_USERDATA_KEY = 'modelParts';

export function getModelPartRanges(geometry: THREE.BufferGeometry): ModelPartRange[] | null {
    const ranges = geometry.userData?.[MODEL_PARTS_USERDATA_KEY] as ModelPartRange[] | undefined;
    return Array.isArray(ranges) && ranges.length > 1 ? ranges : null;
}

function extractPartGeometry(geometry: THREE.BufferGeometry, range: ModelPartRange): THREE.BufferGeometry {
    const pos = geometry.attributes.position;
    const index = geometry.index;
    const out = new Float32Array(range.count * 3);
    for (let i = 0; i < range.count; i++) {
        const vi = index ? index.getX(range.start + i) : range.start + i;
        out[i * 3] = pos.getX(vi);
        out[i * 3 + 1] = pos.getY(vi);
        out[i * 3 + 2] = pos.getZ(vi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(out, 3));
    return g;
}

/** 비밀폐 메쉬의 부호 있는 부피는 원점 위치에 따라 달라지므로 객체 중심을 원점에 둠 */
function centerPartGeometry(g: THREE.BufferGeometry): THREE.Vector3 {
    g.computeBoundingBox();
    const center = new THREE.Vector3();
    g.boundingBox!.getCenter(center);
    g.translate(-center.x, -center.y, -center.z);
    return center;
}

const ORIENTATION_SUM_KEYS = [
    'overhangArea',
    'supportVolume',
    'lateralArea',
    'topArea',
    'bottomArea',
    'bedArea',
    'slowWallArea',
    'curvedWallArea',
    'contourLoops',
] as const;

/**
 * 다중 객체 플레이트: 객체마다 분석해 합산.
 * 서포트 그림자는 객체 자신의 AABB 안으로 제한되어야 하므로(플레이트 전체 AABB로는 과대) 객체 단위로 산출.
 * 회전은 플레이트 전체에 같이 적용되므로 축별 지표는 객체 합과 같고, 평면 배치 후보는 두지 않음.
 */
function analyzeMultiPartGeometry(geometry: THREE.BufferGeometry, ranges: ModelPartRange[]): GeometryAnalysis {
    const parts: { a: GeometryAnalysis; center: THREE.Vector3 }[] = [];
    for (const range of ranges) {
        const g = extractPartGeometry(geometry, range);
        const center = centerPartGeometry(g);
        const a = analyzeGeometryInternal(g, { sampleStride: 1, includeOverhang: true });
        g.dispose();
        if (a.volume > 0) parts.push({ a, center });
    }
    if (parts.length < 2) {
        return analyzeGeometryInternal(geometry, { sampleStride: 1, includeOverhang: true });
    }

    const axisSize = (box: GeometryAnalysis['boundingBox'], key: UpAxisKey) => box[key[1] as 'x' | 'y' | 'z'];
    const orientations: NonNullable<GeometryAnalysis['orientations']> = {};
    for (const key of UP_AXIS_KEYS) {
        const sum: OrientationSupport = { overhangArea: 0, supportVolume: 0, partHeightSum: 0 };
        for (const { a } of parts) {
            const o = a.orientations?.[key];
            for (const k of ORIENTATION_SUM_KEYS) {
                sum[k] = (sum[k] ?? 0) + (Number(o?.[k]) || 0);
            }
            sum.partHeightSum! += axisSize(a.boundingBox, key);
        }
        orientations[key] = sum;
    }

    let spacingSum = 0;
    for (let i = 0; i < parts.length; i++) {
        let nearest = Infinity;
        for (let j = 0; j < parts.length; j++) {
            if (i !== j) nearest = Math.min(nearest, parts[i].center.distanceTo(parts[j].center));
        }
        spacingSum += nearest;
    }

    const size = getBoundingBoxSize(geometry);
    const placed = orientations['+z']!;
    return sanitizeGeometryAnalysis({
        volume: parts.reduce((s, p) => s + p.a.volume, 0),
        surfaceArea: parts.reduce((s, p) => s + p.a.surfaceArea, 0),
        ...placed,
        orientations,
        partCount: parts.length,
        partSpacing: spacingSum / parts.length,
        boundingBox: { x: size.x, y: size.y, z: size.z },
    });
}

// 부피는 원점 기준 부호 있는 사면체 합이라 상쇄가 커서 삼각형 샘플링 시 오차가 수십~수백 %에 달함 → 항상 전체 순회
export const analyzeGeometry = (geometry: THREE.BufferGeometry): GeometryAnalysis => {
    if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
    }
    const ranges = getModelPartRanges(geometry);
    if (ranges) return analyzeMultiPartGeometry(geometry, ranges);
    return analyzeGeometryInternal(geometry, { sampleStride: 1, includeOverhang: true });
};

const yieldToMain = () =>
    new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => resolve());
        } else {
            setTimeout(resolve, 0);
        }
    });

/**
 * 대용량 메쉬: 1) 바운딩 박스 근사로 즉시 콜백 → 2) 전체 정밀 분석으로 갱신
 */
export async function analyzeGeometryProgressive(
    geometry: THREE.BufferGeometry,
    onPartial?: (data: GeometryAnalysis) => void
): Promise<GeometryAnalysis> {
    const triCount = getTriangleCount(geometry);

    if (triCount <= LARGE_MESH_TRIANGLE_THRESHOLD) {
        const full = analyzeGeometry(geometry);
        onPartial?.(full);
        return full;
    }

    const quick = analyzeGeometryBoundingBox(geometry);
    onPartial?.(quick);

    await yieldToMain();

    return analyzeGeometry(geometry);
}
