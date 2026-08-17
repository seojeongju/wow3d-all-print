/**
 * Maker 2.5D 공유 기하 — 미리보기와 STL이 같은 mm 규칙·메시를 씀
 */
import * as THREE from 'three'
// @ts-ignore
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'

/** 캔버스 1px → 씬 단위 (스케치 XY) */
export const SCENE_SCALE = 0.02
/** 씬 1단위 → mm (STL 내보내기 배율) */
export const EXPORT_SCALE = 5
/** mm → 씬 단위 (Z·판 크기·bevel) */
export const MM_TO_SCENE = 1 / EXPORT_SCALE

export const MAX_SHAPES_PER_SVG = 120

export type BasePlateType = 'none' | 'rect' | 'circle' | 'rounded'

export type MakerScenePath = {
    points: { x: number; y: number }[]
    width: number
    color?: string
}

export type MakerSceneSvg = {
    svgContent: string
    /** 자동 맞춤 대비 배율 (1 = 판 안쪽에 맞춤) */
    scale?: number
    /** 판 중심 기준 X 이동 (mm, +오른쪽) */
    offsetXMm?: number
    /** 판 중심 기준 Y 이동 (mm, +위) */
    offsetYMm?: number
    /** Z축 회전 (도) */
    rotationDeg?: number
}

export type BackMountType = 'none' | 'magnet' | 'pin'

export type MakerSceneInput = {
    paths: MakerScenePath[]
    importedSvgs: MakerSceneSvg[]
    extrusionHeight: number
    basePlateType: BasePlateType
    baseHeight: number
    bevelMm: number
    rimHeightMm: number
    baseSizeMm: number
    cornerRadiusMm: number
    canvasSize: { width: number; height: number }
    /** Cherry MX 간이 스템 (키캡 밑면 −Z) */
    mxStem: boolean
    /** 배지 뒷면 장착 */
    backMount: BackMountType
    baseColor: string
    logoColor: string
    rimColor: string
}

export function mmToScene(mm: number): number {
    return Math.max(0, mm) * MM_TO_SCENE
}

/** 부호 있는 mm → 씬 (오프셋용) */
export function mmToSceneSigned(mm: number): number {
    return mm * MM_TO_SCENE
}

function clampNum(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n))
}

export function hasMakerSceneContent(input: MakerSceneInput): boolean {
    const hasPaths = input.paths.some((p) => p.points.length >= 2)
    const hasSvgs = input.importedSvgs.length > 0
    const hasBase = input.basePlateType !== 'none'
    return hasPaths || hasSvgs || hasBase
}

export function disposeObject3D(root: THREE.Object3D): void {
    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose()
            const mat = obj.material
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
            else (mat as THREE.Material | undefined)?.dispose()
        }
    })
}

function getPathPoints(path: THREE.Path, divisions = 16): THREE.Vector2[] {
    if (typeof path.getPoints === 'function') return path.getPoints(divisions)
    if (typeof (path as { getSpacedPoints?: (n: number) => THREE.Vector2[] }).getSpacedPoints === 'function') {
        return (path as { getSpacedPoints: (n: number) => THREE.Vector2[] }).getSpacedPoints(divisions)
    }
    return []
}

function flattenSvgShapes(data: { paths?: unknown[] }): THREE.Shape[] {
    const paths = data.paths || []
    const build = (skipLightBg: boolean): THREE.Shape[] => {
        const allShapes: THREE.Shape[] = []
        paths.forEach((path: unknown) => {
            try {
                const p = path as {
                    userData?: { style?: { fill?: string } }
                }
                const fill = p.userData?.style?.fill
                if (fill === 'none' || fill === 'transparent') return

                if (skipLightBg && typeof fill === 'string') {
                    try {
                        const c = new THREE.Color(fill)
                        const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
                        if (lum >= 0.82) return
                    } catch {
                        /* keep */
                    }
                }

                const created = SVGLoader.createShapes(path) as THREE.Shape[]
                if (!created?.length) return
                created.forEach((shape) => {
                    allShapes.push(shape)
                })
            } catch {
                /* skip */
            }
        })
        return allShapes
    }

    const filtered = build(true)
    if (filtered.length > 0) return filtered
    // 전부 밝은 색이면 필터 없이 재시도 (흰 로고 등)
    return build(false)
}

