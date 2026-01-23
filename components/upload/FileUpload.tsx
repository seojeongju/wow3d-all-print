'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileBox, X } from 'lucide-react'
import { useFileStore } from '@/store/useFileStore'
import { cn } from '@/lib/utils'

export default function FileUpload() {
    const { file, setFile, reset } = useFileStore()

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            setFile(acceptedFiles[0])
        }
    }, [setFile])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'model/stl': ['.stl'],
            'model/obj': ['.obj'],
            // standard binary stl mime type often used
            'application/sla': ['.stl'],
            'application/vnd.ms-pki.stl': ['.stl'],
            'text/plain': ['.obj'] // sometimes obj is treated as text
        },
        maxFiles: 1,
        multiple: false
    })

    if (file) {
        return (
            <div className="w-full p-4 border rounded-xl bg-muted/50 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <FileBox className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
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
                isDragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            )}
        >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Upload className={cn("w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors", isDragActive && "text-primary")} />
            </div>
            <h3 className="text-lg font-semibold mb-1">3D 모델 업로드</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                STL 또는 OBJ 파일을 드래그하거나 클릭하여 업로드하세요
            </p>
            <div className="text-xs text-muted-foreground/60 px-3 py-1 bg-muted rounded-full">
                최대 크기: 100MB
            </div>
        </div>
    )
}
