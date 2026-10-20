'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';

/** 한 모델이 보이는 시간(ms) · 페이드 구간 */
const VARIANT_MS = 6200;
const FADE_MS = 800;

const TEAL = '#2dd4bf';
const ACCENT = '#5eead4';
const PLA_WHITE = '#f1f5f9';
const PLA_GRAY = '#cbd5e1';
const RESIN_CLEAR = '#99f6e4';
const ABS_BLACK = '#334155';

type Id = 'vase' | 'mechan' | 'stand' | 'scan';

const VARIANTS: { id: Id; label: string }[] = [
    { id: 'vase', label: '레진 화분' },
    { id: 'mechan', label: '기어·브라켓' },
    { id: 'stand', label: '폰 스탠드' },
    { id: 'scan', label: '제품 스캔' },
];

function useVariantCycle() {
    const [index, setIndex] = useState(0);
    const targetOpacity = useRef(1);

    useEffect(() => {
        let fadeTimer = 0;
        const tick = window.setInterval(() => {
            targetOpacity.current = 0;
            fadeTimer = window.setTimeout(() => {
                setIndex((i) => (i + 1) % VARIANTS.length);
                targetOpacity.current = 1;
            }, FADE_MS);
        }, VARIANT_MS);
        return () => {
            window.clearInterval(tick);
            window.clearTimeout(fadeTimer);
        };
    }, []);

    return {
        index,
        targetOpacity,
        label: VARIANTS[index].label,
        id: VARIANTS[index].id,
    };
}

function useFadeOpacity(targetOpacity: MutableRefObject<number>) {
    const opacity = useRef(1);
    useFrame((_, dt) => {
        opacity.current += (targetOpacity.current - opacity.current) * Math.min(1, dt * 8);
    });
    return opacity;
}

function applyOpacity(mats: Array<THREE.Material | null | undefined>, opacity: number) {
    for (const m of mats) {
        if (!m) continue;
        m.transparent = true;
        m.opacity = opacity;
        m.depthWrite = opacity > 0.88;
    }
}

function useMatBinder() {
    const mats = useRef<THREE.Material[]>([]);
    const bind = (el: THREE.Material | null) => {
        if (el && !mats.current.includes(el)) mats.current.push(el);
    };
    return { mats, bind };
}

/** 장착 구멍 있는 L형 브라켓 Shape */
function makeBracketShape(): THREE.Shape {
    const s = new THREE.Shape();
    s.moveTo(-0.95, -0.55);
    s.lineTo(0.95, -0.55);
    s.lineTo(0.95, -0.18);
    s.lineTo(0.35, -0.18);
    s.lineTo(0.35, 0.7);
    s.lineTo(-0.35, 0.7);
    s.lineTo(-0.35, -0.18);
    s.lineTo(-0.95, -0.18);
    s.closePath();

    const addHole = (x: number, y: number, r = 0.1) => {
        const h = new THREE.Path();
        h.absarc(x, y, r, 0, Math.PI * 2, true);
        s.holes.push(h);
    };
    addHole(-0.55, -0.36);
    addHole(0.55, -0.36);
    addHole(0, 0.42);
    return s;
}

