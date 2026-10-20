'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Boxes, LogOut, Zap, ShoppingCart, User, Home, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { getAdminPageTitle } from '@/lib/admin-nav';
import AdminMobileNav from '@/components/admin/AdminMobileNav';

export default function AdminHeader() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pageTitle = getAdminPageTitle(pathname);

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
            <div className="relative z-[52] mx-auto flex min-h-14 w-full max-w-full min-w-0 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <Link href="/admin" className="flex shrink-0 items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600">
                            <Boxes className="h-5 w-5 text-white" />
                        </div>
                        <span className="hidden truncate font-bold tracking-tight text-white md:inline">
                            WOW3D PRO
                        </span>
                    </Link>
                    {/* 모바일: 현재 화면 제목으로 위치 파악 */}
                    <div className="min-w-0 lg:hidden">
                        <p className="truncate text-sm font-black tracking-tight text-white">
                            {pageTitle}
                        </p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-white/35">
                            Admin
                        </p>
                    </div>
                </div>

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
                            type="button"
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
                        type="button"
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

                {/* 모바일·태블릿: 사이드바 대신 드로어 메뉴 */}
                <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
                    <Link
                        href="/admin/orders"
                        className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 touch-manipulation"
                        title="주문 관리"
                        aria-label="주문 관리"
                    >
                        <ShoppingCart className="w-4 h-4" />
                    </Link>
                    <Link href="/quote">
                        <Button
                            size="sm"
                            className="h-10 rounded-xl bg-white text-black hover:bg-white/90 font-bold text-xs gap-1 px-2.5 sm:px-3"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="hidden min-[360px]:inline">견적</span>
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
                    <AdminMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />,
                    document.body
                )}
        </header>
    );
}
