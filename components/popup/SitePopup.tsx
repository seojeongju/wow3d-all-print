'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, GripVertical, X } from 'lucide-react'
import {
  dismissPopup,
  getPopupSizeConfig,
  isPopupDismissed,
  resolvePopupPosition,
  type PublicPopup,
} from '@/lib/popup'

function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return true
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api')
  )
}

function isSameOriginUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return true
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    // SSR/CSR 동일 판정 — window 분기 시 React #418 유발
    return host === 'wow3dp.co.kr' || host.endsWith('.wow3dp.co.kr')
  } catch {
    return false
  }
}

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
  const internalHref = sameOrigin ? pathFromLinkUrl(href) || href : href

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

type Pos = { x: number; y: number }

function clampPosition(pos: Pos, boxW: number, boxH: number): Pos {
  if (typeof window === 'undefined') return pos
  const maxX = Math.max(8, window.innerWidth - boxW - 8)
  const maxY = Math.max(8, window.innerHeight - Math.min(boxH, window.innerHeight - 16) - 8)
  return {
    x: Math.min(maxX, Math.max(8, pos.x)),
    y: Math.min(maxY, Math.max(8, pos.y)),
  }
}

function initialPositionForPopup(popup: PublicPopup): Pos {
  if (typeof window === 'undefined') return { x: 24, y: 100 }
  const size = getPopupSizeConfig(popup.sizePreset)
  const boxW = Math.min(size.maxWidthPx, window.innerWidth - 24)
  const boxH = Math.min(520, window.innerHeight * 0.7)
  return resolvePopupPosition(
    popup.positionPreset,
    boxW,
    boxH,
    window.innerWidth,
    window.innerHeight
  )
}

export default function SitePopup() {
  const t = useTranslations('Common')
  const pathname = usePathname()
  const [popup, setPopup] = useState<PublicPopup | null>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<Pos>({ x: 24, y: 100 })
  const [dragging, setDragging] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  /** 단순 닫기 — 새로고침 시 다시 표시됨 */
  const close = useCallback(() => setOpen(false), [])

  /** 「오늘 하루 보지 않기」만 localStorage에 저장 */
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
            (p) => !isPopupDismissed(p.id) && !isOnLinkedPage(pathname, p.linkUrl)
          ) || null
        if (cancelled) return
        setPopup(next)
        setOpen(Boolean(next))
        if (next) setPos(initialPositionForPopup(next))
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
    if (!open || !popup) return
    const el = panelRef.current
    if (!el) return
    // 실제 렌더 크기 기준으로 위치 재정렬
    const rect = el.getBoundingClientRect()
    const next = resolvePopupPosition(
      popup.positionPreset,
      rect.width,
      rect.height,
      window.innerWidth,
      window.innerHeight
    )
    setPos(next)
  }, [open, popup?.id, popup?.positionPreset, popup?.sizePreset])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const onResize = () => {
      const el = panelRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPos((p) => clampPosition(p, rect.width, rect.height))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open])

  const onDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, a, input')) return

    const el = panelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const el = panelRef.current
    const w = el?.offsetWidth ?? 360
    const h = el?.offsetHeight ?? 480
    const next = clampPosition(
      {
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      },
      w,
      h
    )
    setPos(next)
  }

  const onDragEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  if (isExcludedPath(pathname)) return null

  const sizeConfig = popup ? getPopupSizeConfig(popup.sizePreset) : getPopupSizeConfig('md')

  return (
    <AnimatePresence>
      {open && popup && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={popup.title}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className={`fixed z-[200] flex max-h-[min(85vh,720px)] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0d1117]/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md ${
            dragging ? 'cursor-grabbing select-none' : ''
          }`}
          style={{
            left: pos.x,
            top: pos.y,
            width: `min(calc(100vw - 1.5rem), ${sizeConfig.maxWidthPx}px)`,
          }}
        >
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className={`flex items-start gap-2 border-b border-white/10 px-3 py-3 touch-none ${
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            title={t('dragToMove')}
          >
            <GripVertical className="mt-0.5 h-5 w-5 shrink-0 text-white/35" aria-hidden />
            <h2 className="min-w-0 flex-1 pr-1 text-[15px] font-bold leading-snug text-white break-keep">
              {popup.title}
            </h2>
            <button
              type="button"
              onClick={close}
              className="shrink-0 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label={t('closePopup')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {popup.imageUrl && (
              <div className="relative bg-black/30">
                {popup.linkUrl ? (
                  <PopupLink href={popup.linkUrl} onClick={close} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={popup.imageUrl}
                      alt={popup.title}
                      className="w-full object-contain"
                      style={{ maxHeight: sizeConfig.imageMaxHPx }}
                      draggable={false}
                    />
                  </PopupLink>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={popup.imageUrl}
                    alt={popup.title}
                    className="w-full object-contain"
                    style={{ maxHeight: sizeConfig.imageMaxHPx }}
                    draggable={false}
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
                    onClick={close}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-300 hover:text-teal-200"
                  >
                    {t('learnMore')}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </PopupLink>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
            {popup.dismissDays > 0 ? (
              <button
                type="button"
                onClick={dismissForDays}
                className="text-xs font-medium text-white/45 hover:text-white/70"
              >
                {popup.dismissDays === 1
                  ? t('dismissToday')
                  : t('dismissForDays', { days: popup.dismissDays })}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={close}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
            >
              {t('close')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
