'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Zap, LogOut, Boxes, ChevronDown, Bell } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
    const { getTotalItems } = useCartStore()
    const { isAuthenticated, user, logout } = useAuthStore()
    const cartItemCount = getTotalItems()

    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header className={`
            fixed top-0 left-0 right-0 z-[100] transition-all duration-500
            ${isScrolled
                ? 'bg-black/60 backdrop-blur-2xl border-b border-white/5 py-3'
                : 'bg-transparent py-6'}
        `}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-2.5 group transition-all">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-105 transition-all">
                        <Boxes className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-xl tracking-tighter text-white leading-none">
                            WOW3D<span className="text-primary font-light ml-0.5 whitespace-nowrap">PRO</span>
                        </span>
                        <span className="text-[8px] uppercase font-bold tracking-[0.3em] text-white/30 leading-none mt-1">
                            산업용 3D 시스템
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] backdrop-blur-md border border-white/5 p-1.5 rounded-2xl">
                    {[
                        { label: '서비스', href: '/#services' },
                        { label: '기능', href: '/#features' },
                        { label: '공정', href: '/#process' },
                        { label: '주문조회', href: '/my-account' },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    {/* Cart with Indicator */}
                    <Link href="/cart">
                        <button className="relative w-11 h-11 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group">
                            <ShoppingCart className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                            <AnimatePresence>
                                {cartItemCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-primary/40"
                                    >
                                        {cartItemCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    </Link>

                    {/* Authentication / User */}
                    <div className="flex items-center gap-2">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-2 ml-2">
                                <Link href="/my-account">
                                    <button className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] font-black text-white leading-none capitalize">{user?.name}</span>
                                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">회원</span>
                                        </div>
                                    </button>
                                </Link>
                                <button
                                    onClick={logout}
                                    className="w-11 h-11 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/20 transition-all"
                                    title="로그아웃"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Link href="/auth">
                                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-xl px-5 h-11">
                                    Sign In
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Primary CTA */}
                    <Link href="/quote" className="hidden sm:block">
                        <Button className="h-11 px-6 rounded-xl bg-white text-black hover:bg-white/90 shadow-xl shadow-white/5 font-black text-[10px] uppercase tracking-[0.2em] gap-2 transition-all active:scale-95">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            견적 받기
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
