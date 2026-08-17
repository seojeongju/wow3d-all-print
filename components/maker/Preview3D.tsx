'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Center, ContactShadows } from '@react-three/drei';
import { useMakerStore, makerSceneInputFromState } from '@/store/useMakerStore';
import { buildMakerSceneGroup, disposeObject3D, hasMakerSceneContent } from '@/lib/maker-geometry';
import type { Group } from 'three';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { RotateCcw, Play, Pause } from 'lucide-react';

export type MakerViewPreset = 'iso' | 'front' | 'right' | 'left' | 'top' | 'bottom';

const VIEW_DISTANCE = 18;

/** 배지는 XY 평면, 두께는 +Z — CAD식 정면·측면·윗면 */
const VIEW_POSES: Record<MakerViewPreset, { position: THREE.Vector3; target: THREE.Vector3 }> = {
    iso: {
        position: new THREE.Vector3(12, -14, 11),
        target: new THREE.Vector3(0, 0, 1.5),
    },
    front: {
        position: new THREE.Vector3(0, -VIEW_DISTANCE, 3),
        target: new THREE.Vector3(0, 0, 2),
    },
    right: {
        position: new THREE.Vector3(VIEW_DISTANCE, 0, 3),
        target: new THREE.Vector3(0, 0, 2),
    },
    left: {
        position: new THREE.Vector3(-VIEW_DISTANCE, 0, 3),
        target: new THREE.Vector3(0, 0, 2),
    },
    top: {
        position: new THREE.Vector3(0, 0.01, VIEW_DISTANCE),
        target: new THREE.Vector3(0, 0, 0),
    },
    bottom: {
        position: new THREE.Vector3(0, 0.01, -VIEW_DISTANCE),
        target: new THREE.Vector3(0, 0, 0),
    },
};

const VIEW_BUTTONS: { id: MakerViewPreset; label: string }[] = [
    { id: 'iso', label: '사선' },
    { id: 'front', label: '정면' },
    { id: 'right', label: '우측' },
    { id: 'left', label: '좌측' },
    { id: 'top', label: '윗면' },
    { id: 'bottom', label: '아랫면' },
];

/** WebGL context 손실 감지 → 상위 state 갱신 후 render 단계에서 throw 해서 에러 바운더리 포착 */
function ContextLossHandler({ onContextLost }: { onContextLost: () => void }) {
    const { gl } = useThree();
    const fired = useRef(false);
    React.useEffect(() => {
        const canvas = gl.domElement;
        const onLost = (e: Event) => {
            e.preventDefault();
            if (fired.current) return;
            fired.current = true;
            onContextLost();
        };
        canvas.addEventListener('webglcontextlost', onLost, false);
        return () => canvas.removeEventListener('webglcontextlost', onLost);
    }, [gl, onContextLost]);
    return null;
}

function MakerPreviewMeshes() {
    const paths = useMakerStore((s) => s.paths);
    const importedSvgs = useMakerStore((s) => s.importedSvgs);
    const extrusionHeight = useMakerStore((s) => s.extrusionHeight);
    const basePlateType = useMakerStore((s) => s.basePlateType);
    const baseHeight = useMakerStore((s) => s.baseHeight);
    const bevelMm = useMakerStore((s) => s.bevelMm);
    const rimHeightMm = useMakerStore((s) => s.rimHeightMm);
    const baseSizeMm = useMakerStore((s) => s.baseSizeMm);
    const cornerRadiusMm = useMakerStore((s) => s.cornerRadiusMm);
    const mxStem = useMakerStore((s) => s.mxStem);
    const backMount = useMakerStore((s) => s.backMount);
    const baseColor = useMakerStore((s) => s.baseColor);
    const logoColor = useMakerStore((s) => s.logoColor);
    const rimColor = useMakerStore((s) => s.rimColor);
    const canvasSize = useMakerStore((s) => s.canvasSize);

    const group = useMemo(() => {
        const input = makerSceneInputFromState({
            paths,
            importedSvgs,
            extrusionHeight,
            basePlateType,
            baseHeight,
            bevelMm,
            rimHeightMm,
            baseSizeMm,
            cornerRadiusMm,
            mxStem,
            backMount,
            baseColor,
            logoColor,
            rimColor,
            canvasSize,
        });
        return buildMakerSceneGroup(input, 'preview');
    }, [
        paths,
        importedSvgs,
        extrusionHeight,
        basePlateType,
        baseHeight,
        bevelMm,
        rimHeightMm,
        baseSizeMm,
        cornerRadiusMm,
        mxStem,
        backMount,
        baseColor,
        logoColor,
        rimColor,
        canvasSize,
    ]);

    useEffect(() => {
        return () => disposeObject3D(group);
    }, [group]);

    return <primitive object={group as Group} key={group.uuid} />;
}

