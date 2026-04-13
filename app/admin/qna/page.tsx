'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Loader2, Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { showToast } from '@/lib/toast-helper'
import { useAuthStore } from '@/store/useAuthStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'general', label: '일반' },
  { value: 'quote', label: '견적·제작' },
  { value: 'tech', label: '기술·파일' },
  { value: 'partnership', label: '파트너십' },
  { value: 'other', label: '기타' },
]

interface QnA {
  id: number;
  question: string;
  answer: string;
  category: string;
  is_published: boolean | number;
  display_order: number;
  created_at: string;
}

export default function AdminQnAPage() {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [qnas, setQnas] = useState<QnA[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    is_published: true,
    display_order: 0
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchQnas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/qna', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setQnas(data.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch QnAs', e)
      showToast.error('목록 조회 실패', 'FAQ 목록을 가져오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchQnas()
    }
  }, [token])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return qnas
    return qnas.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    )
  }, [qnas, searchQuery])

  const openAddDialog = () => {
    setEditingId(null)
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      is_published: true,
      display_order: qnas.length > 0 ? Math.max(...qnas.map(q => q.display_order)) + 1 : 0
    })
    setDialogOpen(true)
  }

  const openEditDialog = (item: QnA) => {
    setEditingId(item.id)
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      is_published: item.is_published === 1 || item.is_published === true,
      display_order: item.display_order
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      showToast.error('입력 확인', '질문과 답변을 모두 입력해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      const url = editingId ? `/api/admin/qna/${editingId}` : '/api/admin/qna'
      const method = editingId ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      })
      
      const json = await res.json()
      if (json.success) {
        showToast.success(editingId ? '수정되었습니다.' : '추가되었습니다.')
        setDialogOpen(false)
        fetchQnas()
      } else {
        showToast.error('저장 실패', json.error)
      }
    } catch (e) {
      showToast.error('오류 발생', '처리 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/admin/qna/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = await res.json()
      if (json.success) {
        showToast.success('삭제되었습니다.')
        setQnas((prev) => prev.filter(q => q.id !== id))
      } else {
        showToast.error('삭제 실패', json.error)
      }
    } catch (e) {
      showToast.error('오류 발생', '삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading && qnas.length === 0) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">FAQ 관리</h1>
          <p className="text-white/40 text-sm mt-1">자주 묻는 질문(FAQ) 항목을 관리하고 노출 순서를 설정합니다.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-11 px-6 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> 질문 추가
        </Button>
      </div>

      <div className="flex items-center gap-4 max-w-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="질문, 답변 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white h-11 rounded-xl focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

      <Card className="bg-white/[0.02] border-white/10 overflow-hidden rounded-2xl shadow-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  <th className="p-4 font-black text-[10px] text-white/40 uppercase tracking-widest w-20 text-center">순서</th>
                  <th className="p-4 font-black text-[10px] text-white/40 uppercase tracking-widest w-32">카테고리</th>
                  <th className="p-4 font-black text-[10px] text-white/40 uppercase tracking-widest">질문</th>
                  <th className="p-4 font-black text-[10px] text-white/40 uppercase tracking-widest w-24 text-center">공개</th>
                  <th className="p-4 font-black text-[10px] text-white/40 uppercase tracking-widest w-32">등록일</th>
                  <th className="p-4 font-black text-[10px] text-white/40 uppercase tracking-widest w-28 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="p-4 text-center font-mono text-white/40 group-hover:text-white/70">{q.display_order}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-lg px-2 py-0.5 text-[10px] font-bold">
                        {CATEGORY_OPTIONS.find(o => o.value === q.category)?.label || q.category}
                      </Badge>
                    </td>
                    <td className="p-4 font-bold text-white/80 group-hover:text-white transition-colors">{q.question}</td>
                    <td className="p-4 text-center">
                      {(q.is_published === 1 || q.is_published === true) ? (
                        <div className="inline-flex p-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="inline-flex p-1.5 rounded-full bg-white/5 border border-white/10 opacity-30">
                            <XCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-white/30 text-xs">
                      {new Date(q.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(q)} className="w-9 h-9 p-0 rounded-lg text-white/30 hover:text-white hover:bg-white/10 active:scale-90 transition-all">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} className="w-9 h-9 p-0 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 active:scale-90 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-32 text-center text-white/10 font-bold uppercase tracking-widest">등록된 FAQ가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-2xl rounded-3xl" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingId ? '질문 수정' : '새 질문 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">카테고리</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-primary transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c0c0c] border-white/10 text-white">
                    {CATEGORY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value} className="focus:bg-primary/20 focus:text-primary">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">노출 순서</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                  className="h-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-primary transition-all"
                  placeholder="0"
                />
                <p className="text-[10px] text-white/20 ml-1">낮을수록 앞에 표시됩니다.</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">질문 내용</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData(p => ({ ...p, question: e.target.value }))}
                placeholder="사용자에게 보여질 질문을 입력하세요"
                className="h-14 bg-white/5 border-white/10 text-white rounded-xl focus:ring-primary font-bold transition-all"
              />
            </div>

            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">답변 내용</Label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData(p => ({ ...p, answer: e.target.value }))}
                placeholder="상세한 답변 내용을 입력하세요"
                rows={8}
                className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm md:text-base text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 transition-colors hover:bg-white/5">
              <div className="space-y-1">
                <Label className="text-sm font-bold text-white/90">공개 여부</Label>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Publish to USER FAQ Page</p>
              </div>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, is_published: checked }))}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-14 px-8 rounded-xl font-bold text-white/40 hover:text-white hover:bg-white/5">취소</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="h-14 px-10 rounded-xl bg-white text-black hover:bg-white/90 font-black tracking-widest uppercase transition-all shadow-xl shadow-white/5">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '저장하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
