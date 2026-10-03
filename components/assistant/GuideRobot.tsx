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
    const [hovered, setHovered] = useState(false)
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const talkUrl = getNaverTalkTalkChatUrl()
    const hidden = isHiddenPath(pathname)

    useEffect(() => {
        if (hidden) return
        try {
            if (sessionStorage.getItem(BUBBLE_SESSION_KEY)) return
        } catch {
            return
        }
        /** 실제로 보여 준 뒤에 기록 — effect가 두 번 실행돼도(Strict Mode) 말풍선이 사라지지 않음 */
        const showTimer = setTimeout(() => {
            try {
                sessionStorage.setItem(BUBBLE_SESSION_KEY, '1')
            } catch {
                /* 저장 불가 환경은 무시 */
            }
            setBubble(true)
        }, BUBBLE_DELAY_MS)
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

    useEffect(
        () => () => {
            if (hoverTimer.current) clearTimeout(hoverTimer.current)
        },
        []
    )

    /** 로봇 ↔ 말풍선 사이 빈 공간을 지날 때 깜박이지 않도록 닫기를 잠깐 늦춤 */
    const hoverIn = (pointerType: string) => {
        if (pointerType !== 'mouse') return
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        setHovered(true)
    }
    const hoverOut = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        hoverTimer.current = setTimeout(() => setHovered(false), 180)
    }

    const toggle = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        setBubble(false)
        setHovered(false)
        setOpen((v) => !v)
    }

    if (hidden) return null

    /** 첫 방문 자동 말풍선 또는 마우스를 올렸을 때(터치 기기 제외) 로봇 위에 표시 */
    const showBubble = (bubble || hovered) && !open

    return (
        <>
            <div className="fixed z-[90] right-2 sm:right-5 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:bottom-5 flex flex-col items-end pointer-events-none">
                <AnimatePresence>
                    {showBubble && (
                        <motion.div
                            key="robot-bubble"
                            role="status"
                            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                            style={{ transformOrigin: 'bottom right' }}
                            onPointerEnter={(e) => hoverIn(e.pointerType)}
                            onPointerLeave={hoverOut}
                            className="pointer-events-auto relative mb-3 w-[min(240px,calc(100vw-2rem))] rounded-2xl bg-gradient-to-br from-teal-300/70 via-teal-400/25 to-sky-400/40 p-px shadow-[0_20px_50px_-12px_rgba(20,184,166,0.55)]"
                        >
                            <div className="relative overflow-hidden rounded-[15px] bg-slate-900/95 px-4 py-3 backdrop-blur-md">
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-teal-400/20 blur-2xl"
                                />
                                <button type="button" onClick={toggle} className="relative block w-full pr-5 text-left">
                                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-teal-300">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-70 motion-safe:animate-ping" />
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-300" />
                                        </span>
                                        {t('bubbleLabel')}
                                    </span>
                                    <span className="mt-1 block text-[14px] font-black leading-snug text-white break-keep">
                                        {t('bubble')}
                                    </span>
                                    <span className="mt-1 block text-[11px] font-semibold text-white/50">{t('bubbleHint')}</span>
                                </button>
                                {bubble && !hovered ? (
                                    <button
                                        type="button"
                                        onClick={() => setBubble(false)}
                                        aria-label={t('dismissBubble')}
                                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                ) : null}
                            </div>
                            {/* 꼬리: 로봇 머리 쪽(가로 중앙)을 가리킴 */}
                            <span
                                aria-hidden
                                className="absolute -bottom-[7px] right-6 h-3.5 w-3.5 rotate-45 rounded-[3px] border-b border-r border-teal-400/40 bg-slate-900 sm:right-8"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    ref={buttonRef}
                    type="button"
                    onClick={toggle}
                    onPointerEnter={(e) => {
                        void loadPanel()
                        hoverIn(e.pointerType)
                    }}
                    onPointerLeave={hoverOut}
                    onFocus={() => void loadPanel()}
                    aria-label={t('open')}
                    aria-expanded={open}
                    aria-haspopup="dialog"
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
