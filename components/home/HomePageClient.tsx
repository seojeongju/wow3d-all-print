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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import type { QnAItem } from "@/lib/qna";

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

      <Hero />
      <Marquee />
      <ModelUploadSection />

      <QuickProcessSteps />

      <section className="py-24 relative overflow-hidden">
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

      <HomeFAQ items={homeFaqItems} />

      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              AI 검색과 고객 질문에 바로 답하는 <span className="text-primary">핵심 가이드</span>
            </h2>
            <p className="text-foreground/70 break-keep leading-relaxed">
              3D 프린팅 견적 계산 방식, 출력 공정 비교, 자주 묻는 질문을 한곳에서 확인할 수 있도록
              정리했습니다.
            </p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
            <Link href="/guides/3d-printing-quote-guide" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Guide</p>
              <h3 className="text-xl font-bold mb-3">3D 프린팅 견적 계산 방식</h3>
              <p className="text-sm text-foreground/65 break-keep">레이어 높이, 인필, 소재, 후가공이 가격과 시간에 미치는 영향을 설명합니다.</p>
            </Link>
            <Link href="/print-methods" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Compare</p>
              <h3 className="text-xl font-bold mb-3">FDM · SLA · DLP 비교</h3>
              <p className="text-sm text-foreground/65 break-keep">시제품, 정밀 모델, 기능성 부품에 어떤 출력 방식이 적합한지 비교합니다.</p>
            </Link>
            <Link href="/guides/3d-printing-file-preparation" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">File</p>
              <h3 className="text-xl font-bold mb-3">파일 준비 가이드</h3>
              <p className="text-sm text-foreground/65 break-keep">STL·OBJ·3MF 업로드 전 파일 형식, 두께, 메쉬 오류, 단위를 점검하는 방법을 정리했습니다.</p>
            </Link>
            <Link href="/qna" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">FAQ</p>
              <h3 className="text-xl font-bold mb-3">자주 묻는 질문 모음</h3>
              <p className="text-sm text-foreground/65 break-keep">제작 기간, 파일 형식, 견적, 소재, 후가공 관련 질문과 답변을 정리했습니다.</p>
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
