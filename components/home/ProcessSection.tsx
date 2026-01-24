'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Upload, Settings, CheckCircle } from 'lucide-react';
import { useRef } from 'react';

const steps = [
    {
        id: "01",
        title: "파일 업로드",
        description: "STL 또는 OBJ 파일을 드래그 앤 드롭하세요. WOWD의 클라우드 엔진이 모델을 즉시 분석합니다.",
        icon: Upload,
        color: "bg-blue-500"
    },
    {
        id: "02",
        title: "실시간 견적 확인",
        description: "재료, 색상, 내부 채움(Infill) 등을 선택하면 가격이 실시간으로 업데이트됩니다. 복잡한 견적 요청 절차가 사라집니다.",
        icon: Settings,
        color: "bg-purple-500"
    },
    {
        id: "03",
        title: "제작 및 배송",
        description: "주문 즉시 산업용 프린터가 가동됩니다. 전문 검수 후 안전하게 포장하여 고객님께 발송해 드립니다.",
        icon: CheckCircle,
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
        <section ref={containerRef} className="py-24 bg-background relative">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

                    {/* Sticky Left Side */}
                    <div className="lg:w-1/3 lg:h-[calc(100vh-100px)] lg:sticky lg:top-24 flex flex-col justify-center mb-12 lg:mb-0">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 word-keep-all">
                            파일에서 <br />
                            <span className="text-primary">제품이 되기까지</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 break-keep">
                            복잡한 과정은 저희가 해결했습니다. <br className="hidden lg:block" />
                            단 3단계로 아이디어를 실현하세요.
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
                                    <span className="text-6xl font-black text-muted/30 -ml-4 block mb-2">{step.id}</span>
                                    <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                                    <p className="text-xl text-muted-foreground/90 leading-relaxed max-w-xl break-keep">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
