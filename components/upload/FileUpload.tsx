'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, FileBox, X } from 'lucide-react'
import { useFileStore } from '@/store/useFileStore'
import { cn } from '@/lib/utils'
import {
    hasModelFileExtension,
    MODEL_FILE_ACCEPT_STRING,
    MODEL_FILE_MAX_BYTES,
} from '@/lib/model-file'

export type FileUploadVariant = 'default' | 'dark'

function rejectionMessage(rejections: FileRejection[]): string {
    const code = rejections[0]?.errors?.[0]?.code
    if (code === 'file-too-large') return '파일 크기는 최대 100MB까지 가능합니다.'
    return 'STL, OBJ, 3MF, PLY, STEP, STP 파일만 드래그하거나 선택할 수 있습니다.'
}

export default function FileUpload({ variant = 'default' }: { variant?: FileUploadVariant }) {
    const { file, setFile, reset } = useFileStore()
    const isDark = variant === 'dark'
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback(
        (acceptedFiles: File[], rejections: FileRejection[]) => {
            setError(null)
            if (acceptedFiles?.length > 0) {
                setFile(acceptedFiles[0])
                return
            }
            if (rejections.length > 0) {
                setError(rejectionMessage(rejections))
            }
        },
        [setFile]
    )

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        maxFiles: 1,
        multiple: false,
        maxSize: MODEL_FILE_MAX_BYTES,
        // MIME가 OS마다 제각각인 3D 모델은 확장자로 수락 판별
        accept: undefined,
        validator: (candidate) => {
            if (!hasModelFileExtension(candidate as File)) {
                return { code: 'file-invalid-type', message: 'unsupported-extension' }
            }
            return null
        },
        // 전체 영역 투명 input 오버레이 없이 root 클릭/드롭만 사용 (드래그 막힘 방지)
        useFsAccessApi: false,
        noClick: false,
        noKeyboard: false,
    })

    if (file) {
        return (
            <div
                className={cn(
                    'w-full p-5 border rounded-[2rem] flex items-center justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 shadow-2xl',
                    isDark
                        ? 'bg-white/5 backdrop-blur-xl border-white/10'
                        : 'bg-muted/50 border-border'
                )}
            >
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'w-12 h-12 rounded-2xl flex items-center justify-center relative group-hover:scale-110 transition-transform',
                            isDark
                                ? 'bg-teal-400/10 text-teal-400 border border-teal-400/20'
                                : 'bg-primary/20 text-primary'
                        )}
                    >
                        <FileBox className="w-6 h-6" />
                        {isDark && <div className="absolute inset-0 bg-teal-400/20 blur-lg rounded-2xl animate-pulse" />}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span
                            className={cn(
                                'text-sm font-black truncate max-w-[180px] sm:max-w-[240px]',
                                isDark ? 'text-white' : 'text-foreground'
                            )}
                        >
                            {file.name}
                        </span>
                        <span
                            className={cn(
                                'text-[10px] font-black tracking-widest uppercase',
                                isDark ? 'text-white/30' : 'text-muted-foreground'
                            )}
                        >
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={reset}
                    className="p-2.5 hover:bg-red-500/10 hover:text-red-400 text-white/20 rounded-xl transition-all active:scale-90 group"
                    aria-label="업로드 파일 제거"
                >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
            </div>
        )
    }

    const inputProps = getInputProps({ accept: MODEL_FILE_ACCEPT_STRING })

    return (
        <div
            {...getRootProps()}
            className={cn(
                'relative border-2 border-dashed rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-14 min-h-[200px] sm:min-h-0 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center text-center group overflow-hidden touch-manipulation',
                isDark
                    ? isDragReject
                        ? 'border-red-400 bg-red-400/10'
                        : isDragActive
                          ? 'border-teal-400 bg-teal-400/10 scale-[1.01] shadow-[0_0_50px_rgba(20,184,166,0.15)]'
                          : 'border-white/10 hover:border-teal-400/40 hover:bg-white/[0.02] bg-white/[0.01]'
                    : isDragReject
                      ? 'border-destructive bg-destructive/5'
                      : isDragActive
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            )}
        >
            {isDark && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            )}

            {/* dropzone 기본 input — 절대 위치 오버레이 금지(드래그 이벤트 가로챔) */}
            <input {...inputProps} accept={MODEL_FILE_ACCEPT_STRING} />

            <div
                className={cn(
                    'w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 relative pointer-events-none',
                    isDark
                        ? 'bg-white/5 border border-white/10 group-hover:border-teal-400/30 group-hover:shadow-[0_0_30px_rgba(20,184,166,0.1)]'
                        : 'bg-muted'
                )}
            >
                <Upload
                    className={cn(
                        'w-9 h-9 transition-all duration-500 relative z-10',
                        isDark
                            ? 'text-white/30 group-hover:text-teal-400'
                            : 'text-muted-foreground group-hover:text-primary',
                        isDragActive && !isDragReject && 'text-teal-400',
                        isDragReject && 'text-red-400'
                    )}
                />
                {isDark && (
                    <div className="absolute inset-0 bg-teal-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
            <h3
                className={cn(
                    'text-xl font-black mb-2 tracking-tight transition-colors duration-500 pointer-events-none',
                    isDark ? 'text-white/90 group-hover:text-white' : 'text-foreground'
                )}
            >
                {isDragActive
                    ? isDragReject
                        ? '지원하지 않는 파일입니다'
                        : '여기에 놓아 업로드'
                    : '3D 모델 업로드'}
            </h3>
            <p
                className={cn(
                    'text-sm mb-6 max-w-xs font-bold leading-relaxed transition-colors duration-500 pointer-events-none',
                    isDark
                        ? 'text-white/40 group-hover:text-white/60'
                        : 'text-muted-foreground'
                )}
            >
                STL, OBJ, 3MF, PLY, STEP, STP 파일을 <br />
                드래그하거나 <span className="text-teal-400">클릭하여</span> 업로드하세요
                <br />
                <span className="text-[11px] font-medium opacity-80">
                    메쉬 파일은 즉시 견적 · STEP/STP는 자동 변환
                </span>
            </p>
            <div
                className={cn(
                    'text-[10px] px-4 py-1.5 rounded-full font-black tracking-widest uppercase transition-all duration-500 pointer-events-none',
                    isDark
                        ? 'bg-white/5 text-white/30 border border-white/5 group-hover:border-teal-400/20 group-hover:text-teal-400/60'
                        : 'bg-muted text-muted-foreground/60'
                )}
            >
                최대 업로드 용량: 100MB
            </div>
            {error ? (
                <p
                    className={cn(
                        'mt-4 text-xs font-bold pointer-events-none',
                        isDark ? 'text-red-300' : 'text-destructive'
                    )}
                    role="alert"
                >
                    {error}
                </p>
            ) : null}
        </div>
    )
}
