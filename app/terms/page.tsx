'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      <Header />

      {/* Top bar */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl pt-20">
        <div className="container mx-auto px-6 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl px-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              홈
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">이용약관</h1>
              <p className="text-sm text-white/40 mt-0.5">WOW3D PRO 서비스 이용에 관한 약관입니다.</p>
            </div>
          </div>

          <p className="text-xs text-white/30 mb-10">
            시행일: 2025년 1월 1일 (회사 사정에 따라 변경될 수 있으며, 변경 시 사이트에 공지합니다.)
          </p>

          <div className="space-y-10">
            <section id="1">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제1조 (목적)</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                이 약관은 (주)와우3D(이하 “회사”)가 운영하는 WOW3D PRO(이하 “서비스”)의 이용과 관련하여 회사와 이용자(회원 및 비회원) 간의 권리·의무 및 책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section id="2">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제2조 (용어의 정의)</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-disc list-inside">
                <li><strong className="text-white/90">서비스</strong>: 회사가 제공하는 3D 프린팅 견적·주문·제작·배송 및 관련 정보 서비스를 말합니다.</li>
                <li><strong className="text-white/90">이용자</strong>: 회원·비회원을 불문하고 서비스에 접속하거나 이용하는 자입니다.</li>
                <li><strong className="text-white/90">회원</strong>: 회사에 회원가입하여 회사가 정한 절차에 따라 이용자 계정을 부여받은 자입니다.</li>
                <li><strong className="text-white/90">비회원</strong>: 회원가입 없이 견적·주문 등 서비스를 이용하는 자입니다.</li>
                <li><strong className="text-white/90">견적</strong>: 이용자가 업로드한 3D 모델(STL, OBJ, 3MF, PLY 등)을 기반으로 회사가 산정한 제작 비용·소요 시간 등의 예측 정보입니다.</li>
                <li><strong className="text-white/90">주문</strong>: 이용자가 견적을 확인한 후 최종 제작·배송을 요청하고, 회사가 수락한 계약을 말합니다.</li>
              </ul>
            </section>

            <section id="3">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제3조 (약관의 효력 및 변경)</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
                <li>회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경 내용을 명시하여 적용일 7일 전부터 공지합니다. 다만, 이용자에게 불리한 내용으로 변경하는 경우에는 30일 전에 공지합니다.</li>
                <li>이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다. 변경 약관 공지 후에도 이용을 계속한 경우 변경 약관에 동의한 것으로 봅니다.</li>
              </ul>
            </section>

            <section id="4">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제4조 (서비스의 제공)</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                회사는 다음과 같은 서비스를 제공합니다.
              </p>
              <ul className="space-y-1 text-sm text-white/70 leading-relaxed list-disc list-inside">
                <li>3D 모델 업로드 및 분석, AI 기반 실시간 견적 산출</li>
                <li>출력 방식(FDM, SLA, DLP) 및 소재별 견적·주문</li>
                <li>주문 접수, 제작, 배송 및 관련 고객 지원</li>
                <li>기타 회사가 정하는 부가 서비스</li>
              </ul>
              <p className="text-sm text-white/70 leading-relaxed mt-4">
                견적은 참고용이며, 실제 제작 전 검토·확정 과정을 거칠 수 있습니다. 회사는 천재지변, 설비·시스템 장애 등 불가피한 사유로 서비스 제공을 일시 중단할 수 있으며, 이 경우 사전 또는 사후에 홈페이지 등으로 공지합니다.
              </p>
            </section>

            <section id="5">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제5조 (회원가입 및 회원)</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li>이용자는 회사가 정한 가입 양식에 따라 회원가입을 신청하고, 회사가 승인함으로써 회원이 됩니다.</li>
                <li>회사는 다음 각 호에 해당하는 경우 가입을 거부하거나 추후 해지할 수 있습니다: 타인의 정보 도용, 허위 정보 기재, 법령·약관 위반, 기타 회사의 정책에 위배되는 행위.</li>
                <li>회원은 개인정보의 부정확한 기재를 수정할 의무가 있으며, 미수정으로 인한 불이익은 회원이 부담합니다.</li>
              </ul>
            </section>

            <section id="6">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제6조 (서비스 이용: 견적·주문·결제·배송)</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li><strong className="text-white/90">견적</strong>: 이용자가 업로드한 3D 파일을 기반으로 회사가 산출한 견적은 예상 비용·소요 시간에 대한 참고 정보이며, 최종 비용·일정은 주문 확정 후 회사가 별도 안내할 수 있습니다.</li>
                <li><strong className="text-white/90">주문</strong>: 견적 확인 후 주문을 신청한 경우, 회사가 제작 가능 여부·최종 금액·일정을 검토한 뒤 주문을 수락합니다. 수락 전에는 계약이 성립하지 않습니다.</li>
                <li><strong className="text-white/90">결제</strong>: 회사가 안내한 방법(계좌이체, 카드 등)으로 결제하여야 하며, 결제 완료 시점에 주문이 확정됩니다. 비회원 주문 시 회사가 요구하는 연락처·배송 정보를 정확히 제공하여야 합니다.</li>
                <li><strong className="text-white/90">배송</strong>: 제작 완료 후 이용자가 입력한 배송지로 발송하며, 배송비·기간은 주문 시점에 별도 안내됩니다. 이용자의 연락 두절·오입력으로 인한 지연·분실 등은 이용자 책임일 수 있습니다.</li>
                <li><strong className="text-white/90">취소·환불</strong>: 제작 착수 전 주문 취소 시, 회사 정책에 따라 전액 또는 일부 환불될 수 있습니다. 제작 착수 후에는 제작 진행 정도에 따라 환불이 제한될 수 있으며, 자세한 내용은 주문 시 또는 고객센터를 통해 안내받을 수 있습니다.</li>
              </ul>
            </section>

            <section id="7">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제7조 (저작권 및 지적재산)</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li>서비스 내에 게시된 콘텐츠·로고·디자인 등 회사가 창작·소유한 자료에 대한 저작권 및 기타 지적재산권은 회사에 귀속됩니다.</li>
                <li>이용자가 업로드한 3D 파일·디자인에 대한 권리는 이용자에게 있으며, 이용자는 회사에 제작·배송 등 서비스 제공에 필요한 사용 허락을 부여한 것으로 봅니다. 회사는 서비스 목적 범위를 넘어 이용자의 파일을 사용·공개·이전하지 않습니다.</li>
                <li>이용자가 타인의 권리를 침해하는 파일을 업로드하여 회사 또는 제3자에게 손해가 발생한 경우, 해당 이용자가 배상 등 책임을 집니다.</li>
              </ul>
            </section>

            <section id="8">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제8조 (개인정보)</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                회사는 이용자의 개인정보를 개인정보처리방침에 따라 수집·이용·파기하며, 이용 목적 외로 사용하거나 제3자에게 제공하지 않습니다. 자세한 내용은{' '}
                <Link href="/privacy" className="text-primary hover:underline">개인정보처리방침</Link>을 참고해 주세요.
              </p>
            </section>

            <section id="9">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제9조 (면책)</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li>회사는 천재지변, 전쟁, 서비스 설비·통신 장애, 제3자의 불법 행위 등 회사의 귀책이 없는 사유로 서비스 제공에 장애가 발생한 경우 이로 인한 손해에 대해 책임지지 않습니다.</li>
                <li>회사는 이용자가 업로드한 3D 파일의 정확성·적법성·상업적 이용 가능성에 대해 보증하지 않으며, 이와 관련한 분쟁은 이용자 간 또는 이용자와 제3자 간에 해결하여야 합니다.</li>
                <li>견적·제작 결과가 이용자의 기대와 다를 수 있으며, 회사는 견적의 정확성을 최선을 다하여 보장하나, 이를 법적 보증으로 간주하지 않습니다.</li>
              </ul>
            </section>

            <section id="10">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제10조 (서비스 이용 제한)</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                회사는 이용자가 다음 각 호에 해당하는 경우, 사전 통지 없이 서비스 이용을 제한·중단하거나 회원 자격을 박탈할 수 있습니다.
              </p>
              <ul className="space-y-1 text-sm text-white/70 leading-relaxed list-disc list-inside">
                <li>타인 정보 도용, 허위 정보 기재, 약관·법령 위반</li>
                <li>회사·다른 이용자·제3자에 대한 허위 발송·비방·명예훼손·저작권 침해 등 부정행위</li>
                <li>서비스 운영·시스템을 방해하거나 불법 목적으로 이용하는 행위</li>
                <li>기타 회사의 정당한 서비스 운영을 해치는 행위</li>
              </ul>
            </section>

            <section id="11">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제11조 (준거법 및 관할)</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                이 약관의 해석 및 회사와 이용자 간 분쟁에 대하여는 대한민국 법률을 적용합니다. 서비스 이용으로 인한 소송은 회사의 본사 소재지를 관할하는 법원을 전속 관할로 합니다.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-xl border-white/15 hover:bg-white/10">
                홈으로
              </Button>
            </Link>
            <Link href="/privacy">
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                개인정보처리방침
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                문의하기
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
