/** 사진(이미지)→AI 3D 변환에 쓸 수 있는 JPG·PNG 판별 */
export function isPhotoFile(file: File): boolean {
    const name = file.name.toLowerCase()
    return (
        file.type === 'image/jpeg' ||
        file.type === 'image/jpg' ||
        file.type === 'image/png' ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png')
    )
}

/** 드롭된 항목 중 첫 번째 사진(이미지) */
export function getPhotoFileFromDataTransfer(dt: DataTransfer | null | undefined): File | null {
    const files = dt?.files
    if (!files?.length) return null
    for (let i = 0; i < files.length; i++) {
        if (isPhotoFile(files[i])) return files[i]
    }
    return null
}
