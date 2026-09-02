import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { successResponse, errorResponse } from '@/lib/api-utils';
import {
    ALLOWED_CONVERSION_EVENT_NAMES,
    CONVERSION_EVENT_CATEGORY,
    type ConversionEventCategory,
} from '@/lib/conversion-events';

const MAX_METADATA_JSON_LENGTH = 2000;

/**
 * POST /api/events — 전환·히어로 이벤트 기록
 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) {
            return errorResponse('DB not available', 503);
        }

        const body = await request.json();
        const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : '';
        const eventCategory =
            typeof body.eventCategory === 'string' ? body.eventCategory.trim() : CONVERSION_EVENT_CATEGORY.HERO;
        const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : null;
        const path = typeof body.path === 'string' ? body.path.slice(0, 512) : '/';
        const metadataRaw = body.metadata;

        if (!eventName || !ALLOWED_CONVERSION_EVENT_NAMES.has(eventName)) {
            return errorResponse('Invalid event name', 400);
        }

        const allowedCategories = new Set<string>(Object.values(CONVERSION_EVENT_CATEGORY));
        if (!allowedCategories.has(eventCategory)) {
            return errorResponse('Invalid event category', 400);
        }

        let metadataJson: string | null = null;
        if (metadataRaw != null && typeof metadataRaw === 'object' && !Array.isArray(metadataRaw)) {
            const sanitized: Record<string, string | number | boolean> = {};
            for (const [key, value] of Object.entries(metadataRaw as Record<string, unknown>)) {
                if (typeof key !== 'string' || key.length > 64) continue;
                if (typeof value === 'string') sanitized[key] = value.slice(0, 256);
                else if (typeof value === 'number' && Number.isFinite(value)) sanitized[key] = value;
                else if (typeof value === 'boolean') sanitized[key] = value;
            }
            metadataJson = JSON.stringify(sanitized);
            if (metadataJson.length > MAX_METADATA_JSON_LENGTH) {
                metadataJson = metadataJson.slice(0, MAX_METADATA_JSON_LENGTH);
            }
        }

        const userIdHeader = request.headers.get('X-User-ID');
        const userId = userIdHeader ? parseInt(userIdHeader, 10) : null;

        await env.DB.prepare(
            `
            INSERT INTO conversion_events (
                session_id, user_id, event_category, event_name, path, metadata
            ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        )
            .bind(
                sessionId,
                userId && !Number.isNaN(userId) ? userId : null,
                eventCategory as ConversionEventCategory,
                eventName,
                path,
                metadataJson,
            )
            .run();

        return successResponse({ recorded: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to record event';
        console.error('POST /api/events error:', error);
        return errorResponse(message, 500);
    }
}
