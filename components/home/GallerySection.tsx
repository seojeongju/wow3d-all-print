'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Box, Layers, Droplets, Zap, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ─────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────
interface GalleryItem {
    id: number;
    title: string;
    description?: string;
    image_url: string;
    material?: string;
    print_method?: string;
    tags?: string;
    created_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
}

// ─────────────────────────────────────────────────────
// 출력 방식 아이콘 매핑
// ─────────────────────────────────────────────────────
function MethodIcon({ method }: { method?: string }) {
    const m = method?.toUpperCase();
    if (m === 'FDM') return <Box className="w-3 h-3" />;
    if (m === 'SLA') return <Droplets className="w-3 h-3" />;
    if (m === 'DLP') return <Zap className="w-3 h-3" />;
    return <Layers className="w-3 h-3" />;
}

// ─────────────────────────────────────────────────────
// 이미지 URL 변환 (R2 key → API 엔드포인트)
// ─────────────────────────────────────────────────────
function resolveImageUrl(url: string): string {
    if (!url) return '/placeholder-3d.jpg';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    // gallery/xxx.jpg → /api/gallery/image/xxx.jpg
    if (url.startsWith('gallery/')) {
        return `/api/gallery/image/${url.replace(/^gallery\//, '')}`;
    }
    return `/api/files/${url}`;
}

