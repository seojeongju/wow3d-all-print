'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';

type ClusterItem = {
    position: [number, number, number];
    scale: number;
    color: string;
    kind: 'knot' | 'ico' | 'octa' | 'torus' | 'box';
    speed: number;
};

const CLUSTER: ClusterItem[] = [
    { position: [0, 0.05, 0], scale: 0.92, color: '#e2e8f0', kind: 'knot', speed: 0.18 },
    { position: [-1.55, 0.55, -0.35], scale: 0.38, color: '#5eead4', kind: 'ico', speed: 0.28 },
    { position: [1.45, -0.35, -0.2], scale: 0.42, color: '#94a3b8', kind: 'octa', speed: 0.22 },
    { position: [-1.15, -0.75, 0.25], scale: 0.32, color: '#2dd4bf', kind: 'torus', speed: 0.35 },
    { position: [1.2, 0.7, 0.15], scale: 0.28, color: '#cbd5e1', kind: 'box', speed: 0.25 },
    { position: [0.15, -1.05, -0.45], scale: 0.26, color: '#67e8f9', kind: 'ico', speed: 0.3 },
];

function ClusterMesh({ item }: { item: ClusterItem }) {
    const meshRef = useRef<Mesh>(null);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.x += delta * item.speed;
        meshRef.current.rotation.y += delta * item.speed * 0.85;
    });

    return (
        <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.45}>
            <mesh ref={meshRef} position={item.position} scale={item.scale} castShadow>
                {item.kind === 'knot' && <torusKnotGeometry args={[1, 0.32, 100, 16]} />}
                {item.kind === 'ico' && <icosahedronGeometry args={[1, 0]} />}
                {item.kind === 'octa' && <octahedronGeometry args={[1, 0]} />}
                {item.kind === 'torus' && <torusGeometry args={[0.7, 0.28, 16, 48]} />}
                {item.kind === 'box' && <boxGeometry args={[1.1, 1.1, 1.1]} />}
                <meshStandardMaterial
                    color={item.color}
                    roughness={0.4}
                    metalness={item.kind === 'knot' ? 0.12 : 0.35}
                />
            </mesh>
        </Float>
    );
}

/** 천천히 회전하며 모이는 듯한 모델 클러스터 */
function ModelCluster() {
    const groupRef = useRef<Group>(null);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        groupRef.current.rotation.y += delta * 0.12;
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]} scale={1.05}>
            {CLUSTER.map((item, i) => (
                <ClusterMesh key={i} item={item} />
            ))}
        </group>
    );
}

export default function LandingHeroScene() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0">
            <Canvas
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
            >
                <PerspectiveCamera makeDefault position={[0, 0.15, 5.2]} fov={38} />
                <Suspense fallback={null}>
                    <ambientLight intensity={0.95} />
                    <directionalLight position={[8, 10, 6]} intensity={2.2} />
                    <directionalLight position={[-6, -4, -8]} intensity={0.9} />
                    <pointLight position={[0, 1.5, 2]} intensity={0.55} color="#5eead4" />
                    <ModelCluster />
                </Suspense>
            </Canvas>
        </div>
    );
}
