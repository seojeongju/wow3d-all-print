'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Layers, Droplets, Zap, X, ZoomIn, ArrowRight, Grid3X3, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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
// 제품 상세 보기 모달 (Detail View)
// ─────────────────────────────────────────────────────
function DetailViewModal({
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
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={item.id}
                    initial={{ scale: 0.9, opacity: 0, x: 20 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    exit={{ scale: 0.9, opacity: 0, x: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative max-w-5xl w-full bg-slate-900 border border-white/15 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]"
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
                    <div className="md:w-3/5 bg-slate-950 relative group overflow-hidden flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={resolveImageUrl(item.image_url)}
                            alt={item.title}
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />

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
                            <Link href="/quote" onClick={onClose}>
                                <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold gap-2">
                                    유사 시제품 견적 문의하기
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
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
            {/* 제품 상세 보기 모달 */}
            <AnimatePresence>
                {selectedItem && (
                    <DetailViewModal 
                        item={selectedItem} 
                        onClose={() => setSelectedItem(null)}
                        onPrev={() => {
                            const idx = items.findIndex(i => i.id === selectedItem.id);
                            if (idx > 0) setSelectedItem(items[idx - 1]);
                            else setSelectedItem(items[items.length - 1]);
                        }}
                        onNext={() => {
                            const idx = items.findIndex(i => i.id === selectedItem.id);
                            if (idx < items.length - 1) setSelectedItem(items[idx + 1]);
                            else setSelectedItem(items[0]);
                        }}
                        currentIndex={items.findIndex(i => i.id === selectedItem.id)}
                        totalCount={items.length}
                    />
                )}
            </AnimatePresence>

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

                <div className="container mx-auto px-4 mb-10 relative z-20">
                    {/* 헤더 */}
                    <div className="flex items-end justify-between max-w-[1400px] mx-auto w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            className="relative z-30"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                PORTFOLIO
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                                시제품제작<span className="text-teal-400">갤러리</span>
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

                {/* 1x4 뷰포트, 한 장씩 왼쪽으로 흐르는 연속 마키 (CSS 기반으로 호버 시 일시정지 가능) */}
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
                                <div 
                                    className="flex gap-5 animate-marquee"
                                    style={{ 
                                        '--marquee-duration': `${Math.max(20, items.length * 5)}s` 
                                    } as React.CSSProperties}
                                >
                                    {displayItems.map((item, i) => (
                                        <GalleryCard
                                            key={`${i}-${item.id}`}
                                            item={item}
                                            onClick={setSelectedItem}
                                            className="w-72 md:w-80 flex-shrink-0"
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
