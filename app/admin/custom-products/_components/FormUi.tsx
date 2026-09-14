'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
    title: string
    required?: boolean
    summary?: string
    help?: string
    defaultOpen?: boolean
    children: ReactNode
}

export function CollapsibleSection({
    title,
    required,
    summary,
    help,
    defaultOpen = true,
    children,
}: Props) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <section className="rounded-lg border border-[#e5e8eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#fafbfc] transition-colors"
            >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <h2 className="text-[15px] font-bold text-[#1e2124]">{title}</h2>
                    {required ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5252] shrink-0" aria-label="필수" />
                    ) : null}
                    {help ? (
                        <span title={help} className="text-[#03c75a] shrink-0">
                            <HelpCircle className="w-3.5 h-3.5" />
                        </span>
                    ) : null}
                </div>
                {!open && summary ? (
                    <span className="text-[13px] text-[#868b94] shrink-0 truncate max-w-[40%]">{summary}</span>
                ) : null}
                <ChevronDown
                    className={cn(
                        'w-5 h-5 text-[#868b94] shrink-0 transition-transform',
                        open && 'rotate-180'
                    )}
                />
            </button>
            {open ? (
                <div className="border-t border-[#eef0f2] px-5 py-5">{children}</div>
            ) : null}
        </section>
    )
}

export function FieldLabel({
    children,
    required,
}: {
    children: ReactNode
    required?: boolean
}) {
    return (
        <div className="flex items-center gap-1.5 w-[140px] shrink-0 pt-2.5">
            <span className="text-[13px] font-bold text-[#1e2124]">{children}</span>
            {required ? (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5252]" aria-label="필수" />
            ) : null}
        </div>
    )
}

export function Tip({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'red' | 'gray' }) {
    return (
        <p
            className={cn(
                'text-[12px] leading-relaxed break-keep',
                tone === 'green' && 'text-[#03c75a]',
                tone === 'red' && 'text-[#ff5252]',
                tone === 'gray' && 'text-[#868b94]'
            )}
        >
            {children}
        </p>
    )
}

export function SegmentedControl<T extends string>({
    value,
    onChange,
    options,
}: {
    value: T
    onChange: (v: T) => void
    options: { value: T; label: string }[]
}) {
    return (
        <div className="inline-flex rounded-md border border-[#d1d5db] overflow-hidden bg-white">
            {options.map((opt) => {
                const active = value === opt.value
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'h-9 px-4 text-[13px] font-bold border-r border-[#d1d5db] last:border-r-0 transition-colors',
                            active
                                ? 'bg-[#03c75a] text-white'
                                : 'bg-white text-[#333] hover:bg-[#f7f8fa]'
                        )}
                    >
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )
}
