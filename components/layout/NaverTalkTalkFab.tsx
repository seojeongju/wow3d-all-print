'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
    getNaverTalkTalkBannerId,
    getNaverTalkTalkChatUrl,
} from '@/lib/naver-talktalk';

declare global {
    interface Window {
        __naverTalkBannerLoaded?: boolean;
    }
}

/**
 * 전역 네이버 톡톡 실시간 상담 버튼.
 * 클릭 시 톡톡 1:1 채팅으로 바로 이동합니다.
 * 관리자 페이지에서는 숨깁니다.
 */
export default function NaverTalkTalkFab() {
    const pathname = usePathname();
    const chatUrl = getNaverTalkTalkChatUrl();
    const bannerId = getNaverTalkTalkBannerId();
    const isAdmin = pathname?.startsWith('/admin');

    useEffect(() => {
        if (isAdmin || chatUrl || !bannerId) return;
        if (typeof window === 'undefined' || window.__naverTalkBannerLoaded) return;

        const existing = document.querySelector('script[data-naver-talk-banner]');
        if (!existing) {
            const script = document.createElement('script');
            script.src = 'https://partner.talk.naver.com/banners/script';
            script.async = true;
            script.dataset.naverTalkBanner = '1';
            document.body.appendChild(script);
        }

        window.__naverTalkBannerLoaded = true;
    }, [isAdmin, chatUrl, bannerId]);

    if (isAdmin) return null;

    if (!chatUrl && bannerId) {
        return (
            <div
                className="talk_banner_div fixed bottom-6 right-4 z-[55] sm:bottom-8 sm:right-8"
                data-id={bannerId}
            />
        );
    }

    if (!chatUrl) return null;

    return (
        <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-[#03C75A] text-white shadow-lg shadow-black/40 ring-2 ring-black/20 hover:scale-105 hover:bg-[#02b350] active:scale-95 transition-transform sm:bottom-8 sm:right-8"
            aria-label="네이버 톡톡 실시간 상담"
            title="네이버 톡톡 상담"
        >
            <span className="sr-only">네이버 톡톡 실시간 상담</span>
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden>
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
            </svg>
        </a>
    );
}
