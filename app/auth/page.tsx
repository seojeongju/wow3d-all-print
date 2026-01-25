'use client'

import { useState, Suspense } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, User, Phone, Sparkles, Zap, Layers, ArrowRight, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

function AuthContent() {
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const { setUser } = useAuthStore()
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnTo = searchParams.get('return') || undefined

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

            toast({
                title: '로그인 성공',
                description: `${result.data.user.name}님, 다시 만나서 반갑습니다.`,
            })

            const target = returnTo || (result.data.user?.role === 'admin' ? '/admin' : '/cart')
            router.push(target)
        } catch (error) {
            toast({
                title: '로그인 실패',
                description: error instanceof Error ? error.message : '이메일 또는 비밀번호를 확인해 주세요.',
                variant: 'destructive',
            })
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

            toast({
                title: '회원가입 완료',
                description: '계정이 생성되었습니다. 로그인된 상태로 이동합니다.',
            })

            router.push(returnTo || '/cart')
        } catch (error) {
            toast({
                title: '회원가입 실패',
                description: error instanceof Error ? error.message : '입력 내용을 확인해 주세요.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
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
