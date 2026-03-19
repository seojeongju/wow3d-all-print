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
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                            <HelpCircle className="w-3 h-3" /> FAQ
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase">자주 묻는 질문</h2>
                        <p className="text-white/40 text-sm md:text-base text-balance leading-relaxed">
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
                                className={`border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${
                                    openId === q.id ? 'bg-white/[0.05] border-white/30 shadow-2xl' : 'bg-white/[0.02] hover:bg-white/[0.04]'
                                }`}
                            >
                                <button
                                    onClick={() => setOpenId(openId === q.id ? null : q.id)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                                >
                                    <span className="text-base md:text-lg font-bold text-white/90 leading-snug">{q.question}</span>
                                    <div className={`p-1.5 rounded-lg transition-all ${openId === q.id ? 'bg-primary text-white rotate-180 shadow-lg shadow-primary/30' : 'bg-white/5 text-white/40'}`}>
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
                            <Button variant="ghost" className="group text-white/40 hover:text-primary transition-all gap-2">
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
