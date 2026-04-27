'use client';

import { motion } from 'framer-motion';
import { Zap, Box, Ruler, Truck, ShieldCheck, FileBox, Layers } from 'lucide-react';

const features = [
    {
        title: "AI 실시간 견적",
        description: "STL·OBJ·3MF·PLY 업로드 시 부피·표면적을 자동 분석하고, 소재·옵션 선택에 따라 견적이 즉시 반영됩니다.",
        icon: Zap,
        className: "md:col-span-2 bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border-teal-500/20",
        iconColor: "text-teal-400"
    },
    {
        title: "3D 뷰어 & 치수 분석",
        description: "웹에서 3D 모델을 회전·확대하고, 치수·부피·표면적을 확인한 뒤 견적으로 이어질 수 있습니다.",
        icon: Box,
        className: "md:col-span-1 bg-white/5 border-white/10",
        iconColor: "text-blue-400"
    },
    {
        title: "다중 파일 포맷",
        description: "STL, OBJ, 3MF, PLY 형식을 지원. STEP/STP는 변환 후 업로드. 업로드 후 자동 지오메트리 분석으로 출력 가능 여부를 판별합니다.",
        icon: FileBox,
        className: "md:col-span-1 bg-white/5 border-white/10",
        iconColor: "text-emerald-400"
    },
    {
        title: "산업용 정밀도",
        description: "±0.05mm 수준의 공차 관리. 레이어 두께·내부 채움 옵션을 조절해 기능성 부품에 맞게 설정합니다.",
        icon: Ruler,
        className: "md:col-span-2 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20",
        iconColor: "text-orange-400"
    },
    {
        title: "30종+ 소재 & 출력 방식",
        description: "FDM(PLA·ABS·PETG·TPU), SLA·DLP 레진(Standard·Tough·Clear·Flexible) 등 소재·방식별 견적 선택.",
        icon: Layers,
        className: "md:col-span-1 bg-white/5 border-white/10",
        iconColor: "text-teal-400"
    },
    {
        title: "품질 검수 & 후가공",
        description: "검수·연마·도장·경화 등 후처리 옵션을 견적 단계에서 선택할 수 있습니다.",
        icon: ShieldCheck,
        className: "md:col-span-2 bg-white/5 border-white/10",
        iconColor: "text-pink-400"
    }
];

    return (
        <section id="features" className="py-24 relative overflow-hidden bg-background cyber-grid transition-all duration-500">
            {/* Cyber Glow Points */}
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[130px] pointer-events-none" />

            <div className="container mx-auto px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black tracking-widest text-primary uppercase">Core Technology</span>
                    </div>
                    <h2 className="text-3xl md:text-6xl font-black mb-6 tracking-tighter text-foreground uppercase">차별화된 기술력</h2>
                    <p className="text-foreground/60 text-lg max-w-2xl mx-auto break-keep font-bold">
                        AI 실시간 분석 엔진과 클라우드 기반 3D 뷰어를 통해<br />
                        누구나 전문가 수준의 견적과 설계를 경험할 수 있습니다.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -8 }}
                            className={`group relative p-8 glass-card border-primary/10 overflow-hidden transition-all duration-500 ${feature.className}`}
                        >
                            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500`}>
                                <feature.icon className="w-32 h-32 text-primary" />
                            </div>

                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 cyber-glow-mint`}>
                                    <feature.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black mb-4 tracking-tighter text-foreground uppercase">{feature.title}</h3>
                                <p className="text-foreground/50 text-sm leading-relaxed break-keep font-bold">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
