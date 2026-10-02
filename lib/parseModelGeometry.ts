/**
 * 파일 버퍼 → BufferGeometry (WebGL 불필요, 견적 분석·뷰어 로드 공용)
 */
import * as THREE from 'three';
import { STLLoader, OBJLoader, ThreeMFLoader, PLYLoader, mergeBufferGeometries } from 'three-stdlib';
import { loadStepAsBufferGeometry } from '@/lib/stepLoader';
import { MODEL_PARTS_USERDATA_KEY, type ModelPartRange } from '@/lib/geometry';

export type ParsedModelType = 'stl' | 'obj' | '3mf' | 'ply' | 'step';

/**
 * 3MF 빌드 항목·컴포넌트 변환(위치·회전·배율)을 적용해 객체들을 하나로 병합.
 * 객체가 여럿이면 병합 지오메트리 userData에 객체별 범위를 남겨 분석이 객체 단위로 합산하게 한다.
 */
export function mergeThreeMFGroup(group: THREE.Group): THREE.BufferGeometry | null {
    group.updateMatrixWorld(true);
    const parts: THREE.BufferGeometry[] = [];
    group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        const src = mesh.isMesh ? mesh.geometry : null;
        if (!src?.attributes?.position) return;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', src.attributes.position.clone());
        if (src.index) g.setIndex(src.index.clone());
        g.applyMatrix4(mesh.matrixWorld);
        parts.push(g);
    });
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];

    const allIndexed = parts.every((p) => p.index);
    const normalized = allIndexed ? parts : parts.map((p) => (p.index ? p.toNonIndexed() : p));
    const merged = mergeBufferGeometries(normalized);
    if (!merged) return parts[0];

    let start = 0;
    const ranges: ModelPartRange[] = normalized.map((p) => {
        const count = allIndexed ? p.index!.count : p.attributes.position.count;
        const range = { start, count };
        start += count;
        return range;
    });
    merged.userData[MODEL_PARTS_USERDATA_KEY] = ranges;
    return merged;
}

export function modelTypeFromFileName(fileName: string): ParsedModelType | null {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'stl') return 'stl';
    if (ext === 'obj') return 'obj';
    if (ext === '3mf') return '3mf';
    if (ext === 'ply') return 'ply';
    if (ext === 'step' || ext === 'stp') return 'step';
    return null;
}

export async function parseModelArrayBuffer(
    fileName: string,
    arrayBuffer: ArrayBuffer
): Promise<THREE.BufferGeometry | null> {
    const type = modelTypeFromFileName(fileName);
    if (!type) return null;

    let geo: THREE.BufferGeometry | null = null;

    try {
        if (type === 'stl') {
            const loader = new STLLoader();
            geo = loader.parse(arrayBuffer);
        } else if (type === 'obj') {
            const loader = new OBJLoader();
            const text = new TextDecoder().decode(arrayBuffer);
            const object = loader.parse(text);
            const geometries: THREE.BufferGeometry[] = [];
            object.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const g = (child as THREE.Mesh).geometry;
                    if (g) geometries.push(g);
                }
            });
            if (geometries.length > 0) {
                geo =
                    geometries.length === 1
                        ? geometries[0]
                        : mergeBufferGeometries(geometries) ?? geometries[0];
            }
        } else if (type === '3mf') {
            const loader = new ThreeMFLoader();
            geo = mergeThreeMFGroup(loader.parse(arrayBuffer));
        } else if (type === 'ply') {
            const loader = new PLYLoader();
            geo = loader.parse(arrayBuffer);
        } else if (type === 'step') {
            geo = await loadStepAsBufferGeometry(arrayBuffer);
        }

        if (geo) {
            geo.center();
            geo.computeVertexNormals();
        }
    } catch {
        return null;
    }

    return geo;
}
