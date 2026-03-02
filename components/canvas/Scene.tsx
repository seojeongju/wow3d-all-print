'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Stage, Grid, Html, Bounds, useBounds } from '@react-three/drei'
import { Suspense, useEffect, useState, useRef, createContext, useContext } from 'react'
import { useFileStore } from '@/store/useFileStore'
import * as THREE from 'three'
import { STLLoader, OBJLoader, ThreeMFLoader, PLYLoader, mergeBufferGeometries } from 'three-stdlib'
import { analyzeGeometry } from '@/lib/geometry'
import { loadStepAsBufferGeometry } from '@/lib/stepLoader'
import { Button } from '@/components/ui/button'
import { Download, Ruler, Loader2, Palette, Home, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MousePointer2, Touchpad, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// 뷰 프리셋(전/후/좌/우/홈)용 컨텍스트
const ViewPresetContext = createContext<{ viewPreset: string | null; setViewPreset: (v: string | null) => void }>({ viewPreset: null, setViewPreset: () => { } })

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

type ModelType = 'stl' | 'obj' | '3mf' | 'ply' | 'step'

function collectGeometriesFromGroup(group: THREE.Group): THREE.BufferGeometry[] {
    const out: THREE.BufferGeometry[] = []
    group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const g = (child as THREE.Mesh).geometry
            if (g && g.attributes?.position) out.push(g)
        }
    })
    return out
}

// 3D 모델 컴포넌트
function Model({
    url,
    type,
    color,
    showMeasurements
}: {
    url: string;
    type: ModelType;
    color: string;
    showMeasurements: boolean;
}) {
    const { setAnalysis } = useFileStore()
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null)
    const bounds = useBounds()

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

                    const geometries: THREE.BufferGeometry[] = []
                    object.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                            const g = (child as THREE.Mesh).geometry
                            if (g) geometries.push(g)
                        }
                    })

                    if (geometries.length > 0) {
                        // 모든 메쉬를 하나로 병합하여 전체 분석 수행
                        geo = geometries.length === 1 ? geometries[0] : (mergeBufferGeometries(geometries) ?? geometries[0])
                    }
                } else if (type === '3mf') {
                    const loader = new ThreeMFLoader()
                    const group = loader.parse(arrayBuffer)
                    const arr = collectGeometriesFromGroup(group)
                    if (arr.length === 1) geo = arr[0]
                    else if (arr.length > 1) geo = mergeBufferGeometries(arr) ?? arr[0]
                } else if (type === 'ply') {
                    const loader = new PLYLoader()
                    geo = loader.parse(arrayBuffer)
                } else if (type === 'step') {
                    geo = await loadStepAsBufferGeometry(arrayBuffer)
                }

                if (geo) {
                    geo.center()
                    geo.computeVertexNormals()

                    geo.computeBoundingBox()
                    const bbox = geo.boundingBox
                    if (bbox) setBoundingBox(bbox)

                    setGeometry(geo)

                    try {
                        const analysis = analyzeGeometry(geo)
                        setAnalysis(analysis)
                        console.log('✅ Geometry loaded and analyzed:', analysis)
                    } catch (e) {
                        console.error('❌ Analysis failed:', e)
                    }

                    setTimeout(() => {
                        bounds.refresh().clip().fit()
                    }, 100)
                }

                setIsLoading(false)
            } catch (e) {
                console.error('❌ Model loading failed:', e)
                setError(e instanceof Error ? e.message : 'Failed to load model')
                setIsLoading(false)
            }
        }

        loadModel()
    }, [url, type, setAnalysis, bounds])

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

    // Bounding Box 사이즈 계산 (Wireframe용)
    const boxSize: [number, number, number] = boundingBox ? [
        boundingBox.max.x - boundingBox.min.x,
        boundingBox.max.y - boundingBox.min.y,
        boundingBox.max.z - boundingBox.min.z
    ] : [1, 1, 1];

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
            {showMeasurements && boundingBox && (
                <>
                    <mesh>
                        <boxGeometry args={boxSize} />
                        <meshBasicMaterial color="#00ff00" wireframe />
                    </mesh>
                    <MeasurementTool boundingBox={boundingBox} />
                </>
            )}
        </group>
    )
}

// 뷰 프리셋 적용: 전/후/좌/우/홈 (Bounds 내부에서 useBounds 사용)
function ViewPresetHandler() {
    const { camera } = useThree()
    const controls = useThree(s => s.controls) as { update: () => void; target: THREE.Vector3 } | null
    const bounds = useBounds()
    const { viewPreset, setViewPreset } = useContext(ViewPresetContext)

    useEffect(() => {
        if (!viewPreset || !controls) return

        if (viewPreset === 'home') {
            bounds.refresh().clip().fit()
            setViewPreset(null)
            return
        }

        const target = controls.target
        const r = Math.max(0.1, camera.position.distanceTo(target))

        // 전(+Z) 후(-Z) 좌(-X) 우(+X)
        const presets: Record<string, [number, number, number]> = {
            front: [0, 0, r],   // 전
            back: [0, 0, -r],   // 후
            left: [-r, 0, 0],   // 좌
            right: [r, 0, 0],   // 우
        }
        const pos = presets[viewPreset]
        if (pos) {
            camera.position.set(target.x + pos[0], target.y + pos[1], target.z + pos[2])
            controls.update()
        }
        setViewPreset(null)
    }, [viewPreset, controls, camera, bounds, setViewPreset])

    return null
}

const SUPPORTED_EXT = ['stl', 'obj', '3mf', 'ply', 'step', 'stp'] as const

