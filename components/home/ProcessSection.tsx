'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Upload, Settings, ShoppingCart, Truck } from 'lucide-react';
import { useRef } from 'react';

const steps = [
    {
        id: "01",
        title: "파일 업로드 & 분석",
        description: "STL·OBJ 파일을 드래그 앤 드롭하면 즉시 부피·표면적·치수가 분석됩니다. 3D 뷰어에서 확인한 뒤 견적 단계로 이어집니다.",
        details: ["드래그 앤 드롭 또는 클릭 업로드", "자동 지오메트리 분석", "웹 3D 뷰어에서 미리보기"],
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
        description: "주문 확정 후 산업용 프린터로 제작이 시작됩니다. 검수·후처리 후 포장하여 발송하며, 평균 3~7일 내 수령 가능합니다.",
        details: ["프린팅·후가공·검수", "안전 포장 및 발송", "배송 추적"],
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
        <section id="process" ref={containerRef} className="py-24 bg-background relative">
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
                                    <p className="text-xl text-muted-foreground/90 leading-relaxed max-w-xl break-keep mb-4">
                                        {step.description}
                                    </p>
                                    {step.details && step.details.length > 0 && (
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {step.details.map((d, j) => (
                                                <li key={j} className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
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
