import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { absoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
    title: '3D 프린팅 제작 기간과 납기 안내',
    description:
        '3D 프린팅 제작 기간은 파일 상태, 출력 방식, 후가공, 수량에 따라 달라집니다. WOW3D의 자동견적부터 제작·검수·배송까지 납기 기준을 안내합니다.',
    alternates: { canonical: absoluteUrl('/guides/3d-printing-turnaround-time') },
};

export default function TurnaroundGuidePage() {
    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <section className="pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-5xl space-y-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        Turnaround Guide
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        3D 프린팅은
                        <br />
                        <span className="text-teal-400">얼마나 걸리나요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        3D 프린팅 제작 기간은 출력 시간만으로 결정되지 않습니다. 파일 검토, 소재 선택,
                        후처리, 검수, 배송까지 포함해 실제 납기가 정해집니다.
                    </p>
                </div>
            </section>

            <section className="pb-24">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><p className="text-[11px] uppercase tracking-[0.25em] text-teal-400 mb-2">Step 1</p><h2 className="text-xl font-black mb-2">파일 업로드</h2><p className="text-white/60">부피·치수·표면적 자동 분석</p></div>
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><p className="text-[11px] uppercase tracking-[0.25em] text-teal-400 mb-2">Step 2</p><h2 className="text-xl font-black mb-2">출력</h2><p className="text-white/60">방식·레이어·수량에 따라 시간 산정</p></div>
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><p className="text-[11px] uppercase tracking-[0.25em] text-teal-400 mb-2">Step 3</p><h2 className="text-xl font-black mb-2">후처리·검수</h2><p className="text-white/60">서포트 제거, 세척, 경화, 확인</p></div>
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><p className="text-[11px] uppercase tracking-[0.25em] text-teal-400 mb-2">Step 4</p><h2 className="text-xl font-black mb-2">배송</h2><p className="text-white/60">포장 후 출고, 지역별 배송 일정 반영</p></div>
                    </div>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 space-y-5">
                        <h2 className="text-2xl font-black">납기에 영향을 주는 요소</h2>
                        <ul className="space-y-2 text-white/70 leading-relaxed">
                            <li>출력 방식: FDM / SLA / DLP에 따라 장비 시간과 후처리가 다릅니다.</li>
                            <li>레이어 높이: 더 정밀한 설정일수록 출력 시간이 길어질 수 있습니다.</li>
                            <li>수량: 동일 부품 반복 제작 여부에 따라 작업 시간이 달라집니다.</li>
                            <li>후가공: 세척, 경화, 조립, 도색 등 추가 작업이 있으면 납기가 늘어날 수 있습니다.</li>
                            <li>파일 상태: 모델 오류 수정이나 별도 검토가 필요한 경우 추가 시간이 필요할 수 있습니다.</li>
                        </ul>
                    </article>

                    <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 space-y-5">
                        <h2 className="text-2xl font-black">일반적인 진행 흐름</h2>
                        <p className="text-white/70 leading-relaxed break-keep">
                            자동견적으로 바로 확인 가능한 작업도 많지만, 복잡한 형상이나 수정견적이 필요한 주문은
                            관리자 검토 후 별도 납기 안내가 들어갈 수 있습니다. WOW3D는 주문 확인 후 제작, 검수, 배송 순서로 진행합니다.
                        </p>
                    </article>

                    <div className="flex gap-3">
                        <Link href="/contact">
                            <Button className="rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                                납기 문의하기 <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                        <Link href="/quote">
                            <Button variant="outline" className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                                자동견적 시작
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
}
