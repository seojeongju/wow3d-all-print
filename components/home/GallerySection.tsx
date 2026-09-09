'use client';

import { useState, useEffect, useCallback, useRef, useMemo, type MouseEvent as ReactMouseEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Box, Layers, Droplets, Zap, X, ZoomIn, ArrowRight, Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { resolveGalleryImageUrl } from '@/lib/gallery-image-url';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────
export interface GalleryItem {
    id: number | string;
    title: string;
    description?: string;
    image_url: string;
    /** 대표+추가 이미지 (자세히 보기 캐러셀) */
    images?: string[];
    source_image_url?: string | null;
    material?: string | null;
    print_method?: string | null;
    tags?: string;
    created_at: string;
}

// ─────────────────────────────────────────────────────
// 출력 방식 아이콘 매핑
// ─────────────────────────────────────────────────────
function MethodIcon({ method }: { method?: string | null }) {
    const m = method?.toUpperCase();
    if (m === 'FDM') return <Box className="w-3 h-3" />;
    if (m === 'SLA') return <Droplets className="w-3 h-3" />;
    if (m === 'DLP') return <Zap className="w-3 h-3" />;
    return <Layers className="w-3 h-3" />;
}

// 이미지 없음 플레이스홀더 (실제 파일 요청 없이 사용)
const PLACEHOLDER_DATA_URI = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" fill="%231e1e2e"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%234d4d66" font-size="14" font-family="sans-serif">이미지 없음</text></svg>';

// 이미지 URL 변환 (R2 key → API 엔드포인트) — 하위 호환 re-export
export function resolveImageUrl(url: string): string {
    return resolveGalleryImageUrl(url);
}

// ─────────────────────────────────────────────────────
// 이미지 + 로드 실패 시 1회 재시도 (간헐적 미표시 완화)
// ─────────────────────────────────────────────────────
function GalleryCardImage({ imageUrl, alt }: { imageUrl: string; alt: string }) {
    const [src, setSrc] = useState(resolveImageUrl(imageUrl));
    const [retried, setRetried] = useState(false);

    // prop 변화 시 상태 동기화 추가 (버그 수정 핵심)
    useEffect(() => {
        setSrc(resolveImageUrl(imageUrl));
        setRetried(false);
    }, [imageUrl]);

    const handleError = useCallback(() => {
        if (retried) {
            setSrc(PLACEHOLDER_DATA_URI);
            return;
        }
        if (src.startsWith('/api/')) {
            setRetried(true);
            setTimeout(() => setSrc((s) => s + (s.includes('?') ? '&' : '?') + 'r=' + Date.now()), 400);
        } else {
            setSrc(PLACEHOLDER_DATA_URI);
        }
    }, [retried, src]);

    // image_url이 바뀌면 초기화
    useEffect(() => {
        const next = resolveImageUrl(imageUrl);
        setSrc(next);
        setRetried(false);
    }, [imageUrl]);

    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={handleError}
        />
    );
}

