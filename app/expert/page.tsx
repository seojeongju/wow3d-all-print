'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Sparkles, 
    Send, 
    Upload, 
    CheckCircle2, 
    Layers, 
    Zap, 
    Settings, 
    Palette, 
    ShieldCheck, 
    ArrowRight,
    Loader2,
    FileText,
    Building2,
    User,
    Mail,
    Phone,
    Box
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showToast } from '@/lib/toast-helper'
import { SHOWCASE_DEFAULTS, type ShowcaseSlug } from '@/lib/showcase'

const SHOWCASE_ICONS: Record<ShowcaseSlug, React.ReactNode> = {
    industrial: <Settings className="w-8 h-8" />,
    medical: <ShieldCheck className="w-8 h-8" />,
    art: <Palette className="w-8 h-8" />,
    architecture: <Building2 className="w-8 h-8" />,
}

type ShowcaseCard = {
    slug: ShowcaseSlug
    title: string
    desc: string
    image: string
    features: string[]
}

function buildFallbackShowcaseCards(): ShowcaseCard[] {
    return SHOWCASE_DEFAULTS.map((d) => ({
        slug: d.slug,
        title: d.defaultTitle,
        desc: d.defaultDescription,
        image: d.fallbackImage,
        features: d.defaultFeatures,
    }))
}

const PROCESS_STEPS = [
    { title: "상담 및 기획", desc: "제품의 용도와 요구사항을 정밀 분석합니다." },
    { title: "설계 및 모델링", desc: "3D 데이터를 생성하거나 최적화 설계를 진행합니다." },
    { title: "시제품 제작", desc: "선택된 소재와 공법으로 실제 동작 모델을 출력합니다." },
    { title: "검수 및 양산", desc: "최종 품질 검사 후 납품 또는 대량 생산을 진행합니다." }
]

