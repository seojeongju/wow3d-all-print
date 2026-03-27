'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Layers, Droplets, Zap, X, ZoomIn, ArrowRight, Grid3X3, Loader2 } from 'lucide-react';
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

// 이미지 없음 플레이스홀더 (실제 파일 요청 없이 사용)
const PLACEHOLDER_DATA_URI = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" fill="%231e1e2e"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%234d4d66" font-size="14" font-family="sans-serif">이미지 없음</text></svg>';

// ─────────────────────────────────────────────────────
// 이미지 URL 변환 (R2 key → API 엔드포인트)
// ─────────────────────────────────────────────────────
function resolveImageUrl(url: string): string {
    if (!url || typeof url !== 'string' || !url.trim()) return PLACEHOLDER_DATA_URI;
    // placeholder 또는 존재하지 않는 정적 경로는 요청하지 않음
    if (url === '/placeholder-3d.jpg' || url.endsWith('placeholder-3d.jpg')) return PLACEHOLDER_DATA_URI;
    if (url.startsWith('http') || url.startsWith('/')) return url;
    // gallery/xxx.jpg → /api/gallery/image/xxx.jpg
    if (url.startsWith('gallery/')) {
        return `/api/gallery/image/${url.replace(/^gallery\//, '')}`;
    }
    return `/api/files/${url}`;
}

