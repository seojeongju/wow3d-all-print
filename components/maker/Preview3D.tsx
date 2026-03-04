'use client';

import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Center, ContactShadows, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { useMakerStore } from '@/store/useMakerStore';

/** WebGL context 손실 감지 → 상위 state 갱신 후 render 단계에서 throw 해서 에러 바운더리 포착 */
function ContextLossHandler({ onContextLost }: { onContextLost: () => void }) {
    const { gl } = useThree();
    const fired = useRef(false);
    React.useEffect(() => {
        const canvas = gl.domElement;
        const onLost = (e: Event) => {
            e.preventDefault();
            if (fired.current) return;
            fired.current = true;
            onContextLost();
        };
        canvas.addEventListener('webglcontextlost', onLost, false);
        return () => canvas.removeEventListener('webglcontextlost', onLost);
    }, [gl, onContextLost]);
    return null;
}

export function Preview3D() {
    const [mounted, setMounted] = React.useState(false);
    const [webglContextLost, setWebglContextLost] = React.useState(false);
    const { paths, importedSvgs, tripoModels, extrusionHeight, basePlateType, baseHeight, canvasSize, showGrid } = useMakerStore();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (webglContextLost) throw new Error('WebGL context lost');
    if (!mounted) return <div className="w-full h-full bg-black/20 animate-pulse" />;

    const hasPaths = paths.length > 0 && paths.some((p) => p.points.length >= 2);
    const hasSvgs = importedSvgs.length > 0;
    const hasTripo = tripoModels.length > 0;
    const hasBase = basePlateType !== 'none';
    const hasContent = hasPaths || hasSvgs || hasTripo || hasBase;

    if (!hasContent) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
                <p className="text-sm font-medium text-white/80 text-center">
                    표시할 3D 모델이 없습니다
                </p>
                <p className="text-xs text-white/50 text-center max-w-[260px]">
                    <strong className="text-white/70">스케치(2D)</strong> 탭에서 마우스로 그리거나, 왼쪽 도구에서 <strong className="text-white/70">이미지</strong>를 넣어 주세요.
                </p>
            </div>
        );
    }

    return (
        <Canvas
            shadows
            camera={{ position: [0, -15, 15], fov: 40 }}
            gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'low-power',
                stencil: false,
                depth: true,
                preserveDrawingBuffer: false,
            }}
            dpr={[1, 1.5]}
        >
            <ContextLossHandler onContextLost={() => setWebglContextLost(true)} />

            {/* 조명: 그림자 1개만 사용해 GPU 부하 감소 */}
            <ambientLight intensity={0.6} />
            <spotLight position={[20, 20, 20]} angle={0.2} penumbra={1} intensity={2} />
            <pointLight position={[-20, -20, 20]} intensity={1} />
            <directionalLight
                position={[10, 10, 30]}
                intensity={1.2}
                castShadow
                shadow-mapSize={1024}
                shadow-camera-far={50}
                shadow-bias={-0.0001}
            />

            {/* Controls with smooth behavior */}
            <OrbitControls
                makeDefault
                enableDamping={true}
                dampingFactor={0.1}
                minDistance={2}
                maxDistance={100}
                maxPolarAngle={Math.PI / 1.5}
                screenSpacePanning={true}
            />

            {/* HDR Environment 제거: 외부 URL 로드 실패 시 오류/Context Lost 방지. 조명만으로 렌더링 */}
            {/* Main Content */}
            <Center top>
                <group name="export-target">
                    {/* Base Plate */}
                    {basePlateType !== 'none' && (
                        <BasePlate
                            type={basePlateType}
                            width={canvasSize.width}
                            height={canvasSize.height}
                            depth={baseHeight}
                        />
                    )}

                    {/* User Drawings (Lines) */}
                    {paths.map((path) => (
                        <ExtrudedPath
                            key={path.id}
                            path={path}
                            height={extrusionHeight}
                            baseHeight={basePlateType !== 'none' ? baseHeight : 0}
                        />
                    ))}

                    {/* Imported SVGs (Extruded Shapes) */}
                    {importedSvgs.map((svg) => (
                        <ExtrudedSvg
                            key={svg.id}
                            svgContent={svg.svgContent}
                            height={extrusionHeight}
                            baseHeight={basePlateType !== 'none' ? baseHeight : 0}
                        />
                    ))}

                    {/* Tripo3D GLB models */}
                    {tripoModels.map((m, index) => (
                        <Suspense key={m.id} fallback={null}>
                            <GlbFromUrl
                                url={m.glbUrl}
                                position={[index * 3, 0, 0]}
                            />
                        </Suspense>
                    ))}
                </group>
            </Center>

            {/* Visual Polish: Shadows and Grid */}
            <ContactShadows
                position={[0, 0, -0.05]}
                opacity={0.4}
                scale={20}
                blur={2.5}
                far={1.5}
            />

            {showGrid && (
                <gridHelper
                    args={[50, 50, "#33334d", "#1a1a2e"]}
                    rotation={[Math.PI / 2, 0, 0]}
                    position={[0, 0, -0.1]}
                />
            )}
        </Canvas>
    );
}

