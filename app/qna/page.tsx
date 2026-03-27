'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Minus, Search, Loader2, MessageSquare, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface QnA {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: '전체',
  general: '일반',
  quote: '견적·제작',
  tech: '기술·파일',
  partnership: '파트너십',
  other: '기타',
}

const ITEMS_PER_PAGE = 6;

export default function QnAPage() {
  const [qnas, setQnas] = useState<QnA[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    const fetchQnas = async () => {
      try {
        const res = await fetch('/api/qna')
        const data = await res.json()
        if (data.success) {
          // display_order로 정렬 (없으면 id 역순)
          const sorted = data.data.sort((a: any, b: any) => {
            if (a.display_order !== b.display_order) return (a.display_order || 0) - (b.display_order || 0);
            return b.id - a.id;
          });
          setQnas(sorted)
        }
      } catch (e) {
        console.error('Failed to fetch QnA', e)
      } finally {
        setLoading(false)
      }
    }
    fetchQnas()
  }, [])

  // 검색어나 카테고리 변경 시 페이지 초기화
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

  // 페이지네이션 로직
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

        {/* Premium Background System */}
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
                        <p className="text-white/40 text-lg font-bold max-w-xl mx-auto leading-relaxed break-keep">Wow3D 플랫폼 이용에 대한 궁금증을 즉시 해결해 드립니다.</p>
                    </div>

                    {/* 필터 및 검색 영역 */}
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

                        {/* 카테고리 필터 */}
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

            {/* QnA 목록 */}
            <div className="space-y-4 min-h-[400px]">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
                </div>
              ) : currentItems.length > 0 ? (
                currentItems.map((q) => (
                                    <motion.div
                                        layout
                                        key={q.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`rounded-3xl overflow-hidden transition-all duration-500 border backdrop-blur-3xl ${
                                            openId === q.id 
                                            ? 'bg-white/[0.05] border-teal-400/30 shadow-2xl shadow-teal-400/5' 
                                            : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <button
                                            onClick={() => setOpenId(openId === q.id ? null : q.id)}
                                            className="w-full px-8 py-8 flex items-center justify-between text-left group"
                                        >
                                            <div className="flex flex-col gap-2 mr-6">
                                                <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">
                                                    {CATEGORY_LABELS[q.category] || '일반'}
                                                </span>
                                                <span className={`text-lg md:text-xl font-black leading-snug transition-colors ${openId === q.id ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                                                    {q.question}
                                                </span>
                                            </div>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${openId === q.id ? 'bg-teal-400 text-slate-950 rotate-180 shadow-lg shadow-teal-400/20' : 'bg-white/5 text-white/20 group-hover:text-teal-400 group-hover:bg-teal-400/10'}`}>
                                                {openId === q.id ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {openId === q.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                                >
                                                    <div className="px-8 pb-8 pt-4 border-t border-white/5">
                                                        <p className="text-white/40 font-bold leading-relaxed whitespace-pre-wrap text-base md:text-lg break-keep">
                                                            {q.answer}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                ))
              ) : (
                <div className="text-center py-20 space-y-4">
                  <p className="text-white/20 text-lg font-bold">검색 결과가 없습니다.</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="border-white/10 text-white/60 hover:text-white rounded-full px-8">전체 보기</Button>
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
                    {!loading && totalPages > 1 && (
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
