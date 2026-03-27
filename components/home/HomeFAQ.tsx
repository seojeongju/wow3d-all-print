'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface QnA {
    id: number;
    question: string;
    answer: string;
    category: string;
}

export default function HomeFAQ() {
    const [qnas, setQnas] = useState<QnA[]>([])
    const [loading, setLoading] = useState(true)
    const [openId, setOpenId] = useState<number | null>(null)

    useEffect(() => {
        const fetchQnas = async () => {
            try {
                const res = await fetch('/api/qna')
                const data = await res.json()
                if (data.success) {
                    // 상위 6개만 노출
                    setQnas(data.data.slice(0, 6))
                }
            } catch (e) {
                console.error('Failed to fetch FAQ for home', e)
            } finally {
                setLoading(false)
            }
        }
        fetchQnas()
    }, [])

    if (loading && qnas.length === 0) return null;
    if (!loading && qnas.length === 0) return null;

    return (
        <section className="py-24 relative overflow-hidden">
            {/* 연한 블랙 및 그라데이션 배경 (Hero와 동일) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            {/* 틸/블루 은은한 포인트 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

            {/* 그리드 배경 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* 배경 글로우 포인트들 */}
            <div className="absolute left-0 top-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-[130px]" />
            <div className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[150px]" />
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[300px] h-[300px] rounded-full bg-purple-800/10 blur-[100px]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-3xl mx-auto space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest mb-2">
                            <HelpCircle className="w-3 h-3" /> FAQ
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase text-white">자주 묻는 질문</h2>
                        <p className="text-white/70 text-sm md:text-base text-balance leading-relaxed font-medium">
                            WOW3D 이용에 대해 가장 많이 궁금해하시는 내용을 정리했습니다.
                        </p>
                    </motion.div>

                    <div className="space-y-4">
                        {qnas.map((q, i) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                                    openId === q.id ? 'bg-white/10 border-teal-500/30 shadow-2xl shadow-black/40' : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                <button
                                    onClick={() => setOpenId(openId === q.id ? null : q.id)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                                >
                                    <span className="text-base md:text-lg font-bold text-white leading-snug">{q.question}</span>
                                    <div className={`p-1.5 rounded-lg transition-all ${openId === q.id ? 'bg-teal-500 text-white rotate-180 shadow-lg shadow-teal-500/30' : 'bg-white/10 text-white/40'}`}>
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
                                                <p className="text-white/80 leading-relaxed whitespace-pre-wrap text-sm md:text-base break-keep">
                                                    {q.answer}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="text-center pt-8"
                    >
                        <Link href="/qna">
                            <Button variant="ghost" className="group text-white/70 hover:text-teal-400 hover:bg-white/5 transition-all gap-2">
                                전체 FAQ 확인하기
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
            
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        </section>
    )
}
