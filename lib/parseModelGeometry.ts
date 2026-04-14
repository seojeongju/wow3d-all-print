/**
 * 파일 버퍼 → BufferGeometry (WebGL 불필요, 견적 분석·뷰어 로드 공용)
 */
import * as THREE from 'three';
import { STLLoader, OBJLoader, ThreeMFLoader, PLYLoader, mergeBufferGeometries } from 'three-stdlib';
import { loadStepAsBufferGeometry } from '@/lib/stepLoader';

export type ParsedModelType = 'stl' | 'obj' | '3mf' | 'ply' | 'step';

function collectGeometriesFromGroup(group: THREE.Group): THREE.BufferGeometry[] {
    const out: THREE.BufferGeometry[] = [];
    group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const g = (child as THREE.Mesh).geometry;
            if (g && g.attributes?.position) out.push(g);
        }
    });
    return out;
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
            const group = loader.parse(arrayBuffer);
            const arr = collectGeometriesFromGroup(group);
            if (arr.length === 1) geo = arr[0];
            else if (arr.length > 1) geo = mergeBufferGeometries(arr) ?? arr[0];
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
