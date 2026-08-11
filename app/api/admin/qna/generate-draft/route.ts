import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { errorResponse, successResponse } from '@/lib/api-utils'
import {
  findSimilarQuestions,
  generateFaqDraft,
  type FaqDraftAiEnv,
} from '@/lib/faq-draft'

type Body = {
  /** inquiry: DB에서 로드 / manual: body 텍스트 사용 */
  source?: 'inquiry' | 'manual'
  sourceId?: number
  subject?: string
  message?: string
  categoryHint?: string
  adminNote?: string
  /** true면 qna에 is_published=0 으로 저장 */
  save?: boolean
  question?: string
  answer?: string
  category?: string
}

export async function POST(req: NextRequest) {
  try {
    const { env } = getCloudflareContext()
    if (!env?.DB) return errorResponse('DB not available', 503)

    const auth = await requireAdminAuth(req, env.DB)
    if (auth instanceof Response) return auth
    const { storeId } = auth

    const body = (await req.json()) as Body
    const source = body.source || 'manual'
    let subject = body.subject || ''
    let message = body.message || ''
    let categoryHint = body.categoryHint || 'general'
    let adminNote = body.adminNote || ''
    let sourceLabel = '수동 입력'

    if (source === 'inquiry') {
      const id = Number(body.sourceId)
      if (!Number.isFinite(id) || id <= 0) {
        return errorResponse('문의 ID가 필요합니다.', 400)
      }
      const row = await env.DB.prepare(
        `SELECT id, subject, message, category, admin_note, store_id
         FROM inquiries WHERE id = ? AND store_id = ? LIMIT 1`
      )
        .bind(id, storeId)
        .first<{
          id: number
          subject: string | null
          message: string | null
          category: string | null
          admin_note: string | null
        }>()

      if (!row) return errorResponse('문의를 찾을 수 없습니다.', 404)
      subject = row.subject || ''
      message = row.message || ''
      categoryHint = row.category || 'general'
      adminNote = row.admin_note || ''
      sourceLabel = `문의 #${row.id}`
    }

    // 저장만 (이미 검수한 초안을 미게시에 넣기)
    if (body.save && body.question && body.answer) {
      const result = await env.DB.prepare(
        `INSERT INTO qna (question, answer, category, is_published, display_order, store_id)
         VALUES (?, ?, ?, 0, 0, ?)`
      )
        .bind(
          String(body.question).trim().slice(0, 200),
          String(body.answer).trim().slice(0, 2000),
          body.category || categoryHint || 'general',
          storeId
        )
        .run()

      return successResponse(
        {
          id: result.meta.last_row_id,
          question: body.question,
          answer: body.answer,
          category: body.category || categoryHint || 'general',
          is_published: false,
        },
        'FAQ 초안이 미게시로 저장되었습니다. FAQ 관리에서 검수 후 공개하세요.'
      )
    }

    const aiEnv: FaqDraftAiEnv = {
      AI: (env as { AI?: FaqDraftAiEnv['AI'] }).AI,
      OPENAI_API_KEY:
        (env as { OPENAI_API_KEY?: string }).OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY,
    }

    const draft = await generateFaqDraft(
      { subject, message, categoryHint, adminNote, sourceLabel },
      aiEnv
    )

    const { results: existing } = await env.DB.prepare(
      `SELECT question FROM qna WHERE store_id = ? ORDER BY updated_at DESC LIMIT 80`
    )
      .bind(storeId)
      .all<{ question: string }>()

    const similarQuestions = findSimilarQuestions(
      draft.question,
      (existing || []) as Array<{ question: string }>
    )

    let savedId: number | null = null
    if (body.save) {
      const result = await env.DB.prepare(
        `INSERT INTO qna (question, answer, category, is_published, display_order, store_id)
         VALUES (?, ?, ?, 0, 0, ?)`
      )
        .bind(draft.question, draft.answer, draft.category, storeId)
        .run()
      savedId = Number(result.meta.last_row_id) || null
    }

    return successResponse({
      ...draft,
      similarQuestions,
      savedId,
      is_published: false,
    })
  } catch (e) {
    console.error('POST /api/admin/qna/generate-draft', e)
    return errorResponse(
      e instanceof Error ? e.message : 'FAQ 초안 생성에 실패했습니다.',
      500
    )
  }
}
