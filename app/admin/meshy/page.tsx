'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Sparkles, Gift, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { showToast } from '@/lib/toast-helper'
import AdminMeshyUserPicker, { type MeshyUserOption } from '@/components/admin/AdminMeshyUserPicker'
import AdminMeshyJobsPanel from '@/components/admin/AdminMeshyJobsPanel'
import { cn } from '@/lib/utils'

type RecentJob = {
    id: number
    user_id: number | null
    status: string
    progress: number | null
    credits_used: number | null
    error_message: string | null
    source_file_name: string | null
    created_at: string
    user_email: string | null
    user_name: string | null
}

type RecentPagination = { page: number; limit: number; total: number; totalPages: number }

type Stats = {
    today: { total: number; succeeded: number; failed: number; inProgress: number; credits: number }
    week: { total: number; succeeded: number; failed: number; credits: number }
    bonusOutstanding: number
    recent: RecentJob[]
    recentSuggestions?: RecentJob[]
    recentPagination?: RecentPagination
}

const RECENT_PAGE_SIZE = 20

function recentToSuggestions(recent: RecentJob[]): MeshyUserOption[] {
    const map = new Map<number, MeshyUserOption>()
    for (const j of recent) {
        if (j.user_id == null || map.has(j.user_id)) continue
        map.set(j.user_id, {
            id: j.user_id,
            email: j.user_email || '',
            name: j.user_name,
        })
    }
    return Array.from(map.values())
}

