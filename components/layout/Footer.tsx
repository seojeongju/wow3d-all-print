'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Boxes, ArrowUpRight, Facebook, Instagram, BookOpen, Users, ChevronDown, MessageCircle, MapPin, Phone, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getNaverTalkTalkChatUrl } from '@/lib/naver-talktalk'
import { MAKERSPACES } from '@/lib/makerspaces'

export default function Footer() {
    const t = useTranslations('Footer')
    const tCommon = useTranslations('Common')
    const tMs = useTranslations('Makerspace')
    const [mounted, setMounted] = useState(false)
    const talkUrl = getNaverTalkTalkChatUrl()

    useEffect(() => {
        setMounted(true)
    }, [])

    const socialLinks = [
        ...(talkUrl
            ? [{ name: tCommon('naverTalkShort'), url: talkUrl, icon: MessageCircle }]
            : []),
        { name: tCommon('naverBlog'), url: 'https://blog.naver.com/3dcookiehd', icon: BookOpen },
        { name: tCommon('naverBand'), url: 'https://www.band.us/@3dcookiehd', icon: Users },
        { name: tCommon('instagram'), url: 'https://www.instagram.com/3dcookie_hd/', icon: Instagram },
        { name: tCommon('facebook'), url: 'https://ko-kr.facebook.com/3dfabcafe/', icon: Facebook },
    ] as const

    return (
        <footer className="relative overflow-hidden border-t border-slate-200/80 bg-white">
            {/* 헤더와 동일한 밝은 톤 — 은은한 슬레이트 그라데이션만 유지 */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent pointer-events-none" />

            <div className="container mx-auto px-5 sm:px-6 relative z-10 pt-14 sm:pt-16 pb-10 sm:pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">

                    {/* Brand */}
                    <div className="lg:col-span-4 space-y-5">
                        <Link href="/" className="inline-flex items-center gap-2.5 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-shadow">
                                <Boxes className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-xl tracking-tight text-slate-900 leading-none">
                                    {tCommon('brand')}
                                    <span className="text-teal-600 font-semibold ml-0.5">{tCommon('brandPro')}</span>
                                </span>
                                <span className="text-xs font-semibold text-slate-500 leading-tight mt-1.5">
                                    {tCommon('company')} /{' '}
                                    <span className="text-teal-600">{tCommon('cookieBrand')}</span>
                                </span>
                            </div>
                        </Link>

                        <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed font-medium max-w-md break-keep">
                            {t('tagline')}
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {socialLinks.map(({ name, url, icon: Icon }, i) => (
                                <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={name}
                                    title={name}
                                    className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-all active:scale-95"
                                >
                                    <Icon className="w-4.5 h-4.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Centers + Support */}
                    <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-bold text-teal-700 tracking-wide flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    {t('centers')}
                                </h3>
                                <Link
                                    href="/makerspace"
                                    className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-600 transition-colors"
                                >
                                    {t('directions')}
                                </Link>
                            </div>
                            <ul className="space-y-4">
                                {MAKERSPACES.map((item) => (
                                    <li key={item.id}>
                                        <Link href={`/makerspace#${item.id}`} className="group block rounded-xl p-3 -mx-1 hover:bg-slate-50 transition-colors">
                                            <div className="text-[15px] font-bold text-slate-800 group-hover:text-teal-700 transition-colors flex items-center gap-1">
                                                {tMs(`centers.${item.id}.name`)}
                                                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all text-teal-600" />
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1 leading-snug break-keep">
                                                {tMs(`centers.${item.id}.address`)}
                                                {tMs(`centers.${item.id}.addressDetail`)
                                                    ? ` ${tMs(`centers.${item.id}.addressDetail`)}`
                                                    : ''}
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-teal-700 tracking-wide flex items-center gap-1.5">
                                <Phone className="w-4 h-4 shrink-0" />
                                {t('support')}
                            </h3>
                            <ul className="space-y-5">
                                <li>
                                    <div className="text-xs font-bold text-slate-500 mb-1.5">{t('phone')}</div>
                                    <a href="tel:0231443137" className="block text-base font-bold text-slate-800 hover:text-teal-700 transition-colors">
                                        02-3144-3137
                                    </a>
                                    <a href="tel:0544643144" className="block text-base font-bold text-slate-800 hover:text-teal-700 transition-colors mt-0.5">
                                        054-464-3144
                                    </a>
                                </li>
                                <li>
                                    <div className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5" />
                                        {t('email')}
                                    </div>
                                    <a
                                        href="mailto:wow3d16@naver.com"
                                        className="text-[15px] text-teal-700 font-bold hover:underline break-all"
                                    >
                                        wow3d16@naver.com
                                    </a>
                                </li>
                                {talkUrl ? (
                                    <li>
                                        <div className="text-xs font-bold text-slate-500 mb-1.5">{t('liveChat')}</div>
                                        <a
                                            href={talkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[15px] text-[#03A05A] font-bold hover:underline"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            {t('naverTalk')}
                                        </a>
                                    </li>
                                ) : null}
                            </ul>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-3">
                        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-2">{t('newsletter')}</h3>
                            <p className="text-sm text-slate-600 font-medium mb-4 leading-relaxed break-keep">
                                {t('newsletterDesc')}
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder={t('emailPlaceholder')}
                                    className="flex-1 h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                                />
                                <button
                                    type="button"
                                    aria-label={t('newsletter')}
                                    className="w-11 h-11 rounded-xl bg-teal-500 flex items-center justify-center text-white hover:bg-teal-600 shadow-md shadow-teal-500/25 transition-all active:scale-95 shrink-0"
                                >
                                    <ChevronDown className="w-4 h-4 -rotate-90" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 sm:mt-14 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-xs sm:text-sm font-medium text-slate-500 text-center md:text-left break-keep">
                        {mounted
                            ? `© ${new Date().getFullYear()} WOW3D PRO. ${tCommon('company')} / ${tCommon('cookieBrand')}. ${t('rights')}`
                            : '© WOW3D PRO.'}
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs sm:text-sm font-semibold text-slate-600">
                        <Link href="/terms" className="hover:text-teal-700 transition-colors">
                            {t('terms')}
                        </Link>
                        <Link href="/privacy" className="hover:text-teal-700 transition-colors">
                            {t('privacy')}
                        </Link>
                        <Link href="/materials/safety" className="hover:text-teal-700 transition-colors">
                            {t('materialsSafety')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
