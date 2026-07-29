'use client'

import { motion } from 'framer-motion'
import { Upload, Calculator, CreditCard, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TURNAROUND_SHORT } from '@/lib/site-copy'

const steps = [
    {
        id: '01',
        title: '파일 업로드 · 자동견적',
        description:
            'STL·OBJ·3MF·PLY는 즉시 자동견적, STEP·STP는 업로드 시 자동 변환 후 견적을 제공합니다.',
        icon: Upload,
    },
    {
        id: '02',
        title: '가격 · 예상 제작기간 확인',
        description: `소재·출력 방식을 선택하면 가격이 실시간으로 반영됩니다. ${TURNAROUND_SHORT}`,
        icon: Calculator,
    },
    {
        id: '03',
        title: '주문 · 결제',
        description: '배송 정보를 입력하고 결제하면 주문이 접수됩니다. 이후 제작·검수·발송이 진행됩니다.',
        icon: CreditCard,
    },
]

export default function CoreJourneySection() {
    return (
        <section id="journey" className="py-20 md:py-28 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-16 max-w-2xl mx-auto"
                >
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400 mb-4">
                        3 Steps
                    </p>
                    <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4 break-keep">
                        업로드부터 주문까지
                    </h2>
                    <p className="text-white/70 text-base md:text-lg font-medium break-keep">
                        첫 방문자는 이 세 단계만 기억하시면 됩니다.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-8"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-teal-400/15 border border-teal-400/25 flex items-center justify-center text-teal-400">
                                    <step.icon className="w-6 h-6" />
                                </div>
                                <span className="text-3xl font-black text-white/15">{step.id}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 break-keep">{step.title}</h3>
                            <p className="text-sm text-white/65 leading-relaxed font-medium break-keep">
                                {step.description}
                            </p>
                            {i < steps.length - 1 && (
                                <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-400/40 z-10" />
                            )}
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mt-10"
                >
                    <Link href="/quote">
                        <Button
                            size="lg"
                            className="h-14 px-8 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black tracking-wide gap-2"
                        >
                            지금 자동견적 시작
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