/** 1) 투명 레진 화분 — Lathe 실루엣 */
function ResinVase({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
    const { mats, bind } = useMatBinder();
    const geo = useMemo(() => {
        const pts: THREE.Vector2[] = [];
        const profile = [
            [0.15, 0],
            [0.55, 0.05],
            [0.62, 0.2],
            [0.48, 0.45],
            [0.42, 0.75],
            [0.55, 1.05],
            [0.7, 1.25],
            [0.72, 1.4],
            [0.55, 1.45],
        ];
        for (const [x, y] of profile) pts.push(new THREE.Vector2(x, y));
        return new THREE.LatheGeometry(pts, 48);
    }, []);

    useFrame(() => applyOpacity(mats.current, opacityRef.current));

    return (
        <Float speed={1.3} rotationIntensity={0.35} floatIntensity={0.35}>
            <group position={[0, -0.7, 0]} scale={1.15}>
                <mesh geometry={geo} castShadow receiveShadow>
                    <meshPhysicalMaterial
                        ref={bind}
                        color={RESIN_CLEAR}
                        roughness={0.08}
                        metalness={0.05}
                        transmission={0.72}
                        thickness={0.45}
                        ior={1.45}
                        clearcoat={0.6}
                        clearcoatRoughness={0.15}
                        transparent
                    />
                </mesh>
                {/* 흙·화분 속 느낌의 불투명 인서트 */}
                <mesh position={[0, 0.55, 0]} castShadow>
                    <cylinderGeometry args={[0.38, 0.42, 0.7, 32]} />
                    <meshStandardMaterial
                        ref={bind}
                        color="#57534e"
                        roughness={0.9}
                        metalness={0}
                        transparent
                    />
                </mesh>
                <mesh position={[0, 0.95, 0]} castShadow>
                    <sphereGeometry args={[0.22, 24, 16]} />
                    <meshStandardMaterial
                        ref={bind}
                        color="#4ade80"
                        roughness={0.55}
                        metalness={0}
                        transparent
                    />
                </mesh>
            </group>
        </Float>
    );
}

/** 2) 스퍼 기어 + 구멍 브라켓 — 기계 부품 */
function GearAndBracket({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
    const { mats, bind } = useMatBinder();
    const group = useRef<THREE.Group>(null);

    const toothGeo = useMemo(() => new THREE.BoxGeometry(0.22, 0.34, 0.18), []);
    const teeth = useMemo(() => {
        const n = 14;
        return Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2;
            return { x: Math.cos(a) * 0.92, z: Math.sin(a) * 0.92, rot: -a };
        });
    }, []);

    const bracketGeo = useMemo(() => {
        return new THREE.ExtrudeGeometry(makeBracketShape(), {
            depth: 0.22,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.03,
            bevelSegments: 2,
            curveSegments: 16,
        });
    }, []);

    useFrame((state) => {
        applyOpacity(mats.current, opacityRef.current);
        if (group.current) {
            const g = group.current.getObjectByName('gear');
            if (g) g.rotation.y = state.clock.elapsedTime * 0.7;
        }
    });

    return (
        <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.25}>
            <group ref={group} scale={1.05}>
                <group name="gear" position={[-0.55, 0.15, 0.35]}>
                    <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.78, 0.78, 0.32, 40]} />
                        <meshStandardMaterial
                            ref={bind}
                            color={PLA_GRAY}
                            roughness={0.42}
                            metalness={0.18}
                            transparent
                        />
                    </mesh>
                    <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.22, 0.22, 0.4, 24]} />
                        <meshStandardMaterial
                            ref={bind}
                            color={ABS_BLACK}
                            roughness={0.35}
                            metalness={0.25}
                            transparent
                        />
                    </mesh>
                    {teeth.map((t, i) => (
                        <mesh
                            key={i}
                            geometry={toothGeo}
                            castShadow
                            position={[t.x, 0, t.z]}
                            rotation={[0, t.rot, 0]}
                        >
                            <meshStandardMaterial
                                ref={bind}
                                color={i % 2 === 0 ? PLA_WHITE : TEAL}
                                roughness={0.4}
                                metalness={0.15}
                                transparent
                            />
                        </mesh>
                    ))}
                </group>

                <mesh
                    geometry={bracketGeo}
                    castShadow
                    receiveShadow
                    position={[0.55, -0.15, -0.2]}
                    rotation={[0, -0.35, 0]}
                >
                    <meshStandardMaterial
                        ref={bind}
                        color="#94a3b8"
                        roughness={0.38}
                        metalness={0.35}
                        transparent
                    />
                </mesh>
            </group>
        </Float>
    );
}

