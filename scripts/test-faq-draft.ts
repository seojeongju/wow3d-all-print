/**
 * FAQ draft smoke: sanitize + template fallback
 */
import {
  findSimilarQuestions,
  generateFaqDraft,
  sanitizeFaqSourceText,
} from '../lib/faq-draft'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

async function main() {
  const cleaned = sanitizeFaqSourceText(
    '견적 문의합니다. 연락처 010-1234-5678, mail test@example.com 파일 abc123456789.stl'
  )
  assert(!cleaned.includes('010-1234-5678'), 'phone masked')
  assert(!cleaned.includes('test@example.com'), 'email masked')
  assert(cleaned.includes('[연락처]'), 'phone token')
  assert(cleaned.includes('[이메일]'), 'email token')

  const draft = await generateFaqDraft(
    {
      subject: 'SLA 투명 레진 견적',
      message: '투명 피규어 출력 견적이 궁금합니다. 010-9999-8888로 연락 주세요.',
      categoryHint: 'quote',
    },
    {}
  )
  assert(draft.provider === 'template', 'fallback template')
  assert(draft.category === 'quote', 'category quote')
  assert(!draft.answer.includes('010'), 'no phone in answer')
  assert(draft.question.length >= 8, 'question length')

  const similar = findSimilarQuestions('3D 프린팅 자동견적은 어떻게 확인하나요?', [
    { question: '3D 프린팅 자동견적은 어떻게 확인하나요?' },
    { question: '배송은 얼마나 걸리나요?' },
  ])
  assert(similar.length >= 1, 'similar found')

  console.log('test-faq-draft: ok')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
