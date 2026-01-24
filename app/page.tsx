'use client';

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import BentoFeatures from "@/components/home/BentoFeatures";
import ProcessSection from "@/components/home/ProcessSection";
import CTA from "@/components/home/CTA";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <Header />

      <Hero />
      <Marquee />
      <BentoFeatures />
      <ProcessSection />
      <CTA />

      <Footer />
    </main>
  );
}
