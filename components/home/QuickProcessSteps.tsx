'use client';

import { motion } from 'framer-motion';
import {
  FileSearch,
  UploadCloud,
  CheckCircle2,
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
    borderColor: "border-teal-500/30",
    /** 흰 아이콘 박스 위 대비 — 다크 모드에서 text-primary는 밝아져 묻힘 */
    stepIconClass: "text-teal-700 dark:text-teal-600",
    stepLabelClass: "text-teal-800 dark:text-teal-300",
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
    borderColor: "border-indigo-500/30",
    stepIconClass: "text-indigo-700 dark:text-indigo-500",
    stepLabelClass: "text-indigo-900 dark:text-indigo-300",
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
    borderColor: "border-purple-500/30",
    stepIconClass: "text-purple-700 dark:text-purple-400",
    stepLabelClass: "text-purple-900 dark:text-purple-300",
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 mb-20">
          {processPaths.map((path, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`relative overflow-hidden group p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border-2 ${path.borderColor} bg-gradient-to-br ${path.color} backdrop-blur-md transition-all hover:shadow-3xl hover:shadow-primary/20 lg:hover:-translate-y-2`}
            >
              <div className="mb-8 sm:mb-12">
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 break-keep tracking-tight text-foreground">{path.title}</h3>
                <p className="text-sm sm:text-base font-medium text-foreground/70 leading-relaxed">{path.description}</p>
              </div>

              <div className="space-y-6 sm:space-y-10 relative">
                {path.steps.map((step, sIdx) => (
                  <div key={sIdx} className="relative flex items-start gap-4 sm:gap-6 group/step">
                    <div className="relative z-10 w-12 h-12 sm:w-16 h-16 rounded-xl sm:rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center border border-black/10 shrink-0 transition-transform group-hover/step:scale-110">
                      <step.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${path.stepIconClass}`} />
                    </div>
                    <div className="pt-0.5 sm:pt-1">
                      <span className={`text-[10px] sm:text-xs font-black tracking-widest mb-1 block uppercase ${path.stepLabelClass}`}>{step.label}</span>
                      <p className="text-base sm:text-lg font-bold break-keep leading-tight text-foreground/90">{step.text}</p>
                    </div>
                    {/* 연결 선 (마지막 단계 제외) */}
                    {sIdx < path.steps.length - 1 && (
                      <div className="absolute left-6 sm:left-8 top-12 sm:top-16 w-0.5 h-6 sm:h-10 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
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
          className="max-w-5xl mx-auto p-8 rounded-3xl bg-primary/15 border-2 border-primary/20 flex flex-col md:flex-row items-center justify-center gap-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
              <CreditCard className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black tracking-tight">최종 단계: 결제 및 출력 진행</span>
          </div>
          <ArrowRight className="hidden md:block w-8 h-8 text-primary animate-pulse" />
          <p className="text-lg font-medium text-foreground/80 text-center md:text-left break-keep max-w-sm leading-snug">
            견적 확정 후 즉시 산업용 프린터로 정밀 제작이 시작됩니다.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
