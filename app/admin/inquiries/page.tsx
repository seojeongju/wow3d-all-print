'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Loader2, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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

export default function AdminInquiriesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [inquiries, setInquiries] = useState<Record<string, unknown>[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [detailNote, setDetailNote] = useState('')
  const [detailStatus, setDetailStatus] = useState('')
  const [savingDetail, setSavingDetail] = useState(false)

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const url = statusFilter && statusFilter !== 'all' ? `/api/admin/inquiries?status=${statusFilter}` : '/api/admin/inquiries'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setInquiries(data.data || [])
    } catch (e) {
      console.error('Failed to fetch inquiries', e)
      toast({ title: '문의 목록 조회 실패', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return inquiries
    return inquiries.filter(
      (i) =>
        (String(i.name || '').toLowerCase().includes(q)) ||
        (String(i.email || '').toLowerCase().includes(q)) ||
        (String(i.message || '').toLowerCase().includes(q))
    )
  }, [inquiries, searchQuery])

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)))
        if (detail?.id === id) setDetail((d) => (d ? { ...d, status: newStatus } : null))
        toast({ title: '상태가 변경되었습니다.' })
      } else {
        toast({ title: json.error || '변경 실패', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: '변경 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const openDetail = (row: Record<string, unknown>) => {
    setDetail(row)
    setDetailNote(String(row.admin_note || ''))
    setDetailStatus(String(row.status || 'new'))
  }

  const handleSaveDetail = async () => {
    if (!detail?.id) return
    setSavingDetail(true)
    try {
      const res = await fetch(`/api/admin/inquiries/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: detailStatus, admin_note: detailNote }),
      })
      const json = await res.json()
      if (json.success) {
        setInquiries((prev) => prev.map((i) => (i.id === detail.id ? { ...i, status: detailStatus, admin_note: detailNote } : i)))
        setDetail((d) => (d ? { ...d, status: detailStatus, admin_note: detailNote } : null))
        toast({ title: '저장되었습니다.' })
      } else {
        toast({ title: json.error || '저장 실패', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: '저장 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setSavingDetail(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">문의 관리</h1>
        <p className="text-white/50 text-sm mt-1">접수된 문의를 확인하고 상태·메모를 관리할 수 있습니다.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="search"
            placeholder="이름, 이메일, 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
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

      <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 font-medium text-white/70">이름</th>
                  <th className="p-4 font-medium text-white/70">이메일</th>
                  <th className="p-4 font-medium text-white/70">유형</th>
                  <th className="p-4 font-medium text-white/70">내용</th>
                  <th className="p-4 font-medium text-white/70">상태</th>
                  <th className="p-4 font-medium text-white/70">날짜</th>
                  <th className="p-4 font-medium text-white/70">상태 변경</th>
                  <th className="p-4 font-medium text-white/70"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inq) => (
                  <tr key={inq.id as number} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-white">{String(inq.name || '-')}</td>
                    <td className="p-4 text-white/90">{String(inq.email || '-')}</td>
                    <td className="p-4 text-white/50">{CATEGORY_LABELS[String(inq.category || '')] || '-'}</td>
                    <td className="p-4 text-white/60 max-w-[200px] truncate" title={String(inq.message || '')}>
                      {String(inq.message || '').slice(0, 60)}
                      {(String(inq.message || '').length || 0) > 60 ? '…' : ''}
                    </td>
                    <td className="p-4">{getStatusBadge(String(inq.status || 'new'))}</td>
                    <td className="p-4 text-white/50">
                      {inq.created_at ? new Date(String(inq.created_at)).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="p-4">
                      <Select
                        value={String(inq.status || 'new')}
                        onValueChange={(v) => handleStatusChange(Number(inq.id), v)}
                        disabled={updatingId === inq.id}
                      >
                        <SelectTrigger className="w-[110px] h-8 bg-white/5 border-white/10 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {updatingId === inq.id && <Loader2 className="w-3 h-3 animate-spin inline-block ml-1 text-primary" />}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/50 hover:text-white hover:bg-white/10 h-8"
                        onClick={() => openDetail(inq)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-white/40">
                      {inquiries.length === 0 ? '접수된 문의가 없습니다.' : '검색 결과가 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-white">문의 상세</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">제목</span>
                <p className="text-sm text-white/90">{String(detail.subject || '-')}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">문의 내용</span>
                <p className="text-sm text-white/80 whitespace-pre-wrap mt-1">{String(detail.message || '')}</p>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">관리자 메모</Label>
                <textarea
                  value={detailNote}
                  onChange={(e) => setDetailNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 resize-y"
                  placeholder="내부 메모"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">상태</Label>
                <Select value={detailStatus} onValueChange={setDetailStatus}>
                  <SelectTrigger className="mt-1 w-full bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" className="border-white/10 text-white" onClick={() => setDetail(null)}>
              닫기
            </Button>
            <Button onClick={handleSaveDetail} disabled={savingDetail}>
              {savingDetail ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
