'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Grid, Center, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useState, useRef } from 'react'
import { useFileStore } from '@/store/useFileStore'
import * as THREE from 'three'
import { STLLoader } from 'three-stdlib'
import { analyzeGeometry } from '@/lib/geometry'

function Model({ url, type }: { url: string; type: 'stl' | 'obj' }) {
    const { setAnalysis } = useFileStore()
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!url) return

        const loadModel = async () => {
            try {
                if (type === 'stl') {
                    const response = await fetch(url)
                    const arrayBuffer = await response.arrayBuffer()

                    const loader = new STLLoader()
                    const geo = loader.parse(arrayBuffer)

                    if (geo) {
                        geo.center()
                        geo.computeVertexNormals()
                        setGeometry(geo)

                        // Run analysis
                        try {
                            const analysis = analyzeGeometry(geo)
                            setAnalysis(analysis)
                            console.log('✅ Geometry loaded and analyzed:', analysis)
                        } catch (e) {
                            console.error('❌ Analysis failed:', e)
                            setError('Analysis failed')
                        }
                    }
                }
            } catch (e) {
                console.error('❌ Model loading failed:', e)
                setError(e instanceof Error ? e.message : 'Failed to load model')
            }
        }

        loadModel()
    }, [url, type, setAnalysis])

    if (error) {
        console.error('Error:', error)
        return null
    }

    if (!geometry) {
        return null
    }

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial
                color="#6366f1"
                roughness={0.3}
                metalness={0.7}
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}

function ViewerContent() {
    const { file, fileUrl } = useFileStore()

    // Determine file type
    const fileExtension = file?.name.split('.').pop()?.toLowerCase()
    const isSupported = fileExtension === 'stl'

    console.log('📁 File info:', {
        fileName: file?.name,
        fileUrl,
        fileExtension,
        isSupported
    })

    if (fileUrl && isSupported) {
        return (
            <Center>
                <Model url={fileUrl} type={fileExtension as 'stl'} />
            </Center>
        )
    }

    // Default placeholder cube
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#6366f1" roughness={0.3} metalness={0.7} />
        </mesh>
    )
}

export default function Scene() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-full h-full min-h-[500px] bg-slate-950/20 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <div className="text-slate-400">Loading 3D Viewer...</div>
            </div>
        )
    }

    return (
        <div className="w-full h-full min-h-[500px] bg-slate-950/20 rounded-xl overflow-hidden border border-slate-800 relative z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/20 pointer-events-none z-10" />

            <Canvas shadows dpr={[1, 2]} camera={{ position: [5, 5, 5], fov: 50 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6} adjustCamera={1.5}>
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
                <OrbitControls
                    makeDefault
                    enableDamping
                    dampingFactor={0.05}
                />
            </Canvas>

            <div className="absolute bottom-4 left-4 z-20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-400 font-medium">3D Viewer Active</span>
                </div>
            </div>
        </div>
    )
}
