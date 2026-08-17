/**
 * AI 3D Maker → STL 바이너리 생성
 * Preview3D와 동일한 buildMakerSceneGroup 사용
 */
import * as THREE from 'three'
// @ts-ignore
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter'
import {
    buildMakerSceneGroup,
    disposeObject3D,
    EXPORT_SCALE,
    hasMakerSceneContent,
    type MakerSceneInput,
} from '@/lib/maker-geometry'

export type MakerExportInput = MakerSceneInput

export function hasMakerExportContent(input: MakerExportInput): boolean {
    return hasMakerSceneContent(input)
}

/** Maker 현재 상태를 STL Blob으로 생성. 내용 없으면 null */
export function buildMakerStlBlob(input: MakerExportInput): Blob | null {
    if (!hasMakerExportContent(input)) return null

    const exportGroup = buildMakerSceneGroup(input, 'export')
    if (exportGroup.children.length === 0) {
        disposeObject3D(exportGroup)
        return null
    }

    exportGroup.scale.setScalar(EXPORT_SCALE)
    exportGroup.updateMatrixWorld(true)

    const exporter = new STLExporter()
    const result = exporter.parse(exportGroup, { binary: true })
    disposeObject3D(exportGroup)

    return new Blob([result], { type: 'application/octet-stream' })
}

export function downloadMakerStl(blob: Blob, fileName?: string): void {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName || `wow3d-maker-${Date.now()}.stl`
    link.click()
    URL.revokeObjectURL(link.href)
}
