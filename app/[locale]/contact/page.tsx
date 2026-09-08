'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Send, User, Mail, Phone, MessageSquare, FileText, HelpCircle, Home, Upload, Paperclip, X, ExternalLink } from 'lucide-react'
import { showToast } from '@/lib/toast-helper'
import { getNaverTalkTalkChatUrl } from '@/lib/naver-talktalk'
import { NaverTalkTalkIcon } from '@/components/icons/NaverTalkTalkIcon'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORY_KEYS = ['general', 'quote', 'tech', 'partnership', 'other'] as const

const MAX_FILES = 3
const MAX_FILE_BYTES = 50 * 1024 * 1024
const ALLOWED_EXT = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'pdf', 'zip',
  'stl', 'obj', '3mf', 'step', 'stp',
])

function getExt(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function RequiredBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-rose-500/20 border border-rose-400/40 px-2 py-0.5 text-[10px] font-black tracking-widest text-rose-300 uppercase">
      {label}
    </span>
  )
}

function OptionalBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-white/5 border border-white/15 px-2 py-0.5 text-[10px] font-black tracking-widest text-white/45 uppercase">
      {label}
    </span>
  )
}

function FieldLabel({
  htmlFor,
  icon,
  children,
  required,
  requiredLabel,
  optionalLabel,
}: {
  htmlFor?: string
  icon: ReactNode
  children: ReactNode
  required?: boolean
  requiredLabel: string
  optionalLabel: string
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[12px] font-black text-white/70 tracking-wide ml-1 flex items-center gap-2"
    >
      <span className="text-teal-400">{icon}</span>
      <span>{children}</span>
      {required ? <RequiredBadge label={requiredLabel} /> : <OptionalBadge label={optionalLabel} />}
    </Label>
  )
}

const requiredInputClass =
  'h-16 bg-white/[0.05] border-rose-400/25 border-l-[3px] border-l-rose-400 rounded-2xl focus:ring-rose-400/25 focus:border-rose-400/50 px-6 font-bold text-white text-lg transition-all'
const optionalInputClass =
  'h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:ring-teal-400/20 focus:border-teal-400/50 px-6 font-bold text-white text-lg transition-all'

