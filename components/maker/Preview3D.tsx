'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Environment, ContactShadows } from '@react-three/drei';
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

            {/* Environment for realistic reflections */}
            <Environment preset="city" />

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
    const shape = useMemo(() => {
        if (path.points.length < 2) return null;

        const scale = 0.02;
        const newShape = new THREE.Shape();

        // 고도화 알고리즘: 스케치 포인트를 기반으로 단면Shape를 형성
        // 단순 선이 아닌 '면'의 개념으로 확장하여 돌출력과 가시성을 극대화합니다.
        const firstPoint = path.points[0];
        newShape.moveTo(firstPoint.x * scale, -firstPoint.y * scale);

        for (let i = 1; i < path.points.length; i++) {
            newShape.lineTo(path.points[i].x * scale, -path.points[i].y * scale);
        }

        return newShape;
    }, [path.points]);

    if (!shape) return null;

    return (
        <group position={[0, 0, baseHeight]}>
            {/* 알고리즘 개선: 풍부한 볼륨감을 위해 Extrude 알고리즘과 Bevel 시스템 적용 */}
            <mesh castShadow receiveShadow>
                <extrudeGeometry
                    args={[shape, {
                        depth: height * 0.1, // 실제 돌출 높이 조절
                        bevelEnabled: true,
                        bevelThickness: 0.1,
                        bevelSize: 0.1,
                        bevelSegments: 5,
                        curveSegments: 32
                    }]}
                />
                <meshStandardMaterial
                    color={path.color === '#000000' || path.color === '#0f172a' ? '#ffffff' : path.color}
                    roughness={0.1}
                    metalness={0.9}
                    emissive={path.color === '#000000' || path.color === '#0f172a' ? '#ffffff' : path.color}
                    emissiveIntensity={0.3}
                />
            </mesh>

            {/* 조형미 강조를 위한 보조 메쉬 알고리즘 */}
            <mesh position={[0, 0, 0.01]}>
                <extrudeGeometry
                    args={[shape, {
                        depth: 0.05,
                        bevelEnabled: false
                    }]}
                />
                <meshStandardMaterial
                    color={path.color === '#000000' || path.color === '#0f172a' ? '#ffffff' : path.color}
                    opacity={0.4}
                    transparent
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
