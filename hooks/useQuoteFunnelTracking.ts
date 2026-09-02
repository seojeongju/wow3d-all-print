'use client';

import { useEffect, useRef } from 'react';
import {
    CONVERSION_EVENT_CATEGORY,
    QUOTE_CONVERSION_EVENTS,
} from '@/lib/conversion-events';
import { trackConversionEvent, trackConversionEventOnce } from '@/lib/track-conversion-event';
import type { QuoteEntryMode } from '@/components/quote/QuoteSourceChooser';

type Options = {
    entryMode: QuoteEntryMode | null;
    entryParam: string | null;
    file: File | null;
    hasAnalysis: boolean;
    showQuotePanel: boolean;
    userId?: number | null;
};

/** /quote 페이지 퍼널 이벤트 (세션당 1회 중복 방지) */
export function useQuoteFunnelTracking({
    entryMode,
    entryParam,
    file,
    hasAnalysis,
    showQuotePanel,
    userId,
}: Options) {
    const fileTrackedRef = useRef(false);

    useEffect(() => {
        trackConversionEventOnce('wow3d_quote_page_view', {
            eventName: QUOTE_CONVERSION_EVENTS.PAGE_VIEW,
            category: CONVERSION_EVENT_CATEGORY.QUOTE,
            userId,
            metadata: entryParam ? { entry: entryParam } : undefined,
        });
    }, [entryParam, userId]);

    useEffect(() => {
        if (entryMode === 'file') {
            trackConversionEventOnce('wow3d_quote_entry_file', {
                eventName: QUOTE_CONVERSION_EVENTS.ENTRY_FILE,
                category: CONVERSION_EVENT_CATEGORY.QUOTE,
                userId,
            });
        } else if (entryMode === 'photo') {
            trackConversionEventOnce('wow3d_quote_entry_photo', {
                eventName: QUOTE_CONVERSION_EVENTS.ENTRY_PHOTO,
                category: CONVERSION_EVENT_CATEGORY.QUOTE,
                userId,
            });
        }
    }, [entryMode, userId]);

    useEffect(() => {
        if (!file || fileTrackedRef.current) return;
        fileTrackedRef.current = true;
        trackConversionEvent({
            eventName: QUOTE_CONVERSION_EVENTS.FILE_UPLOADED,
            category: CONVERSION_EVENT_CATEGORY.QUOTE,
            userId,
            metadata: { source: entryMode ?? 'unknown' },
        });
    }, [file, entryMode, userId]);

    useEffect(() => {
        if (!hasAnalysis) return;
        trackConversionEventOnce('wow3d_quote_analysis_complete', {
            eventName: QUOTE_CONVERSION_EVENTS.ANALYSIS_COMPLETE,
            category: CONVERSION_EVENT_CATEGORY.QUOTE,
            userId,
        });
    }, [hasAnalysis, userId]);

    useEffect(() => {
        if (!showQuotePanel) return;
        trackConversionEventOnce('wow3d_quote_estimate_view', {
            eventName: QUOTE_CONVERSION_EVENTS.ESTIMATE_VIEW,
            category: CONVERSION_EVENT_CATEGORY.QUOTE,
            userId,
        });
    }, [showQuotePanel, userId]);
}
