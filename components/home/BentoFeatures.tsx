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

export default function BentoFeatures() {
    return (
        <section id="features" className="py-24 relative overflow-hidden">
            {/* 연한 블랙 및 그라데이션 배경 (Hero와 동일) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            {/* 틸/블루 은은한 포인트 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

            {/* 그리드 배경 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* 배경 글로우 포인트들 */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[130px]" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 word-keep-all text-white">기능</h2>
                    <p className="text-white/85 text-lg max-w-2xl mx-auto break-keep font-medium">
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
                                <h3 className="text-xl font-bold mb-3 word-keep-all text-white">{feature.title}</h3>
                                <p className="text-white/85 leading-relaxed break-keep font-medium">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
