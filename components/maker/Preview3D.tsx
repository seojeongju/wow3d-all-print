'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { useMakerStore } from '@/store/useMakerStore';

import { Exporter } from './Exporter';

export function Preview3D() {
    const [mounted, setMounted] = React.useState(false);
    const { paths, importedSvgs, extrusionHeight, basePlateType, baseHeight, canvasSize, showGrid } = useMakerStore();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-full h-full bg-black/20 animate-pulse" />;

    const hasPaths = paths.length > 0 && paths.some((p) => p.points.length >= 2);
    const hasSvgs = importedSvgs.length > 0;
    const hasBase = basePlateType !== 'none';
    const hasContent = hasPaths || hasSvgs || hasBase;

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
            gl={{ antialias: true, alpha: true }}
        >
            <Exporter />

            {/* Premium Lighting Setup */}
            <ambientLight intensity={0.6} />
            <spotLight position={[20, 20, 20]} angle={0.2} penumbra={1} intensity={2} castShadow />
            <pointLight position={[-20, -20, 20]} intensity={1} />
            <directionalLight
                position={[10, 10, 30]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[2048, 2048]}
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
            {/* 선을 입체 튜브로 렌더링 (가시성: 반지름 = strokeWidth에 비례) */}
            <mesh castShadow receiveShadow>
                <tubeGeometry
                    args={[curve, 64, Math.max(0.03, path.width * scale * 0.2), 8, false]}
                />
                <meshStandardMaterial
                    color={path.color === '#000000' || path.color === '#0f172a' ? '#ffffff' : path.color}
                    roughness={0.1}
                    metalness={0.8}
                    emissive={path.color === '#000000' || path.color === '#0f172a' ? '#ffffff' : path.color}
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* 돌출 높이만큼 위로 올라간 보조 튜브 (돌출감) */}
            <mesh position={[0, 0, (height * 0.01) / 2]}>
                <tubeGeometry
                    args={[curve, 64, Math.max(0.025, path.width * scale * 0.18), 8, false]}
                />
                <meshStandardMaterial
                    color={path.color === '#000000' || path.color === '#0f172a' ? '#ffffff' : path.color}
                    transparent
                    opacity={0.35}
                />
            </mesh>
        </group>
    );
}

function ExtrudedSvg({ svgContent, height, baseHeight }: {
    svgContent: string, height: number, baseHeight: number
}) {
    const shapes = useMemo(() => {
        const loader = new SVGLoader();
        const data = loader.parse(svgContent);

        // Flatten all paths into shapes
        const allShapes: THREE.Shape[] = [];
        data.paths.forEach((path: any) => {
            const shapes = SVGLoader.createShapes(path);
            allShapes.push(...shapes);
        });
        return allShapes;
    }, [svgContent]);

    if (!shapes || shapes.length === 0) return null;

    // Scale down SVG to match our world (SVG pixels -> World Units)
    // Assuming 800px width ~ 16 units
    const scale = 0.02;

    return (
        <group position={[0, 0, baseHeight]} scale={[scale, -scale, 1]}> {/* Flip Y for SVG */}
            {shapes.map((shape, i) => (
                <mesh key={i} position={[0, 0, 0]}>
                    <extrudeGeometry
                        args={[shape, {
                            depth: height / scale, // Adjust depth for scale
                            bevelEnabled: false
                        }]}
                    />
                    <meshStandardMaterial color="#4f46e5" roughness={0.3} metalness={0.1} />
                </mesh>
            ))}
        </group>
    );
}
