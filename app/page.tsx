import Header from "@/components/layout/Header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Clock,
  Shield,
  TrendingUp,
  Printer,
  Box,
  Layers,
  ArrowRight,
  CheckCircle2,
  Award
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              지금 실시간으로 견적을 받아보세요
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              고민은 제작 시간만
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                늦출 뿐입니다
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              3D 모델 파일을 업로드하면 <span className="text-foreground font-semibold">10초 안에</span> FDM, SLA, DLP 방식별 견적이 자동으로 산출됩니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/quote">
                <Button size="lg" className="h-14 px-8 text-base gap-2 shadow-xl shadow-primary/25">
                  <Zap className="w-5 h-5" />
                  무료 견적 받기
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base gap-2">
                <Award className="w-5 h-5" />
                서비스 둘러보기
              </Button>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-3 gap-4 pt-12 max-w-2xl mx-auto">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="text-2xl md:text-3xl font-bold text-primary">1,200+</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">완료 프로젝트</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="text-2xl md:text-3xl font-bold text-primary">99.5%</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">납기 준수율</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="text-2xl md:text-3xl font-bold text-primary">10초</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">견적 산출 시간</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              OUR <span className="text-primary">SERVICES</span>
            </h2>
            <p className="text-muted-foreground">
              우리 메이커스는 기획부터 양산까지, 제조를 성공시킵니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Printer className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">FDM 3D 프린팅</h3>
              <p className="text-muted-foreground text-sm">
                PLA, ABS, PETG, TPU 등 다양한 소재로 경제적인 시제품 제작
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">SLA / DLP 출력</h3>
              <p className="text-muted-foreground text-sm">
                초정밀 레진 출력으로 표면이 매끄러운 고품질 모델 제작
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Box className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">후가공 서비스</h3>
              <p className="text-muted-foreground text-sm">
                도색, 연마, UV 경화 등 전문 마감 처리로 완벽한 제품 구현
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              왜 <span className="text-primary">Wow3D</span>인가요?
            </h2>
            <p className="text-muted-foreground">
              실시간 자동 견적 시스템으로 빠르고 정확한 서비스를 제공합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">초고속 견적</h3>
              <p className="text-sm text-muted-foreground">
                파일 업로드 후 10초 이내 자동 견적 산출
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">정확한 분석</h3>
              <p className="text-sm text-muted-foreground">
                AI 기반 지오메트리 분석으로 정밀한 비용 계산
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">신속 납품</h3>
              <p className="text-sm text-muted-foreground">
                24시간 이내 제작 시작, 평균 3일 이내 완료
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">B2B 양산</h3>
              <p className="text-sm text-muted-foreground">
                소량부터 대량까지, 기업 고객 전담 관리
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              3D 모델 파일만 있다면 누구나 쉽게 견적을 받고 주문할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote">
                <Button size="lg" className="h-14 px-8 text-base gap-2 shadow-xl shadow-primary/25">
                  <Zap className="w-5 h-5" />
                  무료로 견적 받기
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="pt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                회원가입 불필요
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                파일 자동 분석
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                실시간 가격 확인
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-border/40 py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="font-bold text-primary-foreground">W</span>
                </div>
                <span className="font-bold text-lg">Wow3D</span>
              </div>
              <p className="text-sm text-muted-foreground">
                3D 프린팅 자동 견적 플랫폼
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">서비스</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">FDM 출력</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">SLA 출력</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">DLP 출력</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">고객지원</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">자주 묻는 질문</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">이용 가이드</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">문의하기</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">연락처</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>이메일: contact@wow3d.com</li>
                <li>전화: 02-1234-5678</li>
                <li>카카오톡: @wow3d</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© 2026 Wow3D. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
