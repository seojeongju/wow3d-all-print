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
                    <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-white/5 border border-white/5 transition-colors">
                        <Home className="w-3.5 h-3.5" />
                        메인
                    </Link>
                    <Link href="/cart">
                        <button className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/75 hover:text-white hover:border-white/20 transition-colors" title="장바구니">
                            <ShoppingCart className="w-4 h-4" />
                        </button>
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center text-primary">
                            <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white leading-none">{user?.name || '관리자'}</span>
                            <span className="text-[10px] text-white/60 uppercase tracking-wider">관리자</span>
                        </div>
                    </div>
                    <button
                                onClick={() => logout()}
                        className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-red-400 hover:border-red-400/30 transition-colors"
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
                        className="fixed inset-0 top-0 z-[51] md:hidden bg-black/80 backdrop-blur-md"
                        onClick={() => setMobileOpen(false)}
                    >
                        <motion.nav
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute right-0 top-0 bottom-0 w-[min(300px,85vw)] bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col pt-20 px-5 pb-10 gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-4 px-4 py-5 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-600/20 flex items-center justify-center text-primary shadow-inner">
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-black text-white text-base tracking-tight">{user?.name || '관리자'}</p>
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Administrator</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all min-h-[56px] font-bold text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <Home className="w-4.5 h-4.5" />
                                    </div>
                                    메인 서비스
                                </Link>
                                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all min-h-[56px] font-bold text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <Boxes className="w-4.5 h-4.5" />
                                    </div>
                                    관리자 대시보드
                                </Link>
                                <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all min-h-[56px] font-bold text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <ShoppingCart className="w-4.5 h-4.5" />
                                    </div>
                                    장바구니 확인
                                </Link>
                                <Link href="/quote" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-xl text-teal-400 hover:bg-teal-400/10 transition-all min-h-[56px] font-bold text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-teal-400/10 flex items-center justify-center">
                                        <Zap className="w-4.5 h-4.5" />
                                    </div>
                                    실시간 자동견적
                                </Link>
                            </div>

                            <div className="flex-1" />
                            
                            <button
                                type="button"
                                onClick={() => { logout(); setMobileOpen(false); }}
                                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 border border-red-500/10 transition-all min-h-[60px] w-full text-left font-black text-sm group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                시스템 로그아웃
                            </button>
                            <p className="text-center text-[9px] text-white/20 font-black uppercase tracking-[0.2em] mt-4">
                                WOW3D PRO Security System Active
                            </p>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
