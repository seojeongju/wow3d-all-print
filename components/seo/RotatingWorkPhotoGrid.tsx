'use client'

import { useEffect, useRef, useState } from 'react'
import { Link } from '@/i18n/navigation'
import type { WorkPhoto } from '@/lib/seo-work-photos'

const SLOTS = 4
/** 한 칸씩 교체하는 간격(ms) — 4칸이 한 바퀴 도는 데 약 14초 */
const SWAP_MS = 3500

/**
 * 출력 사례 4칸 그리드 — 사진이 4장보다 많으면 한 칸씩 다음 사진으로 부드럽게 교체.
 * 첫 4장은 서버 HTML에 그대로 들어가 검색엔진이 읽는다.
 * 마우스를 올리거나 포커스가 있으면 멈추고, 화면 밖·탭 비활성·동작 줄이기 설정에서는 교체하지 않는다.
 */
export default function RotatingWorkPhotoGrid({ photos }: { photos: (WorkPhoto & { fromGallery?: boolean })[] }) {
    const [slots, setSlots] = useState<number[]>(() => photos.slice(0, SLOTS).map((_, i) => i))
    const slotsRef = useRef(slots)
    const rootRef = useRef<HTMLUListElement>(null)
    const paused = useRef(false)
    const visible = useRef(false)
    const cursor = useRef(SLOTS) // 다음에 보여 줄 사진 위치
    const turn = useRef(0) // 다음에 바꿀 칸

    useEffect(() => {
        if (photos.length <= SLOTS) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const el = rootRef.current
        const io = el
            ? new IntersectionObserver((entries) => { visible.current = entries.some((e) => e.isIntersecting) })
            : null
        if (el && io) io.observe(el)

        const timer = window.setInterval(() => {
            if (paused.current || !visible.current || document.hidden) return
            // 화면에 없는 다음 사진 찾기 (상태 갱신 함수 밖에서 계산 — 개발 모드 이중 호출에도 커서가 한 번만 움직이게)
            const cur = slotsRef.current
            let next = cursor.current % photos.length
            for (let k = 0; k < photos.length && cur.includes(next); k++) next = (next + 1) % photos.length
            if (cur.includes(next)) return
            cursor.current = next + 1
            const slot = turn.current % SLOTS
            turn.current += 1
            // 다음 차례 사진 미리 받아 두기
            const upcoming = photos[(next + 1) % photos.length]
            if (upcoming) new window.Image().src = upcoming.srcSmall
            const copy = [...cur]
            copy[slot] = next
            slotsRef.current = copy
            setSlots(copy)
        }, SWAP_MS)
        return () => {
            window.clearInterval(timer)
            io?.disconnect()
        }
    }, [photos])

    return (
        <ul
            ref={rootRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            onMouseEnter={() => { paused.current = true }}
            onMouseLeave={() => { paused.current = false }}
            onFocus={() => { paused.current = true }}
            onBlur={() => { paused.current = false }}
        >
            {slots.map((idx, slot) => {
                const p = photos[idx]
                return (
                    <li key={slot}>
                        <figure
                            key={p.slug}
                            className="h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] animate-in fade-in duration-700"
                        >
                            <Link
                                href={{ pathname: '/gallery', query: { id: String(p.galleryId) } }}
                                className="block overflow-hidden"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element -- 갤러리 썸네일 API·정적 사진을 그대로 사용 */}
                                <img
                                    src={p.src}
                                    srcSet={p.src.startsWith('/images/work/') ? `${p.srcSmall} 600w, ${p.src} 1200w` : `${p.srcSmall} 480w, ${p.src} 960w`}
                                    sizes="(min-width: 768px) 25vw, 50vw"
                                    alt={p.alt}
                                    width={1200}
                                    height={900}
                                    loading={slot === 0 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                                />
                            </Link>
                            <figcaption className="p-3">
                                <p className="text-sm font-bold text-white break-keep line-clamp-1">{p.title}</p>
                                <p className="mt-0.5 text-xs text-white/45">
                                    {p.method} · {p.material}
                                </p>
                            </figcaption>
                        </figure>
                    </li>
                )
            })}
        </ul>
    )
}
