'use client'

import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Center, Bounds } from '@react-three/drei'
import * as THREE from 'three'
import { STLLoader } from 'three-stdlib'
import { Loader2 } from 'lucide-react'

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

export default function AdminMeshyStlPreview({ buffer, loading, error }: Props) {
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
    const [parseError, setParseError] = useState<string | null>(null)

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
            if (disposed) {
                geo.dispose()
                return
            }
            setGeometry(geo)
            setParseError(null)
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
        <div className="h-[min(60vh,420px)] w-full rounded-lg bg-black/40">
            <Canvas camera={{ position: [80, 60, 80], fov: 40 }} dpr={[1, 1.5]}>
                <color attach="background" args={['#0b0f14']} />
                <ambientLight intensity={0.55} />
                <directionalLight position={[40, 80, 40]} intensity={1.1} />
                <directionalLight position={[-30, -20, -40]} intensity={0.35} />
                <Bounds fit clip observe margin={1.35}>
                    <Center>
                        <StlMesh geometry={geometry} />
                    </Center>
                </Bounds>
                <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
            </Canvas>
        </div>
    )
}
