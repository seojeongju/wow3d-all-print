/**
 * AI 3D Maker → STL 바이너리 생성
 * Preview3D / Exporter와 동일한 스케일·메시 규칙
 */
import * as THREE from 'three'
// @ts-ignore
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter'
// @ts-ignore
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'

const SCENE_SCALE = 0.02
const EXPORT_SCALE = 5

export type MakerExportPath = {
    points: { x: number; y: number }[]
    width: number
}

export type MakerExportSvg = {
    svgContent: string
}

export type MakerExportInput = {
    paths: MakerExportPath[]
    importedSvgs: MakerExportSvg[]
    extrusionHeight: number
    basePlateType: 'none' | 'rect' | 'circle' | 'outline'
    baseHeight: number
    canvasSize: { width: number; height: number }
}

function holePathToShape(hole: THREE.Path): THREE.Shape {
    const getPts = (p: THREE.Path) =>
        typeof (p as { getPoints?: (n: number) => THREE.Vector2[] }).getPoints === 'function'
            ? (p as { getPoints: (n: number) => THREE.Vector2[] }).getPoints(12)
            : (p as { getSpacedPoints?: (n: number) => THREE.Vector2[] }).getSpacedPoints?.(12) ?? []
    const points = getPts(hole)
    const shape = new THREE.Shape()
    if (points.length === 0) return shape
    shape.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].y)
    return shape
}

function flattenSvgShapes(data: { paths?: unknown[] }): THREE.Shape[] {
    const allShapes: THREE.Shape[] = []
    ;(data.paths || []).forEach((path: unknown) => {
        try {
            const created = SVGLoader.createShapes(path) as THREE.Shape[]
            if (!created?.length) return
            created.forEach((shape) => {
                const holes = (shape as { holes?: THREE.Path[] }).holes
                if (holes?.length) {
                    holes.forEach((hole) => allShapes.push(holePathToShape(hole)))
                } else {
                    allShapes.push(shape)
                }
            })
        } catch {
            /* skip */
        }
    })
    return allShapes
}

export function hasMakerExportContent(input: MakerExportInput): boolean {
    const hasPaths = input.paths.some((p) => p.points.length >= 2)
    const hasSvgs = input.importedSvgs.length > 0
    const hasBase = input.basePlateType === 'rect'
    return hasPaths || hasSvgs || hasBase
}

/** Maker 현재 상태를 STL Blob으로 생성. 내용 없으면 null */
export function buildMakerStlBlob(input: MakerExportInput): Blob | null {
    if (!hasMakerExportContent(input)) return null

    const { paths, importedSvgs, extrusionHeight, basePlateType, baseHeight, canvasSize } = input
    const hasBase = basePlateType === 'rect'
    const exportGroup = new THREE.Group()

    paths.forEach((path) => {
        if (path.points.length < 2) return
        const points = path.points.map(
            (p) => new THREE.Vector3(p.x * SCENE_SCALE, -p.y * SCENE_SCALE, 0)
        )
        const curve = new THREE.CatmullRomCurve3(points)
        const radius = Math.max(0.03, path.width * SCENE_SCALE * 0.2)
        const tubeGeom = new THREE.TubeGeometry(curve, 64, radius, 8, false)
        exportGroup.add(new THREE.Mesh(tubeGeom, new THREE.MeshBasicMaterial()))
    })

    if (hasBase) {
        const w = canvasSize.width * SCENE_SCALE
        const h = canvasSize.height * SCENE_SCALE
        const boxGeom = new THREE.BoxGeometry(w + 2, h + 2, baseHeight)
        const boxMesh = new THREE.Mesh(boxGeom, new THREE.MeshBasicMaterial())
        boxMesh.position.set(w / 2, -h / 2, -baseHeight / 2)
        exportGroup.add(boxMesh)
    }

    if (importedSvgs.length > 0) {
        const loader = new SVGLoader()
        const depth = Math.max(0.5, extrusionHeight * 0.15)
        const targetSize = 12
        importedSvgs.forEach((svg) => {
            try {
                const data = loader.parse(svg.svgContent)
                const allShapes = flattenSvgShapes(data)
                if (allShapes.length === 0) return
                let minX = Infinity,
                    minY = Infinity,
                    maxX = -Infinity,
                    maxY = -Infinity
                const getPoints = (s: THREE.Shape) =>
                    typeof (s as { getPoints?: (n: number) => THREE.Vector2[] }).getPoints === 'function'
                        ? (s as { getPoints: (n: number) => THREE.Vector2[] }).getPoints(12)
                        : []
                allShapes.forEach((shape) => {
                    getPoints(shape).forEach((p) => {
                        minX = Math.min(minX, p.x)
                        minY = Math.min(minY, p.y)
                        maxX = Math.max(maxX, p.x)
                        maxY = Math.max(maxY, p.y)
                    })
                })
                const w = Math.max(1, maxX - minX)
                const h = Math.max(1, maxY - minY)
                const scale = Math.min(targetSize / w, targetSize / h, 0.05)
                const centerX = (minX + maxX) / 2
                const centerY = (minY + maxY) / 2
                const svgGroup = new THREE.Group()
                svgGroup.position.set(0, 0, hasBase ? baseHeight : 0)
                svgGroup.scale.set(scale, -scale, 1)
                allShapes.forEach((shape) => {
                    const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
                    const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial())
                    mesh.position.set(-centerX, -centerY, 0)
                    svgGroup.add(mesh)
                })
                exportGroup.add(svgGroup)
            } catch {
                /* skip */
            }
        })
    }

    if (exportGroup.children.length === 0) {
        return null
    }

    exportGroup.scale.setScalar(EXPORT_SCALE)
    exportGroup.updateMatrixWorld(true)

    const exporter = new STLExporter()
    const result = exporter.parse(exportGroup, { binary: true })

    exportGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.geometry) obj.geometry.dispose()
    })

    return new Blob([result], { type: 'application/octet-stream' })
}

export function downloadMakerStl(blob: Blob, fileName?: string): void {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName || `wow3d-maker-${Date.now()}.stl`
    link.click()
    URL.revokeObjectURL(link.href)
}
