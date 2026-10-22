'use client'

import { useEffect, useState } from 'react'
import { Home } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PreviewViewId } from '@/components/maker/NameTagPreview'
import { cn } from '@/lib/utils'

type V3 = [number, number, number]

export type ViewCubePick = {
    id: PreviewViewId
    /** 카메라가 놓일 방향. 면 보기는 비우고 기본 방향을 쓴다 */
    direction?: [number, number, number]
}

type FaceDef = { id: PreviewViewId; axis: 0 | 1 | 2; sign: -1 | 1 }

const FACES: FaceDef[] = [
    { id: 'right', axis: 0, sign: 1 },
    { id: 'left', axis: 0, sign: -1 },
    { id: 'back', axis: 1, sign: 1 },
    { id: 'front', axis: 1, sign: -1 },
    { id: 'top', axis: 2, sign: 1 },
    { id: 'bottom', axis: 2, sign: -1 },
]

const SIZE = 112
const CENTER = 56
const SCALE = 30
const HOME_DIR: V3 = normalize([0, -0.92, 0.62])

type Hit =
    | { kind: 'face'; id: PreviewViewId; direction?: V3 }
    | { kind: 'edge'; id: PreviewViewId; direction: V3; labelIds: [PreviewViewId, PreviewViewId] }
    | { kind: 'corner'; id: PreviewViewId; direction: V3; labelIds: PreviewViewId[] }

function normalize(v: V3): V3 {
    const len = Math.hypot(v[0], v[1], v[2]) || 1
    return [v[0] / len, v[1] / len, v[2] / len]
}

function dot(a: V3, b: V3) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function faceNormal(face: FaceDef): V3 {
    const n: V3 = [0, 0, 0]
    n[face.axis] = face.sign
    return n
}

function faceCorners(face: FaceDef): V3[] {
    const u = ((face.axis + 1) % 3) as 0 | 1 | 2
    const v = ((face.axis + 2) % 3) as 0 | 1 | 2
    return [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
    ].map(([su, sv]) => {
        const p: V3 = [0, 0, 0]
        p[face.axis] = face.sign
        p[u] = su
        p[v] = sv
        return p
    })
}

function inset(corners: V3[], amount: number): V3[] {
    const c: V3 = [0, 0, 0]
    for (const p of corners) {
        c[0] += p[0]
        c[1] += p[1]
        c[2] += p[2]
    }
    c[0] /= corners.length
    c[1] /= corners.length
    c[2] /= corners.length
    return corners.map((p) => [
        c[0] + (p[0] - c[0]) * amount,
        c[1] + (p[1] - c[1]) * amount,
        c[2] + (p[2] - c[2]) * amount,
    ])
}

const CORNERS: V3[] = [-1, 1].flatMap((x) =>
    [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z] as V3))
)

const EDGES: [V3, V3][] = []
for (let i = 0; i < CORNERS.length; i++) {
    for (let j = i + 1; j < CORNERS.length; j++) {
        const diff = CORNERS[i].reduce((sum, value, axis) => sum + (value !== CORNERS[j][axis] ? 1 : 0), 0)
        if (diff === 1) EDGES.push([CORNERS[i], CORNERS[j]])
    }
}

function project(p: V3, right: V3, up: V3): [number, number] {
    const x = dot(p, right)
    const y = -dot(p, up)
    return [CENTER + x * SCALE, CENTER + y * SCALE]
}

function pointInPoly(x: number, y: number, poly: [number, number][]) {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i]
        const [xj, yj] = poly[j]
        const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi
        if (hit) inside = !inside
    }
    return inside
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax
    const dy = by - ay
    const len = dx * dx + dy * dy
    const t = len < 1e-6 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len))
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function faceIdOfNormal(n: V3): PreviewViewId {
    const score: [PreviewViewId, number][] = [
        ['right', n[0]],
        ['left', -n[0]],
        ['back', n[1]],
        ['front', -n[1]],
        ['top', n[2]],
        ['bottom', -n[2]],
    ]
    return score.reduce((best, item) => (item[1] > best[1] ? item : best))[0]
}

function snapPick(direction: V3): ViewCubePick {
    const n = normalize(direction)
    const dominant = Math.max(Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2]))
    const id = faceIdOfNormal(n)
    if (dominant > 0.92) return { id }
    return { id, direction: n }
}