// ─────────────────────────────────────────────────────
// 개별 카드 컴포넌트
// ─────────────────────────────────────────────────────
export function GalleryCard({
    item,
    onClick,
    className,
    href,
}: {
    item: GalleryItem;
    onClick?: (item: GalleryItem) => void;
    className?: string;
    /** 지정 시 카드 전체가 이 경로로 이동 (클릭 안정성) */
    href?: string;
}) {
    const tags: string[] = (() => {
        try { return JSON.parse(item.tags || '[]'); } catch { return []; }
    })();

    const handleActivate = (e: ReactMouseEvent | ReactKeyboardEvent) => {
        e.stopPropagation();
        if (href) return; // Link가 네비게이션 담당
        if (onClick) onClick(item);
    };

    const inner = (
        <>
            {/* 카드 글로우 — 클릭 가로채기 방지 */}
            <div className="pointer-events-none absolute -inset-0.5 bg-gradient-to-br from-primary/30 via-transparent to-violet-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

            <div className="relative bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
                {/* 이미지 영역 */}
                <div className="relative aspect-square overflow-hidden bg-slate-800">
                    <GalleryCardImage imageUrl={item.image_url} alt={item.title} />

                    {item.source_image_url && (
                        <div className="pointer-events-none absolute top-3 left-3 px-2 py-1 rounded-lg bg-indigo-500/90 text-[9px] font-black uppercase tracking-wider text-white">
                            Before/After
                        </div>
                    )}
                    {!item.source_image_url && (item.images?.length ?? 0) > 1 && (
                        <div className="pointer-events-none absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/70 text-[9px] font-black tracking-wider text-white">
                            {item.images!.length}장
                        </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    {item.print_method && (
                        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full text-white text-[10px] font-semibold">
                            <MethodIcon method={item.print_method} />
                            {item.print_method.toUpperCase()}
                        </div>
                    )}
                </div>

                {/* 카드 하단 정보 */}
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-white font-bold text-sm truncate mb-1.5">{item.title}</h3>
                    {item.description && (
                        <p className="text-white/70 text-xs leading-relaxed line-clamp-2 mb-3 break-keep">
                            {item.description}
                        </p>
                    )}

                    <div className="mt-auto pt-2 flex items-center justify-between">
                        {item.material && (
                            <span className="text-[10px] text-primary/80 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                                {item.material}
                            </span>
                        )}

                        {tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap justify-end">
                                {tags.slice(0, 2).map((tag, i) => (
                                    <span key={i} className="text-[10px] text-white/60 bg-white/[0.08] px-2 py-0.5 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    const shellClass = cn(
        'group relative flex-shrink-0 cursor-pointer',
        className || 'w-72 md:w-80',
    );

    if (href) {
        return (
            <Link
                href={href}
                className={shellClass}
                onClick={(e) => e.stopPropagation()}
                prefetch
            >
                {inner}
            </Link>
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            className={shellClass}
            onClick={handleActivate}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleActivate(e);
                }
            }}
        >
            {inner}
        </div>
    );
}

// ─────────────────────────────────────────────────────
// 제품 상세 보기 모달 (Detail View)
// ─────────────────────────────────────────────────────
export function DetailViewModal({
    item,
    onClose,
    onPrev,
    onNext,
    currentIndex,
    totalCount
}: {
    item: GalleryItem;
    onClose: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    currentIndex?: number;
    totalCount?: number;
}) {
    const t = useTranslations('Home.gallery');
    const tags: string[] = (() => {
        try { return JSON.parse(item.tags || '[]'); } catch { return []; }
    })();

    const printImages = useMemo(() => {
        if (item.images && item.images.length > 0) return item.images;
        return item.image_url ? [item.image_url] : [];
    }, [item.images, item.image_url]);

    const [photoIndex, setPhotoIndex] = useState(0);
    const hasMultiPhotos = printImages.length > 1;
    const activePhoto = printImages[Math.min(photoIndex, printImages.length - 1)] || item.image_url;

    useEffect(() => {
        setPhotoIndex(0);
    }, [item.id]);

    const goPrevPhoto = useCallback(() => {
        setPhotoIndex((i) => (i <= 0 ? printImages.length - 1 : i - 1));
    }, [printImages.length]);

    const goNextPhoto = useCallback(() => {
        setPhotoIndex((i) => (i >= printImages.length - 1 ? 0 : i + 1));
    }, [printImages.length]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (hasMultiPhotos) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    goPrevPhoto();
                    return;
                }
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    goNextPhoto();
                    return;
                }
            }
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
            if (e.key === 'ArrowRight' && onNext) onNext();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, onPrev, onNext, hasMultiPhotos, goPrevPhoto, goNextPhoto]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-start justify-center p-4 md:p-10 bg-black/90 backdrop-blur-xl overflow-y-auto custom-scrollbar"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, x: 20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.9, opacity: 0, x: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative max-w-5xl w-full my-auto bg-slate-900 border border-white/15 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[300px] md:min-h-[500px]"
                onClick={(e) => e.stopPropagation()}
            >
                    {/* 닫기 버튼 */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:scale-110 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* 좌측: 이미지 영역 */}
                    <div className="md:w-3/5 bg-slate-950 relative group overflow-hidden flex flex-col min-h-[300px] md:min-h-[500px]">
                        {item.source_image_url ? (
                            <div className="flex flex-1 flex-col min-h-0">
                                <div className="flex flex-1 flex-col md:flex-row min-h-0">
                                    <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/10 min-h-[180px]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 text-center py-2 shrink-0">
                                            {t('originalPhoto')}
                                        </p>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            key={item.source_image_url}
                                            src={resolveImageUrl(item.source_image_url)}
                                            alt={`${item.title} ${t('originalPhoto')}`}
                                            className="flex-1 w-full object-contain p-3 min-h-0"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col min-h-[180px]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-teal-400/80 text-center py-2 shrink-0">
                                            {t('aiPrint')}
                                            {hasMultiPhotos ? ` ${photoIndex + 1}/${printImages.length}` : ''}
                                        </p>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            key={activePhoto}
                                            src={resolveImageUrl(activePhoto)}
                                            alt={item.title}
                                            className="flex-1 w-full object-contain p-3 min-h-0"
                                        />
                                    </div>
                                </div>
                                {hasMultiPhotos && (
                                    <div className="flex gap-2 p-3 overflow-x-auto border-t border-white/10 shrink-0">
                                        {printImages.map((url, i) => (
                                            <button
                                                key={`${url}-${i}`}
                                                type="button"
                                                onClick={() => setPhotoIndex(i)}
                                                className={cn(
                                                    'w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all',
                                                    i === photoIndex
                                                        ? 'border-teal-400 ring-2 ring-teal-400/30'
                                                        : 'border-white/10 opacity-70 hover:opacity-100'
                                                )}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={resolveImageUrl(url)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    key={activePhoto}
                                    src={resolveImageUrl(activePhoto)}
                                    alt={item.title}
                                    className="w-full flex-1 object-contain min-h-[240px]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
                                {hasMultiPhotos && (
                                    <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-2 px-4 z-10">
                                        {printImages.map((url, i) => (
                                            <button
                                                key={`${url}-${i}`}
                                                type="button"
                                                onClick={() => setPhotoIndex(i)}
                                                className={cn(
                                                    'w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all bg-black/40',
                                                    i === photoIndex
                                                        ? 'border-white ring-2 ring-white/30'
                                                        : 'border-white/20 opacity-70 hover:opacity-100'
                                                )}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={resolveImageUrl(url)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* 사진 네비게이션 (다중일 때) / 작품 네비게이션 (단일일 때) */}
                        {(hasMultiPhotos ? goPrevPhoto : onPrev) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasMultiPhotos) goPrevPhoto();
                                    else onPrev?.();
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 z-10"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}
                        {(hasMultiPhotos ? goNextPhoto : onNext) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasMultiPhotos) goNextPhoto();
                                    else onNext?.();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 z-10"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}

                        {/* 카운터 */}
                        {hasMultiPhotos ? (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 text-[10px] font-bold tracking-widest z-10">
                                {t('photoCounter', { current: photoIndex + 1, total: printImages.length })}
                            </div>
                        ) : typeof currentIndex === 'number' && totalCount ? (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 text-[10px] font-bold tracking-widest">
                                {currentIndex + 1} / {totalCount}
                            </div>
                        ) : null}
                    </div>

                    {/* 우측: 상세 정보 영역 */}
                    <div className="md:w-2/5 p-8 md:p-10 flex flex-col">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold mb-4 uppercase tracking-tighter">
                                Case Study
                            </div>
                            
                            <h3 className="text-white text-3xl font-bold mb-6 leading-tight">{item.title}</h3>
                            
                            <div className="space-y-6">
                                {/* 핵심 스펙 */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase mb-1 whitespace-nowrap">
                                            <MethodIcon method={item.print_method} />
                                            Print Method
                                        </div>
                                        <div className="text-white text-sm font-semibold truncate">{item.print_method?.toUpperCase() || 'Standard'}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase mb-1 whitespace-nowrap">
                                            <Box className="w-3 h-3" />
                                            Material
                                        </div>
                                        <div className="text-white text-sm font-semibold truncate">{item.material || 'Generic'}</div>
                                    </div>
                                </div>

                                {/* 설명 */}
                                {item.description && (
                                    <div className="space-y-2">
                                        <div className="text-white/40 text-[10px] font-bold uppercase">Description</div>
                                        <p className="text-white/80 text-base leading-relaxed break-keep font-medium line-clamp-[8]">
                                            {item.description}
                                        </p>
                                    </div>
                                )}

                                {/* 태그 */}
                                {tags.length > 0 && (
                                    <div className="flex gap-2 flex-wrap pt-2">
                                        {tags.map((tag, i) => (
                                            <span key={i} className="text-xs text-white/60 bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 하단 버튼 */}
                        <div className="mt-8 pt-8 border-t border-white/10 space-y-3">
                            {(onPrev || onNext) && hasMultiPhotos && (
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                                        disabled={!onPrev}
                                        onClick={onPrev}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        {t('prevItem')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                                        disabled={!onNext}
                                        onClick={onNext}
                                    >
                                        {t('nextItem')}
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            )}
                            <Button asChild className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2">
                                <Link href="/quote" onClick={onClose}>
                                    {t('similarQuote')}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>
        </motion.div>
    );
}

// 전체 갤러리 모달은 독립된 /gallery 라우트로 이전됨

// ─────────────────────────────────────────────────────
// 스켈레톤 카드
// ─────────────────────────────────────────────────────
function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={className || "flex-shrink-0 w-72 md:w-80"}>
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden animate-pulse h-full flex flex-col">
                <div className="aspect-square bg-slate-800" />
                <div className="p-5 space-y-2 flex-1">
                    <div className="h-4 bg-slate-700 rounded-full w-3/4" />
                    <div className="h-3 bg-slate-800 rounded-full w-full" />
                    <div className="h-3 bg-slate-800 rounded-full w-2/3" />
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// 메인 갤러리 섹션: 자동 좌측 슬라이드 + 좌·우 버튼 수동 탐색
// ─────────────────────────────────────────────────────
export default function GallerySection() {
    const t = useTranslations('Home.gallery');
    const scrollRef = useRef<HTMLDivElement>(null);
    const pausedRef = useRef(false);
    const manualPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const displayItems = useMemo(
        () => (items.length > 0 ? [...items, ...items] : []),
        [items]
    );

    const getScrollStep = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return 300;
        const firstCard = el.querySelector<HTMLElement>('[data-gallery-card]');
        const gap = window.innerWidth >= 640 ? 20 : 16;
        const cardsPerStep = window.innerWidth >= 1280 ? 2 : 1;
        return (firstCard ? firstCard.offsetWidth + gap : 280) * cardsPerStep;
    }, []);

    const normalizeInfiniteScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || items.length === 0) return;
        const half = el.scrollWidth / 2;
        if (half <= 0) return;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        if (el.scrollLeft < 0) el.scrollLeft += half;
    }, [items.length]);

    const pauseAutoScroll = useCallback((ms = 1200) => {
        pausedRef.current = true;
        if (manualPauseTimerRef.current) clearTimeout(manualPauseTimerRef.current);
        manualPauseTimerRef.current = setTimeout(() => {
            pausedRef.current = false;
            manualPauseTimerRef.current = null;
        }, ms);
    }, []);

    const scrollGallery = useCallback(
        (direction: 'left' | 'right') => {
            const el = scrollRef.current;
            if (!el) return;
            pauseAutoScroll(1400);
            const step = getScrollStep();
            el.scrollBy({
                left: direction === 'left' ? -step : step,
                behavior: 'smooth',
            });
            window.setTimeout(normalizeInfiniteScroll, 450);
        },
        [getScrollStep, normalizeInfiniteScroll, pauseAutoScroll]
    );

    useEffect(() => {
        async function fetchGallery() {
            try {
                const res = await fetch(`/api/gallery?page=1&limit=24`);
                if (!res.ok) throw new Error('fetch failed');
                const json = await res.json();
                if (json.success && json.data.items) {
                    setItems(json.data.items);
                } else {
                    setItems([]);
                }
            } catch {
                setItems([]);
            } finally {
                setLoading(false);
            }
        }
        fetchGallery();
    }, []);

    // 자동 좌측 슬라이드 (무한 루프)
    useEffect(() => {
        if (loading || items.length === 0) return;

        let raf = 0;
        let last = performance.now();

        const tick = (now: number) => {
            const el = scrollRef.current;
            if (el && !pausedRef.current) {
                const half = el.scrollWidth / 2;
                const durationSec = Math.max(25, items.length * 6);
                const speed = half > 0 ? half / durationSec : 50;
                const dt = Math.min((now - last) / 1000, 0.05);
                el.scrollLeft += speed * dt;
                if (half > 0 && el.scrollLeft >= half) {
                    el.scrollLeft -= half;
                }
            }
            last = now;
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(raf);
            if (manualPauseTimerRef.current) clearTimeout(manualPauseTimerRef.current);
        };
    }, [items.length, loading]);

    useEffect(() => {
        if (loading || items.length === 0) return;
        const el = scrollRef.current;
        if (!el) return;

        const onScroll = () => normalizeInfiniteScroll();
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [items.length, loading, normalizeInfiniteScroll]);

    const isEmpty = !loading && items.length === 0;

    return (
        <>
            <section className="py-16 sm:py-20 relative overflow-hidden">
                {/* 연한 블랙 및 그라데이션 배경 (Hero와 동일) */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
                {/* 틸/블루 은은한 포인트 오버레이 */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

                {/* 그리드 배경 */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* 배경 글로우 포인트들 */}
                <div className="absolute left-0 top-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-teal-500/10 sm:bg-teal-500/20 blur-[80px] sm:blur-[130px]" />
                <div className="absolute right-0 bottom-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-indigo-600/10 sm:bg-indigo-600/15 blur-[100px] sm:blur-[150px]" />

                <div className="container mx-auto px-6 mb-8 sm:mb-10 relative z-20">
                    {/* 헤더 */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between max-w-[1400px] mx-auto w-full gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            className="relative z-30"
                        >
                            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-semibold mb-3 sm:mb-4 uppercase tracking-[0.15em] sm:tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                PORTFOLIO
                            </div>
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                                {t('titleBefore')}<span className="text-teal-400">{t('titleAccent')}</span>
                            </h2>
                            <p className="text-white/60 sm:text-white/70 text-xs sm:text-sm mt-3 max-w-md break-keep leading-relaxed font-medium">
                                {t('subtitle')}
                            </p>
                        </motion.div>

                        {/* 더보기 버튼 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="hidden sm:block"
                        >
                            <Link href="/gallery">
                                <Button
                                    variant="outline"
                                    className="gap-2 rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-all h-10 px-5"
                                >
                                    <Grid3X3 className="w-4 h-4 text-primary" />
                                    <span className="font-semibold">{t('viewAll')}</span>
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* 모바일 화면용 더보기 버튼 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mt-6 sm:hidden"
                    >
                        <Link href="/gallery">
                            <Button
                                variant="outline"
                                className="gap-2 rounded-full border-white/10 bg-white/5 active:bg-white/10 text-white w-full h-11 text-xs font-bold"
                            >
                                <Grid3X3 className="w-4 h-4 text-primary" />
                                {t('viewAllMobile')}
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* 갤러리 슬라이더 */}
                <div className="w-full flex justify-center pb-8 pt-4">
                    <div className="w-full max-w-[1400px] relative px-4 xl:px-6 flex flex-col items-center">
                        {loading ? (
                            <div className="flex gap-4 sm:gap-5 w-full overflow-hidden justify-center">
                                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="w-64 sm:w-80 flex-shrink-0" />)}
                            </div>
                        ) : isEmpty ? (
                            <div className="flex gap-4 sm:gap-5 w-full overflow-hidden justify-center">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="w-64 sm:w-80 h-[340px] sm:h-[380px] flex-shrink-0">
                                        <div className="bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden h-full flex flex-col">
                                            <div className="flex-1 bg-slate-800/60 flex flex-col items-center justify-center gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                    <Box className="w-7 h-7 text-primary/40" />
                                                </div>
                                                <p className="text-white/20 text-[11px] font-bold">{t('empty')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="relative w-full group/gallery" role="region" aria-label={t('aria')}>
                                {items.length > 1 && (
                                    <>
                                        <div
                                            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 sm:w-16 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-transparent"
                                            aria-hidden
                                        />
                                        <div
                                            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 sm:w-16 bg-gradient-to-l from-[#1f2937] via-[#1f2937]/80 to-transparent"
                                            aria-hidden
                                        />
                                        <button
                                            type="button"
                                            onClick={() => scrollGallery('left')}
                                            aria-label={t('prev')}
                                            className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:bg-black/70 hover:scale-105 shadow-lg"
                                        >
                                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => scrollGallery('right')}
                                            aria-label={t('next')}
                                            className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:bg-black/70 hover:scale-105 shadow-lg"
                                        >
                                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                    </>
                                )}
                                <div
                                    ref={scrollRef}
                                    className="flex gap-4 sm:gap-5 overflow-x-hidden pb-2 min-h-[340px] sm:min-h-[380px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                    onMouseEnter={() => {
                                        pausedRef.current = true;
                                    }}
                                    onMouseLeave={() => {
                                        if (!manualPauseTimerRef.current) pausedRef.current = false;
                                    }}
                                    onTouchStart={() => {
                                        pausedRef.current = true;
                                    }}
                                    onTouchEnd={() => pauseAutoScroll(1500)}
                                >
                                    {displayItems.map((item, i) => (
                                        <div
                                            key={`${item.id}-${i}`}
                                            data-gallery-card
                                            className="relative z-10 w-64 sm:w-80 flex-shrink-0"
                                        >
                                            <GalleryCard
                                                item={item}
                                                href={`/gallery?id=${encodeURIComponent(String(item.id))}`}
                                                className="block w-full active:scale-[0.98] transition-transform"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 하단 CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="container mx-auto px-6 mt-4 sm:mt-6 flex justify-center"
                >
                    <Button
                        asChild
                        size="lg"
                        className="rounded-full h-11 sm:h-12 px-6 sm:px-8 bg-primary hover:bg-primary/90 text-[13px] sm:text-base text-primary-foreground shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] font-bold"
                    >
                        <Link href="/quote">
                            {t('quoteCta')}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </motion.div>
            </section>
        </>
    );
}
