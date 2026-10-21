'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { MOTOR_AXIS, MOTOR_GROUPS, MOTOR_SIZE } from './hero-motor-parts';

/**
 * 홈 히어로 업로드 영역 배경 — 출력물 실사 이미지 4종 순환 (배경 투명 WebP + CSS 애니메이션, WebGL 없음).
 * - 정밀 기어 세트(회전) · 투명 레진 매듭(회전) · 모터 분해·조립(3D프린팅 질감 레이어) · SLA 레진 흉상(흔들림)
 * - 연출: 튀어나오며 줌인 등장 → 줌인/줌아웃 · 원근 기울기 반복, 전환은 페이드
 * - "동작 줄이기" 설정이면 움직이지 않는다
 */

/** 한 모델이 보이는 시간(ms) · 페이드 구간 */
const VARIANT_MS = 7600;
const FADE_MS = 700;

type Id = 'gears' | 'glass' | 'motor' | 'bust';

/** motion — spin: 천천히 360° 회전(대칭형 조형) · sway: 좌우로 살짝 흔들림(위아래가 있는 조형) */
const PHOTO_VARIANTS: Partial<Record<Id, { src: string; alt: string; motion: 'spin' | 'sway' }>> = {
    gears: { src: '/images/hero/gear-cluster.webp', alt: '맞물린 정밀 기어 세트', motion: 'spin' },
    glass: { src: '/images/hero/glass-knot.webp', alt: '투명 레진 매듭 조형물', motion: 'spin' },
    bust: { src: '/images/hero/resin-bust.webp', alt: 'SLA 레진 흉상·건축 조형물', motion: 'sway' },
};

const VARIANTS: { id: Id; label: string }[] = [
    { id: 'gears', label: '정밀 기어 · FDM PLA·PETG' },
    { id: 'glass', label: '매듭 조형 · 투명 레진' },
    { id: 'motor', label: '모터 분해·조립 · FDM PLA·PETG' },
    { id: 'bust', label: '흉상 조형 · SLA 레진' },
];

/* ─────────────────────────── 순환·페이드 ─────────────────────────── */

function useVariantCycle(enabled: boolean) {
    const [index, setIndex] = useState(0);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        if (!enabled) return;
        let fadeTimer = 0;
        const tick = window.setInterval(() => {
            setFading(true);
            fadeTimer = window.setTimeout(() => {
                setIndex((i) => (i + 1) % VARIANTS.length);
                setFading(false);
            }, FADE_MS);
        }, VARIANT_MS);
        return () => {
            window.clearInterval(tick);
            window.clearTimeout(fadeTimer);
        };
    }, [enabled]);

    return { index, fading, id: VARIANTS[index].id, label: VARIANTS[index].label };
}

/* ─────────────────────────── 실사 이미지 연출 ─────────────────────────── */

type AnimFn = (name: string, ms: number, extra?: string) => string | undefined;

function makeAnim(reducedMotion: boolean): AnimFn {
    return (name, ms, extra = '') => (reducedMotion ? undefined : `${name} ${ms}ms ${extra}`);
}

