'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone } from 'lucide-react'

export default function AdminProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">내 정보</h1>
        <p className="text-white/50 text-sm mt-1">관리자 계정 정보입니다.</p>
      </div>

      <Card className="bg-white/[0.03] border-white/10 max-w-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            프로필
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <User className="w-3 h-3" /> 이름
            </label>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white">{user?.name || '-'}</div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Mail className="w-3 h-3" /> 이메일
            </label>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white">{user?.email || '-'}</div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Phone className="w-3 h-3" /> 전화번호
            </label>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white">{user?.phone || '등록되지 않음'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
