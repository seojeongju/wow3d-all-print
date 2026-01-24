'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Lock, User, Phone, Boxes, ArrowRight, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const { setUser } = useAuthStore()
    const { toast } = useToast()
    const router = useRouter()

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

            // 관리자는 /admin, 일반 사용자는 /cart로 이동
            router.push(result.data.user?.role === 'admin' ? '/admin' : '/cart')
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

            router.push('/cart')
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
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 flex relative overflow-hidden">
            {/* Split Screen Logic */}
            <div className="hidden lg:flex w-1/2 bg-[#080808] border-r border-white/5 relative items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                <div className="max-w-md space-y-8 relative z-10 text-center">
                    <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-2xl shadow-primary/20 mx-auto">
                        <Boxes className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black uppercase tracking-tighter leading-none italic">
                            제조의 수준을 <br /> <span className="text-primary">한 단계 높이세요</span>
                        </h2>
                        <p className="text-white/30 text-xs font-bold uppercase tracking-[0.3em] leading-relaxed">
                            첨단 적층 제조의 전문가 네트워크에 합류하세요.
                        </p>
                    </div>

                    <div className="pt-12 grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 text-left">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-2">효율</span>
                            <p className="text-[11px] font-bold text-white/60 leading-relaxed">3D 지오메트리 업로드만으로 초 단위 실시간 견적.</p>
                        </div>
                        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 text-left">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-2">품질</span>
                            <p className="text-[11px] font-bold text-white/60 leading-relaxed">산업용 소재 스펙과 정교한 마감 처리.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm space-y-10"
                >
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                            {isLogin ? '로그인' : '회원가입'}
                        </h1>
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">
                            {isLogin ? '대시보드에 접속하세요' : 'WOW3D 프로 계정을 만드세요'}
                        </p>
                    </div>

                    <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">이메일</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl pl-12 focus:ring-primary font-bold placeholder:text-white/10"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">이름</Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-14 bg-white/[0.03] border-white/10 rounded-2xl pl-12 font-bold"
                                                placeholder="홍길동"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">전화번호 (선택)</Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="h-14 bg-white/[0.03] border-white/10 rounded-2xl pl-12 font-bold"
                                                placeholder="010-0000-0000"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">비밀번호</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl pl-12 font-bold"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/5 font-black uppercase tracking-[0.2em] group active:scale-95 transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    {isLogin ? '로그인' : '가입하기'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="flex flex-col items-center gap-6">
                        <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                            {isLogin ? "아직 회원이 아니신가요?" : "이미 계정이 있으신가요?"}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-primary hover:underline ml-2"
                            >
                                {isLogin ? 'WOW3D 회원가입' : '로그인하기'}
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.3em] text-white/10 uppercase">
                            <ShieldCheck className="w-3 h-3 text-emerald-500/30" />
                            암호화된 안전한 연결
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
