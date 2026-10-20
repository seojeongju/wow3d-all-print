'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
    circleHole,
    createGyroidMesh,
    extrudeCentered,
    involuteGearShape,
} from './hero-geometry';
import { MOTOR_AXIS, MOTOR_GROUPS, MOTOR_SIZE } from './hero-motor-parts';

/**
 * 홈 히어로 업로드 영역 배경 — 실사급 3D 출력물 4종 순환.
 * - 형상: 인볼류트 기어·나선 화병·보강 브라켓·자이로이드 격자 (실제 치수 규칙으로 생성, 모서리 베벨)
 * - 조명: 제품 촬영 스튜디오처럼 소프트박스(Lightformer) 반사 환경 — 외부 HDRI 다운로드 없음
 * - 재질: FDM은 셰이더로 적층 무늬, 레진은 투명·무광 매끈한 표면
 * - 연출: 모델마다 줌인 등장 → 자동 회전 + 줌인/줌아웃 반복, 사용자가 드래그·스크롤하면 잠시 양보
 */

/** 한 모델이 보이는 시간(ms) · 페이드 구간 */
const VARIANT_MS = 7600;
const FADE_MS = 700;

type Id = 'gears' | 'glass' | 'motor' | 'gyroid';

/** 3D 모델 대신 배경을 투명 처리한 실사 사진으로 보여 주는 변형 */
const PHOTO_VARIANTS: Partial<Record<Id, { src: string; alt: string }>> = {
    glass: { src: '/images/hero/glass-knot.webp', alt: '투명 레진 매듭 조형물' },
};

const VARIANTS: { id: Id; label: string }[] = [
    { id: 'gears', label: '정밀 기어 · FDM PLA·PETG' },
    { id: 'glass', label: '매듭 조형 · 투명 레진' },
    { id: 'motor', label: '모터 분해·조립 · FDM PLA·PETG' },
    { id: 'gyroid', label: '자이로이드 격자 · SLA 레진' },
];

/* ─────────────────────────── 순환·페이드 ─────────────────────────── */

function useVariantCycle(enabled: boolean) {
    const [index, setIndex] = useState(0);
    const [fading, setFading] = useState(false);
    const targetOpacity = useRef(1);

    useEffect(() => {
        if (!enabled) return;
        let fadeTimer = 0;
        const tick = window.setInterval(() => {
            targetOpacity.current = 0;
            setFading(true);
            fadeTimer = window.setTimeout(() => {
                setIndex((i) => (i + 1) % VARIANTS.length);
                targetOpacity.current = 1;
                setFading(false);
            }, FADE_MS);
        }, VARIANT_MS);
        return () => {
            window.clearInterval(tick);
            window.clearTimeout(fadeTimer);
        };
    }, [enabled]);

    return { index, fading, targetOpacity, id: VARIANTS[index].id, label: VARIANTS[index].label };
}

function useFadeOpacity(targetOpacity: MutableRefObject<number>) {
    const opacity = useRef(0);
    useFrame((_, dt) => {
        opacity.current += (targetOpacity.current - opacity.current) * Math.min(1, dt * 7);
    });
    return opacity;
}

/** 페이드 중에만 깊이 쓰기를 끄고, 투명 설정은 생성 시 한 번만 (매 프레임 재컴파일 방지) */
function useMaterialFade(materials: THREE.Material[], opacityRef: MutableRefObject<number>, scale = 1) {
    useEffect(() => {
        for (const m of materials) m.transparent = true;
    }, [materials]);
    useFrame(() => {
        const o = opacityRef.current * scale;
        for (const m of materials) {
            m.opacity = o;
            m.depthWrite = o > 0.9;
        }
    });
}

/* ─────────────────────────── 재질 ─────────────────────────── */

/**
 * FDM 적층 무늬 — 오브젝트 좌표의 적층 축을 따라 법선을 둥근 비드처럼 기울이고 홈을 살짝 어둡게.
 * 화면에서 너무 촘촘해지면(fwidth) 무늬를 줄여 모아레를 막는다.
 */
