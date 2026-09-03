'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Loader2,
    Download,
    Box,
    ImageIcon,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ExternalLink,
} from 'lucide-react'
import { showToast } from '@/lib/toast-helper'
import {
    getCachedAdminJobThumbnail,
    runAdminThumbnailTask,
    setCachedAdminJobThumbnail,
    withThumbnailTimeout,
} from '@/lib/admin-meshy-thumbnail-cache'
import { generateModelThumbnail } from '@/lib/modelThumbnail'
import { cn } from '@/lib/utils'
import AdminMeshyUserPicker, { type MeshyUserOption } from '@/components/admin/AdminMeshyUserPicker'

const AdminMeshyStlPreview = dynamic(() => import('@/components/admin/AdminMeshyStlPreview'), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-[280px] items-center justify-center gap-2 text-white/50">
            <Loader2 className="h-5 w-5 animate-spin" />
            뷰어 준비 중…
        </div>
    ),
})

export type AdminMeshyJob = {
    id: number
    userId: number | null
    sessionId: string | null
    status: string
    progress: number | null
    creditsUsed: number | null
    errorMessage: string | null
    sourceFileName: string | null
    resultFileName: string | null
    hasSource: boolean
    hasModel: boolean
    thumbnailUrl: string | null
    quoteId: number | null
    orderId: number | null
    orderNumber: string | null
    createdAt: string
    updatedAt: string
    userEmail: string | null
    userName: string | null
}

type StatusFilter = 'all' | 'succeeded' | 'failed' | 'in_progress' | 'canceled'

type Props = {
    token: string | null
}

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'succeeded', label: '성공' },
    { id: 'in_progress', label: '진행중' },
    { id: 'failed', label: '실패' },
    { id: 'canceled', label: '취소' },
]

function statusBadgeClass(status: string): string {
    if (status === 'succeeded') return 'bg-emerald-500/15 text-emerald-300'
    if (status === 'failed') return 'bg-red-500/15 text-red-300'
    if (status === 'canceled') return 'bg-white/10 text-white/50'
    return 'bg-amber-500/15 text-amber-200'
}

function userLabel(j: AdminMeshyJob): string {
    return j.userName || j.userEmail || (j.userId != null ? `회원 #${j.userId}` : '게스트')
}

async function fetchAuthedBlob(
    url: string,
    token: string | null
): Promise<{ blob: Blob; fileName: string | null }> {
    const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
    })
    if (!res.ok) {
        let msg = '파일 요청 실패'
        try {
            const json = (await res.json()) as { error?: string }
            if (json.error) msg = json.error
        } catch {
            /* ignore */
        }
        throw new Error(msg)
    }
    const cd = res.headers.get('Content-Disposition') || ''
    const m = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(cd)
    const fileName = m ? decodeURIComponent(m[1] || m[2] || '') : null
    const blob = await res.blob()
    return { blob, fileName }
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
}

async function persistAdminJobThumbnail(
    jobId: number,
    dataUrl: string,
    token: string | null
): Promise<void> {
    await fetch(`/api/admin/meshy/jobs/${jobId}/thumbnail`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ dataUrl }),
    })
}

async function renderStlThumbnailFromJob(
    job: AdminMeshyJob,
    token: string | null
): Promise<string | null> {
    if (!job.hasModel) return null
    const { blob, fileName } = await fetchAuthedBlob(
        `/api/admin/meshy/jobs/${job.id}/file?type=model&disposition=inline`,
        token
    )
    const stlName = fileName || job.resultFileName || `ai-photo-${job.id}.stl`
    const file = new File([await blob.arrayBuffer()], stlName, {
        type: 'model/stl',
    })
    return generateModelThumbnail(file, 320)
}

