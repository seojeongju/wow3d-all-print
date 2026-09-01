import { extractTripoThumbnailUrl } from '../lib/tripo'

function assert(cond: unknown, msg: string): asserts cond {
    if (!cond) throw new Error(msg)
}

assert(
    extractTripoThumbnailUrl({ rendered_image_url: 'https://cdn.example/preview.png' }) ===
        'https://cdn.example/preview.png',
    'rendered_image_url'
)
assert(
    extractTripoThumbnailUrl({ rendered_image: 'https://cdn.example/old.png' }) ===
        'https://cdn.example/old.png',
    'rendered_image'
)
assert(extractTripoThumbnailUrl({ model_url: 'https://cdn.example/model.glb' }) === null, 'no thumb in model only')

console.log('test-tripo-thumbnail: ok')
