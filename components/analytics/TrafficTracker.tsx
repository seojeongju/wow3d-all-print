'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrCreateSessionId } from '@/lib/session-id';

/**
 * 사용자 유입 경로 추적 컴포넌트
 */
export default function TrafficTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();

    useEffect(() => {
        // 관리자 페이지는 제외
        if (pathname.startsWith('/admin')) return;

        // 세션 내 중복 기록 방지 (한 세션에 한 번만 기록하거나 유입 소스가 바뀔 때만 기록)
        const sessionKey = 'wow3d_traffic_tracked';
        const isTracked = sessionStorage.getItem(sessionKey);
        
        // 현재 유입 정보 분석
        const utmSource = searchParams.get('utm_source');
        const utmMedium = searchParams.get('utm_medium');
        const utmCampaign = searchParams.get('utm_campaign');
        const referrer = document.referrer;
        
        let source = utmSource || 'direct';
        let medium = utmMedium || 'none';
        
        // 검색 엔진 판별 로직 (단순화)
        if (!utmSource && referrer) {
            if (referrer.includes('naver.com')) {
                source = 'naver';
                medium = 'organic';
            } else if (referrer.includes('google.com')) {
                source = 'google';
                medium = 'organic';
            } else if (referrer.includes('daum.net') || referrer.includes('kakao.com')) {
                source = 'kakao';
                medium = 'organic';
            } else {
                source = 'referral';
                medium = 'referral';
            }
        }

        // 이미 기록된 세션이고, 새로운 UTM 파라미터가 없다면 무시
        if (isTracked && !utmSource) return;

        // 세션 ID 관리 (localStorage에 저장하여 유지)
        const sessionId = getOrCreateSessionId();

        // 서버로 전송
        const recordTraffic = async () => {
            try {
                await fetch('/api/traffic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(user?.id ? { 'X-User-ID': user.id.toString() } : {}),
                    },
                    body: JSON.stringify({
                        source,
                        medium,
                        campaign: utmCampaign,
                        referrerUrl: referrer,
                        path: pathname,
                        sessionId: sessionId,
                    }),
                });
                sessionStorage.setItem(sessionKey, 'true');
            } catch (error) {
                console.error('Failed to record traffic:', error);
            }
        };

        recordTraffic();
    }, [pathname, searchParams, user?.id]);

    return null; // UI 없음
}
