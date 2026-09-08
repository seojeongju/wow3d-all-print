'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'
import {
  Cpu,
  Zap,
  Thermometer,
  FlaskConical,
  ArrowRight,
  CheckCircle2,
  Shield,
  Layers,
  Star,
  ExternalLink,
  Phone,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

const PRODUCT_BASE = [
  {
    id: 'p7-pro',
    msgKey: 'p7Pro',
    series: '9K Series',
    seriesColor: 'text-violet-400',
    name: 'P7 Pro',
    printerSize: '230 × 230 × 446 mm',
    buildSize: '153 × 77 × 160 mm',
    weight: '7.8 kg',
    power: 'DC 24V 5A · 130W',
    highlight: false,
    image: '/images/products/p7-pro.png',
  },
  {
    id: 'p10-pro',
    msgKey: 'p10Pro',
    series: '8K Series',
    seriesColor: 'text-primary',
    name: 'P10 Pro',
    printerSize: '365 × 380 × 610 mm',
    buildSize: '228 × 128 × 250 mm',
    weight: '25.5 kg',
    power: '220–240 VAC · 350W',
    highlight: true,
    image: '/images/products/p10-pro.png',
  },
  {
    id: 'p13-pro',
    msgKey: 'p13Pro',
    series: '16K Series',
    seriesColor: 'text-amber-400',
    name: 'P13 Pro',
    printerSize: '500 × 420 × 769 mm',
    buildSize: '302 × 162 × 380 mm',
    weight: '58 kg',
    power: '220–240 VAC · 350W',
    highlight: false,
    image: '/images/products/p13-pro.png',
  },
  {
    id: 'p13',
    msgKey: 'p13',
    series: '6K Series',
    seriesColor: 'text-emerald-400',
    name: 'P13',
    printerSize: '500 × 420 × 769 mm',
    buildSize: '277 × 156 × 380 mm',
    weight: '58 kg',
    power: '220–240 VAC · 350W',
    highlight: false,
    image: '/images/products/p13.png',
  },
] as const

const TECH_META = [
  { icon: Cpu, color: 'text-indigo-300', bg: 'bg-indigo-500/20' },
  { icon: Zap, color: 'text-amber-300', bg: 'bg-amber-500/20' },
  { icon: Thermometer, color: 'text-rose-300', bg: 'bg-rose-500/20' },
  { icon: Shield, color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
] as const

const CERT_ICONS = ['🏅', '🏭', '📜', '🏛️'] as const

const RESIN_COLORS = [
  'bg-slate-500/25 text-slate-200 border-slate-400/40',
  'bg-pink-500/25 text-pink-200 border-pink-400/40',
  'bg-amber-500/25 text-amber-200 border-amber-400/40',
  'bg-blue-500/25 text-blue-200 border-blue-400/40',
  'bg-violet-500/25 text-violet-200 border-violet-400/40',
  'bg-emerald-500/25 text-emerald-200 border-emerald-400/40',
] as const

type ProductMsg = {
  tagline: string
  desc: string
  resolution: string
  speed: string
  led: string
  chamber: string
}

type TechMsg = { title: string; subtitle: string; desc: string }
type CertMsg = { title: string; desc: string }
type ResinMsg = { name: string; category: string; desc: string }

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40 font-black uppercase tracking-widest shrink-0 w-32">
        {label}
      </span>
      <span className="text-sm text-white font-bold text-right leading-relaxed">{value}</span>
    </div>
  )
}

