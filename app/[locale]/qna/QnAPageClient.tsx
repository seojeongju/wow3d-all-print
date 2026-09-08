'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, Search, MessageSquare, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Link } from '@/i18n/navigation'
import type { QnAItem } from '@/lib/qna'

const ITEMS_PER_PAGE = 8

type QnAPageClientProps = {
  initialQnas: QnAItem[]
}

export default function QnAPageClient({ initialQnas }: QnAPageClientProps) {
  const t = useTranslations('QnAPage')
  const [qnas] = useState<QnAItem[]>(initialQnas)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [openId, setOpenId] = useState<number | null>(null)

  const categoryKeys = ['all', 'general', 'quote', 'tech', 'partnership', 'other'] as const

  useEffect(() => {
    setCurrentPage(1)
    setOpenId(null)
  }, [searchQuery, selectedCategory])

  const filteredQnas = useMemo(() => {
    return qnas.filter((q) => {
      const matchesSearch =
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [qnas, searchQuery, selectedCategory])

  const totalPages = Math.ceil(filteredQnas.length / ITEMS_PER_PAGE)
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredQnas.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredQnas, currentPage])

  const categories = categoryKeys.filter(
    (c) => c === 'all' || qnas.some((q) => q.category === c)
  )

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col selection:bg-teal-500/30 overflow-hidden relative font-sans">
      <Header />

      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-400/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[140px] animate-pulse" />
      </div>

      <div className="pt-40 pb-24 container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-16"
          >
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 text-[11px] font-black uppercase tracking-[0.3em] mb-2">
                <HelpCircle className="w-4 h-4" /> {t('eyebrow')}
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white">
                {t('title')}
              </h1>
              <p className="text-white/40 text-lg font-bold max-w-3xl mx-auto leading-relaxed break-keep">
                {t('subtitle')}
              </p>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Link
                href="/guides/photo-to-3d-printing-quote"
                className="rounded-3xl border border-indigo-400/20 bg-indigo-500/[0.06] p-6 hover:bg-indigo-500/[0.1] transition-colors"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-300 mb-2">
                  Photo → 3D
                </p>
                <h2 className="text-xl font-black text-white mb-2">{t('cards.photo.title')}</h2>
                <p className="text-sm text-white/55 break-keep">{t('cards.photo.desc')}</p>
              </Link>
              <Link
                href="/guides/3d-printing-quote-guide"
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">
                  Guide
                </p>
                <h2 className="text-xl font-black text-white mb-2">{t('cards.quote.title')}</h2>
                <p className="text-sm text-white/55 break-keep">{t('cards.quote.desc')}</p>
              </Link>
              <Link
                href="/print-methods"
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">
                  Compare
                </p>
                <h2 className="text-xl font-black text-white mb-2">{t('cards.compare.title')}</h2>
                <p className="text-sm text-white/55 break-keep">{t('cards.compare.desc')}</p>
              </Link>
              <Link
                href="/guides/3d-printing-file-preparation"
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">
                  File
                </p>
                <h2 className="text-xl font-black text-white mb-2">{t('cards.file.title')}</h2>
                <p className="text-sm text-white/55 break-keep">{t('cards.file.desc')}</p>
              </Link>
              <Link
                href="/quote"
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">
                  Action
                </p>
                <h2 className="text-xl font-black text-white mb-2">{t('cards.action.title')}</h2>
                <p className="text-sm text-white/55 break-keep">{t('cards.action.desc')}</p>
              </Link>
            </section>

            <div className="flex justify-center">
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-black text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                {t('browseGuides')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-10">
              <div className="relative group max-w-2xl mx-auto w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-teal-400 transition-colors" />
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-20 pl-16 pr-8 bg-white/[0.03] border-white/10 rounded-[1.5rem] focus:ring-teal-400/20 focus:border-teal-400/50 text-xl font-bold transition-all placeholder:text-white/10 text-white backdrop-blur-3xl"
                />
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`h-12 px-8 rounded-2xl text-[13px] font-black transition-all border ${
                      selectedCategory === cat
                        ? 'bg-teal-400 border-teal-400 text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.3)] scale-105'
                        : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {t(`categories.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 min-h-[400px]">
              {currentItems.length > 0 ? (
                currentItems.map((q) => {
                  const isOpen = openId === q.id
                  return (
                    <motion.div
                      layout
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-3xl overflow-hidden transition-all duration-500 border backdrop-blur-3xl ${
                        isOpen
                          ? 'bg-white/[0.05] border-teal-400/30 shadow-2xl shadow-teal-400/5'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <button
                        onClick={() => setOpenId(isOpen ? null : q.id)}
                        className="w-full px-8 py-8 flex items-center justify-between text-left group"
                        aria-expanded={isOpen}
                      >
                        <div className="flex flex-col gap-2 mr-6">
                          <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">
                            {t(`categories.${q.category}` as 'categories.general')}
                          </span>
                          <span
                            className={`text-lg md:text-xl font-black leading-snug transition-colors ${
                              isOpen ? 'text-white' : 'text-white/80 group-hover:text-white'
                            }`}
                          >
                            {q.question}
                          </span>
                        </div>
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                            isOpen
                              ? 'bg-teal-400 text-slate-950 rotate-180 shadow-lg shadow-teal-400/20'
                              : 'bg-white/5 text-white/20 group-hover:text-teal-400 group-hover:bg-teal-400/10'
                          }`}
                        >
                          {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </div>
                      </button>
                      <div className={isOpen ? 'block' : 'hidden'} aria-hidden={!isOpen}>
                        <div className="px-8 pb-8 pt-4 border-t border-white/5">
                          <p className="text-white/40 font-bold leading-relaxed whitespace-pre-wrap text-base md:text-lg break-keep">
                            {q.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="text-center py-20 space-y-4">
                  <p className="text-white/20 text-lg font-bold">{t('empty')}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('all')
                    }}
                    className="border-white/10 text-white/60 hover:text-white rounded-full px-8"
                  >
                    {t('viewAll')}
                  </Button>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-12">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 text-white/20 disabled:opacity-20 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center active:scale-90"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-12 h-12 rounded-2xl text-[13px] font-black transition-all border ${
                        currentPage === i + 1
                          ? 'bg-teal-400 border-teal-400 text-slate-950 shadow-lg shadow-teal-400/10'
                          : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 text-white/20 disabled:opacity-20 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center active:scale-90"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}

            <div className="mt-24 p-12 md:p-16 rounded-[3rem] bg-gradient-to-br from-teal-400/5 via-transparent to-indigo-500/5 border border-white/10 backdrop-blur-3xl text-center space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <MessageSquare className="w-40 h-40 text-teal-400" />
              </div>
              <div className="w-20 h-20 rounded-[2rem] bg-teal-400/10 border border-teal-400/20 flex items-center justify-center mx-auto text-teal-400 shadow-2xl relative z-10">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div className="space-y-4 relative z-10">
                <h3 className="text-3xl font-black text-white tracking-tight">{t('ctaTitle')}</h3>
                <p className="text-white/40 font-bold text-lg">{t('ctaDesc')}</p>
              </div>
              <div className="relative z-10">
                <Link href="/contact" className="inline-block">
                  <Button
                    size="lg"
                    className="h-18 px-12 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 font-black tracking-widest uppercase transition-all active:scale-95 shadow-2xl shadow-white/5 text-lg"
                  >
                    {t('ctaContact')}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
