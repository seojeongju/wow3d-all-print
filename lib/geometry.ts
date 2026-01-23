import * as THREE from 'three';

export interface GeometryAnalysis {
    volume: number; // cm³
    surfaceArea: number; // cm²
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


    // Calculate Bounding Box
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);

    return {
        volume: Math.abs(volume) / 1000, // Convert mm³ to cm³
        surfaceArea: surfaceArea / 100, // Convert mm² to cm²
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
