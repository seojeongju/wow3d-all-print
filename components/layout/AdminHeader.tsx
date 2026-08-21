'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Boxes, LogOut, Zap, ShoppingCart, User, Home, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    ADMIN_HOME_NAV_ITEM,
    ADMIN_NAV_GROUPS,
    ADMIN_PLATFORM_NAV_ITEMS,
} from '@/lib/admin-nav';

export default function AdminHeader() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const isSuperAdmin = user?.store_id === 1 || user?.role === 'super_admin';

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mobileOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    return (
        <header
            className={cn(
                'sticky top-0 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl',
                mobileOpen ? 'z-[210]' : 'z-50'
            )}
        >
            <div className="relative z-[52] container mx-auto px-4 min-h-14 flex items-center justify-between gap-2">
                <Link href="/admin" className="flex items-center gap-2 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                        <Boxes className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-white tracking-tight hidden sm:inline">WOW3D PRO</span>
                </Link>

                {/* 데스크톱(lg+): 사이드바와 함께 쓰는 상단 액션 */}
                <div className="hidden lg:flex items-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/75 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
                    >
                        <Home className="w-3.5 h-3.5" />
                        메인
                    </Link>
                    <Link href="/cart">
                        <button
                            className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/75 hover:text-white hover:border-white/20 transition-colors"
                            title="장바구니"
                        >
                            <ShoppingCart className="w-4 h-4" />
                        </button>
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center text-primary">
                            <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white leading-none">
                                {user?.name || '관리자'}
                            </span>
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
                        <Button
                            size="sm"
                            className="h-9 rounded-lg bg-white text-black hover:bg-white/90 font-bold text-xs gap-1.5"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            견적 받기
                        </Button>
                    </Link>
                </div>

                {/* 모바일·태블릿: 사이드바 대신 전체 관리 메뉴 */}
                <div className="flex lg:hidden items-center gap-2">
                    <Link href="/quote">
                        <Button
                            size="sm"
                            className="h-9 rounded-lg bg-white text-black hover:bg-white/90 font-bold text-xs gap-1"
                        >
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

            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {mobileOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-[200] lg:hidden bg-[#0a0a0a]"
                                role="dialog"
                                aria-modal="true"
                                aria-label="관리자 메뉴"
                            >
                                <motion.nav
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.22 }}
                                    className="flex flex-col h-full pt-[max(4.5rem,calc(3.5rem+env(safe-area-inset-top,0px)))] pb-[max(1.5rem,env(safe-area-inset-bottom))] px-5 overflow-y-auto overscroll-contain"
                                >
                                    <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.25em] mb-4">
                                        Admin Menu
                                    </p>

                                    <div className="flex items-center gap-4 px-4 py-5 rounded-2xl bg-[#141414] border border-white/10 mb-5 shadow-lg shadow-black/40">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-indigo-600/30 flex items-center justify-center text-primary">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <p className="font-black text-white text-base tracking-tight truncate">
                                                {user?.name || '관리자'}
                                            </p>
                                            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mt-0.5">
                                                {isSuperAdmin ? 'Super Administrator' : 'Administrator'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-5 pb-4">
                                        {ADMIN_NAV_GROUPS.map((group) => (
                                            <div key={group.groupName} className="space-y-2">
                                                <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.2em] px-1">
                                                    {group.groupName}
                                                </p>
                                                <div className="space-y-1.5">
                                                    {group.items.map((item) => {
                                                        const active = item.match(pathname);
                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                onClick={() => setMobileOpen(false)}
                                                                className={cn(
                                                                    'flex items-center gap-3 px-3.5 py-3.5 rounded-2xl border transition-all min-h-[52px] font-bold text-sm',
                                                                    item.nested && 'ml-3',
                                                                    active
                                                                        ? 'text-teal-200 bg-teal-500/15 border-teal-500/35'
                                                                        : 'text-white bg-[#141414] border-white/10 hover:border-white/20 hover:bg-[#1a1a1a]'
                                                                )}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                                                        active ? 'bg-teal-500/20' : 'bg-white/10'
                                                                    )}
                                                                >
                                                                    <item.icon className="w-4.5 h-4.5" />
                                                                </div>
                                                                {item.title}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {isSuperAdmin && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-yellow-500/60 uppercase tracking-[0.2em] px-1">
                                                    플랫폼 관리 (Super)
                                                </p>
                                                <div className="space-y-1.5">
                                                    {ADMIN_PLATFORM_NAV_ITEMS.map((item) => {
                                                        const active = item.match(pathname);
                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                onClick={() => setMobileOpen(false)}
                                                                className={cn(
                                                                    'flex items-center gap-3 px-3.5 py-3.5 rounded-2xl border transition-all min-h-[52px] font-bold text-sm',
                                                                    active
                                                                        ? 'text-yellow-300 bg-yellow-500/15 border-yellow-500/35'
                                                                        : 'text-white bg-[#141414] border-white/10 hover:border-white/20 hover:bg-[#1a1a1a]'
                                                                )}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                                                        active ? 'bg-yellow-500/20' : 'bg-white/10'
                                                                    )}
                                                                >
                                                                    <item.icon className="w-4.5 h-4.5" />
                                                                </div>
                                                                {item.title}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5 pt-1">
                                            <Link
                                                href={ADMIN_HOME_NAV_ITEM.href}
                                                onClick={() => setMobileOpen(false)}
                                                className="flex items-center gap-3 px-3.5 py-3.5 rounded-2xl text-white bg-[#141414] border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] transition-all min-h-[52px] font-bold text-sm"
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                                    <Home className="w-4.5 h-4.5" />
                                                </div>
                                                {ADMIN_HOME_NAV_ITEM.title}
                                            </Link>
                                            <Link
                                                href="/cart"
                                                onClick={() => setMobileOpen(false)}
                                                className="flex items-center gap-3 px-3.5 py-3.5 rounded-2xl text-white bg-[#141414] border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] transition-all min-h-[52px] font-bold text-sm"
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                                    <ShoppingCart className="w-4.5 h-4.5" />
                                                </div>
                                                장바구니 확인
                                            </Link>
                                            <Link
                                                href="/quote"
                                                onClick={() => setMobileOpen(false)}
                                                className="flex items-center gap-3 px-3.5 py-3.5 rounded-2xl text-teal-300 bg-teal-500/10 border border-teal-500/25 hover:bg-teal-500/15 transition-all min-h-[52px] font-bold text-sm"
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                                                    <Zap className="w-4.5 h-4.5" />
                                                </div>
                                                실시간 자동견적
                                            </Link>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            logout();
                                            setMobileOpen(false);
                                        }}
                                        className="flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-all min-h-[60px] w-full text-left font-black text-sm mt-2"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                                            <LogOut className="w-5 h-5" />
                                        </div>
                                        시스템 로그아웃
                                    </button>
                                    <p className="text-center text-[9px] text-white/25 font-black uppercase tracking-[0.2em] mt-4 pb-2">
                                        WOW3D PRO Security System Active
                                    </p>
                                </motion.nav>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </header>
    );
}
