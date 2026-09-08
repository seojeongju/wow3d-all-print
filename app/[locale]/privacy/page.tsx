'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'

type LabeledItem = { label: string; text: string }
type PrivacySection = {
  id: string
  title: string
  intro?: string
  outro?: string
  paragraphs?: string[]
  listType?: 'decimal' | 'disc'
  items?: LabeledItem[]
  plainItems?: string[]
  tableRows?: string[][]
  officerTitle?: string
  officerLines?: string[]
  officerEmail?: string
}

export default function PrivacyPage() {
  const t = useTranslations('Privacy')
  const sections = t.raw('sections') as PrivacySection[]
  const tableHeaders = t.raw('tableHeaders') as string[]

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
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('title')}</h1>
              <p className="text-sm text-white/40 mt-0.5">{t('subtitle')}</p>
            </div>
          </div>

          <p className="text-xs text-white/30 mb-10">{t('effectiveDate')}</p>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">
                  {section.title}
                </h2>

                {section.intro && (
                  <p className="text-sm text-white/70 leading-relaxed mb-3">{section.intro}</p>
                )}

                {section.paragraphs?.map((p) => (
                  <p key={p.slice(0, 40)} className="text-sm text-white/70 leading-relaxed">
                    {p}
                  </p>
                ))}

                {section.tableRows && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                          {tableHeaders.map((h) => (
                            <th key={h} className="text-left py-3 px-3 text-white/80 font-bold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-white/70">
                        {section.tableRows.map((row) => (
                          <tr key={row[0]} className="border-b border-white/5">
                            {row.map((cell) => (
                              <td key={cell} className="py-3 px-3">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                        <strong className="text-white/90">{item.label}</strong>: {item.text}
                      </li>
                    ))}
                  </ul>
                )}

                {section.plainItems && (
                  <ul
                    className={`space-y-2 text-sm text-white/70 leading-relaxed ${
                      section.listType === 'decimal' ? 'list-decimal list-inside' : 'list-disc list-inside'
                    }`}
                  >
                    {section.plainItems.map((item) => (
                      <li key={item.slice(0, 48)}>{item}</li>
                    ))}
                  </ul>
                )}

                {section.officerTitle && (
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-sm">
                    <p>
                      <strong className="text-white/90">{section.officerTitle}</strong>
                    </p>
                    {section.officerLines?.map((line) => (
                      <p key={line} className="text-white/70">
                        {line}
                      </p>
                    ))}
                    {section.officerEmail && (
                      <p>
                        <a href={`mailto:${section.officerEmail}`} className="text-primary hover:underline">
                          {section.officerEmail}
                        </a>
                      </p>
                    )}
                  </div>
                )}

                {section.outro && (
                  <p className="text-sm text-white/70 leading-relaxed mt-4">{section.outro}</p>
                )}
              </section>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-xl border-white/15 hover:bg-white/10">
                {t('homeCta')}
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
