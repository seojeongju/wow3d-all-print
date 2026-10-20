'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
    ChevronDown,
    Home,
    LogOut,
    Search,
    ShoppingCart,
    User,
    Zap,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import {
    ADMIN_HOME_NAV_ITEM,
    ADMIN_MOBILE_QUICK_LINKS,
    ADMIN_NAV_GROUPS,
    ADMIN_PLATFORM_NAV_ITEMS,
    getActiveAdminNavGroupNames,
    type AdminNavItem,
} from '@/lib/admin-nav'

type AdminMobileNavProps = {
    open: boolean
    onClose: () => void
}

function NavRow({
    item,
    active,
    onNavigate,
    accent = 'primary',
}: {
    item: AdminNavItem
    active: boolean
    onNavigate: () => void
    accent?: 'primary' | 'yellow'
}) {
    const activeCls =
        accent === 'yellow'
            ? 'text-yellow-300 bg-yellow-500/15 border-yellow-500/35'
            : 'text-teal-200 bg-teal-500/15 border-teal-500/35'
    const iconActive =
        accent === 'yellow' ? 'bg-yellow-500/20' : 'bg-teal-500/20'

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
                'flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all min-h-[48px] font-bold text-sm',
                item.nested && 'ml-2',
                active
                    ? activeCls
                    : 'text-white bg-[#141414] border-white/10 active:bg-[#1a1a1a]'
            )}
        >
            <div
                className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    active ? iconActive : 'bg-white/10'
                )}
            >
                <item.icon className="w-4 h-4" />
            </div>
            <span className="truncate">{item.title}</span>
        </Link>
    )
}

function CollapsibleGroup({
    title,
    open,
    onToggle,
    children,
    titleClassName,
}: {
    title: string
    open: boolean
    onToggle: () => void
    children: React.ReactNode
    titleClassName?: string
}) {
    return (
        <div className="space-y-1.5">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-2 px-1 py-1.5 min-h-[40px] touch-manipulation"
                aria-expanded={open}
            >
                <span
                    className={cn(
                        'text-[10px] font-black uppercase tracking-[0.2em]',
                        titleClassName ?? 'text-white/35'
                    )}
                >
                    {title}
                </span>
                <ChevronDown
                    className={cn(
                        'w-4 h-4 text-white/35 transition-transform',
                        open && 'rotate-180'
                    )}
                />
            </button>
            {open ? <div className="space-y-1.5">{children}</div> : null}
        </div>
    )
}

