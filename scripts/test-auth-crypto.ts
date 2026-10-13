/**
 * 비밀번호 해시·로그인 토큰 서명 검증
 * 실행: npx tsx scripts/test-auth-crypto.ts
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
    generateToken,
    hashPassword,
    passwordNeedsRehash,
    verifyPassword,
    verifyToken,
} from '../lib/api-utils'

function b64url(text: string): string {
    return Buffer.from(text).toString('base64url')
}

async function main() {
    // PBKDF2: 같은 비밀번호도 솔트가 달라 해시가 다름
    const h1 = await hashPassword('correct horse')
    const h2 = await hashPassword('correct horse')
    assert.ok(h1.startsWith('pbkdf2$100000$'))
    assert.notEqual(h1, h2)
    assert.equal(await verifyPassword('correct horse', h1), true)
    assert.equal(await verifyPassword('wrong', h1), false)
    assert.equal(passwordNeedsRehash(h1), false)

    // 구 형식(솔트 없는 SHA-256 hex)도 로그인 가능 + 재저장 대상
    const legacy = createHash('sha256').update('old-pass').digest('hex')
    assert.equal(await verifyPassword('old-pass', legacy), true)
    assert.equal(await verifyPassword('other', legacy), false)
    assert.equal(passwordNeedsRehash(legacy), true)
    assert.equal(await verifyPassword('x', ''), false)

    // 정상 발급 토큰은 검증 통과
    const token = await generateToken(42, 'user@example.com')
    assert.deepEqual(await verifyToken(token), { userId: 42, email: 'user@example.com' })

    // payload를 바꾸면(예: 관리자 ID로) 서명 불일치
    const [header, , signature] = token.split('.')
    const forgedPayload = b64url(JSON.stringify({ userId: 1, email: 'admin@example.com', exp: Date.now() + 60_000 }))
    assert.deepEqual(await verifyToken(`${header}.${forgedPayload}.${signature}`), { error: 'signature_mismatch' })

    // 예전 방식(비밀키 없는 SHA-256)으로 위조한 토큰은 거부
    const legacySig = createHash('sha256').update(`${header}.${forgedPayload}`).digest('hex')
    assert.deepEqual(await verifyToken(`${header}.${forgedPayload}.${legacySig}`), { error: 'signature_mismatch' })

    console.log('test-auth-crypto: 모든 검증 통과')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
