'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { getNaverTalkTalkChatUrl } from '@/lib/naver-talktalk'
import { matchesPathPrefix } from '@/lib/locale-path'
import { GUIDE_ROBOT_HEIGHT, GUIDE_ROBOT_IMAGE, GUIDE_ROBOT_WIDTH } from './guide-robot-image'

const loadPanel = () => import('./GuideRobotPanel')
const GuideRobotPanel = dynamic(loadPanel, { ssr: false })

const BUBBLE_SESSION_KEY = 'wow3d_robot_bubble_shown'
const BUBBLE_DELAY_MS = 1500
const BUBBLE_DURATION_MS = 7000

/** 로봇을 숨기는 화면: 관리자, 견적(자체 상담 버튼 있음), 로그인, 3D 체험 뷰어(우측 하단 도구와 겹침), 견적서 인쇄 */
const HIDDEN_PREFIXES = ['/admin', '/quote', '/auth', '/experience', '/print']

function isHiddenPath(pathname: string | null): boolean {
    if (!pathname) return false
    return matchesPathPrefix(pathname, HIDDEN_PREFIXES)
}

/**
 * 화면 오른쪽 아래 안내로봇
 * - 방문 세션당 한 번 "궁금한 것은 저에게 물어보세요" 말풍선 (몇 초 뒤 자동으로 사라짐)
 * - 클릭하면 사이트 검색 + 네이버 톡톡 실시간 상담 패널
 */
export default function GuideRobot() {
    const t = useTranslations('GuideRobot')
    const pathname = usePathname()
    const reduceMotion = useReducedMotion()
    const [open, setOpen] = useState(false)
    const [bubble, setBubble] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const talkUrl = getNaverTalkTalkChatUrl()
    const hidden = isHiddenPath(pathname)

    useEffect(() => {
        if (hidden) return
        try {
            if (sessionStorage.getItem(BUBBLE_SESSION_KEY)) return
            sessionStorage.setItem(BUBBLE_SESSION_KEY, '1')
        } catch {
            return
        }
        const showTimer = setTimeout(() => setBubble(true), BUBBLE_DELAY_MS)
        const hideTimer = setTimeout(() => setBubble(false), BUBBLE_DELAY_MS + BUBBLE_DURATION_MS)
        return () => {
            clearTimeout(showTimer)
            clearTimeout(hideTimer)
            setBubble(false)
        }
    }, [hidden])

    useEffect(() => {
        setOpen(false)
    }, [pathname])

    const close = useCallback(() => {
        setOpen(false)
        buttonRef.current?.focus()
    }, [])

    const toggle = () => {
        setBubble(false)
        setOpen((v) => !v)
    }

    if (hidden) return null

    return (
        <>
            <div className="fixed z-[90] right-2 sm:right-5 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:bottom-5 flex flex-col items-end pointer-events-none">
                <AnimatePresence>
                    {bubble && !open && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className="pointer-events-auto relative mb-2 mr-2 max-w-[220px] rounded-2xl rounded-br-md bg-white pl-4 pr-8 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.35)] ring-1 ring-teal-400/40"
                        >
                            <button type="button" onClick={toggle} className="text-left text-[13px] font-black leading-snug text-slate-900 break-keep">
                                {t('bubble')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setBubble(false)}
                                aria-label={t('dismissBubble')}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute -bottom-1.5 right-7 w-3 h-3 rotate-45 bg-white ring-1 ring-teal-400/40 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    ref={buttonRef}
                    type="button"
                    onClick={toggle}
                    onPointerEnter={() => void loadPanel()}
                    onFocus={() => void loadPanel()}
                    aria-label={t('open')}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    title={t('bubble')}
                    className="pointer-events-auto group relative flex flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-3xl"
                    whileHover={reduceMotion ? undefined : { scale: 1.06, rotate: -3 }}
                    whileTap={{ scale: 0.94 }}
                >
                    <motion.span
                        className="block"
                        animate={reduceMotion ? undefined : { y: [0, -9, 0] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Image
                            src={GUIDE_ROBOT_IMAGE}
                            alt=""
                            width={GUIDE_ROBOT_WIDTH}
                            height={GUIDE_ROBOT_HEIGHT}
                            draggable={false}
                            className="h-[84px] sm:h-[104px] w-auto select-none drop-shadow-[0_10px_18px_rgba(20,184,166,0.35)]"
                        />
                    </motion.span>
                    <motion.span
                        aria-hidden
                        className="-mt-1 h-2 w-12 sm:w-14 rounded-[50%] bg-slate-900/25 blur-[3px]"
                        animate={reduceMotion ? undefined : { scaleX: [1, 0.72, 1], opacity: [0.55, 0.3, 0.55] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    {!open && (
                        <span className="absolute top-1 right-0 flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60 motion-safe:animate-ping" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-400 ring-2 ring-white" />
                        </span>
                    )}
                </motion.button>
            </div>

            <AnimatePresence>{open && <GuideRobotPanel key="panel" onClose={close} talkUrl={talkUrl} />}</AnimatePresence>
        </>
    )
}
