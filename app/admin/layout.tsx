'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Boxes, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminHeader from '@/components/layout/AdminHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { safeAuthReturnPath } from '@/lib/auth-session';
import {
    ADMIN_HOME_NAV_ITEM,
    ADMIN_NAV_GROUPS,
    ADMIN_PLATFORM_NAV_ITEMS,
} from '@/lib/admin-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, user, token, logout } = useAuthStore();

    useEffect(() => {
        const checkAuth = async () => {
            const returnPath = safeAuthReturnPath(
                typeof window !== 'undefined'
                    ? `${window.location.pathname}${window.location.search}`
                    : pathname,
                '/admin'
            );
            const authUrl = `/auth?return=${encodeURIComponent(returnPath)}`;

            if (!isAuthenticated || !token) {
                router.replace(authUrl);
                return;
            }

            try {
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                });

                const data = await res.json();

                if (res.status === 401 || (data && data.error === '유효하지 않은 토큰입니다')) {
                    console.warn('AdminLayout: Session expired or invalid');
                    logout();
                    window.location.href = `${authUrl}&expired=true`;
                    return;
                }

                if (data.success && data.data) {
                    const role = data.data.role;
                    if (role !== 'admin' && role !== 'super_admin') {
                        router.replace('/');
                    }
                }
            } catch (err) {
                console.error('AdminLayout: Auth check failed', err);
            }
        };

        checkAuth();
    }, [isAuthenticated, token, router, logout, pathname]);

    if (!isAuthenticated || (user && user.role !== 'admin' && user.role !== 'super_admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <p className="text-white/40">로딩 중...</p>
            </div>
        );
    }

    const isSuperAdmin = user?.store_id === 1 || user?.role === 'super_admin';

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <AdminHeader />
            <div className="flex">
                <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-white/5 bg-[#0c0c0c] min-h-[calc(100vh-3.5rem)]">
                    <div className="p-5 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                                <Boxes className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="font-black text-sm tracking-tight text-white">
                                    {isSuperAdmin ? 'WOW3D PLATFORM' : 'SELLER ADMIN'}
                                </div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wider">
                                    {user?.name} STORE
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-3 py-4 space-y-6 overflow-y-auto">
                        {ADMIN_NAV_GROUPS.map((group, gIdx) => (
                            <div key={gIdx}>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-3">
                                    {group.groupName}
                                </div>
                                <nav className="space-y-1">
                                    {group.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                                item.nested ? 'pl-8 pr-3' : 'px-3',
                                                item.match(pathname)
                                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                                    : 'text-white/75 hover:bg-white/5 hover:text-white border border-transparent'
                                            )}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.title}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        ))}

                        {isSuperAdmin && ADMIN_PLATFORM_NAV_ITEMS.length > 0 && (
                            <div>
                                <div className="my-4 mx-3 h-px bg-white/10" />
                                <div className="text-[10px] font-bold text-yellow-500/50 uppercase tracking-widest mb-2 px-3">
                                    플랫폼 관리 (Super)
                                </div>
                                <nav className="space-y-1">
                                    {ADMIN_PLATFORM_NAV_ITEMS.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                                item.match(pathname)
                                                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                                    : 'text-white/75 hover:bg-white/5 hover:text-white border border-transparent'
                                            )}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.title}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        )}

                        <div>
                            <div className="my-3 mx-3 h-px bg-white/10" />
                            <nav className="space-y-1">
                                <Link
                                    href={ADMIN_HOME_NAV_ITEM.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/75 hover:bg-white/5 hover:text-white border border-transparent transition-all"
                                >
                                    <Home className="w-4 h-4" />
                                    {ADMIN_HOME_NAV_ITEM.title}
                                </Link>
                            </nav>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
