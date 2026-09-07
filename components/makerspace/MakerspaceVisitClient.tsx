'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Clock3,
    Copy,
    Check,
    MapPin,
    Navigation,
    Phone,
    TrainFront,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import KakaoMapView from '@/components/makerspace/KakaoMapView'
import {
    MAKERSPACES,
    type MakerspaceId,
    getMakerspace,
    kakaoMapDirectionsUrl,
} from '@/lib/makerspaces'
import { cn } from '@/lib/utils'
import { showToast } from '@/lib/toast-helper'

type Props = {
    initialId?: string
}

export default function MakerspaceVisitClient({ initialId }: Props) {
    const router = useRouter()
    const firstValid = getMakerspace(initialId)?.id ?? MAKERSPACES[0].id
    const [activeId, setActiveId] = useState<MakerspaceId>(firstValid)
    const [copied, setCopied] = useState(false)

    const active = useMemo(
        () => getMakerspace(activeId) ?? MAKERSPACES[0],
        [activeId],
    )

    useEffect(() => {
        const fromHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
        const matched = getMakerspace(fromHash || initialId)
        if (matched) setActiveId(matched.id)
    }, [initialId])

    useEffect(() => {
        const syncFromHash = () => {
            const id = window.location.hash.replace('#', '')
            const matched = getMakerspace(id)
            if (matched) setActiveId(matched.id)
        }
        const onDocClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement | null)?.closest?.('a')
            if (!anchor) return
            const href = anchor.getAttribute('href') || ''
            if (!href.includes('/makerspace#')) return
            const id = href.split('#')[1]
            const matched = getMakerspace(id)
            if (matched) {
                setActiveId(matched.id)
                setCopied(false)
            }
        }
        window.addEventListener('hashchange', syncFromHash)
        document.addEventListener('click', onDocClick)
        return () => {
            window.removeEventListener('hashchange', syncFromHash)
            document.removeEventListener('click', onDocClick)
        }
    }, [])

    const selectCenter = (id: MakerspaceId) => {
        setActiveId(id)
        setCopied(false)
        router.replace(`/makerspace#${id}`, { scroll: false })
    }

    const copyAddress = async () => {
        const text = active.addressDetail
            ? `${active.address} ${active.addressDetail}`
            : active.address
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            showToast.success('주소 복사됨', text)
            window.setTimeout(() => setCopied(false), 2000)
        } catch {
            showToast.error('복사 실패', '주소를 직접 선택해 복사해 주세요.')
        }
    }

    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#020617] font-sans text-slate-50 selection:bg-teal-500/30">
            <Header />

            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#1e293b_0%,#020617_55%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
                <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-teal-500/10 blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] h-[45%] w-[45%] rounded-full bg-indigo-500/10 blur-[130px]" />
            </div>

            <div className="relative z-10 flex-1 pt-28 pb-20 sm:pt-32 sm:pb-24">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.28em] text-teal-400">
                            Makerspace · Directions
                        </p>
                        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                            메이커스페이스
                            <span className="text-teal-400"> 찾아오는길</span>
                        </h1>
                        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/50 break-keep sm:text-base">
                            홍대·구미·전주 제작센터 위치를 확인하고 카카오맵으로 길을 안내받으세요.
                        </p>
                    </motion.div>

                    <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:mt-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-8">
                        {/* 센터 목록 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="space-y-3"
                            role="tablist"
                            aria-label="제작센터 선택"
                        >
                            {MAKERSPACES.map((center) => {
                                const isActive = center.id === activeId
                                return (
                                    <button
                                        key={center.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        id={center.id}
                                        onClick={() => selectCenter(center.id)}
                                        className={cn(
                                            'w-full rounded-2xl border px-4 py-4 text-left transition-all sm:px-5 sm:py-5',
                                            isActive
                                                ? 'border-teal-400/50 bg-teal-400/10 shadow-[0_0_0_1px_rgba(45,212,191,0.25)]'
                                                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p
                                                    className={cn(
                                                        'text-[10px] font-black uppercase tracking-[0.2em]',
                                                        isActive ? 'text-teal-300' : 'text-white/35',
                                                    )}
                                                >
                                                    {center.label}
                                                </p>
                                                <p
                                                    className={cn(
                                                        'mt-1 text-lg font-black sm:text-xl',
                                                        isActive ? 'text-white' : 'text-white/75',
                                                    )}
                                                >
                                                    {center.name}
                                                </p>
                                                <p className="mt-1.5 text-xs font-medium text-white/45 sm:text-sm">
                                                    {center.address}
                                                    {center.addressDetail ? ` ${center.addressDetail}` : ''}
                                                </p>
                                            </div>
                                            <MapPin
                                                className={cn(
                                                    'mt-1 h-5 w-5 shrink-0',
                                                    isActive ? 'text-teal-300' : 'text-white/25',
                                                )}
                                                aria-hidden
                                            />
                                        </div>
                                    </button>
                                )
                            })}

                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                <h2 className="text-sm font-black text-white">{active.name} 안내</h2>
                                <ul className="mt-4 space-y-3 text-sm text-white/65">
                                    <li className="flex items-start gap-2.5">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden />
                                        <span>
                                            {active.address}
                                            {active.addressDetail ? (
                                                <span className="text-white/45"> · {active.addressDetail}</span>
                                            ) : null}
                                        </span>
                                    </li>
                                    {active.phone ? (
                                        <li className="flex items-center gap-2.5">
                                            <Phone className="h-4 w-4 shrink-0 text-teal-400" aria-hidden />
                                            <a href={`tel:${active.phone.replace(/-/g, '')}`} className="font-bold hover:text-teal-300">
                                                {active.phone}
                                            </a>
                                        </li>
                                    ) : null}
                                    {active.hours ? (
                                        <li className="flex items-center gap-2.5">
                                            <Clock3 className="h-4 w-4 shrink-0 text-teal-400" aria-hidden />
                                            <span>{active.hours}</span>
                                        </li>
                                    ) : null}
                                    {active.transit ? (
                                        <li className="flex items-center gap-2.5">
                                            <TrainFront className="h-4 w-4 shrink-0 text-teal-400" aria-hidden />
                                            <span>{active.transit}</span>
                                        </li>
                                    ) : null}
                                </ul>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void copyAddress()}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-white/85 transition hover:border-white/25 hover:text-white"
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5 text-teal-300" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copied ? '복사됨' : '주소 복사'}
                                    </button>
                                    <a
                                        href={kakaoMapDirectionsUrl(active)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 transition hover:bg-teal-300"
                                    >
                                        <Navigation className="h-3.5 w-3.5" aria-hidden />
                                        카카오 길찾기
                                    </a>
                                    <Link
                                        href="/contact"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-white/85 transition hover:border-teal-400/35 hover:text-teal-200"
                                    >
                                        문의하기
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* 지도 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:sticky lg:top-28 lg:self-start"
                        >
                            <KakaoMapView center={active} />
                            <p className="mt-3 text-center text-[11px] font-medium text-white/35 sm:text-left">
                                지도 데이터 © Kakao · 센터를 선택하면 위치가 전환됩니다.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
