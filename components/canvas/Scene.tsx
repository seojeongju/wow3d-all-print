'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Grid, Center, Html, Bounds } from '@react-three/drei'
import { Suspense, useEffect, useState, useRef } from 'react'
import { useFileStore } from '@/store/useFileStore'
import * as THREE from 'three'
import { STLLoader } from 'three-stdlib'
import { OBJLoader } from 'three-stdlib'
import { analyzeGeometry } from '@/lib/geometry'
import { Button } from '@/components/ui/button'
import { Download, Ruler, Loader2, Palette } from 'lucide-react'

// 로딩 컴포넌트
function LoadingSpinner() {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-3 bg-background/90 backdrop-blur-sm px-6 py-4 rounded-lg border border-border shadow-lg">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="text-sm font-medium">모델 로딩 중...</div>
            </div>
        </Html>
    )
}

// 측정 도구 컴포넌트
function MeasurementTool({ boundingBox }: { boundingBox: THREE.Box3 | null }) {
    if (!boundingBox) return null

    const size = new THREE.Vector3()
    boundingBox.getSize(size)

    return (
        <Html position={[0, 0, 0]}>
            <div className="bg-background/95 backdrop-blur-sm px-4 py-3 rounded-lg border border-border shadow-lg text-xs space-y-1 min-w-[180px]">
                <div className="font-semibold text-primary mb-2">📏 치수 측정</div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">X (가로):</span>
                    <span className="font-mono font-medium">{size.x.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Y (세로):</span>
                    <span className="font-mono font-medium">{size.y.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Z (높이):</span>
                    <span className="font-mono font-medium">{size.z.toFixed(2)} mm</span>
                </div>
            </div>
        </Html>
    )
}

// 3D 모델 컴포넌트
function Model({
    url,
    type,
    color
}: {
    url: string;
    type: 'stl' | 'obj';
    color: string;
}) {
    const { setAnalysis } = useFileStore()
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null)

    useEffect(() => {
        if (!url) return

        const loadModel = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(url)
                const arrayBuffer = await response.arrayBuffer()

                let geo: THREE.BufferGeometry | null = null

                if (type === 'stl') {
                    const loader = new STLLoader()
                    geo = loader.parse(arrayBuffer)
                } else if (type === 'obj') {
                    const loader = new OBJLoader()
                    const text = new TextDecoder().decode(arrayBuffer)
                    const object = loader.parse(text)

                    object.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                            geo = (child as THREE.Mesh).geometry
                        }
                    })
                }

                if (geo) {
                    geo.center()
                    geo.computeVertexNormals()

                    // Compute bounding box
                    geo.computeBoundingBox()
                    const bbox = geo.boundingBox
                    if (bbox) {
                        setBoundingBox(bbox)
                    }

                    setGeometry(geo)

                    // Run analysis
                    try {
                        const analysis = analyzeGeometry(geo)
                        setAnalysis(analysis)
                        console.log('✅ Geometry loaded and analyzed:', analysis)
                    } catch (e) {
                        console.error('❌ Analysis failed:', e)
                    }
                }

                setIsLoading(false)
            } catch (e) {
                console.error('❌ Model loading failed:', e)
                setError(e instanceof Error ? e.message : 'Failed to load model')
                setIsLoading(false)
            }
        }

        loadModel()
    }, [url, type, setAnalysis])

    if (isLoading) {
        return <LoadingSpinner />
    }

    if (error) {
        return (
            <Html center>
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg border border-destructive/20">
                    ❌ {error}
                </div>
            </Html>
        )
    }

    if (!geometry) {
        return null
    }

    return (
        <group>
            <mesh geometry={geometry}>
                <meshStandardMaterial
                    color={color}
                    roughness={0.3}
                    metalness={0.7}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <MeasurementTool boundingBox={boundingBox} />
        </group>
    )
}

// 뷰어 컨텐츠 컴포넌트
function ViewerContent({ color }: { color: string }) {
    const { file, fileUrl } = useFileStore()

    const fileExtension = file?.name.split('.').pop()?.toLowerCase()
    const isSupported = fileExtension === 'stl' || fileExtension === 'obj'

    console.log('📁 File info:', {
        fileName: file?.name,
        fileUrl,
        fileExtension,
        isSupported
    })

    if (fileUrl && isSupported) {
        return (
            <Model url={fileUrl} type={fileExtension as 'stl' | 'obj'} color={color} />
        )
    }

    // Default placeholder cube
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
        </mesh>
    )
}

// 메인 Scene 컴포넌트
export default function Scene() {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [modelColor, setModelColor] = useState('#6366f1')
    const [showMeasurements, setShowMeasurements] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // 스크린샷 함수
    const takeScreenshot = () => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current.querySelector('canvas')
        if (!canvas) return

        canvas.toBlob((blob) => {
            if (!blob) return

            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `wow3d-model-${Date.now()}.png`
            link.click()
            URL.revokeObjectURL(url)
        })
    }

    // 색상 프리셋
    const colorPresets = [
        { name: 'Indigo', color: '#6366f1' },
        { name: 'Red', color: '#ef4444' },
        { name: 'Green', color: '#10b981' },
        { name: 'Blue', color: '#3b82f6' },
        { name: 'Purple', color: '#a855f7' },
        { name: 'Orange', color: '#f97316' },
        { name: 'Gray', color: '#6b7280' },
        { name: 'Gold', color: '#f59e0b' },
    ]

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

            {/* 3D Canvas */}
            <div ref={canvasRef} className="w-full h-full">
                <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 50 }}>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Stage environment="city" intensity={0.6}>
                            <Bounds fit clip observe margin={1.2}>
                                <ViewerContent color={modelColor} showMeasurements={showMeasurements} />
                            </Bounds>
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
                        minDistance={1}
                        maxDistance={50}
                    />
                </Canvas>
            </div>

            {/* 컨트롤 패널 */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                {/* 스크린샷 버튼 */}
                <Button
                    size="sm"
                    variant="secondary"
                    className="gap-2 shadow-lg backdrop-blur-sm bg-background/90"
                    onClick={takeScreenshot}
                >
                    <Download className="w-4 h-4" />
                    스크린샷
                </Button>

                {/* 측정 토글 */}
                <Button
                    size="sm"
                    variant={showMeasurements ? "default" : "secondary"}
                    className="gap-2 shadow-lg backdrop-blur-sm"
                    onClick={() => setShowMeasurements(!showMeasurements)}
                >
                    <Ruler className="w-4 h-4" />
                    측정
                </Button>
            </div>

            {/* 색상 선택 패널 */}
            <div className="absolute bottom-4 right-4 z-20 bg-background/95 backdrop-blur-sm p-4 rounded-lg border border-border shadow-lg max-w-xs">
                <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">모델 색상</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {colorPresets.map((preset) => (
                        <button
                            key={preset.color}
                            onClick={() => setModelColor(preset.color)}
                            className={`
                                w-10 h-10 rounded-lg border-2 transition-all hover:scale-110
                                ${modelColor === preset.color ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                            `}
                            style={{ backgroundColor: preset.color }}
                            title={preset.name}
                        />
                    ))}
                </div>
            </div>

            {/* 상태 표시 */}
            <div className="absolute bottom-4 left-4 z-20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-400 font-medium">3D Viewer Active</span>
                </div>
            </div>
        </div>
    )
}
