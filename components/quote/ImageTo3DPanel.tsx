'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useDropzone, type FileRejection } from 'react-dropzone'
import {
    ImageIcon,
    Loader2,
    Upload,
    X,
    CheckCircle2,
    AlertTriangle,
    ArrowLeft,
    Sparkles,
    LogIn,
    Eraser,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useFileStore } from '@/store/useFileStore'
import { MESHY_IMAGE_MAX_BYTES, MESHY_USER_DAILY_LIMIT } from '@/lib/meshy'
import { MESHY_AI_DISCLAIMER, MESHY_AI_DISCLAIMER_SHORT } from '@/lib/meshy-disclaimer'
import { preprocessMeshyImage } from '@/lib/meshy-client-preprocess'
import { PhotoTo3DGuide } from '@/components/quote/PhotoTo3DGuide'
import { cn } from '@/lib/utils'

type Props = {
    onBack: () => void
    onModelReady?: () => void
}

type JobStatus =
    | 'idle'
    | 'uploading'
    | 'queued'
    | 'processing'
    | 'ready'
    | 'succeeded'
    | 'failed'
    | 'canceled'

type QuotaInfo = {
    loginRequired: boolean
    limit: number
    usedToday: number
    remainingToday: number
    remainingDaily?: number
    bonusRemaining?: number
    remainingTotal?: number
    resetsHint: string
    configured: boolean
}

type HistoryItem = {
    jobId: number
    status: string
    progress: number
    thumbnailUrl?: string | null
    resultFileName?: string | null
    sourceFileName?: string | null
    modelReady?: boolean
    error?: string | null
    createdAt?: string
}

const LS_JOB_KEY = 'wow3d-meshy-active-job'

function saveActiveJob(jobId: number) {
    try {
        localStorage.setItem(LS_JOB_KEY, String(jobId))
    } catch {
        /* ignore */
    }
}

function clearActiveJob() {
    try {
        localStorage.removeItem(LS_JOB_KEY)
    } catch {
        /* ignore */
    }
}

function readActiveJobId(): number | null {
    try {
        const v = localStorage.getItem(LS_JOB_KEY)
        const n = Number(v)
        return Number.isInteger(n) && n > 0 ? n : null
    } catch {
        return null
    }
}

function mapApiStatus(s: string): JobStatus {
    if (s === 'succeeded') return 'ready'
    if (
        s === 'idle' ||
        s === 'uploading' ||
        s === 'queued' ||
        s === 'processing' ||
        s === 'failed' ||
        s === 'canceled' ||
        s === 'ready'
    ) {
        return s
    }
    return 'idle'
}

