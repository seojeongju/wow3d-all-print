const KST = 'Asia/Seoul';

/** D1/SQLite UTC 타임스탬프를 Date로 변환 */
export function parseDbDateTime(value: string | Date | null | undefined): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const s = String(value).trim();
    if (!s) return null;

    if (/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) {
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    // SQLite/D1: "YYYY-MM-DD HH:MM:SS" (UTC)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
        const d = new Date(`${s.replace(' ', 'T')}Z`);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    // ISO without timezone — DB UTC로 간주
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
        const d = new Date(`${s}Z`);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** 한국 날짜 (예: 2026. 6. 12.) */
export function formatKoreanDate(value: string | Date | null | undefined, fallback = '-'): string {
    const d = parseDbDateTime(value);
    if (!d) return fallback;
    return d.toLocaleDateString('ko-KR', { timeZone: KST });
}

/** 한국 날짜·시간 */
export function formatKoreanDateTime(value: string | Date | null | undefined, fallback = '-'): string {
    const d = parseDbDateTime(value);
    if (!d) return fallback;
    return d.toLocaleString('ko-KR', { timeZone: KST });
}

/** YYYY-MM-DD (KST, PDF/CSV 등) */
export function formatKoreanDateISO(value: string | Date | null | undefined, fallback = '-'): string {
    const d = parseDbDateTime(value);
    if (!d) return fallback;
    return d.toLocaleDateString('en-CA', { timeZone: KST });
}

/** 현재 KST 날짜 */
export function formatNowKoreanDate(): string {
    return new Date().toLocaleDateString('ko-KR', { timeZone: KST });
}
