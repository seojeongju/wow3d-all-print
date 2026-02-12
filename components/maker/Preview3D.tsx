'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { useMakerStore } from '@/store/useMakerStore';

export function Preview3D() {
    const { paths, importedSvgs, extrusionHeight, basePlateType, baseHeight, canvasSize } = useMakerStore();

    return (
        <Canvas camera={{ position: [0, -10, 10], fov: 45 }}>
            {/* Lights */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} castShadow />

            {/* Controls */}
            <OrbitControls makeDefault />

            {/* Environment for nice reflections */}
            <Environment preset="city" />

            {/* Main Content */}
            <Center>
                <group>
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

            {/* Helper Grid */}
            <gridHelper args={[20, 20]} rotation={[Math.PI / 2, 0, 0]} />
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
                <boxGeometry args={[w + 1, h + 1, depth]} />
                <meshStandardMaterial color="#e5e7eb" roughness={0.5} />
            </mesh>
        );
    }
    return null;
}

function ExtrudedPath({ path, height, baseHeight }: {
    path: any, height: number, baseHeight: number
}) {
    const curve = useMemo(() => {
        if (path.points.length < 2) return null;
        const scale = 0.02;
        const points3D = path.points.map((p: any) =>
            new THREE.Vector3(p.x * scale, -p.y * scale, 0)
        );
        return new THREE.CatmullRomCurve3(points3D, false);
    }, [path.points]);

    if (!curve) return null;
    const tubeRadius = (path.width || 5) * 0.01;

    return (
        <mesh position={[0, 0, baseHeight]}>
            <tubeGeometry args={[curve, 64, tubeRadius, 8, false]} />
            <meshStandardMaterial color={path.color} roughness={0.3} metalness={0.1} />
        </mesh>
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
        data.paths.forEach((path) => {
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
