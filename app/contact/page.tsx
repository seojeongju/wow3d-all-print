'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Send, User, Mail, Phone, MessageSquare, FileText, HelpCircle, Home, Upload, Paperclip, X } from 'lucide-react'
import { showToast } from '@/lib/toast-helper'
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

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'general', label: '일반 문의' },
  { value: 'quote', label: '견적·제작' },
  { value: 'tech', label: '기술·파일' },
  { value: 'partnership', label: '파트너십' },
  { value: 'other', label: '기타' },
]

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

export default function ContactPage() {
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
        showToast.error('파일 확인', `첨부 파일은 최대 ${MAX_FILES}개까지 가능합니다.`)
        break
      }
      if (file.size > MAX_FILE_BYTES) {
        showToast.error('파일 확인', `${file.name}: 50MB 이하여야 합니다.`)
        continue
      }
      const ext = getExt(file.name)
      if (!ALLOWED_EXT.has(ext)) {
        showToast.error('파일 확인', `${file.name}: 지원하지 않는 형식입니다.`)
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
      showToast.error('입력 확인', '이름을 입력해 주세요.')
      return
    }
    if (!formData.email?.trim()) {
      showToast.error('입력 확인', '이메일을 입력해 주세요.')
      return
    }
    if (!formData.phone?.trim()) {
      showToast.error('입력 확인', '연락처를 입력해 주세요.')
      return
    }
    if (formData.phone.replace(/\D/g, '').length < 9) {
      showToast.error('입력 확인', '올바른 연락처를 입력해 주세요.')
      return
    }
    if (!formData.message?.trim()) {
      showToast.error('입력 확인', '문의 내용을 입력해 주세요.')
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
        throw new Error(json.error || '문의 접수에 실패했습니다.')
      }

      showToast.success('문의가 접수되었습니다.', '입력하신 이메일로 답변드리겠습니다.')
      router.push('/')
    } catch (err) {
      showToast.error('문의 접수 실패', err)
      setIsSubmitting(false)
    }
  }

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
                            <Mail className="w-4 h-4" /> Support Center
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white">문의하기</h1>
                        <p className="text-white/40 text-lg font-bold max-w-xl mx-auto leading-relaxed break-keep">전문 기술 지원팀이 귀하의 비즈니스를 지원하기 위해 대기 중입니다.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10 p-10 md:p-16 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                            <Send className="w-40 h-40 text-teal-400" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-3">
                                <Label
                                    htmlFor="name"
                                    className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2"
                                >
                                    <User className="w-3.5 h-3.5 text-teal-400" /> 이름 <span className="text-teal-400">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:ring-teal-400/20 focus:border-teal-400/50 px-6 font-bold text-white text-lg transition-all"
                                    placeholder="이름을 입력하세요"
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <Label
                                    htmlFor="email"
                                    className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2"
                                >
                                    <Mail className="w-3.5 h-3.5 text-teal-400" /> 이메일 <span className="text-teal-400">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:ring-teal-400/20 focus:border-teal-400/50 px-6 font-bold text-white text-lg transition-all"
                                    placeholder="example@email.com"
                                    required
                                />
                            </div>
                        </div>

                            <div className="space-y-3">
                                <Label
                                    htmlFor="phone"
                                    className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2"
                                >
                                    <Phone className="w-3.5 h-3.5 text-teal-400" /> 연락처 <span className="text-teal-400">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:ring-teal-400/20 focus:border-teal-400/50 px-6 font-bold text-white text-lg transition-all"
                                    placeholder="010-0000-0000"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-teal-400" /> 문의 유형 (선택)
                                </Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                                    <SelectTrigger className="h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:ring-teal-400/20 focus:border-teal-400/50 px-6 font-black text-white text-lg transition-all">
                                        <SelectValue placeholder="카테고리를 선택하세요" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white font-bold">
                                        {CATEGORY_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value} className="focus:bg-teal-400 focus:text-slate-950">
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label
                                    htmlFor="subject"
                                    className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2"
                                >
                                    <FileText className="w-3.5 h-3.5 text-teal-400" /> 제목 (선택)
                                </Label>
                                <Input
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    className="h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:ring-teal-400/20 focus:border-teal-400/50 px-6 font-bold text-white text-lg transition-all"
                                    placeholder="문의 주제를 입력하세요"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label
                                    htmlFor="message"
                                    className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2"
                                >
                                    <MessageSquare className="w-3.5 h-3.5 text-teal-400" /> 문의 내용 <span className="text-teal-400">*</span>
                                </Label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="상세 내용을 입력해 주세요."
                                    rows={6}
                                    className="w-full px-6 py-6 rounded-[1.5rem] bg-white/[0.05] border border-white/10 text-lg font-bold text-white ring-offset-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/50 transition-all placeholder:text-white/10 resize-none min-h-[180px]"
                                    required
                                />
                            </div>

                            <div className="space-y-3 relative z-10">
                                <Label className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Upload className="w-3.5 h-3.5 text-teal-400" /> 파일·이미지 첨부 (선택, 최대 {MAX_FILES}개)
                                </Label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.zip,.stl,.obj,.3mf,.step,.stp,image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        aria-label="문의 첨부 파일"
                                    />
                                    <div className="min-h-24 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center gap-4 px-6 py-5 group-hover:border-teal-400/50 group-hover:bg-teal-400/5 transition-all duration-300">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-teal-400 transition-colors shrink-0">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <div className="text-left min-w-0 flex-1">
                                            <p className="text-sm font-black text-white/50 group-hover:text-white transition-colors">
                                                {files.length
                                                    ? `${files.length}개 선택됨 · 추가하려면 다시 클릭`
                                                    : '파일을 클릭하거나 여기로 드래그하세요'}
                                            </p>
                                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-0.5">
                                                Max {MAX_FILES} files · 각 50MB · JPG PNG PDF ZIP STL OBJ 3MF STEP
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
                                                    aria-label={`${f.name} 삭제`}
                                                >
                                                    <X className="w-3.5 h-3.5" /> 삭제
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="pt-4">
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
                                            문의 메시지 보내기
                                            <Send className="w-6 h-6" />
                                        </>
                                    )}
                                </Button>
                            </div>
                    </form>

                    <div className="text-center space-y-4 relative z-10">
                        <p className="text-white/20 text-sm font-bold">문의 접수 시 관리자 승인 후 기재하신 이메일로 회신이 발송됩니다.</p>
                        <div className="flex justify-center gap-6">
                            <Link href="/qna" className="text-[12px] font-black text-teal-400/60 hover:text-teal-400 uppercase tracking-widest transition-colors flex items-center gap-2 group">
                                <HelpCircle className="w-3.5 h-3.5" /> 자주 묻는 질문 확인
                            </Link>
                            <span className="text-white/10">|</span>
                            <Link href="/" className="text-[12px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                                <Home className="w-3.5 h-3.5" /> 메인으로 돌아가기
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