// ─────────────────────────────────────────────────────
// 이미지 + 로드 실패 시 1회 재시도 (간헐적 미표시 완화)
// ─────────────────────────────────────────────────────
function GalleryCardImage({ imageUrl, alt }: { imageUrl: string; alt: string }) {
    const resolved = resolveImageUrl(imageUrl);
    const [src, setSrc] = useState(resolved);
    const [retried, setRetried] = useState(false);

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
function GalleryCard({
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
            onClick={() => onClick && onClick(item)}
        >
            {/* 카드 글로우 */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 via-transparent to-violet-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

            <div className="relative bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
                {/* 이미지 영역 */}
                <div className="relative aspect-square overflow-hidden bg-slate-800">
                    <GalleryCardImage imageUrl={item.image_url} alt={item.title} />

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
// 라이트박스 모달 (이미지 자세히 보기)
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
// 전체 갤러리 모달창 (더보기 클릭 시 노출)
// ─────────────────────────────────────────────────────
function FullGalleryModal({ onClose, onImageClick }: { onClose: () => void, onImageClick: (item: GalleryItem) => void }) {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // 모달창이 열렸을 때 부모 스크롤 고정
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const fetchGallery = async (p: number) => {
        try {
            const res = await fetch(`/api/gallery?page=${p}&limit=12`);
            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setItems(prev => p === 1 ? json.data.items : [...prev, ...json.data.items]);
                    setHasNext(json.data.pagination.hasNext);
                }
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchGallery(1);
    }, []);

    const handleLoadMore = () => {
        if (loadingMore || !hasNext) return;
        setLoadingMore(true);
        const next = page + 1;
        setPage(next);
        fetchGallery(next);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[150] bg-slate-950 flex flex-col"
        >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-[160] shadow-xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Grid3X3 className="w-7 h-7 text-primary" />
                    전체 출력물 갤러리
                </h2>
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-white/50 text-sm">출력물을 불러오는 중입니다...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center text-white/50 py-20 bg-white/5 rounded-3xl max-w-2xl mx-auto border border-white/10">
                        <Box className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>아직 등록된 출력물이 없습니다.</p>
                    </div>
                ) : (
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {items.map((item) => (
                                <GalleryCard
                                    key={item.id}
                                    item={item}
                                    onClick={onImageClick}
                                    className="group relative w-full cursor-pointer"
                                />
                            ))}
                        </div>

                        {hasNext && (
                            <div className="flex justify-center mt-12 mb-8">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 w-full max-w-xs rounded-full h-12"
                                >
                                    {loadingMore ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /> : '출력 이미지 더 불러오기'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

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
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [isFullGalleryOpen, setIsFullGalleryOpen] = useState(false);
    const [marqueeKey, setMarqueeKey] = useState(0);

    const itemCount = items.length;
    const hasItems = itemCount > 0;
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
            {/* 개별 이미지 라이트박스 */}
            {selectedItem && (
                <LightboxModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}

            {/* 전체 갤러리 모달 */}
            <AnimatePresence>
                {isFullGalleryOpen && (
                    <FullGalleryModal
                        onClose={() => setIsFullGalleryOpen(false)}
                        onImageClick={setSelectedItem}
                    />
                )}
            </AnimatePresence>

            <section className="py-20 relative overflow-hidden">
                {/* 연한 블랙 및 그라데이션 배경 (Hero와 동일) */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
                {/* 틸/블루 은은한 포인트 오버레이 */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

                {/* 그리드 배경 */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* 배경 글로우 포인트들 */}
                <div className="absolute left-0 top-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-[130px]" />
                <div className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[150px]" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[300px] h-[300px] rounded-full bg-purple-800/10 blur-[100px]" />

                <div className="container mx-auto px-4 mb-10">
                    {/* 헤더 */}
                    <div className="flex items-end justify-between max-w-[1400px] mx-auto w-full">
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
                            <p className="text-white/70 text-sm mt-2 max-w-md break-keep leading-relaxed font-medium">
                                다양한 소재와 출력 방식으로 제작된 실제 출력물들을 확인하세요.
                            </p>
                        </motion.div>

                        {/* 더보기 버튼 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="hidden sm:block"
                        >
                            <Button
                                variant="outline"
                                className="gap-2 rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-all h-10 px-5"
                                onClick={() => setIsFullGalleryOpen(true)}
                            >
                                <Grid3X3 className="w-4 h-4 text-primary" />
                                <span className="font-semibold">전체 갤러리 보기</span>
                            </Button>
                        </motion.div>
                    </div>

                    {/* 모바일 화면용 더보기 버튼 (헤더 아래 정렬) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mt-6 sm:hidden"
                    >
                        <Button
                            variant="outline"
                            className="gap-2 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white w-full h-12"
                            onClick={() => setIsFullGalleryOpen(true)}
                        >
                            <Grid3X3 className="w-4 h-4 text-primary" />
                            <span className="font-semibold">전체 출력 이미지 보기</span>
                        </Button>
                    </motion.div>
                </div>

                {/* 1x4 뷰포트, 한 장씩 왼쪽으로 흐르는 연속 마키 */}
                <div className="w-full overflow-hidden flex justify-center pb-8 pt-4">
                    <div className="w-full max-w-[1340px] relative px-4 xl:px-0 flex flex-col items-center">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-[1280px] mx-auto justify-items-center">
                                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : isEmpty ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-[1280px] mx-auto justify-items-center">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="w-72 md:w-80 h-[380px]">
                                        <div className="bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden h-full flex flex-col">
                                            <div className="flex-1 bg-slate-800/60 flex flex-col items-center justify-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                    <Box className="w-8 h-8 text-primary/40" />
                                                </div>
                                                <p className="text-white/20 text-xs">출력물 준비 중</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full max-w-[1280px] mx-auto overflow-hidden min-h-[380px]">
                                {/* 한 장씩 자연스럽게 왼쪽으로 흐르는 연속 스크롤 (한 사이클 후 리셋으로 무한) */}
                                <motion.div
                                    key={marqueeKey}
                                    className="flex gap-5"
                                    style={{ width: displayItems.length * CARD_SLOT_PX }}
                                    initial={{ x: 0 }}
                                    animate={{ x: -(itemCount * CARD_SLOT_PX) }}
                                    transition={{
                                        duration: MARQUEE_CYCLE_SEC,
                                        ease: 'linear',
                                    }}
                                    onAnimationComplete={() => setMarqueeKey((k) => k + 1)}
                                >
                                    {displayItems.map((item, i) => (
                                        <GalleryCard
                                            key={`${i}-${item.id}`}
                                            item={item}
                                            onClick={setSelectedItem}
                                            className="w-72 md:w-80 flex-shrink-0"
                                        />
                                    ))}
                                </motion.div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 하단 CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="container mx-auto px-4 mt-6 flex justify-center"
                >
                    <Link href="/quote">
                        <Button
                            size="lg"
                            className="rounded-full h-12 px-8 bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
                        >
                            AI 실시간 자동견적 받기
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </section>
        </>
    );
}
