'use client';

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import ModelUploadSection from "@/components/home/ModelUploadSection";
import CoreJourneySection from "@/components/home/CoreJourneySection";
import ServicesSection from "@/components/home/ServicesSection";
import QuickProcessSteps from "@/components/home/QuickProcessSteps";
import CTA from "@/components/home/CTA";
import HomeFAQ from "@/components/home/HomeFAQ";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import type { QnAItem } from "@/lib/qna";
import { OG_IMAGE_ALT, OG_IMAGE_PATH } from "@/lib/site-url";

const MakerWorkspace = dynamic(
  () => import("@/components/maker/MakerWorkspace").then((mod) => mod.MakerWorkspace),
  { ssr: false }
);

const GallerySection = dynamic(
  () => import("@/components/home/GallerySection"),
  { ssr: false }
);

type HomePageClientProps = {
  homeFaqItems: QnAItem[];
};

export default function HomePageClient({ homeFaqItems }: HomePageClientProps) {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <Header />

      {/* ─── 상단 3구역: 업로드 → 가격·납기 → 주문 ─── */}
      <Hero />
      <Marquee />

      {/* 네이버 썸네일용 대표 이미지 — 히어로 밖 배치(헤더 겹침 방지) */}
      <section className="relative border-y border-white/5 bg-slate-950/80" aria-label="WOW3D 3D프린팅 제작 사례">
        <div className="container mx-auto px-4 py-8 sm:py-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
          <img
            src={OG_IMAGE_PATH}
            alt={OG_IMAGE_ALT}
            width={1200}
            height={1200}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border border-white/10 shadow-xl shrink-0"
            decoding="async"
          />
          <div className="text-center sm:text-left min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400/80 mb-2">Featured Work</p>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              WOW3D 3D프린팅출력 · 시제품 제작 사례
            </h2>
            <p className="mt-1.5 text-sm text-white/45 font-medium break-keep">
              산업용 부품·시제품을 정밀 출력합니다. 파일 업로드 후 실시간 자동견적으로 바로 확인하세요.
            </p>
          </div>
        </div>
      </section>

      <ModelUploadSection />
      <CoreJourneySection />

      {/* ─── 이후: 신뢰·서비스·대체 경로·FAQ ─── */}
      <GallerySection />
      <ServicesSection />

      <QuickProcessSteps />

      <section className="py-20 md:py-24 relative overflow-hidden border-t border-border/40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container relative mx-auto px-4 z-10">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-3">Choose your path</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              모델 파일이 <span className="text-primary">없으신가요?</span>
            </h2>
            <p className="text-foreground/70 break-keep leading-relaxed mb-8">
              목적에 맞는 도구를 고르세요. <strong className="text-foreground/90">로고·스케치</strong>는 Maker(2.5D),{' '}
              <strong className="text-foreground/90">제품 실사</strong>는 자동견적 AI(입체 3D)입니다.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-10">
              <div className="rounded-2xl border border-teal-500/25 bg-teal-500/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-2">AI 3D Maker</p>
                <h3 className="font-bold text-lg mb-2">로고 · 스케치 → 2.5D</h3>
                <p className="text-sm text-foreground/60 break-keep leading-relaxed mb-4">
                  원형·사각 배지, 키캡 1U 템플릿에 로고를 올려 레이어·bevel로 돌출합니다.
                </p>
                <Button asChild variant="outline" className="w-full border-teal-500/40 hover:bg-teal-500/10">
                  <a href="#ai-3d-maker">아래에서 Maker 사용</a>
                </Button>
              </div>
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">자동견적 AI</p>
                <h3 className="font-bold text-lg mb-2">사진(이미지) → 입체 3D</h3>
                <p className="text-sm text-foreground/60 break-keep leading-relaxed mb-4">
                  제품·피규어 실사 사진(이미지)으로 입체 메시를 만든 뒤 바로 자동견적합니다.
                </p>
                <Button asChild className="w-full bg-indigo-500 hover:bg-indigo-400 text-white">
                  <Link href="/quote?entry=photo">사진(이미지)으로 3D 만들기</Link>
                </Button>
                <Link href="/guides/photo-to-3d-printing-quote" className="block text-center text-xs text-indigo-300/80 hover:text-indigo-200 mt-2 underline-offset-2 hover:underline">
                  사진(이미지)→3D 견적 가이드 보기
                </Link>
              </div>
            </div>
          </div>
          <div id="ai-3d-maker" className="flex justify-center scroll-mt-24">
            <MakerWorkspace />
          </div>
        </div>
      </section>

      <HomeFAQ items={homeFaqItems} />

      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              더 궁금하다면 <span className="text-primary">가이드</span>
            </h2>
            <p className="text-foreground/70 break-keep leading-relaxed">
              견적·공정·파일 준비·FAQ는 필요할 때 확인하세요.
            </p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
            <Link href="/services" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Services</p>
              <h3 className="text-xl font-bold mb-3">핵심 전환 서비스</h3>
              <p className="text-sm text-foreground/65 break-keep">출력대행·사진(이미지)→3D·시제품·FDM·SLA</p>
            </Link>
            <Link href="/guides/photo-to-3d-printing-quote" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Photo to 3D</p>
              <h3 className="text-xl font-bold mb-3">사진(이미지)→3D 견적</h3>
              <p className="text-sm text-foreground/65 break-keep">3D 파일 없이 사진(이미지)으로 AI 모델링·자동견적</p>
            </Link>
            <Link href="/guides/3d-printing-quote-guide" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Guide</p>
              <h3 className="text-xl font-bold mb-3">비용 계산 방법</h3>
              <p className="text-sm text-foreground/65 break-keep">레이어·인필·소재가 가격에 미치는 영향</p>
            </Link>
            <Link href="/print-methods" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Compare</p>
              <h3 className="text-xl font-bold mb-3">FDM · SLA · DLP</h3>
              <p className="text-sm text-foreground/65 break-keep">용도별 출력 방식 비교</p>
            </Link>
            <Link href="/guides" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Guides</p>
              <h3 className="text-xl font-bold mb-3">가이드 전체</h3>
              <p className="text-sm text-foreground/65 break-keep">공차·서포트·STL·졸업작품 체크리스트</p>
            </Link>
          </div>
          <div className="flex justify-center mt-8">
            <Link href="/guides">
              <Button size="lg" className="rounded-full px-8 gap-2">
                가이드 모아보기 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
