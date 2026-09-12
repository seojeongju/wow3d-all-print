'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Mail, Phone, Pencil, Save, X, Loader2 } from 'lucide-react'

export default function AdminProfilePage() {
  const { user, token, updateUser } = useAuthStore()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      phone: user.phone || '',
    })
  }, [user])

  const startEdit = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
    })
    setEditing(true)
  }

  const cancelEdit = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
    })
    setEditing(false)
  }

  const handleSave = async () => {
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      toast({ title: '이름을 입력해 주세요.', variant: 'destructive' })
      return
    }
    if (!token) {
      toast({ title: '로그인이 필요합니다.', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          phone: form.phone.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast({
          title: '저장 실패',
          description: json.error || '다시 시도해 주세요.',
          variant: 'destructive',
        })
        return
      }

      const next = json.data || {}
      updateUser({
        name: String(next.name ?? trimmedName),
        phone:
          next.phone != null && String(next.phone).trim() !== ''
            ? String(next.phone)
            : undefined,
        updatedAt: String(next.updatedAt ?? next.updated_at ?? user?.updatedAt ?? ''),
      })
      setForm({
        name: String(next.name ?? trimmedName),
        phone: next.phone != null ? String(next.phone) : '',
      })
      setEditing(false)
      toast({ title: '내 정보가 저장되었습니다.' })
    } catch {
      toast({
        title: '오류 발생',
        description: '네트워크 또는 서버 오류일 수 있습니다.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">내 정보</h1>
        <p className="text-white/50 text-sm mt-1">관리자 계정 정보입니다.</p>
      </div>

      <Card className="bg-white/[0.03] border-white/10 max-w-xl">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            프로필
          </CardTitle>
          {!editing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startEdit}
              className="border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              수정
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelEdit}
                disabled={saving}
                className="border-white/15 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                저장
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <User className="w-3 h-3" /> 이름
            </label>
            {editing ? (
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="이름을 입력하세요"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/30"
                maxLength={80}
                autoComplete="name"
              />
            ) : (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white">
                {user?.name || '-'}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Mail className="w-3 h-3" /> 이메일
            </label>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white">
              {user?.email || '-'}
            </div>
            <p className="mt-1.5 text-[11px] text-white/35">로그인 계정으로 사용되며 변경할 수 없습니다.</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Phone className="w-3 h-3" /> 전화번호
            </label>
            {editing ? (
              <Input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="010-0000-0000"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/30"
                maxLength={30}
                inputMode="tel"
                autoComplete="tel"
              />
            ) : (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white">
                {user?.phone || '등록되지 않음'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