export default function ImageTo3DPanel({ onBack, onModelReady }: Props) {
    const { token, sessionId, user } = useAuthStore()
    const setFile = useFileStore((s) => s.setFile)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [selected, setSelected] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<JobStatus>('idle')
    const [progress, setProgress] = useState(0)
    const [jobId, setJobId] = useState<number | null>(null)
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
    const [resultFileName, setResultFileName] = useState<string | null>(null)
    const [quota, setQuota] = useState<QuotaInfo | null>(null)
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [enhanceContrast, setEnhanceContrast] = useState(true)
    const [useRemoveBg, setUseRemoveBg] = useState(false)
    const [quality, setQuality] = useState<'fast' | 'standard'>('standard')
    const [extraViews, setExtraViews] = useState<{
        right: File | null
        back: File | null
        left: File | null
    }>({ right: null, back: null, left: null })
    const [extraPreview, setExtraPreview] = useState<{
        right: string | null
        back: string | null
        left: string | null
    }>({ right: null, back: null, left: null })
    const [previewThumbs, setPreviewThumbs] = useState<{
        front?: string
        right?: string
        back?: string
        left?: string
    } | null>(null)
    const [removeBgConfigured, setRemoveBgConfigured] = useState(false)
    const [applying, setApplying] = useState(false)
    const [resuming, setResuming] = useState(true)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const resumeDone = useRef(false)
    const autoApplyJobRef = useRef<number | null>(null)

    const authHeaders = useCallback((): HeadersInit => {
        const h: HeadersInit = {}
        if (token) {
            h.Authorization = `Bearer ${token}`
            if (user?.id) h['X-User-ID'] = String(user.id)
        } else if (sessionId) {
            h['X-Session-ID'] = sessionId
        }
        return h
    }, [token, sessionId, user?.id])

    const clearPoll = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }

    const refreshQuota = useCallback(async () => {
        try {
            const res = await fetch('/api/meshy/quota', {
                headers: authHeaders(),
                cache: 'no-store',
            })
            const json = await res.json()
            if (res.ok && json.success && json.data) {
                setQuota(json.data as QuotaInfo)
            }
        } catch {
            /* ignore */
        }
    }, [authHeaders])

    const refreshHistory = useCallback(async () => {
        if (!token) {
            setHistory([])
            return
        }
        try {
            const res = await fetch('/api/meshy/jobs?limit=8', {
                headers: authHeaders(),
                cache: 'no-store',
            })
            const json = await res.json()
            if (res.ok && json.success) {
                setHistory((json.data?.items as HistoryItem[]) || [])
            }
        } catch {
            /* ignore */
        }
    }, [authHeaders, token])

    useEffect(() => {
        refreshQuota()
        refreshHistory()
    }, [refreshQuota, refreshHistory, token])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const res = await fetch('/api/maker/remove-bg', {
                    headers: authHeaders(),
                    cache: 'no-store',
                })
                const json = await res.json()
                if (!cancelled && json?.configured) setRemoveBgConfigured(true)
            } catch {
                /* ignore */
            }
        })()
        return () => {
            cancelled = true
        }
    }, [authHeaders])

    useEffect(() => () => {
        clearPoll()
        if (previewUrl) URL.revokeObjectURL(previewUrl)
    }, [previewUrl])

    const resetLocal = () => {
        clearPoll()
        clearActiveJob()
        setSelected(null)
        setError(null)
        setStatus('idle')
        setProgress(0)
        setJobId(null)
        setThumbnailUrl(null)
        setResultFileName(null)
        setPreviewThumbs(null)
        setApplying(false)
        setExtraViews({ right: null, back: null, left: null })
        setExtraPreview((prev) => {
            Object.values(prev).forEach((u) => {
                if (u) URL.revokeObjectURL(u)
            })
            return { right: null, back: null, left: null }
        })
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        autoApplyJobRef.current = null
    }

    const applyModel = useCallback(
        async (id: number, fileName: string) => {
            setApplying(true)
            try {
                const res = await fetch(`/api/meshy/jobs/${id}/model`, {
                    headers: authHeaders(),
                    cache: 'no-store',
                })
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}))
                    throw new Error((j as { error?: string }).error || '모델 다운로드 실패')
                }
                const blob = await res.blob()
                if (!blob.size) {
                    throw new Error('다운로드된 모델 파일이 비어 있습니다. 다시 시도해 주세요.')
                }
                const file = new File([blob], fileName || `meshy-${id}.stl`, { type: 'model/stl' })
                setFile(file, { kind: 'meshy-photo', meshyJobId: id })
                clearActiveJob()
                setStatus('succeeded')
                await refreshQuota()
                await refreshHistory()
                onModelReady?.()
            } finally {
                setApplying(false)
            }
        },
        [authHeaders, onModelReady, refreshHistory, refreshQuota, setFile]
    )

    const tryAutoApplyWhenReady = useCallback(
        async (id: number, fileName: string) => {
            if (autoApplyJobRef.current === id) return
            autoApplyJobRef.current = id
            setJobId(id)
            setProgress(100)
            setStatus('ready')
            setError(null)
            try {
                await applyModel(id, fileName || `meshy-${id}.stl`)
            } catch (e) {
                autoApplyJobRef.current = null
                setStatus('ready')
                setError(e instanceof Error ? e.message : '모델 적용 실패')
            }
        },
        [applyModel]
    )

    const handleJobPayload = useCallback(
        async (data: {
            status: string
            progress?: number
            thumbnailUrl?: string | null
            thumbnailUrls?: { front?: string; right?: string; back?: string; left?: string } | null
            resultFileName?: string
            modelReady?: boolean
            error?: string
            jobId?: number
        }) => {
            const mapped = mapApiStatus(data.status)
            setProgress(Number(data.progress) || 0)
            if (data.thumbnailUrl) setThumbnailUrl(data.thumbnailUrl)
            if (data.resultFileName) setResultFileName(data.resultFileName)
            if (data.thumbnailUrls) setPreviewThumbs(data.thumbnailUrls)

            if (data.status === 'succeeded' && data.modelReady) {
                clearPoll()
                const id = data.jobId
                if (id) {
                    await tryAutoApplyWhenReady(
                        id,
                        data.resultFileName || `meshy-${id}.stl`
                    )
                } else {
                    setProgress(100)
                    setStatus('ready')
                }
                return
            }
            if (data.status === 'failed' || data.status === 'canceled') {
                clearPoll()
                clearActiveJob()
                setStatus(data.status === 'canceled' ? 'canceled' : 'failed')
                setError(
                    data.error ||
                        (data.status === 'canceled'
                            ? '작업이 취소되었습니다'
                            : 'AI 모델링에 실패했습니다. 횟수는 차감되지 않았으니 다른 사진(이미지)으로 다시 시도해 주세요.')
                )
                await refreshQuota()
                return
            }
            setStatus(mapped === 'ready' ? 'processing' : mapped)
        },
        [refreshQuota, tryAutoApplyWhenReady]
    )

    const pollJob = useCallback(
        (id: number) => {
            clearPoll()
            const tick = async () => {
                try {
                    const res = await fetch(`/api/meshy/jobs/${id}`, {
                        headers: authHeaders(),
                        cache: 'no-store',
                    })
                    const json = await res.json()
                    if (!res.ok || !json.success) {
                        setError(json.error || '상태 조회 실패')
                        setStatus('failed')
                        clearPoll()
                        return
                    }
                    await handleJobPayload(json.data)
                } catch {
                    setError('네트워크 오류로 상태를 확인하지 못했습니다. 잠시 후 자동으로 다시 확인합니다.')
                }
            }
            void tick()
            pollRef.current = setInterval(tick, 3000)
        },
        [authHeaders, handleJobPayload]
    )

    // 진행 중·완료 job 복구
    useEffect(() => {
        if (resumeDone.current) return
        resumeDone.current = true

        let cancelled = false
        ;(async () => {
            if (!token) {
                setResuming(false)
                return
            }
            try {
                const res = await fetch('/api/meshy/jobs/active', {
                    headers: authHeaders(),
                    cache: 'no-store',
                })
                const json = await res.json()
                if (cancelled) return

                const job = json?.data?.job as
                    | {
                          jobId: number
                          status: string
                          progress: number
                          thumbnailUrl?: string | null
                          resultFileName?: string
                          sourceFileName?: string | null
                          modelReady?: boolean
                          error?: string
                      }
                    | null

                const lsId = readActiveJobId()
                const active = job || (lsId ? { jobId: lsId, status: 'processing', progress: 5 } : null)

                if (active?.jobId) {
                    setJobId(active.jobId)
                    saveActiveJob(active.jobId)
                    setProgress(active.progress || 5)
                    if (active.thumbnailUrl) setThumbnailUrl(active.thumbnailUrl)
                    if (active.resultFileName) setResultFileName(active.resultFileName)
                    if (active.sourceFileName && !selected) {
                        setSelected(new File([], active.sourceFileName || `job-${active.jobId}.jpg`))
                    }

                    if (active.status === 'succeeded' && active.modelReady) {
                        await tryAutoApplyWhenReady(
                            active.jobId,
                            active.resultFileName || `meshy-${active.jobId}.stl`
                        )
                    } else if (
                        active.status === 'uploading' ||
                        active.status === 'queued' ||
                        active.status === 'processing'
                    ) {
                        setStatus(mapApiStatus(active.status))
                        pollJob(active.jobId)
                    }
                }
            } catch {
                /* ignore */
            } finally {
                if (!cancelled) setResuming(false)
            }
        })()

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per token
    }, [token])

    const onDrop = useCallback(
        (accepted: File[], rejections: FileRejection[]) => {
            setError(null)
            if (rejections.length) {
                const code = rejections[0]?.errors?.[0]?.code
                setError(
                    code === 'file-too-large'
                        ? '이미지는 최대 8MB까지 가능합니다.'
                        : 'JPG 또는 PNG 이미지만 업로드할 수 있습니다.'
                )
                return
            }
            if (!accepted[0]) return
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            clearPoll()
            clearActiveJob()
            setSelected(accepted[0])
            setPreviewUrl(URL.createObjectURL(accepted[0]))
            setStatus('idle')
            setProgress(0)
            setJobId(null)
            setThumbnailUrl(null)
            setResultFileName(null)
        },
        [previewUrl]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        multiple: false,
        maxSize: MESHY_IMAGE_MAX_BYTES,
        accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
        disabled:
            status === 'uploading' ||
            status === 'queued' ||
            status === 'processing' ||
            status === 'ready' ||
            applying,
        useFsAccessApi: false,
    })

    const prepareImage = async (file: File): Promise<File> => {
        let out = await preprocessMeshyImage(file, { enhanceContrast })

        if (useRemoveBg && removeBgConfigured && token) {
            const fd = new FormData()
            fd.append('image', out)
            const res = await fetch('/api/maker/remove-bg', {
                method: 'POST',
                headers: authHeaders(),
                body: fd,
            })
            if (res.ok) {
                const blob = await res.blob()
                if (blob.size > 0) {
                    out = new File([blob], out.name.replace(/\.[^.]+$/, '') + '-nobg.png', {
                        type: blob.type || 'image/png',
                    })
                }
            } else {
                const j = await res.json().catch(() => ({}))
                const msg = (j as { error?: string }).error
                // 한도 소진 등이면 전처리본으로 계속 진행하되 안내
                if (msg) {
                    setError(`${msg} 배경 없이 전처리된 사진(이미지)으로 생성을 계속합니다.`)
                }
            }
        }
        return out
    }

    const startGeneration = async () => {
        if (!selected || selected.size === 0) {
            setError('사진(이미지)을 다시 업로드해 주세요.')
            return
        }
        if (!token) {
            setError('사진(이미지)→AI 3D는 로그인 후 하루 1회 이용할 수 있습니다.')
            return
        }
        if (quota && !quota.loginRequired && (quota.remainingTotal ?? quota.remainingToday) <= 0) {
            setError(
                `오늘 이용 횟수(${quota.limit}회)를 모두 사용했습니다. ${quota.resetsHint} 또는 3D 파일을 직접 업로드해 주세요.`
            )
            return
        }

        setError(null)
        setStatus('uploading')
        setProgress(2)
        autoApplyJobRef.current = null
        try {
            const prepared = await prepareImage(selected)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(URL.createObjectURL(prepared))
            setSelected(prepared)

            const fd = new FormData()
            fd.append('image', prepared)
            fd.append('quality', quality)
            for (const [key, file] of [
                ['view_right', extraViews.right],
                ['view_back', extraViews.back],
                ['view_left', extraViews.left],
            ] as const) {
                if (file && file.size > 0) {
                    const extraPrep = await preprocessMeshyImage(file, { enhanceContrast })
                    fd.append(key, extraPrep)
                }
            }
            const res = await fetch('/api/meshy/jobs', {
                method: 'POST',
                headers: authHeaders(),
                body: fd,
            })
            const json = await res.json()
            if (!res.ok || !json.success) {
                const code = (json as { code?: string }).code
                if (code === 'LOGIN_REQUIRED') {
                    setError('로그인 후 하루 1회 이용할 수 있습니다. 아래 로그인 버튼을 이용해 주세요.')
                } else if (code === 'DAILY_LIMIT') {
                    setError(
                        (json as { error?: string }).error ||
                            '오늘 이용 횟수(1회)를 모두 사용했습니다. 내일(한국 시간 자정 이후) 다시 시도하거나 3D 파일을 직접 업로드해 주세요.'
                    )
                } else if (code === 'MESHY_NOT_CONFIGURED') {
                    setError('AI 모델링 서비스가 아직 준비되지 않았습니다. 관리자에게 문의해 주세요.')
                } else {
                    setError(json.error || 'AI 모델링 요청에 실패했습니다')
                }
                setStatus('failed')
                await refreshQuota()
                return
            }
            const id = Number(json.data.jobId)
            setJobId(id)
            saveActiveJob(id)
            setStatus('queued')
            setProgress(5)
            if (typeof json.data.remainingTotal === 'number' || typeof json.data.remainingToday === 'number') {
                setQuota((q) =>
                    q
                        ? {
                              ...q,
                              remainingToday: json.data.remainingToday ?? q.remainingToday,
                              remainingDaily: json.data.remainingToday ?? q.remainingDaily,
                              bonusRemaining: json.data.bonusRemaining ?? q.bonusRemaining,
                              remainingTotal:
                                  json.data.remainingTotal ??
                                  (json.data.remainingToday ?? 0) + (json.data.bonusRemaining ?? 0),
                              usedToday: q.limit - (json.data.remainingToday ?? q.remainingToday),
                          }
                        : q
                )
            }
            pollJob(id)
        } catch {
            setError('AI 모델링 요청 중 오류가 발생했습니다')
            setStatus('failed')
        }
    }

    const busy = status === 'uploading' || status === 'queued' || status === 'processing'
    const showDrop = !selected && status !== 'ready' && !busy && !resuming
    const remainingTotal = quota?.remainingTotal ?? quota?.remainingToday ?? 0
    const canGenerate =
        status === 'idle' && !!selected && selected.size > 0 && (!quota || remainingTotal > 0)

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => {
                        if (!busy && !applying) {
                            resetLocal()
                            onBack()
                        }
                    }}
                    disabled={busy || applying}
                    className="inline-flex items-center gap-1.5 text-[12px] font-black text-white/50 hover:text-white transition-colors disabled:opacity-40"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    시작 방식 다시 선택
                </button>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.15]">
                    사진(이미지)으로 <span className="text-indigo-300">3D 만들기</span>
                </h1>
                <p className="text-white/70 text-[13px] sm:text-[15px] font-bold leading-relaxed break-keep">
                    제품·피규어가 잘 보이는 JPG/PNG 실사 사진(이미지)을 올려 주세요. AI가{' '}
                    <strong className="text-white/90">입체 메시</strong>를 만든 뒤 자동견적으로 이어집니다.
                </p>
                <p className="text-[12px] text-white/40 font-bold leading-relaxed break-keep">
                    로고·배지·키캡처럼 실루엣만 돌출하려면{' '}
                    <a href="/#ai-3d-maker" className="text-teal-400 hover:underline">
                        AI 3D Maker(2.5D)
                    </a>
                    를 이용하세요.
                </p>
            </div>

            {/* 남은 횟수 */}
            <div
                className={cn(
                    'flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3',
                    token && remainingTotal > 0
                        ? 'border-indigo-400/30 bg-indigo-500/10'
                        : token && quota && remainingTotal <= 0
                          ? 'border-amber-400/30 bg-amber-500/10'
                          : 'border-white/10 bg-white/[0.03]'
                )}
            >
                <div>
                    <p className="text-[12px] font-black text-white">
                        {!token
                            ? '로그인 후 이용'
                            : quota
                              ? `오늘 남은 횟수 ${quota.remainingDaily ?? quota.remainingToday}/${quota.limit}${
                                    (quota.bonusRemaining || 0) > 0
                                        ? ` · 보너스 ${quota.bonusRemaining}회`
                                        : ''
                                }`
                              : '한도 확인 중…'}
                    </p>
                    <p className="text-[11px] font-bold text-white/50 mt-0.5 break-keep">
                        {quota?.resetsHint ||
                            `계정당 하루 ${MESHY_USER_DAILY_LIMIT}회 · 한국 시간 기준 · 실패 시 미차감`}
                    </p>
                </div>
                {!token && (
                    <Link
                        href={`/auth?return=${encodeURIComponent('/quote?entry=photo')}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-3 text-[12px] font-black text-white"
                    >
                        <LogIn className="w-3.5 h-3.5" />
                        로그인
                    </Link>
                )}
            </div>

            <PhotoTo3DGuide />

            {resuming && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-[13px] font-bold">이전 작업을 확인하는 중…</p>
                </div>
            )}

            {showDrop && (
                <div
                    {...getRootProps()}
                    className={cn(
                        'relative border-2 border-dashed rounded-[2rem] p-8 sm:p-12 min-h-[200px] cursor-pointer',
                        'flex flex-col items-center justify-center text-center transition-all',
                        isDragActive
                            ? 'border-indigo-400 bg-indigo-500/10'
                            : 'border-white/15 hover:border-indigo-400/40 bg-white/[0.02]'
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center mb-5">
                        <Upload className="w-7 h-7 text-indigo-300" />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">제품 사진(이미지) 업로드</h3>
                    <p className="text-sm text-white/45 font-bold max-w-xs leading-relaxed">
                        JPG · PNG · 최대 8MB
                        <br />
                        위 가이드를 참고하면 품질이 좋아집니다
                    </p>
                </div>
            )}

            {(selected || status === 'ready' || busy) && !resuming && (
                <div className="space-y-4">
                    {(previewUrl || thumbnailUrl) && (
                        <div className="relative rounded-[1.75rem] overflow-hidden border border-white/15 bg-black/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={thumbnailUrl || previewUrl || ''}
                                alt="업로드 미리보기"
                                className="w-full max-h-64 object-contain bg-black/40"
                            />
                            {!busy && status !== 'ready' && status !== 'succeeded' && (
                                <button
                                    type="button"
                                    onClick={resetLocal}
                                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white/70 hover:text-white border border-white/10"
                                    aria-label="이미지 제거"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {selected && selected.size > 0 && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <ImageIcon className="w-5 h-5 text-indigo-300 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-white truncate">{selected.name}</p>
                                <p className="text-[11px] font-bold text-white/40">
                                    {(selected.size / 1024).toFixed(0)} KB
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'idle' && token && selected && selected.size > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-white/40">
                                멀티뷰 (선택)
                            </p>
                            <p className="text-[11px] font-bold text-white/50 leading-relaxed break-keep">
                                같은 물체의 <strong className="text-white/70">우측·뒷면·좌측</strong> 사진(이미지)을
                                더하면 뒷면·옆면 품질이 좋아집니다. 정면만으로도 생성할 수 있습니다.
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {(
                                    [
                                        { id: 'right' as const, label: '우측' },
                                        { id: 'back' as const, label: '뒷면' },
                                        { id: 'left' as const, label: '좌측' },
                                    ]
                                ).map((v) => (
                                    <label
                                        key={v.id}
                                        className="relative flex flex-col items-center justify-center min-h-[5.5rem] rounded-xl border border-dashed border-white/20 bg-black/20 cursor-pointer hover:border-indigo-400/40 overflow-hidden"
                                    >
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                                            className="sr-only"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0]
                                                if (!f) return
                                                setExtraPreview((prev) => {
                                                    if (prev[v.id]) URL.revokeObjectURL(prev[v.id] as string)
                                                    return { ...prev, [v.id]: URL.createObjectURL(f) }
                                                })
                                                setExtraViews((prev) => ({ ...prev, [v.id]: f }))
                                            }}
                                        />
                                        {extraPreview[v.id] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={extraPreview[v.id] || ''}
                                                alt={v.label}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-[11px] font-black text-white/50">{v.label}</span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {status === 'idle' && token && (
                        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[11px] font-black uppercase tracking-widest text-white/40">
                                품질 · 전처리
                            </p>
                            <div className="flex gap-1.5">
                                {(
                                    [
                                        { id: 'fast' as const, label: '빠름' },
                                        { id: 'standard' as const, label: '표준' },
                                    ]
                                ).map((q) => (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => setQuality(q.id)}
                                        className={cn(
                                            'h-8 px-3 rounded-lg border text-[11px] font-black',
                                            quality === q.id
                                                ? 'bg-indigo-500 border-indigo-400 text-white'
                                                : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'
                                        )}
                                    >
                                        {q.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] font-bold text-white/40 break-keep">
                                표준은 메시가 더 촘촘합니다. 텍스처는 견적용 STL에 포함되지 않습니다.
                            </p>
                            <label className="flex items-center gap-2.5 text-[12px] font-bold text-white/80 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enhanceContrast}
                                    onChange={(e) => setEnhanceContrast(e.target.checked)}
                                    className="rounded border-white/30"
                                />
                                대비 강화 · 해상도 정규화 (권장)
                            </label>
                            {removeBgConfigured && (
                                <label className="flex items-center gap-2.5 text-[12px] font-bold text-white/80 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useRemoveBg}
                                        onChange={(e) => setUseRemoveBg(e.target.checked)}
                                        className="rounded border-white/30"
                                    />
                                    <Eraser className="w-3.5 h-3.5 text-teal-300" />
                                    배경 제거 후 생성 (별도 일일 한도)
                                </label>
                            )}
                        </div>
                    )}

                    {busy && (
                        <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 space-y-3">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 text-indigo-300 animate-spin" />
                                <div>
                                    <p className="text-sm font-black text-white">
                                        {status === 'uploading'
                                            ? '이미지 준비·업로드 중…'
                                            : 'AI가 3D 모델을 생성 중…'}
                                    </p>
                                    <p className="text-[11px] text-white/45 font-bold">
                                        보통 1~3분 · 페이지를 새로고침해도 이어서 확인할 수 있습니다
                                        {jobId ? ` · #${jobId}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full bg-indigo-400 transition-all duration-500"
                                    style={{ width: `${Math.max(progress, 5)}%` }}
                                />
                            </div>
                            <p className="text-[11px] font-black text-indigo-200/80">{progress}%</p>
                        </div>
                    )}

                    {status === 'ready' && (
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-teal-400/10 border border-teal-400/25 text-teal-100">
                                {applying ? (
                                    <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="text-sm font-black">
                                        {applying ? '모델 생성 완료 · 3D 뷰어 연결 중…' : '모델 생성 완료'}
                                    </p>
                                    <p className="text-[12px] font-bold text-teal-200/80 mt-1 leading-relaxed break-keep">
                                        {applying
                                            ? '생성된 모델을 불러와 오른쪽 3D 뷰어와 견적 화면을 자동으로 엽니다. 잠시만 기다려 주세요.'
                                            : '미리보기를 확인한 뒤 견적으로 진행하세요. 치수는 다음 화면에서 mm로 맞출 수 있습니다.'}
                                    </p>
                                </div>
                            </div>
                            {previewThumbs && (
                                <div className="grid grid-cols-4 gap-1.5">
                                    {(
                                        [
                                            ['front', '정면'],
                                            ['right', '우측'],
                                            ['back', '뒷면'],
                                            ['left', '좌측'],
                                        ] as const
                                    ).map(([k, label]) =>
                                        previewThumbs[k] ? (
                                            <div key={k} className="rounded-lg overflow-hidden border border-white/10 bg-black/30">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={previewThumbs[k]}
                                                    alt={label}
                                                    className="w-full aspect-square object-cover"
                                                />
                                                <p className="text-[9px] font-black text-center text-white/50 py-0.5">
                                                    {label}
                                                </p>
                                            </div>
                                        ) : null
                                    )}
                                </div>
                            )}
                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-50">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
                                <p className="text-[12px] font-bold leading-relaxed break-keep">
                                    {MESHY_AI_DISCLAIMER}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={applying || !jobId}
                                onClick={async () => {
                                    if (!jobId) return
                                    setError(null)
                                    autoApplyJobRef.current = null
                                    try {
                                        await applyModel(jobId, resultFileName || `meshy-${jobId}.stl`)
                                    } catch (e) {
                                        setError(e instanceof Error ? e.message : '모델 적용 실패')
                                    }
                                }}
                                className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {applying ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                {applying ? '뷰어 연결 중…' : '이 모델로 견적 진행'}
                            </button>
                            <button
                                type="button"
                                disabled={applying}
                                onClick={resetLocal}
                                className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 text-[12px] font-black"
                            >
                                닫기 (오늘 횟수는 이미 사용됨)
                            </button>
                        </div>
                    )}

                    {status === 'succeeded' && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-400/10 border border-teal-400/25 text-teal-200">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-bold">견적 화면으로 이동합니다…</p>
                        </div>
                    )}

                    {status === 'idle' && (
                        token ? (
                            <button
                                type="button"
                                onClick={startGeneration}
                                disabled={!canGenerate}
                                className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <Sparkles className="w-4 h-4" />
                                AI로 3D 모델 생성하기
                            </button>
                        ) : (
                            <Link
                                href={`/auth?return=${encodeURIComponent('/quote?entry=photo')}`}
                                className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black flex items-center justify-center gap-2 transition-all"
                            >
                                <LogIn className="w-4 h-4" />
                                로그인 후 생성하기
                            </Link>
                        )
                    )}

                    {status === 'failed' && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setStatus('idle')
                                    setError(null)
                                    setProgress(0)
                                }}
                                className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-black transition-all"
                            >
                                같은 사진(이미지)으로 다시 시도
                            </button>
                            <button
                                type="button"
                                onClick={resetLocal}
                                className="w-full h-10 rounded-xl text-[12px] font-black text-white/50 hover:text-white"
                            >
                                다른 사진(이미지) 올리기
                            </button>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-400/25 text-red-200">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-[13px] font-bold leading-relaxed break-keep">{error}</p>
                </div>
            )}

            {token && history.length > 0 && !busy && status !== 'ready' && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-white/40">
                        내 생성 기록
                    </p>
                    <ul className="space-y-2">
                        {history.map((h) => (
                            <li
                                key={h.jobId}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-black text-white truncate">
                                        #{h.jobId} · {h.sourceFileName || h.resultFileName || '모델'}
                                    </p>
                                    <p className="text-[10px] font-bold text-white/40">
                                        {h.status}
                                        {h.createdAt ? ` · ${h.createdAt}` : ''}
                                    </p>
                                </div>
                                {h.modelReady && (
                                    <button
                                        type="button"
                                        className="shrink-0 h-8 px-2.5 rounded-lg bg-teal-500/20 border border-teal-400/30 text-[11px] font-black text-teal-200"
                                        onClick={async () => {
                                            setError(null)
                                            try {
                                                await applyModel(
                                                    h.jobId,
                                                    h.resultFileName || `meshy-${h.jobId}.stl`
                                                )
                                            } catch (e) {
                                                setError(
                                                    e instanceof Error ? e.message : '모델 적용 실패'
                                                )
                                            }
                                        }}
                                    >
                                        견적에 넣기
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/40">안내</p>
                <ul className="text-[12px] text-white/50 font-bold space-y-1.5 leading-relaxed break-keep">
                    <li>· 로그인 회원 · 계정당 하루 {MESHY_USER_DAILY_LIMIT}회 (한국 시간) + 관리자 보너스</li>
                    <li>· 생성 실패 시 횟수 미차감 · 성공·진행 중은 당일 1회로 집계</li>
                    <li>· 생성이 끝나면 3D 뷰어와 견적 화면이 자동으로 열립니다</li>
                    <li>· 절대 치수는 견적 화면에서 mm 스케일로 조정하세요</li>
                    <li className="text-amber-200/80">· {MESHY_AI_DISCLAIMER_SHORT}</li>
                </ul>
            </div>
        </div>
    )
}
