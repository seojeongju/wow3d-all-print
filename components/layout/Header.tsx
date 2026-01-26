'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Zap, LogOut, Boxes, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useFileStore } from "@/store/useFileStore";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
    { label: '서비스', href: '/#services' },
    { label: '기능', href: '/#features' },
    { label: '공정', href: '/#process' },
    { label: '주문조회', href: '/my-account' },
    { label: '문의하기', href: '/contact' },
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

                    {/* 모바일 메뉴 버튼 */}
                    <button
                        onClick={() => setMobileOpen((o) => !o)}
                        className="lg:hidden w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/90 hover:bg-white/10"
                        aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* 모바일 메뉴 패널 */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 top-0 z-[99] lg:hidden pt-20 pb-8 px-6 bg-black/95 backdrop-blur-xl overflow-y-auto"
                        onClick={() => setMobileOpen(false)}
                    >
                        <nav className="flex flex-col gap-1 max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="px-5 py-4 rounded-xl text-[15px] font-semibold text-white bg-white/[0.06] border border-white/10 hover:bg-white/10"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link href="/quote" onClick={() => { resetFileStore(); setMobileOpen(false); }} className="mt-4">
                                <Button className="w-full h-12 rounded-xl bg-white text-black font-bold text-[15px] gap-2">
                                    <Zap className="w-4 h-4" />
                                    견적 받기
                                </Button>
                            </Link>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
