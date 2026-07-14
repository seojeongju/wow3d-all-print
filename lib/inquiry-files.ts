/** 문의 첨부 file_url 정규화 (단일 경로 / JSON 배열 모두 지원) */

export function parseInquiryFileUrls(raw: string | null | undefined): string[] {
    if (!raw?.trim()) return [];
    const s = raw.trim();
    if (s.startsWith('[')) {
        try {
            const arr = JSON.parse(s) as unknown;
            if (!Array.isArray(arr)) return [];
            return arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
        } catch {
            return [s];
        }
    }
    return [s];
}

export function serializeInquiryFileUrls(urls: string[]): string | null {
    const cleaned = urls.map((u) => u.trim()).filter(Boolean);
    if (cleaned.length === 0) return null;
    if (cleaned.length === 1) return cleaned[0];
    return JSON.stringify(cleaned);
}

export function inquiryFilePublicUrl(r2Key: string): string {
    return `https://wow3dp.co.kr/api/files/${r2Key}`;
}

export function inquiryFileDisplayName(r2Key: string): string {
    const name = r2Key.split('/').pop() || r2Key;
    return name.replace(/^\d+_/, '');
}
