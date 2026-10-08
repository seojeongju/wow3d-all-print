/**
 * 3D 모델 해석 Web Worker — 대용량 파일 파싱·정밀 분석이 메인 스레드(화면)를 멈추지 않게 분리
 * 결과는 position·normal·index 배열을 전송(복사 없이 transfer)한 뒤 정밀 분석 결과를 이어서 보냄
 */
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { parseThreeMF } from '@/lib/threemf-fast-parser'
import { analyzeMeshGeometry, MODEL_PARTS_USERDATA_KEY } from '@/lib/geometry'
import type { ModelParseRequest, ModelParseResponse, ModelParseStage, ParsedGeometryPayload } from '@/lib/model-parse-protocol'

const ctx = self as unknown as {
    postMessage: (msg: ModelParseResponse, transfer: Transferable[]) => void
    onmessage: ((event: MessageEvent<ModelParseRequest>) => void) | null
}

type OcctMesh = {
    attributes: { position: { array: ArrayLike<number> }; normal?: { array: ArrayLike<number> } }
    index?: { array: ArrayLike<number> }
}

class StepUnavailableError extends Error {}

function post(msg: ModelParseResponse, transfer: Transferable[] = []) {
    ctx.postMessage(msg, transfer)
}

function stage(id: number, s: ModelParseStage) {
    post({ id, type: 'stage', stage: s })
}

async function parseStep(buffer: ArrayBuffer): Promise<THREE.BufferGeometry | null> {
    let readStep: (u: Uint8Array, p: unknown) => { meshes?: OcctMesh[] }
    try {
        const mod = await import('occt-import-js')
        const init = (mod as { default?: unknown }).default ?? mod
        const occt = typeof init === 'function'
            ? await (init as (arg?: object) => Promise<unknown>)({ locateFile: () => '/occt-import-js.wasm' })
            : init
        readStep = (occt as { ReadStepFile: typeof readStep }).ReadStepFile
        if (typeof readStep !== 'function') throw new Error('ReadStepFile 없음')
    } catch (e) {
        throw new StepUnavailableError(e instanceof Error ? e.message : String(e))
    }
    const result = readStep(new Uint8Array(buffer), null)
    if (!result?.meshes?.length) return null
    const geos: THREE.BufferGeometry[] = []
    for (const m of result.meshes) {
        if (!m?.attributes?.position?.array) continue
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.Float32BufferAttribute(Float32Array.from(m.attributes.position.array), 3))
        if (m.index?.array) g.setIndex(new THREE.BufferAttribute(Uint32Array.from(m.index.array), 1))
        geos.push(g)
    }
    if (geos.length === 0) return null
    return geos.length === 1 ? geos[0] : mergeGeometries(geos) ?? geos[0]
}

async function parse(fileName: string, buffer: ArrayBuffer): Promise<{ geo: THREE.BufferGeometry; parts: ParsedGeometryPayload['parts'] } | null> {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'stl') return { geo: new STLLoader().parse(buffer), parts: null }
    if (ext === 'ply') return { geo: new PLYLoader().parse(buffer), parts: null }
    if (ext === 'obj') {
        const object = new OBJLoader().parse(new TextDecoder().decode(buffer))
        const geometries: THREE.BufferGeometry[] = []
        object.traverse((child) => {
            const mesh = child as THREE.Mesh
            if (mesh.isMesh && mesh.geometry) geometries.push(mesh.geometry)
        })
        if (geometries.length === 0) return null
        const geo = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries) ?? geometries[0]
        return { geo, parts: null }
    }
    if (ext === '3mf') {
        const parsed = parseThreeMF(buffer)
        if (!parsed) return null
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(parsed.position, 3))
        geo.setIndex(new THREE.BufferAttribute(parsed.index, 1))
        return { geo, parts: parsed.parts }
    }
    if (ext === 'step' || ext === 'stp') {
        const geo = await parseStep(buffer)
        return geo ? { geo, parts: null } : null
    }
    return null
}

function isOutOfMemory(e: unknown): boolean {
    if (!(e instanceof RangeError)) return false
    return /allocation failed|invalid (typed )?array length|out of memory|maximum call stack/i.test(e.message)
}

ctx.onmessage = async (event: MessageEvent<ModelParseRequest>) => {
    const { id, file } = event.data
    try {
        stage(id, 'reading')
        const buffer = await file.arrayBuffer()
        stage(id, 'parsing')
        const result = await parse(file.name, buffer)
        if (!result) {
            post({ id, type: 'done', payload: null })
            return
        }
        stage(id, 'preparing')
        const { geo, parts } = result
        geo.center()
        geo.computeVertexNormals()
        const position = geo.getAttribute('position').array as Float32Array
        const normal = geo.getAttribute('normal').array as Float32Array
        const indexAttr = geo.getIndex()
        const index = indexAttr
            ? indexAttr.array instanceof Uint32Array
                ? indexAttr.array
                : Uint32Array.from(indexAttr.array as ArrayLike<number>)
            : null
        // 원본 배열은 메인 스레드로 넘기므로(transfer) 정밀 분석용 사본을 남겨 둠
        const measureGeo = new THREE.BufferGeometry()
        measureGeo.setAttribute('position', new THREE.BufferAttribute(position.slice(), 3))
        if (index) measureGeo.setIndex(new THREE.BufferAttribute(index.slice(), 1))
        if (parts) measureGeo.userData[MODEL_PARTS_USERDATA_KEY] = parts

        const payload: ParsedGeometryPayload = { position, normal, index, parts }
        const transfer: Transferable[] = [position.buffer, normal.buffer]
        if (index) transfer.push(index.buffer)
        post({ id, type: 'done', payload }, transfer)
        geo.dispose()

        try {
            post({ id, type: 'analysis', analysis: analyzeMeshGeometry(measureGeo) })
        } catch (e) {
            post({
                id,
                type: 'analysis_error',
                code: isOutOfMemory(e) ? 'out_of_memory' : 'error',
                message: e instanceof Error ? e.message : String(e),
            })
        }
    } catch (e) {
        if (e instanceof StepUnavailableError) {
            post({ id, type: 'error', code: 'step_unavailable', message: e.message })
            return
        }
        post({
            id,
            type: 'error',
            code: isOutOfMemory(e) ? 'out_of_memory' : 'error',
            message: e instanceof Error ? e.message : String(e),
        })
    }
}

post({ id: 0, type: 'ready' })
