/**
 * manifold-3d 브라우저 파일을 public/vendor/manifold로 복사한다.
 * 번들러를 거치지 않고 Worker에서 그대로 import하기 위함이다 (predev·prebuild에서 실행).
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'manifold-3d')
const dest = join(root, 'public', 'vendor', 'manifold')

mkdirSync(dest, { recursive: true })
copyFileSync(join(src, 'manifold.js'), join(dest, 'manifold.mjs'))
copyFileSync(join(src, 'manifold.wasm'), join(dest, 'manifold.wasm'))
console.log('[copy-manifold-wasm] public/vendor/manifold 갱신')
