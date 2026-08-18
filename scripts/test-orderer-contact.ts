/**
 * 주문자 연락처 파싱
 * 실행: npx --yes tsx scripts/test-orderer-contact.ts
 */
import assert from 'node:assert/strict'
import {
    formatOrdererNoteLine,
    parseOrdererInfoFromNote,
    resolveOrdererPhone,
    stripOrdererInfoFromNote,
} from '../lib/orderer-contact'

const note = '[주문자 정보] 이름: 최고관리자 / 연락처: 010-0000-0000\n문 앞에 두세요'
const parsed = parseOrdererInfoFromNote(note)
assert.equal(parsed?.name, '최고관리자')
assert.equal(parsed?.phone, '010-0000-0000')
assert.equal(stripOrdererInfoFromNote(note), '문 앞에 두세요')
assert.equal(parseOrdererInfoFromNote('없음'), null)

assert.equal(
    resolveOrdererPhone({ customer_note: note, user_phone: '011' }),
    '010-0000-0000'
)
assert.equal(
    resolveOrdererPhone({ orderer_phone: '010-1111-2222', customer_note: note }),
    '010-1111-2222'
)
assert.equal(resolveOrdererPhone({ user_phone: '010-3333-4444' }), '010-3333-4444')
assert.equal(formatOrdererNoteLine('홍길동', '010-1234-5678').includes('010-1234-5678'), true)

console.log('test-orderer-contact: ok')
