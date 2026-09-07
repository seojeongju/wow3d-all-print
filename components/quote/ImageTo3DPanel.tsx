'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
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
import { preprocessMeshyImage } from '@/lib/meshy-client-preprocess'
import { buildAiPhotoResultFileName } from '@/lib/meshy-r2'
import {
    clearMeshyActiveJob,
    readMeshyActiveJobId,
    saveMeshyActiveJob,
} from '@/lib/meshy-active-job'
import { PhotoTo3DGuide } from '@/components/quote/PhotoTo3DGuide'
import { cn } from '@/lib/utils'

type Props = {
    onBack: () => void
    onModelReady?: () => void
    /** Hero 등에서 넘겨받은 사진 — Drop Zone에 자동 반영 */
    initialPhoto?: File | null
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

export default function ImageTo3DPanel({ onBack, onModelReady, initialPhoto }: Props) {
    const t = useTranslations('ImageTo3D')
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
    const [authHydrated, setAuthHydrated] = useState(false)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
        const unsub = useAuthStore.persist.onFinishHydration(() => setAuthHydrated(true))
        if (useAuthStore.persist.hasHydrated()) setAuthHydrated(true)
        return () => unsub()
    }, [])

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
        clearMeshyActiveJob()
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
                    throw new Error((j as { error?: string }).error || t('errDownload'))
                }
                const blob = await res.blob()
                if (!blob.size) {
                    throw new Error(t('errEmpty'))
                }
                const file = new File([blob], fileName || buildAiPhotoResultFileName(id), { type: 'model/stl' })
                setFile(file, { kind: 'meshy-photo', meshyJobId: id })
                clearMeshyActiveJob()
                setStatus('succeeded')
                await refreshQuota()
                await refreshHistory()
                onModelReady?.()
            } finally {
                setApplying(false)
            }
        },
        [authHeaders, onModelReady, refreshHistory, refreshQuota, setFile, t]
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
                await applyModel(id, fileName || buildAiPhotoResultFileName(id))
            } catch (e) {
                autoApplyJobRef.current = null
                setStatus('ready')
                setError(e instanceof Error ? e.message : t('errApply'))
            }
        },
        [applyModel, t]
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
                        data.resultFileName || buildAiPhotoResultFileName(id)
                    )
                } else {
                    setProgress(100)
                    setStatus('ready')
                }
                return
            }
            if (data.status === 'failed' || data.status === 'canceled') {
                clearPoll()
                clearMeshyActiveJob()
                setStatus(data.status === 'canceled' ? 'canceled' : 'failed')
                setError(
                    data.error ||
                        (data.status === 'canceled' ? t('errCanceled') : t('errFailed'))
                )
                await refreshQuota()
                return
            }
            setStatus(mapped === 'ready' ? 'processing' : mapped)
        },
        [refreshQuota, tryAutoApplyWhenReady, t]
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
                        setError(json.error || t('errStatus'))
                        setStatus('failed')
                        clearPoll()
                        return
                    }
                    await handleJobPayload(json.data)
                } catch {
                    setError(t('errNetwork'))
                }
            }
            void tick()
            pollRef.current = setInterval(tick, 3000)
        },
        [authHeaders, handleJobPayload, t]
    )

    // 진행 중·완료 job 복구
    useEffect(() => {
        if (!authHydrated) return

        if (!token) {
            setResuming(false)
            return
        }

        let cancelled = false
        ;(async () => {
            try {
                const controller = new AbortController()
                const timeoutId = window.setTimeout(() => controller.abort(), 15000)
                const res = await fetch('/api/meshy/jobs/active', {
                    headers: authHeaders(),
                    cache: 'no-store',
                    signal: controller.signal,
                })
                window.clearTimeout(timeoutId)
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

                const lsId = readMeshyActiveJobId()

                // 완료 job은 LS에 남아 있을 때만 복구(모델 삭제·적용 후에는 LS 비움 → 새 업로드)
                const active = (() => {
                    if (job) {
                        const inProgress = ['uploading', 'queued', 'processing'].includes(job.status)
                        const resumeSucceeded =
                            job.status === 'succeeded' && !!job.modelReady && lsId === job.jobId
                        if (inProgress || resumeSucceeded) return job
                        return null
                    }
                    if (lsId) {
                        return {
                            jobId: lsId,
                            status: 'processing',
                            progress: 5,
                            modelReady: false,
                        }
                    }
                    return null
                })()

                if (active?.jobId) {
                    setJobId(active.jobId)
                    saveMeshyActiveJob(active.jobId)
                    setProgress(active.progress || 5)
                    if (active.thumbnailUrl) setThumbnailUrl(active.thumbnailUrl)
                    if (active.resultFileName) setResultFileName(active.resultFileName)

                    if (active.status === 'succeeded' && active.modelReady) {
                        setProgress(100)
                        setStatus('ready')
                    } else if (
                        active.status === 'uploading' ||
                        active.status === 'queued' ||
                        active.status === 'processing'
                    ) {
                        setStatus(mapApiStatus(active.status))
                        pollJob(active.jobId)
                    } else if (lsId && !job) {
                        setStatus('processing')
                        pollJob(active.jobId)
                    }
                }
            } catch {
                /* ignore — UI는 업로드 가능 상태로 전환 */
            } finally {
                if (!cancelled) setResuming(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [authHydrated, token, authHeaders, pollJob])

    const applyPhotoFile = useCallback(
        (file: File) => {
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return URL.createObjectURL(file)
            })
            clearPoll()
            clearMeshyActiveJob()
            setSelected(file)
            setStatus('idle')
            setProgress(0)
            setJobId(null)
            setThumbnailUrl(null)
            setResultFileName(null)
        },
        [clearPoll],
    )

    const onDrop = useCallback(
        (accepted: File[], rejections: FileRejection[]) => {
            setError(null)
            if (rejections.length) {
                const code = rejections[0]?.errors?.[0]?.code
                setError(code === 'file-too-large' ? t('errTooLarge') : t('errType'))
                return
            }
            if (!accepted[0]) return
            applyPhotoFile(accepted[0])
        },
        [applyPhotoFile, t],
    )

    useEffect(() => {
        if (!initialPhoto) return
        applyPhotoFile(initialPhoto)
    }, [initialPhoto, applyPhotoFile])

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
                    setError(t('errRemoveBgContinue', { msg }))
                }
            }
        }
        return out
    }

    const startGeneration = async () => {
        if (!selected || selected.size === 0) {
            setError(t('errReupload'))
            return
        }
        if (!token) {
            setError(t('errNeedLogin'))
            return
        }
        if (quota && !quota.loginRequired && (quota.remainingTotal ?? quota.remainingToday) <= 0) {
            setError(
                t('errQuotaUsed', { limit: quota.limit, hint: quota.resetsHint || '' })
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
                    setError(t('errLoginButton'))
                } else if (code === 'DAILY_LIMIT') {
                    setError((json as { error?: string }).error || t('errQuotaUsedFixed'))
                } else if (code === 'IMAGE_TO_3D_NOT_CONFIGURED' || code === 'MESHY_NOT_CONFIGURED') {
                    setError(t('errNotReady'))
                } else {
                    setError(json.error || t('errRequest'))
                }
                setStatus('failed')
                await refreshQuota()
                return
            }
            const id = Number(json.data.jobId)
            setJobId(id)
            saveMeshyActiveJob(id)
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
            setError(t('errRequestCatch'))
            setStatus('failed')
        }
    }

    const busy = status === 'uploading' || status === 'queued' || status === 'processing'
    const hasSelectedImage = !!selected && selected.size > 0
    const showDrop = !hasSelectedImage && status !== 'ready' && !busy && !resuming
    const remainingTotal = quota?.remainingTotal ?? quota?.remainingToday ?? 0
    const canGenerate =
        status === 'idle' && hasSelectedImage && (!quota || remainingTotal > 0)

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
                    {t('reselectMode')}
                </button>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.15]">
                    {t('title')} <span className="text-indigo-300">{t('titleAccent')}</span>
                </h1>
                <p className="text-white/70 text-[13px] sm:text-[15px] font-bold leading-relaxed break-keep">
                    {t('subtitleBefore')}{' '}
                    <strong className="text-white/90">{t('subtitleMesh')}</strong>
                    {t('subtitleAfter')}
                </p>
                <p className="text-[12px] text-white/40 font-bold leading-relaxed break-keep">
                    {t('makerHintBefore')}{' '}
                    <Link href="/#ai-3d-maker" className="text-teal-400 hover:underline">
                        AI 3D Maker(2.5D)
                    </Link>
                    {t('makerHintAfter')}
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
                            ? t('loginRequired')
                            : quota
                              ? t('remainingToday', {
                                    remaining: quota.remainingDaily ?? quota.remainingToday,
                                    limit: quota.limit,
                                }) +
                                ((quota.bonusRemaining || 0) > 0
                                    ? t('bonus', { count: quota.bonusRemaining ?? 0 })
                                    : '')
                              : t('checkingQuota')}
                    </p>
                    <p className="text-[11px] font-bold text-white/50 mt-0.5 break-keep">
                        {quota?.resetsHint ||
                            t('quotaDefault', { limit: MESHY_USER_DAILY_LIMIT })}
                    </p>
                </div>
                {!token && (
                    <Link
                        href={`/auth?return=${encodeURIComponent('/quote?entry=photo')}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-3 text-[12px] font-black text-white"
                    >
                        <LogIn className="w-3.5 h-3.5" />
                        {t('login')}
                    </Link>
                )}
            </div>

            <PhotoTo3DGuide />

            {resuming && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-[13px] font-bold">{t('resuming')}</p>
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
                    <h3 className="text-lg font-black text-white mb-2">{t('uploadTitle')}</h3>
                    <p className="text-sm text-white/45 font-bold max-w-xs leading-relaxed">
                        {t('uploadHint')}
                        <br />
                        {t('uploadHint2')}
                    </p>
                </div>
            )}

            {(hasSelectedImage || status === 'ready' || busy) && !resuming && (
                <div className="space-y-4">
                            {(previewUrl || thumbnailUrl) && (
                        <div className="relative rounded-[1.75rem] overflow-hidden border border-white/15 bg-black/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={thumbnailUrl || previewUrl || ''}
                                alt={t('previewAlt')}
                                className="w-full max-h-64 object-contain bg-black/40"
                            />
                            {!busy && status === 'ready' && (
                                <button
                                    type="button"
                                    onClick={resetLocal}
                                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white/70 hover:text-white border border-white/10"
                                    aria-label={t('ariaRestart')}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            {!busy && status !== 'ready' && status !== 'succeeded' && (
                                <button
                                    type="button"
                                    onClick={resetLocal}
                                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white/70 hover:text-white border border-white/10"
                                    aria-label={t('ariaRemove')}
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
                                {t('multiview')}
                            </p>
                            <p className="text-[11px] font-bold text-white/50 leading-relaxed break-keep">
                                {t('multiviewHint')}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {(
                                    [
                                        { id: 'right' as const, label: t('viewRight') },
                                        { id: 'back' as const, label: t('viewBack') },
                                        { id: 'left' as const, label: t('viewLeft') },
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
                                {t('qualityTitle')}
                            </p>
                            <div className="flex gap-1.5">
                                {(
                                    [
                                        { id: 'fast' as const, label: t('qualityFast') },
                                        { id: 'standard' as const, label: t('qualityStandard') },
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
                                {t('qualityHint')}
                            </p>
                            <label className="flex items-center gap-2.5 text-[12px] font-bold text-white/80 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enhanceContrast}
                                    onChange={(e) => setEnhanceContrast(e.target.checked)}
                                    className="rounded border-white/30"
                                />
                                {t('enhanceContrast')}
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
                                    {t('removeBg')}
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
                                        {status === 'uploading' ? t('uploading') : t('generating')}
                                    </p>
                                    <p className="text-[11px] text-white/45 font-bold">
                                        {t('generatingHint')}
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
                                        {applying ? t('readyApplying') : t('readyDone')}
                                    </p>
                                    <p className="text-[12px] font-bold text-teal-200/80 mt-1 leading-relaxed break-keep">
                                        {applying ? t('readyApplyingDesc') : t('readyDoneDesc')}
                                    </p>
                                </div>
                            </div>
                            {previewThumbs && (
                                <div className="grid grid-cols-4 gap-1.5">
                                    {(
                                        [
                                            ['front', t('viewFront')],
                                            ['right', t('viewRight')],
                                            ['back', t('viewBack')],
                                            ['left', t('viewLeft')],
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
                                    {t('disclaimer')}
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
                                        await applyModel(jobId, resultFileName || buildAiPhotoResultFileName(jobId))
                                    } catch (e) {
                                        setError(e instanceof Error ? e.message : t('errApply'))
                                    }
                                }}
                                className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {applying ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                {applying ? t('connectingViewer') : t('continueQuote')}
                            </button>
                            <button
                                type="button"
                                disabled={applying}
                                onClick={resetLocal}
                                className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 text-[12px] font-black"
                            >
                                {t('restartOtherPhoto')}
                            </button>
                        </div>
                    )}

                    {status === 'succeeded' && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-400/10 border border-teal-400/25 text-teal-200">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-bold">{t('goingToQuote')}</p>
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
                                {t('generateCta')}
                            </button>
                        ) : (
                            <Link
                                href={`/auth?return=${encodeURIComponent('/quote?entry=photo')}`}
                                className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black flex items-center justify-center gap-2 transition-all"
                            >
                                <LogIn className="w-4 h-4" />
                                {t('loginThenGenerate')}
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
                                {t('retrySame')}
                            </button>
                            <button
                                type="button"
                                onClick={resetLocal}
                                className="w-full h-10 rounded-xl text-[12px] font-black text-white/50 hover:text-white"
                            >
                                {t('uploadOther')}
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
                        {t('history')}
                    </p>
                    <ul className="space-y-2">
                        {history.map((h) => (
                            <li
                                key={h.jobId}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-black text-white truncate">
                                        #{h.jobId} · {h.sourceFileName || h.resultFileName || t('modelFallback')}
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
                                                    h.resultFileName || buildAiPhotoResultFileName(h.jobId)
                                                )
                                            } catch (e) {
                                                setError(
                                                    e instanceof Error ? e.message : t('errApply')
                                                )
                                            }
                                        }}
                                    >
                                        {t('applyToQuote')}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/40">{t('notesTitle')}</p>
                <ul className="text-[12px] text-white/50 font-bold space-y-1.5 leading-relaxed break-keep">
                    <li>{t('note1', { limit: MESHY_USER_DAILY_LIMIT })}</li>
                    <li>{t('note2')}</li>
                    <li>{t('note3')}</li>
                    <li>{t('note4')}</li>
                    <li className="text-amber-200/80">· {t('disclaimerShort')}</li>
                </ul>
            </div>
        </div>
    )
}
