'use client';

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import ServicesSection from "@/components/home/ServicesSection";
import BentoFeatures from "@/components/home/BentoFeatures";
import ModelUploadSection from "@/components/home/ModelUploadSection";
import { MakerWorkspace } from "@/components/maker/MakerWorkspace";
import ProcessSection from "@/components/home/ProcessSection";
import CTA from "@/components/home/CTA";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <Header />

      <Hero />
      <Marquee />
      <ModelUploadSection />

      {/* 2D Drawing to 3D Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">모델 파일이 없으신가요?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              직접 그림을 그리거나 이미지를 업로드해보세요.<br />
              WOW3D의 스마트 캔버스가 즉시 3D 모델로 변환해드립니다.
            </p>
          </div>
          <MakerWorkspace />
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
