'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Zap, LogOut, Boxes, Menu, X, Layers, Search, MessageSquare, ChevronRight, Printer } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useFileStore } from "@/store/useFileStore";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
    { label: '서비스', href: '/#services' },
    { label: '기능', href: '/#features' },
    { label: '공정', href: '/#process' },
    { label: '제품소개', href: '/hardware/3d-printer' },
    { label: '주문조회', href: '/my-account' },
    { label: '문의하기', href: '/contact' },
    { label: '대리점 모집', href: '/partnership' },
];

export default function Header() {
    const { getTotalItems } = useCartStore()
    const { isAuthenticated, user, logout } = useAuthStore()
    const { reset: resetFileStore } = useFileStore()
    const cartItemCount = getTotalItems()

    const navItems = NAV_ITEMS.map((item) =>
        item.label === '주문조회' && user?.role === 'admin' ? { ...item, href: '/admin/orders' } : item
    )

    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
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
            ${isScrolled
                ? 'bg-black/70 backdrop-blur-xl border-b border-white/10 py-3'
                : 'bg-black/30 backdrop-blur-sm py-5'}
        `}>
            <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25">
                        <Boxes className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-lg sm:text-xl text-white leading-tight">
                            WOW3D<span className="text-primary/90 font-semibold ml-0.5">PRO</span>
                        </span>
                        <span className="text-[10px] sm:text-xs font-medium text-white/60 leading-tight mt-0.5">
                            <span className="text-primary/80 font-semibold">AI</span> 실시간자동 견적시스템
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav - 가독성 중심 */}
                <nav className="hidden lg:flex items-center gap-0.5 bg-white/[0.06] border border-white/10 rounded-2xl p-1.5 shadow-lg shadow-black/20">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors duration-200"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Link href="/cart">
                        <button className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95" title="장바구니">
                            <ShoppingCart className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                            <AnimatePresence>
                                {cartItemCount > 0 && (
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

                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <Link href={user?.role === 'admin' ? '/admin' : '/my-account'}>
                                <button className="flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/10 transition-all">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="hidden sm:flex flex-col text-left">
                                        <span className="text-xs font-bold text-white leading-tight">{user?.name}</span>
                                        <span className="text-[10px] text-white/50 leading-tight">{user?.role === 'admin' ? '관리자' : '회원'}</span>
                                    </div>
                                </button>
                            </Link>
                            <button
                                onClick={logout}
                                className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-all"
                                title="로그아웃"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Link href="/auth">
                            <Button variant="ghost" className="text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl px-4 h-10 border border-white/10">
                                로그인
                            </Button>
                        </Link>
                    )}

                    <Link href="/quote" className="hidden sm:block" onClick={() => resetFileStore()}>
                        <Button className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl bg-white text-black hover:bg-white/95 font-bold text-[13px] gap-2 shadow-lg">
                            <Zap className="w-4 h-4" />
                            견적 받기
                        </Button>
                    </Link>

                    {/* 모바일 메뉴 버튼 - 대비 확보 */}
                    <button
                        onClick={() => setMobileOpen((o) => !o)}
                        className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/80 border border-slate-600/60 flex items-center justify-center text-white hover:bg-slate-700"
                        aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* 모바일 메뉴 패널 - 슬레이트 톤·대비 개선, safe-area, Cart·Auth 포함 */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 top-0 z-[99] lg:hidden bg-slate-950/95 backdrop-blur-2xl"
                        onClick={() => setMobileOpen(false)}
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
                            className="flex flex-col gap-2.5 max-w-sm mx-auto h-full pt-[max(6rem,calc(6rem+env(safe-area-inset-top,0px)))] pb-10 px-6 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4">
                                <span className="text-[10px] font-bold text-primary/80 uppercase tracking-[0.2em] ml-1">Menu Navigation</span>
                            </div>

                            {navItems.map((item) => (
                                <motion.div key={item.label} variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-slate-100 bg-white/[0.03] border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                            {item.label === '서비스' && <Boxes className="w-4 h-4 text-slate-400 group-hover:text-primary" />}
                                            {item.label === '기능' && <Zap className="w-4 h-4 text-slate-400 group-hover:text-primary" />}
                                            {item.label === '공정' && <Layers className="w-4 h-4 text-slate-400 group-hover:text-primary" />}
                                            {item.label === '주문조회' && <Search className="w-4 h-4 text-slate-400 group-hover:text-primary" />}
                                            {item.label === '문의하기' && <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-primary" />}
                                        </div>
                                        <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                                        <ChevronRight className="w-4 h-4 ml-auto text-slate-600 group-hover:text-primary/50 transition-colors" />
                                    </Link>
                                </motion.div>
                            ))}

                            <div className="h-px bg-white/5 my-2" />

                            <motion.div variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                                <Link
                                    href="/cart"
                                    onClick={() => setMobileOpen(false)}
                                    className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-slate-100 bg-white/[0.03] border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center gap-3 relative group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <span>장바구니</span>
                                    {cartItemCount > 0 && (
                                        <span className="ml-auto min-w-[22px] h-[22px] px-2 flex items-center justify-center bg-primary text-white text-[11px] font-black rounded-full shadow-lg shadow-primary/30">
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
                                            className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-slate-100 bg-white/[0.03] border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center gap-3 group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span>{user?.name}</span>
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{user?.role === 'admin' ? 'Administrator' : 'Premium Member'}</span>
                                            </div>
                                        </Link>
                                    </motion.div>
                                    <motion.div variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                                        <button
                                            type="button"
                                            onClick={() => { logout(); setMobileOpen(false); }}
                                            className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-red-300 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 active:scale-[0.98] transition-all flex items-center gap-3 w-full text-left"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
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
                                        className="px-5 py-4 min-h-[52px] rounded-2xl text-[16px] font-bold text-slate-100 bg-white/[0.03] border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center gap-3 group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        로그인
                                    </Link>
                                </motion.div>
                            )}

                            <motion.div
                                variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                                className="mt-4 pt-4 border-t border-white/5"
                            >
                                <Link
                                    href="/quote"
                                    onClick={() => { resetFileStore(); setMobileOpen(false); }}
                                >
                                    <Button className="w-full h-16 rounded-2xl bg-white text-black hover:bg-slate-100 font-black text-[17px] gap-2 shadow-2xl shadow-white/5 group active:scale-[0.98] transition-all">
                                        <Zap className="w-5 h-5 fill-black group-hover:scale-110 transition-transform" />
                                        견적 시작하기
                                    </Button>
                                </Link>
                                <p className="text-center text-[10px] text-white/30 font-medium mt-4 uppercase tracking-[0.3em]">
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
