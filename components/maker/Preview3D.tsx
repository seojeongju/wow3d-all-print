'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Center, ContactShadows } from '@react-three/drei';
import { useMakerStore, makerSceneInputFromState } from '@/store/useMakerStore';
import { buildMakerSceneGroup, disposeObject3D, hasMakerSceneContent } from '@/lib/maker-geometry';
import type { Group } from 'three';

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
        canvasSize,
    ]);

    useEffect(() => {
        return () => disposeObject3D(group);
    }, [group]);

    return <primitive object={group as Group} key={group.uuid} />;
}

export function Preview3D() {
    const [mounted, setMounted] = React.useState(false);
    const [webglContextLost, setWebglContextLost] = React.useState(false);
    const paths = useMakerStore((s) => s.paths);
    const importedSvgs = useMakerStore((s) => s.importedSvgs);
    const basePlateType = useMakerStore((s) => s.basePlateType);
    const showGrid = useMakerStore((s) => s.showGrid);

    React.useEffect(() => {
        setMounted(true);
    }, []);

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
    });

    if (!hasContent) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
                <p className="text-sm font-medium text-white/80 text-center">
                    표시할 3D 모델이 없습니다
                </p>
                <p className="text-xs text-white/50 text-center max-w-[260px] break-keep">
                    오른쪽에서 <strong className="text-white/70">배지·키캡 템플릿</strong>을 고르거나,
                    <strong className="text-white/70"> 스케치·로고</strong>를 넣어 주세요.
                    제품 실사 입체는{' '}
                    <a href="/quote?entry=photo" className="text-indigo-300 font-bold hover:underline">사진→AI 3D 견적</a>
                    을 이용하세요.
                </p>
            </div>
        );
    }

    return (
        <Canvas
            shadows
            camera={{ position: [0, -15, 15], fov: 40 }}
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
            <ContextLossHandler onContextLost={() => setWebglContextLost(true)} />

            <ambientLight intensity={0.6} />
            <spotLight position={[20, 20, 20]} angle={0.2} penumbra={1} intensity={2} />
            <pointLight position={[-20, -20, 20]} intensity={1} />
            <directionalLight
                position={[10, 10, 30]}
                intensity={1.2}
                castShadow
                shadow-mapSize={1024}
                shadow-camera-far={50}
                shadow-bias={-0.0001}
            />

            <OrbitControls
                makeDefault
                enableDamping={true}
                dampingFactor={0.1}
                minDistance={2}
                maxDistance={100}
                maxPolarAngle={Math.PI / 1.5}
                screenSpacePanning={true}
            />

            <Center top>
                <group name="export-target">
                    <MakerPreviewMeshes />
                </group>
            </Center>

            <ContactShadows
                position={[0, 0, -0.05]}
                opacity={0.4}
                scale={20}
                blur={2.5}
                far={1.5}
            />

            {showGrid && (
                <gridHelper
                    args={[50, 50, "#33334d", "#1a1a2e"]}
                    rotation={[Math.PI / 2, 0, 0]}
                    position={[0, 0, -0.1]}
                />
            )}
        </Canvas>
    );
}
