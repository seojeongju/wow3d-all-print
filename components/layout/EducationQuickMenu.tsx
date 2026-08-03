'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ExternalLink, Globe2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { NaverTalkTalkIcon } from '@/components/icons/NaverTalkTalkIcon';
import { getNaverTalkTalkChatUrl } from '@/lib/naver-talktalk';

type QuickLinkAccent = 'teal' | 'naver';

type QuickLinkItem = {
    href: string;
    eyebrow: string;
    title: string;
    ariaLabel: string;
    accent: QuickLinkAccent;
    icon: ReactNode;
    iconShape?: 'rounded' | 'circle';
};

function QuickLinkButton({
    item,
    dockLeft,
}: {
    item: QuickLinkItem;
    dockLeft: boolean;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const isNaver = item.accent === 'naver';
    const iconShape = item.iconShape ?? 'rounded';

    const glow = isHovered
        ? isNaver
            ? '0 0 40px rgba(3, 199, 90, 0.28)'
            : '0 0 40px rgba(20, 184, 166, 0.2)'
        : 'none';

    return (
        <motion.a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.ariaLabel}
            title={item.title}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            className={`pointer-events-auto relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-3 gap-4 transition-all group overflow-hidden ${
                dockLeft
                    ? 'border-l-0 rounded-r-2xl flex-row-reverse'
                    : 'border-r-0 rounded-l-2xl'
            }`}
            style={{ boxShadow: glow }}
        >
            <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                    dockLeft
                        ? isNaver
                            ? 'bg-gradient-to-l from-[#03C75A]/20 to-transparent'
                            : 'bg-gradient-to-l from-teal-500/15 to-transparent'
                        : isNaver
                          ? 'bg-gradient-to-r from-[#03C75A]/20 to-transparent'
                          : 'bg-gradient-to-r from-teal-500/15 to-transparent'
                } ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            />

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ width: 0, opacity: 0, x: dockLeft ? -10 : 10 }}
                        animate={{ width: 'auto', opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: dockLeft ? -10 : 10 }}
                        className={`flex flex-col whitespace-nowrap overflow-hidden ${
                            dockLeft ? 'pr-1 text-right' : 'pl-1'
                        }`}
                    >
                        <span
                            className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 ${
                                isNaver ? 'text-[#03C75A]' : 'text-teal-400'
                            }`}
                        >
                            {item.eyebrow}
                        </span>
                        <span className="text-sm font-black text-white leading-none tracking-tight">
                            {item.title}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative shrink-0">
                <div
                    className={`p-2.5 transition-all duration-500 ${
                        iconShape === 'circle' ? 'rounded-full' : 'rounded-xl'
                    } ${
                        isHovered
                            ? isNaver
                                ? 'bg-[#03C75A] text-white shadow-lg shadow-[#03C75A]/40 scale-110'
                                : 'bg-teal-500 text-white shadow-lg shadow-teal-500/40 rotate-[360deg] scale-110'
                            : isNaver
                              ? 'bg-[#03C75A] text-white border border-white/90'
                              : 'bg-white/5 text-teal-400/70 border border-white/10'
                    }`}
                >
                    {item.icon}
                </div>

                {!isHovered && !isNaver && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                )}
            </div>

            {isHovered && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-white/30 ${dockLeft ? 'ml-1' : 'mr-1'}`}
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </motion.div>
            )}
        </motion.a>
    );
}

/**
 * 우측 플로팅 퀵액션
 * - 와우3D 홍대센터(3D쿠키) 링크
 * - (주)와우쓰리디 홈페이지 바로가기
 * - 네이버 톡톡 실시간 상담
 * - 견적/체험 3D 뷰어에서는 우측 컨트롤과 겹치지 않도록 좌측 배치
 */
export default function EducationQuickMenu() {
    const pathname = usePathname();
    const talkUrl = getNaverTalkTalkChatUrl();
    const isAdmin = pathname?.startsWith('/admin');

    /** 3D 뷰어 우측 메뉴(스크린샷·치수·뷰 프리셋)와 겹치는 페이지 */
    const isViewerPage =
        pathname === '/quote' ||
        pathname?.startsWith('/quote/') ||
        pathname === '/experience' ||
        pathname?.startsWith('/experience/');

    if (isAdmin) return null;

    const dockLeft = isViewerPage;

    const links: QuickLinkItem[] = [
        {
            href: 'https://3dcookiehd.com/',
            eyebrow: 'Education Center',
            title: '와우3D 홍대센터',
            ariaLabel: '와우3D 홍대센터 바로가기',
            accent: 'teal',
            icon: <GraduationCap className="w-5 h-5" />,
        },
        {
            href: 'https://wow3dsw.co.kr/',
            eyebrow: 'Official Site',
            title: '(주)와우쓰리디 홈페이지',
            ariaLabel: '(주)와우쓰리디 홈페이지 바로가기',
            accent: 'teal',
            icon: <Globe2 className="w-5 h-5" strokeWidth={2.1} />,
        },
        ...(talkUrl
            ? [
                  {
                      href: talkUrl,
                      eyebrow: 'Live Chat',
                      title: '네이버 톡톡 상담',
                      ariaLabel: '네이버 톡톡 실시간 상담',
                      accent: 'naver' as const,
                      iconShape: 'circle' as const,
                      icon: <NaverTalkTalkIcon className="w-5 h-5" />,
                  },
              ]
            : []),
    ];

    return (
        <div
            className={`fixed top-24 sm:top-28 z-[90] flex flex-col gap-3 pointer-events-none ${
                dockLeft ? 'left-0 items-start' : 'right-0 items-end'
            }`}
        >
            {links.map((item) => (
                <QuickLinkButton key={item.href} item={item} dockLeft={dockLeft} />
            ))}
        </div>
    );
}