type ControlsApi = {
    target: THREE.Vector3
    update: () => void
    setAzimuthalAngle?: (a: number) => void
    setPolarAngle?: (a: number) => void
}

function CameraViewController({
    preset,
    presetTick,
    autoRotate,
}: {
    preset: MakerViewPreset
    presetTick: number
    autoRotate: boolean
}) {
    const { camera } = useThree();
    const controls = useThree((s) => s.controls) as ControlsApi | null;

    useEffect(() => {
        const pose = VIEW_POSES[preset];
        camera.position.copy(pose.position);
        camera.up.set(0, 0, 1);
        camera.lookAt(pose.target);
        camera.updateProjectionMatrix();
        if (controls?.target) {
            controls.target.copy(pose.target);
            controls.update?.();
        }
    }, [preset, presetTick, camera, controls]);

    useEffect(() => {
        if (!controls) return;
        // drei OrbitControls: autoRotate는 props로 전달 — 여기선 보정만
        void autoRotate;
    }, [autoRotate, controls]);

    return null;
}

function PreviewScene({
    showGrid,
    viewPreset,
    viewTick,
    autoRotate,
    onContextLost,
}: {
    showGrid: boolean
    viewPreset: MakerViewPreset
    viewTick: number
    autoRotate: boolean
    onContextLost: () => void
}) {
    return (
        <>
            <ContextLossHandler onContextLost={onContextLost} />
            <CameraViewController preset={viewPreset} presetTick={viewTick} autoRotate={autoRotate} />

            <ambientLight intensity={0.75} />
            <spotLight position={[20, 20, 28]} angle={0.25} penumbra={1} intensity={1.6} />
            <pointLight position={[-16, -12, 18]} intensity={0.9} />
            <directionalLight
                position={[8, -10, 24]}
                intensity={1.35}
                castShadow
                shadow-mapSize={1024}
                shadow-camera-far={50}
                shadow-bias={-0.0001}
            />
            {/* 흰 배지 가장자리가 보이도록 약한 림 라이트 */}
            <directionalLight position={[-12, 8, 6]} intensity={0.45} />

            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.08}
                rotateSpeed={0.35}
                zoomSpeed={0.45}
                panSpeed={0.4}
                minDistance={4}
                maxDistance={60}
                // 전방향 360° 궤도 (윗면·아랫면까지)
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
                autoRotate={autoRotate}
                autoRotateSpeed={0.55}
                screenSpacePanning
            />

            <Center top>
                <group name="export-target">
                    <MakerPreviewMeshes />
                </group>
            </Center>

            <ContactShadows
                position={[0, 0, -0.05]}
                opacity={0.35}
                scale={20}
                blur={2.5}
                far={1.5}
            />

            {showGrid && (
                <gridHelper
                    args={[50, 50, '#33334d', '#1a1a2e']}
                    rotation={[Math.PI / 2, 0, 0]}
                    position={[0, 0, -0.1]}
                />
            )}
        </>
    );
}

