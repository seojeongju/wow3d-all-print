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

// 모바일(iOS 등)에서 파일 선택이 열리도록 확장자 문자열도 사용
const ACCEPT_STRING = '.stl,.obj,.3mf,.ply,.step,.stp'

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
                    "w-full p-5 border rounded-[2rem] flex items-center justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 shadow-2xl",
                    isDark
                        ? "bg-white/5 backdrop-blur-xl border-white/10"
                        : "bg-muted/50 border-border"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center relative group-hover:scale-110 transition-transform", 
                        isDark ? "bg-teal-400/10 text-teal-400 border border-teal-400/20" : "bg-primary/20 text-primary")}>
                        <FileBox className="w-6 h-6" />
                        {isDark && <div className="absolute inset-0 bg-teal-400/20 blur-lg rounded-2xl animate-pulse" />}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className={cn("text-sm font-black truncate max-w-[180px] sm:max-w-[240px]", isDark ? "text-white" : "text-foreground")}>{file.name}</span>
                        <span className={cn("text-[10px] font-black tracking-widest uppercase", isDark ? "text-white/30" : "text-muted-foreground")}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                </div>
                <button onClick={reset} className="p-2.5 hover:bg-red-500/10 hover:text-red-400 text-white/20 rounded-xl transition-all active:scale-90 group">
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
            </div>
        )
    }

    const inputProps = getInputProps()
    return (
        <div
            {...getRootProps()}
            className={cn(
                "relative border-2 border-dashed rounded-[2.5rem] p-10 sm:p-14 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center text-center group overflow-hidden",
                isDark
                    ? isDragActive
                        ? "border-teal-400 bg-teal-400/10 scale-[1.01] shadow-[0_0_50px_rgba(20,184,166,0.15)]"
                        : "border-white/10 hover:border-teal-400/40 hover:bg-white/[0.02] bg-white/[0.01]"
                    : isDragActive
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            )}
        >
            {/* Background Glow Effect */}
            {isDark && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />}

            <input
                {...inputProps}
                accept={ACCEPT_STRING}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 touch-manipulation"
                style={{
                    ...inputProps.style,
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    WebkitTouchCallout: 'none',
                }}
            />
            <div
                className={cn(
                    "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 relative",
                    isDark ? "bg-white/5 border border-white/10 group-hover:border-teal-400/30 group-hover:shadow-[0_0_30px_rgba(20,184,166,0.1)]" : "bg-muted"
                )}
            >
                <Upload className={cn("w-9 h-9 transition-all duration-500 relative z-10", isDark ? "text-white/30 group-hover:text-teal-400" : "text-muted-foreground group-hover:text-primary", isDragActive && "text-teal-400")} />
                {isDark && <div className="absolute inset-0 bg-teal-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
            <h3 className={cn("text-xl font-black mb-2 tracking-tight transition-colors duration-500", isDark ? "text-white/90 group-hover:text-white" : "text-foreground")}>3D 모델 업로드</h3>
            <p className={cn("text-sm mb-6 max-w-xs font-bold leading-relaxed transition-colors duration-500", isDark ? "text-white/40 group-hover:text-white/60" : "text-muted-foreground")}>
                STL, OBJ, 3MF, STEP 파일을 <br />드래그하거나 <span className="text-teal-400">클릭하여</span> 업로드하세요
            </p>
            <div className={cn("text-[10px] px-4 py-1.5 rounded-full font-black tracking-widest uppercase transition-all duration-500", isDark ? "bg-white/5 text-white/30 border border-white/5 group-hover:border-teal-400/20 group-hover:text-teal-400/60" : "bg-muted text-muted-foreground/60")}>
                MAX CAPACITY: 100MB
            </div>
        </div>
    )
}
