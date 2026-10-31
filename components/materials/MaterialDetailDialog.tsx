'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { BookOpen, Info } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MaterialSpecsGrid from '@/components/materials/MaterialSpecsGrid'
import {
    getMaterialSpec,
    materialAnchorId,
    resolveMaterialSpecId,
    type MaterialSpecId,
} from '@/lib/material-specs'
import { cn } from '@/lib/utils'

type Props = {
    /** 견적에서 고른 소재명 (PLA, Tough 등) */
    materialName: string | null | undefined
    /** 트리거 스타일 */
    className?: string
    /** 버튼 크기 */
    size?: 'sm' | 'default'
}

export default function MaterialDetailDialog({ materialName, className, size = 'sm' }: Props) {
    const t = useTranslations('QuotePanel')
    const tMat = useTranslations('Materials')
    const locale = useLocale()
    const [open, setOpen] = useState(false)

    const specId = useMemo(() => resolveMaterialSpecId(materialName), [materialName])
    const spec = specId ? getMaterialSpec(specId) : undefined

    if (!materialName?.trim()) {
        return (
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold text-white/30', className)}>
                <Info className="h-3.5 w-3.5" aria-hidden />
                {t('materialDetailNeedSelect')}
            </span>
        )
    }

    if (!spec) {
        return (
            <Link
                href="/materials"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    'inline-flex items-center gap-1 text-[11px] sm:text-xs font-black text-teal-300/90 hover:text-teal-200',
                    className
                )}
            >
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                {t('materialDetailPageLink')}
            </Link>
        )
    }

    const tone = spec.process === 'resin' ? 'indigo' : 'teal'
    const nameKo = tMat(`materials.${spec.id}.nameKo` as `materials.${MaterialSpecId}.nameKo`)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size={size === 'sm' ? 'sm' : 'default'}
                    className={cn(
                        'h-8 gap-1.5 rounded-lg border-white/15 bg-white/5 px-2.5 text-[11px] font-black text-white/80 hover:bg-white/10 hover:text-white',
                        className
                    )}
                >
                    <Info className="h-3.5 w-3.5 text-teal-300" aria-hidden />
                    {t('materialDetailButton')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-slate-950 text-slate-50 sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-left text-xl font-black tracking-tight">
                        {spec.name}
                        <span className="ml-2 text-sm font-bold text-white/40">{nameKo}</span>
                    </DialogTitle>
                    <DialogDescription className="text-left text-white/50 break-keep">
                        {t('materialDetailDesc')}
                    </DialogDescription>
                </DialogHeader>
                <MaterialSpecsGrid spec={spec} tone={tone} />
                <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                        href={`/materials#${materialAnchorId(spec.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-[12px] font-black text-teal-200 hover:bg-teal-400/20"
                        onClick={() => setOpen(false)}
                    >
                        <BookOpen className="h-3.5 w-3.5" aria-hidden />
                        {t('materialDetailFullPage')}
                    </Link>
                    <span className="self-center text-[10px] font-medium text-white/30">
                        {locale.startsWith('en') ? 'Opens in a new tab' : '새 탭에서 열림'}
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    )
}
