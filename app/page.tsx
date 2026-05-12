'use client';

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import ServicesSection from "@/components/home/ServicesSection";
import BentoFeatures from "@/components/home/BentoFeatures";
import ModelUploadSection from "@/components/home/ModelUploadSection";
import QuickProcessSteps from "@/components/home/QuickProcessSteps";
import ProcessSection from "@/components/home/ProcessSection";
import CTA from "@/components/home/CTA";
import HomeFAQ from "@/components/home/HomeFAQ";
import dynamic from "next/dynamic";
import Image from "next/image";

const MakerWorkspace = dynamic(
  () => import("@/components/maker/MakerWorkspace").then((mod) => mod.MakerWorkspace),
  { ssr: false }
);

const GallerySection = dynamic(
  () => import("@/components/home/GallerySection"),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <Header />

      <Hero />
      <section className="relative overflow-hidden bg-slate-950 py-14 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_35%)]" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto grid max-w-6xl items-center gap-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <figure className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
              <Image
                src="/og-image.png"
                alt="와우쓰리디 3D프린팅 자동견적 서비스 화면과 3D 모델 미리보기"
                width={1200}
                height={630}
                className="h-auto w-full object-cover"
              />
              <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-white/70">
                STL, OBJ, 3MF 파일 업로드 후 3D 미리보기와 자동 견적을 바로 확인할 수 있습니다.
              </figcaption>
            </figure>

            <div className="text-white">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-teal-400/90">
                Service Preview
              </p>
              <h2 className="mb-4 text-3xl font-black tracking-tight md:text-4xl">
                네이버와 검색엔진이 이해하기 쉬운
                <span className="mt-2 block text-teal-400">대표 서비스 이미지</span>
              </h2>
              <p className="mb-6 break-keep text-base leading-7 text-white/70 md:text-lg">
                와우쓰리디의 핵심 기능인 3D 모델 업로드, 자동 분석, 실시간 견적 흐름을 한 장의 대표 이미지로
                안내합니다. 검색엔진은 이처럼 페이지를 직접 설명하는 본문 이미지를 대표 썸네일 후보로 함께
                분석합니다.
              </p>
              <div className="grid gap-3 text-sm text-white/75">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  3D 모델 업로드부터 견적 확인까지의 실제 서비스 흐름을 반영했습니다.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-teal-300">og:image</code> 메타 태그와
                  동일한 이미지를 본문에도 노출해 대표성을 강화했습니다.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  검색 결과 반영 속도를 높이려면 배포 후 네이버 서치어드바이저에서 메인 페이지 재수집을 요청하세요.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Marquee />
      <ModelUploadSection />

      {/* 3D Printing Quote Process Section */}
      <QuickProcessSteps />

      {/* 2D to 3D AI Maker Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative mx-auto px-4 z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              모델 파일이 <span className="text-primary">없으신가요?(DEMO)</span>
            </h2>
            <p className="text-lg text-foreground/70 break-keep leading-relaxed">
              아이디어를 스케치하거나 레퍼런스 이미지를 업로드하세요.<br />
              WOW3D의 스마트 AI 엔진이 평면을 3D 입체 모델로 즉시 구체화합니다.
            </p>
          </div>
          <div className="flex justify-center">
            <MakerWorkspace />
          </div>
        </div>
      </section>

      <GallerySection />

      <ServicesSection />
      <BentoFeatures />
      <ProcessSection />

      <HomeFAQ />

      <CTA />

      <Footer />
    </main>
  );
}