/** 3) 폰 스탠드 — 베이스·등판·클립이 조립 */
function PhoneStand({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
    const { mats, bind } = useMatBinder();
    const base = useRef<THREE.Group>(null);
    const back = useRef<THREE.Group>(null);
    const lip = useRef<THREE.Group>(null);

    useFrame((state) => {
        applyOpacity(mats.current, opacityRef.current);
        const t = state.clock.elapsedTime;
        const assemble = (Math.sin(t * 0.95) + 1) / 2; // 0=분해 1=조립
        const s = 1 - assemble;
        if (base.current) base.current.position.set(0, -0.55 - s * 0.35, s * 0.4);
        if (back.current) {
            back.current.position.set(s * 0.9, 0.1 + s * 0.5, -0.35 - s * 0.3);
            back.current.rotation.x = -0.55 - s * 0.4;
        }
        if (lip.current) lip.current.position.set(-s * 0.7, -0.28, 0.35 + s * 0.5);
    });

    return (
        <Float speed={1.15} rotationIntensity={0.2} floatIntensity={0.3}>
            <group scale={1.2} rotation={[0.15, 0.4, 0]}>
                <group ref={base}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[1.7, 0.14, 1.05]} />
                        <meshStandardMaterial
                            ref={bind}
                            color={PLA_WHITE}
                            roughness={0.5}
                            metalness={0.05}
                            transparent
                        />
                    </mesh>
                    {/* 케이블 홈 */}
                    <mesh position={[0, 0.08, -0.15]} castShadow>
                        <boxGeometry args={[0.28, 0.06, 0.7]} />
                        <meshStandardMaterial
                            ref={bind}
                            color={ABS_BLACK}
                            roughness={0.55}
                            metalness={0.05}
                            transparent
                        />
                    </mesh>
                </group>

                <group ref={back} position={[0, 0.1, -0.35]} rotation={[-0.55, 0, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[1.35, 1.55, 0.12]} />
                        <meshStandardMaterial
                            ref={bind}
                            color={TEAL}
                            roughness={0.4}
                            metalness={0.12}
                            transparent
                        />
                    </mesh>
                    {/* 뒷면 보강 리브 */}
                    <mesh position={[0, 0, -0.08]} castShadow>
                        <boxGeometry args={[0.12, 1.35, 0.08]} />
                        <meshStandardMaterial
                            ref={bind}
                            color="#0f766e"
                            roughness={0.45}
                            metalness={0.1}
                            transparent
                        />
                    </mesh>
                </group>

                <group ref={lip} position={[0, -0.28, 0.35]}>
                    <mesh castShadow>
                        <boxGeometry args={[1.35, 0.18, 0.28]} />
                        <meshStandardMaterial
                            ref={bind}
                            color={PLA_GRAY}
                            roughness={0.48}
                            metalness={0.08}
                            transparent
                        />
                    </mesh>
                </group>
            </group>
        </Float>
    );
}

/** 4) 소형 제품(액션캠 마운트) + 스캔 와이어프레임 */
function ProductScan({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
    const { mats, bind } = useMatBinder();
    const wireMats = useRef<THREE.MeshBasicMaterial[]>([]);
    const bindWire = (el: THREE.MeshBasicMaterial | null) => {
        if (el && !wireMats.current.includes(el)) wireMats.current.push(el);
    };

    useFrame((state) => {
        const o = opacityRef.current;
        applyOpacity(mats.current, o * 0.97);
        applyOpacity(wireMats.current, o * 0.55);
        // 스캔 라인 느낌: 와이어 살짝 깜빡
        const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
        for (const m of wireMats.current) {
            if (m) m.opacity = o * pulse;
        }
    });

    return (
        <Float speed={1.35} rotationIntensity={0.4} floatIntensity={0.35}>
            <group scale={1.25} rotation={[0.25, -0.5, 0.1]}>
                {/* 본체 */}
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[1.1, 0.7, 0.55]} />
                    <meshStandardMaterial
                        ref={bind}
                        color={ABS_BLACK}
                        roughness={0.35}
                        metalness={0.25}
                        transparent
                    />
                </mesh>
                {/* 렌즈 배럴 */}
                <mesh castShadow position={[0, 0.05, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.22, 0.26, 0.28, 28]} />
                    <meshStandardMaterial
                        ref={bind}
                        color="#1e293b"
                        roughness={0.25}
                        metalness={0.45}
                        transparent
                    />
                </mesh>
                <mesh position={[0, 0.05, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.16, 28]} />
                    <meshStandardMaterial
                        ref={bind}
                        color="#38bdf8"
                        roughness={0.15}
                        metalness={0.6}
                        emissive="#0ea5e9"
                        emissiveIntensity={0.25}
                        transparent
                    />
                </mesh>
                {/* 마운트 암 */}
                <mesh castShadow position={[0, -0.55, 0]}>
                    <boxGeometry args={[0.35, 0.45, 0.28]} />
                    <meshStandardMaterial
                        ref={bind}
                        color={PLA_GRAY}
                        roughness={0.45}
                        metalness={0.15}
                        transparent
                    />
                </mesh>
                <mesh castShadow position={[0, -0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.12, 0.12, 0.7, 16]} />
                    <meshStandardMaterial
                        ref={bind}
                        color={TEAL}
                        roughness={0.4}
                        metalness={0.2}
                        transparent
                    />
                </mesh>

                {/* 스캔 와이어 오버레이 */}
                <mesh scale={1.04}>
                    <boxGeometry args={[1.1, 0.7, 0.55]} />
                    <meshBasicMaterial ref={bindWire} color={TEAL} wireframe transparent />
                </mesh>
                <mesh position={[0, 0.05, 0.38]} rotation={[Math.PI / 2, 0, 0]} scale={1.08}>
                    <cylinderGeometry args={[0.22, 0.26, 0.28, 16]} />
                    <meshBasicMaterial ref={bindWire} color={ACCENT} wireframe transparent />
                </mesh>
            </group>
        </Float>
    );
}

function CyclingHeroModel({
    id,
    opacityRef,
}: {
    id: Id;
    opacityRef: MutableRefObject<number>;
}) {
    switch (id) {
        case 'vase':
            return <ResinVase opacityRef={opacityRef} />;
        case 'mechan':
            return <GearAndBracket opacityRef={opacityRef} />;
        case 'stand':
            return <PhoneStand opacityRef={opacityRef} />;
        case 'scan':
            return <ProductScan opacityRef={opacityRef} />;
        default:
            return <ResinVase opacityRef={opacityRef} />;
    }
}

function SceneContent({
    id,
    targetOpacity,
}: {
    id: Id;
    targetOpacity: MutableRefObject<number>;
}) {
    const opacityRef = useFadeOpacity(targetOpacity);

    return (
        <>
            <hemisphereLight args={['#e2e8f0', '#0f172a', 0.55]} />
            <ambientLight intensity={0.45} />
            <directionalLight
                position={[6, 10, 6]}
                intensity={2.4}
                castShadow
                shadow-mapSize={[512, 512]}
            />
            <directionalLight position={[-6, 3, -4]} intensity={0.85} color="#99f6e4" />
            <directionalLight position={[2, 4, -8]} intensity={0.5} />

            <CyclingHeroModel id={id} opacityRef={opacityRef} />

            <ContactShadows
                position={[0, -1.35, 0]}
                opacity={0.45}
                scale={8}
                blur={2.2}
                far={3.5}
                color="#020617"
            />

            <OrbitControls
                enableZoom
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.7}
                makeDefault
                dampingFactor={0.05}
                enableDamping
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.55}
            />
        </>
    );
}

