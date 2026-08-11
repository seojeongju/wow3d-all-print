'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Loader2, Sparkles, HelpCircle, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/useAuthStore'
import AdminListPagination from '@/components/admin/AdminListPagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'new', label: '신규' },
  { value: 'read', label: '확인함' },
  { value: 'replied', label: '답변완료' },
  { value: 'closed', label: '종료' },
]

const CATEGORY_LABELS: Record<string, string> = {
  general: '일반 문의',
  quote: '견적·제작',
  tech: '기술·파일',
  partnership: '파트너십',
  other: '기타',
}

type ListPagination = { page: number; limit: number; total: number; totalPages: number }

function getStatusBadge(status: string) {
  switch (status) {
    case 'new':
      return <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">신규</Badge>
    case 'read':
      return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">확인함</Badge>
    case 'replied':
      return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">답변완료</Badge>
    case 'closed':
      return <Badge variant="outline" className="bg-white/10 text-white/50 border-white/20">종료</Badge>
    default:
      return <Badge variant="outline" className="bg-white/10 text-white/60">-</Badge>
  }
}

export default function AdminFaqDraftPage() {
  const { toast } = useToast()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [inquiries, setInquiries] = useState<Record<string, unknown>[]>([])
  const [pagination, setPagination] = useState<ListPagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const prevDebouncedRef = useRef('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedSnapshot, setSelectedSnapshot] = useState<Record<string, unknown> | null>(null)
  const [faqGenerating, setFaqGenerating] = useState(false)
  const [faqSaving, setFaqSaving] = useState(false)
  const [faqDraft, setFaqDraft] = useState<{
    question: string
    answer: string
    category: string
    provider: string
    similarQuestions: string[]
    diagnostics?: {
      openaiKeyPresent?: boolean
      openaiError?: string
      workersAiError?: string
    }
  } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchQuery.trim()
      if (prevDebouncedRef.current === next) return
      prevDebouncedRef.current = next
      setDebouncedSearch(next)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      })
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (debouncedSearch) params.set('q', debouncedSearch)

      const res = await fetch(`/api/admin/inquiries?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      })
      const data = await res.json()
      if (data.success && data.data?.items) {
        const pag = data.data.pagination || {
          page: 1,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 1,
        }
        setInquiries(Array.isArray(data.data.items) ? data.data.items : [])
        setPagination(pag)
        if (pag.totalPages >= 1 && page > pag.totalPages) {
          setPage(pag.totalPages)
        }
      } else {
        toast({ title: '문의 목록 조회 실패', variant: 'destructive' })
      }
    } catch (e) {
      console.error('Failed to fetch inquiries', e)
      toast({ title: '문의 목록 조회 실패', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast, page, statusFilter, debouncedSearch])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  const selected = useMemo(() => {
    const fromPage = inquiries.find((i) => Number(i.id) === selectedId)
    return fromPage || selectedSnapshot
  }, [inquiries, selectedId, selectedSnapshot])

  const handleSelect = (row: Record<string, unknown>) => {
    const id = Number(row.id)
    setSelectedId(id)
    setSelectedSnapshot(row)
    setFaqDraft(null)
  }

  const handleGenerateFaqDraft = async () => {
    if (!selectedId) return
    setFaqGenerating(true)
    try {
      const res = await fetch('/api/admin/qna/generate-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          source: 'inquiry',
          sourceId: selectedId,
          save: false,
        }),
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        toast({ title: json.error || 'FAQ 초안 생성 실패', variant: 'destructive' })
        return
      }
      setFaqDraft({
        question: String(json.data.question || ''),
        answer: String(json.data.answer || ''),
        category: String(json.data.category || 'general'),
        provider: String(json.data.provider || ''),
        similarQuestions: Array.isArray(json.data.similarQuestions)
          ? json.data.similarQuestions.map(String)
          : [],
        diagnostics: json.data.diagnostics || undefined,
      })
      const provider = String(json.data.provider || '')
      const openaiError = json.data.diagnostics?.openaiError as string | undefined
      if (provider === 'openai') {
        toast({
          title: 'FAQ 초안이 생성되었습니다',
          description: 'OpenAI 초안입니다. 내용을 검수한 뒤 미게시에 저장하세요.',
        })
      } else {
        toast({
          title: `FAQ 초안 생성됨 (${provider || 'fallback'})`,
          description:
            openaiError ||
            (provider === 'template'
              ? 'OpenAI가 동작하지 않아 규칙 기반 초안입니다. 키·결제·로그를 확인하세요.'
              : '내용을 검수한 뒤 미게시에 저장하세요.'),
          variant: provider === 'template' ? 'destructive' : 'default',
        })
      }
    } catch {
      toast({ title: 'FAQ 초안 생성 중 오류', variant: 'destructive' })
    } finally {
      setFaqGenerating(false)
    }
  }

  const handleSaveFaqDraft = async () => {
    if (!faqDraft?.question.trim() || !faqDraft?.answer.trim()) {
      toast({ title: '질문과 답변을 입력해 주세요.', variant: 'destructive' })
      return
    }
    setFaqSaving(true)
    try {
      const res = await fetch('/api/admin/qna/generate-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          source: 'manual',
          save: true,
          question: faqDraft.question.trim(),
          answer: faqDraft.answer.trim(),
          category: faqDraft.category,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast({ title: json.error || '저장 실패', variant: 'destructive' })
        return
      }
      toast({
        title: '미게시 FAQ로 저장됨',
        description: 'FAQ 관리에서 검수 후 공개할 수 있습니다.',
      })
    } catch {
      toast({ title: '저장 중 오류', variant: 'destructive' })
    } finally {
      setFaqSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-teal-400" />
            AI FAQ 작성
          </h1>
          <p className="text-white/50 text-sm mt-1">
            문의를 선택한 뒤 FAQ 초안을 생성하고, 검수 후 미게시에 저장하세요.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/10 text-white shrink-0">
          <Link href="/admin/qna">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ 관리
            <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[70vh]">
        {/* 문의 목록 */}
        <Card className="xl:col-span-5 bg-white/[0.03] border-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="search"
                placeholder="이름, 제목, 내용 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[60vh] xl:max-h-none">
            {loading && inquiries.length === 0 ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : inquiries.length === 0 ? (
              <p className="p-8 text-center text-white/40 text-sm">
                {pagination.total === 0 && !debouncedSearch && statusFilter === 'all'
                  ? '접수된 문의가 없습니다.'
                  : '검색·필터 결과가 없습니다.'}
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {inquiries.map((inq) => {
                  const id = Number(inq.id)
                  const active = selectedId === id
                  const msg = String(inq.message || '')
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(inq)}
                        className={cn(
                          'w-full text-left p-4 transition-colors',
                          active
                            ? 'bg-teal-500/10 border-l-2 border-teal-400'
                            : 'hover:bg-white/[0.03] border-l-2 border-transparent'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-medium text-white text-sm truncate">
                            {String(inq.subject || inq.name || `문의 #${id}`)}
                          </span>
                          {getStatusBadge(String(inq.status || 'new'))}
                        </div>
                        <p className="text-xs text-white/45 line-clamp-2 mb-2">{msg || '내용 없음'}</p>
                        <div className="flex items-center gap-2 text-[11px] text-white/35">
                          <span>{CATEGORY_LABELS[String(inq.category || '')] || '-'}</span>
                          <span>·</span>
                          <span>
                            {inq.created_at
                              ? new Date(String(inq.created_at)).toLocaleDateString('ko-KR')
                              : '-'}
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
          <AdminListPagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            loading={loading}
            filterHint={!!debouncedSearch || statusFilter !== 'all'}
            onPageChange={setPage}
          />
        </Card>

        {/* 선택·초안 편집 */}
        <div className="xl:col-span-7 space-y-4">
          {!selected ? (
            <Card className="bg-white/[0.03] border-white/10 border-dashed">
              <CardContent className="p-12 text-center text-white/40 text-sm">
                왼쪽에서 FAQ로 만들 문의를 선택하세요.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                        선택한 문의 #{selectedId}
                      </p>
                      <h2 className="text-lg font-semibold text-white">
                        {String(selected.subject || '-')}
                      </h2>
                      <p className="text-xs text-white/40 mt-1">
                        {String(selected.name || '-')} ·{' '}
                        {CATEGORY_LABELS[String(selected.category || '')] || '-'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleGenerateFaqDraft}
                      disabled={faqGenerating || !String(selected.message || '').trim()}
                      className="bg-teal-600 hover:bg-teal-500 text-white shrink-0"
                    >
                      {faqGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      FAQ 초안 생성
                    </Button>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      문의 내용
                    </span>
                    <p className="text-sm text-white/75 whitespace-pre-wrap mt-1.5 max-h-48 overflow-y-auto rounded-lg bg-black/20 border border-white/5 p-3">
                      {String(selected.message || '')}
                    </p>
                  </div>
                  {selected.admin_note ? (
                    <div>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                        관리자 메모 (초안 힌트)
                      </span>
                      <p className="text-sm text-white/55 whitespace-pre-wrap mt-1.5">
                        {String(selected.admin_note)}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {faqDraft ? (
                <Card className="bg-white/[0.03] border-teal-400/20">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        FAQ 초안 검수
                      </h3>
                      {faqDraft.provider ? (
                        <span
                          className={`text-[11px] ${
                            faqDraft.provider === 'openai' ? 'text-teal-400/80' : 'text-amber-300/80'
                          }`}
                        >
                          provider: {faqDraft.provider}
                        </span>
                      ) : null}
                    </div>
                    {faqDraft.provider !== 'openai' ? (
                      <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                          OpenAI 미사용
                        </p>
                        <p className="text-xs text-amber-100/80 leading-relaxed">
                          {faqDraft.diagnostics?.openaiError ||
                            (faqDraft.diagnostics?.openaiKeyPresent === false
                              ? 'OPENAI_API_KEY가 런타임에 없습니다. Cloudflare Secret을 확인하세요.'
                              : 'OpenAI 호출에 실패해 대체 초안을 사용했습니다.')}
                        </p>
                        {faqDraft.diagnostics?.workersAiError ? (
                          <p className="text-[11px] text-amber-100/50">
                            Workers AI: {faqDraft.diagnostics.workersAiError}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <p className="text-xs text-white/45 leading-relaxed">
                      개인정보가 없는지 확인한 뒤 <strong className="text-white/70">미게시</strong>로
                      저장하고, FAQ 관리에서 공개하세요.
                    </p>
                    <div>
                      <Label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                        질문
                      </Label>
                      <Input
                        value={faqDraft.question}
                        onChange={(e) =>
                          setFaqDraft((d) => (d ? { ...d, question: e.target.value } : d))
                        }
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                        답변
                      </Label>
                      <textarea
                        value={faqDraft.answer}
                        onChange={(e) =>
                          setFaqDraft((d) => (d ? { ...d, answer: e.target.value } : d))
                        }
                        rows={8}
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white resize-y"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                        카테고리
                      </Label>
                      <Select
                        value={faqDraft.category}
                        onValueChange={(v) =>
                          setFaqDraft((d) => (d ? { ...d, category: v } : d))
                        }
                      >
                        <SelectTrigger className="mt-1 w-full bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {faqDraft.similarQuestions.length > 0 ? (
                      <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                          유사 FAQ 주의
                        </p>
                        <ul className="text-xs text-amber-100/80 space-y-1 list-disc pl-4">
                          {faqDraft.similarQuestions.map((q) => (
                            <li key={q}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button onClick={handleSaveFaqDraft} disabled={faqSaving}>
                        {faqSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        미게시에 저장
                      </Button>
                      <Button asChild variant="outline" className="border-white/10 text-white">
                        <Link href="/admin/qna">FAQ 관리로 이동</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
