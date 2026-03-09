'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      <Header />

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
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">개인정보처리방침</h1>
              <p className="text-sm text-white/40 mt-0.5">(주)와우3D는 개인정보 보호법 및 정보통신망 이용촉진 및 정보보호 등에 관한 법률에 따라 이용자 개인정보를 보호합니다.</p>
            </div>
          </div>

          <p className="text-xs text-white/30 mb-10">
            시행일: 2025년 1월 1일 (법령·서비스 변경 시 수정될 수 있으며, 변경 시 사이트에 공지합니다.)
          </p>

          <div className="space-y-10">
            <section id="1">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제1조 (개인정보의 처리 목적)</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                (주)와우3D(이하 “회사”)는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li><strong className="text-white/90">회원 가입 및 관리</strong>: 회원 가입·계정 관리, 본인 확인, 부정 이용 방지, 서비스 부정 이용·거부 기록, 분쟁 조정을 위한 기록 보존, 민원 처리, 고지 사항 전달</li>
                <li><strong className="text-white/90">견적·주문·결제·배송</strong>: 3D 프린팅 견적 산출, 주문 접수·확인·이행, 결제·정산, 배송·배송지 관리, 제작·배송 관련 고지 및 통지</li>
                <li><strong className="text-white/90">비회원 주문</strong>: 비회원 견적·주문·결제·배송 처리, 주문·배송 관련 연락, 분쟁·환불·사후 관리</li>
                <li><strong className="text-white/90">고객 상담 및 문의</strong>: 문의 접수·회신, 상담 기록 보존, 서비스 개선을 위한 통계 활용(비식별화·익명화된 경우)</li>
                <li><strong className="text-white/90">마케팅·광고</strong>: 이벤트·프로모션·신규 서비스 안내(동의한 경우에 한함), 맞춤형 광고(선택)</li>
                <li><strong className="text-white/90">서비스 개선·보안</strong>: 서비스 이용 통계·분석, 보안·사기 방지, 시스템 오류·장애 대응, 법령상 의무 이행</li>
              </ul>
            </section>

            <section id="2">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제2조 (처리하는 개인정보의 항목)</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                회사는 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용할 수 있습니다.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-3 text-white/80 font-bold">구분</th>
                      <th className="text-left py-3 px-3 text-white/80 font-bold">수집·이용 항목</th>
                      <th className="text-left py-3 px-3 text-white/80 font-bold">수집 방법</th>
                      <th className="text-left py-3 px-3 text-white/80 font-bold">보유·이용 목적</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/70">
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-3">회원가입</td>
                      <td className="py-3 px-3">이름, 이메일, 비밀번호, 연락처(선택)</td>
                      <td className="py-3 px-3">회원가입 폼</td>
                      <td className="py-3 px-3">회원 식별·관리, 본인 확인</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-3">견적·주문</td>
                      <td className="py-3 px-3">이름, 연락처, 배송 주소, 우편번호, 이메일(비회원 시 필수)</td>
                      <td className="py-3 px-3">주문·결제·배송 입력</td>
                      <td className="py-3 px-3">주문 접수·제작·배송·연락</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-3">문의</td>
                      <td className="py-3 px-3">이름, 이메일, 연락처(선택), 문의 내용</td>
                      <td className="py-3 px-3">문의하기 폼</td>
                      <td className="py-3 px-3">문의 접수·회신</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-3">자동 수집</td>
                      <td className="py-3 px-3">IP 주소, 쿠키, 서비스 이용 기록, 기기 정보</td>
                      <td className="py-3 px-3">웹·앱 이용 시 자동</td>
                      <td className="py-3 px-3">보안·부정 이용 방지, 서비스 개선(통계)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mt-4">
                필수 항목 미제공 시 회원가입·주문·문의 등 해당 서비스를 이용할 수 없습니다. 선택 항목은 거부할 수 있으며, 거부 시 일부 편의 기능이 제한될 수 있습니다.
              </p>
            </section>

            <section id="3">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제3조 (개인정보의 처리 및 보유 기간)</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                회사는 법령에서 정한 기간 또는 이용 목적 달성 시까지 개인정보를 보유·이용하며, 기간 만료 또는 목적 달성 후에는 지체 없이 파기합니다. 다만, 관계 법령에 따라 보존할 의무가 있는 경우 해당 기간 동안 보관합니다.
              </p>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-disc list-inside">
                <li><strong className="text-white/90">회원 정보</strong>: 회원 탈퇴 시까지. 탈퇴 후에도 전자상거래 등에서의 소비자 보호에 관한 법률 등에 따라 거래·청구·분쟁 관련 기록은 5년, 계약·철회 기록 5년, 대금 결제·공급 기록 5년, 소비자 불만·분쟁 처리 기록 3년, 표시·광고 기록 6개월 보존할 수 있습니다.</li>
                <li><strong className="text-white/90">주문·결제·배송</strong>: 제작·배송 완료 후 위 법령에 따른 보존 기간까지.</li>
                <li><strong className="text-white/90">문의</strong>: 문의 처리 완료 후 3년(관련 법령·회사 정책에 따라 상이할 수 있음).</li>
                <li><strong className="text-white/90">로그·접속 기록</strong>: 통신비밀보호법에 따라 12개월.</li>
                <li><strong className="text-white/90">세금 관련</strong>: 국세기본법 등에 따라 5년.</li>
              </ul>
            </section>

            <section id="4">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제4조 (개인정보의 제3자 제공)</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                회사는 이용자의 개인정보를 제1조의 처리 목적 범위 내에서만 처리하며, 원칙적으로 이용자의 사전 동의 없이 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다. ① 법령에 의한 경우, ② 이용자 또는 그 법정대리인이 사전에 동의한 경우, ③ 이용자가 의사표시가 불가한 상태에서 법정대리인 동의를 얻기 어렵고 이용자 또는 제3자의 신체·생명·재산 이익을 위해 필요한 경우. 배송·결제·정산·고객 상담 등의 목적으로 제3자(배송업체, 결제 대행사, 클라우드·호스팅 서비스 등)에게 위탁 처리하는 경우, 위탁 받은 자의 업무 범위, 재위탁 제한, 관리·감독, 책임에 관한 사항을 계약 등으로 명확히 하고, 개인정보 처리방침 등에 안내합니다.
              </p>
            </section>

            <section id="5">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제5조 (개인정보의 파기)</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li><strong className="text-white/90">파기 시점</strong>: 보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 다만, 다른 법령에 따라 보존해야 하는 경우 해당 기간 동안 별도 보관 후 파기합니다.</li>
                <li><strong className="text-white/90">파기 방법</strong>: 전자적 파일은 복구·재생되지 않도록 안전하게 삭제하고, 종이에 출력된 개인정보는 분쇄하거나 소각합니다.</li>
              </ul>
            </section>

            <section id="6">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제6조 (정보주체의 권리·의무와 그 행사 방법)</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li>이용자는 회사에 대해 개인정보 보호법 제35조에 따른 개인정보의 열람, 제36조에 따른 정정·삭제, 제37조에 따른 처리 정지를 요구할 수 있습니다. 만 14세 미만 아동의 경우, 법정대리인이 그 아동의 개인정보에 대한 열람·정정·삭제·처리 정지를 요구할 수 있습니다.</li>
                <li>제1항에 따른 권리 행사는 회사에 서면, 전자우편, 모사전송(FAX) 등으로 하실 수 있으며, 회사는 이에 대해 지체 없이 조치합니다. 신청 시 회사가 정한 양식·절차(본인 확인 등)에 따를 수 있습니다.</li>
                <li>개인정보의 정정·삭제를 요청하신 경우, 다른 법령에 의해 보존되어야 하는 정보는 그 예외로 합니다. 처리 정지 요청에 대해서는 법령에서 정한 예외(예: 법적 의무 이행, 타인의 생명·신체 해침 우려 등)가 적용될 수 있습니다.</li>
                <li>이용자는 자신의 개인정보를 보호할 의무가 있으며, 이용자 본인의 부주의나 제3자에게 계정·비밀번호 등을 노출하여 발생한 문제에 대해 회사는 책임을 지지 않습니다.</li>
              </ul>
            </section>

            <section id="7">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제7조 (개인정보 보호책임자)</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                회사는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 이용자의 개인정보 관련 민원을 처리하기 위해 아래와 같이 개인정보 보호책임자 및 담당부서를 지정·운영합니다. 열람·정정·삭제·처리 정지·동의 철회 등 문의는 아래로 연락하시면 됩니다.
              </p>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-sm">
                <p><strong className="text-white/90">개인정보 보호책임자</strong></p>
                <p className="text-white/70">(주)와우3D | 대표</p>
                <p className="text-white/70">주소: 서울시 마포구 독막로 93 상수빌딩 4층</p>
                <p className="text-white/70">전화: 02-3144-3137, 054-464-3144</p>
                <p>
                  <a href="mailto:wow3d16@naver.com" className="text-primary hover:underline">wow3d16@naver.com</a>
                </p>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mt-4">
                이용자는 개인정보침해로 인한 구제를 위해 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터, 대검찰청 사이버수사과, 경찰청 사이버수사국 등에 분쟁 해결이나 상담·신고를 요청할 수 있습니다.
              </p>
            </section>

            <section id="8">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제8조 (개인정보의 안전성 확보 조치)</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                회사는 개인정보의 안전성 확보를 위해 개인정보 보호법 제29조 및 시행령 제30조에 따라 다음과 같은 조치를 취하고 있습니다.
              </p>
              <ul className="space-y-1 text-sm text-white/70 leading-relaxed list-disc list-inside">
                <li>개인정보에 대한 접근 제한(접근 권한 관리, 비밀번호 등 관리)</li>
                <li>개인정보의 암호화(비밀번호 등 중요 정보 암호화 저장·전송)</li>
                <li>해킹·비밀번호 유출 등에 대비한 보안 프로그램·시스템 점검</li>
                <li>개인정보를 다루는 직원의 최소화 및 교육</li>
                <li>개인정보 저장·처리 구역의 접근 통제 및 출입 기록</li>
                <li>기록물·저장매체 등 분실·도난·손상 방지</li>
              </ul>
            </section>

            <section id="9">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li>회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 쿠키(cookie)를 사용할 수 있습니다. 쿠키는 웹사이트가 이용자의 컴퓨터·기기로 전송하는 소량의 정보로, 브라우저에 저장되었다가 이후 방문 시 서버에서 읽어 이용됩니다.</li>
                <li>쿠키의 사용 목적: 로그인·세션 유지, 서비스 이용 편의(언어·설정 등), 이용 통계·서비스 개선, 보안·부정 이용 방지 등. 쿠키에 저장되는 정보는 회사가 정한 범위 내에서만 사용됩니다.</li>
                <li>이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 거부 시 로그인 유지, 일부 맞춤 기능 등이 제한될 수 있습니다. 설정 방법: [브라우저] → [설정/옵션] → [개인정보/쿠키]에서 “쿠키 차단” 또는 “모든 쿠키 삭제” 등 선택.</li>
              </ul>
            </section>

            <section id="10">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">제10조 (개인정보 처리방침의 변경)</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                이 개인정보 처리방침은 2025년 1월 1일부터 적용됩니다. 법령·정책 또는 서비스 변경으로 내용이 변경될 수 있으며, 변경 시 적용일자, 변경 내용을 명시하여 적용일 7일 전(이용자에게 불리한 변경은 30일 전)부터 홈페이지 등에 공지합니다. 변경된 방침은 공지한 적용일부터 효력이 발생합니다.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-xl border-white/15 hover:bg-white/10">
                홈으로
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                이용약관
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
