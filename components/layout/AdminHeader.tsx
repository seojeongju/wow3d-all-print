'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Boxes, LogOut, Zap, ShoppingCart, User, Home, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminHeader() {
    const { user, logout } = useAuthStore();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (mobileOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    return (
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl">
            <div className="relative z-[52] container mx-auto px-4 min-h-14 flex items-center justify-between gap-2">
                <Link href="/admin" className="flex items-center gap-2 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                        <Boxes className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-white tracking-tight hidden sm:inline">WOW3D PRO</span>
                </Link>

                {/* 데스크톱: 기존 가로 메뉴 */}
                <div className="hidden md:flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 border border-white/5 transition-colors">
                        <Home className="w-3.5 h-3.5" />
                        메인
                    </Link>
                    <Link href="/cart">
                        <button className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-colors" title="장바구니">
                            <ShoppingCart className="w-4 h-4" />
                        </button>
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center text-primary">
                            <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white leading-none">{user?.name || '관리자'}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">관리자</span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-400/30 transition-colors"
                        title="로그아웃"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                    <Link href="/quote">
                        <Button size="sm" className="h-9 rounded-lg bg-white text-black hover:bg-white/90 font-bold text-xs gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            견적 받기
                        </Button>
                    </Link>
                </div>

                {/* 모바일: 햄버거 + 패널 */}
                <div className="flex md:hidden items-center gap-2">
                    <Link href="/quote">
                        <Button size="sm" className="h-9 rounded-lg bg-white text-black hover:bg-white/90 font-bold text-xs gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            견적
                        </Button>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMobileOpen((o) => !o)}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 touch-manipulation"
                        aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 top-0 z-[51] md:hidden bg-black/80 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    >
                        <motion.nav
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.2 }}
                            className="absolute right-0 top-0 bottom-0 w-[min(280px,85vw)] bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col pt-20 px-4 pb-8 gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/10 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-white">{user?.name || '관리자'}</p>
                                    <p className="text-[10px] text-white/50 uppercase">관리자</p>
                                </div>
                            </div>
                            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-colors min-h-[48px]">
                                <Home className="w-5 h-5 text-white/60" />
                                메인
                            </Link>
                            <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-colors min-h-[48px]">
                                <Boxes className="w-5 h-5 text-white/60" />
                                관리 홈
                            </Link>
                            <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-colors min-h-[48px]">
                                <ShoppingCart className="w-5 h-5 text-white/60" />
                                장바구니
                            </Link>
                            <Link href="/quote" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-colors min-h-[48px]">
                                <Zap className="w-5 h-5 text-white/60" />
                                견적 받기
                            </Link>
                            <div className="flex-1" />
                            <button
                                type="button"
                                onClick={() => { logout(); setMobileOpen(false); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors min-h-[48px] w-full text-left"
                            >
                                <LogOut className="w-5 h-5" />
                                로그아웃
                            </button>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
