'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { TrackballControls } from '@react-three/drei'
import * as THREE from 'three'
import { STLLoader } from 'three-stdlib'
import { Loader2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
    /** auth로 이미 fetch한 STL ArrayBuffer */
    buffer: ArrayBuffer | null
    loading?: boolean
    error?: string | null
}

function StlMesh({ geometry }: { geometry: THREE.BufferGeometry }) {
    const material = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: new THREE.Color('#94a3b8'),
                metalness: 0.15,
                roughness: 0.55,
            }),
        []
    )
    useEffect(() => () => material.dispose(), [material])
    return <mesh geometry={geometry} material={material} />
}

/** 바운딩 스피어 기준 카메라·줌 한도 맞춤 — Bounds+Trackball 충돌/모달 0크기 핏 방지 */
function FitCameraAndControls({
    geometry,
    fitNonce,
}: {
    geometry: THREE.BufferGeometry
    fitNonce: number
}) {
    const { camera, size, controls } = useThree()
    const [limits, setLimits] = useState({ min: 0.5, max: 2000 })

    const fit = useCallback(() => {
        geometry.computeBoundingSphere()
        const sphere = geometry.boundingSphere
        if (!sphere) return

        const r = Math.max(sphere.radius, 1e-3)
        const cam = camera as THREE.PerspectiveCamera
        const vFov = (cam.fov * Math.PI) / 180
        const aspect = size.width / Math.max(size.height, 1)
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)

        let dist = Math.max(r / Math.sin(vFov / 2), r / Math.sin(hFov / 2))
        dist *= 1.45

        const dir = new THREE.Vector3(1, 0.72, 1).normalize()
        cam.position.copy(dir.multiplyScalar(dist))
        cam.near = Math.max(r / 200, dist / 1000, 0.01)
        cam.far = Math.max(r * 200, dist * 40, 100)
        cam.lookAt(0, 0, 0)
        cam.updateProjectionMatrix()

        const minDistance = Math.max(r * 1.15, 0.05)
        const maxDistance = Math.max(dist * 12, r * 20, 10)
        setLimits({ min: minDistance, max: maxDistance })

        const tb = controls as unknown as {
            target?: THREE.Vector3
            minDistance?: number
            maxDistance?: number
            update?: () => void
        } | null
        if (tb?.target && tb.update) {
            tb.target.set(0, 0, 0)
            tb.minDistance = minDistance
            tb.maxDistance = maxDistance
            tb.update()
        }
    }, [geometry, camera, controls, size.width, size.height])

    useEffect(() => {
        // 모달 레이아웃·Canvas 크기·Trackball 연결 확정 후 맞춤
        let raf2 = 0
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => fit())
        })
        const t = window.setTimeout(() => fit(), 160)
        return () => {
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)
            window.clearTimeout(t)
        }
    }, [fit, fitNonce, controls])

    return (
        <TrackballControls
            makeDefault
            staticMoving
            rotateSpeed={2.2}
            zoomSpeed={0.7}
            panSpeed={0.55}
            minDistance={limits.min}
            maxDistance={limits.max}
            noPan={false}
            noZoom={false}
            noRotate={false}
        />
    )
}

export default function AdminMeshyStlPreview({ buffer, loading, error }: Props) {
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
    const [parseError, setParseError] = useState<string | null>(null)
    const [fitNonce, setFitNonce] = useState(0)

    useEffect(() => {
        if (!buffer) {
            setGeometry(null)
            setParseError(null)
            return
        }
        let disposed = false
        try {
            const loader = new STLLoader()
            const geo = loader.parse(buffer)
            geo.computeVertexNormals()
            geo.center()
            geo.computeBoundingSphere()
            if (disposed) {
                geo.dispose()
                return
            }
            setGeometry(geo)
            setParseError(null)
            setFitNonce((n) => n + 1)
        } catch {
            setParseError('STL 파싱에 실패했습니다')
            setGeometry(null)
        }
        return () => {
            disposed = true
            setGeometry((g) => {
                g?.dispose()
                return null
            })
        }
    }, [buffer])

    if (loading) {
        return (
            <div className="flex h-full min-h-[280px] items-center justify-center gap-2 text-white/50">
                <Loader2 className="h-5 w-5 animate-spin" />
                모델 불러오는 중…
            </div>
        )
    }

    const err = error || parseError
    if (err) {
        return (
            <div className="flex h-full min-h-[280px] items-center justify-center px-4 text-center text-sm text-red-300/90">
                {err}
            </div>
        )
    }

    if (!geometry) {
        return (
            <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-white/40">
                미리볼 모델이 없습니다
            </div>
        )
    }

    return (
        <div className="relative h-[min(60vh,420px)] w-full rounded-lg bg-black/40 overflow-hidden">
            <Canvas
                camera={{ position: [2, 1.5, 2], fov: 40, near: 0.01, far: 10000 }}
                dpr={[1, 1.5]}
                style={{ width: '100%', height: '100%' }}
            >
                <color attach="background" args={['#0b0f14']} />
                <ambientLight intensity={0.55} />
                <directionalLight position={[40, 80, 40]} intensity={1.1} />
                <directionalLight position={[-30, -20, -40]} intensity={0.35} />
                <StlMesh geometry={geometry} />
                <FitCameraAndControls geometry={geometry} fitNonce={fitNonce} />
            </Canvas>
            <div className="absolute right-2 top-2 z-10">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 border-white/20 bg-black/50 text-white hover:bg-black/70 text-[11px] font-bold"
                    onClick={() => setFitNonce((n) => n + 1)}
                >
                    <Maximize2 className="w-3.5 h-3.5 mr-1" />
                    전체 보기
                </Button>
            </div>
            <p className="pointer-events-none absolute bottom-2 left-2 text-[10px] font-bold text-white/35">
                드래그 회전 · 스크롤 줌 · 우클릭 이동
            </p>
        </div>
    )
}
