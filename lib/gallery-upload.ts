/** 갤러리 이미지 R2 업로드 */
export async function uploadGalleryImage(
    bucket: CloudflareEnv['BUCKET'],
    file: File,
    prefix = 'gallery'
): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const r2Key = `${prefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const buf = await file.arrayBuffer();
    await bucket.put(r2Key, buf, {
        httpMetadata: { contentType: file.type || 'image/jpeg' },
    });
    return r2Key;
}
