import type { LucideIcon } from 'lucide-react'
import {
    LayoutDashboard,
    ShoppingCart,
    Settings,
    Home,
    MessageSquare,
    User,
    Users,
    Store,
    Building2,
    Image as ImageIcon,
    HelpCircle,
    BarChart3,
    Mail,
    Megaphone,
    Package,
    ImagePlus,
    BotMessageSquare,
    LayoutGrid,
    ClipboardPen,
    TextSearch,
    Newspaper,
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
                icon: ClipboardPen,
                match: (p) =>
                    p === '/admin/quotes' ||
                    (p.startsWith('/admin/quotes/') && !p.startsWith('/admin/quotes/analytics')),
            },
            {
                title: '견적 전환 유입 분석',
                href: '/admin/quotes/analytics',
                icon: BarChart3,
                match: (p) => p.startsWith('/admin/quotes/analytics'),
            },
            {
                title: '사진(이미지)→AI 3D',
                href: '/admin/meshy',
                icon: ImagePlus,
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
                icon: BotMessageSquare,
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
                icon: LayoutGrid,
                match: (p) => p.startsWith('/admin/showcase'),
            },
            {
                title: '맞춤 상품',
                href: '/admin/custom-products',
                icon: Package,
                match: (p) => p.startsWith('/admin/custom-products'),
            },
            {
                title: '최신 동향',
                href: '/admin/news',
                icon: Newspaper,
                match: (p) => p.startsWith('/admin/news'),
            },
            {
                title: '팝업 관리',
                href: '/admin/popups',
                icon: Megaphone,
                match: (p) => p.startsWith('/admin/popups'),
            },
            {
                title: 'FAQ 관리',
                href: '/admin/qna',
                icon: HelpCircle,
                match: (p) => p.startsWith('/admin/qna'),
            },
            {
                title: '검색어 분석',
                href: '/admin/search-logs',
                icon: TextSearch,
                match: (p) => p.startsWith('/admin/search-logs'),
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

/** 모바일 메뉴 상단 빠른 이동 (업무 빈도 순) */
export const ADMIN_MOBILE_QUICK_LINKS: AdminNavItem[] = [
    { title: '대시보드', href: '/admin', icon: LayoutDashboard, match: (p) => p === '/admin' },
    {
        title: '주문',
        href: '/admin/orders',
        icon: ShoppingCart,
        match: (p) => p.startsWith('/admin/orders'),
    },
    {
        title: '견적',
        href: '/admin/quotes',
        icon: ClipboardPen,
        match: (p) =>
            p === '/admin/quotes' ||
            (p.startsWith('/admin/quotes/') && !p.startsWith('/admin/quotes/analytics')),
    },
    {
        title: '문의',
        href: '/admin/inquiries',
        icon: MessageSquare,
        match: (p) =>
            p.startsWith('/admin/inquiries') && !p.startsWith('/admin/inquiries/faq-draft'),
    },
    {
        title: '전환분석',
        href: '/admin/quotes/analytics',
        icon: BarChart3,
        match: (p) => p.startsWith('/admin/quotes/analytics'),
    },
]

/** 현재 경로에 맞는 관리자 메뉴 제목 (헤더·브레드크럼용) */
export function getAdminPageTitle(pathname: string): string {
    for (const group of ADMIN_NAV_GROUPS) {
        for (const item of group.items) {
            if (item.match(pathname)) return item.title
        }
    }
    for (const item of ADMIN_PLATFORM_NAV_ITEMS) {
        if (item.match(pathname)) return item.title
    }
    if (pathname.startsWith('/admin')) return '관리자'
    return '메뉴'
}

/** 활성 항목이 속한 그룹명 목록 */
export function getActiveAdminNavGroupNames(pathname: string, isSuperAdmin: boolean): string[] {
    const names: string[] = []
    for (const group of ADMIN_NAV_GROUPS) {
        if (group.items.some((item) => item.match(pathname))) names.push(group.groupName)
    }
    if (isSuperAdmin && ADMIN_PLATFORM_NAV_ITEMS.some((item) => item.match(pathname))) {
        names.push('플랫폼 관리 (Super)')
    }
    return names
}
