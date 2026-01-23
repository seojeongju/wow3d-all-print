'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Zap, LogOut } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";

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
            border-b border-border/40 backdrop-blur-md sticky top-0 z-50 
            transition-all duration-300 ease-in-out
            ${isScrolled
                ? 'bg-background/98 shadow-lg shadow-primary/5'
                : 'bg-background/95'
            }
        `}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Image
                        src="/images/wow3d-logo.png"
                        alt="Wow3D Logo"
                        width={140}
                        height={36}
                        className="h-9 w-auto"
                        priority
                    />
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <a href="/#services" className="hover:text-primary transition-colors">서비스 소개</a>
                    <a href="/#features" className="hover:text-primary transition-colors">주요 기능</a>
                    <a href="/#process" className="hover:text-primary transition-colors">제작 공정</a>
                    <a href="/#contact" className="hover:text-primary transition-colors">문의하기</a>
                </nav>

                <div className="flex items-center gap-3">
                    {/* Cart */}
                    <Link href="/cart">
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="w-5 h-5" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </Button>
                    </Link>

                    {/* Auth */}
                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <Link href="/my-account">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <User className="w-4 h-4" />
                                    {user?.name}
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={logout}
                                title="로그아웃"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <Link href="/auth">
                            <Button variant="outline" size="sm" className="gap-2">
                                <User className="w-4 h-4" />
                                로그인
                            </Button>
                        </Link>
                    )}

                    {/* CTA */}
                    <Link href="/quote">
                        <Button size="sm" className="gap-2 shadow-lg shadow-primary/25">
                            <Zap className="w-4 h-4" />
                            견적 받기
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
