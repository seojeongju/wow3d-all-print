'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, X, UserPlus } from 'lucide-react';
import { getKakaoChannelAddFriendUrl, getKakaoChannelChatUrl } from '@/lib/kakao-channel';

type Props = {
    /** 파일 분석·견적 산출이 완료된 뒤 표시 */
    visible: boolean;
};

/**
 * 자동견적 화면에서 견적 확인 후 카카오 채널로 문의할 수 있도록 고정 노출되는 FAB.
 * NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID 가 없으면 렌더하지 않습니다.
 */
export function KakaoChannelFab({ visible }: Props) {
    const t = useTranslations('Quote');
    const [open, setOpen] = useState(false);
    const chatUrl = getKakaoChannelChatUrl();
    const addUrl = getKakaoChannelAddFriendUrl();

    if (!visible || !chatUrl) return null;

    return (
        <div className="fixed bottom-24 right-4 z-[55] flex flex-col items-end gap-2 sm:bottom-8 sm:right-8 sm:z-[60]">
            {open && (
                <div className="w-[min(18rem,calc(100vw-2.5rem))] rounded-2xl border border-[#FEE500]/40 bg-[#0c0c0c]/95 p-4 shadow-2xl backdrop-blur-md">
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="text-sm font-bold text-white leading-snug">
                            {t('kakaoTitle')}
                            <span className="block text-[11px] font-medium text-white/50 mt-1">
                                {t('kakaoBody')}
                            </span>
                        </p>
                        <button
                            type="button"
                            aria-label={t('kakaoClose')}
                            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 shrink-0"
                            onClick={() => setOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <a
                            href={chatUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[#191919] font-black text-sm py-3 px-4 hover:bg-[#ffe033] transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {t('kakaoChat')}
                        </a>
                        {addUrl ? (
                            <a
                                href={addUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 text-white/90 text-xs font-bold py-2.5 px-4 hover:bg-white/10 transition-colors"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                {t('kakaoAddFriend')}
                            </a>
                        ) : null}
                    </div>
                </div>
            )}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE500] text-[#191919] shadow-lg shadow-black/40 ring-2 ring-black/20 hover:scale-105 active:scale-95 transition-transform"
                aria-label={open ? t('kakaoCloseAria') : t('kakaoOpenAria')}
            >
                <MessageCircle className="w-7 h-7" strokeWidth={2.2} />
            </button>
        </div>
    );
}
