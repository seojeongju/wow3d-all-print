'use client'

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { cn } from '@/lib/utils'
import type { CharGroup } from '@/lib/editor-insert-presets'

function keepFocus(e: ReactMouseEvent) {
    e.preventDefault()
}

export function CharInsertPopover({
    title,
    groups,
    open,
    onClose,
    onPick,
    anchorClassName,
}: {
    title: string
    groups: CharGroup[]
    open: boolean
    onClose: () => void
    onPick: (char: string) => void
    anchorClassName?: string
}) {
    const panelRef = useRef<HTMLDivElement>(null)
    const [tab, setTab] = useState(groups[0]?.id || '')

    useEffect(() => {
        if (open && groups[0]) setTab(groups[0].id)
    }, [open, groups])

    useEffect(() => {
        if (!open) return
        const onDoc = (e: MouseEvent) => {
            if (!panelRef.current?.contains(e.target as Node)) onClose()
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('keydown', onKey)
        }
    }, [open, onClose])

    if (!open) return null

    const active = groups.find((g) => g.id === tab) || groups[0]
    if (!active) return null

    return (
        <div
            ref={panelRef}
            className={cn(
                'absolute z-50 mt-1 w-[320px] rounded-lg border border-[#e5e8eb] bg-white shadow-lg p-2',
                anchorClassName
            )}
            onMouseDown={keepFocus}
        >
            <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[12px] font-black text-[#333]">{title}</span>
                <button
                    type="button"
                    className="text-[11px] font-bold text-[#868b94] hover:text-[#333] px-1"
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
                {groups.map((g) => (
                    <button
                        key={g.id}
                        type="button"
                        onClick={() => setTab(g.id)}
                        className={cn(
                            'h-7 px-2 rounded text-[11px] font-bold',
                            tab === g.id
                                ? 'bg-[#e8f8ef] text-[#03c75a]'
                                : 'bg-[#f7f8fa] text-[#555] hover:bg-[#eef0f2]'
                        )}
                    >
                        {g.label}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
                {active.chars.map((ch, i) => (
                    <button
                        key={`${active.id}-${i}-${ch}`}
                        type="button"
                        title={ch}
                        onClick={() => {
                            onPick(ch)
                        }}
                        className="h-9 rounded text-[18px] leading-none hover:bg-[#f0f1f3] flex items-center justify-center"
                    >
                        {ch}
                    </button>
                ))}
            </div>
        </div>
    )
}

export function HighlightColorPopover({
    open,
    colors,
    onClose,
    onPick,
    onClear,
}: {
    open: boolean
    colors: { label: string; value: string }[]
    onClose: () => void
    onPick: (color: string) => void
    onClear: () => void
}) {
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onDoc = (e: MouseEvent) => {
            if (!panelRef.current?.contains(e.target as Node)) onClose()
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            ref={panelRef}
            className="absolute z-50 mt-1 w-[200px] rounded-lg border border-[#e5e8eb] bg-white shadow-lg p-2"
            onMouseDown={keepFocus}
        >
            <p className="text-[11px] font-bold text-[#868b94] px-1 mb-1.5">형광펜 색</p>
            <div className="grid grid-cols-4 gap-1.5">
                {colors.map((c) => (
                    <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        onClick={() => onPick(c.value)}
                        className="h-8 rounded border border-[#e5e8eb] hover:ring-2 hover:ring-[#03c75a]/40"
                        style={{ backgroundColor: c.value }}
                    />
                ))}
            </div>
            <button
                type="button"
                onClick={onClear}
                className="mt-2 w-full h-7 rounded text-[11px] font-bold text-[#555] hover:bg-[#f0f1f3]"
            >
                형광펜 제거
            </button>
        </div>
    )
}
