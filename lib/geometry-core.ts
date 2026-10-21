/**
 * 지오메트리 분석 타입·상수·정리 함수 (three.js 없음).
 * 스토어·견적 계산처럼 모든 페이지에서 쓰이는 코드가 three.js를 번들에 끌어오지 않도록 lib/geometry.ts에서 분리했다.
 */
import { P2S_MAX_SLOW_WALL_TO_SURFACE_RATIO } from '@/lib/print-time-estimate';
import type { Vec3Tuple } from '@/lib/stl-bake';

/** 원본 좌표에서 출력 시 위(+Z)를 향하게 되는 축 */
export type UpAxisKey = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';
export const UP_AXIS_KEYS: readonly UpAxisKey[] = ['+x', '-x', '+y', '-y', '+z', '-z'];

export type OrientationSupport = {
    /** 서포트가 필요한 오버행 면적 (cm², 바닥 접촉면 제외) */
    overhangArea: number;
    /** 오버행 아래 그림자 부피 — 서포트가 채울 공간 (cm³, 채움률 적용 전) */
    supportVolume: number;
    /** 서포트 기둥의 부피 가중 평균 높이 Σa·h² / Σa·h (mm) — 낮은 기둥은 채움 비율이 낮음 */
    supportColumnMm?: number;
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
    /** 현재 배치의 서포트 기둥 부피 가중 평균 높이 (mm) */
    supportColumnMm?: number;
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
    type AreaKey = (typeof ORIENTATION_AREA_KEYS)[number] | 'slowWallArea' | 'contourLoops' | 'supportColumnMm';
    const pickAreas = (src: Partial<Record<AreaKey, number>>) => {
        const out: Partial<Record<AreaKey, number>> = {};
        if (src.contourLoops != null) out.contourLoops = Math.max(0, Number(src.contourLoops) || 0);
        if (src.supportColumnMm != null && Number.isFinite(Number(src.supportColumnMm))) {
            out.supportColumnMm = Math.max(0, Number(src.supportColumnMm));
        }
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
