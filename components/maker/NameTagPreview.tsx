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

function Part({
    mesh,
    color,
    emissive,
    pickHole = true,
}: {
    mesh: MeshData | null
    color: string
    emissive?: string
    /** 빨간 얇기 표시는 클릭 위치에서 뺀다 */
    pickHole?: boolean
}) {
    const geometry = useGeometry(mesh)
    if (!geometry) return null
    return (
        <mesh geometry={geometry} userData={{ pickHole }}>
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
            return new THREE.Vector3(0, -0.92, 0.62).normalize()
        case 'front':
            return new THREE.Vector3(0, -1, 0)
        case 'back':
            return new THREE.Vector3(0, 1, 0)
        case 'left':
            return new THREE.Vector3(-1, 0, 0)
        case 'right':
            return new THREE.Vector3(1, 0, 0)
        case 'top':
            return new THREE.Vector3(0, -0.002, 1).normalize()
        case 'bottom':
            return new THREE.Vector3(0, -0.002, -1).normalize()
    }
}

/**
 * 뷰포트 크기, 카메라 FOV, 물체 크기, 뷰 방향을 고려해
 * 어떤 각도에서 보아도 물체 전체가 프리뷰 영역 안에 여유 있게 들어가도록 거리를 계산한다.
 */
function calculateFitDistance({
    cameraFov,
    viewportWidth,
    viewportHeight,
    size,
    dir,
}: {
    cameraFov: number
    viewportWidth: number
    viewportHeight: number
    size: [number, number, number]
    dir: THREE.Vector3
}): number {
    const aspect = Math.max(0.1, viewportWidth / Math.max(1, viewportHeight))
    const fovYRad = (cameraFov * Math.PI) / 180
    const tanHalfY = Math.tan(fovYRad / 2)
    const tanHalfX = tanHalfY * aspect

    // 카메라의 화면 수평(right) 및 수직(trueUp) 축 단위 벡터
    const viewDir = dir.clone().normalize()
    const approxUp = new THREE.Vector3(0, 0, 1)
    const cross = new THREE.Vector3().crossVectors(viewDir, approxUp)
    const safeUp = cross.lengthSq() < 1e-4 ? new THREE.Vector3(0, 1, 0) : approxUp
    const right = new THREE.Vector3().crossVectors(viewDir, safeUp).normalize()
    const trueUp = new THREE.Vector3().crossVectors(right, viewDir).normalize()

    // 물체의 8개 꼭짓점을 화면 수평/수직 축에 투영
    const hx = Math.max(size[0], 1) / 2
    const hy = Math.max(size[1], 1) / 2
    const hz = Math.max(size[2], 1) / 2

    const corners = [
        [hx, hy, hz],
        [hx, hy, -hz],
        [hx, -hy, hz],
        [hx, -hy, -hz],
        [-hx, hy, hz],
        [-hx, hy, -hz],
        [-hx, -hy, hz],
        [-hx, -hy, -hz],
    ]

    let maxProjH = 0
    let maxProjV = 0
    for (const [x, y, z] of corners) {
        const dotH = Math.abs(x * right.x + y * right.y + z * right.z)
        const dotV = Math.abs(x * trueUp.x + y * trueUp.y + z * trueUp.z)
        if (dotH > maxProjH) maxProjH = dotH
        if (dotV > maxProjV) maxProjV = dotV
    }

    // 우측 보기 전환 툴바 및 캔버스 테두리를 고려한 안전 여백 계수 (1.38배)
    const padding = 1.38
    const distForWidth = (maxProjH / tanHalfX) * padding
    const distForHeight = (maxProjV / tanHalfY) * padding

    // 바운딩 구 반경 기준 최소 거리 보장
    const radius = Math.hypot(hx, hy, hz)
    const distForSphere = (radius / Math.min(tanHalfX, tanHalfY)) * 1.25

    return Math.max(distForWidth, distForHeight, distForSphere, 20)
}

