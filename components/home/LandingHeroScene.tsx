'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';

/** 한 모델이 보이는 시간(ms) · 페이드 구간 */
const VARIANT_MS = 5600;
const FADE_MS = 750;

const TEAL = '#2dd4bf';
const SLATE = '#e2e8f0';
const ACCENT = '#5eead4';

type VariantId = 'glass' | 'gear' | 'parts' | 'wire';

const VARIANTS: { id: VariantId; label: string }[] = [
    { id: 'glass', label: '글래스' },
    { id: 'gear', label: '출력 부품' },
    { id: 'parts', label: '조립' },
    { id: 'wire', label: 'AI 분석' },
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
        m.depthWrite = opacity > 0.85;
    }
}

/** 글래스 틸 torus knot */
function GlassKnot({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
    const mat = useRef<THREE.MeshPhysicalMaterial>(null);
    useFrame(() => {
        applyOpacity([mat.current], opacityRef.current);
    });
    return (
        <Float speed={1.6} rotationIntensity={0.55} floatIntensity={0.45}>
            <mesh castShadow receiveShadow>
                <torusKnotGeometry args={[0.95, 0.32, 128, 24]} />
                <meshPhysicalMaterial
                    ref={mat}
                    color={TEAL}
                    roughness={0.15}
                    metalness={0.2}
                    transmission={0.45}
                    thickness={0.55}
                    transparent
                    opacity={1}
                    ior={1.4}
                />
            </mesh>
        </Float>
    );
}

/** 기어 + 브라켓 — 실제 출력물 느낌 */
function PrintGear({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
    const mats = useRef<THREE.MeshStandardMaterial[]>([]);
    const teeth = useMemo(() => {
        const n = 10;
        return Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2;
            return { x: Math.cos(a) * 1.05, z: Math.sin(a) * 1.05, rot: -a };
        });
    }, []);

    useFrame(() => {
        applyOpacity(mats.current, opacityRef.current);
    });

    const bindMat = (el: THREE.MeshStandardMaterial | null) => {
        if (el && !mats.current.includes(el)) mats.current.push(el);
    };

    return (
        <Float speed={1.2} rotationIntensity={0.35} floatIntensity={0.35}>
            <group>
                <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.85, 0.85, 0.38, 32]} />
                    <meshStandardMaterial
                        ref={bindMat}
                        color={SLATE}
                        roughness={0.45}
                        metalness={0.25}
                        transparent
                    />
                </mesh>
                <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.32, 0.32, 0.42, 24]} />
                    <meshStandardMaterial
                        ref={bindMat}
                        color={TEAL}
                        roughness={0.35}
                        metalness={0.35}
                        transparent
                    />
                </mesh>
                {teeth.map((t, i) => (
                    <mesh key={i} castShadow position={[t.x, 0, t.z]} rotation={[0, t.rot, 0]}>
                        <boxGeometry args={[0.28, 0.36, 0.22]} />
                        <meshStandardMaterial
                            ref={bindMat}
                            color={i % 2 === 0 ? SLATE : ACCENT}
                            roughness={0.4}
                            metalness={0.2}
                            transparent
                        />
                    </mesh>
                ))}
                <mesh castShadow position={[0, -0.55, 0]}>
                    <boxGeometry args={[1.5, 0.16, 0.55]} />
                    <meshStandardMaterial
                        ref={bindMat}
                        color="#94a3b8"
                        roughness={0.5}
                        metalness={0.15}
                        transparent
                    />
                </mesh>
            </group>
        </Float>
    );
}

