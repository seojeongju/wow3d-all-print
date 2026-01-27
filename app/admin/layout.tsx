'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingCart, Settings, Boxes, Home, MessageSquare, User, Users, FileText, Store, CreditCard } from 'lucide-react';
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
        if (user && user.role !== 'admin' && user.role !== 'super_admin') {
            router.replace('/');
        }
    }, [isAuthenticated, user, router]);

    if (!isAuthenticated || (user && user.role !== 'admin' && user.role !== 'super_admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <p className="text-white/40">로딩 중...</p>
            </div>
        );
    }

    const navItems = [
        { title: '대시보드', href: '/admin', icon: LayoutDashboard, match: (p: string) => p === '/admin' },
        { title: '내 정보', href: '/admin/profile', icon: User, match: (p: string) => p.startsWith('/admin/profile') },
        { title: '사용자 관리', href: '/admin/users', icon: Users, match: (p: string) => p.startsWith('/admin/users') },
        { title: '주문 관리', href: '/admin/orders', icon: ShoppingCart, match: (p: string) => p.startsWith('/admin/orders') },
        { title: '견적 관리', href: '/admin/quotes', icon: FileText, match: (p: string) => p.startsWith('/admin/quotes') },
        { title: '문의 관리', href: '/admin/inquiries', icon: MessageSquare, match: (p: string) => p.startsWith('/admin/inquiries') },
        { title: '설정 & 소재', href: '/admin/settings', icon: Settings, match: (p: string) => p.startsWith('/admin/settings') },
    ];

    const isSuperAdmin = user?.store_id === 1 || user?.role === 'super_admin';
    const platformNavItems = [
        { title: '스토어 관리', href: '/admin/platform/stores', icon: Store, match: (p: string) => p.startsWith('/admin/platform/stores') },
        // { title: '전체 결제', href: '/admin/platform/billing', icon: CreditCard, match: (p: string) => p.startsWith('/admin/platform/billing') },
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
                                <div className="font-black text-sm tracking-tight text-white">{isSuperAdmin ? 'WOW3D PLATFORM' : 'SELLER ADMIN'}</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wider">{user?.name} STORE</div>
                            </div>
                        </div>
                    </div>
                    <div className="px-3 py-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 px-3">스토어 메뉴</div>
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

                            {isSuperAdmin && platformNavItems.length > 0 && (
                                <>
                                    <div className="my-4 mx-3 h-px bg-white/10" />
                                    <div className="text-[10px] font-bold text-yellow-500/50 uppercase tracking-widest mb-3 px-3">플랫폼 관리 (Super)</div>
                                    {platformNavItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                                item.match(pathname)
                                                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                                    : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
                                            )}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.title}
                                        </Link>
                                    ))}
                                </>
                            )}

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
