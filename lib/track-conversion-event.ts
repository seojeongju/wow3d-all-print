'use client';

import {
    ALLOWED_CONVERSION_EVENT_NAMES,
    type ConversionEventCategory,
    CONVERSION_EVENT_CATEGORY,
} from '@/lib/conversion-events';
import { getOrCreateSessionId } from '@/lib/session-id';

export type TrackConversionEventOptions = {
    eventName: string;
    category?: ConversionEventCategory;
    path?: string;
    metadata?: Record<string, string | number | boolean | null>;
    userId?: number | null;
};

/**
 * 전환 이벤트 기록 (fire-and-forget).
 * 실패해도 UX를 막지 않습니다.
 */
export function trackConversionEvent({
    eventName,
    category = CONVERSION_EVENT_CATEGORY.HERO,
    path,
    metadata,
    userId,
}: TrackConversionEventOptions): void {
    if (typeof window === 'undefined') return;
    if (!ALLOWED_CONVERSION_EVENT_NAMES.has(eventName)) return;

    const sessionId = getOrCreateSessionId();
    const payload = {
        eventName,
        eventCategory: category,
        sessionId,
        path: path ?? window.location.pathname,
        metadata: metadata ?? null,
    };

    void fetch('/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'X-User-ID': String(userId) } : {}),
        },
        body: JSON.stringify(payload),
        keepalive: true,
    }).catch(() => {
        /* ignore */
    });
}

/** 세션당 1회만 기록 */
export function trackConversionEventOnce(
    sessionStorageKey: string,
    options: TrackConversionEventOptions,
): void {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(sessionStorageKey)) return;
    sessionStorage.setItem(sessionStorageKey, '1');
    trackConversionEvent(options);
}
