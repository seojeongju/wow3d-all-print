'use client';

import { motion } from 'framer-motion';
import {
    Package,
    Factory,
    Layers,
    Box,
    Paintbrush,
    Users,
    Droplets,
    Zap,
    Printer,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const services = [
    {
        icon: Package,
        title: '시제품 & 프로토타입',
        description: '아이디어 검증부터 디자인 리뷰까지. 단일·소량 시제품으로 제품화 전 검증과 투자 논의를 앞당깁니다.',
        items: ['디자인 검증', '기능 시험', '투자·발표용 샘플'],
        className: 'md:col-span-2 bg-gradient-to-br from-primary/10 to-indigo-500/5 border-primary/20',
        iconColor: 'text-primary',
    },
    {
        icon: Factory,
        title: '소량·대량 생산',
        description: '1개부터 수백 개까지. FDM·SLA·DLP를 조합해 리드타임과 단가를 최적화한 소량 양산을 지원합니다.',
        items: ['소량 로트', '반복 주문', '재고형 생산'],
        className: 'md:col-span-1 bg-white/5 border-white/10',
        iconColor: 'text-amber-400',
    },
    {
        icon: Layers,
        title: '출력 방식',
        description: 'FDM(강도·비용), SLA(표면·정밀), DLP(속도·세밀)를 목적에 맞게 선택할 수 있습니다.',
        iconColor: 'text-blue-400',
        className: 'md:col-span-1 bg-white/5 border-white/10',
        methods: [
            { name: 'FDM', icon: Printer, desc: '필라멘트 적층, 기능 시험·튼튼한 부품' },
            { name: 'SLA', icon: Droplets, desc: '레진 광조형, 매끄러운 표면·디테일' },
            { name: 'DLP', icon: Zap, desc: '광경화, 빠른 제작·정밀도' },
        ],
    },
    {
        icon: Box,
        title: '다양한 소재',
        description: 'PLA, ABS, PETG, TPU, 나일론, Standard·Tough·Clear·Flexible 레진 등 30종 이상. 용도별 최적 소재를 제안합니다.',
        items: ['PLA·ABS·PETG·TPU', '나일론·PC', 'Standard·Tough·Clear·Flexible 레진'],
        className: 'md:col-span-2 bg-gradient-to-br from-teal-500/10 to-teal-800/10 border-teal-500/20',
        iconColor: 'text-teal-400',
    },
    {
        icon: Paintbrush,
        title: '후가공 & 도장',
        description: '연마, 도색, 경화, 조립 등. 출력물을 그대로가 아닌 제품 수준으로 마감하는 옵션을 제공합니다.',
        items: ['연마·경화', '도장·도색', '조립·패키징'],
        className: 'md:col-span-1 bg-white/5 border-white/10',
        iconColor: 'text-pink-400',
    },
    {
        icon: Users,
        title: '맞춤 타깃',
        description: '산업용 시제품 제작, 스타트업 목업 제작, 졸업작품 3D프린팅, 개인 맞춤 제작까지. 예산과 용도에 따라 최적의 3D프린팅 제작 방식을 안내합니다.',
        items: ['산업·시제품 제작', '스타트업·목업 제작', '졸업작품 3D프린팅'],
        className: 'md:col-span-1 bg-white/5 border-white/10',
        iconColor: 'text-violet-400',
    },
];

    return (
        <section id="services" className="py-24 relative overflow-hidden bg-background cyber-grid transition-all duration-500">
            {/* Cyber Glow */}
            <div className="absolute left-[-5%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[130px] pointer-events-none" />

            <div className="container mx-auto px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Package className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black tracking-widest text-primary uppercase">Service Spectrum</span>
                    </div>
                    <h2 className="text-3xl md:text-6xl font-black mb-6 tracking-tighter text-foreground uppercase">제작 서비스 안내</h2>
                    <p className="text-foreground/60 text-lg max-w-2xl mx-auto break-keep font-bold">
                        와우쓰리디의 통합 제조 인프라는 <span className="text-primary underline decoration-primary/30 underline-offset-4">FDM, SLA, DLP</span> 등<br />
                        첨단 적층 제조 공정을 통해 정밀한 품질과 빠른 리드타임을 보장합니다.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {services.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -8 }}
                            className={`group relative p-8 glass-card border-primary/10 overflow-hidden transition-all duration-500 ${s.className}`}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <s.icon className="w-32 h-32 text-primary" />
                            </div>
                            <div className="relative z-10">
                                <div
                                    className={`w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 cyber-glow-mint`}
                                >
                                    <s.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black mb-4 tracking-tighter text-foreground uppercase">{s.title}</h3>
                                <p className="text-foreground/50 text-sm leading-relaxed mb-8 break-keep font-bold">
                                    {s.description}
                                </p>
                                
                                <div className="space-y-3">
                                    {(s.items || []).map((item, j) => (
                                        <div key={j} className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            <span className="text-[11px] font-black text-foreground/60 uppercase tracking-tight">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-20"
                >
                    <Link href="/quote">
                        <Button size="lg" className="h-16 px-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30 transition-all hover:scale-105">
                            <Zap className="w-5 h-5 fill-current mr-2" />
                            제작 견적 요청하기
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
