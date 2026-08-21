import type { LucideIcon } from 'lucide-react'
import {
    LayoutDashboard,
    ShoppingCart,
    Settings,
    Home,
    MessageSquare,
    User,
    Users,
    FileText,
    Store,
    Building2,
    Image as ImageIcon,
    HelpCircle,
    Sparkles,
    BarChart3,
    Mail,
} from 'lucide-react'

export type AdminNavItem = {
    title: string
    href: string
    icon: LucideIcon
    match: (pathname: string) => boolean
    nested?: boolean
}

export type AdminNavGroup = {
    groupName: string
    items: AdminNavItem[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
    {
        groupName: '메인',
        items: [
            { title: '대시보드', href: '/admin', icon: LayoutDashboard, match: (p) => p === '/admin' },
        ],
    },
    {
        groupName: '스토어 업무',
        items: [
            {
                title: '주문 관리',
                href: '/admin/orders',
                icon: ShoppingCart,
                match: (p) => p.startsWith('/admin/orders'),
            },
            {
                title: '견적 관리',
                href: '/admin/quotes',
                icon: FileText,
                match: (p) =>
                    p === '/admin/quotes' ||
                    (p.startsWith('/admin/quotes/') && !p.startsWith('/admin/quotes/analytics')),
            },
            {
                title: '견적 유입 분석',
                href: '/admin/quotes/analytics',
                icon: BarChart3,
                match: (p) => p.startsWith('/admin/quotes/analytics'),
            },
            {
                title: '사진(이미지)→AI 3D',
                href: '/admin/meshy',
                icon: Sparkles,
                match: (p) => p.startsWith('/admin/meshy'),
            },
            {
                title: '문의 관리',
                href: '/admin/inquiries',
                icon: MessageSquare,
                match: (p) =>
                    p.startsWith('/admin/inquiries') && !p.startsWith('/admin/inquiries/faq-draft'),
            },
            {
                title: 'AI FAQ 작성',
                href: '/admin/inquiries/faq-draft',
                icon: Sparkles,
                match: (p) => p.startsWith('/admin/inquiries/faq-draft'),
                nested: true,
            },
        ],
    },
    {
        groupName: '콘텐츠 관리',
        items: [
            {
                title: '출력 갤러리',
                href: '/admin/gallery',
                icon: ImageIcon,
                match: (p) => p.startsWith('/admin/gallery'),
            },
            {
                title: '쇼케이스',
                href: '/admin/showcase',
                icon: Sparkles,
                match: (p) => p.startsWith('/admin/showcase'),
            },
            {
                title: 'FAQ 관리',
                href: '/admin/qna',
                icon: HelpCircle,
                match: (p) => p.startsWith('/admin/qna'),
            },
        ],
    },
    {
        groupName: '시스템 / 설정',
        items: [
            {
                title: '설정 & 소재',
                href: '/admin/settings',
                icon: Settings,
                match: (p) => p.startsWith('/admin/settings'),
            },
            {
                title: '이메일 템플릿',
                href: '/admin/email-templates',
                icon: Mail,
                match: (p) => p.startsWith('/admin/email-templates'),
            },
            {
                title: '내 정보',
                href: '/admin/profile',
                icon: User,
                match: (p) => p.startsWith('/admin/profile'),
            },
        ],
    },
]

export const ADMIN_PLATFORM_NAV_ITEMS: AdminNavItem[] = [
    {
        title: '사용자 관리',
        href: '/admin/users',
        icon: Users,
        match: (p) => p.startsWith('/admin/users'),
    },
    {
        title: '회사 정보',
        href: '/admin/company',
        icon: Building2,
        match: (p) => p.startsWith('/admin/company'),
    },
    {
        title: '스토어 관리',
        href: '/admin/platform/stores',
        icon: Store,
        match: (p) => p.startsWith('/admin/platform/stores'),
    },
]

export const ADMIN_HOME_NAV_ITEM: AdminNavItem = {
    title: '메인페이지',
    href: '/',
    icon: Home,
    match: (p) => p === '/',
}
