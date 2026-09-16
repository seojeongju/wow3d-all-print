import {
    ALLOWED_CONVERSION_EVENT_NAMES,
    CONVERSION_EVENT_CATEGORY,
    type ConversionEventCategory,
} from '@/lib/conversion-events';

type D1Like = {
    prepare: (sql: string) => {
        bind: (...args: unknown[]) => { run: () => Promise<unknown> };
    };
};

export type RecordConversionEventServerInput = {
    db: D1Like;
    eventName: string;
    eventCategory?: ConversionEventCategory;
    sessionId?: string | null;
    userId?: number | null;
    path?: string | null;
    metadata?: Record<string, string | number | boolean | null> | null;
};

/**
 * 서버에서 conversion_events INSERT (주문 완료 등 클라이언트 누락 보완).
 * 실패해도 주문 플로우를 막지 않도록 호출측에서 try/catch 권장.
 */
export async function recordConversionEventServer(
    input: RecordConversionEventServerInput,
): Promise<boolean> {
    const eventName = input.eventName?.trim();
    if (!eventName || !ALLOWED_CONVERSION_EVENT_NAMES.has(eventName)) return false;

    const eventCategory = input.eventCategory ?? CONVERSION_EVENT_CATEGORY.HERO;
    const allowedCategories = new Set<string>(Object.values(CONVERSION_EVENT_CATEGORY));
    if (!allowedCategories.has(eventCategory)) return false;

    let metadataJson: string | null = null;
    if (input.metadata && typeof input.metadata === 'object') {
        const sanitized: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(input.metadata)) {
            if (typeof key !== 'string' || key.length > 64) continue;
            if (typeof value === 'string') sanitized[key] = value.slice(0, 256);
            else if (typeof value === 'number' && Number.isFinite(value)) sanitized[key] = value;
            else if (typeof value === 'boolean') sanitized[key] = value;
        }
        const raw = JSON.stringify(sanitized);
        metadataJson = raw.length > 2000 ? raw.slice(0, 2000) : raw;
    }

    await input.db
        .prepare(
            `
            INSERT INTO conversion_events (
                session_id, user_id, event_category, event_name, path, metadata
            ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        )
        .bind(
            input.sessionId ? String(input.sessionId).slice(0, 128) : null,
            input.userId != null && Number.isFinite(input.userId) ? input.userId : null,
            eventCategory,
            eventName,
            input.path ? String(input.path).slice(0, 512) : '/',
            metadataJson,
        )
        .run();

    return true;
}
