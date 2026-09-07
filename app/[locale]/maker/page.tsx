'use client';

import dynamic from "next/dynamic";

// Hydration Mismatch 에러 방지를 위해 클라이언트 사이드에서만 렌더링하도록 래퍼 제공
const MakerWorkspace = dynamic(
    () => import("@/components/maker/MakerWorkspace").then((mod) => mod.MakerWorkspace),
    { ssr: false }
);

export default function MakerPage() {
    return (
        <main className="min-h-screen bg-black flex items-center justify-center p-2 sm:p-4">
            <MakerWorkspace />
        </main>
    );
}
