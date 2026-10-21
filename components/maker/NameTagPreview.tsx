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

export const PREVIEW_VIEWS = ['home', 'front', 'back', 'left', 'right', 'top', 'bottom'] as const
export type PreviewViewId = (typeof PREVIEW_VIEWS)[number]
/** nonce가 바뀌면 같은 보기를 다시 눌러도 다시 맞춘다 */
export type PreviewViewRequest = { id: PreviewViewId; nonce: number }

const DEFAULT_MIN_POLAR = 0.18
const DEFAULT_MAX_POLAR = Math.PI / 2 - 0.06
const VIEW_ANIM_MS = 380

/** 보기별 카메라 방향(타깃 기준, Z가 위). 극점은 살짝 비켜 화면 위쪽이 +Y가 되게 한다. */
function viewDirection(id: PreviewViewId): THREE.Vector3 {
    switch (id) {
        case 'home':
            return new THREE.Vector3(0, -0.92, 0.62)
        case 'front':
            return new THREE.Vector3(0, -1, 0)
        case 'back':
            return new THREE.Vector3(0, 1, 0)
        case 'left':
            return new THREE.Vector3(-1, 0, 0)
        case 'right':
            return new THREE.Vector3(1, 0, 0)
        case 'top':
            return new THREE.Vector3(0, -0.002, 1)
        case 'bottom':
            return new THREE.Vector3(0, -0.002, -1)
    }
}

function fitDistance(size: [number, number, number]): number {
    return Math.max(size[0], size[1] * 1.6, 20) * 1.28
}

/** 판을 테이블 위에 두고 돌려 보는 카메라. 극점 근처와 뒤집힘은 막는다. */
function TurntableControls({ size, view }: { size: [number, number, number]; view?: PreviewViewRequest | null }) {
    const camera = useThree((s) => s.camera)
    const gl = useThree((s) => s.gl)
    const invalidate = useThree((s) => s.invalidate)
    const controlsRef = useRef<OrbitControls | null>(null)
    const fittedKey = useRef('')
    const [ready, setReady] = useState(0)
    const anim = useRef<{
        start: number
        fromDir: THREE.Vector3
        rot: THREE.Quaternion
        fromDist: number
        toDist: number
    } | null>(null)

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
        controls.minPolarAngle = DEFAULT_MIN_POLAR
        controls.maxPolarAngle = DEFAULT_MAX_POLAR
        // 사용자가 직접 돌리기 시작하면 보기 전환 애니메이션은 멈춘다
        const onStart = () => {
            anim.current = null
        }
        controls.addEventListener('start', onStart)
        const onChange = () => invalidate()
        controls.addEventListener('change', onChange)
        setReady((n) => n + 1)
        return () => {
            controls.removeEventListener('change', onChange)
            controls.removeEventListener('start', onStart)
            controls.dispose()
            controlsRef.current = null
        }
    }, [camera, gl, invalidate])

    useFrame(() => {
        const controls = controlsRef.current
        const a = anim.current
        if (controls && a) {
            const raw = Math.min(1, (performance.now() - a.start) / VIEW_ANIM_MS)
            const t = 1 - Math.pow(1 - raw, 3)
            const dir = a.fromDir.clone().applyQuaternion(new THREE.Quaternion().slerp(a.rot, t))
            const dist = a.fromDist + (a.toDist - a.fromDist) * t
            camera.position.copy(controls.target).addScaledVector(dir, dist)
            camera.lookAt(controls.target)
            if (raw >= 1) anim.current = null
            invalidate()
        }
        controls?.update()
    })

    useEffect(() => {
        const controls = controlsRef.current
        if (!controls || !view) return
        const isHome = view.id === 'home'
        // 옆·위·아래 보기는 기본 회전 범위를 벗어나므로 범위를 풀고, 홈에서 되돌린다
        controls.minPolarAngle = isHome ? DEFAULT_MIN_POLAR : 0
        controls.maxPolarAngle = isHome ? DEFAULT_MAX_POLAR : Math.PI
        const offset = camera.position.clone().sub(controls.target)
        const fromDist = Math.max(offset.length(), 1)
        const fromDir = offset.normalize()
        const toDir = viewDirection(view.id).normalize()
        anim.current = {
            start: performance.now(),
            fromDir,
            rot: new THREE.Quaternion().setFromUnitVectors(fromDir, toDir),
            fromDist,
            toDist: fitDistance(size),
        }
        invalidate()
        // size는 거리 계산에만 쓰며, 크기가 바뀌었다고 보기를 다시 적용하지는 않는다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, ready, camera, invalidate])

    useEffect(() => {
        const controls = controlsRef.current
        if (!controls) return
        const key = `${Math.round(size[0])}x${Math.round(size[1])}`
        const span = Math.max(size[0], size[1] * 1.6, 20)
        const distance = fitDistance(size)
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
    /** 판을 클릭하면 그 좌표(mm)에 구멍을 둔다 */
    onPlaceHole?: (xMm: number, yMm: number) => void
    /** 보기 버튼(홈·정면·좌·우·상·하·후면) 요청 */
    view?: PreviewViewRequest | null
}

/** 드래그가 아닌 클릭만 구멍 위치로 받는다. */
function HolePicker({ onPlace }: { onPlace?: (xMm: number, yMm: number) => void }) {
    const camera = useThree((s) => s.camera)
    const gl = useThree((s) => s.gl)
    const scene = useThree((s) => s.scene)
    const down = useRef({ x: 0, y: 0, active: false })

    useEffect(() => {
        const el = gl.domElement
        if (!onPlace) {
            el.style.cursor = ''
            return
        }
        el.style.cursor = 'crosshair'
        const onDown = (event: PointerEvent) => {
            if (event.button !== 0) return
            down.current = { x: event.clientX, y: event.clientY, active: true }
        }
        const onUp = (event: PointerEvent) => {
            if (!down.current.active || event.button !== 0) return
            down.current.active = false
            if (Math.hypot(event.clientX - down.current.x, event.clientY - down.current.y) > 5) return
            const rect = el.getBoundingClientRect()
            const ndc = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            )
            const ray = new THREE.Raycaster()
            ray.setFromCamera(ndc, camera)
            const hit = ray.intersectObjects(scene.children, true).find((item) => item.object instanceof THREE.Mesh)
            if (!hit) return
            onPlace(Math.round(hit.point.x * 10) / 10, Math.round(hit.point.y * 10) / 10)
        }
        el.addEventListener('pointerdown', onDown)
        el.addEventListener('pointerup', onUp)
        return () => {
            el.style.cursor = ''
            el.removeEventListener('pointerdown', onDown)
            el.removeEventListener('pointerup', onUp)
        }
    }, [camera, gl, onPlace, scene])

    return null
}

export function NameTagPreview({ result, plateColor, textColor, showThin, onPlaceHole, view }: Props) {
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
            <TurntableControls size={size} view={view} />
            <HolePicker onPlace={onPlaceHole} />
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
