'use client';

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import CoreJourneySection from "@/components/home/CoreJourneySection";
import ServicesSection from "@/components/home/ServicesSection";
import QuickProcessSteps from "@/components/home/QuickProcessSteps";
import CTA from "@/components/home/CTA";
import HomeFAQ from "@/components/home/HomeFAQ";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
  const tFeatured = useTranslations('Home.featured');
  const tNoFile = useTranslations('Home.noFile');
  const tGuides = useTranslations('Home.moreGuides');
  const titleAccent = tNoFile('titleAccent');
  const guidesAccent = tGuides('titleAccent');

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <Header />

      {/* ─── 전환(히어로) → 사례(신뢰) ─── */}
      <Hero />
      <Marquee />

      {/* 네이버 썸네일용 대표 이미지 — 히어로 밖 배치(헤더 겹침 방지) */}
      <section className="relative border-y border-white/5 bg-slate-950/80" aria-label={tFeatured('aria')}>
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
              {tFeatured('title')}
            </h2>
            <p className="mt-1.5 text-sm text-white/45 font-medium break-keep">
              {tFeatured('desc')}
            </p>
          </div>
        </div>
      </section>

      {/* ─── 전환 직후: 시제품 갤러리(신뢰) → 여정·서비스 ─── */}
      <GallerySection />
      <CoreJourneySection />
      <ServicesSection />

      <QuickProcessSteps />

      <section className="py-20 md:py-24 relative overflow-hidden border-t border-border/40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container relative mx-auto px-4 z-10">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-3">Choose your path</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              {tNoFile('titleBefore')}
              {titleAccent ? <span className="text-primary">{titleAccent}</span> : null}
            </h2>
            <p className="text-foreground/70 break-keep leading-relaxed mb-8">
              {tNoFile('subtitleBefore')}
              <strong className="text-foreground/90">{tNoFile('logoSketch')}</strong>
              {tNoFile('subtitleMid')}
              <strong className="text-foreground/90">{tNoFile('photoReal')}</strong>
              {tNoFile('subtitleEnd')}
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-10">
              <div className="rounded-2xl border border-teal-500/25 bg-teal-500/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-2">AI 3D Maker</p>
                <h3 className="font-bold text-lg mb-2">{tNoFile('makerTitle')}</h3>
                <p className="text-sm text-foreground/60 break-keep leading-relaxed mb-4">
                  {tNoFile('makerDesc')}
                </p>
                <Button asChild variant="outline" className="w-full border-teal-500/40 hover:bg-teal-500/10">
                  <a href="#ai-3d-maker">{tNoFile('makerCta')}</a>
                </Button>
              </div>
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">{tNoFile('aiLabel')}</p>
                <h3 className="font-bold text-lg mb-2">{tNoFile('photoTitle')}</h3>
                <p className="text-sm text-foreground/60 break-keep leading-relaxed mb-4">
                  {tNoFile('photoDesc')}
                </p>
                <Button asChild className="w-full bg-indigo-500 hover:bg-indigo-400 text-white">
                  <Link href="/quote?entry=photo">{tNoFile('photoCta')}</Link>
                </Button>
                <Link href="/guides/photo-to-3d-printing-quote" className="block text-center text-xs text-indigo-300/80 hover:text-indigo-200 mt-2 underline-offset-2 hover:underline">
                  {tNoFile('photoGuide')}
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
              {tGuides('titleBefore')}
              {guidesAccent ? <span className="text-primary">{guidesAccent}</span> : null}
            </h2>
            <p className="text-foreground/70 break-keep leading-relaxed">
              {tGuides('subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
            <Link href="/services" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Services</p>
              <h3 className="text-xl font-bold mb-3">{tGuides('servicesTitle')}</h3>
              <p className="text-sm text-foreground/65 break-keep">{tGuides('servicesDesc')}</p>
            </Link>
            <Link href="/guides/photo-to-3d-printing-quote" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Photo to 3D</p>
              <h3 className="text-xl font-bold mb-3">{tGuides('photoTitle')}</h3>
              <p className="text-sm text-foreground/65 break-keep">{tGuides('photoDesc')}</p>
            </Link>
            <Link href="/guides/3d-printing-quote-guide" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Guide</p>
              <h3 className="text-xl font-bold mb-3">{tGuides('costTitle')}</h3>
              <p className="text-sm text-foreground/65 break-keep">{tGuides('costDesc')}</p>
            </Link>
            <Link href="/print-methods" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Compare</p>
              <h3 className="text-xl font-bold mb-3">{tGuides('compareTitle')}</h3>
              <p className="text-sm text-foreground/65 break-keep">{tGuides('compareDesc')}</p>
            </Link>
            <Link href="/guides" className="rounded-3xl border border-border bg-card/40 p-6 hover:bg-card transition-colors">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-2">Guides</p>
              <h3 className="text-xl font-bold mb-3">{tGuides('allTitle')}</h3>
              <p className="text-sm text-foreground/65 break-keep">{tGuides('allDesc')}</p>
            </Link>
          </div>
          <div className="flex justify-center mt-8">
            <Link href="/guides">
              <Button size="lg" className="rounded-full px-8 gap-2">
                {tGuides('browseAll')} <ArrowRight className="w-4 h-4" />
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
