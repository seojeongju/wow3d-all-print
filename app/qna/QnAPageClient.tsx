'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Minus, Search, MessageSquare, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import type { QnAItem } from '@/lib/qna'

const CATEGORY_LABELS: Record<string, string> = {
  all: '전체',
  general: '일반',
  quote: '견적·제작',
  tech: '기술·파일',
  partnership: '파트너십',
  other: '기타',
}

const ITEMS_PER_PAGE = 8;

type QnAPageClientProps = {
  initialQnas: QnAItem[];
};

export default function QnAPageClient({ initialQnas }: QnAPageClientProps) {
  const [qnas] = useState<QnAItem[]>(initialQnas)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    setCurrentPage(1)
    setOpenId(null)
  }, [searchQuery, selectedCategory])

  const filteredQnas = useMemo(() => {
    return qnas.filter((q) => {
      const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           q.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [qnas, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredQnas.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQnas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQnas, currentPage]);

  const categories = Object.keys(CATEGORY_LABELS).filter(c => 
    c === 'all' || qnas.some(q => q.category === c)
  );

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
                            <HelpCircle className="w-4 h-4" /> FAQ System
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white">자주 묻는 질문</h1>
                        <p className="text-white/40 text-lg font-bold max-w-3xl mx-auto leading-relaxed break-keep">
                            사진(이미지) 파일을 3D 모델링으로 변환하는 방법부터 견적 계산, FDM·SLA 차이,
                            STL 업로드와 제작 기간까지 WOW3D 고객이 자주 묻는 질문을 정리했습니다.
                        </p>
                    </div>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Link href="/guides/photo-to-3d-printing-quote" className="rounded-3xl border border-indigo-400/20 bg-indigo-500/[0.06] p-6 hover:bg-indigo-500/[0.1] transition-colors">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-300 mb-2">Photo → 3D</p>
                            <h2 className="text-xl font-black text-white mb-2">사진·이미지 3D 변환</h2>
                            <p className="text-sm text-white/55 break-keep">JPG·PNG만 있어도 AI가 입체 3D 모델(STL)을 만들고 자동견적·출력까지 이어집니다.</p>
                        </Link>
                        <Link href="/guides/3d-printing-quote-guide" className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">Guide</p>
                            <h2 className="text-xl font-black text-white mb-2">3D 프린팅 견적 계산 방식</h2>
                            <p className="text-sm text-white/55 break-keep">레이어 높이, 인필, 소재, 후가공이 가격과 시간에 어떤 영향을 주는지 설명합니다.</p>
                        </Link>
                        <Link href="/print-methods" className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">Compare</p>
                            <h2 className="text-xl font-black text-white mb-2">FDM · SLA · DLP 비교</h2>
                            <p className="text-sm text-white/55 break-keep">어떤 출력 방식이 시제품, 정밀 모델, 기능성 부품에 맞는지 한 번에 비교할 수 있습니다.</p>
                        </Link>
                        <Link href="/guides/3d-printing-file-preparation" className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">File</p>
                            <h2 className="text-xl font-black text-white mb-2">파일 준비 가이드</h2>
                            <p className="text-sm text-white/55 break-keep">업로드 전 파일 형식, 단위, 벽 두께, 메쉬 오류를 어떻게 점검해야 하는지 안내합니다.</p>
                        </Link>
                        <Link href="/quote" className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">Action</p>
                            <h2 className="text-xl font-black text-white mb-2">실시간 자동견적 받기</h2>
                            <p className="text-sm text-white/55 break-keep">STL·OBJ 파일 또는 제품 사진(JPG/PNG)으로 실시간 출력 시간과 가격을 확인해 보세요.</p>
                        </Link>
                    </section>

                    <div className="flex justify-center">
                        <Link href="/guides" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-black text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors">
                            전체 가이드 모아보기 <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-10">
                        <div className="relative group max-w-2xl mx-auto w-full">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-teal-400 transition-colors" />
                            <Input
                                type="text"
                                placeholder="무엇이든 검색해 보세요"
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
                                    {CATEGORY_LABELS[cat]}
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
                                                    {CATEGORY_LABELS[q.category] || '일반'}
                                                </span>
                                                <span className={`text-lg md:text-xl font-black leading-snug transition-colors ${isOpen ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                                                    {q.question}
                                                </span>
                                            </div>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isOpen ? 'bg-teal-400 text-slate-950 rotate-180 shadow-lg shadow-teal-400/20' : 'bg-white/5 text-white/20 group-hover:text-teal-400 group-hover:bg-teal-400/10'}`}>
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
                  <p className="text-white/20 text-lg font-bold">검색 결과가 없습니다.</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="border-white/10 text-white/60 hover:text-white rounded-full px-8">전체 보기</Button>
                </div>
              )}
            </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 pt-12">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
                            <h3 className="text-3xl font-black text-white tracking-tight">원하시는 답변을 찾지 못하셨나요?</h3>
                            <p className="text-white/40 font-bold text-lg">전담 컨설턴트가 24시간 이내에 맞춤형 가이드를 제공해 드립니다.</p>
                        </div>
                        <div className="relative z-10">
                            <Link href="/contact" className="inline-block">
                                <Button size="lg" className="h-18 px-12 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 font-black tracking-widest uppercase transition-all active:scale-95 shadow-2xl shadow-white/5 text-lg">
                                    1:1 문의하기
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
