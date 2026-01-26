'use client'

import Link from 'next/link'
import { MapPin, Phone, Mail, Boxes, ArrowUpRight, Github, Twitter, Instagram, ChevronDown } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-[#030303] border-t border-white/5 pt-24 pb-12 relative overflow-hidden">
            {/* Ambient Background Blur */}
            <div className="absolute bottom-0 left-1/4 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-8">
                        <Link href="/" className="flex items-center gap-2.5 group transition-all">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                                <Boxes className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-xl tracking-tighter text-white leading-none">
                                    WOW3D<span className="text-primary font-light ml-0.5">PRO</span>
                                </span>
                                <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.12em] text-white/40 leading-tight mt-1">
                                    AI 실시간자동 견적시스템
                                </span>
                            </div>
                        </Link>

                        <p className="text-sm text-white/40 leading-relaxed font-medium max-w-sm">
                            와우3D는 산업용 적층 제조 솔루션의 선두주자입니다.
                            초정밀 분석 엔진과 전국의 제작 센터를 통해 아이디어를 가장 빠르고 완벽하게 현실로 구현합니다.
                        </p>

                        <div className="flex items-center gap-4">
                            {[Github, Twitter, Instagram].map((Icon, i) => (
                                <button key={i} className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                                    <Icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Navigation - Center Links */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">제작 센터</h3>
                            <ul className="space-y-4">
                                {[
                                    { name: '홍대센터', address: '서울시 마포구 독막로 93 상수빌딩 4층' },
                                    { name: '구미센터', address: '경북 구미시 산호대로 253' },
                                    { name: '전주센터', address: '전북 전주시 덕진구 반룡로 109' },
                                ].map((item) => (
                                    <li key={item.name} className="group cursor-pointer">
                                        <div className="text-[11px] font-black text-white/60 group-hover:text-white transition-colors flex items-center gap-1.5">
                                            {item.name}
                                            <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all" />
                                        </div>
                                        <p className="text-[10px] text-white/20 mt-1 font-medium">{item.address}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">고객 지원</h3>
                            <ul className="space-y-4">
                                <li>
                                    <div className="text-[11px] font-black text-white/60 uppercase tracking-widest mb-1.5">대표 전화</div>
                                    <p className="text-[10px] text-white/30 font-bold">02-3144-3137</p>
                                    <p className="text-[10px] text-white/30 font-bold">054-464-3144</p>
                                </li>
                                <li>
                                    <div className="text-[11px] font-black text-white/60 uppercase tracking-widest mb-1.5">이메일 문의</div>
                                    <a href="mailto:wow3d16@naver.com" className="text-[10px] text-primary font-bold hover:underline">wow3d16@naver.com</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Newsletter / CTA */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 ring-1 ring-white/5">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-4">소식 받기</h3>
                            <p className="text-[10px] text-white/30 font-medium mb-4 italic">적층 제조 워크숍·신규 소재 소식을 가장 먼저 받아보세요.</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="이메일 주소"
                                    className="flex-1 h-10 bg-black border border-white/10 rounded-xl px-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                />
                                <button className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black hover:bg-white/90 transition-all">
                                    <ChevronDown className="w-4 h-4 -rotate-90" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                        © {new Date().getFullYear()} WOW3D PRO. (주)와우3D. All rights reserved.
                    </div>
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-white/40">
                        <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
                        <Link href="/materials/safety" className="hover:text-white transition-colors">소재 안전 정보</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
