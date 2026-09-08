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
                {t('brandSub')}
                <span className="text-teal-400/90">{t('brandStore')}</span>
              </p>
            </div>
          </Link>

          <div className="space-y-4">
            <p className="text-teal-400 text-xs font-black uppercase tracking-[0.28em]">
              {t('eyebrow')}
            </p>
            <h1 className="text-4xl xl:text-[2.75rem] font-extrabold leading-[1.2] tracking-tight text-white">
              {t('heroTitleBefore')}
              <br />
              <span className="text-teal-300">{t('heroTitleAccent')}</span>
            </h1>
            <p className="text-white/50 text-[15px] leading-relaxed max-w-sm break-keep">
              {t('heroDesc')}
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
                <p className="text-sm font-semibold text-white/90">{t('featureQuoteTitle')}</p>
                <p className="text-xs text-white/40">{t('featureQuoteDesc')}</p>
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
                <p className="text-sm font-semibold text-white/90">{t('featureProcessTitle')}</p>
                <p className="text-xs text-white/40">{t('featureProcessDesc')}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center">
                <Camera className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">{t('featurePhotoTitle')}</p>
                <p className="text-xs text-white/40 break-keep">{t('featurePhotoDesc')}</p>
              </div>
            </motion.div>
          </div>

          <Link
            href="/guides/photo-to-3d-printing-quote"
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300/90 hover:text-indigo-200 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {t('guideLink')}
            <ArrowRight className="w-3 h-3" />
          </Link>
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
            {t('backToHome')}
          </Link>

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BrandMark size="sm" />
            <div>
              <p className="font-black text-lg leading-none">
                WOW3D<span className="text-teal-400 font-semibold ml-0.5">PRO</span>
              </p>
              <p className="text-[10px] text-white/45 mt-1">{t('mobileBrandSub')}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/40">
            {isPhotoQuoteReturn && (
              <div className="mb-6 rounded-2xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-3.5 space-y-1">
                <p className="text-sm font-bold text-indigo-100 break-keep">
                  {t('photoGateTitle')}
                </p>
                <p className="text-xs text-white/55 leading-relaxed break-keep">
                  {t('photoGateDesc')}
                </p>
              </div>
            )}

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
                {t('tabLogin')}
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
                {t('tabSignup')}
              </button>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-white/60">
                  {t('email')}
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
                        {t('name')}
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-teal-400 transition-colors" />
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-12 pl-12 bg-black/25 border-white/10 rounded-xl focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400/40 font-medium text-white"
                          placeholder={t('namePlaceholder')}
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-semibold text-white/60">
                        {t('phone')} <span className="text-white/35 font-normal">{t('phoneOptional')}</span>
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
                  {t('password')}
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
                  <span className="bg-[#12171f] px-3 text-white/35 rounded-full">{t('or')}</span>
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
                  {t('continueGoogle')}
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
                  {t('continueKakao')}
                </a>
              </div>
            </form>

            <div className="mt-6 rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.07] p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Camera className="w-4 h-4 text-indigo-300" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-bold text-white/90 break-keep">
                    {t('photoPromoTitle')}
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed break-keep">
                    {t('photoPromoDesc')}
                  </p>
                  <Link
                    href={photoQuoteReturn}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-indigo-200 pt-1"
                  >
                    {t('photoPromoLink')}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[12px] text-white/40">
            {isLogin ? t('switchToSignup') : t('switchToLogin')}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-teal-400 hover:text-teal-300 font-semibold underline-offset-2 hover:underline transition-colors"
            >
              {isLogin ? t('tabSignup') : t('tabLogin')}
            </button>
          </p>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/25">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('secureNote')}
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
