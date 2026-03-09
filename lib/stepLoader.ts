/**
 * STEP/STP 파일을 occt-import-js (Open CASCADE WASM)로 파싱해
 * Three.js BufferGeometry로 변환. analyzeGeometry·Scene·썸네일에 사용.
 */
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'

/** meshes[i] from ReadStepFile: attributes.position, .normal?, index */
interface OcctMesh {
  attributes: { position: { array: Float32Array | number[] }; normal?: { array: Float32Array | number[] } }
  index?: { array: Uint32Array | number[] }
}

/** STEP/STP ArrayBuffer → 단일 BufferGeometry (여러 mesh 병합). 실패 시 null. */
export async function loadStepAsBufferGeometry(buffer: ArrayBuffer): Promise<THREE.BufferGeometry | null> {
  if (typeof window === 'undefined') return null
  try {
    const mod = await import('occt-import-js')
    const init = (mod as { default?: (arg?: object) => Promise<{ ReadStepFile: (u: Uint8Array, p: unknown) => { meshes?: OcctMesh[] } }> }).default ?? mod
    const occt = typeof init === 'function'
      ? await init({ locateFile: () => '/occt-import-js.wasm' })
      : init
    const readStep = (occt as { ReadStepFile: (u: Uint8Array, p: unknown) => { meshes?: OcctMesh[] } }).ReadStepFile
    const result = readStep(new Uint8Array(buffer), null)
    if (!result?.meshes?.length) return null

    const geos: THREE.BufferGeometry[] = []
    for (const m of result.meshes) {
      if (!m?.attributes?.position?.array) continue
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(m.attributes.position.array as Float32Array, 3))
      if (m.attributes.normal?.array) {
        g.setAttribute('normal', new THREE.Float32BufferAttribute(m.attributes.normal.array as Float32Array, 3))
      }
      if (m.index?.array) {
        g.setIndex(new THREE.BufferAttribute(Uint32Array.from(m.index.array as ArrayLike<number>), 1))
      }
      geos.push(g)
    }
    if (geos.length === 0) return null
    const merged = geos.length === 1 ? geos[0] : mergeBufferGeometries(geos) ?? geos[0]
    geos.forEach((x) => { if (x !== merged) x.dispose() })
    return merged
  } catch (e) {
    console.warn('loadStepAsBufferGeometry failed:', e)
    return null
  }
}
