import * as THREE from 'three';

export interface GeometryAnalysis {
    volume: number; // cm³
    surfaceArea: number; // cm²
    overhangArea?: number; // cm² (Optional for backward compatibility)
    boundingBox: {
        x: number; // mm
        y: number; // mm
        z: number; // mm
    };
}

/** 전체 삼각형 루프 없이 즉시 치수만 산출 (대용량·AI 메쉬 1차 통과용) */
export const LARGE_MESH_TRIANGLE_THRESHOLD = 120_000;
export const ANALYSIS_SAMPLE_TARGET = 48_000;

const OVERHANG_THRESHOLD = -0.7071;

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

    return {
        volume: (bboxVolumeMm3 * approxFill) / 1000,
        surfaceArea: (2 * (size.x * size.y + size.y * size.z + size.x * size.z)) / 100,
        overhangArea: 0,
        boundingBox: {
            x: size.x,
            y: size.y,
            z: size.z,
        },
    };
}

type AnalyzeOptions = {
    /** 1 = 전체, N = N번째 삼각형만 샘플 */
    sampleStride?: number;
    includeOverhang?: boolean;
};

function signedVolumeOfTriangle(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
    return p1.dot(p2.cross(p3)) / 6.0;
}

function triangleArea(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
    const v1 = new THREE.Vector3().subVectors(p2, p1);
    const v2 = new THREE.Vector3().subVectors(p3, p1);
    return v1.cross(v2).length() * 0.5;
}

function analyzeGeometryInternal(geometry: THREE.BufferGeometry, options: AnalyzeOptions = {}): GeometryAnalysis {
    if (!geometry.attributes.position) {
        throw new Error('Invalid geometry');
    }

    const sampleStride = Math.max(1, options.sampleStride ?? 1);
    const includeOverhang = options.includeOverhang ?? sampleStride === 1;

    const pos = geometry.attributes.position;
    const index = geometry.index;

    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();
    const n1 = new THREE.Vector3();
    const n2 = new THREE.Vector3();
    const n3 = new THREE.Vector3();
    const faceNormal = new THREE.Vector3();

    let volume = 0;
    let surfaceArea = 0;
    let overhangArea = 0;

    const processTriangle = (i0: number, i1: number, i2: number) => {
        p1.fromBufferAttribute(pos, i0);
        p2.fromBufferAttribute(pos, i1);
        p3.fromBufferAttribute(pos, i2);
        volume += signedVolumeOfTriangle(p1, p2, p3);

        const area = triangleArea(p1, p2, p3);
        surfaceArea += area;

        if (includeOverhang && geometry.attributes.normal) {
            n1.fromBufferAttribute(geometry.attributes.normal, i0);
            n2.fromBufferAttribute(geometry.attributes.normal, i1);
            n3.fromBufferAttribute(geometry.attributes.normal, i2);
            faceNormal.copy(n1).add(n2).add(n3).normalize();
            if (faceNormal.z < OVERHANG_THRESHOLD) {
                overhangArea += area;
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

    return {
        volume: (Math.abs(volume) * scale) / 1000,
        surfaceArea: (surfaceArea * scale) / 100,
        overhangArea: includeOverhang ? overhangArea * scale / 100 : undefined,
        boundingBox: {
            x: size.x,
            y: size.y,
            z: size.z,
        },
    };
}

export const analyzeGeometry = (geometry: THREE.BufferGeometry): GeometryAnalysis => {
    const triCount = getTriangleCount(geometry);
    if (triCount > LARGE_MESH_TRIANGLE_THRESHOLD) {
        const stride = Math.max(1, Math.ceil(triCount / ANALYSIS_SAMPLE_TARGET));
        if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
        }
        return analyzeGeometryInternal(geometry, {
            sampleStride: stride,
            includeOverhang: false,
        });
    }

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
 * 대용량 메쉬: 1) 바운딩 박스 근사로 즉시 콜백 → 2) 샘플링 정밀 분석으로 갱신
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

    if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
    }

    const stride = Math.max(1, Math.ceil(triCount / ANALYSIS_SAMPLE_TARGET));
    const refined = analyzeGeometryInternal(geometry, {
        sampleStride: stride,
        includeOverhang: false,
    });

    return refined;
}
