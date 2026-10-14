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

/** 오늘 KST 날짜 YYYY-MM-DD */
export function kstTodayISO(): string {
    return formatKoreanDateISO(new Date());
}

/** 한국 월·일·시·분 (예: 10. 14. 오후 3:12) */
export function formatKoreanDateTimeShort(value: string | Date | null | undefined, fallback = '-'): string {
    const d = parseDbDateTime(value);
    if (!d) return fallback;
    return d.toLocaleString('ko-KR', {
        timeZone: KST,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const KST_PARTS = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
});

/** date-fns식 패턴(yyyy, yy, MM, dd, HH, mm, ss)을 KST 기준으로 출력 */
export function formatKoreanPattern(
    value: string | Date | null | undefined,
    pattern: string,
    fallback = '-'
): string {
    const d = parseDbDateTime(value);
    if (!d) return fallback;
    const p: Record<string, string> = {};
    for (const part of KST_PARTS.formatToParts(d)) p[part.type] = part.value;
    const tokens: Record<string, string> = {
        yyyy: p.year,
        yy: p.year.slice(-2),
        MM: p.month,
        dd: p.day,
        HH: p.hour,
        mm: p.minute,
        ss: p.second,
    };
    return pattern.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, (t) => tokens[t]);
}

/** SQL: UTC 컬럼의 KST 날짜 */
export function kstDateSql(col: string): string {
    return `date(${col}, '+9 hours')`;
}

/**
 * SQL: KST 달력 기준 경계(자정)를 UTC datetime으로 환산.
 * 예) kstStartUtcSql("'start of month'") → 이번 달 1일 00:00 KST (UTC 표기)
 */
export function kstStartUtcSql(...modifiers: string[]): string {
    const mods = modifiers.length ? `, ${modifiers.join(', ')}` : '';
    return `datetime(date('now', '+9 hours'${mods}), '-9 hours')`;
}
