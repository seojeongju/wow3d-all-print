'use client'

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Zap,
  Clock,
  Shield,
  Sparkles,
  Boxes,
  Layers,
  ArrowRight,
  CheckCircle2,
  Upload,
  Settings,
  Package,
  Star
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <Header />

      {/* Hero Section - 현대적이고 임팩트 있는 디자인 */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-500/5" />
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI 기반 자동 견적 시스템</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                3D 프린팅,
              </span>
              <br />
              <span className="text-foreground">더 빠르고 쉽게</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              파일 업로드 한 번으로 FDM, SLA, DLP 모든 방식의 견적을 즉시 확인하세요.
              <br className="hidden md:block" />
              프로페셔널한 3D 프린팅 서비스를 경험하세요.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/quote">
                <Button size="lg" className="gap-2 px-8 py-6 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all">
                  <Zap className="w-5 h-5" />
                  무료 견적 받기
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 px-8 py-6 text-lg backdrop-blur-sm">
                <Package className="w-5 h-5" />
                포트폴리오 보기
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">10초</div>
                <div className="text-sm text-muted-foreground">견적 산출</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">3,000+</div>
                <div className="text-sm text-muted-foreground">누적 주문</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">99%</div>
                <div className="text-sm text-muted-foreground">고객 만족도</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-xs">스크롤하여 더 알아보기</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
            >
              <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section - 카드 기반 그리드 */}
      <section id="services" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
            >
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">핵심 기능</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              왜 <span className="text-primary">Wow3D</span>인가요?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              업계 최고 수준의 기술과 서비스로 여러분의 아이디어를 현실로 만듭니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: "실시간 견적",
                description: "AI 기반 알고리즘으로 10초 안에 정확한 견적을 제공합니다",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Clock,
                title: "빠른 제작",
                description: "최첨단 장비로 업계 최단 시간 내 출력을 완료합니다",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Shield,
                title: "품질 보증",
                description: "엄격한 품질 관리 시스템으로 완벽한 결과물을 보장합니다",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Boxes,
                title: "다양한 재료",
                description: "PLA, ABS, PETG, 레진 등 프로젝트에 맞는 재료 선택",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Layers,
                title: "3가지 출력 방식",
                description: "FDM, SLA, DLP - 용도에 최적화된 방식 제공",
                color: "from-red-500 to-rose-500"
              },
              {
                icon: Settings,
                title: "맞춤 설정",
                description: "Infill, Layer Height 등 세밀한 옵션 조정 가능",
                color: "from-indigo-500 to-violet-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity blur-xl"
                  style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                <div className="relative p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all backdrop-blur-sm h-full">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - 프로세스 섹션 */}
      <section id="process" className="py-24 bg-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              간단한 <span className="text-primary">3단계</span> 프로세스
            </h2>
            <p className="text-xl text-muted-foreground">
              복잡한 과정 없이 누구나 쉽게 3D 프린팅을 시작할 수 있습니다
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "파일 업로드",
                description: "STL 또는 OBJ 파일을 드래그 앤 드롭으로 업로드하세요",
                icon: Upload
              },
              {
                step: "02",
                title: "옵션 선택",
                description: "재료, 출력 방식, 품질 등 원하는 옵션을 선택하세요",
                icon: Settings
              },
              {
                step: "03",
                title: "주문 완료",
                description: "실시간 견적 확인 후 주문하면 제작을 시작합니다",
                icon: CheckCircle2
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="flex items-start gap-8 mb-12">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="text-6xl font-bold text-primary/10 mb-2">{step.step}</div>
                    <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
                {index < 2 && (
                  <div className="absolute left-10 top-20 w-0.5 h-12 bg-gradient-to-b from-primary/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              무료 견적으로 여러분의 프로젝트가 얼마나 빠르고 저렴하게 완성될 수 있는지 확인하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote">
                <Button size="lg" className="gap-2 px-8 py-6 text-lg shadow-lg shadow-primary/25">
                  <Zap className="w-5 h-5" />
                  무료 견적 받기
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="outline" className="gap-2 px-8 py-6 text-lg">
                  문의하기
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