function AdminJobThumbnail({ job, token }: { job: AdminMeshyJob; token: string | null }) {
    const rootRef = useRef<HTMLDivElement>(null)
    const [url, setUrl] = useState<string | null>(() => getCachedAdminJobThumbnail(job.id) ?? null)
    const [failed, setFailed] = useState(false)
    const [loading, setLoading] = useState(() => !getCachedAdminJobThumbnail(job.id))
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) setVisible(true)
            },
            { rootMargin: '80px' }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    useEffect(() => {
        if (!visible) return

        const cached = getCachedAdminJobThumbnail(job.id)
        if (cached) {
            setUrl(cached)
            setLoading(false)
            setFailed(false)
            return
        }

        let objectUrl: string | null = null
        let cancelled = false

        const loadStoredStlThumbnail = async (): Promise<string | null> => {
            try {
                const { blob } = await withThumbnailTimeout(
                    fetchAuthedBlob(
                        `/api/admin/meshy/jobs/${job.id}/file?type=thumbnail&kind=stl`,
                        token
                    ),
                    8_000
                )
                objectUrl = URL.createObjectURL(blob)
                return objectUrl
            } catch {
                return null
            }
        }

        const loadStlThumbnail = async (): Promise<string | null> => {
            return runAdminThumbnailTask(async () => {
                if (cancelled) return null
                return withThumbnailTimeout(renderStlThumbnailFromJob(job, token), 18_000)
            })
        }

        const load = async () => {
            setFailed(false)
            setLoading(true)

            const stored = await loadStoredStlThumbnail()
            if (cancelled) return
            if (stored) {
                setCachedAdminJobThumbnail(job.id, stored)
                setUrl(stored)
                return
            }

            try {
                const dataUrl = await loadStlThumbnail()
                if (cancelled) return
                if (dataUrl) {
                    setCachedAdminJobThumbnail(job.id, dataUrl)
                    setUrl(dataUrl)
                    void persistAdminJobThumbnail(job.id, dataUrl, token).catch(() => {})
                    return
                }
            } catch {
                /* STL 렌더 실패 */
            }

            setUrl(null)
            setFailed(true)
        }

        void load().finally(() => {
            if (!cancelled) setLoading(false)
        })

        return () => {
            cancelled = true
            if (objectUrl && getCachedAdminJobThumbnail(job.id) !== objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [visible, job.id, job.hasModel, job.resultFileName, token])

    const handleImgError = () => {
        if (!job.hasModel) {
            setFailed(true)
            setUrl(null)
            return
        }
        setUrl(null)
        setLoading(true)
        setFailed(false)
        void (async () => {
            try {
                const dataUrl = await runAdminThumbnailTask(() =>
                    withThumbnailTimeout(renderStlThumbnailFromJob(job, token), 20_000)
                )
                if (dataUrl) {
                    setCachedAdminJobThumbnail(job.id, dataUrl)
                    setUrl(dataUrl)
                    void persistAdminJobThumbnail(job.id, dataUrl, token).catch(() => {})
                } else setFailed(true)
            } catch {
                setFailed(true)
            } finally {
                setLoading(false)
            }
        })()
    }

    return (
        <div ref={rootRef} className="absolute inset-0 bg-[#0b1220]">
            {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={url}
                    alt={`AI 3D #${job.id}`}
                    className="absolute inset-0 h-full w-full object-contain bg-[#0b1220]"
                    referrerPolicy="no-referrer"
                    onError={handleImgError}
                />
            ) : loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-white/40">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </div>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-white/30">
                    <Box className="w-6 h-6" />
                    <span className="text-[10px] font-bold">
                        {failed ? '3D 미리보기 생성 실패' : '썸네일 없음'}
                    </span>
                </div>
            )}
        </div>
    )
}