function transformShape(
    shape: THREE.Shape,
    centerX: number,
    centerY: number,
    scale: number
): THREE.Shape {
    const map = (p: THREE.Vector2) =>
        new THREE.Vector2((p.x - centerX) * scale, -(p.y - centerY) * scale)
    const pts = getPathPoints(shape, 24).map(map)
    const next = new THREE.Shape()
    if (pts.length === 0) return next
    next.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) next.lineTo(pts[i].x, pts[i].y)
    const holes = (shape as { holes?: THREE.Path[] }).holes
    if (holes?.length) {
        holes.forEach((hole) => {
            const hpts = getPathPoints(hole, 16).map(map)
            if (hpts.length < 3) return
            const hp = new THREE.Path()
            hp.moveTo(hpts[hpts.length - 1].x, hpts[hpts.length - 1].y)
            for (let i = hpts.length - 2; i >= 0; i--) hp.lineTo(hpts[i].x, hpts[i].y)
            next.holes.push(hp)
        })
    }
    return next
}

export function parseSvgToSceneShapes(svgContent: string, targetSizeScene: number): THREE.Shape[] {
    try {
        const loader = new SVGLoader()
        const data = loader.parse(svgContent)
        let allShapes = flattenSvgShapes(data).slice(0, MAX_SHAPES_PER_SVG)
        if (allShapes.length === 0) return []

        // 통짜 큰 사각형이 글자 path를 덮지 않도록 제거
        allShapes = dropCoveringPlateShapes(allShapes)

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        allShapes.forEach((shape) => {
            getPathPoints(shape, 12).forEach((p) => {
                minX = Math.min(minX, p.x)
                minY = Math.min(minY, p.y)
                maxX = Math.max(maxX, p.x)
                maxY = Math.max(maxY, p.y)
            })
        })
        const w = Math.max(1, maxX - minX)
        const h = Math.max(1, maxY - minY)
        const scale = Math.min(targetSizeScene / w, targetSizeScene / h)
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        return allShapes.map((s) => transformShape(s, centerX, centerY, scale))
    } catch {
        return []
    }
}

/** 작은 글자 path가 있을 때 전체를 덮는 통짜 판(마스크)을 제거 */
function dropCoveringPlateShapes(shapes: THREE.Shape[]): THREE.Shape[] {
    if (shapes.length <= 1) return shapes

    type Meta = { shape: THREE.Shape; area: number; pts: number; minX: number; minY: number; maxX: number; maxY: number }
    const metas: Meta[] = shapes.map((shape) => {
        const pts = getPathPoints(shape, 24)
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        pts.forEach((p) => {
            minX = Math.min(minX, p.x)
            minY = Math.min(minY, p.y)
            maxX = Math.max(maxX, p.x)
            maxY = Math.max(maxY, p.y)
        })
        const area = Math.max(0, maxX - minX) * Math.max(0, maxY - minY)
        return { shape, area, pts: pts.length, minX, minY, maxX, maxY }
    })

    const maxArea = Math.max(...metas.map((m) => m.area), 1)
    const totalSmaller = metas
        .filter((m) => m.area < maxArea * 0.85)
        .reduce((s, m) => s + m.area, 0)

    let filtered = metas.filter((m) => {
        const covers = m.area >= maxArea * 0.55
        const isLargest = m.area >= maxArea * 0.98
        const aspect = (m.maxX - m.minX) / Math.max(0.001, m.maxY - m.minY)
        const rectLike = aspect > 0.35 && aspect < 2.8

        // 가장 큰 면이 나머지 합보다 훨씬 크면 = 배경 마스크 판
        if (isLargest && totalSmaller > 0 && m.area >= totalSmaller * 1.15) return false
        // 넓은 사각 판 + 다른 path 존재
        if (covers && rectLike && metas.some((o) => o.area < m.area * 0.7)) return false
        if (covers && m.pts <= 16 && metas.length >= 2) return false
        if (covers && metas.length >= 3 && m.area >= maxArea * 0.85) return false
        return true
    })

    // 한 장만 남고 그게 최대 판이면, 차순위 면적들만 사용
    if (filtered.length <= 1 && metas.length > 1) {
        const sorted = [...metas].sort((a, b) => b.area - a.area)
        const rest = sorted.slice(1)
        if (rest.length > 0 && sorted[0].area >= rest[0].area * 1.4) {
            filtered = rest
        }
    }

    return filtered.length > 0 ? filtered.map((m) => m.shape) : shapes
}

