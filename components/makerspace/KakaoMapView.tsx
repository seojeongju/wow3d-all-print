'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Loader2, MapPin } from 'lucide-react'
import {
    type Makerspace,
    kakaoMapDirectionsUrl,
    kakaoMapViewUrl,
} from '@/lib/makerspaces'
import { cn } from '@/lib/utils'

type Props = {
    center: Makerspace
    className?: string
}

const SDK_SCRIPT_ID = 'kakao-maps-sdk'

function loadKakaoSdk(appKey: string): Promise<typeof kakao.maps> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('window 없음'))
            return
        }

        if (window.kakao?.maps) {
            window.kakao.maps.load(() => resolve(window.kakao!.maps))
            return
        }

        const existing = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null
        if (existing) {
            existing.addEventListener('load', () => {
                window.kakao?.maps.load(() => resolve(window.kakao!.maps))
            })
            existing.addEventListener('error', () => reject(new Error('카카오맵 SDK 로드 실패')))
            return
        }

        const script = document.createElement('script')
        script.id = SDK_SCRIPT_ID
        script.async = true
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&libraries=services&autoload=false`
        script.onload = () => {
            if (!window.kakao?.maps) {
                reject(new Error('카카오맵 객체를 찾을 수 없습니다'))
                return
            }
            window.kakao.maps.load(() => resolve(window.kakao!.maps))
        }
        script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'))
        document.head.appendChild(script)
    })
}

export default function KakaoMapView({ center, className }: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstance = useRef<kakao.maps.Map | null>(null)
    const markerInstance = useRef<kakao.maps.Marker | null>(null)
    const infoInstance = useRef<kakao.maps.InfoWindow | null>(null)

    const [mode, setMode] = useState<'loading' | 'interactive' | 'static' | 'error'>('loading')
    const [staticFailed, setStaticFailed] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function setup() {
            setMode('loading')
            setStaticFailed(false)

            let appKey: string | null = null
            try {
                const res = await fetch('/api/makerspace/map-config')
                if (res.ok) {
                    const data = (await res.json()) as { appKey?: string | null }
                    appKey = data.appKey?.trim() || null
                }
            } catch {
                appKey = null
            }

            if (cancelled) return

            if (!appKey) {
                setMode('static')
                return
            }

            try {
                const maps = await loadKakaoSdk(appKey)
                if (cancelled || !mapRef.current) return

                const initial = new maps.LatLng(center.lat, center.lng)

                if (!mapInstance.current) {
                    mapInstance.current = new maps.Map(mapRef.current, {
                        center: initial,
                        level: 3,
                    })
                    markerInstance.current = new maps.Marker({
                        position: initial,
                        map: mapInstance.current,
                    })
                    infoInstance.current = new maps.InfoWindow({
                        content: `<div style="padding:8px 12px;font-size:12px;font-weight:700;color:#0f172a;white-space:nowrap;">${center.name}</div>`,
                    })
                    infoInstance.current.open(mapInstance.current, markerInstance.current)
                } else {
                    mapInstance.current.setCenter(initial)
                    markerInstance.current?.setPosition(initial)
                    infoInstance.current?.close()
                    infoInstance.current = new maps.InfoWindow({
                        content: `<div style="padding:8px 12px;font-size:12px;font-weight:700;color:#0f172a;white-space:nowrap;">${center.name}</div>`,
                    })
                    if (markerInstance.current) {
                        infoInstance.current.open(mapInstance.current, markerInstance.current)
                    }
                }

                // 주소 검색으로 마커 위치 보정
                const geocoder = new maps.services.Geocoder()
                geocoder.addressSearch(center.address, (result, status) => {
                    if (cancelled || status !== maps.services.Status.OK || !result[0]) return
                    const coords = new maps.LatLng(Number(result[0].y), Number(result[0].x))
                    mapInstance.current?.setCenter(coords)
                    markerInstance.current?.setPosition(coords)
                })

                requestAnimationFrame(() => mapInstance.current?.relayout())
                if (!cancelled) setMode('interactive')
            } catch {
                if (!cancelled) setMode('static')
            }
        }

        void setup()

        return () => {
            cancelled = true
        }
    }, [center])

    useEffect(() => {
        const onResize = () => mapInstance.current?.relayout()
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    const viewUrl = kakaoMapViewUrl(center)
    const directionsUrl = kakaoMapDirectionsUrl(center)
    const staticSrc = `/api/makerspace/static-map?id=${center.id}&w=640&h=420&level=3`

    return (
        <div className={cn('relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]', className)}>
            <div
                ref={mapRef}
                className={cn(
                    'h-[280px] w-full sm:h-[360px] lg:h-[420px]',
                    mode !== 'interactive' && 'absolute inset-0 opacity-0 pointer-events-none',
                )}
                aria-hidden={mode !== 'interactive'}
            />

            {mode === 'loading' && (
                <div className="flex h-[280px] w-full items-center justify-center sm:h-[360px] lg:h-[420px]">
                    <Loader2 className="h-7 w-7 animate-spin text-teal-400" aria-hidden />
                    <span className="sr-only">지도를 불러오는 중</span>
                </div>
            )}

            {(mode === 'static' || mode === 'error') && (
                <div className="relative h-[280px] w-full sm:h-[360px] lg:h-[420px]">
                    {!staticFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={staticSrc}
                            alt={`${center.name} 위치 지도`}
                            className="h-full w-full object-cover"
                            onError={() => setStaticFailed(true)}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 to-slate-950 px-6 text-center">
                            <MapPin className="h-8 w-8 text-teal-400" aria-hidden />
                            <p className="text-sm font-bold text-white/80">{center.address}</p>
                            <p className="text-xs text-white/40">지도를 불러오지 못했습니다. 카카오맵에서 확인해 주세요.</p>
                        </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1220]/50 via-transparent to-transparent" />
                </div>
            )}

            <div className="absolute bottom-3 right-3 z-10 flex flex-wrap justify-end gap-2">
                <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-[11px] font-bold text-white/90 backdrop-blur-md transition hover:border-teal-400/40 hover:text-teal-300"
                >
                    카카오맵
                    <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
                <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-400 px-3 py-2 text-[11px] font-extrabold text-slate-950 transition hover:bg-teal-300"
                >
                    길찾기
                    <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
            </div>
        </div>
    )
}