export default function AdminMeshyJobsPanel({ token }: Props) {
    const [status, setStatus] = useState<StatusFilter>('succeeded')
    const [page, setPage] = useState(1)
    const [q, setQ] = useState('')
    const [qApplied, setQApplied] = useState('')
    const [filterUser, setFilterUser] = useState<MeshyUserOption | null>(null)
    const [loading, setLoading] = useState(true)
    const [jobs, setJobs] = useState<AdminMeshyJob[]>([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    const [previewJob, setPreviewJob] = useState<AdminMeshyJob | null>(null)
    const [previewBuffer, setPreviewBuffer] = useState<ArrayBuffer | null>(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewError, setPreviewError] = useState<string | null>(null)

    const [sourceJob, setSourceJob] = useState<AdminMeshyJob | null>(null)
    const [sourceUrl, setSourceUrl] = useState<string | null>(null)
    const [sourceLoading, setSourceLoading] = useState(false)

    const [busyId, setBusyId] = useState<number | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                status,
                page: String(page),
                limit: '15',
            })
            if (qApplied) params.set('q', qApplied)
            if (filterUser?.id) params.set('userId', String(filterUser.id))

            const res = await fetch(`/api/admin/meshy/jobs?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            })
            const json = await res.json()
            if (!res.ok || !json.success) {
                showToast.error('생성 목록', json.error || '불러오기 실패')
                return
            }
            setJobs(json.data.jobs)
            setTotal(json.data.total)
            setTotalPages(json.data.totalPages)
        } catch {
            showToast.error('생성 목록', '네트워크 오류')
        } finally {
            setLoading(false)
        }
    }, [token, status, page, qApplied, filterUser?.id])

    useEffect(() => {
        void load()
    }, [load])

    useEffect(() => {
        setPage(1)
    }, [status, qApplied, filterUser?.id])

    useEffect(() => {
        return () => {
            if (sourceUrl) URL.revokeObjectURL(sourceUrl)
        }
    }, [sourceUrl])

    const openSource = async (job: AdminMeshyJob) => {
        if (!job.hasSource) return
        setSourceLoading(true)
        setSourceJob(job)
        if (sourceUrl) {
            URL.revokeObjectURL(sourceUrl)
            setSourceUrl(null)
        }
        try {
            const { blob } = await fetchAuthedBlob(
                `/api/admin/meshy/jobs/${job.id}/file?type=source`,
                token
            )
            setSourceUrl(URL.createObjectURL(blob))
        } catch (e) {
            showToast.error('원본 사진', e instanceof Error ? e.message : '불러오기 실패')
            setSourceJob(null)
        } finally {
            setSourceLoading(false)
        }
    }

    const openPreview = async (job: AdminMeshyJob) => {
        if (!job.hasModel) return
        setPreviewJob(job)
        setPreviewBuffer(null)
        setPreviewError(null)
        setPreviewLoading(true)
        try {
            const { blob } = await fetchAuthedBlob(
                `/api/admin/meshy/jobs/${job.id}/file?type=model&disposition=inline`,
                token
            )
            const buf = await blob.arrayBuffer()
            setPreviewBuffer(buf)
        } catch (e) {
            setPreviewError(e instanceof Error ? e.message : '모델 불러오기 실패')
        } finally {
            setPreviewLoading(false)
        }
    }

    const downloadModel = async (job: AdminMeshyJob) => {
        if (!job.hasModel) return
        setBusyId(job.id)
        try {
            const { blob, fileName } = await fetchAuthedBlob(
                `/api/admin/meshy/jobs/${job.id}/file?type=model`,
                token
            )
            downloadBlob(blob, fileName || job.resultFileName || `meshy-${job.id}.stl`)
            showToast.success('STL 다운로드', `#${job.id}`)
        } catch (e) {
            showToast.error('STL 다운로드', e instanceof Error ? e.message : '실패')
        } finally {
            setBusyId(null)
        }
    }

    const applySearch = () => {
        setQApplied(q.trim())
    }

    return (
        <>
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-black text-white flex items-center gap-2">
                                <Box className="w-4 h-4 text-indigo-300" />
                                사용자 생성 3D 모델
                            </h2>
                            <p className="text-[11px] text-white/40 font-bold mt-1 break-keep">
                                사진(이미지)→AI 3D로 생성된 STL·원본 사진을 확인하고 다운로드합니다.
                                견적·주문 연결 여부도 함께 표시됩니다.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void load()}
                            disabled={loading}
                            className="shrink-0"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            <span className="ml-1.5">새로고침</span>
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {STATUS_TABS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setStatus(t.id)}
                                className={cn(
                                    'rounded-md px-3 py-1.5 text-[11px] font-black transition-colors',
                                    status === t.id
                                        ? 'bg-indigo-500/25 text-indigo-200'
                                        : 'bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/70'
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[1fr_minmax(14rem,20rem)]">
                        <div className="flex flex-wrap gap-2 items-end">
                            <div className="space-y-1 flex-1 min-w-[12rem]">
                                <label className="text-[10px] font-black uppercase tracking-wider text-white/40 px-0.5">
                                    검색
                                </label>
                                <Input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') applySearch()
                                    }}
                                    placeholder="작업 ID · 이메일 · 파일명"
                                    className="bg-black/40 border-white/15"
                                />
                            </div>
                            <Button type="button" variant="secondary" onClick={applySearch}>
                                검색
                            </Button>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-white/40 px-0.5">
                                회원 필터 (선택)
                            </label>
                            <AdminMeshyUserPicker
                                token={token}
                                value={filterUser?.id ?? null}
                                onChange={setFilterUser}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <p className="text-[11px] text-white/35 font-bold">
                        총 {total}건 · {page}/{totalPages} 페이지
                    </p>

                    {loading && jobs.length === 0 ? (
                        <div className="flex items-center gap-2 text-white/50 py-8 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            불러오는 중…
                        </div>
                    ) : jobs.length === 0 ? (
                        <p className="text-white/40 text-sm py-8 text-center">조건에 맞는 작업이 없습니다.</p>
                    ) : (
                        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {jobs.map((j) => (
                                <div
                                    key={j.id}
                                    className="rounded-lg border border-white/10 bg-black/25 overflow-hidden flex flex-col"
                                >
                                    <div className="relative aspect-square bg-black/50">
                                        <AdminJobThumbnail job={j} token={token} />
                                        <span
                                            className={cn(
                                                'absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-black',
                                                statusBadgeClass(j.status)
                                            )}
                                        >
                                            {j.status}
                                            {j.progress != null &&
                                            j.status !== 'succeeded' &&
                                            j.status !== 'failed'
                                                ? ` ${j.progress}%`
                                                : ''}
                                        </span>
                                    </div>

                                    <div className="p-2 space-y-1 flex-1 flex flex-col min-w-0">
                                        <div className="flex items-baseline justify-between gap-1">
                                            <span className="font-mono text-[11px] font-black text-white">
                                                #{j.id}
                                            </span>
                                            <span className="text-[9px] text-white/40 whitespace-nowrap">
                                                {j.createdAt}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-white/80 truncate">
                                            {userLabel(j)}
                                            {j.userId != null && (
                                                <span className="text-white/35 ml-0.5">#{j.userId}</span>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-white/45 truncate">
                                            {j.sourceFileName || j.resultFileName || '—'}
                                        </p>
                                        {j.errorMessage && (
                                            <p className="text-[10px] text-red-300/80 line-clamp-1">
                                                {j.errorMessage}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                                            {j.quoteId != null ? (
                                                <span className="rounded bg-white/8 px-1.5 py-0.5 text-white/60">
                                                    견적 #{j.quoteId}
                                                </span>
                                            ) : (
                                                <span className="rounded bg-white/5 px-1.5 py-0.5 text-white/35">
                                                    견적 미연결
                                                </span>
                                            )}
                                            {j.orderId != null && (
                                                <Link
                                                    href={`/admin/orders?detail=${j.orderId}`}
                                                    className="rounded bg-teal-500/15 px-1.5 py-0.5 text-teal-200 inline-flex items-center gap-0.5 hover:bg-teal-500/25"
                                                >
                                                    주문 {j.orderNumber || `#${j.orderId}`}
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            )}
                                            {j.creditsUsed != null && (
                                                <span className="rounded bg-white/5 px-1.5 py-0.5 text-white/40">
                                                    {j.creditsUsed} cr
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-1.5 flex flex-wrap gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                disabled={!j.hasSource || sourceLoading}
                                                onClick={() => void openSource(j)}
                                                className="h-7 px-2 text-[10px]"
                                            >
                                                <ImageIcon className="w-3 h-3 mr-0.5" />
                                                원본
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                disabled={!j.hasModel || previewLoading}
                                                onClick={() => void openPreview(j)}
                                                className="h-7 px-2 text-[10px]"
                                            >
                                                <Box className="w-3 h-3 mr-0.5" />
                                                미리보기
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={!j.hasModel || busyId === j.id}
                                                onClick={() => void downloadModel(j)}
                                                className="h-7 px-2 text-[10px]"
                                            >
                                                {busyId === j.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin mr-0.5" />
                                                ) : (
                                                    <Download className="w-3 h-3 mr-0.5" />
                                                )}
                                                STL
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-[12px] font-bold text-white/50">
                                {page} / {totalPages}
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={previewJob != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewJob(null)
                        setPreviewBuffer(null)
                        setPreviewError(null)
                    }
                }}
            >
                <DialogContent className="max-w-3xl bg-[#0f1419] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="font-black">
                            3D 미리보기 {previewJob ? `#${previewJob.id}` : ''}
                        </DialogTitle>
                    </DialogHeader>
                    {previewJob && (
                        <div className="space-y-3">
                            <p className="text-[12px] text-white/50 font-bold">
                                {userLabel(previewJob)}
                                {previewJob.resultFileName
                                    ? ` · ${previewJob.resultFileName}`
                                    : ''}
                            </p>
                            <AdminMeshyStlPreview
                                buffer={previewBuffer}
                                loading={previewLoading}
                                error={previewError}
                            />
                            {previewJob.hasModel && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => void downloadModel(previewJob)}
                                    disabled={busyId === previewJob.id}
                                >
                                    <Download className="w-3.5 h-3.5 mr-1" />
                                    STL 다운로드
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={sourceJob != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSourceJob(null)
                        if (sourceUrl) {
                            URL.revokeObjectURL(sourceUrl)
                            setSourceUrl(null)
                        }
                    }
                }}
            >
                <DialogContent className="max-w-2xl bg-[#0f1419] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="font-black">
                            원본 사진 {sourceJob ? `#${sourceJob.id}` : ''}
                        </DialogTitle>
                    </DialogHeader>
                    {sourceLoading ? (
                        <div className="flex min-h-[240px] items-center justify-center gap-2 text-white/50">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            불러오는 중…
                        </div>
                    ) : sourceUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={sourceUrl}
                            alt={sourceJob?.sourceFileName || 'source'}
                            className="max-h-[70vh] w-full object-contain rounded-lg bg-black/40"
                        />
                    ) : (
                        <p className="text-sm text-white/40 py-8 text-center">이미지를 불러올 수 없습니다</p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
