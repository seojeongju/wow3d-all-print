'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileBox, X } from 'lucide-react'
import { useFileStore } from '@/store/useFileStore'
import { cn } from '@/lib/utils'

export type FileUploadVariant = 'default' | 'dark'

const ACCEPT = {
    'model/stl': ['.stl'],
    'model/obj': ['.obj'],
    'application/sla': ['.stl'],
    'application/vnd.ms-pki.stl': ['.stl'],
    'text/plain': ['.obj', '.ply'],
    'application/octet-stream': ['.3mf', '.ply', '.step', '.stp'],
    'application/vnd.ms-package.3dmanufacturing-3dmodel+xml': ['.3mf'],
}

export default function FileUpload({ variant = 'default' }: { variant?: FileUploadVariant }) {
    const { file, setFile, reset } = useFileStore()
    const isDark = variant === 'dark'

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles?.length > 0) setFile(acceptedFiles[0])
        },
        [setFile]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ACCEPT,
        maxFiles: 1,
        multiple: false,
    })

    if (file) {
        return (
            <div
                className={cn(
                    "w-full p-4 border rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2",
                    isDark
                        ? "bg-white/5 border-white/10"
                        : "bg-muted/50 border-border"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isDark ? "bg-primary/20 text-primary" : "bg-primary/20 text-primary")}>
                        <FileBox className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className={cn("text-sm font-medium truncate max-w-[200px]", isDark ? "text-white" : "text-foreground")}>{file.name}</span>
                        <span className={cn("text-xs", isDark ? "text-white/50" : "text-muted-foreground")}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                </div>
                <button onClick={reset} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
        )
    }

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group",
                isDark
                    ? isDragActive
                        ? "border-primary bg-primary/10 scale-[1.02]"
                        : "border-white/20 hover:border-primary/50 hover:bg-white/[0.03]"
                    : isDragActive
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            )}
        >
            <input {...getInputProps()} />
            <div
                className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200",
                    isDark ? "bg-white/10" : "bg-muted"
                )}
            >
                <Upload className={cn("w-8 h-8 transition-colors", isDark ? "text-white/70 group-hover:text-primary" : "text-muted-foreground group-hover:text-primary", isDragActive && "text-primary")} />
            </div>
            <h3 className={cn("text-lg font-semibold mb-1", isDark ? "text-white" : "text-foreground")}>3D 모델 업로드</h3>
            <p className={cn("text-sm mb-4 max-w-xs", isDark ? "text-white/60" : "text-muted-foreground")}>
                STL, OBJ, 3MF, PLY, STEP, STP 파일을 드래그하거나 클릭하여 업로드하세요
            </p>
            <div className={cn("text-xs px-3 py-1 rounded-full", isDark ? "bg-white/10 text-white/50" : "bg-muted text-muted-foreground/60")}>
                최대 크기: 100MB
            </div>
        </div>
    )
}
