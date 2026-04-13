'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Zap, LogOut, Boxes, Menu, X, Layers, Search, MessageSquare, ChevronRight, Printer, HelpCircle } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useFileStore } from "@/store/useFileStore";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
    { label: '서비스', href: '/#services' },
    { label: '기능', href: '/#features' },
    { label: '공정', href: '/#process' },
    { label: '제품소개', href: '/hardware/3d-printer' },
    { label: '제품개발 및 문의', href: '/expert' },
    { label: '주문조회', href: '/my-account' },
    { label: 'FAQ', href: '/qna' },
    { label: '문의하기', href: '/contact' },
    { label: '대리점 모집', href: '/partnership' },
];

export default function Header() {
    const { getTotalItems } = useCartStore()
    const { isAuthenticated, user, logout } = useAuthStore()
    const { reset: resetFileStore } = useFileStore()
    const cartItemCount = getTotalItems()

    const [isScrolled, setIsScrolled] = useState(false)
    const [isPastHero, setIsPastHero] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    const navItems = mounted
        ? NAV_ITEMS.map((item) =>
            item.label === '주문조회' && user?.role === 'admin' ? { ...item, href: '/admin/orders' } : item
        )
        : NAV_ITEMS

    useEffect(() => {
        setMounted(true)
        const handleScroll = () => {
            const scrollY = window.scrollY
            setIsScrolled(scrollY > 10)
            // 뷰포트 높이의 80% 이상 스크롤 시 라이트 모드로 전환
            setIsPastHero(scrollY > window.innerHeight * 0.8)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (mobileOpen) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    return (
        <header className={`
            fixed top-0 left-0 right-0 z-[100] transition-all duration-300
            ${isPastHero
                ? isScrolled
                    ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm py-3'
                    : 'bg-white/70 backdrop-blur-md py-5'
                : isScrolled
                    ? 'bg-[#0d1117]/90 backdrop-blur-xl border-b border-white/10 py-3'
                    : 'bg-transparent backdrop-blur-sm py-5'}
        `}
            style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
        >
            {/* 상단 바: 모바일에서 오버레이보다 위에 표시되도록 z-[101] */}
            <div className="relative z-[101] container mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                        <Boxes className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className={`font-black text-lg sm:text-xl leading-none transition-colors ${isPastHero ? 'text-slate-800' : 'text-white'}`}>
                            WOW3D<span className="text-teal-400 font-semibold ml-0.5">PRO</span>
                        </span>
                        <span className={`text-[10px] sm:text-[11px] font-bold leading-tight mt-1 transition-colors ${isPastHero ? 'text-slate-600' : 'text-white/80'}`}>
                            (주)와우쓰리디
                        </span>
                        <span className={`text-[9px] sm:text-[10px] font-medium leading-tight mt-0.5 transition-colors ${isPastHero ? 'text-slate-400' : 'text-white/50'}`}>
                            <span className="text-teal-400 font-semibold">AI</span> 실시간 자동 견적시스템
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav - 가독성 중심 */}
                <nav className={`hidden lg:flex items-center gap-0.5 rounded-2xl p-1.5 transition-all ${
                    isPastHero
                        ? 'bg-slate-50/80 border border-slate-200 shadow-sm'
                        : 'bg-white/10 border border-white/15 shadow-lg shadow-black/20'
                }`}>
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-200 ${
                                isPastHero
                                    ? 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'
                                    : 'text-white/90 hover:text-white hover:bg-white/15'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Link href="/cart">
                        <button className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                            isPastHero
                                ? 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200'
                                : 'bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/20'
                        }`} title="장바구니">
                            <ShoppingCart className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                            <AnimatePresence>
                                {mounted && cartItemCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-white text-[11px] font-bold rounded-full"
                                    >
                                        {cartItemCount > 99 ? '99+' : cartItemCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    </Link>

                    {mounted && isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <Link href={user?.role === 'admin' ? '/admin' : '/my-account'}>
                                <button className={`flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-xl transition-all ${
                                    isPastHero
                                        ? 'bg-slate-100 border border-slate-200 hover:bg-teal-50 hover:border-teal-200'
                                        : 'bg-white/10 border border-white/15 hover:bg-white/20'
                                }`}>
                                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="hidden sm:flex flex-col text-left">
                                        <span className={`text-xs font-bold leading-tight ${isPastHero ? 'text-slate-700' : 'text-white'}`}>{user?.name}</span>
                                        <span className={`text-[10px] leading-tight ${isPastHero ? 'text-slate-400' : 'text-white/50'}`}>{user?.role === 'admin' ? '관리자' : '회원'}</span>
                                    </div>
                                </button>
                            </Link>
                            <button
                                onClick={logout}
                                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
                                title="로그아웃"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Link href="/auth">
                            <Button variant="ghost" className={`text-[13px] font-semibold rounded-xl px-4 h-10 border transition-colors ${
                                isPastHero
                                    ? 'text-slate-600 hover:text-teal-600 hover:bg-teal-50 border-slate-200'
                                    : 'text-white/90 hover:text-white hover:bg-white/15 border-white/20'
                            }`}>
                                로그인
                            </Button>
                        </Link>
                    )}

                    <Link href="/quote" className="hidden sm:block" onClick={() => resetFileStore()}>
                        <Button className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl bg-teal-500 text-white hover:bg-teal-600 font-bold text-[13px] gap-2 shadow-lg shadow-teal-500/25">
                            <Zap className="w-4 h-4" />
                            견적 받기
                        </Button>
                    </Link>

                    {/* 모바일 메뉴 버튼 */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen((o) => !o)}
                        className={`lg:hidden w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center touch-manipulation select-none transition-colors ${
                            isPastHero
                                ? 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-600'
                                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                        }`}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* 모바일 메뉴 패널: 불투명 배경으로 뒤 콘텐츠 가림, 터치 스크롤 */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 top-0 z-[100] lg:hidden bg-white backdrop-blur-xl"
                        onClick={() => setMobileOpen(false)}
                        aria-hidden="false"
                    >
                        <motion.nav
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.05,
                                        delayChildren: 0.1
                                    }
                                }
                            }}
                            className="flex flex-col gap-2.5 w-full max-w-lg mx-auto h-full pt-[max(5.5rem,calc(5.5rem+env(safe-area-inset-top,0px)))] pb-[max(2rem,env(safe-area-inset-bottom))] px-5 sm:px-6 overflow-y-auto overflow-x-hidden overscroll-contain touch-auto"
                            onClick={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                        >
                            <div className="mb-3">
                                <span className="text-[10px] font-bold text-teal-500 uppercase tracking-[0.2em] ml-1">Menu Navigation</span>
                            </div>

                            {navItems.map((item) => (
                                <motion.div key={item.label} variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 active:scale-[0.98] transition-all flex items-center group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-teal-100 transition-colors">
                                            {item.label === '서비스' && <Boxes className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />}
                                            {item.label === '기능' && <Zap className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />}
                                            {item.label === '공정' && <Layers className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />}
                                            {item.label === '제품소개' && <Printer className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />}
                                            {item.label === '제품개발 및 문의' && <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />}
                                            {item.label === '주문조회' && <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />}
                                            {item.label === 'FAQ' && <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />}
                                            {item.label === '문의하기' && <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />}
                                        </div>
                                        <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                                        <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-teal-400 transition-colors" />
                                    </Link>
                                </motion.div>
                            ))}

                            <div className="h-px bg-slate-200 my-2" />

                            <motion.div variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                                <Link
                                    href="/cart"
                                    onClick={() => setMobileOpen(false)}
                                    className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 active:scale-[0.98] transition-all flex items-center gap-3 relative group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-teal-500 transition-colors">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <span>장바구니</span>
                                    {mounted && cartItemCount > 0 && (
                                        <span className="ml-auto min-w-[22px] h-[22px] px-2 flex items-center justify-center bg-teal-500 text-white text-[11px] font-black rounded-full shadow-lg shadow-teal-500/30">
                                            {cartItemCount > 99 ? '99+' : cartItemCount}
                                        </span>
                                    )}
                                </Link>
                            </motion.div>

                            {isAuthenticated ? (
                                <>
                                    <motion.div variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                                        <Link
                                            href={user?.role === 'admin' ? '/admin' : '/my-account'}
                                            onClick={() => setMobileOpen(false)}
                                            className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 active:scale-[0.98] transition-all flex items-center gap-3 group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span>{user?.name}</span>
                                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{user?.role === 'admin' ? 'Administrator' : 'Premium Member'}</span>
                                            </div>
                                        </Link>
                                    </motion.div>
                                    <motion.div variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                                        <button
                                            type="button"
                                            onClick={() => { logout(); setMobileOpen(false); }}
                                            className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 active:scale-[0.98] transition-all flex items-center gap-3 w-full text-left"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-500">
                                                <LogOut className="w-5 h-5" />
                                            </div>
                                            로그아웃
                                        </button>
                                    </motion.div>
                                </>
                            ) : (
                                <motion.div variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                                    <Link
                                        href="/auth"
                                        onClick={() => setMobileOpen(false)}
                                        className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 active:scale-[0.98] transition-all flex items-center gap-3 group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-teal-500 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        로그인
                                    </Link>
                                </motion.div>
                            )}

                            <motion.div
                                variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                                className="mt-4 pt-4 border-t border-slate-200"
                            >
                                <Link
                                    href="/quote"
                                    onClick={() => { resetFileStore(); setMobileOpen(false); }}
                                >
                                    <Button className="w-full h-16 rounded-2xl bg-teal-500 text-white hover:bg-teal-600 font-black text-[17px] gap-2 shadow-2xl shadow-teal-500/20 group active:scale-[0.98] transition-all">
                                        <Zap className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                                        견적 시작하기
                                    </Button>
                                </Link>
                                <p className="text-center text-[10px] text-slate-400 font-medium mt-4 uppercase tracking-[0.3em]">
                                    Wow3d Pro © 2024
                                </p>
                            </motion.div>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
