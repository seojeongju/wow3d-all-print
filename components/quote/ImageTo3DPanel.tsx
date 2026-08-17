'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useFileStore } from '@/store/useFileStore'
import { MESHY_IMAGE_MAX_BYTES } from '@/lib/meshy'
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
    | 'succeeded'
    | 'failed'
    | 'canceled'

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
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

    useEffect(() => () => {
        clearPoll()
        if (previewUrl) URL.revokeObjectURL(previewUrl)
    }, [previewUrl])

    const resetLocal = () => {
        clearPoll()
        setSelected(null)
        setError(null)
        setStatus('idle')
        setProgress(0)
        setJobId(null)
        setThumbnailUrl(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
    }

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
            setSelected(accepted[0])
            setPreviewUrl(URL.createObjectURL(accepted[0]))
            setStatus('idle')
            setProgress(0)
            setJobId(null)
        },
        [previewUrl]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        multiple: false,
        maxSize: MESHY_IMAGE_MAX_BYTES,
        accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
        disabled: status === 'uploading' || status === 'queued' || status === 'processing',
        useFsAccessApi: false,
    })

    const applyModel = async (id: number, fileName: string) => {
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
        setFile(file)
        onModelReady?.()
    }

    const pollJob = (id: number) => {
        clearPoll()
        pollRef.current = setInterval(async () => {
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
                const data = json.data
                setProgress(Number(data.progress) || 0)
                setStatus(data.status as JobStatus)
                if (data.thumbnailUrl) setThumbnailUrl(data.thumbnailUrl)

                if (data.status === 'succeeded' && data.modelReady) {
                    clearPoll()
                    setProgress(100)
                    try {
                        await applyModel(id, data.resultFileName)
                    } catch (e) {
                        setError(e instanceof Error ? e.message : '모델 적용 실패')
                        setStatus('failed')
                    }
                    return
                }
                if (data.status === 'failed' || data.status === 'canceled') {
                    clearPoll()
                    setError(data.error || 'AI 모델링에 실패했습니다')
                }
            } catch {
                setError('네트워크 오류로 상태를 확인하지 못했습니다')
                setStatus('failed')
                clearPoll()
            }
        }, 3000)
    }

    const startGeneration = async () => {
        if (!selected) return
        if (!token && !sessionId) {
            setError('세션을 확인할 수 없습니다. 페이지를 새로고침 후 다시 시도해 주세요.')
            return
        }
        setError(null)
        setStatus('uploading')
        setProgress(2)
        try {
            const fd = new FormData()
            fd.append('image', selected)
            const res = await fetch('/api/meshy/jobs', {
                method: 'POST',
                headers: authHeaders(),
                body: fd,
            })
            const json = await res.json()
            if (!res.ok || !json.success) {
                setError(json.error || 'AI 모델링 요청에 실패했습니다')
                setStatus('failed')
                return
            }
            const id = Number(json.data.jobId)
            setJobId(id)
            setStatus('queued')
            setProgress(5)
            pollJob(id)
        } catch {
            setError('AI 모델링 요청 중 오류가 발생했습니다')
            setStatus('failed')
        }
    }

    const busy = status === 'uploading' || status === 'queued' || status === 'processing'

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => {
                        if (!busy) {
                            resetLocal()
                            onBack()
                        }
                    }}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 text-[12px] font-black text-white/50 hover:text-white transition-colors disabled:opacity-40"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    시작 방식 다시 선택
                </button>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.15]">
                    사진으로 <span className="text-indigo-300">3D 만들기</span>
                </h1>
                <p className="text-white/70 text-[13px] sm:text-[15px] font-bold leading-relaxed break-keep">
                    제품이 잘 보이는 JPG/PNG 사진을 올려 주세요. AI가 3D 모델을 생성한 뒤 자동견적으로 이어집니다.
                </p>
            </div>

            {!selected ? (
                <div
                    {...getRootProps()}
                    className={cn(
                        'relative border-2 border-dashed rounded-[2rem] p-8 sm:p-12 min-h-[220px] cursor-pointer',
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
                    <h3 className="text-lg font-black text-white mb-2">제품 사진 업로드</h3>
                    <p className="text-sm text-white/45 font-bold max-w-xs leading-relaxed">
                        JPG · PNG · 최대 8MB
                        <br />
                        단색 배경 · 정면 사진이 품질이 더 좋습니다
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative rounded-[1.75rem] overflow-hidden border border-white/15 bg-black/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={thumbnailUrl || previewUrl || ''}
                            alt="업로드 미리보기"
                            className="w-full max-h-64 object-contain bg-black/40"
                        />
                        {!busy && status !== 'succeeded' && (
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

                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <ImageIcon className="w-5 h-5 text-indigo-300 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-white truncate">{selected.name}</p>
                            <p className="text-[11px] font-bold text-white/40">
                                {(selected.size / 1024).toFixed(0)} KB
                            </p>
                        </div>
                    </div>

                    {busy && (
                        <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 space-y-3">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 text-indigo-300 animate-spin" />
                                <div>
                                    <p className="text-sm font-black text-white">
                                        {status === 'uploading'
                                            ? '이미지 업로드 중…'
                                            : 'AI가 3D 모델을 생성 중…'}
                                    </p>
                                    <p className="text-[11px] text-white/45 font-bold">
                                        보통 1~3분 정도 소요됩니다
                                        {jobId ? ` · 작업 #${jobId}` : ''}
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

                    {status === 'succeeded' && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-400/10 border border-teal-400/25 text-teal-200">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-bold">모델 생성 완료 · 견적 분석으로 이동합니다</p>
                        </div>
                    )}

                    {status === 'idle' && (
                        <button
                            type="button"
                            onClick={startGeneration}
                            className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black flex items-center justify-center gap-2 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            AI로 3D 모델 생성하기
                        </button>
                    )}

                    {status === 'failed' && (
                        <button
                            type="button"
                            onClick={() => {
                                setStatus('idle')
                                setError(null)
                                setProgress(0)
                            }}
                            className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-black transition-all"
                        >
                            다시 시도
                        </button>
                    )}
                </div>
            )}

            {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-400/25 text-red-200">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-[13px] font-bold leading-relaxed">{error}</p>
                </div>
            )}

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/40">안내</p>
                <ul className="text-[12px] text-white/50 font-bold space-y-1.5 leading-relaxed break-keep">
                    <li>· 하루 이용 한도: 회원 5회 · 비회원 2회</li>
                    <li>· 절대 치수는 생성 후 견적 화면에서 스케일로 조정하세요</li>
                    <li>· 정밀 부품·조립 공차는 3D 파일 업로드를 권장합니다</li>
                </ul>
            </div>
        </div>
    )
}
