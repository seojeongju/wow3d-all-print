'use client'

import { useState, Suspense, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, User, Phone, Sparkles, Zap, Layers, ArrowRight, ShieldCheck } from 'lucide-react'
import { showToast } from '@/lib/toast-helper'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

function AuthContent() {
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const { setUser } = useAuthStore()
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnTo = searchParams.get('return') || undefined
    const tokenFromUrl = searchParams.get('token')
    const returnPath = searchParams.get('return') || '/cart'
    const authError = searchParams.get('error')

    // Google 콜백 후 token이 URL에 있으면 로그인 처리
    useEffect(() => {
        if (!tokenFromUrl) return
        const run = async () => {
            try {
                const meRes = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${tokenFromUrl}` },
                })
                if (!meRes.ok) throw new Error('토큰 검증 실패')
                const json = await meRes.json()
                const user = json?.data
                if (user?.id && user?.email) {
                    setUser(
                        {
                            id: user.id,
                            email: user.email,
                            name: user.name ?? '',
                            phone: user.phone,
                            role: user.role ?? 'user',
                            store_id: user.store_id ?? 1,
                            createdAt: user.created_at ?? '',
                            updatedAt: user.updated_at ?? '',
                        },
                        tokenFromUrl
                    )
                    showToast.success('로그인 성공', `${user.name}님, 환영합니다.`)
                    router.replace(returnPath)
                }
            } catch {
                showToast.error('로그인 처리 실패', '다시 시도해 주세요.')
                router.replace('/auth')
            }
        }
        run()
    }, [tokenFromUrl, returnPath, setUser, router])

    useEffect(() => {
        if (authError === 'google_cancel') showToast.error('Google 로그인 취소', '다시 시도해 주세요.')
        else if (authError === 'config') showToast.error('로그인 설정 오류', 'Google 로그인이 설정되지 않았습니다.')
        else if (authError === 'db') showToast.error('데이터베이스 오류', 'Google 로그인용 DB 설정이 필요합니다. 관리자에게 문의하세요.')
        else if (authError === 'server') showToast.error('일시 오류', '잠시 후 다시 시도해 주세요.')
    }, [authError])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
                const text = await response.text()
                let msg = '로그인에 실패했습니다.'
                try {
                    const d = JSON.parse(text)
                    if (d?.error && typeof d.error === 'string') msg = d.error
                } catch {
                    if (text && text.length < 300) msg = text
                    else if (response.status >= 500) msg = '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
                }
                throw new Error(msg)
            }

            const result = await response.json()
            setUser(result.data.user, result.data.token)

            showToast.success('로그인 성공', `${result.data.user.name}님, 다시 만나서 반갑습니다.`)

            const target = returnTo || (result.data.user?.role === 'admin' ? '/admin' : '/cart')
            router.push(target)
        } catch (error) {
            showToast.error('로그인 실패', error instanceof Error ? error.message : '이메일 또는 비밀번호를 확인해 주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, phone }),
            })

            if (!response.ok) {
                const text = await response.text()
                let msg = '회원가입에 실패했습니다.'
                try {
                    const d = JSON.parse(text)
                    if (d?.error && typeof d.error === 'string') msg = d.error
                } catch {
                    if (text && text.length < 300) msg = text
                    else if (response.status >= 500) msg = '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
                }
                throw new Error(msg)
            }

            const result = await response.json()
            setUser(result.data.user, result.data.token)

            showToast.success('회원가입 완료', '계정이 생성되었습니다. 로그인된 상태로 이동합니다.')

            router.push(returnTo || '/cart')
        } catch (error) {
            showToast.error('회원가입 실패', error instanceof Error ? error.message : '입력 내용을 확인해 주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    if (tokenFromUrl) {
        return (
            <div className="min-h-screen bg-[#06050a] text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                    <p className="text-sm text-white/70">로그인 처리 중...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#06050a] text-white selection:bg-cyan-400/30 flex relative overflow-hidden">
            {/* Animated gradient orbs - youthful, dynamic */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-cyan-500/8 blur-[120px] animate-pulse" />
                <div className="absolute top-1/3 -right-1/4 w-[600px] h-[600px] rounded-full bg-violet-500/10 blur-[100px] animate-pulse animation-delay-2000" />
                <div className="absolute -bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-fuchsia-500/6 blur-[90px] animate-pulse animation-delay-4000" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.08),transparent)]" />
            </div>

            {/* Left: Brand + value props - glass, gradient, less corporate */}
            <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative items-center justify-center p-10 xl:p-16">
                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-md xl:max-w-lg space-y-10 relative z-10"
                >
                    {/* Logo block with gradient glow */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-400/25 ring-1 ring-white/10">
                            <Layers className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-white/60 tracking-wide">WOW3D</span>
                            <p className="text-[11px] text-white/40 mt-0.5">3D 프린팅 자동 견적</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] tracking-tight">
                            제조의 수준을<br />
                            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                                한 단계 높이세요
                            </span>
                        </h2>
                        <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                            첨단 적층 제조의 전문가 네트워크에 합류하세요. 업로드만으로 실시간 견적, 산업용 품질까지.
                        </p>
                    </div>

                    {/* Feature pills - more visual, youthful */}
                    <div className="flex flex-wrap gap-3">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-cyan-500/20 hover:bg-white/[0.06] transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center group-hover:bg-cyan-500/25 transition-colors">
                                <Zap className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-white/90 block">초단위 실시간 견적</span>
                                <span className="text-[11px] text-white/45">3D 파일 업로드만 하면 끝</span>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.4 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/20 hover:bg-white/[0.06] transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center group-hover:bg-violet-500/25 transition-colors">
                                <Sparkles className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-white/90 block">산업용 품질</span>
                                <span className="text-[11px] text-white/45">정교한 마감·소재 스펙</span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Right: Form - pill tabs, gradient CTA, return URL aware */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[400px]"
                >
                    {/* Login / Signup tab pills */}
                    <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-10">
                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${isLogin ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white shadow-inner border border-white/10' : 'text-white/50 hover:text-white/80'}`}
                        >
                            로그인
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${!isLogin ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white shadow-inner border border-white/10' : 'text-white/50 hover:text-white/80'}`}
                        >
                            회원가입
                        </button>
                    </div>

                    <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-semibold text-white/70">이메일</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 pl-12 bg-white/[0.05] border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 font-medium placeholder:text-white/20 transition-all"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5 overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-semibold text-white/70">이름</Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                            <Input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-12 pl-12 bg-white/[0.05] border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 font-medium"
                                                placeholder="홍길동"
                                                autoComplete="name"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-xs font-semibold text-white/70">전화번호 <span className="text-white/40 font-normal">(선택)</span></Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="h-12 pl-12 bg-white/[0.05] border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 font-medium"
                                                placeholder="010-0000-0000"
                                                autoComplete="tel"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-semibold text-white/70">비밀번호</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 pl-12 bg-white/[0.05] border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 font-medium"
                                    placeholder="••••••••"
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-0"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {isLogin ? '로그인' : '가입하기'}
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-[11px]">
                                <span className="bg-[#06050a] px-3 text-white/40">또는</span>
                            </div>
                        </div>

                        <a
                            href={`/api/auth/google${returnTo ? `?return=${encodeURIComponent(returnTo)}` : ''}`}
                            className="flex items-center justify-center gap-3 w-full h-14 rounded-xl bg-white hover:bg-white/95 text-gray-800 font-semibold border border-white/20 transition-all duration-200"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google로 계속하기
                        </a>
                    </form>

                    <p className="mt-8 text-center text-[12px] text-white/40">
                        {isLogin ? '아직 회원이 아니에요?' : '이미 계정이 있어요?'}{' '}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold underline-offset-2 hover:underline transition-colors"
                        >
                            {isLogin ? '회원가입' : '로그인'}
                        </button>
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-white/25">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        암호화된 안전한 연결
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#06050a] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
            </div>
        }>
            <AuthContent />
        </Suspense>
    )
}
