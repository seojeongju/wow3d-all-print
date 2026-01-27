import { create } from 'zustand'

interface GeometryData {
    volume: number
    surfaceArea: number
    overhangArea?: number
    boundingBox: { x: number; y: number; z: number }
}

interface FileState {
    file: File | null
    fileUrl: string | null
    analysis: GeometryData | null
    setFile: (file: File) => void
    setAnalysis: (data: GeometryData) => void
    reset: () => void
}

export const useFileStore = create<FileState>((set) => ({
    file: null,
    fileUrl: null,
    analysis: null,
    setFile: (file) => {
        set((state) => {
            if (state.fileUrl) URL.revokeObjectURL(state.fileUrl)
            return {
                file,
                fileUrl: URL.createObjectURL(file),
                analysis: null // reset analysis on new file
            }
        })
    },
    setAnalysis: (data) => set({ analysis: data }),
    reset: () => set((state) => {
        if (state.fileUrl) URL.revokeObjectURL(state.fileUrl)
        return { file: null, fileUrl: null, analysis: null }
    }),
}))
