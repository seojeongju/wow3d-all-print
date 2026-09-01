'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { TrackballControls, Grid, Html, Bounds, useBounds } from '@react-three/drei'
import { Suspense, useEffect, useState, useRef, createContext, useContext, useLayoutEffect } from 'react'
import { useFileStore, useEffectiveAnalysis } from '@/store/useFileStore'
import * as THREE from 'three'
import { getParsedModelGeometry } from '@/lib/model-parse-cache'
import { ensureModelAnalysisForFile } from '@/lib/model-analysis-runner'
import { parseModelArrayBuffer } from '@/lib/parseModelGeometry'
import { useCpuModelAnalysis } from '@/hooks/useCpuModelAnalysis'
import { Button } from '@/components/ui/button'
import { Download, Ruler, Loader2, Palette, Home, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, HelpCircle, ChevronDown, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ModelTransformPanel from '@/components/canvas/ModelTransformPanel'
import { ViewerErrorBoundary } from '@/components/canvas/ViewerErrorBoundary'
import { degreesToRadians } from '@/lib/model-transform'

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

// 측정 도구: Model Adjust·견적과 동일한 유효 치수(스케일·90° 회전 반영)
function MeasurementTool() {
    const effective = useEffectiveAnalysis()
    if (!effective) return null

    const { x, y, z } = effective.boundingBox

    return (
        <Html position={[0, 0, 0]}>
            <div className="bg-slate-900/90 backdrop-blur-xl px-5 py-4 rounded-2xl border border-white/10 shadow-2xl text-xs space-y-2 min-w-[200px] text-white">
                <div className="font-black text-teal-400 mb-3 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                    <Ruler className="w-3.5 h-3.5" /> 모델 치수 측정
                </div>
                <p className="text-[9px] font-bold text-white/35 -mt-1 mb-1">스케일·회전 적용 후 (견적 기준)</p>
                <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                    <span className="text-white/40 font-bold uppercase tracking-tighter text-[9px]">X (Width)</span>
                    <span className="font-mono font-black text-white">{x.toFixed(2)}<span className="text-[10px] text-white/30 ml-0.5 font-sans">mm</span></span>
                </div>
                <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                    <span className="text-white/40 font-bold uppercase tracking-tighter text-[9px]">Y (Depth)</span>
                    <span className="font-mono font-black text-white">{y.toFixed(2)}<span className="text-[10px] text-white/30 ml-0.5 font-sans">mm</span></span>
                </div>
                <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                    <span className="text-white/40 font-bold uppercase tracking-tighter text-[9px]">Z (Height)</span>
                    <span className="font-mono font-black bg-teal-500/20 text-teal-400 px-1.5 rounded">{z.toFixed(2)}<span className="text-[10px] text-teal-400/50 ml-0.5 font-sans">mm</span></span>
                </div>
                <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                    <span className="text-white/40 font-bold uppercase tracking-tighter text-[9px]">Volume</span>
                    <span className="font-mono font-black text-white">{effective.volume.toFixed(2)}<span className="text-[10px] text-white/30 ml-0.5 font-sans">cm³</span></span>
                </div>
            </div>
        </Html>
    )
}

type ModelType = 'stl' | 'obj' | '3mf' | 'ply' | 'step'

// 3D 모델 컴포넌트
function Model({
    url,
    type: _modelType,
    color,
    showMeasurements
}: {
    url: string;
    type: ModelType;
    color: string;
    showMeasurements: boolean;
}) {
    const fileRecord = useFileStore((s) => s.file)
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null)
    const bounds = useBounds()
    const boundsRef = useRef(bounds)
    boundsRef.current = bounds
    const mountedRef = useRef(true)
    const groupRef = useRef<THREE.Group>(null)
    const geometryRef = useRef<THREE.BufferGeometry | null>(null)
    const transform = useFileStore((s) => s.transform)
    const scale = transform.scalePercent / 100

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
        }
    }, [])

    // 스케일·회전·바닥 붙이기 후 Bounds 다시 fit
    useLayoutEffect(() => {
        const group = groupRef.current
        if (!group || !geometry) return

        group.position.set(0, 0, 0)
        group.updateMatrixWorld(true)

        if (transform.snapToBed) {
            const box = new THREE.Box3().setFromObject(group)
            if (Number.isFinite(box.min.y)) {
                group.position.y = -box.min.y
                group.updateMatrixWorld(true)
            }
        }

        const t = setTimeout(() => {
            try {
                boundsRef.current.refresh().clip().fit()
            } catch {
                /* ignore */
            }
        }, 50)
        return () => clearTimeout(t)
    }, [geometry, scale, transform.rotX, transform.rotY, transform.rotZ, transform.snapToBed])

    useEffect(() => {
        if (!url) return

        let cancelled = false

        const loadModel = async () => {
            setIsLoading(true)
            setError(null)

            try {
                let geo: THREE.BufferGeometry | null = null

                if (fileRecord) {
                    geo = await getParsedModelGeometry(fileRecord)
                    if (!cancelled && geo) {
                        void ensureModelAnalysisForFile(fileRecord)
                    }
                } else {
                    const arrayBuffer = await (await fetch(url)).arrayBuffer()
                    if (cancelled) return
                    geo = await parseModelArrayBuffer('model.stl', arrayBuffer)
                }

                if (cancelled) return

                if (!geo) {
                    setError('모델을 해석할 수 없습니다. 지원 형식(STL, OBJ, 3MF, PLY, STEP)인지 확인해 주세요.')
                    setIsLoading(false)
                    return
                }

                geo.computeBoundingBox()
                const bbox = geo.boundingBox
                if (bbox) setBoundingBox(bbox)

                const prev = geometryRef.current
                geometryRef.current = geo
                if (prev && prev !== geo) {
                    try { prev.dispose() } catch { /* context lost */ }
                }
                setGeometry(geo)

                setTimeout(() => {
                    if (cancelled) return
                    try {
                        boundsRef.current?.refresh?.().clip?.().fit?.()
                    } catch {
                        /* context/controls 미준비 시 무시 */
                    }
                }, 100)

                setIsLoading(false)
            } catch (e) {
                if (cancelled) return
                console.error('❌ Model loading failed:', e)
                setError(e instanceof Error ? e.message : 'Failed to load model')
                setIsLoading(false)
            }
        }

        loadModel()

        return () => {
            cancelled = true
            geometryRef.current = null
            /* 공유 캐시 geometry — dispose는 reset/setFile 시에만 */
        }
    }, [url, fileRecord])

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
        <group
            ref={groupRef}
            scale={[scale, scale, scale]}
            rotation={[
                degreesToRadians(transform.rotX),
                degreesToRadians(transform.rotY),
                degreesToRadians(transform.rotZ),
            ]}
        >
            <mesh geometry={geometry}>
                <meshStandardMaterial
                    color={color}
                    roughness={0.55}
                    metalness={0.05}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {showMeasurements && boundingBox && (
                <>
                    <mesh>
                        <boxGeometry
                            args={[
                                boundingBox.max.x - boundingBox.min.x,
                                boundingBox.max.y - boundingBox.min.y,
                                boundingBox.max.z - boundingBox.min.z,
                            ]}
                        />
                        <meshBasicMaterial color="#00ff00" wireframe />
                    </mesh>
                    <MeasurementTool />
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

        // 트랙볼 회전 중 기울어진 up 벡터를 세워야 프리셋 시점이 옆으로 누워 보이지 않음
        camera.up.set(0, 1, 0)

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

/** Canvas 내부에서는 gl.domElement가 항상 있음 — connect(null) 방지 */
function SafeTrackballControls() {
    const domElement = useThree((s) => s.gl.domElement)

    return (
        <TrackballControls
            makeDefault
            domElement={domElement}
            staticMoving
            rotateSpeed={2.2}
            zoomSpeed={0.9}
            panSpeed={0.6}
            minDistance={0.1}
            maxDistance={1000}
        />
    )
}

// 뷰어 컨텐츠 컴포넌트
function ViewerContent({ color, showMeasurements }: { color: string, showMeasurements: boolean }) {
    const file = useFileStore((s) => s.file)
    const fileUrl = useFileStore((s) => s.fileUrl)

    const fileExtension = file?.name.split('.').pop()?.toLowerCase()
    const isSupported = fileExtension && SUPPORTED_EXT.includes(fileExtension as (typeof SUPPORTED_EXT)[number])
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
    useCpuModelAnalysis()
    const canvasRef = useRef<HTMLDivElement>(null)
    const { fileUrl, reset } = useFileStore()
    const [mounted, setMounted] = useState(false)
    const [modelColor, setModelColor] = useState('#f8fafc')
    const [showMeasurements, setShowMeasurements] = useState(false)
    const [viewPreset, setViewPreset] = useState<string | null>(null)
    const [showGuide, setShowGuide] = useState(true)
    const [colorPanelOpen, setColorPanelOpen] = useState(false)
    const [viewerEpoch, setViewerEpoch] = useState(0)

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
        { name: 'White', color: '#f8fafc' },
        { name: 'Indigo', color: '#6366f1' },
        { name: 'Red', color: '#ef4444' },
        { name: 'Green', color: '#10b981' },
        { name: 'Blue', color: '#3b82f6' },
        { name: 'Purple', color: '#a855f7' },
        { name: 'Orange', color: '#f97316' },
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
        <div className="w-full h-full min-h-[400px] bg-slate-950/20 rounded-xl overflow-hidden border border-slate-800 relative z-0">
            <ViewPresetContext.Provider value={{ viewPreset, setViewPreset }}>
                {/* 파일 업로드마다 Canvas를 재생성하지 않음 — WebGL Context Lost + Trackball connect(null) 방지 */}
                <div ref={canvasRef} className="absolute inset-0 z-0 h-full min-h-[400px]">
                    <ViewerErrorBoundary onRetry={() => setViewerEpoch((n) => n + 1)}>
                        <Canvas
                            key={viewerEpoch}
                            shadows
                            dpr={[1, 1.5]}
                            frameloop="always"
                            camera={{ position: [50, 50, 50], fov: 45 }}
                            gl={{
                                preserveDrawingBuffer: true,
                                antialias: true,
                                powerPreference: 'default',
                                stencil: false,
                            }}
                            onCreated={({ gl, invalidate }) => {
                                invalidate()
                                const el = gl?.domElement
                                if (!el) return
                                const onLost = (e: Event) => {
                                    e.preventDefault()
                                }
                                el.addEventListener('webglcontextlost', onLost)
                            }}
                        >
                            <Suspense fallback={<LoadingSpinner />}>
                                <ambientLight intensity={0.5} />
                                <directionalLight position={[10, 10, 10]} intensity={1.2} castShadow shadow-mapSize={1024} />
                                <directionalLight position={[-10, -5, -10]} intensity={0.4} />
                                <pointLight position={[0, 20, 0]} intensity={0.6} />
                                <Bounds fit clip margin={1.5}>
                                    <ViewerContent color={modelColor} showMeasurements={showMeasurements} />
                                    <ViewPresetHandler />
                                </Bounds>
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
                            <SafeTrackballControls />
                        </Canvas>
                    </ViewerErrorBoundary>
                </div>

                {/* 모델 변환 컨트롤 (견적/체험 뷰어) */}
                {!compact && fileUrl && (
                    <div className="absolute left-3 bottom-20 sm:left-4 sm:bottom-28 z-30 pointer-events-none max-w-[min(100%,340px)] sm:max-w-[min(calc(100%-5.5rem),340px)]">
                        <ModelTransformPanel />
                    </div>
                )}

                {/* 조작 가이드 - 하단 플로팅 바 형태로 변경 (전체화면 차단 방지) */}
                <AnimatePresence>
                    {showGuide && !compact && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                        >
                            <div className="bg-slate-900/90 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-white/10 flex items-center gap-3 sm:gap-6 text-white text-[10px] sm:text-xs shadow-2xl pointer-events-auto">
                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="whitespace-nowrap">좌클릭: 회전</span>
                                </div>
                                <div className="w-px h-3 sm:h-4 bg-white/10 shrink-0" />
                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="whitespace-nowrap">휠: 확대/축소</span>
                                </div>
                                <div className="w-px h-3 sm:h-4 bg-white/10 shrink-0" />
                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="whitespace-nowrap">우클릭: 이동</span>
                                </div>
                                <button
                                    className="ml-2 sm:ml-4 p-1 hover:bg-white/10 rounded-md transition-colors shrink-0"
                                    onClick={() => setShowGuide(false)}
                                >
                                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
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
                        {fileUrl && (
                            <Button size="sm" variant="destructive" className="h-10 sm:h-9 gap-2 shadow-lg backdrop-blur-sm rounded-xl bg-red-500/80 hover:bg-red-500 text-white border-transparent" onClick={() => reset()}>
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">모델 삭제</span>
                            </Button>
                        )}
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
                        <div className="flex items-center gap-2 text-white/50">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">3D 뷰어 활성 상태</span>
                        </div>
                    </div>
                )}

                {/* 뷰 프리셋: 상단 컨트롤 열 아래 빈 영역에 고정 (뷰어 높이가 낮아도 세로 중앙과 겹치지 않음). compact는 상단 메뉴 없음 → 세로 중앙 */}
                <div
                    className={
                        compact
                            ? 'absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 items-end sm:right-4'
                            : 'absolute right-3 top-52 z-20 flex flex-col gap-2 items-end sm:top-44 sm:right-4'
                    }
                >
                    {[
                        { id: 'home', label: '홈', icon: Home },
                        { id: 'front', label: '전면', icon: ArrowUp },
                        { id: 'back', label: '후면', icon: ArrowDown },
                        { id: 'left', label: '측면L', icon: ArrowLeft },
                        { id: 'right', label: '측면R', icon: ArrowRight },
                    ].map((btn) => (
                        <div key={btn.id} className="flex items-center gap-3 group">
                            <span className="text-[10px] font-black text-white/30 group-hover:text-teal-400 transition-colors uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                {btn.label}
                            </span>
                            <Button 
                                size="icon" 
                                variant="secondary" 
                                className="h-10 w-10 shadow-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/20 hover:border-teal-400/50 rounded-2xl transition-all group-active:scale-95" 
                                onClick={() => setViewPreset(btn.id)}
                            >
                                <btn.icon className="w-5 h-5 text-white/60 group-hover:text-white" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ViewPresetContext.Provider>
        </div>
    )
}