export default function AdminMeshyPage() {
    const { token } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<Stats | null>(null)
    const [selectedUser, setSelectedUser] = useState<MeshyUserOption | null>(null)
    const [amount, setAmount] = useState('1')
    const [note, setNote] = useState('')
    const [granting, setGranting] = useState(false)
    const [recentPage, setRecentPage] = useState(1)

    const quickSuggestions = useMemo(
        () => (stats ? recentToSuggestions(stats.recentSuggestions ?? stats.recent) : []),
        [stats]
    )

    const recentPagination = stats?.recentPagination
    const recentTotalPages = recentPagination?.totalPages ?? 1
    const recentTotal = recentPagination?.total ?? stats?.recent.length ?? 0

    const load = useCallback(async (page: number) => {
        setLoading(true)
        try {
            const qs = new URLSearchParams({
                recentPage: String(page),
                recentLimit: String(RECENT_PAGE_SIZE),
            })
            const res = await fetch(`/api/admin/meshy/stats?${qs}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            })
            const json = await res.json()
            if (!res.ok || !json.success) {
                showToast.error('통계', json.error || '불러오기 실패')
                return
            }
            setStats(json.data)
        } catch {
            showToast.error('통계', '네트워크 오류')
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        void load(recentPage)
    }, [load, recentPage])

    const grant = async () => {
        const uid = selectedUser?.id
        const n = Number(amount)
        if (!uid || !Number.isInteger(uid) || uid < 1) {
            showToast.error('보너스', '부여할 회원을 검색해서 선택하세요')
            return
        }
        setGranting(true)
        try {
            const res = await fetch('/api/admin/meshy/bonus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ userId: uid, amount: n, note: note.trim() || undefined }),
            })
            const json = await res.json()
            if (!res.ok || !json.success) {
                showToast.error('보너스', json.error || '부여 실패')
                return
            }
            showToast.success(
                '보너스 부여',
                `${json.data.user.email}에게 ${json.data.granted}회 추가 (잔여 보너스 ${json.data.quota.bonusRemaining})`
            )
            setNote('')
            setSelectedUser({
                ...selectedUser,
                bonusRemaining: json.data.quota.bonusRemaining,
                usedToday: json.data.quota.usedToday,
                remainingDaily: json.data.quota.remainingDaily,
                remainingTotal: json.data.quota.remainingTotal,
            })
            await load(recentPage)
        } catch {
            showToast.error('보너스', '네트워크 오류')
        } finally {
            setGranting(false)
        }
    }

    const pickFromRecent = (j: RecentJob) => {
        if (j.user_id == null) return
        setSelectedUser({
            id: j.user_id,
            email: j.user_email || '',
            name: j.user_name,
        })
    }

    const failRate = (s: { total: number; failed: number }) =>
        s.total > 0 ? Math.round((s.failed / s.total) * 100) : 0

    return (
        <div className="space-y-6 p-4 md:p-8">
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    사진(이미지)→AI 3D
                </h1>
                <p className="text-sm text-white/50 font-bold mt-1">
                    사용량 · 생성 모델 확인 · Meshy 크레딧 · 추가 생성 횟수 부여
                </p>
            </div>

            <AdminMeshyJobsPanel token={token} />

            {loading && !stats ? (
                <div className="flex items-center gap-2 text-white/50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    불러오는 중…
                </div>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { label: '오늘 요청', value: stats.today.total },
                            { label: '오늘 성공', value: stats.today.succeeded },
                            { label: '오늘 실패율', value: `${failRate(stats.today)}%` },
                            { label: '오늘 Meshy credits', value: stats.today.credits },
                            { label: '7일 요청', value: stats.week.total },
                            { label: '7일 성공', value: stats.week.succeeded },
                            { label: '7일 실패율', value: `${failRate(stats.week)}%` },
                            { label: '미사용 보너스', value: stats.bonusOutstanding },
                        ].map((c) => (
                            <Card key={c.label} className="bg-white/5 border-white/10">
                                <CardContent className="p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                        {c.label}
                                    </p>
                                    <p className="text-2xl font-black text-white mt-1">{c.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-5 space-y-4">
                            <h2 className="text-sm font-black text-white flex items-center gap-2">
                                <Gift className="w-4 h-4 text-teal-300" />
                                추가 생성 횟수 부여
                            </h2>
                            <p className="text-[12px] text-white/50 font-bold break-keep">
                                일일 1회를 쓴 회원에게 보너스 횟수를 줍니다. 이메일·이름·연락처·회원 ID로
                                검색하거나, 아래 최근 작업 목록에서 회원을 클릭해 선택할 수 있습니다.
                            </p>

                            <AdminMeshyUserPicker
                                token={token}
                                value={selectedUser?.id ?? null}
                                onChange={setSelectedUser}
                                suggestions={quickSuggestions}
                                disabled={granting}
                            />

                            <div className="flex flex-wrap items-end gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40 px-0.5">
                                        부여 횟수
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-24 bg-black/40 border-white/15"
                                    />
                                </div>
                                <div className="space-y-1 flex-1 min-w-[10rem]">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40 px-0.5">
                                        메모 (선택)
                                    </label>
                                    <Input
                                        placeholder="예: CS 요청 · 이벤트 당첨"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="bg-black/40 border-white/15"
                                    />
                                </div>
                                <Button type="button" onClick={grant} disabled={granting || !selectedUser}>
                                    {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : '부여'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-5 overflow-x-auto relative">
                            {loading && stats && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-[1px] rounded-lg">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                            <h2 className="text-sm font-black text-white mb-1">최근 작업</h2>
                            <p className="text-[11px] text-white/40 font-bold mb-3">
                                행을 클릭하면 해당 회원이 보너스 부여 대상으로 선택됩니다.
                            </p>
                            <table className="w-full text-left text-[12px]">
                                <thead className="text-white/40 font-black">
                                    <tr>
                                        <th className="py-2 pr-3">ID</th>
                                        <th className="py-2 pr-3">회원</th>
                                        <th className="py-2 pr-3">상태</th>
                                        <th className="py-2 pr-3">credits</th>
                                        <th className="py-2 pr-3">시각</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent.map((j) => {
                                        const isSelected =
                                            j.user_id != null && selectedUser?.id === j.user_id
                                        return (
                                            <tr
                                                key={j.id}
                                                role={j.user_id != null ? 'button' : undefined}
                                                tabIndex={j.user_id != null ? 0 : undefined}
                                                onClick={() => pickFromRecent(j)}
                                                onKeyDown={(e) => {
                                                    if (j.user_id != null && (e.key === 'Enter' || e.key === ' ')) {
                                                        e.preventDefault()
                                                        pickFromRecent(j)
                                                    }
                                                }}
                                                className={cn(
                                                    'border-t border-white/5 text-white/80 transition-colors',
                                                    j.user_id != null &&
                                                        'cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:outline-none',
                                                    isSelected && 'bg-teal-500/10'
                                                )}
                                            >
                                                <td className="py-2 pr-3 font-mono">#{j.id}</td>
                                                <td className="py-2 pr-3">
                                                    {j.user_name || j.user_email || j.user_id || '-'}
                                                    {j.user_id != null && (
                                                        <span className="text-white/35 ml-1">#{j.user_id}</span>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-3">
                                                    {j.status}
                                                    {j.error_message ? (
                                                        <span className="block text-red-300/80 max-w-xs truncate">
                                                            {j.error_message}
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="py-2 pr-3">{j.credits_used ?? '-'}</td>
                                                <td className="py-2 pr-3 whitespace-nowrap">{j.created_at}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {stats.recent.length === 0 && !loading && (
                                <p className="text-white/40 text-sm">아직 작업이 없습니다.</p>
                            )}
                            {recentTotal > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-white/10">
                                    <p className="text-xs text-white/40 font-medium">
                                        총{' '}
                                        <span className="text-white/70 font-bold">
                                            {recentTotal.toLocaleString()}
                                        </span>
                                        건 · {recentPage}/{recentTotalPages} 페이지
                                    </p>
                                    {recentTotalPages > 1 && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                disabled={recentPage <= 1 || loading}
                                                onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                                                aria-label="이전 페이지"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <span className="text-[12px] font-bold text-white/50 min-w-[4rem] text-center">
                                                {recentPage} / {recentTotalPages}
                                            </span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                disabled={recentPage >= recentTotalPages || loading}
                                                onClick={() =>
                                                    setRecentPage((p) => Math.min(recentTotalPages, p + 1))
                                                }
                                                aria-label="다음 페이지"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            ) : null}

            <Button variant="outline" type="button" onClick={() => void load(recentPage)} disabled={loading}>
                새로고침
            </Button>
        </div>
    )
}
