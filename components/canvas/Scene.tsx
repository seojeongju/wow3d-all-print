'use client'

import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, Stage, Grid, Center, Stats } from '@react-three/drei'
import { Suspense, useEffect, useState } from 'react'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { useFileStore } from '@/store/useFileStore'
import * as THREE from 'three'

import { analyzeGeometry } from '@/lib/geometry'

function Model({ url, type }: { url: string, type: 'stl' | 'obj' }) {
    const { setAnalysis } = useFileStore()
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)

    useEffect(() => {
        if (!url) return;

        const loader = type === 'stl' ? new STLLoader() : new OBJLoader();

        loader.load(url, (data) => {
            let geo: THREE.BufferGeometry | null = null;
            if (type === 'stl') {
                geo = data as THREE.BufferGeometry
            } else {
                const group = data as THREE.Group;
                group.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        geo = (child as THREE.Mesh).geometry
                        return;
                    }
                })
            }

            if (geo) {
                // Center geometry
                geo.center();
                // Compute normals if missing
                geo.computeVertexNormals();

                setGeometry(geo);

                // Run analysis
                try {
                    const analysis = analyzeGeometry(geo);
                    setAnalysis(analysis);
                } catch (e) {
                    console.error("Analysis failed", e);
                }
            }
        });

    }, [url, type, setAnalysis]);

    if (!geometry) return null;

    return (
        <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#6366f1" roughness={0.2} metalness={0.5} />
        </mesh>
    )
}

function ViewerContent() {
    const { file, fileUrl } = useFileStore()

    // Determine file type
    const fileExtension = file?.name.split('.').pop()?.toLowerCase()
    const isSupported = fileExtension === 'stl' || fileExtension === 'obj'

    if (fileUrl && isSupported) {
        return (
            <Center top>
                <Model url={fileUrl} type={fileExtension as 'stl' | 'obj'} />
            </Center>
        )
    }

    return (
        <group>
            <mesh rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#6366f1" roughness={0.2} metalness={0.5} />
            </mesh>
        </group>
    )
}

export default function Scene() {
    return (
        <div className="w-full h-full min-h-[500px] bg-slate-950/20 rounded-xl overflow-hidden border border-slate-800 relative z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/20 pointer-events-none z-10" />

            <Canvas shadows dpr={[1, 2]} camera={{ position: [4, 4, 4], fov: 50 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.5} adjustCamera>
                        <ViewerContent />
                    </Stage>
                    <Grid
                        renderOrder={-1}
                        position={[0, -1, 0]}
                        infiniteGrid
                        cellSize={0.6}
                        sectionSize={3}
                        sectionColor="#4d4d66"
                        cellColor="#1a1a33"
                        fadeDistance={30}
                    />
                </Suspense>
                <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                {/* <Stats /> */}
            </Canvas>

            <div className="absolute bottom-4 left-4 z-20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-400 font-medium">Ready to Render</span>
                </div>
            </div>
        </div>
    )
}
