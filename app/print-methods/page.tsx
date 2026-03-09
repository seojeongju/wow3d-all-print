'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Printer, Droplets, Zap, ArrowRight, Check, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const methods = [
    {
        id: 'fdm',
        name: 'FDM',
        fullName: 'Fused Deposition Modeling',
        nameKo: '용융 적층 조형',
        icon: Printer,
        color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
        iconColor: 'text-amber-500',
        principle: '필라멘트(고체)를 노즐에서 가열·용융한 뒤 베드 위에 층층이 쌓아 올리는 방식입니다. 가장 널리 쓰이는 3D 프린팅 기술입니다.',
        materials: ['PLA', 'ABS', 'PETG', 'TPU', '나일론', 'PC'],
        strengths: ['비용 대비 효율 우수', '강한 기계적 성능·내구성', '소재 선택지 다양', '기능 시험·조립 부품에 적합'],
        weaknesses: ['레이어 선(층선)이 보일 수 있음', '표면 정밀도는 SLA·DLP보다 낮음'],
        uses: ['시제품·프로토타입', '기능 시험·내구 테스트', '조립용 부품·툴링', '교육·취미 제작'],
    },
    {
        id: 'sla',
        name: 'SLA',
        fullName: 'Stereolithography',
        nameKo: '광조형 (스테레오리소그래피)',
        icon: Droplets,
        color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
        iconColor: 'text-blue-500',
        principle: '액상 광경화 레진 위를 UV 레이저가 스캔하며 선택적으로 경화시켜 한 층씩 쌓는 방식입니다. 표면이 매끄럽고 디테일이 뛰어납니다.',
        materials: ['Standard 레진', 'Tough 레진', 'Clear 레진', 'Flexible 레진'],
        strengths: ['매끄러운 표면·높은 디테일', '복잡한 형상·미세 구조 표현', '치과·보석·시각 모형에 최적'],
        weaknesses: ['레진 단가·후처리(세척·2차 경화) 필요', '내충격·내열은 소재에 따라 제한'],
        uses: ['디자인 검증·시각 프로토타입', '보석·치과·의료 모형', '마스터·실리콘 몰드 원형', '정밀 시제품'],
    },
    {
        id: 'dlp',
        name: 'DLP',
        fullName: 'Digital Light Processing',
        nameKo: '디지털 광조형',
        icon: Zap,
        color: 'from-purple-500/20 to-violet-500/10 border-purple-500/30',
        iconColor: 'text-purple-500',
        principle: '광원(프로젝터·UV 패널)으로 한 레이어 전체를 동시에 비춰 레진을 경화시킵니다. 레이어당 경화 시간이 짧아 SLA 대비 빠른 제작이 가능합니다.',
        materials: ['Standard·Tough·Clear·Flexible 레진 (SLA와 동일 계열)'],
        strengths: ['레이어당 경화 속도 빠름', '동일 부품 다량 제작에 유리', '정밀도·표면 품질 우수'],
        weaknesses: ['빌드 영역이 기기별로 제한', '레진 저장·관리 필요'],
        uses: ['치과·보석·소형 정밀 부품', '동일 부품 소량·다량 생산', '미세한 디테일이 중요한 모형'],
    },
];

export default function PrintMethodsPage() {
    return (
        <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            <Header />

            {/* Hero */}
            <section className="pt-32 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 word-keep-all">
                            3D 프린터 <span className="text-primary">출력방식</span>
                        </h1>
                        <p className="text-xl text-muted-foreground break-keep">
                            FDM, SLA, DLP 세 가지 방식의 원리·소재·특징을 비교하고, 목적에 맞는 출력 방식을 선택하세요.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Methods */}
            <section className="py-12 pb-24">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="space-y-16">
                        {methods.map((m, i) => (
                            <motion.article
                                key={m.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative p-8 md:p-12 rounded-3xl border bg-gradient-to-br ${m.color} overflow-hidden`}
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <m.icon className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        <div
                                            className={`w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center ${m.iconColor}`}
                                        >
                                            <m.icon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold">{m.name}</h2>
                                            <p className="text-sm text-muted-foreground">{m.fullName} · {m.nameKo}</p>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">원리</h3>
                                        <p className="text-foreground/90 leading-relaxed break-keep">{m.principle}</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">주요 소재</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {m.materials.map((mat) => (
                                                    <span
                                                        key={mat}
                                                        className="px-3 py-1.5 rounded-lg bg-background/60 text-sm font-medium"
                                                    >
                                                        {mat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">적합 용도</h3>
                                            <ul className="space-y-1.5 text-sm text-foreground/90">
                                                {m.uses.map((u) => (
                                                    <li key={u} className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                                        {u}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600/90 mb-3 flex items-center gap-2">
                                                <Check className="w-4 h-4" /> 장점
                                            </h3>
                                            <ul className="space-y-2 text-sm text-foreground/90">
                                                {m.strengths.map((s) => (
                                                    <li key={s} className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600/90 mb-3 flex items-center gap-2">
                                                <X className="w-4 h-4" /> 참고
                                            </h3>
                                            <ul className="space-y-2 text-sm text-foreground/90">
                                                {m.weaknesses.map((w) => (
                                                    <li key={w} className="flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-2 shrink-0" />
                                                        {w}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 border-t border-border">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-muted-foreground mb-6 break-keep">
                        출력 방식을 선택했다면, 파일을 업로드하고 견적을 받아보세요.
                    </p>
                    <Link href="/quote">
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full gap-2">
                            견적 받기 <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
