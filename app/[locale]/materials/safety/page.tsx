'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Shield, Droplets, Printer } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

type LabeledItem = { label: string; text: string; emphasize?: boolean }
type MaterialCard = {
  name: string
  accent: 'emerald' | 'amber' | 'blue' | 'pink'
  summary: string
  summaryEmphasis?: string
  notes: string
}
type SafetySection = {
  id: string
  title: string
  icon?: 'printer' | 'droplets'
  intro?: string
  listType?: 'decimal' | 'disc'
  items?: LabeledItem[]
  materials?: MaterialCard[]
  msdsLink?: boolean
}

const accentClass: Record<MaterialCard['accent'], string> = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  pink: 'text-pink-400',
}

export default function MaterialSafetyPage() {
  const t = useTranslations('MaterialsSafety')
  const sections = t.raw('sections') as SafetySection[]

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      <Header />

      <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl pt-20">
        <div className="container mx-auto px-6 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl px-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('home')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('title')}</h1>
              <p className="text-sm text-white/40 mt-0.5">{t('subtitle')}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mb-10">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-100/90">
              <strong className="text-amber-200">{t('noticeLabel')}</strong> {t('noticeBody')}
            </div>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                  {section.icon === 'printer' && <Printer className="w-5 h-5 text-emerald-400" />}
                  {section.icon === 'droplets' && <Droplets className="w-5 h-5 text-violet-400" />}
                  {section.title}
                </h2>

                {section.intro && (
                  <p className="text-sm text-white/70 leading-relaxed mb-4">{section.intro}</p>
                )}

                {section.materials && (
                  <div className="space-y-6">
                    {section.materials.map((mat) => (
                      <div
                        key={mat.name}
                        className="p-5 rounded-2xl bg-white/[0.03] border border-white/10"
                      >
                        <h3 className={cn('text-base font-bold mb-2', accentClass[mat.accent])}>
                          {mat.name}
                        </h3>
                        <p className="text-sm text-white/70 leading-relaxed mb-2">
                          {mat.summaryEmphasis
                            ? mat.summary.split(mat.summaryEmphasis).map((part, i, arr) => (
                                <span key={i}>
                                  {part}
                                  {i < arr.length - 1 && (
                                    <strong className="text-amber-200">{mat.summaryEmphasis}</strong>
                                  )}
                                </span>
                              ))
                            : mat.summary}
                        </p>
                        <p className="text-sm text-white/60 leading-relaxed">{mat.notes}</p>
                      </div>
                    ))}
                  </div>
                )}

                {section.items && (
                  <ul
                    className={`space-y-2 text-sm text-white/70 leading-relaxed ${
                      section.listType === 'decimal' ? 'list-decimal list-inside' : 'list-disc list-inside'
                    }`}
                  >
                    {section.items.map((item) => (
                      <li key={item.label}>
                        <strong className="text-white/90">{item.label}</strong>:{' '}
                        {item.emphasize ? (
                          <strong className="text-amber-200 font-medium">{item.text}</strong>
                        ) : (
                          item.text
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {section.msdsLink && (
                  <p className="text-sm text-white/70 leading-relaxed">
                    {t('msdsBefore')}
                    <Link href="/contact" className="text-primary hover:underline">
                      {t('msdsLink')}
                    </Link>
                    {t('msdsAfter')}
                  </p>
                )}
              </section>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center gap-4">
            <Link href="/materials">
              <Button variant="outline" size="sm" className="rounded-xl border-white/15 hover:bg-white/10">
                {t('materialsCta')}
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                {t('termsCta')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                {t('contactCta')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
