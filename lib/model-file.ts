/** 자동견적/업로드에서 허용하는 3D 모델 확장자 */
export const MODEL_FILE_EXTENSIONS = ['.stl', '.obj', '.3mf', '.ply', '.step', '.stp'] as const

export const MODEL_FILE_ACCEPT_STRING = MODEL_FILE_EXTENSIONS.join(',')

export const MODEL_FILE_MAX_BYTES = 100 * 1024 * 1024

export function hasModelFileExtension(file: File | { name: string }): boolean {
    const name = file.name.toLowerCase()
    return MODEL_FILE_EXTENSIONS.some((ext) => name.endsWith(ext))
}

export function getModelFileFromDataTransfer(dataTransfer: DataTransfer | null): File | null {
    if (!dataTransfer?.files?.length) return null
    const file = dataTransfer.files[0]
    if (!file || !hasModelFileExtension(file)) return null
    if (file.size > MODEL_FILE_MAX_BYTES) return null
    return file
}
