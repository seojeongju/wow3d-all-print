'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { NameTagStudio } from '@/components/maker/NameTagStudio'
import { useMakerStore } from '@/store/useMakerStore'

const MakerWorkspace = dynamic(
    () => import('@/components/maker/MakerWorkspace').then((mod) => mod.MakerWorkspace),
    { ssr: false }
)

export default function MakerPage() {
    const t = useTranslations('Maker')
    const [mode, setMode] = useState<'tag' | 'draw'>('tag')

    return (
        <main className="flex min-h-screen items-center justify-center bg-black p-2 sm:p-4">
            {mode === 'tag' ? (
                <NameTagStudio
                    onOpenDraw={() => {
                        useMakerStore.getState().clearNameTagPlate()
                        setMode('draw')
                    }}
                />
            ) : (
                <div className="flex w-full max-w-6xl flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('tag')}
                        className="self-start rounded-full border border-white/15 px-3 py-1.5 text-[12px] font-bold text-white/70 hover:bg-white/10 hover:text-white"
                    >
                        {t('nameTagBack')}
                    </button>
                    <MakerWorkspace />
                </div>
            )}
        </main>
    )
}
