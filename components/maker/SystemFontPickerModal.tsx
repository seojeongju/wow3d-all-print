'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Monitor, Search, X } from 'lucide-react'
import {
    isLocalFontAccessSupported,
    queryLocalFontsSafe,
    registerLocalFontData,
    type CustomFontItem,
} from '@/lib/name-tag/custom-fonts'
import { showToast } from '@/lib/toast-helper'
import { cn } from '@/lib/utils'

type LocalFontRecord = {
    family: string
    fullName: string
    postscriptName: string
    style: string
    blob: () => Promise<Blob>
}

interface SystemFontPickerModalProps {
    open: boolean
    onClose: () => void
    onSelectFont: (font: CustomFontItem) => void
}

export function SystemFontPickerModal({ open, onClose, onSelectFont }: SystemFontPickerModalProps) {
    const [loading, setLoading] = useState(false)
    const [fonts, setFonts] = useState<LocalFontRecord[]>([])
    const [search, setSearch] = useState('')
    const [registeringFontName, setRegisteringFontName] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        if (!open) {
            setSearch('')
            setRegisteringFontName(null)
            setErrorMsg(null)
            return
        }

        if (!isLocalFontAccessSupported()) {
            setErrorMsg('현재 브라우저에서는 시스템 글꼴 조회를 지원하지 않습니다. (Chrome·Edge 데스크톱 권장)')
            return
        }

        let cancelled = false
        setLoading(true)
        setErrorMsg(null)

        queryLocalFontsSafe()
            .then((list) => {
                if (cancelled) return
                // 중복 postscriptName 제거 및 이름 순 정렬
                const seen = new Set<string>()
                const unique: LocalFontRecord[] = []
                for (const item of list) {
                    const key = item.fullName || item.postscriptName || item.family
                    if (!seen.has(key)) {
                        seen.add(key)
                        unique.push(item)
                    }
                }
                unique.sort((a, b) => (a.fullName || a.family).localeCompare(b.fullName || b.family))
                setFonts(unique)
            })
            .catch((err) => {
                if (cancelled) return
                console.error('[SystemFontPicker] 폰트 목록 조회 실패:', err)
                if (err instanceof Error && err.name === 'NotAllowedError') {
                    setErrorMsg('글꼴 접근 권한이 거부되었습니다. 브라우저 주소창 설정에서 권한을 허용해 주세요.')
                } else {
                    setErrorMsg(err instanceof Error ? err.message : '글꼴을 불러오지 못했습니다.')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [open])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return fonts.slice(0, 150) // 너무 많으면 초기에 150개만 표시
        return fonts
            .filter((f) => {
                return (
                    f.fullName?.toLowerCase().includes(q) ||
                    f.family?.toLowerCase().includes(q) ||
                    f.postscriptName?.toLowerCase().includes(q)
                )
            })
            .slice(0, 150)
    }, [fonts, search])

    const handlePick = async (fontRecord: LocalFontRecord) => {
        const name = fontRecord.fullName || fontRecord.family
        setRegisteringFontName(name)
        try {
            const registered = await registerLocalFontData(fontRecord)
            showToast.success('글꼴 등록 완료', `"${registered.name}" 글꼴을 불러왔습니다.`)
            onSelectFont(registered)
            onClose()
        } catch (err) {
            console.error('[SystemFontPicker] 글꼴 등록 실패:', err)
            showToast.error(
                '글꼴 등록 실패',
                err instanceof Error ? err.message : '이 글꼴을 파싱할 수 없습니다. 다른 글꼴을 선택해 주세요.'
            )
        } finally {
            setRegisteringFontName(null)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="flex flex-col w-full max-w-lg max-h-[85vh] rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl text-white overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
                            <Monitor className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">내 PC 설치 글꼴 선택</h3>
                            <p className="text-xs text-white/50">컴퓨터에 설치된 글꼴을 검색하여 이름표에 적용합니다.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* 검색 바 */}
                <div className="px-5 py-3 border-b border-white/5 bg-black/20">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 h-4 w-4 text-white/40" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="글꼴 이름 검색 (예: 맑은 고딕, 나눔, Arial)..."
                            className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.06] pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-teal-400 focus:bg-white/[0.08] focus:outline-none transition-colors"
                            autoFocus
                        />
                    </div>
                </div>

                {/* 본문 리스트 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-[240px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/60">
                            <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
                            <p className="text-sm">PC에 설치된 글꼴을 조회하고 있습니다...</p>
                            <p className="text-xs text-white/40">브라우저 권한 허용 팝업이 뜨면 &apos;허용&apos;을 눌러주세요.</p>
                        </div>
                    ) : errorMsg ? (
                        <div className="flex flex-col items-center justify-center h-48 px-6 text-center text-white/60 gap-2">
                            <p className="text-sm text-amber-300/90">{errorMsg}</p>
                            <p className="text-xs text-white/40">
                                파일 업로드 탭을 이용해 .ttf 또는 .otf 파일을 직접 등록하실 수도 있습니다.
                            </p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex items-center justify-center h-36 text-white/40 text-sm">
                            일치하는 글꼴이 없습니다.
                        </div>
                    ) : (
                        filtered.map((font) => {
                            const name = font.fullName || font.family
                            const isPicking = registeringFontName === name
                            return (
                                <button
                                    key={font.postscriptName || name}
                                    type="button"
                                    disabled={Boolean(registeringFontName)}
                                    onClick={() => handlePick(font)}
                                    className={cn(
                                        'w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent text-left transition-colors',
                                        isPicking
                                            ? 'bg-teal-500/20 border-teal-500/50'
                                            : 'hover:bg-white/5 hover:border-white/10'
                                    )}
                                >
                                    <div className="min-w-0 pr-3">
                                        <p className="text-sm font-medium text-white truncate">{name}</p>
                                        <p className="text-xs text-white/40 truncate">
                                            {font.family} {font.style ? `· ${font.style}` : ''}
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center">
                                        {isPicking ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-teal-300" />
                                        ) : (
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white">
                                                선택
                                            </span>
                                        )}
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>

                {/* 하단 안내 */}
                <div className="px-5 py-3 border-t border-white/10 bg-black/40 text-xs text-white/50 flex items-center justify-between">
                    <span>💡 검색 결과는 상위 150개까지 표시됩니다.</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-white/80 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    )
}
