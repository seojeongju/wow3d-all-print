'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Sparkles,
    ImageIcon,
    FileBox,
    Upload,
    ChevronRight,
    CheckCircle2,
    ShieldCheck,
    Printer,
    Lightbulb,
    Calculator,
    ScanSearch,
    Tags,
    PenTool,
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useFileStore } from '@/store/useFileStore';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import {
    getModelFileFromDataTransfer,
    hasModelFileExtension,
    isModelFileTooLarge,
} from '@/lib/model-file';
import { useUploadNoticeStore } from '@/store/useUploadNoticeStore';
import { MESHY_IMAGE_MAX_BYTES } from '@/lib/meshy';
import { isPhotoFile } from '@/lib/photo-file';
import { cn } from '@/lib/utils';
import { HERO_CONVERSION_EVENTS } from '@/lib/conversion-events';
import { trackConversionEvent, trackConversionEventOnce } from '@/lib/track-conversion-event';
import { usePhotoHandoffStore } from '@/store/usePhotoHandoffStore';
import { useAuthStore } from '@/store/useAuthStore';
import HeroLiveStats from './HeroLiveStats';
import { handleHeroTiltLeave, handleHeroTiltMove } from './heroTilt';

/** three.js(약 850KB)는 첫 JS 번들에서 분리 — 배경 장식이라 화면 표시 후 불러와도 된다 */
const LandingHeroScene = dynamic(() => import('./LandingHeroScene'), { ssr: false });

function DeferredHeroScene() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const w = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };
        if (w.requestIdleCallback) {
            const id = w.requestIdleCallback(() => setReady(true), { timeout: 2500 });
            return () => w.cancelIdleCallback?.(id);
        }
        const timer = window.setTimeout(() => setReady(true), 1200);
        return () => window.clearTimeout(timer);
    }, []);

    return ready ? <LandingHeroScene /> : null;
}

type UploadMode = 'file' | 'photo';

/** 주 CTA 외 보조 경로 — 한 줄 5카드 (key = 문구 키·전환 이벤트 link 값) */
const HERO_SIDE_LINKS = [
    { key: 'expert', href: '/expert', icon: Lightbulb, iconMotion: 'hero-icon-flash' },
    { key: 'calculator', href: '/price-calculator', icon: Calculator, iconMotion: 'hero-icon-pop' },
    { key: 'checker', href: '/stl-checker', icon: ScanSearch, iconMotion: '' },
    { key: 'nameTag', href: '/maker', icon: Tags, iconMotion: 'hero-icon-pop' },
    { key: 'aiMaker', href: '/maker?mode=draw', icon: PenTool, iconMotion: 'hero-icon-flash' },
] as const;

