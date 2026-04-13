'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ExternalLink } from 'lucide-react';
import { useState } from 'react';

/**
 * EducationQuickMenu
 * 와우3D 홍대센터(3D쿠키) 교육 사이트로 이동하는 우측 플로팅 메뉴
 */
export default function EducationQuickMenu() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[90] flex items-center pointer-events-none">
            <motion.a
                href="https://3dcookiehd.co.kr/"
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="pointer-events-auto relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 border-r-0 rounded-l-2xl shadow-2xl p-3 gap-4 transition-all group overflow-hidden"
                style={{
                    boxShadow: isHovered ? '0 0 40px rgba(20, 184, 166, 0.2)' : 'none'
                }}
            >
                {/* 배경 포인트 글로우 */}
                <div className={`absolute inset-0 bg-gradient-to-r from-teal-500/15 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                
                {/* 텍스트 영역 (호버 시 확장) */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ width: 0, opacity: 0, x: 10 }}
                            animate={{ width: 'auto', opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: 10 }}
                            className="flex flex-col whitespace-nowrap overflow-hidden pl-1"
                        >
                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] leading-none mb-1.5">Education Center</span>
                            <span className="text-sm font-black text-white leading-none tracking-tight">와우3D 홍대센터</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 아이콘 영역 */}
                <div className="relative shrink-0">
                    <div className={`p-2.5 rounded-xl transition-all duration-500 ${isHovered ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/40 rotate-[360deg] scale-110' : 'bg-white/5 text-teal-400/70 border border-white/10'}`}>
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    
                    {/* 알림 도트 (평상 시 시선 유도) */}
                    {!isHovered && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                    )}
                </div>

                {/* 외부 링크 아이콘 */}
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white/30 mr-1"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </motion.div>
                )}
            </motion.a>
        </div>
    );
}
