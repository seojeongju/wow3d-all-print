/**
 * FAQ 초안 생성 — 문의/메모를 검색용 Q&A로 일반화.
 * 프로바이더: OpenAI → Workers AI → 규칙 기반 폴백
 */

export type FaqCategory = 'general' | 'quote' | 'tech' | 'partnership' | 'other'

export type FaqDraftInput = {
  subject?: string | null
  message: string
  categoryHint?: string | null
  adminNote?: string | null
  sourceLabel?: string
}

export type FaqDraftDiagnostics = {
  openaiKeyPresent: boolean
  openaiError?: string
  workersAiError?: string
}

export type FaqDraftResult = {
  question: string
  answer: string
  category: FaqCategory
  provider: 'workers-ai' | 'openai' | 'template'
  similarQuestions?: string[]
  diagnostics?: FaqDraftDiagnostics
}

export type FaqDraftAiEnv = {
  AI?: {
    run: (
      model: string,
      input: Record<string, unknown>
    ) => Promise<unknown>
  }
  OPENAI_API_KEY?: string
}

function resolveOpenAiKey(env: FaqDraftAiEnv): string {
  // Workers: nodejs_compat_populate_process_env 시 Secret은 process.env에 먼저 들어옴
  const fromProcess =
    typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY?.trim() : ''
  if (fromProcess) return fromProcess
  return env.OPENAI_API_KEY?.trim() || ''
}

const CATEGORIES: FaqCategory[] = ['general', 'quote', 'tech', 'partnership', 'other']

const SYSTEM_PROMPT = `당신은 (주)와우쓰리디(WOW3D) 3D프린팅 출력·시제품 제작 서비스의 FAQ 작성 담당자입니다.
고객 문의 원문을 바탕으로 공개 FAQ용 질문·답변 초안을 JSON으로만 작성하세요.

규칙:
1. 이름·이메일·전화·주소·회사명·주문번호·파일명 등 개인·식별 정보를 절대 넣지 마세요.
2. 질문은 검색에 잘 걸리도록 일반화하세요. (예: "제 STL 견적 얼마예요?" → "3D 프린팅 자동견적은 어떻게 확인하나요?")
3. 답변은 2~5문장, 한국어, 사실 확인된 서비스 범위만. 확실하지 않은 가격·납기는 단정하지 말고 "파일·공정에 따라 다르며 자동견적/상담으로 확인" 식으로 안내.
4. category는 general|quote|tech|partnership|other 중 하나.
5. 출력은 반드시 JSON 한 객체만: {"question":"...","answer":"...","category":"quote"}`

function normalizeCategory(raw: string | null | undefined, hint?: string | null): FaqCategory {
  const v = (raw || hint || 'general').toLowerCase().trim()
  if (v === 'development') return 'tech'
  if (CATEGORIES.includes(v as FaqCategory)) return v as FaqCategory
  if (v.includes('견적') || v.includes('quote') || v.includes('price')) return 'quote'
  if (v.includes('파일') || v.includes('tech') || v.includes('stl')) return 'tech'
  if (v.includes('파트너') || v.includes('partner')) return 'partnership'
  return 'general'
}

