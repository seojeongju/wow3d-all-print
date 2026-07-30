'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ExternalLink, Globe2 } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { NaverTalkTalkIcon } from '@/components/icons/NaverTalkTalkIcon';
import { getNaverTalkTalkChatUrl } from '@/lib/naver-talktalk';

/**
 * 우측 플로팅 퀵액션
 * - 와우3D 홍대센터(3D쿠키) 링크
 * - (주)와우쓰리디 홈페이지 바로가기
 * - 네이버 톡톡 실시간 상담 (바로 아래)
 * - 견적/체험 3D 뷰어에서는 우측 컨트롤과 겹치지 않도록 좌측 배치
 */
export default function EducationQuickMenu() {
    const [isHovered, setIsHovered] = useState(false);
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

    return (
        <div
            className={`fixed top-24 sm:top-28 z-[90] flex flex-col gap-3 pointer-events-none ${
                dockLeft ? 'left-0 items-start' : 'right-0 items-end'
            }`}
        >
            <motion.a
                href="https://3dcookiehd.com/"
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`pointer-events-auto relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-3 gap-4 transition-all group overflow-hidden ${
                    dockLeft
                        ? 'border-l-0 rounded-r-2xl flex-row-reverse'
                        : 'border-r-0 rounded-l-2xl'
                }`}
                style={{
                    boxShadow: isHovered ? '0 0 40px rgba(20, 184, 166, 0.2)' : 'none',
                }}
            >
                <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                        dockLeft
                            ? 'bg-gradient-to-l from-teal-500/15 to-transparent'
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
                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] leading-none mb-1.5">
                                Education Center
                            </span>
                            <span className="text-sm font-black text-white leading-none tracking-tight">
                                와우3D 홍대센터
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative shrink-0">
                    <div
                        className={`p-2.5 rounded-xl transition-all duration-500 ${
                            isHovered
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/40 rotate-[360deg] scale-110'
                                : 'bg-white/5 text-teal-400/70 border border-white/10'
                        }`}
                    >
                        <GraduationCap className="w-5 h-5" />
                    </div>

                    {!isHovered && (
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

            <a
                href="https://wow3dsw.co.kr/"
                target="_blank"
                rel="noopener noreferrer"
                className={`pointer-events-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.28)] ring-1 ring-white/20 backdrop-blur-xl hover:scale-105 hover:bg-white/15 active:scale-95 transition-transform ${
                    dockLeft ? 'ml-2 sm:ml-2.5' : 'mr-2 sm:mr-2.5'
                }`}
                aria-label="(주)와우쓰리디 홈페이지 바로가기"
                title="(주)와우쓰리디 홈페이지"
            >
                <span className="sr-only">(주)와우쓰리디 홈페이지 바로가기</span>
                <Globe2 className="w-6 h-6 sm:w-7 sm:h-7 text-teal-300" strokeWidth={2.1} />
            </a>

            {talkUrl ? (
                <a
                    href={talkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`pointer-events-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#03C75A] text-white shadow-[0_6px_20px_rgba(0,0,0,0.28)] ring-1 ring-white/90 hover:scale-105 hover:bg-[#02b350] active:scale-95 transition-transform ${
                        dockLeft ? 'ml-2 sm:ml-2.5' : 'mr-2 sm:mr-2.5'
                    }`}
                    aria-label="네이버 톡톡 실시간 상담"
                    title="네이버 톡톡 상담"
                >
                    <span className="sr-only">네이버 톡톡 실시간 상담</span>
                    <NaverTalkTalkIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                </a>
            ) : null}
        </div>
    );
}
