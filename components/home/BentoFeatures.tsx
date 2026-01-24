'use client';

import { motion } from 'framer-motion';
import { Zap, Box, Ruler, Truck, ShieldCheck, Palette } from 'lucide-react';

const features = [
    {
        title: "AI 실시간 견적",
        description: "STL/OBJ 파일을 업로드하면 10초 만에 정확한 견적을 확인하실 수 있습니다.",
        icon: Zap,
        className: "md:col-span-2 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-primary/20",
        iconColor: "text-primary"
    },
    {
        title: "30종 이상의 소재",
        description: "PLA, ABS, PLA, 레진, 나일론 등 다양한 산업용 소재 보유.",
        icon: Box,
        className: "md:col-span-1 bg-card",
        iconColor: "text-blue-500"
    },
    {
        title: "산업용 정밀도",
        description: "기능성 부품을 위한 ±0.05mm 수준의 초정밀 공차 관리.",
        icon: Ruler,
        className: "md:col-span-1 bg-card",
        iconColor: "text-green-500"
    },
    {
        title: "초고속 배송 시스템",
        description: "긴급 주문 건은 최단 24시간 이내 제작 및 발송 처리됩니다.",
        icon: Truck,
        className: "md:col-span-2 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20",
        iconColor: "text-orange-500"
    },
    {
        title: "철저한 품질 관리",
        description: "전문 엔지니어가 모든 출력물을 직접 검수하고 후가공합니다.",
        icon: ShieldCheck,
        className: "md:col-span-1 bg-card",
        iconColor: "text-teal-500"
    },
    {
        title: "풀 컬러 프린팅",
        description: "생생한 컬러 출력 및 전문 도색 서비스 지원.",
        icon: Palette,
        className: "md:col-span-2 bg-card",
        iconColor: "text-pink-500"
    }
];

export default function BentoFeatures() {
    return (
        <section className="py-24 bg-secondary/30 relative">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 word-keep-all">왜 WOW3D를 선택해야 할까요?</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto break-keep">
                        최첨단 3D 프린팅 기술과 15년간 축적된 기술력으로 여러분의 아이디어를 완벽하게 구현합니다.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`group relative p-8 rounded-3xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 ${feature.className}`}
                        >
                            <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
                                <feature.icon className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-2xl bg-background shadow-sm flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform ${feature.iconColor}`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 word-keep-all">{feature.title}</h3>
                                <p className="text-muted-foreground/90 leading-relaxed break-keep">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
