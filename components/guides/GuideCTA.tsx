'use client'

import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

type GuideCTAProps = {
    eyebrow?: string
    title: string
    description: string
    primaryHref?: string
    primaryLabel?: string
    trackingSource?: string
    trackingTopic?: string
    secondaryHref?: string
    secondaryLabel?: string
}

export default function GuideCTA({
    eyebrow = 'Next Step',
    title,
    description,
    primaryHref = '/quote',
    primaryLabel,
    trackingSource,
    trackingTopic,
    secondaryHref = '/contact',
    secondaryLabel,
}: GuideCTAProps) {
    const t = useTranslations('GuideChrome')
    const resolvedPrimary = primaryLabel ?? t('defaultQuoteCta')
    const resolvedSecondary = secondaryLabel ?? t('defaultContactCta')

    const primaryLink = (() => {
        if (!trackingSource && !trackingTopic) return primaryHref

        const [pathname, search = ''] = primaryHref.split('?')
        const params = new URLSearchParams(search)
        if (trackingSource) params.set('guide_source', trackingSource)
        if (trackingTopic) params.set('guide_topic', trackingTopic)
        const qs = params.toString()
        return qs ? `${pathname}?${qs}` : pathname
    })()

    return (
        <div className="rounded-[2rem] border border-teal-400/20 bg-teal-400/5 p-8 md:p-10 space-y-5">
            <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">{eyebrow}</p>
                <h2 className="text-2xl font-black">{title}</h2>
                <p className="text-white/70 break-keep leading-relaxed">{description}</p>
            </div>
            <div className="flex gap-3">
                <Link href={primaryLink as '/'}>
                    <Button className="rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                        {resolvedPrimary} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
                <Link href={secondaryHref as '/'}>
                    <Button variant="outline" className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                        {resolvedSecondary}
                    </Button>
                </Link>
            </div>
        </div>
    )
}
