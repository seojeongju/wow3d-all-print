'use client'

import { useState } from 'react'
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

const PRODUCT_CATEGORIES = [
    {
        title: "산업용 부품 & 지그(Jig)",
        desc: "최종 생산 라인에 즉시 투입 가능한 고강도 엔지니어링 플라스틱 부품 제조",
        icon: <Settings className="w-8 h-8" />,
        image: "https://images.unsplash.com/photo-1581093588401-fbb48a10bc04?auto=format&fit=crop&q=80&w=800",
        features: ["기능성 검증", "생산 공정 최적화", "경량화 설계"]
    },
    {
        title: "의료 & 덴탈 솔루션",
        desc: "CT/MRI 데이터를 기반으로 한 안면 모델링 및 맞춤형 수술 가이드 제작",
        icon: <ShieldCheck className="w-8 h-8" />,
        image: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?auto=format&fit=crop&q=80&w=800",
        features: ["생체 적합 소재", "1:1 맞춤 제작", "고정밀 출력"]
    },
    {
        title: "아트 & 캐릭터 피규어",
        desc: "복잡한 디테일의 예술 작품 및 게임/애니메이션 캐릭터 풀컬러/고해상도 구현",
        icon: <Palette className="w-8 h-8" />,
        image: "https://images.unsplash.com/photo-1628155232283-c000c82869fb?auto=format&fit=crop&q=80&w=800",
        features: ["정밀 디테일", "후가공 전문성", "풀컬러 지원"]
    },
    {
        title: "건축 & 목업(Mock-up)",
        desc: "분양 단지 모형 및 신제품 출시 전 디자인 검토를 위한 화이트 데스크 목업",
        icon: <Building2 className="w-8 h-8" />,
        image: "https://images.unsplash.com/photo-1503387762-592dea58f230?auto=format&fit=crop&q=80&w=800",
        features: ["대형 출력 지원", "정밀 스케일", "재질감 구현"]
    }
]

const PROCESS_STEPS = [
    { title: "상담 및 기획", desc: "제품의 용도와 요구사항을 정밀 분석합니다." },
    { title: "설계 및 모델링", desc: "3D 데이터를 생성하거나 최적화 설계를 진행합니다." },
    { title: "시제품 제작", desc: "선택된 소재와 공법으로 실제 동작 모델을 출력합니다." },
    { title: "검수 및 양산", desc: "최종 품질 검사 후 납품 또는 대량 생산을 진행합니다." }
]

export default function ExpertServicePage() {
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
            <section className="relative pt-48 pb-24 px-6 z-10">
                <div className="container mx-auto max-w-6xl text-center space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 text-[11px] font-black uppercase tracking-[0.4em] mb-4"
                    >
                        <Sparkles className="w-4 h-4" /> Customized Manufacturing
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-8xl font-black tracking-tight leading-[1.1] text-white"
                    >
                        상상을 현실로,<br /><span className="text-teal-400">제품개발 전문가</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 text-xl font-bold max-w-2xl mx-auto break-keep leading-relaxed"
                    >
                        아이디어 설계부터 최종 양산까지, 와우쓰리디의 숙련된 엔지니어가 최적의 솔루션을 제공합니다.
                    </motion.p>
                </div>
            </section>

            {/* Product Category Showcase */}
            <section className="relative py-32 px-6 z-10">
                <div className="container mx-auto max-w-7xl space-y-20">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black text-white">3D프린터 활용 제품 <span className="text-teal-400">쇼케이스</span></h2>
                        <div className="w-20 h-1.5 bg-teal-400 mx-auto rounded-full" />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {PRODUCT_CATEGORIES.map((cat, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-2 overflow-hidden hover:bg-white/[0.08] hover:border-teal-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-400/10 hover:-translate-y-2"
                            >
                                <div className="relative h-60 rounded-[2rem] overflow-hidden mb-6">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                                    <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute bottom-6 left-6 z-20 text-white">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-400/20 backdrop-blur-xl border border-teal-400/40 flex items-center justify-center mb-3 group-hover:bg-teal-400 group-hover:text-slate-950 transition-all duration-500">
                                            {cat.icon}
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight group-hover:text-teal-400 transition-colors">{cat.title}</h3>
                                    </div>
                                </div>
                                <div className="px-6 pb-6 space-y-4">
                                    <p className="text-sm font-bold text-white/50 leading-relaxed min-h-[48px]">{cat.desc}</p>
                                    <ul className="space-y-2">
                                        {cat.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[12px] font-black text-teal-400/70 group-hover:text-teal-400 transition-colors">
                                                <CheckCircle2 className="w-4 h-4" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="relative py-32 px-6 z-10 bg-white/[0.02]">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-10">
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">빠르고 정확한<br /><span className="text-teal-400">원스톱 프로세스</span></h2>
                            <p className="text-white/40 text-lg font-bold leading-relaxed">복잡한 절차를 획기적으로 줄였습니다. 도면 한 장으로 시작하는 가장 빠른 제품 출시.</p>
                            <div className="space-y-6">
                                {PROCESS_STEPS.map((step, idx) => (
                                    <div key={idx} className="flex gap-6 group">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-xl font-black text-white group-hover:bg-teal-400 group-hover:text-slate-950 transition-all">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-white mb-1">{step.title}</h4>
                                            <p className="text-sm font-bold text-white/30">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative aspect-square rounded-[4rem] border border-white/10 overflow-hidden shadow-2xl">
                             <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000" alt="Process" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-teal-400/10 mix-blend-overlay" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Inquiry Form Section */}
            <section className="relative py-32 px-6 z-10" id="inquiry">
                <div className="container mx-auto max-w-3xl">
                    <div className="p-10 md:p-16 rounded-[4rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl space-y-12">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-[2rem] bg-teal-400/10 border border-teal-400/20 flex items-center justify-center mx-auto text-teal-400 mb-6">
                                <Zap className="w-10 h-10 fill-current" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white">전문가 무료 상담</h2>
                            <p className="text-white/40 font-bold">도면이 없어도 괜찮습니다. 현재 상황을 기술해 주시면 전문 컨설턴트가 24시간 내에 연락드립니다.</p>
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