export default function PrinterProductPage() {
  const t = useTranslations('Hardware')
  const [activeProduct, setActiveProduct] = useState('p10-pro')

  const productMsgs = t.raw('products') as Record<string, ProductMsg>
  const techFeatures = t.raw('techFeatures') as TechMsg[]
  const certifications = t.raw('certifications') as CertMsg[]
  const resins = t.raw('resins') as ResinMsg[]

  const products = PRODUCT_BASE.map((p) => ({
    ...p,
    ...productMsgs[p.msgKey],
  }))
  const active = products.find((p) => p.id === activeProduct) ?? products[1]

  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-teal-500/30 selection:text-teal-400 overflow-x-hidden pt-20">
      <Header />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#020617]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(45,212,191,0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.08)_0%,transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <section className="relative pt-24 pb-20 overflow-hidden z-10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-teal-400/20 bg-teal-400/5 text-teal-400 text-xs font-black uppercase tracking-[0.3em] mb-10 shadow-xl shadow-teal-400/5"
          >
            <Layers className="w-4 h-4" />
            {t('heroEyebrow')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black mb-6 tracking-tight leading-none"
          >
            {t('heroTitle')}{' '}
            <span className="bg-gradient-to-r from-teal-400 via-indigo-400 to-teal-400 bg-clip-text text-transparent">
              {t('heroTitleAccent')}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 font-bold mb-10 break-keep max-w-2xl mx-auto"
          >
            {t('heroSubtitleBefore')}
            <br />
            <span className="text-white">{t('heroSubtitleAccent')}</span>
            {t('heroSubtitleAfter')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {[
              { label: 'Technology', value: 'MSLA' },
              { label: 'Wavelength', value: '405 nm UV' },
              { label: 'Max Speed', value: '60 mm/h' },
              { label: 'Resolution', value: 'Up to 16K' },
            ].map((b) => (
              <span
                key={b.label}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl text-sm font-bold shadow-2xl"
              >
                <span className="text-teal-400 text-xs font-black uppercase tracking-widest">
                  {b.label}
                </span>
                <span className="text-white/80">{b.value}</span>
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-5"
          >
            <Link href="/contact">
              <Button className="h-16 px-10 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-widest gap-3 shadow-xl shadow-teal-400/20 transition-all hover:scale-105 active:scale-95">
                <Phone className="w-5 h-5" /> {t('ctaConsult')}
              </Button>
            </Link>
            <Link href="/quote">
              <Button
                variant="outline"
                className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest gap-3 transition-all hover:scale-105 active:scale-95"
              >
                {t('ctaQuote')} <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white uppercase tracking-tight">
              {t('lineupTitle')}
            </h2>
            <div className="h-1.5 w-24 bg-teal-400 rounded-full mb-6" />
            <p className="text-white/40 text-lg font-bold">{t('lineupSubtitle')}</p>
          </motion.div>

          <div className="flex flex-wrap gap-3 mb-12">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveProduct(p.id)}
                className={`px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                  activeProduct === p.id
                    ? 'bg-teal-400 text-slate-950 shadow-[0_10px_30px_rgba(45,212,191,0.3)]'
                    : 'bg-white/5 text-white/40 border border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setActiveProduct(product.id)}
                className={`relative rounded-[2.5rem] border p-8 cursor-pointer transition-all duration-500 overflow-hidden group
                                    ${
                                      activeProduct === product.id
                                        ? 'bg-white/10 border-teal-400/50 shadow-2xl shadow-teal-400/20 scale-[1.02]'
                                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                                    }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {product.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30 whitespace-nowrap">
                    <Star className="w-3 h-3 fill-white" /> {t('bestSeller')}
                  </span>
                )}

                <div className={`text-xs font-black uppercase tracking-[0.2em] mb-3 ${product.seriesColor}`}>
                  {product.series}
                </div>
                <h3 className="text-3xl font-black mb-2 text-white">{product.name}</h3>
                <p className="text-sm text-white/40 font-bold mb-8 break-keep leading-relaxed">
                  {product.tagline}
                </p>

                <div className="relative w-full aspect-[4/3] mb-8 rounded-2xl bg-white overflow-hidden group/img">
                  <Image
                    src={product.image || ''}
                    alt={product.name}
                    fill
                    className="object-contain p-6 group-hover/img:scale-110 transition-transform duration-700"
                  />
                </div>

                <div className="space-y-1">
                  <SpecRow label={t('specPrinterSize')} value={product.printerSize} />
                  <SpecRow label={t('specWeight')} value={product.weight} />
                  <SpecRow label={t('specBuildSize')} value={product.buildSize} />
                </div>

                {activeProduct === product.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-white/10"
                  >
                    <p className="text-sm text-white/50 font-bold leading-relaxed break-keep">
                      {product.desc}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white uppercase tracking-tight">
              {t('specsTitle')}{' '}
              <span className="text-teal-400">— {active.name}</span>
            </h2>
            <div className="h-1 w-24 bg-white/10 rounded-full mb-6" />
            <p className="text-white/40 text-lg font-bold">{t('specsSubtitle')}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: t('specCardBuild'),
                value: active.buildSize,
                icon: Layers,
                color: 'text-teal-400',
                bg: 'bg-teal-400/10',
                border: 'border-teal-400/20',
              },
              {
                title: t('specCardSize'),
                value: active.printerSize || '',
                icon: Zap,
                color: 'text-amber-400',
                bg: 'bg-amber-400/10',
                border: 'border-amber-400/20',
              },
              {
                title: t('specCardWeight'),
                value: active.weight || '',
                icon: Cpu,
                color: 'text-indigo-400',
                bg: 'bg-indigo-400/10',
                border: 'border-indigo-400/20',
              },
              {
                title: t('specCardResolution'),
                value: active.resolution,
                icon: Thermometer,
                color: 'text-rose-400',
                bg: 'bg-rose-400/10',
                border: 'border-rose-400/20',
              },
            ].map((spec, i) => (
              <motion.div
                key={spec.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`p-8 rounded-[2rem] border ${spec.border} bg-white/[0.03] backdrop-blur-xl shadow-2xl relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div
                  className={`w-14 h-14 rounded-2xl ${spec.bg} flex items-center justify-center mb-6 ${spec.color} relative z-10 group-hover:scale-110 transition-transform`}
                >
                  <spec.icon className="w-8 h-8" strokeWidth={2} />
                </div>
                <div className="text-xs text-white/20 font-black uppercase tracking-[0.2em] mb-2 relative z-10">
                  {spec.title}
                </div>
                <div className="text-xl font-black text-white relative z-10">{spec.value}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 grid md:grid-cols-2 gap-8"
          >
            <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-rose-400 mb-8 flex items-center gap-3">
                <Thermometer className="w-5 h-5 shrink-0" /> {t('envTitle')}
              </h3>
              <div className="space-y-4">
                <SpecRow label={t('specPrinterSize')} value={active.printerSize || ''} />
                <SpecRow label={t('specWeight')} value={active.weight || ''} />
                <SpecRow label={t('envChamber')} value={active.chamber} />
                <SpecRow label={t('envAir')} value={active.led} />
              </div>
            </div>
            <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-400 mb-8 flex items-center gap-3">
                <Zap className="w-5 h-5 shrink-0" /> {t('powerTitle')}
              </h3>
              <div className="space-y-4">
                <SpecRow label={t('powerSupply')} value={active.power} />
                <SpecRow label={t('powerConnect')} value="USB 2.0" />
                <SpecRow label={t('powerDisplay')} value='5.0" Touch Screen' />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-32 z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase tracking-tight">
              {t('techTitle')}
            </h2>
            <p className="text-white/40 text-lg font-bold break-keep max-w-2xl mx-auto">
              {t('techSubtitle')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {techFeatures.map((feat, i) => {
              const meta = TECH_META[i]
              const Icon = meta.icon
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-500 hover:scale-[1.05]"
                >
                  <div
                    className={`w-16 h-16 rounded-[1.5rem] ${meta.bg} flex items-center justify-center mb-8 ${meta.color} group-hover:scale-110 transition-transform shadow-2xl`}
                  >
                    <Icon className="w-8 h-8" strokeWidth={2} />
                  </div>
                  <div className={`text-xs font-black uppercase tracking-[0.3em] mb-3 ${meta.color}`}>
                    {feat.subtitle}
                  </div>
                  <h3 className="text-xl font-black text-white mb-4 leading-tight">{feat.title}</h3>
                  <p className="text-sm text-white/40 font-bold leading-relaxed break-keep">{feat.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative py-32 z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase tracking-tight">
              {t('resinsTitle')}
            </h2>
            <p className="text-white/40 text-lg font-bold">{t('resinsSubtitle')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resins.map((resin, i) => (
              <motion.div
                key={resin.name}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-6 p-8 rounded-[2rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] transition-all active:scale-95 group"
              >
                <div
                  className={`px-4 py-2 rounded-xl text-xs font-black border group-hover:scale-110 transition-transform ${RESIN_COLORS[i] ?? RESIN_COLORS[0]}`}
                >
                  {resin.category}
                </div>
                <div className="space-y-1">
                  <div className="font-black text-lg text-white">{resin.name}</div>
                  <div className="text-sm text-white/30 font-bold leading-relaxed break-keep">
                    {resin.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase tracking-tight">
              <span className="text-teal-400">{t('certsTitleBefore')}</span> {t('certsTitleAfter')}
            </h2>
            <p className="text-white/40 font-bold break-keep max-w-xl mx-auto text-lg leading-relaxed">
              {t('certsSubtitle')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, i) => (
              <motion.div
                key={cert.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl text-center hover:bg-white/[0.06] transition-all hover:scale-105 group"
              >
                <div className="text-5xl mb-8 group-hover:scale-125 transition-transform" aria-hidden>
                  {CERT_ICONS[i]}
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" strokeWidth={3} />
                  <h3 className="font-black text-white text-lg">{cert.title}</h3>
                </div>
                <p className="text-sm text-white/30 font-bold leading-relaxed break-keep">{cert.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-40 z-10 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-teal-400/20 bg-teal-400/5 text-teal-400 text-xs font-black uppercase tracking-[0.3em] mb-12 shadow-2xl">
              <FlaskConical className="w-5 h-5" />
              {t('ctaEyebrow')}
            </div>

            <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tight leading-none text-white uppercase">
              {t('ctaTitle')}
              <br />
              <span className="text-teal-400">{t('ctaTitleAccent')}</span>
            </h2>
            <p className="text-white/40 text-xl font-bold mb-16 break-keep max-w-2xl mx-auto leading-relaxed">
              {t('ctaSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/contact">
                <Button
                  size="lg"
                  className="h-20 px-12 rounded-[2rem] bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-[0.2em] text-lg gap-3 shadow-[0_20px_50px_rgba(45,212,191,0.3)] transition-all hover:scale-105 active:scale-95"
                >
                  <Phone className="w-6 h-6" /> {t('ctaConsult')}
                </Button>
              </Link>
              <a
                href="https://wow3dsw.co.kr/hardware/3d-printer/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="h-20 px-12 rounded-[2rem] border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] text-lg gap-3 transition-all hover:scale-105 active:scale-95"
                >
                  {t('ctaOfficialSite')} <ExternalLink className="w-6 h-6" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
