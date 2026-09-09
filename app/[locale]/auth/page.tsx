'use client'

import { useState, Suspense, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
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
  Camera,
  ImageIcon,
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
  const t = useTranslations('Auth')
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = safeAuthReturnPath(searchParams.get('return'), '') || undefined
  const isPhotoQuoteReturn = Boolean(returnTo?.includes('entry=photo'))
  const photoQuoteReturn = returnTo?.includes('entry=photo') ? returnTo : '/quote?entry=photo'
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
        if (!meRes.ok) throw new Error('token')
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
            t('toast.loginSuccess'),
            kakaoOAuth
              ? t('toast.kakaoWelcome', { name: user.name })
              : t('toast.welcome', { name: user.name })
          )
          router.replace(returnPath)
        }
      } catch {
        showToast.error(t('toast.loginProcessFail'), t('toast.tryAgain'))
        router.replace('/auth')
      }
    }
    run()
  }, [tokenFromUrl, returnPath, setUser, router, kakaoOAuth, t])

  useEffect(() => {
    if (sessionExpired) {
      showToast.error(t('toast.sessionExpiredTitle'), t('toast.sessionExpiredDesc'))
    } else if (authError === 'google_cancel') showToast.error(t('toast.googleCancel'), t('toast.tryAgain'))
    else if (authError === 'kakao_cancel') showToast.error(t('toast.kakaoCancel'), t('toast.tryAgain'))
    else if (authError === 'config')
      showToast.error(t('toast.configError'), t('toast.configErrorDesc'))
    else if (authError === 'db')
      showToast.error(t('toast.dbError'), t('toast.dbErrorDesc'))
    else if (authError === 'server') showToast.error(t('toast.serverError'), t('toast.serverErrorDesc'))
  }, [authError, sessionExpired, t])

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
        let msg = t('toast.loginFailDefault')
        try {
          const d = JSON.parse(text)
          if (d?.error && typeof d.error === 'string') msg = d.error
        } catch {
          if (text && text.length < 300) msg = text
          else if (response.status >= 500) msg = t('toast.serverErrorLong')
        }
        throw new Error(msg)
      }

      const result = await response.json()
      setUser(result.data.user, result.data.token)

      showToast.success(t('toast.loginSuccess'), t('toast.welcomeBack', { name: result.data.user.name }))

      const target = returnTo || (result.data.user?.role === 'admin' || result.data.user?.role === 'super_admin' ? '/admin' : '/')
      router.push(target)
    } catch (error) {
      showToast.error(
        t('toast.loginFail'),
        error instanceof Error ? error.message : t('toast.loginFailHint')
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
        let msg = t('toast.signupFailDefault')
        try {
          const d = JSON.parse(text)
          if (d?.error && typeof d.error === 'string') msg = d.error
        } catch {
          if (text && text.length < 300) msg = text
          else if (response.status >= 500) msg = t('toast.serverErrorLong')
        }
        throw new Error(msg)
      }

      const result = await response.json()
      setUser(result.data.user, result.data.token)

      showToast.success(t('toast.signupSuccess'), t('toast.signupSuccessDesc'))

      router.push(returnTo || '/')
    } catch (error) {
      showToast.error(
        t('toast.signupFail'),
        error instanceof Error ? error.message : t('toast.signupFailHint')
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
          <p className="text-sm text-white/60">{t('processing')}</p>
        </div>
      </div>
    )
  }

  const oauthQs = returnTo ? `?return=${encodeURIComponent(returnTo)}` : ''

  return (
    <div className="min-h-screen bg-[#070b12] text-white selection:bg-teal-400/30 flex relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-screen bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b12] via-[#0c1420] to-[#0a1018]" />
        <div className="absolute -top-40 -left-28 w-[520px] h-[520px] rounded-full bg-teal-500/12 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[460px] h-[460px] rounded-full bg-teal-700/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
      </div>

      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[48%] relative items-center justify-center p-12 xl:p-16 border-r border-white/[0.06]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[420px] w-full relative z-10 space-y-9"
        >
          <Link href="/" className="inline-flex items-center gap-3.5 group">
            <BrandMark size="lg" />
            <div>
              <p className="font-black text-[1.65rem] tracking-tight leading-none text-white">
                WOW3D<span className="text-teal-400 font-light ml-1">PRO</span>
              </p>
              <p className="text-[12px] text-white/60 font-medium mt-2">
                {t('brandSub')}
                <span className="text-teal-300">{t('brandStore')}</span>
              </p>
            </div>
          </Link>

          <div className="space-y-4">
            <p className="inline-flex items-center rounded-full border border-teal-400/25 bg-teal-400/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-teal-200 uppercase">
              {t('eyebrow')}
            </p>
            <h1 className="text-[2.15rem] xl:text-[2.55rem] font-extrabold leading-[1.2] tracking-tight text-white break-keep">
              {t('heroTitleBefore')}
              <br />
              <span className="text-teal-300">{t('heroTitleAccent')}</span>
            </h1>
            <p className="text-white/70 text-[15px] leading-relaxed max-w-sm break-keep">
              {t('heroDesc')}
            </p>
          </div>

          <ul className="space-y-2.5">
            {[
              { icon: Zap, title: t('featureQuoteTitle'), desc: t('featureQuoteDesc') },
              { icon: Printer, title: t('featureProcessTitle'), desc: t('featureProcessDesc') },
              { icon: Camera, title: t('featurePhotoTitle'), desc: t('featurePhotoDesc') },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
                className="flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-400/25 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-teal-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-xs text-white/55 mt-0.5 break-keep">{desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          <Link
            href="/guides/photo-to-3d-printing-quote"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            {t('guideLink')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 md:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-teal-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToHome')}
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-3 mb-7">
            <BrandMark size="sm" />
            <div>
              <p className="font-black text-lg leading-none">
                WOW3D<span className="text-teal-400 font-light ml-1">PRO</span>
              </p>
              <p className="text-[11px] text-white/55 mt-1.5">{t('mobileBrandSub')}</p>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-white/[0.1] bg-[#0e1520]/92 backdrop-blur-xl p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04]">
            {isPhotoQuoteReturn && (
              <div className="mb-6 rounded-2xl border border-teal-400/30 bg-teal-500/10 px-4 py-3.5 space-y-1">
                <p className="text-sm font-bold text-teal-50 break-keep">{t('photoGateTitle')}</p>
                <p className="text-xs text-white/65 leading-relaxed break-keep">{t('photoGateDesc')}</p>
              </div>
            )}

            <div className="flex p-1 rounded-2xl bg-black/40 border border-white/[0.06] mb-7">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-250 ${
                  isLogin
                    ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'text-white/50 hover:text-white/85'
                }`}
              >
                {t('tabLogin')}
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-250 ${
                  !isLogin
                    ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'text-white/50 hover:text-white/85'
                }`}
              >
                {t('tabSignup')}
              </button>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-white/70">
                  {t('email')}
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-teal-300 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-12 bg-white/[0.05] border-white/15 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-400/45 focus-visible:border-teal-400/50 font-medium placeholder:text-white/30 text-white"
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
                      <Label htmlFor="name" className="text-xs font-bold text-white/70">
                        {t('name')}
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-teal-300 transition-colors" />
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-12 pl-12 bg-white/[0.05] border-white/15 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-400/45 focus-visible:border-teal-400/50 font-medium text-white placeholder:text-white/30"
                          placeholder={t('namePlaceholder')}
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-bold text-white/70">
                        {t('phone')} <span className="text-white/40 font-normal">{t('phoneOptional')}</span>
                      </Label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-teal-300 transition-colors" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-12 pl-12 bg-white/[0.05] border-white/15 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-400/45 focus-visible:border-teal-400/50 font-medium text-white placeholder:text-white/30"
                          placeholder="010-0000-0000"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-white/70">
                  {t('password')}
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-teal-300 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-12 bg-white/[0.05] border-white/15 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-400/45 focus-visible:border-teal-400/50 font-medium text-white placeholder:text-white/30"
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black shadow-[0_10px_28px_rgba(45,212,191,0.28)] active:scale-[0.985] transition-all duration-200 border-0 mt-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isLogin ? t('submitLogin') : t('submitSignup')}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-[#0e1520] px-3 text-white/45 font-medium">{t('or')}</span>
                </div>
              </div>

              <div className="grid gap-2.5">
                <a
                  href={`/api/auth/google${oauthQs}`}
                  className="flex items-center justify-center gap-3 w-full h-11 rounded-xl bg-white/[0.96] hover:bg-white text-slate-800 font-semibold border border-white/20 transition-all text-sm"
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
                  {t('continueGoogle')}
                </a>
                <a
                  href={`/api/auth/kakao${oauthQs}`}
                  className="flex items-center justify-center gap-3 w-full h-11 rounded-xl bg-[#FEE500]/95 hover:bg-[#FEE500] text-[#191919] font-semibold border border-[#cbb700]/50 transition-all text-sm"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#191919"
                      d="M12 4.5c-4.15 0-7.5 2.69-7.5 6.01 0 2.28 1.5 4.28 3.75 5.36-.15.55-.97 3.55-.99 3.78 0 0-.02.16.08.22.11.06.24.01.24.01.31-.04 3.59-2.34 4.17-2.73.76.11 1.54.17 2.35.17 4.15 0 7.5-2.69 7.5-6.01S16.15 4.5 12 4.5z"
                    />
                  </svg>
                  {t('continueKakao')}
                </a>
              </div>
            </form>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3">
            {!isPhotoQuoteReturn && (
              <Link
                href={photoQuoteReturn}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-teal-300 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                {t('photoPromoLink')}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <p className="text-center text-[13px] text-white/55">
              {isLogin ? t('switchToSignup') : t('switchToLogin')}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-teal-300 hover:text-teal-200 font-bold underline-offset-2 hover:underline transition-colors"
              >
                {isLogin ? t('tabSignup') : t('tabLogin')}
              </button>
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400/70" />
              {t('secureNote')}
            </div>
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
