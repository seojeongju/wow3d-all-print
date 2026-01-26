/**
 * STL/OBJ 3D 모델을 오프스크린 캔버스에 렌더링하여 썸네일 Data URL 생성.
 * - generateModelThumbnail(file): File (로컬 업로드) → Data URL
 * - generateModelThumbnailFromUrl(url, opts): file_url(R2 등) → Data URL
 * 브라우저 환경에서만 동작 (document, THREE.WebGLRenderer 사용).
 */
import * as THREE from 'three'
import { STLLoader, OBJLoader, ThreeMFLoader, PLYLoader, mergeBufferGeometries } from 'three-stdlib'
import { loadStepAsBufferGeometry } from '@/lib/stepLoader'

const DEFAULT_SIZE = 256

export type ModelFileType = 'stl' | 'obj' | '3mf' | 'ply' | 'step'

function inferFileType(fileName?: string, url?: string): ModelFileType | null {
  const fromName = (fileName || '').toLowerCase()
  if (fromName.endsWith('.stl')) return 'stl'
  if (fromName.endsWith('.obj')) return 'obj'
  if (fromName.endsWith('.3mf')) return '3mf'
  if (fromName.endsWith('.ply')) return 'ply'
  if (fromName.endsWith('.step') || fromName.endsWith('.stp')) return 'step'
  const path = (url || '').split('?')[0].toLowerCase()
  if (path.endsWith('.stl')) return 'stl'
  if (path.endsWith('.obj')) return 'obj'
  if (path.endsWith('.3mf')) return '3mf'
  if (path.endsWith('.ply')) return 'ply'
  if (path.endsWith('.step') || path.endsWith('.stp')) return 'step'
  return null
}

function collectGeometriesFromGroup(group: THREE.Group): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = []
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const g = (child as THREE.Mesh).geometry
      if (g && g.attributes?.position) out.push(g as THREE.BufferGeometry)
    }
  })
  return out
}

function loadGeometryFromBuffer(
  buffer: ArrayBuffer,
  fileType: ModelFileType
): THREE.BufferGeometry | null {
  try {
    if (fileType === 'stl') {
      const loader = new STLLoader()
      const geo = loader.parse(buffer)
      geo.center()
      geo.computeVertexNormals()
      return geo
    }
    if (fileType === 'obj') {
      const loader = new OBJLoader()
      const text = new TextDecoder().decode(buffer)
      const object = loader.parse(text)
      let geo: THREE.BufferGeometry | null = null
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && !geo) {
          geo = (child as THREE.Mesh).geometry
        }
      })
      if (geo) {
        const g = (geo as THREE.BufferGeometry).clone()
        g.center()
        g.computeVertexNormals()
        return g
      }
    }
    if (fileType === '3mf') {
      const loader = new ThreeMFLoader()
      const group = loader.parse(buffer)
      const arr = collectGeometriesFromGroup(group)
      let g: THREE.BufferGeometry | null = null
      if (arr.length === 1) g = arr[0]
      else if (arr.length > 1) g = mergeBufferGeometries(arr) ?? arr[0]
      if (g) {
        g.center()
        g.computeVertexNormals()
        return g
      }
    }
    if (fileType === 'ply') {
      const loader = new PLYLoader()
      const g = loader.parse(buffer)
      g.center()
      g.computeVertexNormals()
      return g
    }
  } catch {
    /* ignore */
  }
  return null
}

async function loadGeometryFromBufferAsync(
  buffer: ArrayBuffer,
  fileType: ModelFileType
): Promise<THREE.BufferGeometry | null> {
  if (fileType === 'step') {
    const g = await loadStepAsBufferGeometry(buffer)
    if (g) {
      g.center()
      g.computeVertexNormals()
      return g
    }
    return null
  }
  const g = loadGeometryFromBuffer(buffer, fileType)
  return g ? Promise.resolve(g) : null
}

function renderGeometryToDataUrl(geometry: THREE.BufferGeometry, size: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  })
  renderer.setSize(size, size)
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
  const material = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    roughness: 0.3,
    metalness: 0.7,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const box = new THREE.Box3().setFromObject(mesh)
  const s = new THREE.Vector3()
  box.getSize(s)
  const maxDim = Math.max(s.x, s.y, s.z, 1)
  camera.position.set(maxDim, maxDim, maxDim)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  renderer.render(scene, camera)
  const dataUrl = canvas.toDataURL('image/png')

  geometry.dispose()
  material.dispose()
  renderer.dispose()
  return dataUrl
}

/**
 * File(로컬 업로드)에서 썸네일 생성. STL, OBJ, 3MF, PLY 지원.
 */
export async function generateModelThumbnail(
  file: File,
  size: number = DEFAULT_SIZE
): Promise<string | null> {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null
  const fileType = inferFileType(file.name, undefined)
  if (!fileType) return null

  try {
    const buf = await file.arrayBuffer()
    const geometry = await loadGeometryFromBufferAsync(buf, fileType)
    if (!geometry) return null
    return renderGeometryToDataUrl(geometry, size)
  } catch {
    return null
  }
}

export type GenerateFromUrlOptions = {
  size?: number
  fileType?: ModelFileType
  fileName?: string
}

/**
 * file_url(R2 등)에서 fetch 후 썸네일 생성. STL, OBJ, 3MF, PLY 지원.
 * fileType 또는 fileName/url에서 확장자로 형식 추론.
 */
export async function generateModelThumbnailFromUrl(
  url: string,
  options: GenerateFromUrlOptions = {}
): Promise<string | null> {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null
  const { size = DEFAULT_SIZE, fileType: explicitType, fileName } = options
  const fileType = explicitType ?? inferFileType(fileName, url)
  if (!fileType) return null

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const geometry = await loadGeometryFromBufferAsync(buffer, fileType)
    if (!geometry) return null
    return renderGeometryToDataUrl(geometry, size)
  } catch {
    return null
  }
}