// ------------------------------------------------------------------
// Internal Components
// ------------------------------------------------------------------

function BasePlate({ type, width, height, depth }: {
    type: string, width: number, height: number, depth: number
}) {
    const scale = 0.02;
    const w = width * scale;
    const h = height * scale;

    if (type === 'rect') {
        return (
            <mesh position={[w / 2, -h / 2, -depth / 2]}>
                <boxGeometry args={[w + 2, h + 2, depth]} />
                <meshStandardMaterial color="#1f1f2e" roughness={0.4} metalness={0.2} />
            </mesh>
        );
    }
    return null;
}

function ExtrudedPath({ path, height, baseHeight }: {
    path: any, height: number, baseHeight: number
}) {
    const scale = 0.02;

    const curve = useMemo(() => {
        if (path.points.length < 2) return null;

        const points = path.points.map((p: any) =>
            new THREE.Vector3(p.x * scale, -p.y * scale, 0)
        );

        // 점이 너무 적으면 보간이 안되므로 최소 2개 이상의 연속된 점 필요
        return new THREE.CatmullRomCurve3(points);
    }, [path.points]);

    if (!curve) return null;

    return (
        <group position={[0, 0, baseHeight]}>
            {/* 선을 입체 튜브 1개로 렌더 (세그먼트 감소로 rAF 부하 완화) */}
            <mesh castShadow receiveShadow>
                <tubeGeometry
                    args={[curve, 32, Math.max(0.03, path.width * scale * 0.2), 6, false]}
                />
                <meshStandardMaterial
                    color={path.color === '#000000' || path.color === '#0f172a' ? '#ffffff' : path.color}
                    roughness={0.1}
                    metalness={0.8}
                    emissive={path.color === '#000000' || path.color === '#0f172a' ? '#ffffff' : path.color}
                    emissiveIntensity={0.2}
                />
            </mesh>
        </group>
    );
}

/** 이미지 SVG에서 생성하는 shape 수 제한 (과다 메시로 인한 WebGL Context Lost 방지) */
const MAX_SHAPES_PER_SVG = 40;

/** SVG 파싱 결과: shapes + bbox로 스케일/중심 계산, shape 수 제한 */
function useParsedSvg(svgContent: string): { shapes: THREE.Shape[]; scale: number; centerX: number; centerY: number } | null {
    return useMemo(() => {
        try {
            const loader = new SVGLoader();
            const data = loader.parse(svgContent);
            const allShapes: THREE.Shape[] = [];
            (data.paths || []).forEach((path: any) => {
                try {
                    const created = SVGLoader.createShapes(path);
                    if (created && created.length) allShapes.push(...created);
                } catch (_) {
                    /* path 하나 실패 시 스킵 */
                }
            });
            if (allShapes.length === 0) return null;
            const shapes = allShapes.slice(0, MAX_SHAPES_PER_SVG);

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const getPoints = (s: THREE.Shape) => (typeof (s as any).getPoints === 'function' ? (s as any).getPoints(12) : (s as any).getSpacedPoints?.(12) ?? []);
            shapes.forEach((shape) => {
                const points = getPoints(shape);
                points.forEach((p: THREE.Vector2) => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
            });
            const w = Math.max(1, maxX - minX);
            const h = Math.max(1, maxY - minY);
            const targetSize = 12;
            const scale = Math.min(targetSize / w, targetSize / h, 0.05);
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            return { shapes, scale, centerX, centerY };
        } catch (_) {
            return null;
        }
    }, [svgContent]);
}

function ExtrudedSvg({ svgContent, height, baseHeight }: {
    svgContent: string, height: number, baseHeight: number
}) {
    const parsed = useParsedSvg(svgContent);
    if (!parsed || parsed.shapes.length === 0) return null;

    const { shapes, scale, centerX, centerY } = parsed;
    const depth = Math.max(0.5, height * 0.15);

    return (
        <group
            position={[0, 0, baseHeight]}
            scale={[scale, -scale, 1]}
        >
            <group position={[-centerX, -centerY, 0]}>
                {shapes.map((shape, i) => (
                    <mesh key={i} position={[0, 0, 0]}>
                        <extrudeGeometry
                            args={[shape, { depth, bevelEnabled: false }]}
                        />
                        <meshStandardMaterial color="#4f46e5" roughness={0.3} metalness={0.1} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

/** Tripo3D GLB from URL; scale to fit and position */
function GlbFromUrl({ url, position }: { url: string; position: [number, number, number] }) {
    const { scene } = useGLTF(url);
    const cloned = useMemo(() => {
        const s = scene.clone();
        s.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                if (mesh.material) {
                    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                    if ((mat as THREE.MeshStandardMaterial).emissive) (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
                }
            }
        });
        return s;
    }, [scene]);
    const box = useMemo(() => {
        const b = new THREE.Box3().setFromObject(cloned);
        const size = new THREE.Vector3();
        b.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 8 / maxDim;
        return Number.isFinite(scale) && scale > 0 ? scale : 1;
    }, [cloned]);
    return (
        <group position={position} scale={[box, box, box]}>
            <primitive object={cloned} />
        </group>
    );
}
