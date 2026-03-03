'use client';

import { useEffect } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
// @ts-ignore
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { useMakerStore } from '@/store/useMakerStore';

/** 캔버스 좌표 → 3D 씬 좌표 (Preview3D와 동일) */
const SCENE_SCALE = 0.02;
/** STL 파일에서 1 unit = 1mm 되도록 (800px 캔버스 ≈ 80mm) */
const EXPORT_SCALE = 5;

export function Exporter() {
    const {
        exportTrigger,
        paths,
        importedSvgs,
        extrusionHeight,
        basePlateType,
        baseHeight,
        canvasSize
    } = useMakerStore();

    useEffect(() => {
        if (exportTrigger === 0) return;

        const hasPaths = paths.length > 0 && paths.some((p) => p.points.length >= 2);
        const hasSvgs = importedSvgs.length > 0;
        const hasBase = basePlateType === 'rect';

        if (!hasPaths && !hasSvgs && !hasBase) {
            alert('저장할 모델이 없습니다. 스케치를 그리거나 이미지를 넣어 주세요.');
            return;
        }

        try {
            const exportGroup = new THREE.Group();

            // 1) 스케치 경로 → 튜브 메시 (Preview3D와 동일 로직)
            paths.forEach((path) => {
                if (path.points.length < 2) return;
                const points = path.points.map(
                    (p) => new THREE.Vector3(p.x * SCENE_SCALE, -p.y * SCENE_SCALE, 0)
                );
                const curve = new THREE.CatmullRomCurve3(points);
                const radius = Math.max(0.03, path.width * SCENE_SCALE * 0.2);
                const tubeGeom = new THREE.TubeGeometry(curve, 64, radius, 8, false);
                const mesh = new THREE.Mesh(tubeGeom, new THREE.MeshBasicMaterial());
                exportGroup.add(mesh);
            });

            // 2) 바닥 판 (사각형)
            if (hasBase) {
                const w = canvasSize.width * SCENE_SCALE;
                const h = canvasSize.height * SCENE_SCALE;
                const boxGeom = new THREE.BoxGeometry(w + 2, h + 2, baseHeight);
                const boxMesh = new THREE.Mesh(boxGeom, new THREE.MeshBasicMaterial());
                boxMesh.position.set(w / 2, -h / 2, -baseHeight / 2);
                exportGroup.add(boxMesh);
            }

            // 3) 임포트된 SVG → 압출 메시 (있으면 동일 스케일로)
            if (importedSvgs.length > 0) {
                const loader = new SVGLoader();
                importedSvgs.forEach((svg) => {
                    try {
                        const data = loader.parse(svg.svgContent);
                        const scale = SCENE_SCALE;
                        data.paths.forEach((path: any) => {
                            const shapes = SVGLoader.createShapes(path);
                            shapes.forEach((shape: THREE.Shape) => {
                                const geom = new THREE.ExtrudeGeometry(shape, {
                                    depth: extrusionHeight / scale,
                                    bevelEnabled: false
                                });
                                const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());
                                mesh.scale.set(scale, -scale, 1);
                                mesh.position.z = baseHeight;
                                exportGroup.add(mesh);
                            });
                        });
                    } catch (_) {
                        // SVG 파싱 실패 시 스킵
                    }
                });
            }

            if (exportGroup.children.length === 0) {
                alert('저장할 메시가 없습니다. 스케치를 그리거나 바닥 판형을 선택해 주세요.');
                return;
            }

            // STL은 mm 단위로 (슬라이서에서 그대로 사용)
            exportGroup.scale.setScalar(EXPORT_SCALE);
            exportGroup.updateMatrixWorld(true);

            const exporter = new STLExporter();
            const result = exporter.parse(exportGroup, { binary: true });

            const blob = new Blob([result], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `wow3d-model-${Date.now()}.stl`;
            link.click();
            URL.revokeObjectURL(link.href);

            // 자식 geometry dispose (메모리)
            exportGroup.traverse((obj) => {
                if (obj instanceof THREE.Mesh && obj.geometry) obj.geometry.dispose();
            });
        } catch (e) {
            console.error('STL export failed', e);
            alert('STL 저장에 실패했습니다. 콘솔을 확인해 주세요.');
        }
    }, [
        exportTrigger,
        paths,
        importedSvgs,
        extrusionHeight,
        basePlateType,
        baseHeight,
        canvasSize
    ]);

    return null;
}
