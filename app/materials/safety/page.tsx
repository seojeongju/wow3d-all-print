'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Shield, Droplets, Printer } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'

export default function MaterialSafetyPage() {
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
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">소재 안전 정보</h1>
              <p className="text-sm text-white/40 mt-0.5">WOW3D PRO에서 사용하는 FDM 필라멘트 및 UV 레진의 취급·보관·폐기 시 안전 수칙입니다.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mb-10">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-100/90">
              <strong className="text-amber-200">참고:</strong> 제조사·제형별로 성분·위험도가 다를 수 있습니다. 정확한 물질안전보건자료(MSDS)는 해당 소재 제조사 또는 공급처에 문의하세요. 본 안내는 일반적인 3D 프린팅 소재 취급 기준을 바탕으로 작성되었습니다.
            </div>
          </div>

          <div className="space-y-10">
            <section id="1">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">1. 개요</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-disc list-inside">
                <li><strong className="text-white/90">목적</strong>: FDM(열용융 적층) 방식의 필라멘트(PLA, ABS, PETG, TPU) 및 광조형(SLA·DLP) 방식의 UV 경화 레진을 취급·보관·폐기할 때 발생할 수 있는 위험을 줄이고, 안전한 작업 환경을 유지하기 위한 최소 수칙을 안내합니다.</li>
                <li><strong className="text-white/90">적용 범위</strong>: (주)와우3D가 WOW3D PRO 서비스를 통해 제작에 사용하는 소재를 기준으로 하며, 제조사·배치에 따라 성분이 다를 수 있으므로 구매·사용 시 제조사 MSDS를 확인하는 것을 권장합니다.</li>
              </ul>
            </section>

            <section id="2">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" /> 2. FDM 소재 공통 안전 수칙
              </h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li><strong className="text-white/90">고온 노즐·히트베드</strong>: 용융 온도(대체로 180~260℃)로 인해 노즐·베드에 접촉 시 화상 위험이 있습니다. 인쇄 중·인쇄 직후에는 부품에 손을 대지 마세요.</li>
                <li><strong className="text-white/90">환기</strong>: 용융·적층 과정에서 미세 입자(UFPs) 또는 휘발성 유기화합물(VOCs)이 일부 발생할 수 있습니다. 충분한 환기(자연 환기 또는 국소 배기)를 유지하고, 장시간 작업 시 배기 후드·공기 정화 장치 사용을 권장합니다.</li>
                <li><strong className="text-white/90">보관</strong>: 습기·직사광선·고온을 피하고, 필라멘트는 밀봉·습도 조절이 가능한 용기에 보관하면 수명·품질 유지에 유리합니다.</li>
                <li><strong className="text-white/90">식품·구강 접촉</strong>: FDM으로 제작한 물품은 식품용·구강 접촉용으로 승인된 소재·코팅이 아니면 식품 담금·식기로 사용하지 마세요. PLA·PETG 중 일부는 “식품 접촉 등급” 제품이 있으나, 표면 거칠기·균열·세균 침착 등으로 인해 일반 제작품의 식품 활용은 위험할 수 있습니다.</li>
              </ul>
            </section>

            <section id="3">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">3. FDM 소재별 안전 요약</h2>
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <h3 className="text-base font-bold text-emerald-400 mb-2">PLA (폴리락트산)</h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-2">식물 유래·생분해성 소재로, 상대적으로 배출 물질이 적고 냄새도 약한 편입니다.</p>
                  <ul className="text-sm text-white/60 list-disc list-inside space-y-1">용융 온도 180~220℃; 환기 권장; 고온·습기 보관 시 성능 저하·파단 가능; 폐기 시 일반 플라스틱 또는 생분해 전용 처리 방법에 따름.</ul>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <h3 className="text-base font-bold text-amber-400 mb-2">ABS (아크릴로니트릴-부타디엔-스티렌)</h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-2">스티렌·VOC 등이 고온 용융 시 배출될 수 있어, <strong className="text-amber-200">충분한 환기가 필수</strong>입니다.</p>
                  <ul className="text-sm text-white/60 list-disc list-inside space-y-1">용융 온도 220~260℃; 인쇄 시 냄새·흄에 노출되지 않도록 환기·배기; 밀폐된 공간·무환기 환경에서의 장시간 사용 자제; 일부 지역에서는 ABS 흄에 대한 작업장 노출 기준을 적용할 수 있음.</ul>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <h3 className="text-base font-bold text-blue-400 mb-2">PETG</h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-2">PLA와 ABS의 중간 정도로, 고온에서 일부 미세 배출이 있을 수 있습니다.</p>
                  <ul className="text-sm text-white/60 list-disc list-inside space-y-1">용융 온도 220~250℃; 보통의 환기 유지; 습기 흡수에 유의, 보관 시 건조; 식품·의료 등급 제품이 있으나 제작·후가공 조건에 따라 사용 한계가 있음.</ul>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <h3 className="text-base font-bold text-pink-400 mb-2">TPU (열가소성 폴리우레탄)</h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-2">유연 소재로, 일반적으로 고온 배출은 다른 계열에 비해 상대적으로 적은 편이나, 고온 출력 시 환기를 권장합니다.</p>
                  <ul className="text-sm text-white/60 list-disc list-inside space-y-1">용융 온도 210~240℃; 환기 유지; 습기·UV에 장기 노출 시 노화 가능.</ul>
                </div>
              </div>
            </section>

            <section id="4">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-violet-400" /> 4. 레진(SLA·DLP) 소재 공통 안전 수칙
              </h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li><strong className="text-white/90">미경화 레진</strong>: 액상 레진은 광초기제·단량체 등이 포함되어 있어 <strong className="text-amber-200">피부·눈에 자극·알레르기를 일으킬 수 있습니다.</strong> 취급 시에는 니트릴 장갑, 보안경(또는 face shield) 착용을 권장하며, 피부에 묻었을 경우 즉시 비눗물로 씻어 내고, 눈에 들어갔을 때는 충분히 세척한 뒤 의료기관을 방문하세요.</li>
                <li><strong className="text-white/90">흡입</strong>: 레진 냄새·흄을 되도록 흡입하지 않도록 하고, 작업 장소는 환기(배기 후드 등)를 유지하세요.</li>
                <li><strong className="text-white/90">경화(UV·태양광)</strong>: 레진은 UV에 의해 경화됩니다. 미경화 레진을 직사광선·UV 램프가 있는 곳에 두지 말고, 보관·이동 시에는 불투명 용기·포장을 사용하세요.</li>
                <li><strong className="text-white/90">보관</strong>: 직사광선·고온을 피하고, 용기 뚜껑을 꼭 닫아 두세요. 제조사 권장 유통기한·사용 기한을 확인하는 것이 좋습니다.</li>
                <li><strong className="text-white/90">경화 후 제작품</strong>: 완전히 세척·경화가 끝난 제작품은 미경화 레진에 비해 위험도가 낮으나, 식품·구강·피부 장시간 접촉용으로 사용할 때는 해당 레진의 “식품 접촉·생체 적합” 여부를 제조사에서 확인하세요.</li>
              </ul>
            </section>

            <section id="5">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">5. 레진 소재 유형별 참고 사항</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                Standard, Tough, Clear, Flexible 등 레진 종류에 따라 경도·강도·점도·경화 조건이 다릅니다. 공통적으로 위 4장의 “레진 공통 안전 수칙”을 적용하고, 제조사별 MSDS·사용 설명서를 참고하세요.
              </p>
              <ul className="space-y-1 text-sm text-white/60 list-disc list-inside">
                <li><strong className="text-white/80">Standard</strong>: 일반적인 보안경·장갑·환기로 취급.</li>
                <li><strong className="text-white/80">Tough</strong>: 강도·첨가제 등으로 제형이 다를 수 있으므로 제조사 MSDS 확인.</li>
                <li><strong className="text-white/80">Clear</strong>: 투명 제형은 UV 투과가 높아 경화·보관 시 빛 노출에 특히 주의.</li>
                <li><strong className="text-white/80">Flexible</strong>: 연성제 등 성분이 포함될 수 있으므로 제조사 안내 따름.</li>
              </ul>
            </section>

            <section id="6">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">6. 취급 시 공통 주의사항</h2>
              <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-disc list-inside">
                <li><strong className="text-white/90">환기</strong>: 실내 작업 시 창문 개방, 팬, 국소 배기, 공기 정화 장치 등으로 신선한 공기 유입과 흄·먼지 감소를 유지하세요.</li>
                <li><strong className="text-white/90">보관</strong>: 어린이·반려동물이 접근할 수 없는 곳에 두고, 직사광선·고온·화기 근처를 피하세요. 레진은 불투명 용기에 보관.</li>
                <li><strong className="text-white/90">폐기</strong>: 사용 후 필라멘트·레진·경화 부산물은 지자체 분리수거·지정폐기물 기준에 따르세요. 레진 병·미경화 잔류액은 제조사·지자체 안내에 따라 처리.</li>
                <li><strong className="text-white/90">응급</strong>: 큰 화상·눈·피부 심한 자극·흡입 후 이상 증상 시 즉시 의료기관을 방문하고, 가능하면 제조사 MSDS·성분 정보를 전달하세요.</li>
              </ul>
            </section>

            <section id="7">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">7. MSDS 및 상세 문의</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                물질안전보건자료(MSDS, Safety Data Sheet) 및 제조사별 세부 안전·사용 조건은 각 소재의 제조·공급업체에서 제공합니다. WOW3D PRO는 다양한 제조사의 소재를 사용할 수 있으므로, 사용된 정확한 제품명·배치·제조사를 확인하시려면 주문·제작 문의 시 요청하시거나{' '}
                <Link href="/contact" className="text-primary hover:underline">문의하기</Link>를 통해 연락해 주세요.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center gap-4">
            <Link href="/materials">
              <Button variant="outline" size="sm" className="rounded-xl border-white/15 hover:bg-white/10">
                소재 살펴보기
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
