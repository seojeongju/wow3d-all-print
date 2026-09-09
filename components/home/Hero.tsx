'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Sparkles,
    ImageIcon,
    FileBox,
    Upload,
    ChevronRight,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useFileStore } from '@/store/useFileStore';
import { useToast } from '@/hooks/use-toast';
import LandingHeroScene from './LandingHeroScene';
import {
    getModelFileFromDataTransfer,
    hasModelFileExtension,
    MODEL_FILE_MAX_BYTES,
} from '@/lib/model-file';
import { MESHY_IMAGE_MAX_BYTES } from '@/lib/meshy';
import { cn } from '@/lib/utils';
import { HERO_CONVERSION_EVENTS } from '@/lib/conversion-events';
import { trackConversionEvent, trackConversionEventOnce } from '@/lib/track-conversion-event';
import { usePhotoHandoffStore } from '@/store/usePhotoHandoffStore';
import { useAuthStore } from '@/store/useAuthStore';

type UploadMode = 'file' | 'photo';

function isPhotoFile(file: File): boolean {
    const name = file.name.toLowerCase();
    return (
        file.type === 'image/jpeg' ||
        file.type === 'image/jpg' ||
        file.type === 'image/png' ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png')
    );
}

export default function Hero() {
    const t = useTranslations('Home.hero');
    const router = useRouter();
    const { user } = useAuthStore();
    const { setFile, file, reset } = useFileStore();

    const SAMPLE_NAMES = ['sample_cube.stl', 'test_cube.stl'];
    const clearSampleIfPresent = () => {
        if (file && SAMPLE_NAMES.includes(file.name)) reset();
    };
    const { toast } = useToast();
    const [isLoadingSample, setIsLoadingSample] = useState(false);
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
            router.push('/quote?entry=file');
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
            if (candidate.size > MODEL_FILE_MAX_BYTES) {
                toast({
                    title: t('errSizeTitle'),
                    description: t('errSizeModel'),
                    variant: 'destructive',
                });
                return;
            }
            if (!hasModelFileExtension(candidate)) {
                toast({
                    title: t('errTypeTitle'),
                    description: t('errTypeModel'),
                    variant: 'destructive',
                });
                return;
            }
            handleModelUpload(candidate);
        },
        [handleModelUpload, toast, t],
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
                handleModelUpload(model);
            } else {
                validateAndUploadPhoto(dropped);
            }
        },
        [uploadMode, handleModelUpload, validateAndUploadPhoto, toast, t],
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

    const handleTrySample = async () => {
        trackHero(HERO_CONVERSION_EVENTS.SAMPLE_TRY);
        setIsLoadingSample(true);
        try {
            const res = await fetch('/test_cube.stl');
            if (!res.ok) throw new Error(t('errSampleLoad'));
            const blob = await res.blob();
            const sampleFile = new File([blob], 'sample_cube.stl', { type: 'model/stl' });
            setFile(sampleFile);
            router.push('/experience');
        } catch (e) {
            toast({
                title: t('errTitle'),
                description: e instanceof Error ? e.message : t('errSampleFail'),
                variant: 'destructive',
            });
        } finally {
            setIsLoadingSample(false);
        }
    };

    return (
        <section className="relative flex min-h-[100dvh] items-start justify-center overflow-hidden pt-28 sm:pt-32 pb-16 sm:pb-20">
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            <div
                className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-[0.06] mix-blend-screen"
                style={{ backgroundAttachment: 'fixed' }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute left-0 top-1/4 h-[500px] w-[500px] rounded-full bg-teal-500/20 blur-[130px]" />
                <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-indigo-600/15 blur-[150px]" />
            </div>

            <div className="container relative z-10 mx-auto grid items-stretch gap-10 px-4 lg:grid-cols-2 lg:gap-12 xl:gap-14">
                {/* ── Left: 카피 + CTA (하단을 드롭존과 맞춤) ── */}
                <motion.div
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="flex h-full min-h-0 flex-col text-left"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mb-5 flex flex-wrap items-center gap-2"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-md">
                            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80 sm:text-xs">
                                NEXT-GEN 3D PRINTING
                            </span>
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 backdrop-blur-md">
                            <ImageIcon className="h-3.5 w-3.5 text-indigo-300" />
                            <span className="text-[10px] font-semibold tracking-wide text-indigo-200/90 sm:text-xs">
                                {t('badgePhoto')}
                            </span>
                        </span>
                    </motion.div>

                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-teal-400 sm:text-xs">
                        WOW3D PRO
                    </p>

                    <h1 className="mb-4 text-[1.85rem] font-black leading-[1.15] tracking-tight text-white sm:text-4xl md:text-[2.6rem] lg:text-[2.85rem] break-keep">
                        {t('titleLine1')}
                        <br />
                        {t('titleLine2')}
                        <br />
                        <span className="text-teal-400 underline decoration-teal-400/40 decoration-2 underline-offset-[6px]">
                            {t('titleAccent')}
                        </span>
                    </h1>

                    <p className="mb-6 max-w-lg text-base font-medium leading-relaxed text-white/65 break-keep sm:mb-8 sm:text-lg">
                        {t('subtitleLead')}
                        <br />
                        <span className="font-bold text-white/90">{t('subtitleFile')}</span>
                        {t('subtitleMid')}
                        <span className="font-bold text-white/90">{t('subtitlePhoto')}</span>
                        {t('subtitleEnd')}
                    </p>

                    {/* 2갈래 Fork 카드 — 드롭존 외곽과 동일 radius */}
                    <div className="mb-5 grid gap-3 sm:grid-cols-2">
                        <Link
                            href="/quote?entry=file"
                            onClick={() => {
                                clearSampleIfPresent();
                                setUploadMode('file');
                                trackHero(HERO_CONVERSION_EVENTS.FORK_FILE);
                            }}
                            className="group rounded-2xl border border-teal-400/25 bg-teal-400/10 p-5 transition-all hover:-translate-y-0.5 hover:border-teal-400/40 hover:bg-teal-400/15"
                        >
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/15 text-teal-300">
                                <FileBox className="h-5 w-5" />
                            </div>
                            <p className="text-lg font-black text-white">{t('hasFile')}</p>
                            <p className="mt-1 text-xs leading-relaxed text-white/55 break-keep">
                                {t('hasFileDesc')}
                            </p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-teal-300 group-hover:gap-2">
                                {t('getQuote')} <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                        </Link>

                        <Link
                            href="/quote?entry=photo"
                            onClick={() => {
                                clearSampleIfPresent();
                                setUploadMode('photo');
                                trackHero(HERO_CONVERSION_EVENTS.FORK_PHOTO);
                            }}
                            className="group rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-indigo-500/15"
                        >
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-300">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                            <p className="text-lg font-black text-white">{t('hasPhoto')}</p>
                            <p className="mt-1 text-xs leading-relaxed text-white/55 break-keep">
                                {t('hasPhotoDesc')}
                            </p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-indigo-300 group-hover:gap-2">
                                {t('make3d')} <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                        </Link>
                    </div>

                    {/* Primary CTA */}
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                        <Link href="/quote?entry=file" className="flex-1" onClick={() => { clearSampleIfPresent(); trackHero(HERO_CONVERSION_EVENTS.CTA_FILE); }}>
                            <Button
                                size="lg"
                                className="h-14 w-full rounded-2xl bg-teal-400 text-[15px] font-black text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:bg-teal-300"
                            >
                                <FileBox className="mr-2 h-5 w-5" />
                                {t('tabFileQuote')}
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/quote?entry=photo" className="flex-1" onClick={() => { clearSampleIfPresent(); trackHero(HERO_CONVERSION_EVENTS.CTA_PHOTO); }}>
                            <Button
                                size="lg"
                                className="h-14 w-full rounded-2xl bg-indigo-500 text-[15px] font-black text-white shadow-[0_0_30px_rgba(99,102,241,0.35)] hover:bg-indigo-400"
                            >
                                <ImageIcon className="mr-2 h-5 w-5" />
                                {t('tabPhoto3d')}
                            </Button>
                        </Link>
                    </div>

                    <div className="mb-5 flex items-center gap-5 text-white/50">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#111827] bg-white/10"
                                >
                                    <div className="h-full w-full bg-gradient-to-br from-white/20 to-white/10" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-sm font-bold leading-tight text-white">{t('customers')}</p>
                            <p className="text-[10px] font-medium uppercase tracking-widest text-teal-500/80">
                                FDM · SLA · DLP
                            </p>
                        </div>
                    </div>

                    {/* Tertiary — 드롭존 하단과 동일 선상 */}
                    <div className="mt-auto grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Link
                            href="/print-methods"
                            onClick={() => trackHero(HERO_CONVERSION_EVENTS.TERTIARY, { link: 'print-methods' })}
                            className="flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-2 text-center text-[12px] font-bold text-white/80 transition-all hover:border-teal-400/35 hover:bg-teal-400/10 hover:text-teal-200 sm:text-[13px]"
                        >
                            {t('linkMethods')}
                        </Link>
                        <Link
                            href="/materials"
                            onClick={() => trackHero(HERO_CONVERSION_EVENTS.TERTIARY, { link: 'materials' })}
                            className="flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-2 text-center text-[12px] font-bold text-white/80 transition-all hover:border-teal-400/35 hover:bg-teal-400/10 hover:text-teal-200 sm:text-[13px]"
                        >
                            {t('linkMaterials')}
                        </Link>
                        <Link
                            href="/#ai-3d-maker"
                            onClick={() => trackHero(HERO_CONVERSION_EVENTS.TERTIARY, { link: 'maker' })}
                            className="flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-2 text-center text-[12px] font-bold text-white/80 transition-all hover:border-teal-400/35 hover:bg-teal-400/10 hover:text-teal-200 sm:text-[13px]"
                        >
                            {t('linkMaker')}
                        </Link>
                        <button
                            type="button"
                            onClick={handleTrySample}
                            disabled={isLoadingSample}
                            className="flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-2 text-center text-[12px] font-bold text-white/80 transition-all hover:border-teal-400/35 hover:bg-teal-400/10 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
                        >
                            {isLoadingSample ? t('sampleLoading') : t('sampleCta')}
                        </button>
                    </div>
                </motion.div>

                {/* ── Right: 통합 Drop Zone ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="flex h-full w-full min-h-[420px] sm:min-h-[480px]"
                >
                    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/90 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-2xl">
                        {/* 탭 — 활성/비활성 대비를 높인 세그먼트 컨트롤 */}
                        <div
                            role="tablist"
                            aria-label={t('uploadModeAria')}
                            className="flex shrink-0 gap-1.5 border-b border-white/10 bg-black/35 p-2"
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
                                            'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold tracking-tight transition-all sm:text-[15px]',
                                            isActive
                                                ? id === 'file'
                                                    ? 'bg-teal-400 text-slate-950 shadow-[0_0_0_1px_rgba(45,212,191,0.55)]'
                                                    : 'bg-indigo-300 text-slate-950 shadow-[0_0_0_1px_rgba(165,180,252,0.55)]'
                                                : 'border border-white/15 bg-white/[0.04] text-white/85 hover:border-white/25 hover:bg-white/[0.08] hover:text-white',
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                'h-4 w-4 shrink-0',
                                                isActive ? 'opacity-100' : 'opacity-90',
                                            )}
                                            aria-hidden
                                        />
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Drop Zone — 확대 */}
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
                                'relative mx-4 mt-4 flex flex-1 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300',
                                isDragging
                                    ? uploadMode === 'file'
                                        ? 'border-teal-400 bg-teal-400/10 ring-2 ring-teal-400/30'
                                        : 'border-indigo-400 bg-indigo-500/10 ring-2 ring-indigo-400/30'
                                    : 'border-white/15 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]',
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

                            {/* 3D 프리뷰 배경 */}
                            <div className="pointer-events-none absolute inset-0 opacity-40">
                                <LandingHeroScene />
                            </div>

                            <div className="relative flex min-h-[280px] w-full flex-col items-center justify-center px-6 py-14 text-center sm:min-h-[340px] sm:py-16">
                                {/* AI 신뢰 배지 */}
                                <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220]/85 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
                                    <div
                                        className={cn(
                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                                            uploadMode === 'file'
                                                ? 'border-teal-400/25 bg-teal-400/10 text-teal-300'
                                                : 'border-indigo-400/25 bg-indigo-500/10 text-indigo-300',
                                        )}
                                    >
                                        <Sparkles className="h-[18px] w-[18px]" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black leading-tight text-white">
                                            {uploadMode === 'file' ? t('aiQuote') : t('aiConvert')}
                                        </p>
                                        <p
                                            className={cn(
                                                'mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em]',
                                                uploadMode === 'file' ? 'text-teal-400/80' : 'text-indigo-300/80',
                                            )}
                                        >
                                            {uploadMode === 'file' ? t('readyFile') : t('readyPhoto')}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={cn(
                                        'mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border sm:h-[4.5rem] sm:w-[4.5rem]',
                                        uploadMode === 'file'
                                            ? 'border-teal-400/30 bg-teal-400/15 text-teal-300'
                                            : 'border-indigo-400/30 bg-indigo-500/15 text-indigo-300',
                                    )}
                                >
                                    <Upload className="h-8 w-8 sm:h-9 sm:w-9" />
                                </div>
                                <p className="text-lg font-black text-white sm:text-xl">
                                    {uploadMode === 'file' ? t('dropFile') : t('dropPhoto')}
                                </p>
                                <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/50 break-keep sm:text-sm">
                                    {uploadMode === 'file' ? t('formatsFile') : t('formatsPhoto')}
                                </p>
                                <p className="mt-5 text-[11px] font-black uppercase tracking-widest text-white/35">
                                    {t('clickHint')}
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 p-4 sm:p-5">
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
                                        'h-14 w-full rounded-2xl text-sm font-black sm:text-base',
                                        uploadMode === 'file'
                                            ? 'bg-teal-400 text-slate-950 hover:bg-teal-300'
                                            : 'bg-indigo-500 text-white hover:bg-indigo-400',
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