function withLayerLines<T extends THREE.MeshStandardMaterial>(
    mat: T,
    opts: { axis: 'y' | 'z'; period: number; depth: number }
): T {
    const axisVec = opts.axis === 'y' ? 'vec3(0.0, 1.0, 0.0)' : 'vec3(0.0, 0.0, 1.0)';
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uLayerPeriod = { value: opts.period };
        shader.uniforms.uLayerDepth = { value: opts.depth };
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying float vLayerCoord;\nvarying vec3 vLayerAxisView;')
            .replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>\nvLayerCoord = position.${opts.axis};\nvLayerAxisView = normalize(normalMatrix * ${axisVec});`
            );
        shader.fragmentShader = shader.fragmentShader
            .replace(
                '#include <common>',
                '#include <common>\nuniform float uLayerPeriod;\nuniform float uLayerDepth;\nvarying float vLayerCoord;\nvarying vec3 vLayerAxisView;'
            )
            .replace(
                '#include <normal_fragment_maps>',
                `#include <normal_fragment_maps>
                float layerPhase = vLayerCoord / uLayerPeriod * 6.2831853;
                float layerAA = clamp(1.0 - fwidth(layerPhase) / 2.5, 0.0, 1.0);
                normal = normalize(normal + vLayerAxisView * cos(layerPhase) * uLayerDepth * layerAA);`
            )
            .replace(
                '#include <color_fragment>',
                `#include <color_fragment>
                float layerShade = vLayerCoord / uLayerPeriod * 6.2831853;
                diffuseColor.rgb *= 0.95 + 0.05 * sin(layerShade) * clamp(1.0 - fwidth(layerShade) / 2.5, 0.0, 1.0);`
            );
    };
    mat.customProgramCacheKey = () => `layers-${opts.axis}-${opts.period}-${opts.depth}`;
    return mat;
}

function fdmMaterial(color: string, opts: { roughness?: number; clearcoat?: number; axis?: 'y' | 'z' } = {}) {
    return withLayerLines(
        new THREE.MeshPhysicalMaterial({
            color,
            roughness: opts.roughness ?? 0.55,
            metalness: 0,
            clearcoat: opts.clearcoat ?? 0.05,
            clearcoatRoughness: 0.6,
            sheen: 0.25,
            sheenRoughness: 0.8,
        }),
        { axis: opts.axis ?? 'y', period: 0.028, depth: 0.32 }
    );
}

function steelMaterial() {
    return new THREE.MeshPhysicalMaterial({ color: '#c7ccd3', metalness: 1, roughness: 0.28, clearcoat: 0.2 });
}

/* ─────────────────────────── 모델 ─────────────────────────── */

type ModelProps = { opacityRef: MutableRefObject<number>; lowPower: boolean };

/** 등장 연출: 작게·회전한 상태에서 튀어나오듯 커짐 (실사 렌더가 '로딩'되는 느낌) */
function Showcase({ children, scale = 1, y = 0 }: { children: ReactNode; scale?: number; y?: number }) {
    const group = useRef<THREE.Group>(null);
    const start = useRef<number | null>(null);
    useFrame((state) => {
        if (!group.current) return;
        if (start.current === null) start.current = state.clock.elapsedTime;
        const t = Math.min(1, (state.clock.elapsedTime - start.current) / 1.3);
        const c1 = 1.4;
        const e = 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2; // easeOutBack
        group.current.scale.setScalar(scale * (0.55 + 0.45 * e));
        group.current.rotation.y = (1 - t) * -1.4;
        group.current.position.y = y + (1 - t) * -0.35 + Math.sin(state.clock.elapsedTime * 0.9) * 0.05;
    });
    return <group ref={group}>{children}</group>;
}

function GearPair({ opacityRef }: ModelProps) {
    const z1 = 28;
    const z2 = 14;
    const m = 0.062;
    const center = (m * (z1 + z2)) / 2;
    const gear1 = useRef<THREE.Group>(null);
    const gear2 = useRef<THREE.Group>(null);

    const { geo1, geo2, hubGeo, pinGeo, mats } = useMemo(() => {
        const geo1 = extrudeCentered(
            involuteGearShape(z1, m, { bore: 0.11, lightening: { count: 6, radius: 0.13, at: 0.5 } }),
            0.26
        );
        const geo2 = extrudeCentered(involuteGearShape(z2, m, { bore: 0.08 }), 0.34);
        const hubGeo = extrudeCentered(
            (() => {
                const s = new THREE.Shape();
                s.absarc(0, 0, 0.24, 0, Math.PI * 2, false);
                s.holes.push(circleHole(0, 0, 0.11));
                return s;
            })(),
            0.42,
            0.018
        );
        const pinGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.7, 32);
        pinGeo.rotateX(Math.PI / 2);
        const mats = {
            white: fdmMaterial('#f4f1ea', { axis: 'z' }),
            teal: fdmMaterial('#14b8a6', { axis: 'z', roughness: 0.34, clearcoat: 0.35 }),
            steel: steelMaterial(),
        };
        return { geo1, geo2, hubGeo, pinGeo, mats };
    }, []);

    useMaterialFade(useMemo(() => Object.values(mats), [mats]), opacityRef);

    useFrame((_, dt) => {
        if (!gear1.current || !gear2.current) return;
        gear1.current.rotation.z += dt * 0.45;
        // 맞물림: 접점에서 큰 기어의 이 ↔ 작은 기어의 이홈
        gear2.current.rotation.z = Math.PI + Math.PI / z2 - gear1.current.rotation.z * (z1 / z2);
    });

    return (
        <Showcase scale={0.74}>
            <group rotation={[-0.42, 0.35, 0.05]} position={[-center / 2 + 0.05, 0.05, 0]}>
                <group ref={gear1}>
                    <mesh geometry={geo1} material={mats.white} castShadow receiveShadow />
                    <mesh geometry={hubGeo} material={mats.white} castShadow />
                </group>
                <mesh geometry={pinGeo} material={mats.steel} castShadow />
                <group position={[center, 0, 0.04]}>
                    <group ref={gear2}>
                        <mesh geometry={geo2} material={mats.teal} castShadow receiveShadow />
                    </group>
                    <mesh geometry={pinGeo} material={mats.steel} castShadow />
                </group>
            </group>
        </Showcase>
    );
}

/** 자이로이드는 생성에 약 0.1~0.2초가 걸려 순환할 때마다 만들면 화면이 끊긴다 → 한 번 만들어 재사용 */
const gyroidCache = new Map<number, { mesh: THREE.Mesh; mat: THREE.MeshPhysicalMaterial }>();

function getGyroid(resolution: number) {
    let hit = gyroidCache.get(resolution);
    if (!hit) {
        const mat = new THREE.MeshPhysicalMaterial({
            color: '#eceae4',
            roughness: 0.42,
            metalness: 0,
            clearcoat: 0.2,
            clearcoatRoughness: 0.4,
            sheen: 0.4,
            sheenRoughness: 0.6,
            sheenColor: new THREE.Color('#ffffff'),
        });
        hit = { mesh: createGyroidMesh(mat, resolution), mat };
        gyroidCache.set(resolution, hit);
    }
    return hit;
}

function GyroidSphere({ opacityRef, lowPower }: ModelProps) {
    const { mesh, mat } = useMemo(() => getGyroid(lowPower ? 52 : 68), [lowPower]);
    useMaterialFade(useMemo(() => [mat], [mat]), opacityRef);

    const spin = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (spin.current) spin.current.rotation.x += dt * 0.12;
    });

    return (
        <Showcase scale={1.3}>
            <group ref={spin}>
                <primitive object={mesh} castShadow receiveShadow />
            </group>
        </Showcase>
    );
}

function CyclingModel({ id, ...props }: ModelProps & { id: Id }) {
    switch (id) {
        case 'gears':
            return <GearPair {...props} />;
        case 'gyroid':
            return <GyroidSphere {...props} />;
        default:
            return null;
    }
}

/* ─────────────────────────── 카메라 연출 ─────────────────────────── */

/**
 * 모델이 바뀔 때마다 멀리서 줌인 → 이후 천천히 줌인/줌아웃 반복.
 * 사용자가 드래그·스크롤하면 그 뒤 3초간 연출을 멈춰 조작을 방해하지 않는다.
 */
function CameraRig({ sceneKey, reducedMotion }: { sceneKey: string; reducedMotion: boolean }) {
    const controls = useRef<OrbitControlsImpl>(null);
    const sceneStart = useRef(0);
    const userUntil = useRef(0);
    const { camera, clock } = useThree();

    useEffect(() => {
        sceneStart.current = clock.elapsedTime;
    }, [sceneKey, clock]);

    useEffect(() => {
        const c = controls.current;
        if (!c) return;
        const onStart = () => {
            userUntil.current = Number.POSITIVE_INFINITY;
        };
        const onEnd = () => {
            userUntil.current = clock.elapsedTime + 3;
        };
        c.addEventListener('start', onStart);
        c.addEventListener('end', onEnd);
        return () => {
            c.removeEventListener('start', onStart);
            c.removeEventListener('end', onEnd);
        };
    }, [clock]);

    useFrame((state, dt) => {
        const c = controls.current;
        if (!c || reducedMotion) return;
        const now = state.clock.elapsedTime;
        if (now < userUntil.current) return;
        const t = now - sceneStart.current;
        const intro = Math.min(1, t / 1.6);
        const ease = 1 - (1 - intro) ** 3;
        const settled = 5.0 + Math.sin(t * 0.55) * 0.5; // 줌인(4.5) ↔ 줌아웃(5.5)
        const target = 7.6 + (settled - 7.6) * ease;
        const offset = camera.position.clone().sub(c.target);
        const d = offset.length();
        offset.setLength(d + (target - d) * Math.min(1, dt * 3));
        camera.position.copy(c.target).add(offset);
    });

    return (
        <OrbitControls
            ref={controls}
            makeDefault
            enablePan={false}
            enableZoom
            minDistance={3.8}
            maxDistance={9}
            enableDamping
            dampingFactor={0.06}
            autoRotate={!reducedMotion}
            autoRotateSpeed={1.25}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 1.7}
        />
    );
}

/* ─────────────────────────── 장면 ─────────────────────────── */

/** 제품 촬영 스튜디오 — 위·좌우 소프트박스와 틸 림라이트 (반사·하이라이트용, 화면엔 보이지 않음) */
function StudioLighting() {
    return (
        <>
            <ambientLight intensity={0.25} />
            <directionalLight position={[3, 6, 4]} intensity={2.4} />
            <directionalLight position={[-5, 2, -4]} intensity={0.9} color="#5eead4" />
            <Environment resolution={256} frames={1}>
                <Lightformer form="rect" intensity={3.4} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
                <Lightformer form="rect" intensity={2.4} position={[-5, 1.5, 2]} rotation-y={Math.PI / 2} scale={[4, 2.5, 1]} />
                <Lightformer form="rect" intensity={1.8} position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[4, 2.5, 1]} />
                <Lightformer form="rect" intensity={1.1} color="#5eead4" position={[0, 0.5, -6]} scale={[6, 1.2, 1]} />
                <Lightformer form="ring" intensity={0.9} position={[2, 2, 6]} scale={2.5} />
            </Environment>
        </>
    );
}

function SceneContent({
    id,
    targetOpacity,
    lowPower,
    reducedMotion,
}: {
    id: Id;
    targetOpacity: MutableRefObject<number>;
    lowPower: boolean;
    reducedMotion: boolean;
}) {
    const opacityRef = useFadeOpacity(targetOpacity);
    return (
        <>
            <StudioLighting />
            <CyclingModel key={id} id={id} opacityRef={opacityRef} lowPower={lowPower} />
            <ContactShadows position={[0, -1.4, 0]} opacity={0.55} scale={8} blur={2.6} far={3.2} resolution={256} color="#020617" />
            <CameraRig sceneKey={id} reducedMotion={reducedMotion} />
        </>
    );
}

/* ─────────────────────────── 실사 이미지 변형 (사진·모터 분해도) ─────────────────────────── */

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

/** 배경을 투명 처리한 실사 사진 — 천천히 회전 */
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
                    animation: anim('hero-photo-spin', 32000, 'linear infinite'),
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
@keyframes hero-motor-tilt { from { transform: rotateY(-9deg) rotateX(5deg) rotate(-2deg) } to { transform: rotateY(9deg) rotateX(-3deg) rotate(2deg) } }
@keyframes hero-motor-assemble { 0%, 12% { transform: translate(0, 0) } 42%, 62% { transform: translate(var(--tx), var(--ty)) } 90%, 100% { transform: translate(0, 0) } }`;

export default function LandingHeroScene() {
    const [mounted, setMounted] = useState(false);
    const [env, setEnv] = useState({ lowPower: false, reducedMotion: false });
    const { index, fading, targetOpacity, label, id } = useVariantCycle(mounted);

    // 사진 변형은 순서가 오기 전에 미리 받아 두어 등장할 때 빈 화면이 없게 함
    useEffect(() => {
        if (!mounted) return;
        for (const v of Object.values(PHOTO_VARIANTS)) {
            if (v) new window.Image().src = v.src;
        }
        for (const g of MOTOR_GROUPS) for (const L of g.layers) new window.Image().src = L.src;
    }, [mounted]);

    useEffect(() => {
        let raf = 0;
        const timer = window.setTimeout(() => {
            raf = window.requestAnimationFrame(() => {
                setEnv({
                    // 모바일·저사양: 투명 굴절(transmission) 대신 유광 재질, 격자 해상도 낮춤
                    lowPower: window.matchMedia('(max-width: 767px), (pointer: coarse)').matches,
                    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                });
                setMounted(true);
            });
        }, 0);
        return () => {
            window.clearTimeout(timer);
            if (raf) window.cancelAnimationFrame(raf);
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0">
            <Canvas
                shadows
                dpr={env.lowPower ? [1, 1.25] : [1, 1.75]}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.3;
                }}
            >
                <PerspectiveCamera makeDefault position={[0, 1, 7.6]} fov={35} />
                <Suspense fallback={null}>
                    <SceneContent
                        id={id}
                        targetOpacity={targetOpacity}
                        lowPower={env.lowPower}
                        reducedMotion={env.reducedMotion}
                    />
                </Suspense>
            </Canvas>

            <PhotoShowcase id={id} fading={fading} reducedMotion={env.reducedMotion} />
            {id === 'motor' ? <MotorShowcase fading={fading} reducedMotion={env.reducedMotion} /> : null}

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

            <style>{`@keyframes hero-scene-progress { from { width: 0% } to { width: 100% } }${PHOTO_KEYFRAMES}`}</style>
        </div>
    );
}
