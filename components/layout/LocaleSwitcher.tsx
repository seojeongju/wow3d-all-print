'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

type Props = {
    className?: string
    compact?: boolean
}

export default function LocaleSwitcher({ className, compact }: Props) {
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
                'inline-flex items-center rounded-xl border border-white/15 bg-white/[0.04] p-0.5',
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
                                ? 'bg-teal-400 text-slate-950'
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
