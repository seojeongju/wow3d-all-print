/**
 * 클라이언트 번역 네임스페이스 자동 산출 (prebuild·predev에서 실행)
 *
 * app/[locale] 아래 상위 경로(세그먼트)마다 import 그래프를 따라가며
 * useTranslations('네임스페이스') 사용처를 모아 i18n/client-namespaces.generated.ts 를 만든다.
 * 각 세그먼트 layout은 ScopedIntlProvider로 해당 네임스페이스만 클라이언트에 넘긴다.
 *
 * - root: app/[locale]/layout.tsx 의 공통 위젯
 * - home: app/[locale]/page.tsx
 * - 그 외: app/[locale]/<세그먼트>/ 하위 모든 파일
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const LOCALE_DIR = path.join(ROOT, 'app', '[locale]')
const OUT_FILE = path.join(ROOT, 'i18n', 'client-namespaces.generated.ts')
const MESSAGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'ko.json'), 'utf8'))
const CODE_EXT = ['.tsx', '.ts', '.jsx', '.js', '.mjs']

function resolveImport(fromFile, spec) {
    let base
    if (spec.startsWith('@/')) base = path.join(ROOT, spec.slice(2))
    else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec)
    else return null
    const candidates = [base, ...CODE_EXT.map((e) => base + e), ...CODE_EXT.map((e) => path.join(base, 'index' + e))]
    for (const c of candidates) {
        if (fs.existsSync(c) && fs.statSync(c).isFile() && CODE_EXT.includes(path.extname(c))) return c
    }
    return null
}

const IMPORT_PATTERNS = [
    /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s+['"]([^'"]+)['"]/g,
]
const NS_PATTERN = /useTranslations\(\s*([^)]*)\)/g

const fileCache = new Map()
function scanFile(file) {
    if (fileCache.has(file)) return fileCache.get(file)
    const src = fs.readFileSync(file, 'utf8')
    const imports = new Set()
    for (const re of IMPORT_PATTERNS) {
        for (const m of src.matchAll(re)) {
            const r = resolveImport(file, m[1])
            if (r) imports.add(r)
        }
    }
    const namespaces = new Set()
    for (const m of src.matchAll(NS_PATTERN)) {
        const arg = m[1].trim()
        const lit = arg.match(/^['"`]([^'"`$]+)['"`]$/)
        if (!lit) {
            throw new Error(
                `[i18n] 리터럴이 아닌 useTranslations 사용: ${path.relative(ROOT, file)} → useTranslations(${arg}). ` +
                    '네임스페이스를 문자열 리터럴로 지정해야 자동 분석이 가능합니다.'
            )
        }
        namespaces.add(lit[1].split('.')[0])
    }
    const info = { imports, namespaces }
    fileCache.set(file, info)
    return info
}

function collectNamespaces(entries) {
    const seen = new Set()
    const out = new Set()
    const stack = [...entries]
    while (stack.length) {
        const f = stack.pop()
        if (seen.has(f)) continue
        seen.add(f)
        const { imports, namespaces } = scanFile(f)
        for (const ns of namespaces) out.add(ns)
        for (const i of imports) stack.push(i)
    }
    return out
}

function listCodeFiles(dir) {
    const out = []
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name)
        if (e.isDirectory()) out.push(...listCodeFiles(p))
        else if (CODE_EXT.includes(path.extname(e.name))) out.push(p)
    }
    return out
}

const scopes = {}
scopes.root = collectNamespaces([path.join(LOCALE_DIR, 'layout.tsx')])
scopes.home = collectNamespaces([path.join(LOCALE_DIR, 'page.tsx')])

const segments = fs
    .readdirSync(LOCALE_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

const problems = []
for (const seg of segments) {
    const dir = path.join(LOCALE_DIR, seg)
    scopes[seg] = collectNamespaces(listCodeFiles(dir))
    const layout = path.join(dir, 'layout.tsx')
    const layoutSrc = fs.existsSync(layout) ? fs.readFileSync(layout, 'utf8') : ''
    if (!layoutSrc.includes(`scope="${seg}"`)) {
        problems.push(`app/[locale]/${seg}/layout.tsx 에 <ScopedIntlProvider scope="${seg}"> 가 없습니다.`)
    }
}
const homeSrc = fs.readFileSync(path.join(LOCALE_DIR, 'page.tsx'), 'utf8')
if (!homeSrc.includes('scope="home"')) problems.push('app/[locale]/page.tsx 에 <ScopedIntlProvider scope="home"> 가 없습니다.')

const missing = []
for (const [scope, set] of Object.entries(scopes)) {
    for (const ns of set) if (!(ns in MESSAGES)) missing.push(`${scope}: ${ns}`)
}
if (missing.length) problems.push(`messages/ko.json 에 없는 네임스페이스: ${missing.join(', ')}`)

if (problems.length) {
    console.error('[i18n] 클라이언트 네임스페이스 생성 실패\n - ' + problems.join('\n - '))
    process.exit(1)
}

const body = Object.entries(scopes)
    .map(([scope, set]) => `    ${JSON.stringify(scope)}: ${JSON.stringify([...set].sort())},`)
    .join('\n')
const content = `// 자동 생성 파일 — 직접 수정하지 말 것 (scripts/gen-client-i18n-namespaces.mjs)
export const CLIENT_NAMESPACES = {
${body}
} as const

export type ClientNamespaceScope = keyof typeof CLIENT_NAMESPACES
`
const prev = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : ''
if (prev !== content) fs.writeFileSync(OUT_FILE, content)

const size = (set) => [...set].reduce((s, ns) => s + JSON.stringify(MESSAGES[ns] ?? '').length, 0)
const total = JSON.stringify(MESSAGES).length
console.log(`[i18n] 클라이언트 네임스페이스 생성 완료 (${Object.keys(scopes).length}개 범위, 전체 ${Math.round(total / 1024)}K자)`)
if (process.argv.includes('--verbose')) {
    for (const [scope, set] of Object.entries(scopes)) {
        console.log(`  ${scope.padEnd(16)} ${String(Math.round(size(set) / 1024)).padStart(4)}K자  ${[...set].sort().join(', ')}`)
    }
}
