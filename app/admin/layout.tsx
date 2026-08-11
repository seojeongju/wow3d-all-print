'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingCart, Settings, Boxes, Home, MessageSquare, User, Users, FileText, Store, CreditCard, Building2, Image as ImageIcon, HelpCircle, Sparkles, BarChart3, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminHeader from '@/components/layout/AdminHeader';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, user, token, logout } = useAuthStore();

    useEffect(() => {
        const checkAuth = async () => {
            if (!isAuthenticated || !token) {
                router.replace('/auth');
                return;
            }

            try {
                // me API를 통해 토큰 유효성 동적 확인
                const res = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    cache: 'no-store'
                });

                const data = await res.json();

                if (res.status === 401 || (data && data.error === '유효하지 않은 토큰입니다')) {
                    console.warn('AdminLayout: Session expired or invalid');
                    logout();
                    window.location.href = '/auth?expired=true';
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
    }, [isAuthenticated, token, router, logout]);

    if (!isAuthenticated || (user && user.role !== 'admin' && user.role !== 'super_admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <p className="text-white/40">로딩 중...</p>
            </div>
        );
    }

    const navGroups = [
        {
            groupName: '메인',
            items: [
                { title: '대시보드', href: '/admin', icon: LayoutDashboard, match: (p: string) => p === '/admin' },
            ],
        },
        {
            groupName: '스토어 업무',
            items: [
                { title: '주문 관리', href: '/admin/orders', icon: ShoppingCart, match: (p: string) => p.startsWith('/admin/orders') },
                { title: '견적 관리', href: '/admin/quotes', icon: FileText, match: (p: string) => p === '/admin/quotes' || p.startsWith('/admin/quotes/') && !p.startsWith('/admin/quotes/analytics') },
                { title: '견적 유입 분석', href: '/admin/quotes/analytics', icon: BarChart3, match: (p: string) => p.startsWith('/admin/quotes/analytics') },
                {
                    title: '문의 관리',
                    href: '/admin/inquiries',
                    icon: MessageSquare,
                    match: (p: string) =>
                        p.startsWith('/admin/inquiries') && !p.startsWith('/admin/inquiries/faq-draft'),
                },
                {
                    title: 'AI FAQ 작성',
                    href: '/admin/inquiries/faq-draft',
                    icon: Sparkles,
                    match: (p: string) => p.startsWith('/admin/inquiries/faq-draft'),
                    nested: true,
                },
            ],
        },
        {
            groupName: '콘텐츠 관리',
            items: [
                { title: '출력 갤러리', href: '/admin/gallery', icon: ImageIcon, match: (p: string) => p.startsWith('/admin/gallery') },
                { title: '쇼케이스', href: '/admin/showcase', icon: Sparkles, match: (p: string) => p.startsWith('/admin/showcase') },
                { title: 'FAQ 관리', href: '/admin/qna', icon: HelpCircle, match: (p: string) => p.startsWith('/admin/qna') },
            ],
        },
        {
            groupName: '시스템 / 설정',
            items: [
                { title: '설정 & 소재', href: '/admin/settings', icon: Settings, match: (p: string) => p.startsWith('/admin/settings') },
                { title: '이메일 템플릿', href: '/admin/email-templates', icon: Mail, match: (p: string) => p.startsWith('/admin/email-templates') },
                { title: '내 정보', href: '/admin/profile', icon: User, match: (p: string) => p.startsWith('/admin/profile') },
            ],
        },
    ];


    const isSuperAdmin = user?.store_id === 1 || user?.role === 'super_admin';
    const platformNavItems = [
        { title: '사용자 관리', href: '/admin/users', icon: Users, match: (p: string) => p.startsWith('/admin/users') },
        { title: '회사 정보', href: '/admin/company', icon: Building2, match: (p: string) => p.startsWith('/admin/company') },
        { title: '스토어 관리', href: '/admin/platform/stores', icon: Store, match: (p: string) => p.startsWith('/admin/platform/stores') },
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
                    <div className="px-3 py-4 space-y-6">
                        {navGroups.map((group, gIdx) => (
                            <div key={gIdx}>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-3">{group.groupName}</div>
                                <nav className="space-y-1">
                                    {group.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                                'nested' in item && item.nested ? 'pl-8 pr-3' : 'px-3',
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

                        {isSuperAdmin && platformNavItems.length > 0 && (
                            <div>
                                <div className="my-4 mx-3 h-px bg-white/10" />
                                <div className="text-[10px] font-bold text-yellow-500/50 uppercase tracking-widest mb-2 px-3">플랫폼 관리 (Super)</div>
                                <nav className="space-y-1">
                                    {platformNavItems.map((item) => (
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
                                    href="/"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/75 hover:bg-white/5 hover:text-white border border-transparent transition-all"
                                >
                                    <Home className="w-4 h-4" />
                                    메인페이지
                                </Link>
                            </nav>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
