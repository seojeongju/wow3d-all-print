'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  Boxes,
  Zap,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Printer,
} from 'lucide-react'
import { showToast } from '@/lib/toast-helper'
import { safeAuthReturnPath } from '@/lib/auth-session'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box =
    size === 'lg' ? 'w-14 h-14 rounded-2xl' : size === 'sm' ? 'w-9 h-9 rounded-xl' : 'w-12 h-12 rounded-2xl'
  const icon = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  return (
    <div
      className={`${box} bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0`}
    >
      <Boxes className={`${icon} text-white`} />
    </div>
  )
}

function AuthContent() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = safeAuthReturnPath(searchParams.get('return'), '') || undefined
  const tokenFromUrl = searchParams.get('token')
  const returnPath = safeAuthReturnPath(searchParams.get('return'), '/')
  const authError = searchParams.get('error')
  const sessionExpired = searchParams.get('expired') === 'true'
  const kakaoOAuth = searchParams.get('kakao') === '1'

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
          showToast.success(
            '로그인 성공',
            kakaoOAuth
              ? `${user.name}님, 카카오 계정으로 로그인했습니다.`
              : `${user.name}님, 환영합니다.`
          )
          router.replace(returnPath)
        }
      } catch {
        showToast.error('로그인 처리 실패', '다시 시도해 주세요.')
        router.replace('/auth')
      }
    }
    run()
  }, [tokenFromUrl, returnPath, setUser, router, kakaoOAuth])

  useEffect(() => {
    if (sessionExpired) {
      showToast.error('로그인 만료', '세션이 만료되었습니다. 다시 로그인해 주세요.')
    } else if (authError === 'google_cancel') showToast.error('Google 로그인 취소', '다시 시도해 주세요.')
    else if (authError === 'kakao_cancel') showToast.error('카카오 로그인 취소', '다시 시도해 주세요.')
    else if (authError === 'config')
      showToast.error('로그인 설정 오류', '소셜 로그인 환경 변수를 확인해 주세요.')
    else if (authError === 'db')
      showToast.error('데이터베이스 오류', '소셜 로그인용 DB 설정이 필요합니다. 관리자에게 문의하세요.')
    else if (authError === 'server') showToast.error('일시 오류', '잠시 후 다시 시도해 주세요.')
  }, [authError, sessionExpired])

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

      const target = returnTo || (result.data.user?.role === 'admin' || result.data.user?.role === 'super_admin' ? '/admin' : '/')
      router.push(target)
    } catch (error) {
      showToast.error(
        '로그인 실패',
        error instanceof Error ? error.message : '이메일 또는 비밀번호를 확인해 주세요.'
      )
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

      router.push(returnTo || '/')
    } catch (error) {
      showToast.error(
        '회원가입 실패',
        error instanceof Error ? error.message : '입력 내용을 확인해 주세요.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenFromUrl) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <BrandMark />
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-sm text-white/60">로그인 처리 중...</p>
        </div>
      </div>
    )
  }

  const oauthQs = returnTo ? `?return=${encodeURIComponent(returnTo)}` : ''

  return (
    <div className="min-h-screen bg-[#0d1117] text-white selection:bg-teal-400/30 flex relative overflow-hidden">
      {/* Atmosphere — teal brand, not purple */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-screen bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        />
        <div className="absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full bg-teal-500/15 blur-[110px]" />
        <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full bg-teal-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_20%,rgba(20,184,166,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      </div>

      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative items-center justify-center p-12 xl:p-16 border-r border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full relative z-10 space-y-10"
        >
          <Link href="/" className="inline-flex items-center gap-3 group">
            <BrandMark size="lg" />
            <div>
              <p className="font-black text-2xl tracking-tight leading-none text-white group-hover:text-teal-50 transition-colors">
                WOW3D<span className="text-teal-400 font-semibold ml-0.5">PRO</span>
              </p>
              <p className="text-[11px] text-white/55 font-medium mt-1.5">
                (주)와우쓰리디 / <span className="text-teal-400/90">3D쿠키홍대</span>
              </p>
            </div>
          </Link>

          <div className="space-y-4">
            <p className="text-teal-400 text-xs font-black uppercase tracking-[0.28em]">
              3D 프린팅 자동 견적
            </p>
            <h1 className="text-4xl xl:text-[2.75rem] font-extrabold leading-[1.2] tracking-tight text-white">
              파일 올리면,
              <br />
              <span className="text-teal-300">견적까지 바로.</span>
            </h1>
            <p className="text-white/50 text-[15px] leading-relaxed max-w-sm">
              STL·OBJ·STEP 업로드만으로 실시간 견적을 확인하고, 산업용 품질로 제작까지 이어가세요.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-400/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">초단위 실시간 견적</p>
                <p className="text-xs text-white/40">부피·소재·공정 반영</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-400/20 flex items-center justify-center">
                <Printer className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">FDM · SLA · DLP</p>
                <p className="text-xs text-white/40">용도에 맞는 공정 선택</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 md:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-teal-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            메인으로
          </Link>

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BrandMark size="sm" />
            <div>
              <p className="font-black text-lg leading-none">
                WOW3D<span className="text-teal-400 font-semibold ml-0.5">PRO</span>
              </p>
              <p className="text-[10px] text-white/45 mt-1">3D 프린팅 자동 견적</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/40">
            <div className="flex p-1 rounded-2xl bg-black/30 border border-white/5 mb-8">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isLogin
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                    : 'text-white/45 hover:text-white/80'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  !isLogin
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                    : 'text-white/45 hover:text-white/80'
                }`}
              >
                회원가입
              </button>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-white/60">
                  이메일
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-teal-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-12 bg-black/25 border-white/10 rounded-xl focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400/40 font-medium placeholder:text-white/20 text-white"
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
                    transition={{ duration: 0.28 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-semibold text-white/60">
                        이름
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-teal-400 transition-colors" />
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-12 pl-12 bg-black/25 border-white/10 rounded-xl focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400/40 font-medium text-white"
                          placeholder="홍길동"
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-semibold text-white/60">
                        전화번호 <span className="text-white/35 font-normal">(선택)</span>
                      </Label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-teal-400 transition-colors" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-12 pl-12 bg-black/25 border-white/10 rounded-xl focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400/40 font-medium text-white"
                          placeholder="010-0000-0000"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-white/60">
                  비밀번호
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-teal-400 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-12 bg-black/25 border-white/10 rounded-xl focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400/40 font-medium text-white"
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold shadow-lg shadow-teal-500/25 hover:shadow-teal-400/30 active:scale-[0.98] transition-all duration-200 border-0 mt-2"
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

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-[#12171f] px-3 text-white/35 rounded-full">또는</span>
                </div>
              </div>

              <div className="grid gap-2.5">
                <a
                  href={`/api/auth/google${oauthQs}`}
                  className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-white hover:bg-white/95 text-gray-800 font-semibold border border-white/20 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google로 계속하기
                </a>
                <a
                  href={`/api/auth/kakao${oauthQs}`}
                  className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-[#FEE500] hover:bg-[#ffe033] text-[#191919] font-semibold border border-[#e6cf00]/80 transition-all"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#191919"
                      d="M12 4.5c-4.15 0-7.5 2.69-7.5 6.01 0 2.28 1.5 4.28 3.75 5.36-.15.55-.97 3.55-.99 3.78 0 0-.02.16.08.22.11.06.24.01.24.01.31-.04 3.59-2.34 4.17-2.73.76.11 1.54.17 2.35.17 4.15 0 7.5-2.69 7.5-6.01S16.15 4.5 12 4.5z"
                    />
                  </svg>
                  카카오로 계속하기
                </a>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-[12px] text-white/40">
            {isLogin ? '아직 회원이 아니에요?' : '이미 계정이 있어요?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-teal-400 hover:text-teal-300 font-semibold underline-offset-2 hover:underline transition-colors"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/25">
            <ShieldCheck className="w-3.5 h-3.5" />
            암호화된 안전한 연결 · WOW3D PRO
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-teal-400/30 border-t-teal-400 animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  )
}
