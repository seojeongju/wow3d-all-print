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

export const analyzeGeometry = (geometry: THREE.BufferGeometry): GeometryAnalysis => {
    // Ensure we have a clean geometry
    if (!geometry.attributes.position) {
        throw new Error("Invalid geometry");
    }

    // Calculate Volume
    // For indexed geometry, we use index. If not, we assume standard triangle soup.
    let volume = 0;

    // Calculate Volume using Signed Triangle Volume
    // Ref: https://stackoverflow.com/questions/1406029/how-to-calculate-the-volume-of-a-3d-mesh-object-the-surface-of-which-is-made-up
    const pos = geometry.attributes.position;
    const index = geometry.index;

    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();

    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            p1.fromBufferAttribute(pos, index.getX(i));
            p2.fromBufferAttribute(pos, index.getX(i + 1));
            p3.fromBufferAttribute(pos, index.getX(i + 2));
            volume += signedVolumeOfTriangle(p1, p2, p3);
        }
    } else {
        for (let i = 0; i < pos.count; i += 3) {
            p1.fromBufferAttribute(pos, i);
            p2.fromBufferAttribute(pos, i + 1);
            p3.fromBufferAttribute(pos, i + 2);
            volume += signedVolumeOfTriangle(p1, p2, p3);
        }
    }

    // Calculate Surface Area
    let surfaceArea = 0;
    // Use Three.js utility if possible, or manual calculation
    // Basic implementation:
    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            p1.fromBufferAttribute(pos, index.getX(i));
            p2.fromBufferAttribute(pos, index.getX(i + 1));
            p3.fromBufferAttribute(pos, index.getX(i + 2));
            surfaceArea += triangleArea(p1, p2, p3);
        }
    } else {
        for (let i = 0; i < pos.count; i += 3) {
            p1.fromBufferAttribute(pos, i);
            p2.fromBufferAttribute(pos, i + 1);
            p3.fromBufferAttribute(pos, i + 2);
            surfaceArea += triangleArea(p1, p2, p3);
        }
    }


    const box = geometry.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);

    // Calculate Overhang Area (Faces aiming downwards > 45 degrees)
    let overhangArea = 0;
    // cos(180 - 45) = cos(135) = -0.7071
    // Normal Z가 -0.7071보다 작으면 바닥을 향해 45도 이상 기울어진 것
    const OVERHANG_THRESHOLD = -0.7071;

    const normalAttribute = geometry.attributes.normal;
    // 법선 정보가 없으면 계산하여 생성
    if (!normalAttribute) {
        geometry.computeVertexNormals();
    }

    // 법선 벡터를 사용하여 오버행 면적 계산
    // (간략화를 위해 Face Normal을 사용하거나 Vertex Normal의 평균을 사용)
    const n1 = new THREE.Vector3();
    const n2 = new THREE.Vector3();
    const n3 = new THREE.Vector3();
    const faceNormal = new THREE.Vector3();

    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            // Get positions to calculate area
            p1.fromBufferAttribute(pos, index.getX(i));
            p2.fromBufferAttribute(pos, index.getX(i + 1));
            p3.fromBufferAttribute(pos, index.getX(i + 2));
            const area = triangleArea(p1, p2, p3);

            // Get normals to check overhang
            if (geometry.attributes.normal) {
                n1.fromBufferAttribute(geometry.attributes.normal, index.getX(i));
                n2.fromBufferAttribute(geometry.attributes.normal, index.getX(i + 1));
                n3.fromBufferAttribute(geometry.attributes.normal, index.getX(i + 2));
                // Face Normal 근사치 (세 버텍스 노말의 평균)
                faceNormal.copy(n1).add(n2).add(n3).normalize();

                if (faceNormal.z < OVERHANG_THRESHOLD) {
                    overhangArea += area;
                }
            } else {
                // 법선 속성이 없으면 직접 계산 (Clockwise/CCW 고려 필요, 일반적으로 CCW가 앞면)
                // p1, p2, p3 순서에 따라 외적으로 법선 구하기
                faceNormal.subVectors(p3, p1).cross(new THREE.Vector3().subVectors(p2, p1)).normalize();
                // 보통 three.js 지오메트리는 CCW winding. 
                // 만약 결과가 이상하면 순서를 바꿀 필요가 있음.
                // 여기서는 안전하게 이미 계산된 volume 부호와 일치하는지 확인하면 좋지만,
                // 간단히 기존 normal 속성을 우선 사용하고 없으면 무시하거나 전체를 간주하지 않음.
            }
        }
    } else {
        for (let i = 0; i < pos.count; i += 3) {
            p1.fromBufferAttribute(pos, i);
            p2.fromBufferAttribute(pos, i + 1);
            p3.fromBufferAttribute(pos, i + 2);
            const area = triangleArea(p1, p2, p3);

            if (geometry.attributes.normal) {
                n1.fromBufferAttribute(geometry.attributes.normal, i);
                n2.fromBufferAttribute(geometry.attributes.normal, i + 1);
                n3.fromBufferAttribute(geometry.attributes.normal, i + 2);
                faceNormal.copy(n1).add(n2).add(n3).normalize();

                if (faceNormal.z < OVERHANG_THRESHOLD) {
                    overhangArea += area;
                }
            }
        }
    }

    return {
        volume: Math.abs(volume) / 1000, // Convert mm³ to cm³
        surfaceArea: surfaceArea / 100, // Convert mm² to cm²
        overhangArea: overhangArea / 100, // Convert mm² to cm²
        boundingBox: {
            x: size.x,
            y: size.y,
            z: size.z,
        },
    };
};

function signedVolumeOfTriangle(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
    return p1.dot(p2.cross(p3)) / 6.0;
}

function triangleArea(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
    // Area = 0.5 * |(p2 - p1) x (p3 - p1)|
    const v1 = new THREE.Vector3().subVectors(p2, p1);
    const v2 = new THREE.Vector3().subVectors(p3, p1);
    return v1.cross(v2).length() * 0.5;
}
