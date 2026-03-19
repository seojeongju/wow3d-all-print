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
    <main className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
        <Header />
      
      <div className="pt-32 pb-24 container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                <HelpCircle className="w-3 h-3" /> FAQ
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none uppercase">자주 묻는 질문</h1>
              <p className="text-white/40 text-sm md:text-base text-balance leading-relaxed">WOW3D 이용에 대해 궁금한 점을 확인해 보세요.</p>
            </div>

            {/* 필터 및 검색 영역 */}
            <div className="space-y-6">
                <div className="relative group max-w-2xl mx-auto w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                    <Input
                        type="text"
                        placeholder="궁금한 내용을 검색해 보세요"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-16 pl-14 pr-6 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary focus:border-primary text-lg font-medium transition-all placeholder:text-white/10"
                    />
                </div>

                {/* 카테고리 필터 */}
                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${
                                selectedCategory === cat 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
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
                    className={`border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${
                      openId === q.id ? 'bg-white/[0.05] border-white/30 shadow-2xl' : 'bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <button
                      onClick={() => setOpenId(openId === q.id ? null : q.id)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left"
                    >
                      <div className="flex flex-col gap-1.5 mr-4">
                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                          {CATEGORY_LABELS[q.category] || '일반'}
                        </span>
                        <span className="text-base md:text-lg font-bold text-white/90 leading-snug">{q.question}</span>
                      </div>
                      <div className={`p-2 rounded-xl transition-all ${openId === q.id ? 'bg-primary text-white rotate-180 shadow-lg shadow-primary/30' : 'bg-white/5 text-white/40'}`}>
                        {openId === q.id ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {openId === q.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="px-6 pb-6 pt-2 border-t border-white/5">
                            <p className="text-white/60 leading-relaxed whitespace-pre-wrap text-sm md:text-base break-keep">
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
                <div className="flex justify-center items-center gap-2 pt-8">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 disabled:opacity-30 hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border ${
                                    currentPage === i + 1
                                    ? 'bg-primary border-primary text-white'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 disabled:opacity-30 hover:bg-white/10 transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent border border-white/10 text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto text-primary">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">원하시는 답변을 찾지 못하셨나요?</h3>
                <p className="text-white/40 text-sm">궁금한 점을 남겨 주시면 상세히 안내해 드리겠습니다.</p>
              </div>
              <Link href="/contact" className="inline-block">
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black hover:bg-white/90 font-black tracking-widest uppercase transition-transform active:scale-95 shadow-xl shadow-white/5">
                  문의하기
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