/** 공용 래퍼: 등장(튀어나오며 줌인) · 줌인/줌아웃 · 원근 기울기 — 레이어마다 애니메이션 하나씩 */
function FlatShowcase({
    fading,
    anim,
    tilt = 'hero-photo-tilt',
    children,
}: {
    fading: boolean;
    anim: AnimFn;
    tilt?: string;
    children: ReactNode;
}) {
    return (
        <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity ease-out"
            style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms`, perspective: '900px' }}
            aria-hidden
        >
            <div style={{ animation: anim('hero-photo-in', 1300, 'cubic-bezier(0.34, 1.56, 0.64, 1) both') }}>
                <div style={{ animation: anim('hero-photo-zoom', 5200, 'ease-in-out 1300ms infinite alternate both') }}>
                    <div style={{ animation: anim(tilt, 4300, 'ease-in-out infinite alternate'), transformStyle: 'preserve-3d' }}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** 배경을 투명 처리한 실사 사진 — 회전(spin) 또는 흔들림(sway) */
function PhotoShowcase({ id, fading, reducedMotion }: { id: Id; fading: boolean; reducedMotion: boolean }) {
    const photo = PHOTO_VARIANTS[id];
    if (!photo) return null;
    const anim = makeAnim(reducedMotion);
    return (
        <FlatShowcase key={id} fading={fading} anim={anim}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 투명 WebP를 CSS 변형으로 직접 움직임 */}
            <img
                src={photo.src}
                alt={photo.alt}
                draggable={false}
                className="w-auto select-none"
                style={{
                    height: 'clamp(220px, 46vw, 430px)',
                    animation:
                        photo.motion === 'spin'
                            ? anim('hero-photo-spin', 32000, 'linear infinite')
                            : anim('hero-photo-sway', 5600, 'ease-in-out infinite alternate'),
                    filter: 'drop-shadow(0 26px 28px rgba(2, 6, 23, 0.6)) drop-shadow(0 0 22px rgba(45, 212, 191, 0.18))',
                }}
            />
        </FlatShowcase>
    );
}

/** 조립 시 축 방향으로 모이는 비율 · 볼트가 자기 부품 중심으로 더 다가가는 비율 · 분해→조립→분해 한 주기 */
const MOTOR_GATHER = 0.55;
const MOTOR_BOLT_GATHER = 0.85;
const MOTOR_CYCLE_MS = 6400;

/**
 * 3D프린팅 질감으로 바꾼 모터 분해도 — 부품 5개(+볼트)가 축을 따라 모였다(조립) 벌어진다(분해).
 * 각 레이어의 조립 위치는 자기 크기 대비 %로 계산해 CSS 변수(--tx, --ty)로 넘긴다.
 */
function MotorShowcase({ fading, reducedMotion }: { fading: boolean; reducedMotion: boolean }) {
    const anim = makeAnim(reducedMotion);
    const [ax, ay] = MOTOR_AXIS;
    return (
        <FlatShowcase fading={fading} anim={anim} tilt="hero-motor-tilt">
            <div
                className="relative select-none"
                style={{
                    width: 'clamp(300px, 56vw, 580px)',
                    aspectRatio: `${MOTOR_SIZE.width} / ${MOTOR_SIZE.height}`,
                    filter: 'drop-shadow(0 24px 26px rgba(2, 6, 23, 0.55))',
                }}
            >
                {MOTOR_GROUPS.flatMap((g, gi) =>
                    g.layers.map((L) => {
                        let dx = -g.s * MOTOR_GATHER * ax;
                        let dy = -g.s * MOTOR_GATHER * ay;
                        if (L.kind === 'bolts') {
                            dx += (g.center[0] - (L.x + L.w / 2)) * MOTOR_BOLT_GATHER;
                            dy += (g.center[1] - (L.y + L.h / 2)) * MOTOR_BOLT_GATHER;
                        }
                        const style = {
                            position: 'absolute',
                            left: `${(L.x / MOTOR_SIZE.width) * 100}%`,
                            top: `${(L.y / MOTOR_SIZE.height) * 100}%`,
                            width: `${(L.w / MOTOR_SIZE.width) * 100}%`,
                            height: `${(L.h / MOTOR_SIZE.height) * 100}%`,
                            // 왼쪽(앞) 부품이 위로 겹치도록
                            zIndex: (MOTOR_GROUPS.length - gi) * 2 + (L.kind === 'bolts' ? 1 : 0),
                            '--tx': `${(dx / L.w) * 100}%`,
                            '--ty': `${(dy / L.h) * 100}%`,
                            animation: anim(
                                'hero-motor-assemble',
                                MOTOR_CYCLE_MS,
                                `ease-in-out ${L.kind === 'bolts' ? 1100 : 900}ms infinite both`
                            ),
                        } as CSSProperties;
                        return (
                            // eslint-disable-next-line @next/next/no-img-element -- 분해도 레이어를 CSS 변형으로 직접 이동
                            <img key={L.src} src={L.src} alt="" draggable={false} style={style} />
                        );
                    })
                )}
            </div>
        </FlatShowcase>
    );
}

const PHOTO_KEYFRAMES = `
@keyframes hero-photo-in { from { opacity: 0; transform: scale(0.5) rotate(-28deg) translateY(30px) } to { opacity: 1; transform: none } }
@keyframes hero-photo-zoom { from { transform: scale(0.9) } to { transform: scale(1.1) } }
@keyframes hero-photo-tilt { from { transform: rotateY(-16deg) rotateX(7deg) } to { transform: rotateY(16deg) rotateX(-5deg) } }
@keyframes hero-photo-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes hero-photo-sway { from { transform: rotate(-5deg) translateY(4px) } to { transform: rotate(5deg) translateY(-4px) } }
@keyframes hero-motor-tilt { from { transform: rotateY(-9deg) rotateX(5deg) rotate(-2deg) } to { transform: rotateY(9deg) rotateX(-3deg) rotate(2deg) } }
@keyframes hero-motor-assemble { 0%, 12% { transform: translate(0, 0) } 42%, 62% { transform: translate(var(--tx), var(--ty)) } 90%, 100% { transform: translate(0, 0) } }
@keyframes hero-scene-progress { from { width: 0% } to { width: 100% } }`;

export default function LandingHeroScene() {
    const [mounted, setMounted] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const { index, fading, label, id } = useVariantCycle(mounted);

    useEffect(() => {
        setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        setMounted(true);
    }, []);

    // 다음 차례 이미지를 미리 받아 두어 등장할 때 빈 화면이 없게 함
    useEffect(() => {
        if (!mounted) return;
        for (const v of Object.values(PHOTO_VARIANTS)) {
            if (v) new window.Image().src = v.src;
        }
        for (const g of MOTOR_GROUPS) for (const L of g.layers) new window.Image().src = L.src;
    }, [mounted]);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0">
            <PhotoShowcase id={id} fading={fading} reducedMotion={reducedMotion} />
            {id === 'motor' ? <MotorShowcase fading={fading} reducedMotion={reducedMotion} /> : null}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-[1]">
                <span
                    key={label}
                    className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-300/90 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-teal-500/30 whitespace-nowrap"
                >
                    {label}
                </span>
                <div className="flex items-center gap-1.5">
                    {VARIANTS.map((v, i) => (
                        <span
                            key={v.id}
                            className={
                                i === index
                                    ? 'relative h-1.5 w-6 overflow-hidden rounded-full bg-white/20'
                                    : 'h-1.5 w-1.5 rounded-full bg-white/25 transition-all'
                            }
                        >
                            {i === index ? (
                                // 현재 모델 표시 시간 진행 막대
                                <span
                                    key={`p-${index}`}
                                    className="absolute inset-y-0 left-0 rounded-full bg-teal-400"
                                    style={{ animation: `hero-scene-progress ${VARIANT_MS}ms linear forwards` }}
                                />
                            ) : null}
                        </span>
                    ))}
                </div>
            </div>

            <style>{PHOTO_KEYFRAMES}</style>
        </div>
    );
}
