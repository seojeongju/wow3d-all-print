'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrCreateSessionId } from '@/lib/session-id';

const FIRST_SOURCE_KEY = 'wow3d_traffic_source';
const FIRST_MEDIUM_KEY = 'wow3d_traffic_medium';
const FIRST_CAMPAIGN_KEY = 'wow3d_traffic_campaign';

/** next-intl as-needed: /en/quote → /quote */
function normalizePath(pathname: string): string {
    return pathname.replace(/^\/(en|ko)(?=\/|$)/, '') || '/';
}

function classifyFromReferrer(referrer: string): { source: string; medium: string } {
    try {
        const host = new URL(referrer).hostname;
        if (host.includes('naver')) return { source: 'naver', medium: 'organic' };
        if (host.includes('google')) return { source: 'google', medium: 'organic' };
        if (host.includes('daum') || host.includes('kakao')) return { source: 'kakao', medium: 'organic' };
        if (host.includes('instagram') || host.includes('ig.')) return { source: 'instagram', medium: 'social' };
        if (host.includes('facebook') || host.includes('fb.')) return { source: 'facebook', medium: 'social' };
        if (host.includes('youtube') || host.includes('youtu.be')) return { source: 'youtube', medium: 'social' };
        if (host !== window.location.hostname) return { source: 'referral', medium: 'referral' };
    } catch {
        /* ignore */
    }
    return { source: 'direct', medium: 'none' };
}

function resolveAcquisition(
    utmSource: string | null,
    utmMedium: string | null,
    utmCampaign: string | null,
): { source: string; medium: string; campaign: string | null } {
    // 새 UTM이 있으면 해당 유입으로 갱신 (캠페인 재유입)
    if (utmSource) {
        const medium = utmMedium || 'none';
        sessionStorage.setItem(FIRST_SOURCE_KEY, utmSource);
        sessionStorage.setItem(FIRST_MEDIUM_KEY, medium);
        if (utmCampaign) sessionStorage.setItem(FIRST_CAMPAIGN_KEY, utmCampaign);
        else sessionStorage.removeItem(FIRST_CAMPAIGN_KEY);
        return { source: utmSource, medium, campaign: utmCampaign };
    }

    const storedSource = sessionStorage.getItem(FIRST_SOURCE_KEY);
    if (storedSource) {
        return {
            source: storedSource,
            medium: sessionStorage.getItem(FIRST_MEDIUM_KEY) || 'none',
            campaign: sessionStorage.getItem(FIRST_CAMPAIGN_KEY),
        };
    }

    const fromRef = document.referrer
        ? classifyFromReferrer(document.referrer)
        : { source: 'direct', medium: 'none' };

    sessionStorage.setItem(FIRST_SOURCE_KEY, fromRef.source);
    sessionStorage.setItem(FIRST_MEDIUM_KEY, fromRef.medium);

    return { source: fromRef.source, medium: fromRef.medium, campaign: null };
}

/**
 * 페이지 이동마다 PV를 기록합니다.
 * 유입 채널은 탭 세션 first-touch를 유지하되, 새 UTM이 있으면 갱신합니다.
 */
export default function TrafficTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const userId = useAuthStore((s) => s.user?.id);
    const lastLoggedPath = useRef<string | null>(null);

    useEffect(() => {
        const rawPath = pathname;
        if (
            rawPath.startsWith('/admin') ||
            rawPath.startsWith('/en/admin') ||
            rawPath.startsWith('/ko/admin')
        ) {
            return;
        }

        const path = normalizePath(rawPath);

        // 동일 path 중복 마운트 방지 (Strict Mode · user 하이드레이션)
        if (lastLoggedPath.current === path) return;
        lastLoggedPath.current = path;

        const logTraffic = async () => {
            try {
                const sessionId = getOrCreateSessionId();
                const { source, medium, campaign } = resolveAcquisition(
                    searchParams.get('utm_source'),
                    searchParams.get('utm_medium'),
                    searchParams.get('utm_campaign'),
                );

                await fetch('/api/traffic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(userId ? { 'X-User-ID': String(userId) } : {}),
                    },
                    body: JSON.stringify({
                        sessionId,
                        path,
                        source,
                        medium,
                        campaign,
                        referrerUrl: document.referrer || null,
                    }),
                });
            } catch (error) {
                console.error('[TrafficTracker] Failed to log:', error);
            }
        };

        void logTraffic();
    }, [pathname, searchParams, userId]);

    return null;
}
