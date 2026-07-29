'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Upload, Settings, ShoppingCart, Truck } from 'lucide-react';
import { useRef } from 'react';

const steps = [
    {
        id: "01",
        title: "파일 업로드 & 분석",
        description: "STL·OBJ·3MF·PLY는 즉시 부피·표면적·치수가 분석되고, STEP·STP는 업로드 시 자동 변환 후 견적으로 이어집니다.",
        details: ["드래그 앤 드롭 또는 클릭 업로드", "메쉬 즉시 분석 · STEP/STP 자동 변환", "웹 3D 뷰어에서 미리보기"],
        icon: Upload,
        color: "bg-blue-500"
    },
    {
        id: "02",
        title: "견적 & 옵션 선택",
        description: "출력 방식(FDM·SLA·DLP), 소재, 내부 채움·레이어 두께 등을 선택하면 가격이 실시간 반영됩니다. 견적 저장·장바구니 추가 후 주문으로 진행합니다.",
        details: ["FDM / SLA / DLP 선택", "소재·infill·레이어 두께 설정", "예상 견적·소요 시간 확인"],
        icon: Settings,
        color: "bg-purple-500"
    },
    {
        id: "03",
        title: "주문 & 결제",
        description: "배송지·수령인·연락처를 입력하고 결제를 완료하면 주문이 접수됩니다. 주문 상태는 마이페이지에서 확인할 수 있습니다.",
        details: ["장바구니에서 주문 진행", "배송 정보·결제 수단 선택", "주문 번호·상태 추적"],
        icon: ShoppingCart,
        color: "bg-amber-500"
    },
    {
        id: "04",
        title: "제작 & 검수 & 배송",
        description: "주문 확정 후 제작·검수·발송을 진행하며, 일반적으로 평균 3~7일 내 수령 가능합니다. 공정·수량·후가공에 따라 달라질 수 있습니다.",
        details: ["프린팅·후가공·검수", "안전 포장 및 발송", "평균 3~7일 내 수령"],
        icon: Truck,
        color: "bg-green-500"
    }
];

export default function ProcessSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <section id="process" ref={containerRef} className="py-24 relative overflow-hidden">
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
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

                    {/* Sticky Left Side */}
                    <div className="lg:w-1/3 lg:h-[calc(100vh-100px)] lg:sticky lg:top-24 flex flex-col justify-center mb-12 lg:mb-0">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 word-keep-all text-white">
                            파일에서 <br />
                            <span className="text-teal-400">제품이 되기까지</span>
                        </h2>
                        <p className="text-xl text-white/85 mb-8 break-keep leading-relaxed italic font-medium">
                            <span className="text-white font-bold">FDM 출력</span>은 강도와 경제성에 적합하고, <span className="text-white font-bold">SLA 출력과 DLP 출력</span>은 고정밀 3D프린팅이 필요한 작업에 적합합니다.<br />
                            PLA, ABS, PETG, TPU, 나일론, 레진 등 다양한 소재 선택이 가능합니다.
                        </p>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden hidden lg:block">
                            <motion.div
                                style={{ scaleX: scrollYProgress }}
                                className="h-full bg-primary origin-left"
                            />
                        </div>
                    </div>

                    {/* Right Side Steps */}
                    <div className="lg:w-2/3 space-y-24 pb-24">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className="flex gap-8 group"
                            >
                                <div className="flex flex-col items-center">
                                    <div className={`w-16 h-16 rounded-2xl ${step.color} shadow-lg shadow-current/20 flex items-center justify-center text-white text-2xl font-bold mb-4 group-hover:scale-110 transition-transform`}>
                                        <step.icon className="w-8 h-8" />
                                    </div>
                                    {index !== steps.length - 1 && (
                                        <div className="w-0.5 h-full bg-gradient-to-b from-border to-transparent" />
                                    )}
                                </div>
                                <div className="pt-2">
                                    <span className="text-6xl font-black text-white/10 -ml-4 block mb-2">{step.id}</span>
                                    <h3 className="text-3xl font-bold mb-4 text-white">{step.title}</h3>
                                    <p className="text-xl text-white/85 leading-relaxed max-w-xl break-keep mb-4 font-medium">
                                        {step.description}
                                    </p>
                                    {step.details && step.details.length > 0 && (
                                        <ul className="space-y-2 text-sm text-white/75 font-medium">
                                            {step.details.map((d, j) => (
                                                <li key={j} className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500/60 shrink-0" />
                                                    {d}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
