/**
 * 사이트 통합 검색 엔진 스모크 테스트 (정적 문서 기준)
 * 실행: npx --yes tsx scripts/test-site-search.ts
 */
import assert from 'node:assert/strict'
import { indexDocs, searchIndex } from '../lib/search/engine'
import { getStaticSearchDocs } from '../lib/search/static-docs'

const ko = indexDocs(getStaticSearchDocs('ko'))
const en = indexDocs(getStaticSearchDocs('en'))

function top(index: typeof ko, q: string, n = 3) {
    return searchIndex(index, q, n).hits.map((h) => `${h.title} (${h.url}, ${h.score})`)
}

const cases: [typeof ko, string, RegExp][] = [
    [ko, 'PLA PETG 차이', /pla-vs-abs-vs-petg/],
    [ko, '레진으로 투명한 부품', /transparent|resin|clear/],
    [ko, '서포트', /support|서포트/],
    [ko, '지지대 비용', /support/],
    [ko, '인필', /infill/],
    [ko, 'STL 오류', /stl|file/],
    [ko, '필라맨트', /./],
    [ko, '캡스톤', /capstone/],
    [ko, '제작 기간', /turnaround/],
    [ko, '홍대', /makerspace/],
    [ko, '사진으로 3D', /photo/],
    [en, 'resin types', /resin/],
    [en, 'support cost', /support/],
    [en, 'turnaround', /turnaround/],
]

for (const [index, q, expect] of cases) {
    const result = searchIndex(index, q, 5)
    const urls = result.hits.map((h) => h.url).join(' ')
    console.log(`\n[${q}] 결과 ${result.total}건 · 강조어: ${result.terms.slice(0, 6).join(', ')}`)
    for (const line of top(index, q)) console.log('  -', line)
    assert.ok(result.hits.length > 0, `"${q}" 결과 없음`)
    assert.match(urls, expect, `"${q}" 상위 결과에 기대 문서 없음`)
}

const typo = searchIndex(ko, '필라맨트')
assert.equal(typo.corrected, '필라멘트', `오타 교정 실패: ${typo.corrected}`)
assert.ok(typo.hits.length >= 3, `오타 교정 후 결과가 적음: ${typo.hits.length}`)
const typoEn = searchIndex(en, 'suport')
assert.equal(typoEn.corrected, 'support', `영문 오타 교정 실패: ${typoEn.corrected}`)
console.log(`\n[필라맨트] → ${typo.corrected} · ${typo.hits.length}건 / [suport] → ${typoEn.corrected} · ${typoEn.hits.length}건`)

assert.equal(searchIndex(ko, 'zzzzqqq').hits.length, 0)
console.log(`\nOK site search tests passed (ko ${ko.length}문서, en ${en.length}문서)`)