export default function AdminMobileNav({ open, onClose }: AdminMobileNavProps) {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const isSuperAdmin = user?.store_id === 1 || user?.role === 'super_admin'
    const [query, setQuery] = useState('')
    const searchRef = useRef<HTMLInputElement>(null)
    const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set())

    useEffect(() => {
        if (!open) {
            setQuery('')
            return
        }
        const active = getActiveAdminNavGroupNames(pathname, isSuperAdmin)
        setOpenGroups(new Set(active.length ? active : [ADMIN_NAV_GROUPS[0]?.groupName].filter(Boolean)))
        const t = window.setTimeout(() => searchRef.current?.blur(), 0)
        return () => window.clearTimeout(t)
    }, [open, pathname, isSuperAdmin])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    const q = query.trim().toLowerCase()
    const filtering = q.length > 0

    const filteredGroups = useMemo(() => {
        return ADMIN_NAV_GROUPS.map((group) => ({
            ...group,
            items: filtering
                ? group.items.filter((item) => item.title.toLowerCase().includes(q))
                : group.items,
        })).filter((g) => g.items.length > 0)
    }, [q, filtering])

    const filteredPlatform = useMemo(() => {
        if (!isSuperAdmin) return [] as AdminNavItem[]
        if (!filtering) return ADMIN_PLATFORM_NAV_ITEMS
        return ADMIN_PLATFORM_NAV_ITEMS.filter((item) => item.title.toLowerCase().includes(q))
    }, [isSuperAdmin, filtering, q])

    const toggleGroup = (name: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })
    }

    const isGroupOpen = (name: string) => filtering || openGroups.has(name)

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[200] lg:hidden bg-[#0a0a0a]/85 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label="관리자 메뉴"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                        className="absolute inset-y-0 right-0 flex w-full max-w-[22rem] flex-col border-l border-white/10 bg-[#0c0c0c] shadow-2xl shadow-black/60"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="shrink-0 border-b border-white/5 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
                            <div className="flex items-center gap-3 py-2">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-indigo-600/30 flex items-center justify-center text-primary shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-black text-white text-sm tracking-tight truncate">
                                        {user?.name || '관리자'}
                                    </p>
                                    <p className="text-[10px] text-white/45 uppercase font-bold tracking-wider mt-0.5">
                                        {isSuperAdmin ? 'Super Admin' : 'Administrator'}
                                    </p>
                                </div>
                            </div>

                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                                <input
                                    ref={searchRef}
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="메뉴 검색 (주문, 견적…)"
                                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/30"
                                    enterKeyHint="search"
                                    autoComplete="off"
                                />
                            </div>

                            {!filtering && (
                                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                                    {ADMIN_MOBILE_QUICK_LINKS.map((item) => {
                                        const active = item.match(pathname)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={onClose}
                                                className={cn(
                                                    'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-bold min-h-[40px] touch-manipulation',
                                                    active
                                                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-200'
                                                        : 'bg-white/5 border-white/10 text-white/75'
                                                )}
                                            >
                                                <item.icon className="w-3.5 h-3.5" />
                                                {item.title}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
                            {filteredGroups.map((group) => (
                                <CollapsibleGroup
                                    key={group.groupName}
                                    title={group.groupName}
                                    open={isGroupOpen(group.groupName)}
                                    onToggle={() => toggleGroup(group.groupName)}
                                >
                                    {group.items.map((item) => (
                                        <NavRow
                                            key={item.href}
                                            item={item}
                                            active={item.match(pathname)}
                                            onNavigate={onClose}
                                        />
                                    ))}
                                </CollapsibleGroup>
                            ))}

                            {filteredPlatform.length > 0 && (
                                <CollapsibleGroup
                                    title="플랫폼 관리 (Super)"
                                    open={isGroupOpen('플랫폼 관리 (Super)')}
                                    onToggle={() => toggleGroup('플랫폼 관리 (Super)')}
                                    titleClassName="text-yellow-500/55"
                                >
                                    {filteredPlatform.map((item) => (
                                        <NavRow
                                            key={item.href}
                                            item={item}
                                            active={item.match(pathname)}
                                            onNavigate={onClose}
                                            accent="yellow"
                                        />
                                    ))}
                                </CollapsibleGroup>
                            )}

                            {filtering &&
                                filteredGroups.length === 0 &&
                                filteredPlatform.length === 0 && (
                                    <p className="text-center text-sm text-white/35 py-10 break-keep">
                                        &ldquo;{query.trim()}&rdquo;에 맞는 메뉴가 없습니다.
                                    </p>
                                )}

                            {!filtering && (
                                <div className="space-y-1.5 pt-1 border-t border-white/5">
                                    <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.2em] px-1 pt-3">
                                        바로가기
                                    </p>
                                    <ExtraLink
                                        href={ADMIN_HOME_NAV_ITEM.href}
                                        icon={Home}
                                        label={ADMIN_HOME_NAV_ITEM.title}
                                        onNavigate={onClose}
                                    />
                                    <ExtraLink
                                        href="/cart"
                                        icon={ShoppingCart}
                                        label="장바구니 확인"
                                        onNavigate={onClose}
                                    />
                                    <ExtraLink
                                        href="/quote"
                                        icon={Zap}
                                        label="실시간 자동견적"
                                        onNavigate={onClose}
                                        highlight
                                    />
                                </div>
                            )}
                        </nav>

                        <div className="shrink-0 border-t border-white/5 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#0c0c0c]">
                            <button
                                type="button"
                                onClick={() => {
                                    logout()
                                    onClose()
                                }}
                                className="flex items-center gap-3 px-3.5 py-3.5 rounded-2xl text-red-400 bg-red-500/10 border border-red-500/20 active:bg-red-500/15 transition-all min-h-[52px] w-full text-left font-bold text-sm touch-manipulation"
                            >
                                <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                로그아웃
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function ExtraLink({
    href,
    icon: Icon,
    label,
    onNavigate,
    highlight,
}: {
    href: string
    icon: LucideIcon
    label: string
    onNavigate: () => void
    highlight?: boolean
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
                'flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all min-h-[48px] font-bold text-sm',
                highlight
                    ? 'text-teal-300 bg-teal-500/10 border-teal-500/25'
                    : 'text-white bg-[#141414] border-white/10'
            )}
        >
            <div
                className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    highlight ? 'bg-teal-500/20' : 'bg-white/10'
                )}
            >
                <Icon className="w-4 h-4" />
            </div>
            {label}
        </Link>
    )
}
