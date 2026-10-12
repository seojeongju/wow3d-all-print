'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { showToast } from '@/lib/toast-helper'
import { CONVERSION_EVENT_CATEGORY, QUOTE_CONVERSION_EVENTS } from '@/lib/conversion-events'
import { trackConversionEvent } from '@/lib/track-conversion-event'

type Props = {
    disabled?: boolean
    /** 현재 조건으로 견적을 저장(또는 재사용)하고 견적 ID를 돌려줌 */
    ensureSaved: () => Promise<{ id: number } | null | undefined>
    printMethod: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function QuoteEmailSave({ disabled, ensureSaved, printMethod }: Props) {
    const t = useTranslations('QuotePanel')
    const locale = useLocale()
    const user = useAuthStore((s) => s.user)
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [remindOptIn, setRemindOptIn] = useState(false)
    const [sending, setSending] = useState(false)
    const [sentTo, setSentTo] = useState<string | null>(null)

    useEffect(() => {
        if (user?.email && !email) setEmail(user.email)
        // 로그인 정보가 늦게 복원돼도 비어 있을 때만 채움
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email])

    const emailValid = EMAIL_RE.test(email.trim())

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!emailValid || sending) return
        setSending(true)
        try {
            const saved = await ensureSaved()
            if (!saved?.id) return

            const { token, sessionId, user: u } = useAuthStore.getState()
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
                if (u?.id) headers['X-User-ID'] = String(u.id)
            } else {
                headers['X-Session-ID'] = sessionId || ''
            }

            const res = await fetch(`/api/quotes/${saved.id}/email`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ email: email.trim(), remindOptIn, locale }),
            })
            const json = (await res.json().catch(() => ({}))) as { error?: string }
            if (!res.ok) throw new Error(json.error || t('emailSaveFail'))

            setSentTo(email.trim())
            showToast.success(t('emailSaveSentTitle'), t('emailSaveSentDesc', { email: email.trim() }))
            trackConversionEvent({
                eventName: QUOTE_CONVERSION_EVENTS.EMAIL_SAVE,
                category: CONVERSION_EVENT_CATEGORY.QUOTE,
                userId: u?.id ?? null,
                metadata: { quoteId: saved.id, printMethod, remindOptIn },
            })
        } catch (error) {
            showToast.error(t('emailSaveFail'), error)
        } finally {
            setSending(false)
        }
    }

    if (sentTo) {
        return (
            <div className="flex items-start gap-3 rounded-xl sm:rounded-2xl border border-teal-400/30 bg-teal-400/10 px-4 py-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-teal-300 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black text-teal-100 break-all">{t('emailSaveSentDesc', { email: sentTo })}</p>
                    <p className="mt-0.5 text-[11px] font-bold text-white/50 break-keep">
                        {remindOptIn ? t('emailSaveRemindOn') : t('emailSaveSentHint')}
                    </p>
                    <button
                        type="button"
                        onClick={() => setSentTo(null)}
                        className="mt-1.5 text-[11px] font-black text-teal-300 hover:text-teal-200 underline underline-offset-2"
                    >
                        {t('emailSaveAgain')}
                    </button>
                </div>
            </div>
        )
    }

    if (!open) {
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(true)}
                className="w-full flex items-center gap-3 rounded-xl sm:rounded-2xl border border-dashed border-white/20 hover:border-teal-400/50 hover:bg-white/5 px-4 py-3 text-left transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
                <Mail className="w-5 h-5 shrink-0 text-teal-300" />
                <span className="min-w-0">
                    <span className="block text-[13px] sm:text-[14px] font-black text-white">{t('emailSaveTitle')}</span>
                    <span className="block text-[11px] sm:text-[12px] font-bold text-white/50 break-keep">{t('emailSaveDesc')}</span>
                </span>
            </button>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-xl sm:rounded-2xl border border-teal-400/25 bg-white/[0.04] px-4 py-4"
        >
            <label className="block">
                <span className="flex items-center gap-2 text-[13px] font-black text-white">
                    <Mail className="w-4 h-4 text-teal-300" /> {t('emailSaveTitle')}
                </span>
                <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailSavePlaceholder')}
                    className="mt-2 w-full h-11 rounded-xl bg-slate-950/60 border border-white/15 focus:border-teal-400/60 focus:outline-none px-3 text-[14px] font-bold text-white placeholder:text-white/30"
                />
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                    type="checkbox"
                    checked={remindOptIn}
                    onChange={(e) => setRemindOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-teal-400"
                />
                <span className="text-[12px] font-bold text-white/75 leading-relaxed break-keep">{t('emailSaveRemindLabel')}</span>
            </label>
            <p className="text-[10.5px] font-bold text-white/40 leading-relaxed break-keep">{t('emailSavePrivacy')}</p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-11 px-4 rounded-xl border border-white/15 text-[13px] font-black text-white/70 hover:bg-white/5"
                >
                    {t('emailSaveCancel')}
                </button>
                <button
                    type="submit"
                    disabled={!emailValid || sending || disabled}
                    className="flex-1 h-11 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-[13px] font-black flex items-center justify-center gap-2 disabled:opacity-40"
                >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {t('emailSaveSubmit')}
                </button>
            </div>
        </form>
    )
}
