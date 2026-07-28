import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { absoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
    title: 'FDM vs SLA vs DLP 비교 가이드',
    description:
        'FDM, SLA, DLP 3D 프린팅 방식의 차이와 추천 용도, 표면 품질, 속도, 비용 차이를 비교해 어떤 방식이 적합한지 안내합니다.',
    alternates: { canonical: absoluteUrl('/guides/fdm-vs-sla-vs-dlp') },
};

const faqs = [
    {
        q: '기능성 시제품에는 어떤 3D 프린팅 방식이 적합한가요?',
        a: '기능 시험, 조립성 확인, 내구성 중심의 시제품은 일반적으로 FDM이 적합합니다. 비용 효율과 기계적 성능 면에서 유리하기 때문입니다.',
    },
    {
        q: '표면 품질이 중요한 모델은 어떤 방식을 선택해야 하나요?',
        a: '외관, 디테일, 미세한 형상 표현이 중요하다면 SLA 또는 DLP가 더 적합합니다. 레진 기반 공정은 FDM보다 표면이 매끄럽고 디테일 표현력이 높습니다.',
    },
    {
        q: '같은 모델인데 방식에 따라 가격이 왜 다른가요?',
        a: '재료 단가, 장비 시간, 후처리 공정, 레이어 경화 방식이 다르기 때문입니다. 특히 SLA와 DLP는 후세척과 2차 경화가 필요해 비용 구조가 FDM과 다릅니다.',
    },
];

export default function CompareGuidePage() {
    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <Header />
            <section className="pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-5xl space-y-6">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                        Compare Guide
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        FDM, SLA, DLP는
                        <br />
                        <span className="text-teal-400">무엇이 다를까요?</span>
                    </h1>
                    <p className="max-w-3xl text-lg text-white/70 leading-relaxed break-keep">
                        3D 프린팅 방식 선택은 비용, 표면 품질, 제작 속도, 소재 특성에 직접 영향을 줍니다.
                        이 가이드는 고객이 가장 많이 묻는 “FDM과 SLA 차이”, “DLP가 더 좋은가요?” 같은 질문에 답하도록 구성했습니다.
                    </p>
                </div>
            </section>

            <section className="pb-24">
                <div className="container mx-auto px-6 max-w-5xl space-y-10">
                    <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.03]">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-white/[0.04]">
                                <tr>
                                    <th className="p-4 text-left">항목</th>
                                    <th className="p-4 text-left">FDM</th>
                                    <th className="p-4 text-left">SLA</th>
                                    <th className="p-4 text-left">DLP</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/75">
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">추천 용도</td><td className="p-4">기능성 시제품, 조립 부품</td><td className="p-4">정밀 모형, 외관 시제품</td><td className="p-4">소형 정밀 부품, 반복 생산</td></tr>
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">표면 품질</td><td className="p-4">층선이 보일 수 있음</td><td className="p-4">매끄럽고 디테일 우수</td><td className="p-4">매끄럽고 디테일 우수</td></tr>
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">비용 특성</td><td className="p-4">상대적으로 경제적</td><td className="p-4">레진·후처리 비용 반영</td><td className="p-4">정밀도와 속도에 따라 비용 반영</td></tr>
                                <tr className="border-t border-white/10"><td className="p-4 font-bold text-white">재료</td><td className="p-4">PLA, ABS, PETG, TPU 등</td><td className="p-4">Standard, Tough, Clear, Flexible 레진</td><td className="p-4">SLA와 유사한 레진 계열</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <h2 className="text-xl font-black mb-3">FDM</h2>
                            <p className="text-white/65 break-keep leading-relaxed">비용 효율이 좋고 기능 시험과 조립 부품에 적합합니다. 자동견적에서 인필과 레이어 높이 영향이 비교적 큽니다.</p>
                        </article>
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <h2 className="text-xl font-black mb-3">SLA</h2>
                            <p className="text-white/65 break-keep leading-relaxed">매끄러운 표면과 정밀 디테일이 장점입니다. 레진 세척과 2차 경화 등 후처리가 필요한 경우가 많습니다.</p>
                        </article>
                        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                            <h2 className="text-xl font-black mb-3">DLP</h2>
                            <p className="text-white/65 break-keep leading-relaxed">정밀도와 레이어당 경화 속도가 강점이며, 동일한 소형 부품을 여러 개 제작할 때 유리할 수 있습니다.</p>
                        </article>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 space-y-5">
                        <h2 className="text-2xl font-black">자주 묻는 질문</h2>
                        {faqs.map((item) => (
                            <div key={item.q} className="rounded-2xl border border-white/10 bg-black/15 p-5">
                                <h3 className="font-black text-lg mb-2">{item.q}</h3>
                                <p className="text-white/68 leading-relaxed break-keep">{item.a}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Link href="/quote">
                            <Button className="rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                                자동견적 받기 <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                        <Link href="/guides/3d-printing-quote-guide">
                            <Button variant="outline" className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                                견적 계산 방식 보기
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
}