// 뷰어 컨텐츠 컴포넌트
function ViewerContent({ color, showMeasurements }: { color: string, showMeasurements: boolean }) {
    const { file, fileUrl } = useFileStore()

    const fileExtension = file?.name.split('.').pop()?.toLowerCase()
    const isSupported = fileExtension && SUPPORTED_EXT.includes(fileExtension as any)
    const modelType: ModelType = (fileExtension === 'stp' ? 'step' : fileExtension) as ModelType

    if (fileUrl && isSupported) {
        return (
            <Model
                url={fileUrl}
                type={modelType}
                color={color}
                showMeasurements={showMeasurements}
            />
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
type SceneProps = { compact?: boolean }
export default function Scene({ compact = false }: SceneProps) {
    const canvasRef = useRef<HTMLDivElement>(null)
    const { fileUrl } = useFileStore()
    const [mounted, setMounted] = useState(false)
    const [modelColor, setModelColor] = useState('#6366f1')
    const [showMeasurements, setShowMeasurements] = useState(false)
    const [viewPreset, setViewPreset] = useState<string | null>(null)
    const [showGuide, setShowGuide] = useState(true)
    const [colorPanelOpen, setColorPanelOpen] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setShowGuide(false), 5000)
        return () => clearTimeout(timer)
    }, [])

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
            <ViewPresetContext.Provider value={{ viewPreset, setViewPreset }}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/20 pointer-events-none z-10" />

                {/* 3D Canvas */}
                <div ref={canvasRef} className="w-full h-full" style={{ touchAction: 'none' }}>
                    <Canvas shadows dpr={[1, 2]} camera={{ position: [50, 50, 50], fov: 45 }} eventSource={canvasRef.current || undefined}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <Stage environment="city" intensity={0.6}>
                                <Bounds fit clip observe margin={1.5}>
                                    <ViewerContent key={fileUrl || 'empty'} color={modelColor} showMeasurements={showMeasurements} />
                                    <ViewPresetHandler />
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
                                fadeDistance={100}
                            />
                        </Suspense>
                        <OrbitControls
                            makeDefault
                            enableDamping
                            dampingFactor={0.05}
                            minDistance={0.1}
                            maxDistance={1000}
                            maxPolarAngle={Math.PI / 1.5}
                        />
                    </Canvas>
                </div>

                {/* 모바일 터치 가이드 */}
                <AnimatePresence>
                    {showGuide && !compact && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-white/20 flex flex-col items-center gap-4 text-white text-center shadow-2xl">
                                <div className="flex gap-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 outline-dashed outline-1 outline-primary/50 animate-[spin_4s_linear_infinite]">
                                            <MousePointer2 className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-xs font-bold">1 손가락<br />회전</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                            <Touchpad className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <span className="text-xs font-bold">2 손가락<br />확대/이동</span>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" className="mt-2 pointer-events-auto rounded-full px-4 h-8 bg-white/10 text-[10px]" onClick={() => setShowGuide(false)}>알겠습니다</Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 컨트롤 패널 (compact 모드에서는 숨김) */}
                {!compact && (
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                        <Button size="sm" variant="secondary" className="h-10 sm:h-9 gap-2 shadow-lg backdrop-blur-sm bg-background/90 rounded-xl" onClick={takeScreenshot}>
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">스크린샷</span>
                        </Button>
                        <Button size="sm" variant={showMeasurements ? "default" : "secondary"} className="h-10 sm:h-9 gap-2 shadow-lg backdrop-blur-sm rounded-xl" onClick={() => setShowMeasurements(!showMeasurements)}>
                            <Ruler className="w-4 h-4" />
                            <span className="hidden sm:inline">치수측정</span>
                        </Button>
                        <Button size="icon" variant="secondary" className="sm:hidden h-10 w-10 shadow-lg backdrop-blur-sm rounded-xl" onClick={() => setShowGuide(true)}>
                            <HelpCircle className="w-5 h-5" />
                        </Button>
                    </div>
                )}

                {/* 색상 선택 패널 (모바일 대응 피봇) */}
                <div className={`
                    absolute bottom-4 right-4 z-20 transition-all duration-300
                    ${colorPanelOpen ? 'w-[200px]' : 'w-12 h-12 rounded-xl'}
                    bg-background/95 backdrop-blur-sm border border-border shadow-lg overflow-hidden
                    ${!colorPanelOpen && 'flex items-center justify-center cursor-pointer hover:bg-background'}
                `} onClick={() => !colorPanelOpen && setColorPanelOpen(true)}>
                    {colorPanelOpen ? (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold">모델 색상</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setColorPanelOpen(false); }} className="hover:text-primary p-1">
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {colorPresets.map((preset) => (
                                    <button
                                        key={preset.color}
                                        onClick={(e) => { e.stopPropagation(); setModelColor(preset.color); }}
                                        className={`
                                            w-8 h-8 rounded-lg border-2 transition-all hover:scale-110
                                            ${modelColor === preset.color ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                                        `}
                                        style={{ backgroundColor: preset.color }}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Palette className="w-5 h-5 text-primary" />
                    )}
                </div>

                {/* 상태 표시 (compact에서는 숨김, 하단 스트립과 겹침 방지) */}
                {!compact && (
                    <div className="absolute bottom-4 left-4 z-20">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-slate-400 font-medium">3D Viewer Active</span>
                        </div>
                    </div>
                )}

                {/* 뷰 프리셋: 홈, 전, 후, 좌, 우 */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
                    <Button size="icon" variant="secondary" className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/90" onClick={() => setViewPreset('home')} title="홈">
                        <Home className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/90" onClick={() => setViewPreset('front')} title="전(앞)">
                        <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/90" onClick={() => setViewPreset('back')} title="후(뒤)">
                        <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/90" onClick={() => setViewPreset('left')} title="좌">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/90" onClick={() => setViewPreset('right')} title="우">
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </ViewPresetContext.Provider>
        </div>
    )
}
