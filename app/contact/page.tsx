'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Send, User, Mail, Phone, MessageSquare, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
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

export default function ContactPage() {
  const { user, isAuthenticated, token } = useAuthStore()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name?.trim()) {
      toast({ title: '이름을 입력해 주세요.', variant: 'destructive' })
      return
    }
    if (!formData.email?.trim()) {
      toast({ title: '이메일을 입력해 주세요.', variant: 'destructive' })
      return
    }
    if (!formData.message?.trim()) {
      toast({ title: '문의 내용을 입력해 주세요.', variant: 'destructive' })
      return
    }
    if (formData.message.trim().length < 10) {
      toast({ title: '문의 내용은 10자 이상 입력해 주세요.', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          category: formData.category || undefined,
          subject: formData.subject.trim() || undefined,
          message: formData.message.trim(),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || '문의 접수에 실패했습니다.')
      }

      toast({
        title: '문의가 접수되었습니다.',
        description: '입력하신 이메일로 답변드리겠습니다.',
      })

      setFormData({ name: formData.name, email: formData.email, phone: '', category: '', subject: '', message: '' })
    } catch (err) {
      toast({
        title: '문의 접수 실패',
        description: err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white hover:bg-white/10 rounded-full px-4 text-[10px] font-black uppercase tracking-widest gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              홈으로
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight leading-none uppercase">문의하기</h1>
              <p className="text-white/40 text-sm">궁금한 점을 남겨 주시면 입력하신 이메일로 답변드립니다.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="name"
                    className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5"
                  >
                    <User className="w-3 h-3" /> 이름 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary px-5 font-bold"
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div className="space-y-2.5">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5"
                  >
                    <Mail className="w-3 h-3" /> 이메일 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary px-5 font-bold"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="phone"
                  className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5"
                >
                  <Phone className="w-3 h-3" /> 연락처 (선택)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary px-5 font-bold"
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> 문의 유형 (선택)
                </Label>
                <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary px-5 font-bold text-white">
                    <SelectValue placeholder="선택해 주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="subject"
                  className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5"
                >
                  제목 (선택)
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary px-5 font-bold"
                  placeholder="문의 제목"
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="message"
                  className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3 h-3" /> 문의 내용 <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="10자 이상 입력해 주세요."
                  rows={6}
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-sm font-bold ring-offset-black focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-white/10 resize-y min-h-[140px]"
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    문의 보내기
                    <Send className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
