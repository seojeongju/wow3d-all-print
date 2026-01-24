'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Boxes, LogOut, Zap, ShoppingCart, User, Home } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminHeader() {
    const { user, logout } = useAuthStore();

    return (
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                            <Boxes className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-white tracking-tight">WOW3D PRO</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 border border-white/5 transition-colors">
                        <Home className="w-3.5 h-3.5" />
                        메인
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/cart">
                        <button className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-colors">
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
            </div>
        </header>
    );
}
