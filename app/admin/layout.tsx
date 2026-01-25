'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingCart, Settings, Boxes, Home, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminHeader from '@/components/layout/AdminHeader';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/auth');
            return;
        }
        if (user && user.role !== 'admin') {
            router.replace('/');
        }
    }, [isAuthenticated, user, router]);

    if (!isAuthenticated || (user && user.role !== 'admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <p className="text-white/40">로딩 중...</p>
            </div>
        );
    }

    const navItems = [
        { title: '대시보드', href: '/admin', icon: LayoutDashboard, match: (p: string) => p === '/admin' },
        { title: '내 정보', href: '/admin/profile', icon: User, match: (p: string) => p.startsWith('/admin/profile') },
        { title: '주문 관리', href: '/admin/orders', icon: ShoppingCart, match: (p: string) => p.startsWith('/admin/orders') },
        { title: '문의 관리', href: '/admin/inquiries', icon: MessageSquare, match: (p: string) => p.startsWith('/admin/inquiries') },
        { title: '설정 & 자재', href: '/admin/settings', icon: Settings, match: (p: string) => p.startsWith('/admin/settings') },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <AdminHeader />
            <div className="flex">
                {/* Sidebar - 다크 테마 */}
                <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-white/5 bg-[#0c0c0c] min-h-[calc(100vh-3.5rem)]">
                    <div className="p-5 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                                <Boxes className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="font-black text-sm tracking-tight text-white">WOW3D PRO</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wider">Industrial 3D System</div>
                            </div>
                        </div>
                    </div>
                    <div className="px-3 py-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 px-3">관리자 메뉴</div>
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                        item.match(pathname)
                                            ? 'bg-primary/20 text-primary border border-primary/30'
                                            : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.title}
                                </Link>
                            ))}
                            <div className="my-3 mx-3 h-px bg-white/10" />
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white border border-transparent transition-all"
                            >
                                <Home className="w-4 h-4" />
                                메인페이지
                            </Link>
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
