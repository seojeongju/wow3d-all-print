'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Float, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

function RotatingModel() {
    return (
        <Float
            speed={1.5}
            rotationIntensity={0.5}
            floatIntensity={0.5}
        >
            <mesh castShadow receiveShadow>
                <torusKnotGeometry args={[1, 0.35, 128, 32]} />
                <meshStandardMaterial
                    color="#f8fafc"
                    roughness={0.55}
                    metalness={0.05}
                />
            </mesh>
        </Float>
    );
}

export default function LandingHeroScene() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 group cursor-grab active:cursor-grabbing">
            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
            >
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />
                <Suspense fallback={null}>
                    {/* Stage environment="city" 제거: GPU Context Lost 방지 및 메모리 최소화 */}
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[10, 10, 10]} intensity={2.5} castShadow shadow-mapSize={512} />
                    <directionalLight position={[-10, -5, -10]} intensity={1.0} />

                    <RotatingModel />

                    <OrbitControls
                        enableZoom={true}
                        enablePan={false}
                        autoRotate
                        autoRotateSpeed={1.2}
                        makeDefault
                        dampingFactor={0.05}
                        enableDamping={true}
                    />
                </Suspense>
            </Canvas>

            {/* Overlay hint for interactivity */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white/70 uppercase tracking-widest whitespace-nowrap">
                    Drag to Orbit • Scroll to Zoom
                </div>
            </div>
        </div>
    );
}
