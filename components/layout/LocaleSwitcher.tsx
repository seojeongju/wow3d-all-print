'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

type Props = {
    className?: string
    compact?: boolean
    /** 흰/밝은 헤더 배경용 — 비활성 라벨 대비 확보 */
    light?: boolean
}

export default function LocaleSwitcher({ className, compact, light }: Props) {
    const t = useTranslations('LocaleSwitcher')
    const locale = useLocale() as AppLocale
    const pathname = usePathname()
    const router = useRouter()

    const switchLocale = (next: AppLocale) => {
        if (next === locale) return
        router.replace(pathname, { locale: next })
    }

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-xl border p-0.5',
                light
                    ? 'border-slate-200 bg-slate-100/90'
                    : 'border-white/15 bg-white/[0.04]',
                className,
            )}
            role="group"
            aria-label={t('label')}
        >
            {routing.locales.map((code) => {
                const active = code === locale
                return (
                    <button
                        key={code}
                        type="button"
                        onClick={() => switchLocale(code)}
                        className={cn(
                            'rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors',
                            active
                                ? 'bg-teal-400 text-slate-950 shadow-sm'
                                : light
                                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                                  : 'text-white/55 hover:text-white',
                            compact && 'px-2 py-1 text-[10px]',
                        )}
                        aria-pressed={active}
                    >
                        {code === 'ko' ? (compact ? 'KO' : t('ko')) : compact ? 'EN' : t('en')}
                    </button>
                )
            })}
        </div>
    )
}
