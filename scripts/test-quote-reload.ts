import assert from 'node:assert/strict'
import {
    buildFileSourceFromFileName,
    parseStoredModelTransform,
    resolveQuoteReloadTransform,
} from '../lib/quote-reload'

const t = parseStoredModelTransform(
    JSON.stringify({ scalePercent: 14, rotX: 90, rotY: 0, rotZ: 180, snapToBed: true })
)
assert.equal(t?.scalePercent, 14)
assert.equal(t?.rotX, 90)
assert.equal(t?.rotZ, 180)

assert.equal(buildFileSourceFromFileName('meshy-42.stl').kind, 'meshy-photo')
assert.equal(buildFileSourceFromFileName('meshy-42.stl').meshyJobId, 42)
assert.equal(buildFileSourceFromFileName('model.stl').kind, 'upload')

assert.equal(resolveQuoteReloadTransform(null).scalePercent, 100)

console.log('test-quote-reload: ok')
