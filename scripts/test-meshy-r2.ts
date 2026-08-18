/**
 * Meshy R2 견적 연결 — 대용량은 복사하지 않고 키만 연결
 * 실행: npx --yes tsx scripts/test-meshy-r2.ts
 */
import assert from 'node:assert/strict'
import {
    MESHY_QUOTE_COPY_MAX_BYTES,
    parseMeshyJobIdFromFileName,
    shouldInlineCopyMeshyObject,
} from '../lib/meshy-r2'

assert.equal(parseMeshyJobIdFromFileName('meshy-19.stl'), 19)
assert.equal(parseMeshyJobIdFromFileName('mesh-10.stl'), 10)
assert.equal(parseMeshyJobIdFromFileName('model.stl'), null)

assert.equal(shouldInlineCopyMeshyObject(0), false)
assert.equal(shouldInlineCopyMeshyObject(null), false)
assert.equal(shouldInlineCopyMeshyObject(1024), true)
assert.equal(shouldInlineCopyMeshyObject(MESHY_QUOTE_COPY_MAX_BYTES), true)
assert.equal(shouldInlineCopyMeshyObject(MESHY_QUOTE_COPY_MAX_BYTES + 1), false)
assert.equal(shouldInlineCopyMeshyObject(40 * 1024 * 1024), false)

console.log('test-meshy-r2: ok')
