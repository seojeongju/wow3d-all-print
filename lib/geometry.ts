import * as THREE from 'three';
import {
    P2S_MAX_SLOW_WALL_TO_SURFACE_RATIO,
    P2S_PROFILE,
    p2sOverhangWallExtra,
    p2sShellSolidFraction,
} from '@/lib/print-time-estimate';

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
};

const ORIENTATION_AREA_KEYS = ['lateralArea', 'topArea', 'bottomArea', 'bedArea'] as const;

export interface GeometryAnalysis {
    volume: number; // cm³
    surfaceArea: number; // cm²
    overhangArea?: number; // cm² (Optional for backward compatibility)
    /** 출력 시 그 축을 위로 세웠을 때의 서포트 지표 (슬라이서식 바닥 배치 기준) */
    orientations?: Partial<Record<UpAxisKey, OrientationSupport>>;
    /** 현재 배치의 서포트 그림자 부피 (cm³) — applyTransformToAnalysis가 채움 */
    supportVolume?: number;
    /** 현재 배치의 측면·윗면·바닥·베드 접촉 면적 (cm²) — 출력 시간 산출용 */
    lateralArea?: number;
    topArea?: number;
    bottomArea?: number;
    bedArea?: number;
    slowWallArea?: number;
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
    type AreaKey = (typeof ORIENTATION_AREA_KEYS)[number] | 'slowWallArea';
    const pickAreas = (src: Partial<Record<AreaKey, number>>) => {
        const out: Partial<Record<AreaKey, number>> = {};
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
            };
        }
    }

    return {
        ...analysis,
        volume,
        surfaceArea,
        overhangArea,
        ...(supportVolume !== undefined ? { supportVolume } : {}),
        ...pickAreas(analysis),
        ...(orientations ? { orientations } : {}),
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
            // 바닥에 닿는 면은 서포트 대상 아님 (첫 레이어 면적으로 집계)
            if (hFromMin > bedTol[k]) {
                ovArea[k][face][0] += area;
                ovVol[k][face][0] += projected * hFromMin;
            } else {
                bedArea[k][face][0] += projected;
            }
            if (hFromMax > bedTol[k]) {
                ovArea[k][face][1] += area;
                ovVol[k][face][1] += projected * hFromMax;
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
              }
            : {}),
        ...(orientations ? { orientations } : {}),
        boundingBox: {
            x: size.x,
            y: size.y,
            z: size.z,
        },
    });
}

// 부피는 원점 기준 부호 있는 사면체 합이라 상쇄가 커서 삼각형 샘플링 시 오차가 수십~수백 %에 달함 → 항상 전체 순회
export const analyzeGeometry = (geometry: THREE.BufferGeometry): GeometryAnalysis => {
    if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
    }
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