export default function Hero() {
    const t = useTranslations('Home.hero');
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const { user } = useAuthStore();
    const { setFile, file, reset } = useFileStore();

    const SAMPLE_NAMES = ['sample_cube.stl', 'test_cube.stl'];
    const clearSampleIfPresent = () => {
        if (file && SAMPLE_NAMES.includes(file.name)) reset();
    };
    const { toast } = useToast();
    const [uploadMode, setUploadMode] = useState<UploadMode>('file');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const trackHero = useCallback(
        (eventName: string, metadata?: Record<string, string>) => {
            trackConversionEvent({
                eventName,
                metadata,
                userId: user?.id ?? null,
            });
        },
        [user?.id],
    );

    useEffect(() => {
        trackConversionEventOnce('wow3d_hero_view_tracked', {
            eventName: HERO_CONVERSION_EVENTS.VIEW,
            userId: user?.id ?? null,
        });
    }, [user?.id]);

    const handleModelUpload = useCallback(
        (model: File) => {
            clearSampleIfPresent();
            trackHero(HERO_CONVERSION_EVENTS.DROP_FILE);
            setFile(model);
            router.push('/quote?entry=file&handoff=1');
        },
        [router, setFile, trackHero],
    );

    const handlePhotoUpload = useCallback(
        (photo: File) => {
            clearSampleIfPresent();
            trackHero(HERO_CONVERSION_EVENTS.DROP_PHOTO);
            usePhotoHandoffStore.getState().setPendingPhoto(photo);
            router.push('/quote?entry=photo&handoff=1');
        },
        [router, trackHero],
    );

    const validateAndUploadModel = useCallback(
        (candidate: File) => {
            if (!hasModelFileExtension(candidate)) {
                toast({
                    title: t('errTypeTitle'),
                    description: t('errTypeModel'),
                    variant: 'destructive',
                });
                return;
            }
            // 용량 초과: 업로드 화면에서 용량 줄이는 방법·상담 바로가기 안내
            if (isModelFileTooLarge(candidate)) {
                clearSampleIfPresent();
                trackHero(HERO_CONVERSION_EVENTS.DROP_FILE, { rejected: 'too_large' });
                useUploadNoticeStore.getState().showTooLarge(candidate);
                router.push('/quote?entry=file&handoff=1');
                return;
            }
            handleModelUpload(candidate);
        },
        [handleModelUpload, toast, t, router, trackHero],
    );

    const validateAndUploadPhoto = useCallback(
        (candidate: File) => {
            if (candidate.size > MESHY_IMAGE_MAX_BYTES) {
                toast({
                    title: t('errSizeTitle'),
                    description: t('errSizePhoto'),
                    variant: 'destructive',
                });
                return;
            }
            if (!isPhotoFile(candidate)) {
                toast({
                    title: t('errTypeTitle'),
                    description: t('errTypePhoto'),
                    variant: 'destructive',
                });
                return;
            }
            handlePhotoUpload(candidate);
        },
        [handlePhotoUpload, toast, t],
    );

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer?.files?.[0];
            if (!dropped) return;

            if (uploadMode === 'file') {
                const model = getModelFileFromDataTransfer(e.dataTransfer);
                if (!model) {
                    toast({
                        title: t('errNeedModelTitle'),
                        description: t('errNeedModel'),
                        variant: 'destructive',
                    });
                    return;
                }
                validateAndUploadModel(model);
            } else {
                validateAndUploadPhoto(dropped);
            }
        },
        [uploadMode, validateAndUploadModel, validateAndUploadPhoto, toast, t],
    );

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    }, []);

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        e.target.value = '';
        if (!picked) return;
        if (uploadMode === 'file') validateAndUploadModel(picked);
        else validateAndUploadPhoto(picked);
    };

    const steps = [
        { n: '01', label: t('step1') },
        { n: '02', label: t('step2') },
        { n: '03', label: t('step3') },
    ];

    return (
        <section className="relative flex min-h-[100dvh] items-start justify-center overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:h-[100dvh] lg:min-h-0 lg:max-h-[100dvh] lg:items-stretch lg:overflow-hidden lg:pt-[4.75rem] lg:pb-3 xl:pt-20 xl:pb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#111827] to-[#0f172a]" />
            {/* 배경 질감 — fixed 배경은 스크롤마다 다시 그려 느려지므로 사용하지 않음 */}
            <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-[0.05] mix-blend-screen" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(20,184,166,0.14),transparent_48%),radial-gradient(circle_at_82%_68%,rgba(79,70,229,0.12),transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:28px_28px]" />
            {/* 빛 번짐 — 큰 blur 필터 대신 같은 모양의 방사형 그라데이션 (렌더링 비용 절감) */}
            <div className="pointer-events-none absolute left-[calc(-8%-120px)] top-[calc(12%-120px)] h-[660px] w-[660px] bg-[radial-gradient(circle,rgba(20,184,166,0.15)_0%,rgba(20,184,166,0.06)_35%,transparent_68%)]" />
            <div className="pointer-events-none absolute bottom-[calc(-10%-140px)] right-[calc(-6%-140px)] h-[760px] w-[760px] bg-[radial-gradient(circle,rgba(79,70,229,0.12)_0%,rgba(79,70,229,0.05)_35%,transparent_68%)]" />

            <div className="container relative z-10 mx-auto grid min-h-0 items-stretch gap-10 px-4 lg:h-full lg:grid-cols-2 lg:gap-6 xl:gap-10">
                {/* ── Left: 브랜드 · 가치 · 전환 CTA ── */}
                <motion.div
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="flex h-full min-h-0 flex-col text-left lg:overflow-hidden"
                >
                    <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/10 px-3.5 py-1.5 lg:mb-1.5 lg:px-3 lg:py-1">
                        <Sparkles className="h-3.5 w-3.5 text-teal-300" aria-hidden />
                        <span className="text-[11px] font-bold tracking-wide text-teal-100 sm:text-xs lg:text-[10px]">
                            {t('badgePhoto')}
                        </span>
                    </div>

                    <p className="mb-3 text-2xl font-black tracking-tight text-white sm:text-3xl lg:mb-1 lg:text-[1.35rem] xl:text-[1.55rem]">
                        WOW3D<span className="ml-1 font-light text-teal-400">PRO</span>
                    </p>

                    <h1 className="mb-4 text-[1.7rem] font-black leading-[1.18] tracking-tight text-white sm:text-[2.35rem] md:text-[2.55rem] lg:mb-1.5 lg:text-[1.85rem] xl:mb-2 xl:text-[2.2rem] break-keep [@media(max-height:860px)_and_(min-width:1024px)]:text-[1.65rem]">
                        {t('titleLine1')}{' '}
                        <span className="text-white/90">{t('titleLine2')}</span>
                        <br />
                        <span className="text-teal-300">{t('titleAccent')}</span>
                    </h1>

                    <p className="mb-5 max-w-xl text-[15px] font-medium leading-relaxed text-white/72 break-keep sm:text-base lg:mb-2 lg:max-w-none lg:text-[13px] lg:leading-snug xl:mb-3 xl:text-[14px]">
                        <span className="font-semibold text-white">{t('subtitleLead')}</span>
                        <br className="hidden sm:block lg:hidden xl:block" />
                        <span className="mt-1 inline-block sm:mt-1.5 lg:mt-0.5">
                            <span className="font-bold text-teal-200">{t('subtitleFile')}</span>
                            {t('subtitleMid')}
                            <span className="font-bold text-indigo-200">{t('subtitlePhoto')}</span>
                            {t('subtitleEnd')}
                        </span>
                    </p>

                    {/* 전환 여정 3단계 — 짧은 화면에서는 숨겨 핵심 CTA 공간 확보 */}
                    <ol className="mb-7 flex flex-wrap items-center gap-2 sm:gap-3 lg:mb-2 xl:mb-3 [@media(max-height:860px)_and_(min-width:1024px)]:hidden" aria-label={t('subtitleLead')}>
                        {steps.map((step, idx) => (
                            <li key={step.n} className="flex items-center gap-2 sm:gap-3">
                                <span className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 lg:gap-1.5 lg:px-2.5 lg:py-1">
                                    <span className="text-[10px] font-black tabular-nums text-teal-300/90">
                                        {step.n}
                                    </span>
                                    <span className="text-xs font-bold text-white/90 sm:text-[13px] lg:text-[11px]">
                                        {step.label}
                                    </span>
                                </span>
                                {idx < steps.length - 1 && (
                                    <ChevronRight className="hidden h-4 w-4 text-white/25 sm:block" aria-hidden />
                                )}
                            </li>
                        ))}
                    </ol>

                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 lg:mb-1 lg:text-[10px]">
                        {t('choosePath')}
                    </p>

                    {/* Primary fork — 카드가 곧 CTA (중복 버튼 제거) */}
                    <div className="hero-fork mb-3 grid gap-3 sm:grid-cols-2 lg:mb-2 lg:gap-2 xl:mb-2.5">
                        <Link
                            href="/quote?entry=file"
                            onClick={() => {
                                clearSampleIfPresent();
                                setUploadMode('file');
                                trackHero(HERO_CONVERSION_EVENTS.FORK_FILE);
                                trackHero(HERO_CONVERSION_EVENTS.CTA_FILE);
                            }}
                            onPointerMove={handleHeroTiltMove}
                            onPointerLeave={handleHeroTiltLeave}
                            className="hero-tilt hero-glow-teal group relative flex flex-col rounded-2xl border border-teal-400/35 bg-gradient-to-b from-teal-400/18 to-teal-400/[0.06] p-5 shadow-[0_10px_30px_rgba(20,184,166,0.12)] hover:border-teal-300/55 hover:from-teal-400/25 hover:shadow-[0_20px_48px_rgba(20,184,166,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/60 lg:rounded-xl lg:p-3"
                        >
                            <span className="hero-spotlight" aria-hidden />
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-300/40 bg-teal-400/20 text-teal-200 transition-[translate,rotate,scale,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:-rotate-6 group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(45,212,191,0.45)] motion-reduce:transform-none lg:mb-2 lg:h-8 lg:w-8 lg:rounded-lg">
                                <FileBox className="h-6 w-6 lg:h-4 lg:w-4" />
                            </div>
                            <p className="text-lg font-black text-white lg:text-[15px]">{t('hasFile')}</p>
                            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/65 break-keep lg:mt-1 lg:text-[12px] lg:leading-snug">
                                {t('hasFileDesc')}
                            </p>
                            <span className="hero-shine mt-4 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-teal-400 px-4 text-sm font-black text-slate-950 transition group-hover:bg-teal-300 lg:mt-2 lg:h-8 lg:rounded-lg lg:text-[12px]">
                                {t('getQuote')}
                                <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                            </span>
                        </Link>

                        <Link
                            href="/quote?entry=photo"
                            onClick={() => {
                                clearSampleIfPresent();
                                setUploadMode('photo');
                                trackHero(HERO_CONVERSION_EVENTS.FORK_PHOTO);
                                trackHero(HERO_CONVERSION_EVENTS.CTA_PHOTO);
                            }}
                            onPointerMove={handleHeroTiltMove}
                            onPointerLeave={handleHeroTiltLeave}
                            className="hero-tilt hero-glow-indigo group relative flex flex-col rounded-2xl border border-indigo-400/35 bg-gradient-to-b from-indigo-500/18 to-indigo-500/[0.06] p-5 shadow-[0_10px_30px_rgba(99,102,241,0.12)] hover:border-indigo-300/55 hover:from-indigo-500/25 hover:shadow-[0_20px_48px_rgba(99,102,241,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60 lg:rounded-xl lg:p-3"
                        >
                            <span className="hero-spotlight" aria-hidden />
                            <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-300/40 bg-indigo-500/20 text-indigo-200 transition-[translate,rotate,scale,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(129,140,248,0.5)] motion-reduce:transform-none lg:mb-2 lg:h-8 lg:w-8 lg:rounded-lg">
                                <ImageIcon className="h-6 w-6 lg:h-4 lg:w-4" />
                                <Sparkles className="hero-twinkle absolute -right-2 -top-2 h-4 w-4 text-indigo-100 lg:h-3 lg:w-3" aria-hidden />
                            </div>
                            <p className="text-lg font-black text-white lg:text-[15px]">{t('hasPhoto')}</p>
                            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/65 break-keep lg:mt-1 lg:text-[12px] lg:leading-snug">
                                {t('hasPhotoDesc')}
                            </p>
                            <span className="hero-shine mt-4 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-400 px-4 text-sm font-black text-slate-950 transition group-hover:bg-indigo-300 lg:mt-2 lg:h-8 lg:rounded-lg lg:text-[12px]">
                                {t('make3d')}
                                <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                            </span>
                        </Link>
                    </div>

                    {/* 보조 경로 5카드 1줄 — 주 CTA보다 낮은 비중, 좁은 폭에서도 한 줄 유지 */}
                    <div className="mb-6 grid grid-cols-5 gap-1.5 sm:gap-2 lg:mb-2 lg:gap-1.5">
                        {HERO_SIDE_LINKS.map(({ key, href, icon: Icon, iconMotion }) => (
                            <Link
                                key={key}
                                href={href}
                                onClick={() => trackHero(HERO_CONVERSION_EVENTS.TERTIARY, { link: key })}
                                className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-1 py-2.5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-400/40 hover:bg-teal-400/[0.08] hover:shadow-[0_10px_24px_rgba(20,184,166,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/50 motion-reduce:hover:translate-y-0 sm:items-start sm:gap-2 sm:px-2.5 sm:py-2.5 sm:text-left lg:gap-1 lg:rounded-lg lg:px-1.5 lg:py-1.5"
                            >
                                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/12 bg-white/[0.05] text-teal-300/90 transition-colors duration-300 group-hover:border-teal-300/70 group-hover:bg-teal-400 group-hover:text-slate-950 sm:h-8 sm:w-8 lg:h-6 lg:w-6">
                                    <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3 lg:w-3', iconMotion)} aria-hidden />
                                    {key === 'checker' && (
                                        <span className="hero-scan-line pointer-events-none absolute inset-x-1 top-1/2 h-0.5 rounded-full bg-slate-950/70" aria-hidden />
                                    )}
                                </div>
                                <div className="min-w-0 w-full">
                                    <p className="hidden text-[11px] font-bold leading-snug text-white/55 break-keep [@media(min-height:960px)_and_(min-width:1280px)]:block">
                                        {t(`sideLinks.${key}.title`)}
                                    </p>
                                    <p className="inline-flex max-w-full items-center justify-center gap-0.5 text-[10px] font-bold leading-snug text-white/90 break-keep sm:justify-start sm:text-[11px] sm:text-teal-300/90 sm:group-hover:text-teal-200 lg:text-[10px]">
                                        <span className="truncate">{t(`sideLinks.${key}.cta`)}</span>
                                        <ChevronRight className="hidden h-3 w-3 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 sm:block" aria-hidden />
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <p className="mb-4 text-xs font-medium text-white/45 break-keep lg:hidden">
                        {t('dropZoneHint')}
                    </p>

                    {/* 신뢰 시그널 — 빈 아바타 대신 명확한 근거 */}
                    <div className="mb-6 space-y-3 lg:mb-2 lg:space-y-1.5">
                        <HeroLiveStats />
                        <div className="flex flex-wrap gap-1.5 lg:gap-1">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-semibold text-white/75 lg:px-2 lg:py-1 lg:text-[10px]">
                                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 lg:h-3 lg:w-3" aria-hidden />
                                {t('trustInstant')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-semibold text-white/75 lg:px-2 lg:py-1 lg:text-[10px]">
                                <ShieldCheck className="h-3.5 w-3.5 text-teal-400 lg:h-3 lg:w-3" aria-hidden />
                                {t('trustExpert')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-semibold text-white/75 lg:px-2 lg:py-1 lg:text-[10px]">
                                <Printer className="h-3.5 w-3.5 text-teal-400 lg:h-3 lg:w-3" aria-hidden />
                                {t('trustProcess')}
                            </span>
                        </div>
                    </div>

                    {/* 보조 탐색 — 출력방식·소재만 유지 */}
                    <div className="mt-auto grid grid-cols-2 gap-2 lg:gap-1.5">
                        <Link
                            href="/print-methods"
                            onClick={() => trackHero(HERO_CONVERSION_EVENTS.TERTIARY, { link: 'print-methods' })}
                            className="group flex h-11 items-center justify-center rounded-xl border border-white/10 bg-transparent px-2 text-center text-[12px] font-semibold text-white/55 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.04] hover:text-white sm:text-[13px] lg:h-8 lg:rounded-lg lg:text-[12px]"
                        >
                            <span className="hero-underline pb-0.5">{t('linkMethods')}</span>
                        </Link>
                        <Link
                            href="/materials"
                            onClick={() => trackHero(HERO_CONVERSION_EVENTS.TERTIARY, { link: 'materials' })}
                            className="group flex h-11 items-center justify-center rounded-xl border border-white/10 bg-transparent px-2 text-center text-[12px] font-semibold text-white/55 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.04] hover:text-white sm:text-[13px] lg:h-8 lg:rounded-lg lg:text-[12px]"
                        >
                            <span className="hero-underline pb-0.5">{t('linkMaterials')}</span>
                        </Link>
                    </div>
                </motion.div>

                {/* ── Right: 통합 Drop Zone ── */}
                <motion.div
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.08 }}
                    className="flex h-full w-full min-h-[420px] sm:min-h-[500px] lg:min-h-0"
                >
                    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#0b1220]/92 shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur-2xl lg:rounded-2xl">
                        <div
                            role="tablist"
                            aria-label={t('uploadModeAria')}
                            className="flex shrink-0 gap-1.5 border-b border-white/10 bg-black/40 p-2 lg:p-1.5"
                        >
                            {(
                                [
                                    { id: 'file' as const, label: t('tabFile'), icon: FileBox },
                                    { id: 'photo' as const, label: t('tabPhoto'), icon: ImageIcon },
                                ] as const
                            ).map(({ id, label, icon: Icon }) => {
                                const isActive = uploadMode === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => setUploadMode(id)}
                                        className={cn(
                                            'relative isolate flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3.5 text-sm font-extrabold tracking-tight transition-[color,background-color,border-color,box-shadow] duration-300 sm:text-[15px] lg:rounded-lg lg:py-2.5 lg:text-[13px]',
                                            isActive
                                                ? 'border-transparent text-slate-950'
                                                : cn(
                                                      'border-white/12 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.07] hover:text-white',
                                                      id === 'file'
                                                          ? 'hover:shadow-[inset_0_-2px_0_rgba(45,212,191,0.7)]'
                                                          : 'hover:shadow-[inset_0_-2px_0_rgba(165,180,252,0.7)]',
                                                  ),
                                        )}
                                    >
                                        {isActive && (
                                            <motion.span
                                                layoutId="hero-upload-tab"
                                                aria-hidden
                                                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                                                className={cn(
                                                    'absolute inset-[-1px] -z-10 rounded-xl',
                                                    id === 'file'
                                                        ? 'bg-teal-400 shadow-[0_0_0_1px_rgba(45,212,191,0.55),0_8px_24px_rgba(45,212,191,0.3)]'
                                                        : 'bg-indigo-300 shadow-[0_0_0_1px_rgba(165,180,252,0.55),0_8px_24px_rgba(165,180,252,0.3)]',
                                                )}
                                            />
                                        )}
                                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    (uploadMode === 'file' ? fileInputRef : photoInputRef).current?.click();
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                trackHero(
                                    uploadMode === 'file'
                                        ? HERO_CONVERSION_EVENTS.DROP_ZONE_CLICK_FILE
                                        : HERO_CONVERSION_EVENTS.DROP_ZONE_CLICK_PHOTO,
                                );
                                (uploadMode === 'file' ? fileInputRef : photoInputRef).current?.click();
                            }}
                            onDragEnter={handleDragOver}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                'group relative mx-4 mt-4 flex min-h-0 flex-1 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 lg:mx-3 lg:mt-3 lg:rounded-xl',
                                isDragging
                                    ? uploadMode === 'file'
                                        ? 'border-teal-400 bg-teal-400/12 ring-2 ring-teal-400/35'
                                        : 'border-indigo-400 bg-indigo-500/12 ring-2 ring-indigo-400/35'
                                    : uploadMode === 'file'
                                      ? 'border-teal-400/40 bg-white/[0.02] hover:border-transparent hover:bg-teal-400/[0.05]'
                                      : 'border-indigo-400/40 bg-white/[0.02] hover:border-transparent hover:bg-indigo-500/[0.05]',
                            )}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".stl,.obj,.3mf,.ply,.step,.stp"
                                className="hidden"
                                onChange={handleFileInputChange}
                            />
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={handleFileInputChange}
                            />

                            {/* 마우스 오버 시 흐르는 점선 테두리 */}
                            {!isDragging && (
                                <svg
                                    className={cn(
                                        'hero-dash-flow pointer-events-none absolute inset-0 z-[1] h-full w-full',
                                        uploadMode === 'file' ? 'text-teal-300/80' : 'text-indigo-300/80',
                                    )}
                                    aria-hidden
                                >
                                    <rect width="100%" height="100%" rx="14" stroke="currentColor" />
                                </svg>
                            )}

                            {/* 출력물 이미지 배경 — 보이되 텍스트와 충돌하지 않게 */}
                            <div className="pointer-events-none absolute inset-0" aria-hidden>
                                <div className="absolute inset-0 opacity-80 sm:opacity-85">
                                    <DeferredHeroScene />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-b from-[#0b1220]/30 via-transparent to-[#0b1220]/55" />
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,18,32,0.35)_0%,transparent_58%)]" />
                            </div>

                            <div className="relative flex min-h-[280px] w-full flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[340px] sm:px-8 sm:py-14 lg:min-h-0 lg:px-6 lg:py-6 xl:py-8">
                                <div className="mb-5 inline-flex items-center gap-3 rounded-2xl border border-white/14 bg-[#0b1220]/78 px-3.5 py-2.5 shadow-lg backdrop-blur-md lg:mb-3 lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2">
                                    <div
                                        className={cn(
                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border lg:h-8 lg:w-8 lg:rounded-lg',
                                            uploadMode === 'file'
                                                ? 'border-teal-400/35 bg-teal-400/15 text-teal-200'
                                                : 'border-indigo-400/35 bg-indigo-500/15 text-indigo-200',
                                        )}
                                    >
                                        <Sparkles className="h-[18px] w-[18px] lg:h-4 lg:w-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black leading-tight text-white lg:text-[13px]">
                                            {uploadMode === 'file' ? t('aiQuote') : t('aiConvert')}
                                        </p>
                                        <p
                                            className={cn(
                                                'mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em]',
                                                uploadMode === 'file' ? 'text-teal-300' : 'text-indigo-300',
                                            )}
                                        >
                                            {uploadMode === 'file' ? t('readyFile') : t('readyPhoto')}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={cn(
                                        'hero-bob mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-[0_0_28px_rgba(45,212,191,0.18)] transition-shadow duration-300 sm:h-[4.5rem] sm:w-[4.5rem] lg:mb-3 lg:h-12 lg:w-12 lg:rounded-xl',
                                        uploadMode === 'file'
                                            ? 'border-teal-400/40 bg-teal-400/18 text-teal-100 group-hover:shadow-[0_0_44px_rgba(45,212,191,0.4)]'
                                            : 'border-indigo-400/40 bg-indigo-500/18 text-indigo-100 group-hover:shadow-[0_0_44px_rgba(129,140,248,0.45)]',
                                    )}
                                >
                                    <Upload className="h-8 w-8 sm:h-9 sm:w-9 lg:h-6 lg:w-6" strokeWidth={2.25} />
                                </div>

                                <p className="max-w-md text-xl font-black tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.65)] sm:text-2xl lg:text-lg xl:text-xl">
                                    {uploadMode === 'file' ? t('dropFile') : t('dropPhoto')}
                                </p>
                                <p className="mt-3 max-w-sm text-sm font-semibold leading-relaxed text-white/80 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)] break-keep sm:text-[15px] lg:mt-2 lg:text-[12px]">
                                    {uploadMode === 'file' ? t('formatsFile') : t('formatsPhoto')}
                                </p>
                                <p className="mt-5 max-w-xs text-xs font-semibold leading-relaxed text-white/65 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)] break-keep sm:text-[13px] lg:mt-2 lg:text-[11px] [@media(max-height:860px)_and_(min-width:1024px)]:hidden">
                                    {t('clickHint')}
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 p-4 sm:p-5 lg:p-3">
                            <Link
                                href={uploadMode === 'file' ? '/quote?entry=file' : '/quote?entry=photo'}
                                onClick={() => {
                                    clearSampleIfPresent();
                                    trackHero(
                                        uploadMode === 'file'
                                            ? HERO_CONVERSION_EVENTS.PANEL_CTA_FILE
                                            : HERO_CONVERSION_EVENTS.PANEL_CTA_PHOTO,
                                    );
                                }}
                                className="block"
                            >
                                <Button
                                    size="lg"
                                    className={cn(
                                        'h-14 w-full rounded-2xl text-sm font-black sm:text-base lg:h-11 lg:rounded-xl lg:text-[13px]',
                                        uploadMode === 'file'
                                            ? 'bg-teal-400 text-slate-950 hover:bg-teal-300 shadow-[0_0_28px_rgba(45,212,191,0.28)]'
                                            : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_28px_rgba(99,102,241,0.3)]',
                                    )}
                                >
                                    {uploadMode === 'file' ? t('ctaFile') : t('ctaPhoto')}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
