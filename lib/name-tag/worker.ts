/// <reference lib="webworker" />
/**
 * 이름표 형상 계산 Worker. 입력 중에도 화면이 멈추지 않도록 manifold 연산을 여기서 한다.
 */
import Module, { type ManifoldToplevel } from 'manifold-3d'
import { parse, type Font } from 'opentype.js'
import { getNameTagFont, type NameTagFontId } from '@/lib/name-tag-fonts'
import { normalizeNameTagDesign } from '@/lib/name-tag/design'
import { buildNameTag, meshToStl, type NameTagBuildResult } from '@/lib/name-tag/build'

export type NameTagWorkerRequest =
    | { id: number; type: 'build'; design: unknown }
    | { id: number; type: 'stl'; design: unknown }

export type NameTagWorkerResponse =
    | { id: number; type: 'build'; result: NameTagBuildResult | null; ms: number }
    | { id: number; type: 'stl'; stl: ArrayBuffer | null }
    | { id: number; type: 'error'; message: string }

const ctx = self as unknown as DedicatedWorkerGlobalScope

let wasmPromise: Promise<ManifoldToplevel> | null = null
function loadWasm(): Promise<ManifoldToplevel> {
    wasmPromise ??= Module({ locateFile: () => '/vendor/manifold/manifold.wasm' }).then((wasm) => {
        wasm.setup()
        return wasm
    })
    return wasmPromise
}

const fontCache = new Map<NameTagFontId, Promise<Font>>()
function loadFont(fontId: NameTagFontId): Promise<Font> {
    const cached = fontCache.get(fontId)
    if (cached) return cached
    const pending = fetch(getNameTagFont(fontId).file)
        .then(async (res) => {
            if (!res.ok) throw new Error(`font ${fontId} ${res.status}`)
            return parse(await res.arrayBuffer())
        })
        .catch((error: unknown) => {
            fontCache.delete(fontId)
            throw error
        })
    fontCache.set(fontId, pending)
    return pending
}

ctx.onmessage = async (event: MessageEvent<NameTagWorkerRequest>) => {
    const { id, type } = event.data
    try {
        const design = normalizeNameTagDesign(event.data.design)
        const fontIds = [...new Set(design.lines.filter((l) => l.text.trim()).map((l) => l.fontId))]
        const [wasm, fontList] = await Promise.all([loadWasm(), Promise.all(fontIds.map(loadFont))])
        const fonts = new Map(fontIds.map((fontId, i) => [fontId, fontList[i]]))
        const started = performance.now()
        const result = buildNameTag(wasm, design, fonts)
        if (type === 'stl') {
            const stl = result ? meshToStl(result.solid) : null
            const response: NameTagWorkerResponse = { id, type: 'stl', stl }
            ctx.postMessage(response, stl ? [stl] : [])
            return
        }
        const response: NameTagWorkerResponse = { id, type: 'build', result, ms: performance.now() - started }
        const transfer: Transferable[] = []
        if (result) {
            for (const mesh of [result.base, result.raised, result.engraveFill, result.thin, result.solid]) {
                if (mesh) transfer.push(mesh.positions.buffer, mesh.indices.buffer)
            }
        }
        ctx.postMessage(response, transfer)
    } catch (error) {
        const response: NameTagWorkerResponse = {
            id,
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
        }
        ctx.postMessage(response)
    }
}
