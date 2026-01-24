'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingCart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Header from "@/components/layout/Header";
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();

    // 관리자만 /admin 접근: 비로그인 → /auth, 일반 사용자 → /
    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/auth');
            return;
        }
        if (user && user.role !== 'admin') {
            router.replace('/');
        }
    }, [isAuthenticated, user, router]);

    // 리다이렉트 대기 중에는 로딩만 표시
    if (!isAuthenticated || (user && user.role !== 'admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/20">
                <p className="text-muted-foreground">로딩 중...</p>
            </div>
        );
    }

    const navItems = [
        {
            title: "대시보드",
            href: "/admin",
            icon: LayoutDashboard,
            match: (path: string) => path === "/admin"
        },
        {
            title: "주문 관리",
            href: "/admin/orders",
            icon: ShoppingCart,
            match: (path: string) => path.startsWith("/admin/orders")
        },
        {
            title: "설정 & 자재",
            href: "/admin/settings",
            icon: Settings,
            match: (path: string) => path.startsWith("/admin/settings")
        }
    ];

    return (
        <div className="min-h-screen bg-muted/20">
            <Header />
            <div className="container mx-auto px-4 py-8 flex items-start gap-8">
                {/* Sidebar */}
                <aside className="w-64 shrink-0 hidden lg:block rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <h2 className="text-lg font-bold tracking-tight">관리자 메뉴</h2>
                        <p className="text-sm text-muted-foreground">Wow3D Admin</p>
                    </div>
                    <nav className="px-4 pb-6 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    item.match(pathname)
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
