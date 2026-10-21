'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { MeshData, NameTagBuildResult } from '@/lib/name-tag/build'

function useGeometry(mesh: MeshData | null): THREE.BufferGeometry | null {
    const geometry = useMemo(() => {
        if (!mesh) return null
        const indexed = new THREE.BufferGeometry()
        indexed.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3))
        indexed.setIndex(new THREE.BufferAttribute(mesh.indices, 1))
        // 면마다 법선을 따로 두어 글자 모서리가 또렷하게 보이게 한다
        const flat = indexed.toNonIndexed()
        indexed.dispose()
        flat.computeVertexNormals()
        return flat
    }, [mesh])
    useEffect(() => () => geometry?.dispose(), [geometry])
    return geometry
}

function Part({ mesh, color, emissive }: { mesh: MeshData | null; color: string; emissive?: string }) {
    const geometry = useGeometry(mesh)
    if (!geometry) return null
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial
                color={color}
                roughness={0.55}
                metalness={0.02}
                emissive={emissive ?? '#000000'}
                emissiveIntensity={emissive ? 0.6 : 0}
            />
        </mesh>
    )
}

/** 결과 크기가 바뀌면 카메라 거리를 맞춘다 */
function FitCamera({ size }: { size: [number, number, number] }) {
    const { camera, controls } = useThree()
    const key = `${Math.round(size[0])}x${Math.round(size[1])}`
    useEffect(() => {
        const span = Math.max(size[0], size[1] * 1.6, 20)
        const distance = span * 1.25
        camera.position.set(0, -distance * 0.55, distance)
        camera.lookAt(0, 0, size[2] / 2)
        const orbit = controls as unknown as { target?: THREE.Vector3; update?: () => void } | null
        orbit?.target?.set(0, 0, size[2] / 2)
        orbit?.update?.()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, camera, controls])
    return null
}

type Props = {
    result: NameTagBuildResult | null
    plateColor: string
    textColor: string
    showThin: boolean
}

export function NameTagPreview({ result, plateColor, textColor, showThin }: Props) {
    const size = result?.stats.sizeMm ?? [60, 24, 3]
    return (
        <Canvas
            camera={{ position: [0, -40, 70], fov: 35, up: [0, 0, 1], near: 0.5, far: 2000 }}
            onCreated={({ camera }) => camera.up.set(0, 0, 1)}
            gl={{ antialias: true, alpha: false, powerPreference: 'default' }}
            dpr={[1, 1.75]}
            frameloop="demand"
        >
            <color attach="background" args={['#101016']} />
            <hemisphereLight args={['#ffffff', '#3a3a46', 0.9]} />
            <directionalLight position={[-30, -40, 80]} intensity={1.6} />
            <directionalLight position={[40, 30, 30]} intensity={0.5} />
            <OrbitControls makeDefault enableDamping={false} minDistance={10} maxDistance={600} />
            <FitCamera size={size} />
            {result ? (
                <group>
                    <Part mesh={result.base} color={plateColor} />
                    <Part mesh={result.raised} color={textColor} />
                    <Part mesh={result.engraveFill} color={textColor} />
                    {showThin ? <Part mesh={result.thin} color="#ef4444" emissive="#7f1d1d" /> : null}
                </group>
            ) : null}
        </Canvas>
    )
}