export default function LandingHeroScene() {
    const [mounted, setMounted] = useState(false);
    const { index, targetOpacity, label, id } = useVariantCycle();

    useEffect(() => {
        let raf = 0;
        const timer = window.setTimeout(() => {
            raf = window.requestAnimationFrame(() => setMounted(true));
        }, 0);
        return () => {
            window.clearTimeout(timer);
            if (raf) window.cancelAnimationFrame(raf);
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 group cursor-grab active:cursor-grabbing">
            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
            >
                <PerspectiveCamera makeDefault position={[0, 0.35, 5.2]} fov={38} />
                <Suspense fallback={null}>
                    <SceneContent id={id} targetOpacity={targetOpacity} />
                </Suspense>
            </Canvas>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-[1]">
                <span
                    key={label}
                    className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-300/90 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-teal-500/30"
                >
                    {label}
                </span>
                <div className="flex items-center gap-1.5">
                    {VARIANTS.map((v, i) => (
                        <span
                            key={v.id}
                            className={
                                i === index
                                    ? 'h-1.5 w-4 rounded-full bg-teal-400 transition-all'
                                    : 'h-1.5 w-1.5 rounded-full bg-white/25 transition-all'
                            }
                        />
                    ))}
                </div>
            </div>

            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-[1]">
                <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white/70 uppercase tracking-widest whitespace-nowrap">
                    Drag to Orbit • Scroll to Zoom
                </div>
            </div>
        </div>
    );
}