/** 모서리 라운드 사각형 (중심 원점, XY 평면) */
export function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
    const hw = width / 2
    const hh = height / 2
    const r = Math.max(0.001, Math.min(radius, hw, hh))
    const shape = new THREE.Shape()
    shape.moveTo(-hw + r, -hh)
    shape.lineTo(hw - r, -hh)
    shape.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false)
    shape.lineTo(hw, hh - r)
    shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false)
    shape.lineTo(-hw + r, hh)
    shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false)
    shape.lineTo(-hw, -hh + r)
    shape.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false)
    return shape
}

export function circleShape(radius: number): THREE.Shape {
    const r = Math.max(0.001, radius)
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0)
    return new THREE.Shape(curve.getPoints(48))
}

function addHoleFromShape(outer: THREE.Shape, inner: THREE.Shape): void {
    const pts = getPathPoints(inner, 24)
    if (pts.length < 3) return
    const hole = new THREE.Path()
    hole.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
    for (let i = pts.length - 2; i >= 0; i--) hole.lineTo(pts[i].x, pts[i].y)
    outer.holes.push(hole)
}

export function circleRingShape(outerR: number, innerR: number): THREE.Shape {
    const outer = circleShape(outerR)
    addHoleFromShape(outer, circleShape(Math.max(0.001, innerR)))
    return outer
}

export function roundedFrameShape(
    width: number,
    height: number,
    radius: number,
    inset: number
): THREE.Shape {
    const outer = roundedRectShape(width, height, radius)
    const iw = Math.max(0.05, width - inset * 2)
    const ih = Math.max(0.05, height - inset * 2)
    const ir = Math.max(0.001, radius - inset)
    addHoleFromShape(outer, roundedRectShape(iw, ih, ir))
    return outer
}

/** bevel이 양쪽에 붙어도 전체 높이가 대략 heightMm이 되도록 depth 보정 */
export function extrudeOptions(heightMm: number, bevelMm: number): THREE.ExtrudeGeometryOptions {
    const bevel = bevelMm >= 0.15
    const bevelScene = bevel ? mmToScene(bevelMm) : 0
    const total = mmToScene(Math.max(0.4, heightMm))
    const depth = Math.max(mmToScene(0.35), total - (bevel ? bevelScene * 2 : 0))
    return {
        depth,
        bevelEnabled: bevel,
        bevelThickness: bevelScene,
        bevelSize: bevelScene,
        bevelSegments: bevel ? 2 : 0,
        curveSegments: 8,
    }
}

