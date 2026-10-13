/**
 * DB 콘텐츠 번역 파이프라인 점검 (가짜 AI — 네트워크 없음)
 * - HTML 블록 분할·태그 보존 검증, 평문 정리, 응답 개수 불일치 시 반으로 나눠 재시도, 숫자 누락 거부
 */
import { translateFieldSets, type AiBinding } from '../lib/content-translate-ai'
import { hashFields, pickHangulFields } from '../lib/content-translations'

function assert(cond: unknown, msg: string): asserts cond {
    if (!cond) throw new Error(msg)
}

const DICT: Record<string, string> = {
    '캐릭터 피규어': 'Character figure',
    '정밀부품 0.1mm출력_2024-03-29': 'Precision part 0.1mm print_2024-03-29',
    '첫 줄\n둘째 줄': 'First line\nSecond line',
    '나만의 <strong>NFC 태그</strong>로<br>매장 WiFi 안내': 'Guide store WiFi<br>with your own <strong>NFC tag</strong>',
    '<a href="/quote">견적 바로가기</a>': '<a href="/quote">Get a quote</a>',
    '태그가 사라지는 문장 <em>강조</em>': 'A sentence that loses its tag',
    '날짜가 틀리는 제목_2020-01-01': 'Wrong date title_2021-01-01',
}

/** calls: 모델 호출 기록. batchLimit 초과 묶음은 개수를 틀리게 답한다 */
function fakeAi(batchLimit = Infinity): AiBinding & { calls: number[] } {
    const calls: number[] = []
    return {
        calls,
        async run(_model, input) {
            const messages = input.messages as Array<{ role: string; content: string }>
            const texts = JSON.parse(messages[1].content) as string[]
            calls.push(texts.length)
            const t = texts.map((s) => DICT[s] ?? `EN(${s.length})`)
            if (texts.length > batchLimit) t.pop()
            return { response: JSON.stringify({ t }) }
        },
    }
}

async function main() {
    // 1) 평문·HTML 혼합 번역, 블록 태그 보존
    const ai = fakeAi()
    const [a, b] = await translateFieldSets(ai, [
        { fields: { title: '캐릭터 피규어', description: '  첫 줄 \n\n&nbsp;\n둘째 줄  ' } },
        {
            fields: {
                body: '<p>나만의 <strong>NFC 태그</strong>로<br>매장 WiFi 안내</p>\n<p><a href="/quote">견적 바로가기</a></p><img src="/a.png" alt="샘플">',
            },
            htmlKeys: new Set(['body']),
        },
    ])
    assert(a?.title === 'Character figure', `title: ${a?.title}`)
    assert(a?.description === 'First line\nSecond line', `평문 정리: ${JSON.stringify(a?.description)}`)
    assert(
        b?.body ===
            '<p>Guide store WiFi<br>with your own <strong>NFC tag</strong></p>\n<p><a href="/quote">Get a quote</a></p><img src="/a.png" alt="샘플">',
        `HTML: ${b?.body}`
    )
    assert(ai.calls.length === 1, `한 번에 묶어 호출: ${ai.calls.join(',')}`)

    // 2) 태그가 사라지거나 숫자가 바뀐 번역은 거부 → 저장하지 않음(null)
    const [lostTag, wrongDate, ok] = await translateFieldSets(fakeAi(), [
        { fields: { body: '<p>태그가 사라지는 문장 <em>강조</em></p>' }, htmlKeys: new Set(['body']) },
        { fields: { title: '날짜가 틀리는 제목_2020-01-01' } },
        { fields: { title: '정밀부품 0.1mm출력_2024-03-29' } },
    ])
    assert(lostTag === null, '태그 누락 번역은 거부')
    assert(wrongDate === null, '숫자 변경 번역은 거부')
    assert(ok?.title === 'Precision part 0.1mm print_2024-03-29', '숫자 보존 번역은 통과')

    // 3) 응답 개수가 어긋나면 반으로 나눠 재시도
    const halving = fakeAi(3)
    const many = Array.from({ length: 10 }, (_, i) => ({ fields: { title: `항목 ${'가'.repeat(i + 1)}` } }))
    const res = await translateFieldSets(halving, many)
    assert(res.every((r) => r && r.title.startsWith('EN(')), '분할 재시도 후 모두 번역')
    assert(Math.max(...halving.calls.slice(1)) <= 5, `분할 호출: ${halving.calls.join(',')}`)

    // 4) 번역 대상 선별·해시
    const picked = pickHangulFields([
        ['title', '시제품'],
        ['material', 'PLA'],
        ['description', null],
    ])
    assert(JSON.stringify(picked) === '{"title":"시제품"}', `pick: ${JSON.stringify(picked)}`)
    assert(hashFields({ a: '1', b: '2' }) === hashFields({ b: '2', a: '1' }), '키 순서와 무관한 해시')
    assert(hashFields({ a: '1' }) !== hashFields({ a: '2' }), '원문이 바뀌면 해시도 바뀜')

    console.log('test-content-translate: OK')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