function basisFromHome(): { right: V3; up: V3; back: V3 } {
    const back = HOME_DIR
    const worldUp: V3 = [0, 0, 1]
    const right = normalize([
        worldUp[1] * back[2] - worldUp[2] * back[1],
        worldUp[2] * back[0] - worldUp[0] * back[2],
        worldUp[0] * back[1] - worldUp[1] * back[0],
    ])
    const up = normalize([
        back[1] * right[2] - back[2] * right[1],
        back[2] * right[0] - back[0] * right[2],
        back[0] * right[1] - back[1] * right[0],
    ])
    return { right, up, back }
}

function sameBasis(
    a: { right: V3; up: V3; back: V3 },
    b: { right: V3; up: V3; back: V3 }
) {
    return (
        Math.abs(a.back[0] - b.back[0]) < 0.004 &&
        Math.abs(a.back[1] - b.back[1]) < 0.004 &&
        Math.abs(a.back[2] - b.back[2]) < 0.004 &&
        Math.abs(a.up[0] - b.up[0]) < 0.004 &&
        Math.abs(a.up[1] - b.up[1]) < 0.004 &&
        Math.abs(a.up[2] - b.up[2]) < 0.004
    )
}

export function ViewCube({ onSelectView, className }: { onSelectView: (id: PreviewViewId, direction?: [number, number, number]) => void; className?: string }) {
    const t = useTranslations('Maker.nameTag')
    const [basis, setBasis] = useState(basisFromHome)
    const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)

    useEffect(() => {
        let frame = 0
        let pending: { right: V3; up: V3; back: V3 } | null = null
        const onCamera = (event: Event) => {
            const detail = (event as CustomEvent<number[]>).detail
            if (!detail || detail.length < 9) return
            pending = {
                right: [detail[0], detail[1], detail[2]],
                up: [detail[3], detail[4], detail[5]],
                back: [detail[6], detail[7], detail[8]],
            }
            if (frame) return
            frame = requestAnimationFrame(() => {
                frame = 0
                const next = pending
                if (!next) return
                setBasis((prev) => (sameBasis(prev, next) ? prev : next))
            })
        }
        window.addEventListener('wow3d-camera-change', onCamera)
        return () => {
            window.removeEventListener('wow3d-camera-change', onCamera)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [])

    const { right, up, back } = basis
    const faces = FACES.map((face) => {
        const normal = faceNormal(face)
        const facing = dot(normal, back)
        const poly = inset(faceCorners(face), 0.78).map((p) => project(p, right, up))
        const mid = poly.reduce<[number, number]>((acc, p) => [acc[0] + p[0] / poly.length, acc[1] + p[1] / poly.length], [0, 0])
        return { face, normal, facing, poly, mid }
    })
        .filter((item) => item.facing > 0.02)
        .sort((a, b) => a.facing - b.facing)

    const edges = EDGES.map(([a, b]) => {
        const pa = project(a, right, up)
        const pb = project(b, right, up)
        const midN = normalize([a[0] + b[0], a[1] + b[1], a[2] + b[2]])
        return { a, b, pa, pb, direction: midN, facing: dot(midN, back) }
    }).filter((edge) => edge.facing > 0.05)

    const corners = CORNERS.map((corner) => {
        const direction = normalize(corner)
        return { corner, direction, at: project(corner, right, up), facing: dot(direction, back) }
    }).filter((corner) => corner.facing > 0.2)

    const pickAt = (x: number, y: number): Hit | null => {
        const corner = corners
            .map((item) => ({ item, dist: Math.hypot(item.at[0] - x, item.at[1] - y) }))
            .filter((item) => item.dist < 10)
            .sort((a, b) => a.dist - b.dist)[0]
        if (corner) {
            const ids = FACES.filter((face) => {
                const n = faceNormal(face)
                return dot(n, corner.item.direction) > 0.4
            }).map((face) => face.id)
            return { kind: 'corner', id: faceIdOfNormal(corner.item.direction), direction: corner.item.direction, labelIds: ids }
        }
        const edge = edges
            .map((item) => ({ item, dist: distToSeg(x, y, item.pa[0], item.pa[1], item.pb[0], item.pb[1]) }))
            .filter((item) => item.dist < 8)
            .sort((a, b) => a.dist - b.dist)[0]
        if (edge) {
            const ids = FACES.filter((face) => dot(faceNormal(face), edge.item.direction) > 0.4).map((face) => face.id)
            if (ids.length >= 2) {
                return {
                    kind: 'edge',
                    id: faceIdOfNormal(edge.item.direction),
                    direction: edge.item.direction,
                    labelIds: [ids[0], ids[1]],
                }
            }
        }
        const face = [...faces].reverse().find((item) => pointInPoly(x, y, item.poly))
        if (!face) return null
        return { kind: 'face', id: face.face.id }
    }

    const hit = pointer ? pickAt(pointer.x, pointer.y) : null

    const onHome = dot(back, HOME_DIR) > 0.985
    const alignedFace = faces.reduce<(typeof faces)[number] | null>((best, item) => {
        if (item.facing < 0.86) return best
        if (!best || item.facing > best.facing) return item
        return best
    }, null)

    const hint = hit
        ? hit.kind === 'face'
            ? t(`views.${hit.id}`)
            : hit.labelIds.map((id) => t(`views.${id}`)).join(' · ')
        : t('views.label')

    return (
        <div className={cn('absolute right-2 top-2 z-20 flex w-[112px] flex-col items-end select-none', className)}>
            <button
                type="button"
                onClick={() => onSelectView('home')}
                title={t('views.home')}
                aria-label={t('views.home')}
                className={cn(
                    'mb-1 flex h-7 w-7 items-center justify-center rounded-lg border shadow-md',
                    onHome
                        ? 'border-teal-300 bg-teal-400 text-slate-950'
                        : 'border-white/15 bg-black/70 text-white/75 backdrop-blur-md hover:border-white/30 hover:text-white'
                )}
            >
                <Home className="h-3.5 w-3.5" />
            </button>
            <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                role="group"
                aria-label={t('views.label')}
                className="touch-none"
                style={{ cursor: hit ? 'pointer' : 'default' }}
                onPointerMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect()
                    const x = ((event.clientX - rect.left) / rect.width) * SIZE
                    const y = ((event.clientY - rect.top) / rect.height) * SIZE
                    setPointer({ x, y })
                }}
                onPointerLeave={() => setPointer(null)}
                onPointerDown={(event) => {
                    event.stopPropagation()
                    const rect = event.currentTarget.getBoundingClientRect()
                    const x = ((event.clientX - rect.left) / rect.width) * SIZE
                    const y = ((event.clientY - rect.top) / rect.height) * SIZE
                    const next = pickAt(x, y)
                    if (!next) return
                    if (next.kind === 'face') {
                        const face = FACES.find((item) => item.id === next.id)
                        if (!face) return
                        const picked = snapPick(faceNormal(face))
                        onSelectView(picked.id, picked.direction)
                        return
                    }
                    const picked = snapPick(next.direction)
                    onSelectView(picked.id, picked.direction)
                }}
            >
                {faces.map((item) => {
                    const hovered = hit?.kind === 'face' && hit.id === item.face.id
                    const aligned = alignedFace?.face.id === item.face.id
                    const d = item.poly.map((p, index) => `${index === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + 'Z'
                    return (
                        <path
                            key={item.face.id}
                            d={d}
                            fill={hovered || aligned ? 'rgba(45,212,191,0.55)' : `rgba(15,23,42,${0.78 + item.facing * 0.18})`}
                            stroke={hovered || aligned ? '#5eead4' : 'rgba(255,255,255,0.28)'}
                            strokeWidth={hovered ? 2 : 1}
                        />
                    )
                })}
                {edges.map((edge) => {
                    const hovered = hit?.kind === 'edge' && Math.abs(dot(hit.direction, edge.direction) - 1) < 0.02
                    return (
                        <line
                            key={`${edge.a.join()}-${edge.b.join()}`}
                            x1={edge.pa[0]}
                            y1={edge.pa[1]}
                            x2={edge.pb[0]}
                            y2={edge.pb[1]}
                            stroke={hovered ? '#5eead4' : 'rgba(255,255,255,0.45)'}
                            strokeWidth={hovered ? 3 : 1.25}
                            strokeLinecap="round"
                        />
                    )
                })}
                {corners.map((corner) => {
                    const hovered = hit?.kind === 'corner' && Math.abs(dot(hit.direction, corner.direction) - 1) < 0.02
                    if (!hovered) return null
                    return <circle key={corner.corner.join()} cx={corner.at[0]} cy={corner.at[1]} r={5} fill="#5eead4" />
                })}
                {faces.map((item) => {
                    if (item.facing < 0.42) return null
                    return (
                        <text
                            key={`label-${item.face.id}`}
                            x={item.mid[0]}
                            y={item.mid[1]}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize={item.facing > 0.8 ? 12 : 10}
                            fontWeight={700}
                            style={{ pointerEvents: 'none' }}
                        >
                            {t(`views.${item.face.id}`)}
                        </text>
                    )
                })}
            </svg>
            <p className="mt-0.5 h-4 w-full text-center text-[10px] font-bold text-white/55">{hint}</p>
        </div>
    )
}
