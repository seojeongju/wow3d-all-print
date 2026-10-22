'use client'

import { useEffect, useRef, useState } from 'react'
import { Home } from 'lucide-react'
import type { PreviewViewId } from '@/components/maker/NameTagPreview'
import { cn } from '@/lib/utils'

export interface ViewCubeProps {
    activeView?: PreviewViewId | null
    onSelectView: (viewId: PreviewViewId) => void
    className?: string
}

type CubeFaceConfig = {
    id: PreviewViewId
    label: string
    subLabel?: string
    transform: string
    hoverColor?: string
}

// 큐브 크기: 64px, 중심에서 면까지의 거리: 32px
const CUBE_SIZE = 64
const HALF_SIZE = CUBE_SIZE / 2

// Three.js 월드 좌표계(+X: 우, -X: 좌, +Z: 상, -Z: 하, -Y: 정면, +Y: 후면)와
// CSS 3D 좌표계(+X: 우, +Y: 아래, +Z: 화면 밖)를 일치시킨 6개 면
const FACES: CubeFaceConfig[] = [
    {
        id: 'front',
        label: '정면',
        subLabel: 'FRONT',
        transform: `rotateX(90deg) translateZ(${HALF_SIZE}px)`,
    },
    {
        id: 'back',
        label: '후면',
        subLabel: 'BACK',
        transform: `rotateX(-90deg) rotateZ(180deg) translateZ(${HALF_SIZE}px)`,
    },
    {
        id: 'top',
        label: '상단',
        subLabel: 'TOP',
        transform: `rotateZ(180deg) translateZ(${HALF_SIZE}px)`,
    },
    {
        id: 'bottom',
        label: '하단',
        subLabel: 'BOTTOM',
        transform: `rotateX(180deg) translateZ(${HALF_SIZE}px)`,
    },
    {
        id: 'right',
        label: '우측',
        subLabel: 'RIGHT',
        transform: `rotateY(90deg) translateZ(${HALF_SIZE}px)`,
    },
    {
        id: 'left',
        label: '좌측',
        subLabel: 'LEFT',
        transform: `rotateY(-90deg) translateZ(${HALF_SIZE}px)`,
    },
]

export function ViewCube({ activeView, onSelectView, className }: ViewCubeProps) {
    const cubeRef = useRef<HTMLDivElement>(null)
    const [hoveredFace, setHoveredFace] = useState<PreviewViewId | null>(null)

    useEffect(() => {
        const handleCameraChange = (event: Event) => {
            const customEvent = event as CustomEvent<number[]>
            const e = customEvent.detail
            if (!e || e.length < 16 || !cubeRef.current) return

            // Three.js matrixWorldInverse의 회전 성분을 CSS 3D matrix3d로 변환
            // CSS는 Y축이 아래쪽이므로 Y성분의 부호를 반전합니다.
            const m0 = e[0].toFixed(5)
            const m1 = (-e[1]).toFixed(5)
            const m2 = e[2].toFixed(5)

            const m4 = e[4].toFixed(5)
            const m5 = (-e[5]).toFixed(5)
            const m6 = e[6].toFixed(5)

            const m8 = e[8].toFixed(5)
            const m9 = (-e[9]).toFixed(5)
            const m10 = e[10].toFixed(5)

            cubeRef.current.style.transform = `matrix3d(
                ${m0}, ${m1}, ${m2}, 0,
                ${m4}, ${m5}, ${m6}, 0,
                ${m8}, ${m9}, ${m10}, 0,
                0, 0, 0, 1
            )`
        }

        window.addEventListener('wow3d-camera-change', handleCameraChange)
        return () => {
            window.removeEventListener('wow3d-camera-change', handleCameraChange)
        }
    }, [])

    return (
        <div
            className={cn(
                'group/viewcube absolute right-3 top-3 z-20 flex flex-col items-center select-none md:right-4 md:top-4',
                className
            )}
            title="3D 뷰 큐브 (클릭하여 시점 전환)"
        >
            {/* 홈(Home) 버튼 */}
            <div className="flex w-full justify-between items-center mb-1.5 px-0.5">
                <button
                    type="button"
                    onClick={() => onSelectView('home')}
                    title="기본 시점 (홈)"
                    className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg border transition-all shadow-md',
                        activeView === 'home'
                            ? 'bg-teal-400 text-slate-950 border-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.4)]'
                            : 'bg-black/60 text-white/70 border-white/15 hover:bg-white/15 hover:text-white hover:border-white/30 backdrop-blur-md'
                    )}
                >
                    <Home className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase">VIEW</span>
            </div>

            {/* 3D 큐브 컨테이너 (원근감 perspective 적용) */}
            <div
                className="relative flex items-center justify-center"
                style={{
                    width: CUBE_SIZE + 32,
                    height: CUBE_SIZE + 32,
                    perspective: 350,
                }}
            >
                {/* 회전하는 3D 큐브 본체 */}
                <div
                    ref={cubeRef}
                    className="relative transition-transform duration-75 ease-out"
                    style={{
                        width: CUBE_SIZE,
                        height: CUBE_SIZE,
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'center center',
                    }}
                >
                    {FACES.map((face) => {
                        const isActive = activeView === face.id
                        const isHovered = hoveredFace === face.id
                        return (
                            <button
                                key={face.id}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectView(face.id)
                                }}
                                onMouseEnter={() => setHoveredFace(face.id)}
                                onMouseLeave={() => setHoveredFace(null)}
                                className={cn(
                                    'absolute inset-0 flex flex-col items-center justify-center border text-center transition-colors shadow-inner',
                                    isActive
                                        ? 'bg-teal-500/50 border-teal-300 text-white shadow-[0_0_12px_rgba(45,212,191,0.5)]'
                                        : isHovered
                                          ? 'bg-teal-500/30 border-teal-400 text-teal-200'
                                          : 'bg-slate-900/85 border-white/25 text-white/85 hover:border-teal-400/80 hover:bg-slate-800/95'
                                )}
                                style={{
                                    transform: face.transform,
                                    backfaceVisibility: 'visible',
                                    WebkitBackfaceVisibility: 'visible',
                                }}
                            >
                                <span className="text-[12px] font-black tracking-tight leading-tight drop-shadow-sm">
                                    {face.label}
                                </span>
                                {face.subLabel && (
                                    <span className="text-[8px] font-bold tracking-wider text-white/40 leading-none mt-0.5">
                                        {face.subLabel}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 큐브 하단 미니 컨트롤러 힌트 (빠른 선택 바) */}
            <div className="flex items-center gap-1 mt-1 p-0.5 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md">
                {(['front', 'top', 'right', 'back'] as PreviewViewId[]).map((id) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onSelectView(id)}
                        className={cn(
                            'px-1.5 py-0.5 text-[9px] font-bold rounded transition-colors',
                            activeView === id
                                ? 'bg-teal-400 text-slate-950'
                                : 'text-white/50 hover:text-white hover:bg-white/10'
                        )}
                    >
                        {id === 'front' ? '정면' : id === 'top' ? '상단' : id === 'right' ? '우측' : '후면'}
                    </button>
                ))}
            </div>
        </div>
    )
}
