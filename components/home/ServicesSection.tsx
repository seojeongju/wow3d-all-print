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

export default function ServicesSection() {
    return (
        <section id="services" className="py-24 relative overflow-hidden">
            {/* 연한 블랙 및 그라데이션 배경 (Hero와 동일) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            {/* 틸/블루 은은한 포인트 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

            {/* 그리드 배경 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* 배경 글로우 포인트들 */}
            <div className="absolute left-0 bottom-0 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[130px]" />
            <div className="absolute right-0 top-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 word-keep-all text-white">서비스 안내</h2>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto break-keep italic font-medium">
                        와우쓰리디는 <span className="text-white font-bold">3D프린팅출력, 3D프린터출력, 시제품제작, 3D프린팅출력대행, 3D프린터출력대행</span> 서비스를 제공하는 3D프린팅 전문 업체입니다.
                        FDM, SLA, DLP 공정과 다양한 소재를 기반으로 목적에 맞는 제작 솔루션을 제안합니다.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {services.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -4 }}
                            className={`group relative p-8 rounded-3xl border overflow-hidden hover:shadow-xl transition-all duration-300 ${s.className}`}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <s.icon className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <div
                                    className={`w-12 h-12 rounded-2xl bg-white/10 shadow-sm flex items-center justify-center mb-5 ${s.iconColor}`}
                                >
                                    <s.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 word-keep-all text-white">{s.title}</h3>
                                <p className="text-white/70 text-sm leading-relaxed mb-4 break-keep font-medium">
                                    {s.description}
                                </p>
                                {'methods' in s && s.methods ? (
                                    <div className="space-y-3">
                                        {(s.methods as { name: string; icon: React.ComponentType<{ className?: string }>; desc: string }[]).map(
                                            (m, j) => (
                                                <div key={j} className="flex items-start gap-2 text-sm">
                                                    <m.icon className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                                                    <div>
                                                        <span className="font-semibold text-white">{m.name}</span>
                                                        <span className="text-white/60"> — {m.desc}</span>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <ul className="space-y-1.5 text-sm text-white/60 font-medium">
                                        {(s.items || []).map((item, j) => (
                                            <li key={j} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500/60" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-12"
                >
                    <Link href="/quote">
                        <Button size="lg" className="rounded-full h-12 px-8">
                            3D 프린팅 견적 요청하기
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