export function Preview3D() {
    const [mounted, setMounted] = useState(false);
    const [webglContextLost, setWebglContextLost] = useState(false);
    const [viewPreset, setViewPreset] = useState<MakerViewPreset>('iso');
    const [viewTick, setViewTick] = useState(0);
    const [autoRotate, setAutoRotate] = useState(false);

    const paths = useMakerStore((s) => s.paths);
    const importedSvgs = useMakerStore((s) => s.importedSvgs);
    const basePlateType = useMakerStore((s) => s.basePlateType);
    const showGrid = useMakerStore((s) => s.showGrid);

    useEffect(() => {
        setMounted(true);
    }, []);

    const applyView = (id: MakerViewPreset) => {
        setAutoRotate(false);
        setViewPreset(id);
        setViewTick((n) => n + 1);
    };

    if (webglContextLost) throw new Error('WebGL context lost');
    if (!mounted) return <div className="w-full h-full bg-black/20 animate-pulse" />;

    const hasContent = hasMakerSceneContent({
        paths,
        importedSvgs,
        extrusionHeight: 1,
        basePlateType,
        baseHeight: 1,
        bevelMm: 0,
        rimHeightMm: 0,
        baseSizeMm: 40,
        cornerRadiusMm: 4,
        canvasSize: { width: 800, height: 600 },
        mxStem: false,
        backMount: 'none',
        baseColor: '#f4f4f5',
        logoColor: '#0f172a',
        rimColor: '#d4d4d8',
    });

    if (!hasContent) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
                <p className="text-sm font-medium text-white/80 text-center">
                    표시할 3D 모델이 없습니다
                </p>
                <p className="text-xs text-white/80 text-center max-w-[260px] break-keep">
                    오른쪽에서 <strong className="text-white">배지·키캡 템플릿</strong>을 고르거나,
                    <strong className="text-white"> 스케치·로고</strong>를 넣어 주세요.
                    제품 실사 입체는{' '}
                    <a href="/quote?entry=photo" className="text-indigo-300 font-bold hover:underline">사진→AI 3D 견적</a>
                    을 이용하세요.
                </p>
            </div>
        );
    }

    return (
        <div className="absolute inset-0">
            <Canvas
                shadows
                camera={{ position: [12, -14, 11], fov: 40, up: [0, 0, 1] }}
                onCreated={({ camera }) => {
                    camera.up.set(0, 0, 1);
                    camera.lookAt(0, 0, 1.5);
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'low-power',
                    stencil: false,
                    depth: true,
                    preserveDrawingBuffer: false,
                }}
                dpr={[1, 1.5]}
            >
                <PreviewScene
                    showGrid={showGrid}
                    viewPreset={viewPreset}
                    viewTick={viewTick}
                    autoRotate={autoRotate}
                    onContextLost={() => setWebglContextLost(true)}
                />
            </Canvas>

            {/* 뷰 프리셋 · 자동 회전 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 p-3 sm:p-4">
                <p className="pointer-events-none text-[10px] font-bold text-white/80 drop-shadow-md">
                    드래그로 360° 회전 · 휠 확대 · 아래 버튼으로 정면·측면·윗면
                </p>
                <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/25 bg-black/75 px-2 py-2 backdrop-blur-md shadow-2xl">
                    {VIEW_BUTTONS.map((b) => (
                        <button
                            key={b.id}
                            type="button"
                            onClick={() => applyView(b.id)}
                            className={cn(
                                'h-8 rounded-lg px-2.5 text-[11px] font-black transition-colors',
                                viewPreset === b.id && !autoRotate
                                    ? 'bg-teal-500 text-slate-950'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            )}
                        >
                            {b.label}
                        </button>
                    ))}
                    <span className="mx-0.5 h-5 w-px bg-white/20" aria-hidden />
                    <button
                        type="button"
                        onClick={() => setAutoRotate((v) => !v)}
                        className={cn(
                            'inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-black transition-colors',
                            autoRotate
                                ? 'bg-teal-500 text-slate-950'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        )}
                        title={autoRotate ? '자동 회전 멈춤' : '자동 360° 회전'}
                    >
                        {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        회전
                    </button>
                    <button
                        type="button"
                        onClick={() => applyView('iso')}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-white/10 px-2.5 text-[11px] font-black text-white hover:bg-white/20"
                        title="사선 뷰로 리셋"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        리셋
                    </button>
                </div>
            </div>
        </div>
    );
}
