/** 자동견적/업로드에서 허용하는 3D 모델 확장자 */
export const MODEL_FILE_EXTENSIONS = ['.stl', '.obj', '.3mf', '.ply', '.step', '.stp'] as const

export const MODEL_FILE_ACCEPT_STRING = MODEL_FILE_EXTENSIONS.join(',')

export const MODEL_FILE_MAX_BYTES = 100 * 1024 * 1024

export function hasModelFileExtension(file: File | { name: string }): boolean {
    const name = file.name.toLowerCase()
    return MODEL_FILE_EXTENSIONS.some((ext) => name.endsWith(ext))
}

/** 드롭된 3D 모델 파일 (확장자만 판별 — 용량 초과 안내는 호출 측에서 isModelFileTooLarge로 처리) */
export function getModelFileFromDataTransfer(dataTransfer: DataTransfer | null): File | null {
    if (!dataTransfer?.files?.length) return null
    const file = dataTransfer.files[0]
    if (!file || !hasModelFileExtension(file)) return null
    return file
}

export function isModelFileTooLarge(file: { size: number }): boolean {
    return file.size > MODEL_FILE_MAX_BYTES
}
