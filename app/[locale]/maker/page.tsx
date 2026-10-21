'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Header from '@/components/layout/Header'

const NameTagStudio = dynamic(
    () => import('@/components/maker/NameTagStudio').then((mod) => mod.NameTagStudio),
    { ssr: false }
)

const MakerWorkspace = dynamic(
    () => import('@/components/maker/MakerWorkspace').then((mod) => mod.MakerWorkspace),
    { ssr: false }
)

export default function MakerPage() {
    const t = useTranslations('Maker.nameTag')
    const [mode, setMode] = useState<'tag' | 'draw'>('tag')

    return (
        <div className="relative min-h-screen w-full bg-[#0a0a0f] text-white">
            <Header />
            <main className="flex min-h-screen items-center justify-center p-2 pt-24 pb-8 sm:p-4 sm:pt-28 sm:pb-12">
                {mode === 'tag' ? (
                    <NameTagStudio onOpenDraw={() => setMode('draw')} />
                ) : (
                    <div className="flex w-full max-w-6xl flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => setMode('tag')}
                            className="self-start rounded-full border border-white/15 px-3 py-1.5 text-[12px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            {t('back')}
                        </button>
                        <MakerWorkspace />
                    </div>
                )}
            </main>
        </div>
    )
}
