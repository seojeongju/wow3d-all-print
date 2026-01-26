'use client';

import { motion } from 'framer-motion';
import { Zap, Box, Ruler, Truck, ShieldCheck, FileBox, Layers } from 'lucide-react';

const features = [
    {
        title: "AI 실시간 견적",
        description: "STL·OBJ·3MF·PLY 업로드 시 부피·표면적을 자동 분석하고, 소재·옵션 선택에 따라 견적이 즉시 반영됩니다.",
        icon: Zap,
        className: "md:col-span-2 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-primary/20",
        iconColor: "text-primary"
    },
    {
        title: "3D 뷰어 & 치수 분석",
        description: "웹에서 3D 모델을 회전·확대하고, 치수·부피·표면적을 확인한 뒤 견적으로 이어질 수 있습니다.",
        icon: Box,
        className: "md:col-span-1 bg-card",
        iconColor: "text-blue-500"
    },
    {
        title: "다중 파일 포맷",
        description: "STL, OBJ, 3MF, PLY 형식을 지원. STEP/STP는 변환 후 업로드. 업로드 후 자동 지오메트리 분석으로 출력 가능 여부를 판별합니다.",
        icon: FileBox,
        className: "md:col-span-1 bg-card",
        iconColor: "text-green-500"
    },
    {
        title: "산업용 정밀도",
        description: "±0.05mm 수준의 공차 관리. 레이어 두께·내부 채움 옵션을 조절해 기능성 부품에 맞게 설정합니다.",
        icon: Ruler,
        className: "md:col-span-2 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20",
        iconColor: "text-orange-500"
    },
    {
        title: "30종+ 소재 & 출력 방식",
        description: "FDM(PLA·ABS·PETG·TPU), SLA·DLP 레진(Standard·Tough·Clear·Flexible) 등 소재·방식별 견적 선택.",
        icon: Layers,
        className: "md:col-span-1 bg-card",
        iconColor: "text-teal-500"
    },
    {
        title: "품질 검수 & 후가공",
        description: "검수·연마·도장·경화 등 후처리 옵션을 견적 단계에서 선택할 수 있습니다.",
        icon: ShieldCheck,
        className: "md:col-span-2 bg-card",
        iconColor: "text-pink-500"
    }
];

export default function BentoFeatures() {
    return (
        <section id="features" className="py-24 bg-secondary/30 relative">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 word-keep-all">기능</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto break-keep">
                        AI 견적, 3D 뷰어, 다중 포맷·소재·정밀도 설정부터 품질·후가공 옵션까지. 플랫폼이 제공하는 역량입니다.
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
