'use client';

import Link from 'next/link'
import { MapPin, Phone, Mail, Boxes, ArrowUpRight, Facebook, Instagram, BookOpen, Users, ChevronDown, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getNaverTalkTalkChatUrl } from '@/lib/naver-talktalk'

export default function Footer() {
    const [mounted, setMounted] = useState(false)
    const talkUrl = getNaverTalkTalkChatUrl()

    useEffect(() => {
        setMounted(true)
    }, [])
    return (
        <footer className="relative overflow-hidden pt-16 sm:pt-24 pb-8 sm:pb-12 border-t border-white/5">
            {/* 연한 블랙 및 그라데이션 배경 (Hero와 동일) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            {/* 틸/블루 은은한 포인트 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

            {/* 그리드 배경 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* 배경 글로우 포인트들 */}
            <div className="absolute left-0 bottom-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-teal-500/10 sm:bg-teal-500/20 blur-[80px] sm:blur-[130px]" />
            <div className="absolute right-0 top-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-indigo-600/10 sm:bg-indigo-600/15 blur-[100px] sm:blur-[150px]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16">

                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-6 sm:space-y-8">
                        <Link href="/" className="flex items-center gap-2.5 group transition-all">
                            <div className="w-9 h-9 sm:w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
                                <Boxes className="w-5 h-5 sm:w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-lg sm:text-xl tracking-tighter text-white leading-none">
                                    WOW3D<span className="text-teal-400 font-light ml-0.5">PRO</span>
                                </span>
                                <span className="text-[10px] font-bold text-white/70 leading-tight mt-1.5">
                                    (주)와우쓰리디 / <span className="text-teal-400 font-semibold">3D쿠키홍대</span>
                                </span>
                            </div>
                        </Link>

                        <p className="text-[13px] sm:text-sm text-white/40 leading-relaxed font-medium max-w-sm">
                            AI 기반 3D 프린팅 자동견적 시스템과 산업용 제작 인프라를 바탕으로
                            3D 프린터 출력, 시제품제작 서비스, 소량 양산 서비스를 제공합니다.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            {[
                                ...(talkUrl
                                    ? [{ name: '네이버 톡톡 상담', url: talkUrl, icon: MessageCircle }]
                                    : []),
                                { name: '네이버 블로그', url: 'https://blog.naver.com/3dcookiehd', icon: BookOpen },
                                { name: '네이버 밴드', url: 'https://www.band.us/@3dcookiehd', icon: Users },
                                { name: '인스타그램', url: 'https://www.instagram.com/3dcookie_hd/', icon: Instagram },
                                { name: '페이스북', url: 'https://ko-kr.facebook.com/3dfabcafe/', icon: Facebook },
                            ].map(({ name, url, icon: Icon }, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name} className="w-9 h-9 sm:w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/30 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/10 transition-all active:scale-95">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation - Center Links */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-4 sm:space-y-6">
                            <h3 className="text-[9px] sm:text-[10px] font-black uppercase text-teal-400 tracking-[0.2em] sm:tracking-[0.3em]">제작 센터</h3>
                            <ul className="space-y-3 sm:space-y-4">
                                {[
                                    { name: '홍대센터', address: '서울시 마포구 독막로 93' },
                                    { name: '구미센터', address: '경북 구미시 산호대로 253' },
                                    { name: '전주센터', address: '전북 전주시 반룡로 109' },
                                ].map((item) => (
                                    <li key={item.name} className="group cursor-pointer">
                                        <div className="text-[10px] sm:text-[11px] font-black text-white/50 group-hover:text-teal-400 transition-colors flex items-center gap-1">
                                            {item.name}
                                            <ArrowUpRight className="w-2 sm:w-2.5 h-2 sm:h-2.5 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                        <p className="text-[9px] sm:text-[10px] text-white/20 mt-0.5 font-medium">{item.address}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                            <h3 className="text-[9px] sm:text-[10px] font-black uppercase text-white/30 tracking-[0.2em] sm:tracking-[0.3em]">고객 지원</h3>
                            <ul className="space-y-3 sm:space-y-4">
                                <li>
                                    <div className="text-[10px] sm:text-[11px] font-black text-white/50 uppercase tracking-widest mb-1 sm:mb-1.5">대표 전화</div>
                                    <p className="text-[10px] text-white/30 font-bold">02-3144-3137</p>
                                    <p className="text-[10px] text-white/30 font-bold">054-464-3144</p>
                                </li>
                                <li>
                                    <div className="text-[10px] sm:text-[11px] font-black text-white/50 uppercase tracking-widest mb-1 sm:mb-1.5">이메일 문의</div>
                                    <a href="mailto:wow3d16@naver.com" className="text-[10px] text-teal-400 font-bold hover:underline">wow3d16@naver.com</a>
                                </li>
                                {talkUrl ? (
                                    <li>
                                        <div className="text-[10px] sm:text-[11px] font-black text-white/50 uppercase tracking-widest mb-1 sm:mb-1.5">실시간 상담</div>
                                        <a
                                            href={talkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-[#03C75A] font-bold hover:underline"
                                        >
                                            네이버 톡톡 상담하기
                                        </a>
                                    </li>
                                ) : null}
                            </ul>
                        </div>
                    </div>

                    {/* Newsletter / CTA */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.03] border border-white/8">
                            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-3 sm:mb-4 text-white/70">소식 받기</h3>
                            <p className="text-[9px] sm:text-[10px] text-white/25 font-medium mb-4 italic leading-relaxed">적층 제조 워크숍·신규 소재 소식을 가장 먼저 받아보세요.</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="이메일 주소"
                                    className="flex-1 h-9 sm:h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] sm:text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all"
                                />
                                <button className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white hover:bg-teal-400 transition-all active:scale-95">
                                    <ChevronDown className="w-4 h-4 -rotate-90" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-16 sm:mt-24 pt-6 sm:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-[9px] sm:text-[10px] font-bold text-white/10 sm:text-white/20 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center sm:text-left">
                        {mounted ? `© ${new Date().getFullYear()} WOW3D PRO. (주)와우쓰리디 / 3D쿠키홍대. All rights reserved.` : '© WOW3D PRO.'}
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/25 sm:text-white/30">
                        <Link href="/terms" className="hover:text-teal-400 transition-colors">이용약관</Link>
                        <Link href="/privacy" className="hover:text-teal-400 transition-colors">개인정보처리방침</Link>
                        <Link href="/materials/safety" className="hover:text-teal-400 transition-colors">소재 안전 정보</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