function hexLuminance(hex: string): number {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
    if (!m) return 0.5
    const n = parseInt(m[1], 16)
    const r = ((n >> 16) & 255) / 255
    const g = ((n >> 8) & 255) / 255
    const b = (n & 255) / 255
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function makeMaterial(
    mode: 'preview' | 'export',
    color: string,
    extra?: { roughness?: number; metalness?: number; emissive?: string; emissiveIntensity?: number }
): THREE.Material {
    if (mode === 'export') return new THREE.MeshBasicMaterial({ color })
    return new THREE.MeshStandardMaterial({
        color,
        roughness: extra?.roughness ?? 0.35,
        metalness: extra?.metalness ?? 0.15,
        emissive: extra?.emissive ?? '#000000',
        emissiveIntensity: extra?.emissiveIntensity ?? 0,
    })
}

/** 미리보기에서 어두운 로고가 배경에 묻히지 않도록 색·발광 보정 (STL export 색은 유지) */
function logoPreviewMaterial(mode: 'preview' | 'export', logoColor: string): THREE.Material {
    const color = logoColor || '#0f172a'
    if (mode === 'export') return makeMaterial(mode, color)
    const lum = hexLuminance(color)
    // 거의 검정 → 틸 하이라이트로 실루엣이 보이게
    if (lum < 0.18) {
        return makeMaterial(mode, '#14b8a6', {
            roughness: 0.32,
            metalness: 0.12,
            emissive: '#0f766e',
            emissiveIntensity: 0.28,
        })
    }
    return makeMaterial(mode, color, {
        roughness: 0.28,
        metalness: 0.1,
        emissive: color,
        emissiveIntensity: lum < 0.45 ? 0.22 : 0.08,
    })
}

function addExtruded(
    group: THREE.Group,
    shape: THREE.Shape,
    heightMm: number,
    bevelMm: number,
    material: THREE.Material,
    z: number,
    preview: boolean
): void {
    try {
        const geom = new THREE.ExtrudeGeometry(shape, extrudeOptions(heightMm, bevelMm))
        const mesh = new THREE.Mesh(geom, material)
        mesh.position.z = z
        if (preview) {
            mesh.castShadow = true
            mesh.receiveShadow = true
        }
        group.add(mesh)
    } catch (e) {
        console.warn('Maker extrude skipped', e)
        try {
            const geom = new THREE.ExtrudeGeometry(shape, extrudeOptions(heightMm, 0))
            const mesh = new THREE.Mesh(geom, material)
            mesh.position.z = z
            group.add(mesh)
        } catch {
            /* skip broken shape */
        }
    }
}

function addMesh(
    group: THREE.Group,
    geom: THREE.BufferGeometry,
    material: THREE.Material,
    preview: boolean,
    x = 0,
    y = 0,
    z = 0
): void {
    const mesh = new THREE.Mesh(geom, material)
    mesh.position.set(x, y, z)
    if (preview) {
        mesh.castShadow = true
        mesh.receiveShadow = true
    }
    group.add(mesh)
}

/** Cherry MX 간이 십자 스템 (FDM 여유: 슬롯 1.35mm) */
function mxCrossShape(): THREE.Shape {
    const L = mmToScene(4.1) / 2
    const w = mmToScene(1.35) / 2
    const shape = new THREE.Shape()
    shape.moveTo(-w, L)
    shape.lineTo(w, L)
    shape.lineTo(w, w)
    shape.lineTo(L, w)
    shape.lineTo(L, -w)
    shape.lineTo(w, -w)
    shape.lineTo(w, -L)
    shape.lineTo(-w, -L)
    shape.lineTo(-w, -w)
    shape.lineTo(-L, -w)
    shape.lineTo(-L, w)
    shape.lineTo(-w, w)
    shape.closePath()
    return shape
}

function addHardware(
    group: THREE.Group,
    input: MakerSceneInput,
    mode: 'preview' | 'export',
    preview: boolean
): void {
    const hwMat = makeMaterial(mode, '#3f3f52', { roughness: 0.5, metalness: 0.12 })

    if (input.mxStem) {
        const stemH = 4.0
        addExtruded(group, mxCrossShape(), stemH, 0, hwMat, -mmToScene(stemH), preview)
        const collarR = mmToScene(5.6) / 2
        const collarH = mmToScene(1.1)
        const collar = new THREE.CylinderGeometry(collarR, collarR, collarH, 20)
        const collarMesh = new THREE.Mesh(collar, hwMat)
        collarMesh.rotation.x = Math.PI / 2
        collarMesh.position.z = -collarH / 2
        if (preview) {
            collarMesh.castShadow = true
            collarMesh.receiveShadow = true
        }
        group.add(collarMesh)
    }

    if (input.backMount === 'magnet') {
        const innerR = mmToScene(10.4) / 2
        const outerR = innerR + mmToScene(1.5)
        const depth = 2.2
        addExtruded(group, circleRingShape(outerR, innerR), depth, 0, hwMat, -mmToScene(depth), preview)
    }

    if (input.backMount === 'pin') {
        const padL = mmToScene(16)
        const padW = mmToScene(5.5)
        const floorD = mmToScene(0.8)
        addMesh(group, new THREE.BoxGeometry(padL, padW, floorD), hwMat, preview, 0, 0, -floorD / 2)
        const wallT = mmToScene(1.1)
        const wallH = mmToScene(2.0)
        const wallY = padW / 2 - wallT / 2
        addMesh(group, new THREE.BoxGeometry(padL, wallT, wallH), hwMat, preview, 0, wallY, -wallH / 2)
        addMesh(group, new THREE.BoxGeometry(padL, wallT, wallH), hwMat, preview, 0, -wallY, -wallH / 2)
    }
}

function plateTopZ(baseHeightMm: number, hasBase: boolean): number {
    return hasBase ? mmToScene(baseHeightMm) : 0
}

/** 미리보기·STL 공통 씬 그룹 (아직 EXPORT_SCALE 미적용) */
export function buildMakerSceneGroup(input: MakerSceneInput, mode: 'preview' | 'export'): THREE.Group {
    const group = new THREE.Group()
    const preview = mode === 'preview'
    const hasBase = input.basePlateType !== 'none'
    const size = mmToScene(Math.max(8, input.baseSizeMm))
    const corner = mmToScene(Math.max(0.4, input.cornerRadiusMm))
    const topZ = plateTopZ(input.baseHeight, hasBase)
    const rimInset = size * 0.07
    // 림 안쪽의 85%에 맞춤 — 원형 배지에서 가장자리 잘림·마스크감 완화
    const logoFitBase = hasBase ? Math.max(0.05, size - rimInset * 2) * 0.85 : mmToScene(40)

    if (hasBase) {
        const baseHex = input.baseColor || '#f4f4f5'
        const baseMat = makeMaterial(mode, baseHex, {
            roughness: 0.55,
            metalness: 0.05,
            emissive: preview && hexLuminance(baseHex) > 0.7 ? '#ffffff' : '#000000',
            emissiveIntensity: preview && hexLuminance(baseHex) > 0.7 ? 0.12 : 0,
        })
        let baseShape: THREE.Shape
        if (input.basePlateType === 'circle') {
            baseShape = circleShape(size / 2)
        } else if (input.basePlateType === 'rounded') {
            baseShape = roundedRectShape(size, size, corner)
        } else {
            baseShape = roundedRectShape(size, size, mmToScene(0.4))
        }
        addExtruded(group, baseShape, input.baseHeight, input.bevelMm, baseMat, 0, preview)

        if (input.rimHeightMm >= 0.4) {
            const rimMat = makeMaterial(mode, input.rimColor || '#d4d4d8', {
                roughness: 0.45,
                metalness: 0.12,
                emissive: preview ? '#a1a1aa' : '#000000',
                emissiveIntensity: preview ? 0.08 : 0,
            })
            let rimShape: THREE.Shape
            if (input.basePlateType === 'circle') {
                rimShape = circleRingShape(size / 2, Math.max(0.05, size / 2 - rimInset))
            } else {
                rimShape = roundedFrameShape(size, size, corner, rimInset)
            }
            addExtruded(group, rimShape, input.rimHeightMm, Math.min(input.bevelMm, input.rimHeightMm * 0.4), rimMat, topZ, preview)
        }

        addHardware(group, input, mode, preview)
    }

    input.importedSvgs.forEach((svg) => {
        const scale = clampNum(svg.scale ?? 1, 0.2, 2.5)
        const logoFit = logoFitBase * scale
        const shapes = parseSvgToSceneShapes(svg.svgContent, logoFit)
        if (shapes.length === 0) {
            console.warn('[Maker] SVG에서 돌출할 path를 찾지 못했습니다. 배경만 있거나 변환에 실패했을 수 있습니다.')
            return
        }
        const logoMat = logoPreviewMaterial(mode, input.logoColor || '#0f172a')
        const logoZ = topZ + (preview ? 0.002 : 0)
        const logoGroup = new THREE.Group()
        logoGroup.position.set(
            mmToSceneSigned(svg.offsetXMm ?? 0),
            mmToSceneSigned(svg.offsetYMm ?? 0),
            logoZ
        )
        logoGroup.rotation.z = THREE.MathUtils.degToRad(svg.rotationDeg ?? 0)
        shapes.forEach((shape) => {
            addExtruded(logoGroup, shape, input.extrusionHeight, input.bevelMm, logoMat, 0, preview)
        })
        group.add(logoGroup)
    })

    const ox = input.canvasSize.width / 2
    const oy = input.canvasSize.height / 2
    input.paths.forEach((path) => {
        if (path.points.length < 2) return
        const points = path.points.map(
            (p) =>
                new THREE.Vector3(
                    (p.x - ox) * SCENE_SCALE,
                    -(p.y - oy) * SCENE_SCALE,
                    0
                )
        )
        const curve = new THREE.CatmullRomCurve3(points)
        const radius = Math.max(mmToScene(0.35), path.width * SCENE_SCALE * 0.2)
        const tubeGeom = new THREE.TubeGeometry(curve, 48, radius, preview ? 6 : 8, false)
        const color =
            path.color === '#000000' || path.color === '#0f172a' ? '#ffffff' : path.color || '#ffffff'
        const tubeMat = makeMaterial(mode, color, {
            roughness: 0.15,
            metalness: 0.7,
            emissive: color,
            emissiveIntensity: preview ? 0.2 : 0,
        })
        const mesh = new THREE.Mesh(tubeGeom, tubeMat)
        mesh.position.z = topZ
        if (preview) {
            mesh.castShadow = true
            mesh.receiveShadow = true
        }
        group.add(mesh)
    })

    return group
}
