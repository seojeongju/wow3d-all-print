'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, X } from 'lucide-react'
import { dismissPopup, isPopupDismissed, type PublicPopup } from '@/lib/popup'

function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return true
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api')
  )
}

/** 절대 URL이 현재 사이트(동일 origin)인지 */
function isSameOriginUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return true
  if (typeof window === 'undefined') return false
  try {
    return new URL(url, window.location.origin).origin === window.location.origin
  } catch {
    return false
  }
}

/** 팝업 링크에서 pathname 추출 (/partnership/smart-store) */
function pathFromLinkUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    if (/^https?:\/\//i.test(url)) {
      const u = new URL(url)
      return u.pathname.replace(/\/$/, '') || '/'
    }
    const path = url.split('?')[0].split('#')[0]
    if (!path.startsWith('/')) return `/${path}`.replace(/\/$/, '') || '/'
    return path.replace(/\/$/, '') || '/'
  } catch {
    return null
  }
}

function isOnLinkedPage(pathname: string | null, linkUrl: string | null | undefined): boolean {
  if (!pathname || !linkUrl) return false
  const target = pathFromLinkUrl(linkUrl)
  if (!target) return false
  const current = pathname.replace(/\/$/, '') || '/'
  return current === target || current.startsWith(`${target}/`)
}

function PopupLink({
  href,
  onClick,
  className,
  children,
}: {
  href: string
  onClick?: () => void
  className?: string
  children: ReactNode
}) {
  const sameOrigin = isSameOriginUrl(href)
  const internalHref = sameOrigin
    ? pathFromLinkUrl(href) || href
    : href

  if (!sameOrigin) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href={internalHref} onClick={onClick} className={className}>
      {children}
    </Link>
  )
}

export default function SitePopup() {
  const pathname = usePathname()
  const [popup, setPopup] = useState<PublicPopup | null>(null)
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  /** 자세히 보기 등 링크 이동 시 — 닫고 재노출 방지 */
  const closeAndDismiss = useCallback(() => {
    if (popup) {
      const days = Math.max(1, Number(popup.dismissDays) || 1)
      dismissPopup(popup.id, days)
    }
    setOpen(false)
  }, [popup])

  const dismissForDays = useCallback(() => {
    if (popup) dismissPopup(popup.id, Math.max(1, popup.dismissDays))
    setOpen(false)
  }, [popup])

  useEffect(() => {
    if (isExcludedPath(pathname)) {
      setOpen(false)
      setPopup(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/popups/active?store_id=1', { cache: 'no-store' })
        const json = await res.json()
        const items: PublicPopup[] = json?.data?.items || []
        const next =
          items.find(
            (p) =>
              !isPopupDismissed(p.id) && !isOnLinkedPage(pathname, p.linkUrl)
          ) || null
        if (cancelled) return
        setPopup(next)
        setOpen(Boolean(next))
      } catch {
        if (!cancelled) {
          setPopup(null)
          setOpen(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, close])

  if (isExcludedPath(pathname)) return null

  const content = popup && (
    <div className="flex max-h-[min(90vh,720px)] w-[min(92vw,420px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0d1117] shadow-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h2 className="pr-2 text-base font-bold leading-snug text-white break-keep">
          {popup.title}
        </h2>
        <button
          type="button"
          onClick={close}
          className="shrink-0 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="팝업 닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {popup.imageUrl && (
        <div className="relative bg-black/40">
          {popup.linkUrl ? (
            <PopupLink href={popup.linkUrl} onClick={closeAndDismiss} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={popup.imageUrl}
                alt={popup.title}
                className="max-h-[360px] w-full object-contain"
              />
            </PopupLink>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={popup.imageUrl}
              alt={popup.title}
              className="max-h-[360px] w-full object-contain"
            />
          )}
        </div>
      )}

      {(popup.body || popup.linkUrl) && (
        <div className="space-y-3 px-4 py-4">
          {popup.body && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70 break-keep">
              {popup.body}
            </p>
          )}
          {popup.linkUrl && (
            <PopupLink
              href={popup.linkUrl}
              onClick={closeAndDismiss}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-300 hover:text-teal-200"
            >
              자세히 보기
              <ExternalLink className="h-3.5 w-3.5" />
            </PopupLink>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
        {popup.dismissDays > 0 ? (
          <button
            type="button"
            onClick={dismissForDays}
            className="text-xs font-medium text-white/45 hover:text-white/70"
          >
            {popup.dismissDays === 1
              ? '오늘 하루 보지 않기'
              : `${popup.dismissDays}일 동안 보지 않기`}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={close}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
        >
          닫기
        </button>
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {open && popup && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-label="팝업 배경 닫기"
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={popup.title}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