/** 판을 테이블 위에 두고 돌려 보는 카메라. 극점 근처와 뒤집힘은 막는다. */
function TurntableControls({ size, view }: { size: [number, number, number]; view?: PreviewViewRequest | null }) {
    const camera = useThree((s) => s.camera)
    const gl = useThree((s) => s.gl)
    const invalidate = useThree((s) => s.invalidate)
    const viewportSize = useThree((s) => s.size)
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

    const getFitDistance = (dir: THREE.Vector3) => {
        const perspCamera = camera as THREE.PerspectiveCamera
        return calculateFitDistance({
            cameraFov: perspCamera.fov ?? 35,
            viewportWidth: viewportSize.width || gl.domElement.clientWidth || 800,
            viewportHeight: viewportSize.height || gl.domElement.clientHeight || 600,
            size,
            dir,
        })
    }

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
        const toDir = viewDirection(view.id)
        const toDist = getFitDistance(toDir)
        anim.current = {
            start: performance.now(),
            fromDir,
            rot: new THREE.Quaternion().setFromUnitVectors(fromDir, toDir),
            fromDist,
            toDist,
        }
        invalidate()
        // size는 거리 계산에만 쓰며, 크기가 바뀌었다고 보기를 다시 적용하지는 않는다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, ready, camera, invalidate])

    useEffect(() => {
        const controls = controlsRef.current
        if (!controls) return
        const key = `${Math.round(size[0])}x${Math.round(size[1])}x${Math.round(size[2])}`
        const radius = Math.hypot(size[0], size[1], size[2]) / 2
        const homeDir = viewDirection('home')
        const distance = getFitDistance(homeDir)
        controls.minDistance = Math.max(8, radius * 0.4)
        controls.maxDistance = Math.max(distance * 4, 300)
        if (fittedKey.current === key) return
        const targetZ = size[2] / 2
        const first = fittedKey.current === ''
        const previous = camera.position.clone().sub(controls.target)
        controls.target.set(0, 0, targetZ)
        if (first) {
            camera.position.copy(controls.target).addScaledVector(homeDir, distance)
        } else {
            camera.position.copy(controls.target).add(previous)
        }
        fittedKey.current = key
        camera.lookAt(controls.target)
        controls.update()
        invalidate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
    /** 베이스 윗면 높이(mm). 옆면을 눌렀을 때 시선이 윗면과 만나는 점으로 맞춘다 */
    plateTopZ?: number
    /** 보기 버튼(홈·정면·좌·우·상·하·후면) 요청 */
    view?: PreviewViewRequest | null
}

function isPickMesh(object: THREE.Object3D): object is THREE.Mesh {
    return object instanceof THREE.Mesh && object.userData.pickHole !== false
}

/** 기울어진 화면에서 옆면을 찍으면, 그 시선이 판 윗면과 만나는 좌표를 쓴다. */
function topPlanePoint(ray: THREE.Raycaster, plateTopZ: number, scene: THREE.Scene): THREE.Vector3 | null {
    const point = new THREE.Vector3()
    const hit = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -plateTopZ), point)
    if (!hit || point.clone().sub(ray.ray.origin).dot(ray.ray.direction) <= 1e-4) return null
    const probe = new THREE.Raycaster(new THREE.Vector3(point.x, point.y, plateTopZ + 40), new THREE.Vector3(0, 0, -1))
    const overPlate = probe.intersectObjects(scene.children, true).some((item) => isPickMesh(item.object))
    return overPlate ? point : null
}

/** 드래그가 아닌 클릭만 구멍 위치로 받는다. */
function HolePicker({ onPlace, plateTopZ = 0 }: { onPlace?: (xMm: number, yMm: number) => void; plateTopZ?: number }) {
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
            camera.updateMatrixWorld()
            const ray = new THREE.Raycaster()
            ray.setFromCamera(ndc, camera)
            const hit = ray.intersectObjects(scene.children, true).find((item) => isPickMesh(item.object))
            if (!hit) return
            const normal = hit.face?.normal.clone().transformDirection(hit.object.matrixWorld)
            const onTop = normal && normal.z > 0.55 ? hit.point : topPlanePoint(ray, plateTopZ, scene)
            const point = onTop ?? hit.point
            onPlace(Math.round(point.x * 10) / 10, Math.round(point.y * 10) / 10)
        }
        el.addEventListener('pointerdown', onDown)
        el.addEventListener('pointerup', onUp)
        return () => {
            el.style.cursor = ''
            el.removeEventListener('pointerdown', onDown)
            el.removeEventListener('pointerup', onUp)
        }
    }, [camera, gl, onPlace, plateTopZ, scene])

    return null
}

export function NameTagPreview({ result, plateColor, textColor, showThin, onPlaceHole, plateTopZ, view }: Props) {
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
            <HolePicker onPlace={onPlaceHole} plateTopZ={plateTopZ} />
            {result ? (
                <group>
                    <Part mesh={result.base} color={plateColor} />
                    <Part mesh={result.raised} color={textColor} />
                    <Part mesh={result.engraveFill} color={textColor} />
                    {showThin ? <Part mesh={result.thin} color="#ef4444" emissive="#7f1d1d" pickHole={false} /> : null}
                </group>
            ) : null}
        </Canvas>
    )
}