export default function ExpertServicePage() {
    const [showcaseCards, setShowcaseCards] = useState<ShowcaseCard[]>(buildFallbackShowcaseCards)

    useEffect(() => {
        fetch('/api/showcase/categories')
            .then((r) => r.json())
            .then((j) => {
                if (j?.success && Array.isArray(j.data?.items)) {
                    setShowcaseCards(
                        j.data.items.map(
                            (it: {
                                slug: string
                                title: string
                                description: string
                                features: string[]
                                cardImageUrl: string
                            }) => ({
                                slug: it.slug as ShowcaseSlug,
                                title: it.title,
                                desc: it.description,
                                image: it.cardImageUrl,
                                features: it.features,
                            })
                        )
                    )
                }
            })
            .catch(() => {})
    }, [])

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        category: 'development',
        message: ''
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.email || !formData.message) {
            showToast.error('입력 확인', '필수 항목을 모두 입력해 주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            const fd = new FormData()
            fd.append('name', formData.name)
            fd.append('email', formData.email)
            fd.append('phone', formData.phone)
            fd.append('company', formData.company)
            fd.append('category', formData.category)
            fd.append('message', formData.message)
            if (file) fd.append('file', file)

            const res = await fetch('/api/expert/inquiry', {
                method: 'POST',
                body: fd
            })

            const data = await res.json()
            if (res.ok) {
                showToast.success('접수 완료', '전문가가 검토 후 빠른 시일 내에 연락드리겠습니다.')
                setFormData({ name: '', email: '', phone: '', company: '', category: 'development', message: '' })
                setFile(null)
            } else {
                throw new Error(data.error || '접수에 실패했습니다.')
            }
        } catch (err: any) {
            showToast.error('오류 발생', err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col selection:bg-teal-500/30 overflow-hidden relative font-sans">
            <Header />

            {/* Premium Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05]" />
                <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[140px] animate-pulse" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-60 pb-32 px-6 z-10">
                <div className="container mx-auto max-w-6xl text-center space-y-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-teal-400/20 border border-teal-400/30 text-teal-300 text-xs font-black uppercase tracking-[0.4em] mb-4"
                    >
                        <Sparkles className="w-4 h-4" /> Customized Manufacturing
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-9xl font-black tracking-tighter leading-[1] text-white"
                    >
                        상상을 현실로,<br /><span className="text-teal-400">제품개발 전문가</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/50 text-xl md:text-2xl font-bold max-w-2xl mx-auto break-keep leading-[1.8] tracking-tight"
                    >
                        아이디어 설계부터 최종 양산까지, 와우쓰리디의 숙련된 엔지니어가 최적의 솔루션을 제공합니다.
                    </motion.p>
                </div>
            </section>

            {/* Product Category Showcase */}
            <section className="relative py-48 px-6 z-10">
                <div className="container mx-auto max-w-7xl space-y-24">
                    <div className="text-center space-y-6">
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">3D프린터 활용 제품 <span className="text-teal-400">쇼케이스</span></h2>
                        <div className="w-32 h-1.5 bg-teal-400 mx-auto rounded-full" />
                        <p className="text-sm text-white/40 font-bold max-w-lg mx-auto break-keep">
                            카드를 클릭하면 분야별 제작 예시·샘플 페이지로 이동합니다.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {showcaseCards.map((cat, idx) => (
                            <Link
                                key={cat.slug}
                                href={`/expert/showcase/${cat.slug}`}
                                className="block rounded-[3rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="group relative rounded-[3rem] bg-white/[0.03] border border-white/10 p-3 overflow-hidden hover:bg-white/[0.08] hover:border-teal-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-400/10 hover:-translate-y-3 cursor-pointer h-full"
                                >
                                    <div className="relative h-72 rounded-[2.5rem] overflow-hidden mb-8">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                        <img
                                            src={cat.image}
                                            alt={cat.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-3d.svg';
                                            }}
                                        />
                                        <div className="absolute bottom-8 left-8 z-20 text-white">
                                            <div className="w-14 h-14 rounded-2xl bg-teal-400/20 backdrop-blur-xl border border-teal-400/40 flex items-center justify-center mb-4 group-hover:bg-teal-400 group-hover:text-slate-950 transition-all duration-500">
                                                {SHOWCASE_ICONS[cat.slug]}
                                            </div>
                                            <h3 className="text-2xl font-black tracking-tight group-hover:text-teal-400 transition-colors">
                                                {cat.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="px-8 pb-8 space-y-6">
                                        <p className="text-sm font-bold text-white/50 leading-[1.8] min-h-[60px] break-keep">{cat.desc}</p>
                                        <ul className="space-y-3">
                                            {cat.features.map((f, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-3 text-[13px] font-black text-teal-400/70 group-hover:text-teal-400 transition-colors tracking-tight"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 shadow-sm" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="relative py-48 px-6 z-10 bg-white/[0.02]">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-12">
                            <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">빠르고 정확한<br /><span className="text-teal-400">원스톱 프로세스</span></h2>
                            <p className="text-white/40 text-xl font-bold leading-relaxed max-w-lg">복잡한 절차를 획기적으로 줄였습니다. 도면 한 장으로 시작하는 가장 빠른 제품 출시.</p>
                            <div className="space-y-8">
                                {PROCESS_STEPS.map((step, idx) => (
                                    <div key={idx} className="flex gap-8 group">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-2xl font-black text-white group-hover:bg-teal-400 group-hover:text-slate-950 transition-all">
                                            {idx + 1}
                                        </div>
                                        <div className="space-y-1.5">
                                            <h4 className="text-xl font-black text-white">{step.title}</h4>
                                            <p className="text-base font-bold text-white/30 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative aspect-square rounded-[5rem] border border-teal-400/20 overflow-hidden shadow-2xl bg-slate-900 group">
                             {/* Stylized Local Static Asset Representation */}
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)] opacity-50" />
                             <div className="absolute inset-0 flex items-center justify-center p-16">
                                <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40 group-hover:opacity-70 transition-opacity duration-700">
                                    <path d="M200 50L350 130V270L200 350L50 270V130L200 50Z" stroke="#2dd4bf" stroke-width="4" stroke-dasharray="10 10"/>
                                    <circle cx="200" cy="200" r="80" stroke="#2dd4bf" stroke-width="2" />
                                    <path d="M200 120V280M120 200H280" stroke="#2dd4bf" stroke-width="2" stroke-opacity="0.5"/>
                                </svg>
                             </div>
                             <div className="absolute inset-0 bg-gradient-to-t from-teal-400/20 to-transparent mix-blend-overlay" />
                             <div className="absolute bottom-12 left-12 p-8 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] max-w-[240px]">
                                <div className="text-[11px] font-black text-teal-400 uppercase tracking-[0.3em] mb-2">Precision Logic</div>
                                <div className="text-sm font-bold text-white/80 leading-relaxed">디지털 설계가 현실이 되는 가장 완벽한 과정</div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Inquiry Form Section */}
            <section className="relative py-48 px-6 z-10" id="inquiry">
                <div className="container mx-auto max-w-4xl">
                    <div className="p-12 md:p-20 rounded-[5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl space-y-16">
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-teal-400/10 border border-teal-400/20 flex items-center justify-center mx-auto text-teal-400 mb-8">
                                <Zap className="w-12 h-12 fill-current" />
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">전문가 무료 상담</h2>
                            <p className="text-white/40 font-bold text-lg max-w-xl mx-auto leading-relaxed">도면이 없어도 괜찮습니다. 현재 상황을 기술해 주시면 전문 컨설턴트가 24시간 내에 연락드립니다.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid gap-8">
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-teal-400" /> 이름 *
                                    </Label>
                                    <Input 
                                        placeholder="홍길동"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:border-teal-400/50 focus:ring-teal-400/20 px-6 font-bold text-lg transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-teal-400" /> 이메일 *
                                    </Label>
                                    <Input 
                                        type="email"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:border-teal-400/50 focus:ring-teal-400/20 px-6 font-bold text-lg transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-teal-400" /> 연락처
                                    </Label>
                                    <Input 
                                        placeholder="010-0000-0000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:border-teal-400/50 focus:ring-teal-400/20 px-6 font-bold text-lg transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 text-teal-400" /> 업체/기관명
                                    </Label>
                                    <Input 
                                        placeholder="와우쓰리디"
                                        value={formData.company}
                                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                                        className="h-16 bg-white/[0.05] border-white/10 rounded-2xl focus:border-teal-400/50 focus:ring-teal-400/20 px-6 font-bold text-lg transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-teal-400" /> 개발 상세 내용 *
                                </Label>
                                <textarea 
                                    rows={6}
                                    placeholder="개발하고자 하는 제품의 용도, 사이즈, 수량 등을 상세히 남겨주세요."
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    className="w-full bg-white/[0.05] border-white/10 rounded-3xl focus:ring-2 focus:ring-teal-400 focus:outline-none p-6 font-bold text-lg text-white resize-none"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Upload className="w-3.5 h-3.5 text-teal-400" /> 관련 파일 (도면/이미지)
                                </Label>
                                <div className="relative group cursor-pointer">
                                    <input 
                                        type="file" 
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="h-24 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center gap-4 group-hover:border-teal-400/50 group-hover:bg-teal-400/5 transition-all duration-300">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-teal-400 transition-colors">
                                            {file ? <Box className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white/50 group-hover:text-white transition-colors">{file ? file.name : "파일을 클릭하거나 여기로 드래그 하세요"}</p>
                                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-0.5">Max size: 50MB (ZIP, STL, STEP, JPG, PNG)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                                className="h-20 rounded-3xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black text-xl uppercase tracking-[0.2em] gap-4 shadow-2xl shadow-teal-400/20 active:scale-95 transition-all disabled:opacity-50 mt-4"
                            >
                                {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <>문의 메시지 보내기 <Send className="w-6 h-6" /></>}
                            </Button>
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
