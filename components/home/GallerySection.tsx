'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Layers, Droplets, Zap, X, ZoomIn, ArrowRight, Grid3X3, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { resolveGalleryImageUrl } from '@/lib/gallery-image-url';

// ─────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────
export interface GalleryItem {
    id: number | string;
    title: string;
    description?: string;
    image_url: string;
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
    className
}: {
    item: GalleryItem;
    onClick?: (item: GalleryItem) => void;
    className?: string;
}) {
    const tags: string[] = (() => {
        try { return JSON.parse(item.tags || '[]'); } catch { return []; }
    })();

    return (
        <div
            className={className || "group relative flex-shrink-0 w-72 md:w-80 cursor-pointer"}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(item);
            }}
        >
            {/* 카드 글로우 */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 via-transparent to-violet-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

            <div className="relative bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
                {/* 이미지 영역 */}
                <div className="relative aspect-square overflow-hidden bg-slate-800">
                    <GalleryCardImage imageUrl={item.image_url} alt={item.title} />

                    {/* 출력 방식 뱃지 */}
                    {item.source_image_url && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-indigo-500/90 text-[9px] font-black uppercase tracking-wider text-white">
                            Before/After
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    {/* 출력 방식 배지 */}
                    {item.print_method && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full text-white text-[10px] font-semibold">
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
                        {/* 소재 */}
                        {item.material && (
                            <span className="text-[10px] text-primary/80 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                                {item.material}
                            </span>
                        )}

                        {/* 태그 */}
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
    const tags: string[] = (() => {
        try { return JSON.parse(item.tags || '[]'); } catch { return []; }
    })();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
            if (e.key === 'ArrowRight' && onNext) onNext();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, onPrev, onNext]);

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
                            <div className="flex flex-1 flex-col md:flex-row min-h-0">
                                <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/10 min-h-[180px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 text-center py-2 shrink-0">
                                        원본 사진
                                    </p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        key={item.source_image_url}
                                        src={resolveImageUrl(item.source_image_url)}
                                        alt={`${item.title} 원본 사진`}
                                        className="flex-1 w-full object-contain p-3 min-h-0"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col min-h-[180px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-400/80 text-center py-2 shrink-0">
                                        AI 3D · 출력
                                    </p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        key={item.image_url}
                                        src={resolveImageUrl(item.image_url)}
                                        alt={item.title}
                                        className="flex-1 w-full object-contain p-3 min-h-0"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    key={item.image_url}
                                    src={resolveImageUrl(item.image_url)}
                                    alt={item.title}
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
                            </>
                        )}

                        {/* 내비게이션 화살표 */}
                        {onPrev && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}
                        {onNext && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onNext(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}

                        {/* 카운터 */}
                        {typeof currentIndex === 'number' && totalCount && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 text-[10px] font-bold tracking-widest">
                                {currentIndex + 1} / {totalCount}
                            </div>
                        )}
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
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <Button asChild className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2">
                                <Link href="/quote" onClick={onClose}>
                                    유사 시제품 견적 문의하기
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
// 메인 갤러리 섹션: 4장 고정 뷰, 한 장씩 자연스럽게 왼쪽으로 흐르는 연속 마키
// ─────────────────────────────────────────────────────
const CARD_SLOT_PX = 340; // 카드 너비 + 간격 (한 장 기준)
const MARQUEE_CYCLE_SEC = 45; // 한 사이클(전체 한 바퀴) 초

export default function GallerySection() {
    const router = useRouter();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const itemCount = items.length;
    // 끊김 없이 한 장씩 흐르도록 아이템 2벌 연결
    const displayItems = useMemo(() => (itemCount > 0 ? [...items, ...items] : []), [items, itemCount]);

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

    const isEmpty = !loading && items.length === 0;

    return (
        <>
            {/* 전체화면 갤러리 모달 제거됨 (Link로 우회) */}

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
                                시제품제작<span className="text-teal-400">갤러리</span>
                            </h2>
                            <p className="text-white/60 sm:text-white/70 text-xs sm:text-sm mt-3 max-w-md break-keep leading-relaxed font-medium">
                                전담 전문가들이 다양한 소재와 출력 방식으로 제작한 고품질 실제 출력물들을 확인하세요.
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
                                    <span className="font-semibold">전체 갤러리 보기</span>
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
                                전체 출력 포트폴리오 보기
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* 마키 컨테이너 */}
                <div className="w-full overflow-hidden flex justify-center pb-8 pt-4">
                    <div className="w-full relative px-4 xl:px-0 flex flex-col items-center">
                        {loading ? (
                            <div className="flex gap-4 sm:gap-5 w-full overflow-hidden px-4 justify-center">
                                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="w-64 sm:w-80 flex-shrink-0" />)}
                            </div>
                        ) : isEmpty ? (
                            <div className="flex gap-4 sm:gap-5 w-full overflow-hidden px-4 justify-center">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="w-64 sm:w-80 h-[340px] sm:h-[380px] flex-shrink-0">
                                        <div className="bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden h-full flex flex-col">
                                            <div className="flex-1 bg-slate-800/60 flex flex-col items-center justify-center gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                    <Box className="w-7 h-7 text-primary/40" />
                                                </div>
                                                <p className="text-white/20 text-[11px] font-bold">포트폴리오 준비 중</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full overflow-hidden min-h-[340px] sm:min-h-[380px]">
                                <div 
                                    className="flex gap-4 sm:gap-5 animate-marquee"
                                    style={{ 
                                        '--marquee-duration': `${Math.max(25, items.length * 6)}s` 
                                    } as React.CSSProperties}
                                >
                                    {displayItems.map((item, i) => (
                                        <GalleryCard
                                            key={`marquee-${i}-${item.id}`}
                                            item={item}
                                            onClick={() => {
                                                router.push('/gallery');
                                            }}
                                            className="w-64 sm:w-80 flex-shrink-0 active:scale-[0.98] transition-transform"
                                        />
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
                            AI 실시간 자동견적 받기
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </motion.div>
            </section>
        </>
    );
}
