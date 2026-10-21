'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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

/** 판을 테이블 위에 두고 돌려 보는 카메라. 극점 근처와 뒤집힘은 막는다. */
function TurntableControls({ size }: { size: [number, number, number] }) {
    const camera = useThree((s) => s.camera)
    const gl = useThree((s) => s.gl)
    const invalidate = useThree((s) => s.invalidate)
    const controlsRef = useRef<OrbitControls | null>(null)
    const fittedKey = useRef('')
    const [ready, setReady] = useState(0)

    useEffect(() => {
        const controls = new OrbitControls(camera, gl.domElement)
        controlsRef.current = controls
        fittedKey.current = ''
        controls.enableDamping = true
        controls.dampingFactor = 0.4
        controls.rotateSpeed = 0.65
        controls.zoomSpeed = 0.7
        controls.panSpeed = 0.45
        controls.screenSpacePanning = true
        controls.zoomToCursor = false
        // 바로 위에서 돌리면 한 바퀴가 튀고, 아래로 넘기면 판이 뒤집힌다
        controls.minPolarAngle = 0.18
        controls.maxPolarAngle = Math.PI / 2 - 0.06
        const onChange = () => invalidate()
        controls.addEventListener('change', onChange)
        setReady((n) => n + 1)
        return () => {
            controls.removeEventListener('change', onChange)
            controls.dispose()
            controlsRef.current = null
        }
    }, [camera, gl, invalidate])

    useFrame(() => {
        controlsRef.current?.update()
    })

    useEffect(() => {
        const controls = controlsRef.current
        if (!controls) return
        const key = `${Math.round(size[0])}x${Math.round(size[1])}`
        const span = Math.max(size[0], size[1] * 1.6, 20)
        const distance = span * 1.28
        controls.minDistance = Math.max(8, span * 0.42)
        controls.maxDistance = span * 7
        if (fittedKey.current === key) return
        const targetZ = size[2] / 2
        const first = fittedKey.current === ''
        const previous = camera.position.clone().sub(controls.target)
        controls.target.set(0, 0, targetZ)
        if (first) {
            camera.position.set(0, -distance * 0.92, targetZ + distance * 0.62)
        } else {
            camera.position.copy(controls.target).add(previous)
        }
        fittedKey.current = key
        camera.lookAt(controls.target)
        controls.update()
        invalidate()
    }, [camera, invalidate, ready, size])

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
            <TurntableControls size={size} />
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