export default function ContactPage() {
  const t = useTranslations('Contact')
  const router = useRouter()
  const { user, isAuthenticated, token } = useAuthStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    subject: '',
    message: '',
  })
  const talkUrl = getNaverTalkTalkChatUrl()

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }))
    }
  }, [isAuthenticated, user?.name, user?.email])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    e.target.value = ''
    if (!selected.length) return

    const next = [...files]
    for (const file of selected) {
      if (next.length >= MAX_FILES) {
        showToast.error(t('toast.fileCheck'), t('toast.fileMax', { max: MAX_FILES }))
        break
      }
      if (file.size > MAX_FILE_BYTES) {
        showToast.error(t('toast.fileCheck'), t('toast.fileTooLarge', { name: file.name }))
        continue
      }
      const ext = getExt(file.name)
      if (!ALLOWED_EXT.has(ext)) {
        showToast.error(t('toast.fileCheck'), t('toast.fileType', { name: file.name }))
        continue
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue
      next.push(file)
    }
    setFiles(next)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name?.trim()) {
      showToast.error(t('toast.inputCheck'), t('toast.needName'))
      return
    }
    if (!formData.email?.trim()) {
      showToast.error(t('toast.inputCheck'), t('toast.needEmail'))
      return
    }
    if (!formData.phone?.trim()) {
      showToast.error(t('toast.inputCheck'), t('toast.needPhone'))
      return
    }
    if (formData.phone.replace(/\D/g, '').length < 9) {
      showToast.error(t('toast.inputCheck'), t('toast.needValidPhone'))
      return
    }
    if (!formData.message?.trim()) {
      showToast.error(t('toast.inputCheck'), t('toast.needMessage'))
      return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', formData.name.trim())
      fd.append('email', formData.email.trim())
      fd.append('phone', formData.phone.trim())
      if (formData.category) fd.append('category', formData.category)
      if (formData.subject.trim()) fd.append('subject', formData.subject.trim())
      fd.append('message', formData.message.trim())
      for (const file of files) {
        fd.append('files', file)
      }

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || t('toast.submitFailDefault'))
      }

      showToast.success(t('toast.submitSuccess'), t('toast.submitSuccessDesc'))
      router.push('/')
    } catch (err) {
      showToast.error(t('toast.submitFail'), err)
      setIsSubmitting(false)
    }
  }

  const requiredLabel = t('required')
  const optionalLabel = t('optional')

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col selection:bg-teal-500/30 overflow-hidden relative font-sans">
        <Header />

        {/* Premium Background System */}
        <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-400/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[140px] animate-pulse" />
        </div>

        <div className="pt-40 pb-24 container mx-auto px-6 relative z-10">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    <div className="space-y-6 text-center">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 text-[11px] font-black uppercase tracking-[0.3em] mb-2">
                            <Mail className="w-4 h-4" /> {t('eyebrow')}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white">{t('title')}</h1>
                        <p className="text-white/40 text-lg font-bold max-w-2xl mx-auto leading-relaxed break-keep">
                            {t('subtitle')}
                        </p>
                    </div>

                    {talkUrl ? (
                        <a
                            href={talkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#03C75A]/10 border border-[#03C75A]/30 hover:bg-[#03C75A]/15 hover:border-[#03C75A]/50 transition-colors group"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="shrink-0 w-12 h-12 rounded-full bg-[#03C75A] flex items-center justify-center text-white shadow-lg shadow-[#03C75A]/25 ring-1 ring-white/90">
                                    <NaverTalkTalkIcon className="w-7 h-7" />
                                </div>
                                <div className="min-w-0 text-left">
                                    <p className="text-sm sm:text-base font-black text-white">{t('talkTitle')}</p>
                                    <p className="text-[11px] sm:text-xs font-medium text-white/45 mt-0.5">
                                        {t('talkDesc')}
                                    </p>
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[#03C75A] shrink-0 opacity-70 group-hover:opacity-100" />
                        </a>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Link href="/guides/3d-printing-turnaround-time" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">{t('guideLabel')}</p>
                            <h2 className="text-xl font-black text-white mb-2">{t('guideTurnaroundTitle')}</h2>
                            <p className="text-sm text-white/55 break-keep">{t('guideTurnaroundDesc')}</p>
                        </Link>
                        <Link href="/guides/fdm-vs-sla-vs-dlp" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">{t('compareLabel')}</p>
                            <h2 className="text-xl font-black text-white mb-2">{t('compareTitle')}</h2>
                            <p className="text-sm text-white/55 break-keep">{t('compareDesc')}</p>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10 p-10 md:p-16 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                            <Send className="w-40 h-40 text-teal-400" />
                        </div>

                        <div className="relative z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-rose-500/10 border border-rose-400/25 px-5 py-4">
                            <RequiredBadge label={requiredLabel} />
                            <p className="text-sm font-bold text-rose-100/90">
                              {t.rich('requiredBanner', {
                                required: (chunks) => <span className="text-rose-300">{chunks}</span>,
                              })}
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-3">
                                <FieldLabel htmlFor="name" icon={<User className="w-3.5 h-3.5" />} required requiredLabel={requiredLabel} optionalLabel={optionalLabel}>
                                  {t('name')}
                                </FieldLabel>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={requiredInputClass}
                                    placeholder={t('namePlaceholder')}
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <FieldLabel htmlFor="email" icon={<Mail className="w-3.5 h-3.5" />} required requiredLabel={requiredLabel} optionalLabel={optionalLabel}>
                                  {t('email')}
                                </FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={requiredInputClass}
                                    placeholder="example@email.com"
                                    required
                                />
                            </div>
                        </div>

                            <div className="space-y-3 relative z-10">
                                <FieldLabel htmlFor="phone" icon={<Phone className="w-3.5 h-3.5" />} required requiredLabel={requiredLabel} optionalLabel={optionalLabel}>
                                  {t('phone')}
                                </FieldLabel>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={requiredInputClass}
                                    placeholder="010-0000-0000"
                                    required
                                />
                            </div>

                            <div className="space-y-3 relative z-10">
                                <FieldLabel icon={<FileText className="w-3.5 h-3.5" />} requiredLabel={requiredLabel} optionalLabel={optionalLabel}>
                                  {t('category')}
                                </FieldLabel>
                                <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                                    <SelectTrigger className={optionalInputClass}>
                                        <SelectValue placeholder={t('categoryPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white font-bold">
                                        {CATEGORY_KEYS.map((key) => (
                                            <SelectItem key={key} value={key} className="focus:bg-teal-400 focus:text-slate-950">
                                                {t(`categories.${key}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3 relative z-10">
                                <FieldLabel htmlFor="subject" icon={<FileText className="w-3.5 h-3.5" />} requiredLabel={requiredLabel} optionalLabel={optionalLabel}>
                                  {t('subject')}
                                </FieldLabel>
                                <Input
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    className={optionalInputClass}
                                    placeholder={t('subjectPlaceholder')}
                                />
                            </div>

                            <div className="space-y-3 relative z-10">
                                <FieldLabel htmlFor="message" icon={<MessageSquare className="w-3.5 h-3.5" />} required requiredLabel={requiredLabel} optionalLabel={optionalLabel}>
                                  {t('message')}
                                </FieldLabel>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder={t('messagePlaceholder')}
                                    rows={6}
                                    className="w-full px-6 py-6 rounded-[1.5rem] bg-white/[0.05] border border-rose-400/25 border-l-[3px] border-l-rose-400 text-lg font-bold text-white ring-offset-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-400/25 focus:border-rose-400/50 transition-all placeholder:text-white/10 resize-none min-h-[180px]"
                                    required
                                />
                            </div>

                            <div className="space-y-3 relative z-10">
                                <FieldLabel icon={<Upload className="w-3.5 h-3.5" />} requiredLabel={requiredLabel} optionalLabel={optionalLabel}>
                                  {t('attachLabel', { max: MAX_FILES })}
                                </FieldLabel>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.zip,.stl,.obj,.3mf,.step,.stp,image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        aria-label={t('attachAria')}
                                    />
                                    <div className="min-h-24 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center gap-4 px-6 py-5 group-hover:border-teal-400/50 group-hover:bg-teal-400/5 transition-all duration-300">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-teal-400 transition-colors shrink-0">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <div className="text-left min-w-0 flex-1">
                                            <p className="text-sm font-black text-white/50 group-hover:text-white transition-colors">
                                                {files.length
                                                    ? t('filesSelected', { count: files.length })
                                                    : t('filesEmpty')}
                                            </p>
                                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-0.5">
                                                {t('filesHint', { max: MAX_FILES })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {files.length > 0 && (
                                    <ul className="space-y-2">
                                        {files.map((f, i) => (
                                            <li
                                                key={`${f.name}-${f.size}-${i}`}
                                                className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3"
                                            >
                                                <Paperclip className="w-4 h-4 text-teal-400 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-white/80 truncate">{f.name}</p>
                                                    <p className="text-[10px] text-white/30 font-bold">{formatFileSize(f.size)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(i)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-white/40 hover:text-white transition-colors"
                                                    aria-label={t('removeFileAria', { name: f.name })}
                                                >
                                                    <X className="w-3.5 h-3.5" /> {t('removeFile')}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="pt-4 relative z-10">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isSubmitting}
                                    className="w-full h-20 rounded-[1.5rem] bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-[0.2em] gap-3 text-xl shadow-[0_20px_50px_rgba(45,212,191,0.2)] transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    ) : (
                                        <>
                                            {t('submit')}
                                            <Send className="w-6 h-6" />
                                        </>
                                    )}
                                </Button>
                            </div>
                    </form>

                    <div className="text-center space-y-4 relative z-10">
                        <p className="text-white/20 text-sm font-bold">{t('footerNote')}</p>
                        <div className="flex justify-center gap-6">
                            <Link href="/qna" className="text-[12px] font-black text-teal-400/60 hover:text-teal-400 uppercase tracking-widest transition-colors flex items-center gap-2 group">
                                <HelpCircle className="w-3.5 h-3.5" /> {t('faqLink')}
                            </Link>
                            <span className="text-white/10">|</span>
                            <Link href="/" className="text-[12px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                                <Home className="w-3.5 h-3.5" /> {t('homeLink')}
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>

        <Footer />
    </main>
  )
}
