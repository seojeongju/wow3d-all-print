'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Edit2,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import AdminListPagination from '@/components/admin/AdminListPagination'
import { showToast } from '@/lib/toast-helper'
import { useAuthStore } from '@/store/useAuthStore'

const PAGE_SIZE = 20

type PopupItem = {
  id: number
  title: string
  body: string | null
  image_key: string | null
  image_url: string | null
  link_url: string | null
  start_at: string | null
  end_at: string | null
  is_visible: number | boolean
  sort_order: number
  dismiss_days: number
  created_at: string
}

type FormState = {
  title: string
  body: string
  link_url: string
  start_at: string
  end_at: string
  is_visible: boolean
  sort_order: number
  dismiss_days: number
  image: File | null
  clear_image: boolean
}

const emptyForm = (): FormState => ({
  title: '',
  body: '',
  link_url: '',
  start_at: '',
  end_at: '',
  is_visible: false,
  sort_order: 0,
  dismiss_days: 1,
  image: null,
  clear_image: false,
})

/** datetime-local 입력용 */
function toLocalInput(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) {
    // SQLite datetime already local-ish
    return value.slice(0, 16).replace(' ', 'T')
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminPopupsPage() {
  const { token } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<PopupItem[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [visibleFilter, setVisibleFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchList = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      })
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (visibleFilter !== 'all') params.set('visible', visibleFilter)

      const res = await fetch(`/api/admin/popups?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const json = await res.json()
      if (json.success && json.data?.items) {
        setItems(json.data.items)
        setPagination(
          json.data.pagination || {
            page: 1,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 1,
          }
        )
        if (json.data.needsMigration) {
          showToast.error(
            'DB 마이그레이션 필요',
            'popups 테이블이 없습니다. 마이그레이션을 적용해주세요.'
          )
        }
      } else {
        showToast.error('목록 조회 실패', json.error || '팝업 목록을 가져오지 못했습니다.')
      }
    } catch (e) {
      console.error(e)
      showToast.error('목록 조회 실패', '팝업 목록을 가져오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, page, debouncedSearch, visibleFilter])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setExistingImageUrl(null)
    setPreviewUrl(null)
    setDialogOpen(true)
  }

  const openEdit = (item: PopupItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      body: item.body || '',
      link_url: item.link_url || '',
      start_at: toLocalInput(item.start_at),
      end_at: toLocalInput(item.end_at),
      is_visible: Boolean(item.is_visible),
      sort_order: Number(item.sort_order || 0),
      dismiss_days: Number(item.dismiss_days ?? 1),
      image: null,
      clear_image: false,
    })
    setExistingImageUrl(item.image_url)
    setPreviewUrl(null)
    setDialogOpen(true)
  }

  const onPickImage = (file: File | null) => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    if (!file) {
      setForm((f) => ({ ...f, image: null }))
      setPreviewUrl(null)
      return
    }
    setForm((f) => ({ ...f, image: file, clear_image: false }))
    setPreviewUrl(URL.createObjectURL(file))
  }

  const buildFormData = () => {
    const data = new FormData()
    data.append('title', form.title.trim())
    data.append('body', form.body)
    data.append('link_url', form.link_url)
    data.append('start_at', form.start_at ? form.start_at.replace('T', ' ') : '')
    data.append('end_at', form.end_at ? form.end_at.replace('T', ' ') : '')
    data.append('is_visible', form.is_visible ? '1' : '0')
    data.append('sort_order', String(form.sort_order))
    data.append('dismiss_days', String(form.dismiss_days))
    if (form.image) data.append('image', form.image)
    if (form.clear_image) data.append('clear_image', '1')
    return data
  }

  const handleSubmit = async () => {
    if (!token) return
    if (!form.title.trim()) {
      showToast.error('입력 오류', '제목을 입력해주세요.')
      return
    }
    setSubmitting(true)
    try {
      const data = buildFormData()
      const url = editingId ? `/api/admin/popups/${editingId}` : '/api/admin/popups'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        showToast.error(editingId ? '수정 실패' : '생성 실패', json.error || '저장에 실패했습니다.')
        return
      }
      showToast.success(editingId ? '팝업이 수정되었습니다.' : '팝업이 생성되었습니다.')
      setDialogOpen(false)
      fetchList()
    } catch (e) {
      console.error(e)
      showToast.error('오류', '저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!token || !confirm('이 팝업을 삭제할까요? 이미지 파일도 함께 삭제됩니다.')) return
    try {
      const res = await fetch(`/api/admin/popups/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        showToast.success('삭제되었습니다.')
        if (items.length <= 1 && page > 1) setPage((p) => p - 1)
        else fetchList()
      } else {
        showToast.error('삭제 실패', json.error)
      }
    } catch {
      showToast.error('오류', '삭제 중 오류가 발생했습니다.')
    }
  }

  const displayImage = previewUrl || (!form.clear_image ? existingImageUrl : null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">팝업 관리</h1>
          <p className="mt-1 text-sm text-white/40">
            사이트 전역 팝업을 생성·수정·삭제합니다. 이미지와 안내 문구, 링크를 설정할 수 있습니다.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="h-11 gap-2 rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> 팝업 추가
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="제목·본문 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-white/10 bg-white/5 pl-9 text-white"
          />
        </div>
        <Select
          value={visibleFilter}
          onValueChange={(v) => {
            setVisibleFilter(v as 'all' | 'visible' | 'hidden')
            setPage(1)
          }}
        >
          <SelectTrigger className="h-11 w-[160px] rounded-xl border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="노출 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="visible">노출 중</SelectItem>
            <SelectItem value="hidden">숨김</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center p-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-white/40">
          등록된 팝업이 없습니다. 「팝업 추가」로 첫 팝업을 만들어 보세요.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:h-20 sm:w-28">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/20">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-bold text-white">{item.title}</h2>
                  {item.is_visible ? (
                    <Badge className="bg-teal-500/20 text-teal-300 hover:bg-teal-500/20">
                      <Eye className="mr-1 h-3 w-3" /> 노출
                    </Badge>
                  ) : (
                    <Badge className="bg-white/10 text-white/50 hover:bg-white/10">
                      <EyeOff className="mr-1 h-3 w-3" /> 숨김
                    </Badge>
                  )}
                  <span className="text-xs text-white/30">순서 {item.sort_order}</span>
                </div>
                {item.body && (
                  <p className="line-clamp-2 text-sm text-white/45">{item.body}</p>
                )}
                <p className="text-[11px] text-white/30">
                  {item.start_at || '시작 제한 없음'} ~ {item.end_at || '종료 제한 없음'}
                  {item.link_url ? ` · 링크: ${item.link_url}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => openEdit(item)}
                >
                  <Edit2 className="mr-1.5 h-4 w-4" /> 수정
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl border border-red-500/20 text-red-300/80 hover:bg-red-500/10 hover:text-red-200"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> 삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={setPage}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-white/10 bg-[#0d1117] text-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? '팝업 수정' : '팝업 추가'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>이미지</Label>
              <div
                className="relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03] hover:border-teal-400/40"
                onClick={() => fileRef.current?.click()}
              >
                {displayImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={displayImage} alt="미리보기" className="max-h-56 w-full object-contain" />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white/80 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPickImage(null)
                        setForm((f) => ({ ...f, clear_image: true, image: null }))
                        setExistingImageUrl(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-white/40">
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-sm">클릭하여 이미지 업로드</span>
                    <span className="text-xs text-white/25">jpg, png, webp · 최대 8MB</span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="popup-title">제목 *</Label>
              <Input
                id="popup-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="border-white/10 bg-white/5 text-white"
                placeholder="예: 스마트상점 지원사업 안내"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="popup-body">본문 텍스트</Label>
              <textarea
                id="popup-body"
                rows={4}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="팝업에 표시할 안내 문구"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="popup-link">클릭 시 이동 URL</Label>
              <Input
                id="popup-link"
                value={form.link_url}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                className="border-white/10 bg-white/5 text-white"
                placeholder="https:// 또는 /partnership/smart-store"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="popup-start">시작일시</Label>
                <Input
                  id="popup-start"
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popup-end">종료일시</Label>
                <Input
                  id="popup-end"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="popup-order">정렬 순서</Label>
                <Input
                  id="popup-order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popup-dismiss">다시 보지 않기(일)</Label>
                <Input
                  id="popup-dismiss"
                  type="number"
                  min={0}
                  max={365}
                  value={form.dismiss_days}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      dismiss_days: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">사이트에 노출</p>
                <p className="text-xs text-white/40">켜면 기간 내 방문자에게 팝업이 표시됩니다</p>
              </div>
              <Switch
                checked={form.is_visible}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_visible: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="border border-white/10 text-white/70"
            >
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2 font-bold">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? '저장' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
