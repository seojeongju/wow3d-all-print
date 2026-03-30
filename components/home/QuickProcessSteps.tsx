'use client';

import { motion } from 'framer-motion';
import { 
  FileSearch, 
  UploadCloud, 
  CheckCircle2, 
  PenTool, 
  PhoneCall, 
  Mail, 
  Reply, 
  CreditCard,
  ArrowRight
} from 'lucide-react';

const processPaths = [
  {
    title: "1. 3D 모델링 파일 준비 시",
    description: "준비된 설계 파일로 즉시 견적 확인",
    steps: [
      {
        icon: FileSearch,
        label: "STEP 1",
        text: "3D 모델링 파일 준비 (STL/OBJ 등)"
      },
      {
        icon: UploadCloud,
        label: "STEP 2",
        text: "와우3D 자동 견적 프로그램 업로드"
      },
      {
        icon: CheckCircle2,
        label: "STEP 3",
        text: "견적 요청 및 확인"
      }
    ],
    color: "from-teal-500/20 to-emerald-500/20",
    borderColor: "border-teal-500/30"
  },
  {
    title: "2. 3D 모델링이 없는 경우",
    description: "전문 상담을 통한 설계 의뢰 서비스",
    steps: [
      {
        icon: PhoneCall,
        label: "STEP 1",
        text: "3D 모델링 설계 의뢰 (02-3144-3137)"
      },
      {
        icon: FileSearch,
        label: "STEP 2",
        text: "설계 완료 및 파일 수령"
      },
      {
        icon: UploadCloud,
        label: "STEP 3",
        text: "와우3D 자동 견적 프로그램 업로드"
      },
      {
        icon: CheckCircle2,
        label: "STEP 4",
        text: "견적 요청 및 확인"
      }
    ],
    color: "from-indigo-500/20 to-blue-500/20",
    borderColor: "border-indigo-500/30"
  },
  {
    title: "3. 직접 이메일 견적 요청",
    description: "대량 주문이나 특수 사양 상담",
    steps: [
      {
        icon: FileSearch,
        label: "STEP 1",
        text: "3D 모델링 파일 준비 (STL/OBJ 등)"
      },
      {
        icon: Mail,
        label: "STEP 2",
        text: "파일 이메일 전송 (wow3d16@naver.com)"
      },
      {
        icon: Reply,
        label: "STEP 3",
        text: "이메일 견적 회신 및 확인"
      }
    ],
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30"
  }
];

export default function QuickProcessSteps() {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* 배경 장식 */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative mx-auto px-4 z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              와우 3D <span className="text-primary italic">3D 프린팅 견적</span> 요청 프로세스
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto break-keep leading-relaxed">
              상황에 맞는 최적의 경로로 빠르게 견적을 받아보세요.<br className="hidden md:block" /> 
              전문 설계 서비스부터 자동 실시간 견적까지 지원합니다.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {processPaths.map((path, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`relative overflow-hidden group p-8 rounded-3xl border ${path.borderColor} bg-gradient-to-br ${path.color} backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-primary/10`}
            >
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2 break-keep">{path.title}</h3>
                <p className="text-sm text-foreground/60">{path.description}</p>
              </div>

              <div className="space-y-6 relative">
                {path.steps.map((step, sIdx) => (
                  <div key={sIdx} className="relative flex items-center gap-4 group/step">
                    <div className="relative z-10 w-12 h-12 rounded-xl bg-background/80 shadow-inner flex items-center justify-center border border-white/10 shrink-0">
                      <step.icon className="w-6 h-6 text-primary group-hover/step:scale-110 transition-transform" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-primary/40 tracking-wider mb-0.5 block">{step.label}</span>
                      <p className="text-sm font-semibold break-keep leading-snug">{step.text}</p>
                    </div>
                    {/* 연결 선 (마지막 단계 제외) */}
                    {sIdx < path.steps.length - 1 && (
                      <div className="absolute left-6 top-12 w-px h-6 bg-gradient-to-b from-primary/30 to-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 최종 단계 명시 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="max-w-4xl mx-auto p-6 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col md:flex-row items-center justify-center gap-6 shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">최종 단계: 결제 및 출력 진행</span>
          </div>
          <ArrowRight className="hidden md:block w-6 h-6 text-primary/50 animate-pulse" />
          <p className="text-sm text-foreground/70 text-center md:text-left">
            모든 견적 확정 후 즉시 산업용 프린터로 정밀 제작이 시작됩니다.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
