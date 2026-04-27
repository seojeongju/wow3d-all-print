'use client';

import Link from 'next/link'
import { MapPin, Phone, Mail, Boxes, ArrowUpRight, Facebook, Instagram, BookOpen, Users, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Footer() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])
    return (
        <footer className="relative overflow-hidden pt-24 pb-12 bg-background border-t border-primary/10 transition-all duration-500">
            {/* Cyber Grid & Glow */}
            <div className="absolute inset-0 cyber-grid opacity-50" />
            <div className="absolute left-[-10%] bottom-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
            <div className="absolute right-[-10%] top-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

            <div className="container mx-auto px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform cyber-glow-mint">
                                <Boxes className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-xl tracking-tighter text-foreground uppercase">
                                    WOW3D<span className="text-primary text-glow-mint ml-0.5">ALL</span>
                                </span>
                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mt-1">
                                    (주)와우쓰리디
                                </span>
                            </div>
                        </Link>

                        <p className="text-sm text-foreground/50 leading-relaxed font-bold max-w-sm">
                            AI 기반의 차세대 3D 프린팅 공정 제어 시스템.<br />
                            상상을 현실로 만드는 가장 스마트한 파트너.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            {[
                                { name: 'Blog', url: 'https://blog.naver.com/3dcookiehd', icon: BookOpen },
                                { name: 'Insta', url: 'https://www.instagram.com/3dcookie_hd/', icon: Instagram },
                                { name: 'FB', url: 'https://ko-kr.facebook.com/3dfabcafe/', icon: Facebook },
                            ].map(({ name, url, icon: Icon }, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-foreground/30 hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation - Center Links */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Manufacturing</h3>
                            <ul className="space-y-4">
                                {[
                                    { name: '홍대 센터', address: '서울시 마포구 독막로 93' },
                                    { name: '구미 센터', address: '경북 구미시 산호대로 253' },
                                    { name: '전주 센터', address: '전북 전주시 반룡로 109' },
                                ].map((item) => (
                                    <li key={item.name} className="group cursor-pointer">
                                        <div className="text-[12px] font-black text-foreground/70 group-hover:text-primary transition-colors flex items-center gap-1">
                                            {item.name}
                                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                        <p className="text-[10px] text-foreground/30 mt-1 font-bold">{item.address}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-foreground/30 tracking-[0.3em]">Support</h3>
                            <ul className="space-y-4">
                                <li>
                                    <div className="text-[11px] font-black text-foreground/50 uppercase tracking-widest mb-2">CS Center</div>
                                    <p className="text-[12px] text-foreground/70 font-black tracking-tighter">02-3144-3137</p>
                                    <p className="text-[12px] text-foreground/70 font-black tracking-tighter">054-464-3144</p>
                                </li>
                                <li>
                                    <div className="text-[11px] font-black text-foreground/50 uppercase tracking-widest mb-2">Email</div>
                                    <a href="mailto:wow3d16@naver.com" className="text-[12px] text-primary font-black hover:underline">wow3d16@naver.com</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Newsletter / CTA */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="glass-card p-6 bg-primary/5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 text-foreground/70">Updates</h3>
                            <p className="text-[10px] text-foreground/30 font-bold mb-5 italic leading-relaxed">최신 3D 프린팅 기술과 소재 소식을 받아보세요.</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="flex-1 h-10 bg-white/50 border border-primary/10 rounded-xl px-4 text-[11px] font-black text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                />
                                <button className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                    <ChevronDown className="w-4 h-4 -rotate-90" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-24 pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">
                        {mounted ? `© ${new Date().getFullYear()} WOW3D ALL. (주)와우쓰리디. All rights reserved.` : '© WOW3D ALL.'}
                    </div>
    );
}
