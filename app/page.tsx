'use client';

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import ServicesSection from "@/components/home/ServicesSection";
import BentoFeatures from "@/components/home/BentoFeatures";
import ModelUploadSection from "@/components/home/ModelUploadSection";
import ProcessSection from "@/components/home/ProcessSection";
import CTA from "@/components/home/CTA";
import dynamic from "next/dynamic";

const MakerWorkspace = dynamic(
  () => import("@/components/maker/MakerWorkspace").then((mod) => mod.MakerWorkspace),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <Header />

      <Hero />
      <Marquee />
      <ModelUploadSection />

      {/* 2D to 3D AI Maker Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative mx-auto px-4 z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              모델 파일이 <span className="text-primary">없으신가요?</span>
            </h2>
            <p className="text-lg text-muted-foreground break-keep leading-relaxed">
              아이디어를 스케치하거나 레퍼런스 이미지를 업로드하세요.<br />
              WOW3D의 스마트 AI 엔진이 평면을 3D 입체 모델로 즉시 구체화합니다.
            </p>
          </div>
          <div className="flex justify-center">
            <MakerWorkspace />
          </div>
        </div>
      </section>

      <ServicesSection />
      <BentoFeatures />
      <ProcessSection />
      <CTA />

      <Footer />
    </main>
  );
}
