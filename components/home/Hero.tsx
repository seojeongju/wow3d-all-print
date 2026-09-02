'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Sparkles,
    Loader2,
    ImageIcon,
    FileBox,
    Upload,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useFileStore, useEffectiveAnalysis } from '@/store/useFileStore';
import { useToast } from '@/hooks/use-toast';
import LandingHeroScene from './LandingHeroScene';
import {
    calculateFdmQuote,
    FDM_INFILL_DEFAULT,
} from '@/lib/fdm-quote';
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

/** 파일 없을 때 Drop Zone에 표시하는 샘플 견적 (FDM·인필 20% 기준 안내용) */
const HERO_DEMO_ESTIMATE_KRW = 12_800;

type UploadMode = 'file' | 'photo';

type PrintSpecs = {
    fdm?: {
        max?: { x?: number; y?: number; z?: number };
        layerCosts?: Record<string, number>;
        hourlyRate?: number;
        fdm_layer_hours_factor?: number;
        fdm_labor_cost_krw?: number;
        fdm_support_per_cm2_krw?: number;
        minPriceKr?: number;
    };
    sla?: unknown;
    dlp?: unknown;
};
type ApiMaterial = { type: string; name?: string; price_per_gram?: number; density?: number };

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
    const router = useRouter();
    const { user } = useAuthStore();
    const { setFile, file, baseAnalysis, reset } = useFileStore();
    const analysis = useEffectiveAnalysis() ?? baseAnalysis;

    const SAMPLE_NAMES = ['sample_cube.stl', 'test_cube.stl'];
    const clearSampleIfPresent = () => {
        if (file && SAMPLE_NAMES.includes(file.name)) reset();
    };
    const { toast } = useToast();
    const [isLoadingSample, setIsLoadingSample] = useState(false);
    const [printSpecs, setPrintSpecs] = useState<PrintSpecs | null>(null);
    const [materials, setMaterials] = useState<ApiMaterial[]>([]);
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

    useEffect(() => {
        fetch('/api/print-specs')
            .then((r) => r.json())
            .then((d) => d?.data && setPrintSpecs(d.data))
            .catch(() => {});
        fetch('/api/materials')
            .then((r) => r.json())
            .then((d) => Array.isArray(d?.data) && setMaterials(d.data))
            .catch(() => {});
    }, []);

    const heroEstimate = useMemo(() => {
        if (!analysis || !printSpecs?.fdm) return null;
        const spec = printSpecs.fdm;
        const max = spec.max || { x: 220, y: 220, z: 250 };
        const bx = analysis.boundingBox?.x ?? 0;
        const by = analysis.boundingBox?.y ?? 0;
        const bz = analysis.boundingBox?.z ?? 0;
        const overflow = bx > (max.x ?? 220) || by > (max.y ?? 220) || bz > (max.z ?? 250);

        const mat = materials.find((m) => m.type === 'FDM');
        const density = mat?.density ?? 1.24;
        const pricePerGramKr = mat && typeof mat.price_per_gram === 'number' ? mat.price_per_gram : 0;
        const volumeCm3 = analysis.volume || 0;
        const surfaceAreaCm2 = analysis.surfaceArea || 0;
        const heightMm = bz;
        const layerHeight = 0.2;
        const rateKRW = spec.layerCosts?.['0.2'] ?? spec.hourlyRate ?? 5000;

        const q = calculateFdmQuote({
            volumeCm3,
            surfaceAreaCm2,
            heightMm,
            density,
            pricePerGramKr,
            infillPercent: FDM_INFILL_DEFAULT,
            layerHeightMm: layerHeight,
            supportEnabled: false,
            hourlyRateKr: rateKRW,
            fdmLaborCostKrw: spec.fdm_labor_cost_krw,
            fdmSupportPerCm2Krw: spec.fdm_support_per_cm2_krw,
            fdmLayerHoursFactor: spec.fdm_layer_hours_factor,
            applyVat: false,
            minPriceKr: spec.minPriceKr,
        });

        return {
            total: q.total,
            printability: overflow ? 85 : 100,
            overflow,
        };
    }, [analysis, printSpecs, materials]);

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
                    title: '파일 크기 초과',
                    description: '3D 파일은 최대 100MB까지 업로드할 수 있습니다.',
                    variant: 'destructive',
                });
                return;
            }
            if (!hasModelFileExtension(candidate)) {
                toast({
                    title: '지원하지 않는 형식',
                    description: 'STL, OBJ, 3MF, PLY, STEP, STP 파일만 업로드할 수 있습니다.',
                    variant: 'destructive',
                });
                return;
            }
            handleModelUpload(candidate);
        },
        [handleModelUpload, toast],
    );

    const validateAndUploadPhoto = useCallback(
        (candidate: File) => {
            if (candidate.size > MESHY_IMAGE_MAX_BYTES) {
                toast({
                    title: '파일 크기 초과',
                    description: '사진(이미지)은 최대 8MB까지 업로드할 수 있습니다.',
                    variant: 'destructive',
                });
                return;
            }
            if (!isPhotoFile(candidate)) {
                toast({
                    title: '지원하지 않는 형식',
                    description: 'JPG, PNG 이미지만 업로드할 수 있습니다.',
                    variant: 'destructive',
                });
                return;
            }
            handlePhotoUpload(candidate);
        },
        [handlePhotoUpload, toast],
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
                        title: '3D 파일이 필요합니다',
                        description: 'STL, OBJ, 3MF, PLY, STEP, STP 파일을 놓아 주세요.',
                        variant: 'destructive',
                    });
                    return;
                }
                handleModelUpload(model);
            } else {
                validateAndUploadPhoto(dropped);
            }
        },
        [uploadMode, handleModelUpload, validateAndUploadPhoto, toast],
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
            if (!res.ok) throw new Error('샘플 파일을 불러올 수 없습니다.');
            const blob = await res.blob();
            const sampleFile = new File([blob], 'sample_cube.stl', { type: 'model/stl' });
            setFile(sampleFile);
            router.push('/experience');
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '샘플 파일 로드에 실패했습니다.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingSample(false);
        }
    };

    const showLiveEstimate = Boolean(file && analysis && heroEstimate);
    const showAnalyzing = Boolean(file && !analysis);
    const displayAmount = showLiveEstimate
        ? Math.round(heroEstimate!.total)
        : HERO_DEMO_ESTIMATE_KRW;

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

            <div className="container relative z-10 mx-auto grid items-center gap-10 px-4 lg:grid-cols-2 lg:gap-12 xl:gap-14">
                {/* ── Left: 짧은 카피 + 2갈래 선택 ── */}
                <motion.div
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="text-left"
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
                                사진(이미지) → AI 3D
                            </span>
                        </span>
                    </motion.div>

                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-teal-400 sm:text-xs">
                        WOW3D PRO
                    </p>

                    <h1 className="mb-4 text-[1.85rem] font-black leading-[1.15] tracking-tight text-white sm:text-4xl md:text-[2.6rem] lg:text-[2.85rem] break-keep">
                        3D프린팅출력 ·
                        <br />
                        3D프린터출력
                        <br />
                        <span className="text-teal-400 underline decoration-teal-400/40 decoration-2 underline-offset-[6px]">
                            시제품제작 서비스
                        </span>
                    </h1>

                    <p className="mb-8 max-w-lg text-base font-medium leading-relaxed text-white/65 break-keep sm:text-lg">
                        파일 업로드 → 가격·제작기간 확인 → 주문·결제.
                        <br />
                        <span className="font-bold text-white/90">3D 파일</span>
                        이 있으면 즉시 자동견적,{' '}
                        <span className="font-bold text-white/90">사진(이미지)</span>
                        만 있어도 AI가 3D 모델을 만들어 견적으로 이어집니다.
                    </p>

                    {/* 2갈래 Fork 카드 */}
                    <div className="mb-6 grid gap-3 sm:grid-cols-2">
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
                            <p className="text-lg font-black text-white">3D 파일이 있어요</p>
                            <p className="mt-1 text-xs leading-relaxed text-white/55 break-keep">
                                STL·OBJ·STEP 등 즉시 자동견적
                            </p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-teal-300 group-hover:gap-2">
                                견적 받기 <ChevronRight className="h-3.5 w-3.5" />
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
                            <p className="text-lg font-black text-white">사진만 있어요</p>
                            <p className="mt-1 text-xs leading-relaxed text-white/55 break-keep">
                                AI가 3D 모델 생성 후 견적
                            </p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-indigo-300 group-hover:gap-2">
                                3D 만들기 <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                        </Link>
                    </div>

                    {/* Primary CTA (모바일에서도 크게) */}
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                        <Link href="/quote?entry=file" className="flex-1" onClick={() => { clearSampleIfPresent(); trackHero(HERO_CONVERSION_EVENTS.CTA_FILE); }}>
                            <Button
                                size="lg"
                                className="h-14 w-full rounded-2xl bg-teal-400 text-[15px] font-black text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:bg-teal-300"
                            >
                                <FileBox className="mr-2 h-5 w-5" />
                                3D 파일로 견적
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/quote?entry=photo" className="flex-1" onClick={() => { clearSampleIfPresent(); trackHero(HERO_CONVERSION_EVENTS.CTA_PHOTO); }}>
                            <Button
                                size="lg"
                                className="h-14 w-full rounded-2xl bg-indigo-500 text-[15px] font-black text-white shadow-[0_0_30px_rgba(99,102,241,0.35)] hover:bg-indigo-400"
                            >
                                <ImageIcon className="mr-2 h-5 w-5" />
                                사진으로 3D 만들기
                            </Button>
                        </Link>
                    </div>

                    {/* Tertiary — 텍스트 링크만 */}
                    <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-white/45">
                        <Link href="/print-methods" className="transition-colors hover:text-teal-300" onClick={() => trackHero(HERO_CONVERSION_EVENTS.TERTIARY, { link: 'print-methods' })}>
                            출력방식
                        </Link>
                        <span className="text-white/20">·</span>
                        <Link href="/materials" className="transition-colors hover:text-teal-300" onClick={() => trackHero(HERO_CONVERSION_EVENTS.TERTIARY, { link: 'materials' })}>
                            소재
                        </Link>
                        <span className="text-white/20">·</span>
                        <Link href="/#ai-3d-maker" className="transition-colors hover:text-teal-300" onClick={() => trackHero(HERO_CONVERSION_EVENTS.TERTIARY, { link: 'maker' })}>
                            로고 Maker
                        </Link>
                        <span className="text-white/20">·</span>
                        <button
                            type="button"
                            onClick={handleTrySample}
                            disabled={isLoadingSample}
                            className="transition-colors hover:text-teal-300 disabled:opacity-50"
                        >
                            {isLoadingSample ? '샘플 불러오는 중…' : '샘플 견적 체험'}
                        </button>
                    </div>

                    <div className="flex items-center gap-5 text-white/50">
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
                            <p className="text-sm font-bold leading-tight text-white">1,000+ 고객</p>
                            <p className="text-[10px] font-medium uppercase tracking-widest text-teal-500/80">
                                FDM · SLA · DLP
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* ── Right: 통합 Drop Zone + 견적 미리보기 ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="w-full"
                >
                    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f172a]/90 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-2xl xl:rounded-[2.5rem]">
                        {/* 탭 */}
                        <div className="flex border-b border-white/10 p-2">
                            {(
                                [
                                    { id: 'file' as const, label: '3D 파일', icon: FileBox },
                                    { id: 'photo' as const, label: '사진(이미지)', icon: ImageIcon },
                                ] as const
                            ).map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setUploadMode(id)}
                                    className={cn(
                                        'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black transition-all sm:text-sm',
                                        uploadMode === id
                                            ? id === 'file'
                                                ? 'bg-teal-400/15 text-teal-300'
                                                : 'bg-indigo-500/15 text-indigo-300'
                                            : 'text-white/45 hover:bg-white/5 hover:text-white/70',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Drop Zone */}
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
                                'relative mx-4 mt-4 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300',
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

                            <div className="relative flex min-h-[200px] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[220px]">
                                <div
                                    className={cn(
                                        'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border',
                                        uploadMode === 'file'
                                            ? 'border-teal-400/30 bg-teal-400/15 text-teal-300'
                                            : 'border-indigo-400/30 bg-indigo-500/15 text-indigo-300',
                                    )}
                                >
                                    <Upload className="h-7 w-7" />
                                </div>
                                <p className="text-base font-black text-white sm:text-lg">
                                    {uploadMode === 'file'
                                        ? '3D 파일을 여기에 놓으세요'
                                        : '제품 사진(이미지)을 여기에 놓으세요'}
                                </p>
                                <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/50 break-keep sm:text-sm">
                                    {uploadMode === 'file'
                                        ? 'STL · OBJ · 3MF · PLY · STEP · STP · 최대 100MB'
                                        : 'JPG · PNG · 최대 8MB · AI 3D 변환 후 견적'}
                                </p>
                                <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-white/35">
                                    클릭하여 파일 선택
                                </p>
                            </div>
                        </div>

                        {/* 견적 미리보기 */}
                        <div className="space-y-4 p-4 sm:p-5">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                        {showLiveEstimate ? 'Estimate (FDM)' : '샘플 미리보기 (FDM)'}
                                    </span>
                                    {showAnalyzing && (
                                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Analyzing
                                        </span>
                                    )}
                                    {showLiveEstimate && heroEstimate?.overflow && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                            Size check
                                        </span>
                                    )}
                                </div>

                                {!showAnalyzing && (
                                    <div
                                        className={cn(
                                            'text-3xl font-black tracking-tight sm:text-4xl',
                                            showLiveEstimate ? 'text-white' : 'text-white/90',
                                        )}
                                    >
                                        ₩ {displayAmount.toLocaleString('ko-KR')}
                                    </div>
                                )}
                                {showAnalyzing && (
                                    <div className="text-3xl font-black tracking-tight text-white/20 sm:text-4xl">
                                        ₩ —
                                    </div>
                                )}

                                <p className="mt-2 text-[11px] leading-relaxed text-white/45 break-keep sm:text-xs">
                                    {showLiveEstimate
                                        ? `인필 ${FDM_INFILL_DEFAULT}% · 지지대 미포함 · VAT 별도. 상세 옵션은 자동견적에서 조정하세요.`
                                        : '파일을 올리면 실제 견적이 바로 표시됩니다. (샘플 기준 미리보기)'}
                                </p>

                                {showLiveEstimate && (
                                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                                        <motion.div
                                            className={cn(
                                                'h-full rounded-full',
                                                heroEstimate?.overflow ? 'bg-amber-400' : 'bg-teal-400',
                                            )}
                                            initial={false}
                                            animate={{ width: `${heroEstimate?.printability ?? 100}%` }}
                                        />
                                    </div>
                                )}
                            </div>

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
                                        'h-14 w-full rounded-xl text-sm font-black sm:text-base',
                                        uploadMode === 'file'
                                            ? 'bg-teal-400 text-slate-950 hover:bg-teal-300'
                                            : 'bg-indigo-500 text-white hover:bg-indigo-400',
                                    )}
                                >
                                    {uploadMode === 'file' ? '상세 견적 받기' : '사진으로 3D 만들기'}
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