// ─────────────────────────────────────────────────────
// 개별 카드 컴포넌트
// ─────────────────────────────────────────────────────
function GalleryCard({
    item,
    index,
    onClick,
}: {
    item: GalleryItem;
    index: number;
    onClick: (item: GalleryItem) => void;
}) {
    const tags: string[] = (() => {
        try { return JSON.parse(item.tags || '[]'); } catch { return []; }
    })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            whileHover={{ y: -6, scale: 1.015 }}
            className="group relative flex-shrink-0 w-72 md:w-80 cursor-pointer"
            onClick={() => onClick(item)}
        >
            {/* 카드 글로우 */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 via-transparent to-violet-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

            <div className="relative bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {/* 이미지 영역 */}
                <div className="relative aspect-square overflow-hidden bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={resolveImageUrl(item.image_url)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" fill="%231e1e2e"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%234d4d66" font-size="14" font-family="sans-serif">이미지 없음</text></svg>';
                        }}
                    />

                    {/* 호버 오버레이 */}
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
                <div className="p-5">
                    <h3 className="text-white font-bold text-sm truncate mb-1.5">{item.title}</h3>
                    {item.description && (
                        <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-3 break-keep">
                            {item.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
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
                                    <span key={i} className="text-[10px] text-white/40 bg-white/[0.06] px-2 py-0.5 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────
// 라이트박스 모달
// ─────────────────────────────────────────────────────
function LightboxModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
    const tags: string[] = (() => {
        try { return JSON.parse(item.tags || '[]'); } catch { return []; }
    })();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative max-w-2xl w-full bg-slate-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 닫기 버튼 */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* 이미지 */}
                    <div className="aspect-[4/3] bg-slate-800 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={resolveImageUrl(item.image_url)}
                            alt={item.title}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {/* 정보 */}
                    <div className="p-6 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-white text-xl font-bold">{item.title}</h3>
                            <div className="flex gap-2 shrink-0">
                                {item.print_method && (
                                    <span className="flex items-center gap-1 text-[11px] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full font-semibold">
                                        <MethodIcon method={item.print_method} />
                                        {item.print_method.toUpperCase()}
                                    </span>
                                )}
                                {item.material && (
                                    <span className="text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full font-semibold">
                                        {item.material}
                                    </span>
                                )}
                            </div>
                        </div>
                        {item.description && (
                            <p className="text-white/60 text-sm leading-relaxed break-keep">{item.description}</p>
                        )}
                        {tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap pt-1">
                                {tags.map((tag, i) => (
                                    <span key={i} className="text-xs text-white/40 bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─────────────────────────────────────────────────────
// 스켈레톤 카드
// ─────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="flex-shrink-0 w-72 md:w-80">
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-slate-800" />
                <div className="p-5 space-y-2">
                    <div className="h-4 bg-slate-700 rounded-full w-3/4" />
                    <div className="h-3 bg-slate-800 rounded-full w-full" />
                    <div className="h-3 bg-slate-800 rounded-full w-2/3" />
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// 메인 갤러리 섹션
// ─────────────────────────────────────────────────────
const INITIAL_LIMIT = 8;
const MORE_PER_PAGE = 4;

export default function GallerySection() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    const trackRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // 스크롤 상태 업데이트
    const updateScrollButtons = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 8);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    }, []);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateScrollButtons, { passive: true });
        updateScrollButtons();
        return () => el.removeEventListener('scroll', updateScrollButtons);
    }, [updateScrollButtons, items]);

    // 초기 데이터 페치
    const fetchGallery = useCallback(async (page: number, append = false) => {
        try {
            const limit = page === 1 ? INITIAL_LIMIT : MORE_PER_PAGE;
            const res = await fetch(`/api/gallery?page=${page}&limit=${limit}`);
            if (!res.ok) throw new Error('fetch failed');
            const json = await res.json() as { success: boolean; data: { items: GalleryItem[]; pagination: Pagination } };
            if (json.success) {
                setItems(prev => append ? [...prev, ...json.data.items] : json.data.items);
                setPagination(json.data.pagination);
            }
        } catch {
            // API 미구성 or 테이블 미생성 → 데모 데이터 표시
            if (!append) {
                setItems([]);
                setPagination(null);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchGallery(1);
    }, [fetchGallery]);

    // 자동 슬라이드 로직
    useEffect(() => {
        if (isHovered || loading || items.length === 0) return;

        const interval = setInterval(() => {
            const el = trackRef.current;
            if (!el) return;

            // 끝에 도달했는지 확인 (스크롤 오차 감안 16px)
            if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 16) {
                // 처음으로 부드럽게 되돌아가기
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                // 다음 카드로 넘어감 (카드 너비 + 갭 크기)
                const cardWidth = window.innerWidth >= 768 ? 340 : 308;
                el.scrollBy({ left: cardWidth, behavior: 'smooth' });
            }
        }, 3000); // 3초마다 슬라이드

        return () => clearInterval(interval);
    }, [isHovered, loading, items]);

    const handleLoadMore = async () => {
        const nextPage = currentPage + 1;
        setLoadingMore(true);
        setCurrentPage(nextPage);
        await fetchGallery(nextPage, true);
        // 더 로드 후 스크롤 끝으로 이동
        setTimeout(() => {
            const el = trackRef.current;
            if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
        }, 300);
    };

    const scroll = (dir: 'left' | 'right') => {
        const el = trackRef.current;
        if (!el) return;
        const cardWidth = 336; // w-80 + gap
        el.scrollBy({ left: dir === 'left' ? -cardWidth * 2 : cardWidth * 2, behavior: 'smooth' });
    };

    const hasMore = pagination ? pagination.hasNext : false;
    const isEmpty = !loading && items.length === 0;

    return (
        <>
            {/* 라이트박스 */}
            {selectedItem && (
                <LightboxModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}

            <section className="py-20 relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a0a14] to-slate-950">
                {/* 배경 데코 */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="container mx-auto px-4 mb-10">
                    {/* 헤더 */}
                    <div className="flex items-end justify-between max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                출력물 갤러리
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                WOW3D의 <span className="text-primary">실제 출력 결과물</span>
                            </h2>
                            <p className="text-white/50 text-sm mt-2 max-w-md break-keep leading-relaxed">
                                다양한 소재와 출력 방식으로 제작된 실제 출력물들을 확인하세요.
                            </p>
                        </motion.div>

                        {/* 스크롤 화살표 (데스크탑) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="hidden md:flex items-center gap-2"
                        >
                            <button
                                onClick={() => scroll('left')}
                                disabled={!canScrollLeft}
                                className="w-10 h-10 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                disabled={!canScrollRight}
                                className="w-10 h-10 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* 슬라이더 트랙 */}
                <div
                    ref={trackRef}
                    className="flex gap-5 overflow-x-auto pb-4 px-4 md:px-[max(1rem,calc((100vw-72rem)/2))] scroll-smooth no-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onTouchStart={() => setIsHovered(true)}
                    onTouchEnd={() => {
                        // 터치 종료 후 잠시 멈췄다가 다시 슬라이드 시작
                        setTimeout(() => setIsHovered(false), 2000);
                    }}
                >
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : isEmpty ? (
                        // 데이터 없을 때 플레이스홀더
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-72 md:w-80">
                                <div className="bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden">
                                    <div className="aspect-square bg-slate-800/60 flex flex-col items-center justify-center gap-3">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <Box className="w-8 h-8 text-primary/40" />
                                        </div>
                                        <p className="text-white/20 text-xs">출력물 준비 중</p>
                                    </div>
                                    <div className="p-5">
                                        <div className="h-4 bg-white/5 rounded-full w-2/3 mb-2" />
                                        <div className="h-3 bg-white/[0.03] rounded-full w-full" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            {items.map((item, i) => (
                                <GalleryCard
                                    key={item.id}
                                    item={item}
                                    index={i}
                                    onClick={setSelectedItem}
                                />
                            ))}

                            {/* 더보기 카드 */}
                            {(hasMore || loadingMore) && (
                                <div className="flex-shrink-0 w-72 md:w-80 flex items-center justify-center">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="group flex flex-col items-center gap-4 p-8 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary/30 rounded-3xl transition-all duration-300 w-full aspect-square cursor-pointer disabled:opacity-60"
                                    >
                                        {loadingMore ? (
                                            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                                                <ArrowRight className="w-6 h-6 text-primary" />
                                            </div>
                                        )}
                                        <div className="text-center">
                                            <p className="text-white font-bold text-sm">더 보기</p>
                                            {pagination && (
                                                <p className="text-white/40 text-xs mt-1">
                                                    {pagination.total - items.length}개 더 있음
                                                </p>
                                            )}
                                        </div>
                                    </motion.button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 하단 CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="container mx-auto px-4 mt-10 flex justify-center"
                >
                    <Link href="/quote">
                        <Button
                            size="lg"
                            className="rounded-full h-12 px-8 bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
                        >
                            내 모델 견적 받기
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </section>
        </>
    );
}