/** 이메일·전화·과도한 숫자열 등 민감 패턴 마스킹 */
export function sanitizeFaqSourceText(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[이메일]')
    .replace(/(?:\+?82[-\s]?)?0?\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/g, '[연락처]')
    .replace(/\b\d{6,}\b/g, '[번호]')
    .replace(/[^\S\n]+/g, ' ')
    .trim()
    .slice(0, 2500)
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence?.[1]?.trim() || trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

function buildUserPrompt(input: FaqDraftInput): string {
  const subject = sanitizeFaqSourceText(input.subject || '')
  const message = sanitizeFaqSourceText(input.message || '')
  const note = sanitizeFaqSourceText(input.adminNote || '')
  return [
    input.sourceLabel ? `출처: ${input.sourceLabel}` : '',
    subject ? `제목: ${subject}` : '',
    `문의 내용:\n${message || '(내용 없음)'}`,
    note ? `관리자 참고 메모(비공개, 답변 힌트만):\n${note}` : '',
    `카테고리 힌트: ${input.categoryHint || 'general'}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

function parseDraftPayload(
  raw: unknown,
  input: FaqDraftInput,
  provider: FaqDraftResult['provider']
): FaqDraftResult | null {
  let text = ''
  if (typeof raw === 'string') text = raw
  else if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    if (typeof o.response === 'string') text = o.response
    else if (typeof o.result === 'string') text = o.result
    else if (typeof o.output_text === 'string') text = o.output_text
    else if (Array.isArray(o.output) && o.output[0] && typeof (o.output[0] as { content?: unknown }).content === 'string') {
      text = String((o.output[0] as { content: string }).content)
    } else text = JSON.stringify(raw)
  }
  const parsed = extractJsonObject(text)
  if (!parsed) return null
  const question = String(parsed.question || '').trim()
  const answer = String(parsed.answer || '').trim()
  if (question.length < 8 || answer.length < 20) return null
  return {
    question: question.slice(0, 200),
    answer: answer.slice(0, 2000),
    category: normalizeCategory(String(parsed.category || ''), input.categoryHint),
    provider,
  }
}

function isGreetingOrNoise(line: string): boolean {
  const t = line.trim()
  if (t.length < 12) return true
  return /^(안녕하세요|안녕하십니까|안녕|hello|hi|수고|문의드립니다|문의 드립니다)[.!]?\s*$/i.test(t)
}

function pickMeaningfulLine(message: string, subject: string): string {
  const lines = message
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 12 && !isGreetingOrNoise(l))
  if (lines.length) {
    // 질문형·키워드 우선
    const scored = lines
      .map((l) => {
        let score = 0
        if (/[?？]|나요|까요|인가요|가능한|추천|견적|소재|파일|출력/.test(l)) score += 3
        if (l.length >= 20 && l.length <= 120) score += 1
        return { l, score }
      })
      .sort((a, b) => b.score - a.score)
    return scored[0]?.l || lines[0]
  }
  if (subject && !isGreetingOrNoise(subject)) return subject
  return message.replace(/\s+/g, ' ').trim().slice(0, 100)
}

function templateDraft(input: FaqDraftInput): FaqDraftResult {
  const message = sanitizeFaqSourceText(input.message || '')
  const subject = sanitizeFaqSourceText(input.subject || '')
  const category = normalizeCategory(input.categoryHint)
  const meaningful = pickMeaningfulLine(message, subject)

  let question = meaningful.replace(/[?？]*$/, '').slice(0, 80)
  // 인사/원문 그대로보다 FAQ형 질문으로 정리
  if (/안녕하세요|문의드립니다/i.test(question) || question.length < 12) {
    question =
      category === 'quote'
        ? '3D 프린팅 견적·소재는 어떻게 선택하나요?'
        : category === 'tech'
          ? '3D 프린팅에 어떤 파일을 업로드할 수 있나요?'
          : '와우쓰리디 3D 프린팅 서비스는 어떤 도움을 주나요?'
  } else if (!question.endsWith('나요') && !question.endsWith('까요') && !question.includes('?')) {
    question = `${question}?`
  }

  const excerpt = meaningful.slice(0, 120)
  const answerByCategory: Record<FaqCategory, string> = {
    quote:
      '와우쓰리디 자동견적은 파일 부피·크기·출력 방식·소재·레이어 높이 등을 반영해 실시간으로 안내합니다. STL·OBJ·3MF·PLY는 즉시 견적이 가능하고, STEP·STP는 업로드 시 자동 변환 후 견적을 제공합니다. 특수 소재나 복잡한 형상은 관리자 검토 후 금액이 조정될 수 있으니 자동견적 결과와 함께 문의해 주세요.',
    tech:
      'STL, OBJ, 3MF, PLY 파일은 즉시 자동견적을 지원하며 STEP·STP는 변환 후 견적합니다. 업로드 전 단위(mm), 벽 두께, 메쉬 오류를 확인하면 제작 품질이 안정적입니다. 파일이 열리더라도 얇은 벽·열린 형상 등으로 출력이 어려울 수 있어, 필요 시 파일 검토를 요청해 주세요.',
    partnership:
      '대리점·협업·대량 제작 관련 문의는 파트너십 상담으로 접수됩니다. 사업 형태와 예상 물량, 희망 공정을 알려주시면 담당자가 가능 여부와 절차를 안내합니다. 자세한 내용은 파트너십 페이지 또는 문의하기를 이용해 주세요.',
    other:
      '문의 내용을 확인한 뒤 담당자가 안내드립니다. 견적·파일·제작 관련은 자동견적과 FAQ를 먼저 참고하시면 더 빠르게 확인하실 수 있습니다. 추가 상담이 필요하면 문의하기에 내용을 남겨 주세요.',
    general:
      '와우쓰리디는 3D 프린팅 출력과 시제품 제작, 실시간 자동견적을 제공합니다. 파일 업로드 후 가격과 예상 제작기간을 확인하고 주문할 수 있으며, 세부 조건은 공정·수량·후가공에 따라 달라질 수 있습니다. 구체 조건은 자동견적 또는 문의를 통해 확인해 주세요.',
  }

  const base = answerByCategory[category]
  const answer = excerpt
    ? `${base} (문의 요지 참고: ${excerpt}${excerpt.length >= 120 ? '…' : ''})`
    : base

  return {
    question,
    answer: answer.slice(0, 2000),
    category,
    provider: 'template',
  }
}

type AiAttempt<T> = { result: T | null; error?: string }

/** deprecated llama-3.1-8b-instruct 대체 — 활성 모델 순서로 시도 */
const WORKERS_AI_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct-fast',
  '@cf/zai-org/glm-4.7-flash',
  '@cf/meta/llama-4-scout-17b-16e-instruct',
] as const

async function generateWithWorkersAi(
  env: FaqDraftAiEnv,
  input: FaqDraftInput
): Promise<AiAttempt<FaqDraftResult>> {
  if (!env.AI?.run) return { result: null, error: 'Workers AI 바인딩 없음' }

  const errors: string[] = []
  for (const model of WORKERS_AI_MODELS) {
    try {
      const result = await env.AI.run(model, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        max_tokens: 700,
        temperature: 0.3,
      })
      const parsed = parseDraftPayload(result, input, 'workers-ai')
      if (parsed) return { result: parsed }
      errors.push(`${model}: JSON 파싱 실패`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn('[faq-draft] Workers AI failed', model, e)
      errors.push(`${model}: ${msg.slice(0, 120)}`)
    }
  }
  return { result: null, error: errors.join(' | ').slice(0, 280) }
}

function summarizeOpenAiHttpError(status: number, body: string): string {
  if (/insufficient_quota|no credits remaining/i.test(body) || status === 402) {
    return 'OpenAI 크레딧이 부족합니다. platform.openai.com → Billing에서 크레딧을 충전하세요.'
  }
  if (status === 401) return 'OpenAI 인증 실패(401). API 키를 확인하세요.'
  if (status === 429) {
    if (/rate.?limit/i.test(body)) {
      return 'OpenAI 요청 한도(rate limit)를 초과했습니다. 잠시 후 다시 시도하세요.'
    }
    return 'OpenAI 한도/쿼터 초과(429). Billing·사용량을 확인하세요.'
  }
  const trimmed = body.replace(/\s+/g, ' ').trim().slice(0, 120)
  return `OpenAI HTTP ${status}${trimmed ? `: ${trimmed}` : ''}`
}

async function generateWithOpenAi(
  env: FaqDraftAiEnv,
  input: FaqDraftInput
): Promise<AiAttempt<FaqDraftResult>> {
  const key = resolveOpenAiKey(env)
  if (!key) return { result: null, error: 'OPENAI_API_KEY 없음' }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(input) },
        ],
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      const error = summarizeOpenAiHttpError(res.status, body)
      console.warn('[faq-draft] OpenAI HTTP', res.status, body.slice(0, 300))
      return { result: null, error }
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content || ''
    if (!content.trim()) {
      return { result: null, error: 'OpenAI 응답이 비어 있음' }
    }
    const parsed = parseDraftPayload(content, input, 'openai')
    if (!parsed) {
      return { result: null, error: 'OpenAI 응답 JSON 파싱 실패' }
    }
    return { result: parsed }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[faq-draft] OpenAI failed', e)
    return { result: null, error: msg.slice(0, 200) }
  }
}

export async function generateFaqDraft(
  input: FaqDraftInput,
  env: FaqDraftAiEnv = {}
): Promise<FaqDraftResult> {
  if (!sanitizeFaqSourceText(input.message || input.subject || '')) {
    throw new Error('FAQ로 만들 문의 내용이 없습니다.')
  }

  const diagnostics: FaqDraftDiagnostics = {
    openaiKeyPresent: !!resolveOpenAiKey(env),
  }

  const fromOpenAi = await generateWithOpenAi(env, input)
  if (fromOpenAi.error) diagnostics.openaiError = fromOpenAi.error
  if (fromOpenAi.result) {
    return { ...fromOpenAi.result, diagnostics }
  }

  const fromWorkers = await generateWithWorkersAi(env, input)
  if (fromWorkers.error) diagnostics.workersAiError = fromWorkers.error
  if (fromWorkers.result) {
    return { ...fromWorkers.result, diagnostics }
  }

  return { ...templateDraft(input), diagnostics }
}

/** 기존 FAQ와 단순 유사도(포함/공통 토큰) — 중복 안내용 */
export function findSimilarQuestions(
  draftQuestion: string,
  existing: Array<{ question: string }>,
  limit = 3
): string[] {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^0-9a-z가-힣\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const q = norm(draftQuestion)
  if (!q) return []
  const tokens = new Set(q.split(' ').filter((t) => t.length >= 2))
  const scored = existing
    .map((item) => {
      const eq = norm(item.question)
      if (!eq) return { q: item.question, score: 0 }
      if (eq === q || eq.includes(q) || q.includes(eq)) return { q: item.question, score: 1 }
      const et = eq.split(' ').filter((t) => t.length >= 2)
      const hit = et.filter((t) => tokens.has(t)).length
      const score = et.length ? hit / Math.max(et.length, tokens.size) : 0
      return { q: item.question, score }
    })
    .filter((x) => x.score >= 0.35)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((x) => x.q)
}