/** 파츠가 모였다 벌어지는 연출 */
function AssemblingParts({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
    const group = useRef<THREE.Group>(null);
    const partRefs = useRef<(THREE.Mesh | null)[]>([]);
    const mats = useRef<THREE.MeshStandardMaterial[]>([]);

    useFrame((state) => {
        applyOpacity(mats.current, opacityRef.current);
        const t = state.clock.elapsedTime;
        const cycle = (Math.sin(t * 1.1) + 1) / 2;
        const spread = 0.15 + (1 - cycle) * 0.85;
        const offsets: [number, number, number][] = [
            [1.1, 0.35, 0.2],
            [-0.9, -0.25, 0.55],
            [0.15, 0.85, -0.9],
            [-0.35, -0.7, -0.65],
        ];
        partRefs.current.forEach((mesh, i) => {
            if (!mesh) return;
            const [ox, oy, oz] = offsets[i];
            mesh.position.set(ox * spread, oy * spread, oz * spread);
            mesh.rotation.x = t * 0.4 + i;
            mesh.rotation.y = t * 0.55 + i * 0.7;
        });
        if (group.current) group.current.rotation.y = t * 0.25;
    });

    const bindMat = (el: THREE.MeshStandardMaterial | null) => {
        if (el && !mats.current.includes(el)) mats.current.push(el);
    };

    const shapes: Array<'ico' | 'box' | 'oct' | 'dodeca'> = ['ico', 'box', 'oct', 'dodeca'];

    return (
        <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.4}>
            <group ref={group}>
                {shapes.map((shape, i) => (
                    <mesh
                        key={shape}
                        castShadow
                        ref={(el) => {
                            partRefs.current[i] = el;
                        }}
                    >
                        {shape === 'ico' && <icosahedronGeometry args={[0.42, 0]} />}
                        {shape === 'box' && <boxGeometry args={[0.55, 0.55, 0.55]} />}
                        {shape === 'oct' && <octahedronGeometry args={[0.45, 0]} />}
                        {shape === 'dodeca' && <dodecahedronGeometry args={[0.4, 0]} />}
                        <meshStandardMaterial
                            ref={bindMat}
                            color={i === 0 || i === 2 ? TEAL : SLATE}
                            roughness={0.35}
                            metalness={0.2}
                            transparent
                        />
                    </mesh>
                ))}
            </group>
        </Float>
    );
}

/** 솔리드 + 와이어프레임 이중층 — AI 분석 느낌 */
function WireSolid({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
    const solid = useRef<THREE.MeshStandardMaterial>(null);
    const wire = useRef<THREE.MeshBasicMaterial>(null);
    useFrame(() => {
        const o = opacityRef.current;
        applyOpacity([solid.current], o * 0.95);
        applyOpacity([wire.current], o * 0.85);
    });
    return (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.4}>
            <group>
                <mesh castShadow receiveShadow>
                    <icosahedronGeometry args={[1.05, 1]} />
                    <meshStandardMaterial
                        ref={solid}
                        color={SLATE}
                        roughness={0.4}
                        metalness={0.12}
                        transparent
                    />
                </mesh>
                <mesh scale={1.02}>
                    <icosahedronGeometry args={[1.05, 1]} />
                    <meshBasicMaterial ref={wire} color={TEAL} wireframe transparent />
                </mesh>
            </group>
        </Float>
    );
}

function CyclingHeroModel({
    id,
    opacityRef,
}: {
    id: VariantId;
    opacityRef: MutableRefObject<number>;
}) {
    switch (id) {
        case 'glass':
            return <GlassKnot opacityRef={opacityRef} />;
        case 'gear':
            return <PrintGear opacityRef={opacityRef} />;
        case 'parts':
            return <AssemblingParts opacityRef={opacityRef} />;
        case 'wire':
            return <WireSolid opacityRef={opacityRef} />;
        default:
            return <GlassKnot opacityRef={opacityRef} />;
    }
}

function SceneContent({
    id,
    targetOpacity,
}: {
    id: VariantId;
    targetOpacity: MutableRefObject<number>;
}) {
    const opacityRef = useFadeOpacity(targetOpacity);

    return (
        <>
            <ambientLight intensity={0.75} />
            <directionalLight position={[10, 10, 10]} intensity={2.2} castShadow shadow-mapSize={512} />
            <directionalLight position={[-8, -4, -6]} intensity={0.9} color="#99f6e4" />
            <directionalLight position={[0, 6, -8]} intensity={0.55} />

            <CyclingHeroModel id={id} opacityRef={opacityRef} />

            <OrbitControls
                enableZoom
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.85}
                makeDefault
                dampingFactor={0.05}
                enableDamping
            />
        </>
    );
}

export default function LandingHeroScene() {
    const [mounted, setMounted] = useState(false);
    const { index, targetOpacity, label, id } = useVariantCycle();

    useEffect(() => {
        // hydration 완료·다음 프레임 이후에 Canvas 생성 (Context Lost·#418 연쇄 완화)
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
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />
                <Suspense fallback={null}>
                    <SceneContent id={id} targetOpacity={targetOpacity} />
                </Suspense>
            </Canvas>

            {/* 모델 순환 인디케이터 — 업로드 안내와 겹치지 않게 하단 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-[1]">
                <span
                    key={label}
                    className="text-[9px] font-bold uppercase tracking-[0.2em] text-teal-300/85 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full border border-teal-500/25"
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
