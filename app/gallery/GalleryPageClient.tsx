'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, Loader2, Box, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import Header from "@/components/layout/Header";
import { GalleryItem, GalleryCard, DetailViewModal } from '@/components/home/GallerySection';

const ITEMS_PER_PAGE = 15;

type GalleryPageClientProps = {
    initialItems: GalleryItem[];
    initialTotalPages: number;
    initialTag?: 'all' | 'photo-to-3d';
    initialItemId?: string | null;
};

export default function GalleryPageClient({
    initialItems,
    initialTotalPages,
    initialTag = 'all',
    initialItemId = null,
}: GalleryPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [items, setItems] = useState<GalleryItem[]>(initialItems);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [galleryTag, setGalleryTag] = useState<'all' | 'photo-to-3d'>(initialTag);

    const fetchGallery = async (p: number, tag: 'all' | 'photo-to-3d' = galleryTag) => {
        setLoading(true);
        try {
            const tagQuery = tag === 'photo-to-3d' ? '&tag=photo-to-3d' : '';
            const res = await fetch(`/api/gallery?page=${p}&limit=${ITEMS_PER_PAGE}${tagQuery}`);
            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setItems(json.data.items);
                    setTotalPages(json.data.pagination.totalPages || 1);
                }
            }
        } finally {
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (page === 1 && galleryTag === initialTag) {
            setItems(initialItems);
            setTotalPages(initialTotalPages);
            return;
        }
        fetchGallery(page, galleryTag);
    }, [page, galleryTag, initialItems, initialTotalPages, initialTag]);

    const handleTagChange = (tag: 'all' | 'photo-to-3d') => {
        setGalleryTag(tag);
        setPage(1);
        setSelectedItem(null);
        const params = new URLSearchParams();
        if (tag === 'photo-to-3d') params.set('tag', 'photo-to-3d');
        const qs = params.toString();
        router.replace(qs ? `/gallery?${qs}` : '/gallery', { scroll: false });
        if (tag === initialTag) {
            setItems(initialItems);
            setTotalPages(initialTotalPages);
        } else {
            fetchGallery(1, tag);
        }
    };

    const openItem = useCallback((item: GalleryItem) => {
        setSelectedItem(item);
        const params = new URLSearchParams(searchParams.toString());
        params.set('id', String(item.id));
        router.replace(`/gallery?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    const closeItem = useCallback(() => {
        setSelectedItem(null);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('id');
        const qs = params.toString();
        router.replace(qs ? `/gallery?${qs}` : '/gallery', { scroll: false });
    }, [router, searchParams]);

    useEffect(() => {
        const idFromUrl = searchParams.get('id') || initialItemId;
        if (!idFromUrl) {
            setSelectedItem(null);
            return;
        }

        const inList = items.find((i) => String(i.id) === String(idFromUrl));
        if (inList) {
            setSelectedItem(inList);
            return;
        }

        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch(`/api/gallery/${encodeURIComponent(idFromUrl)}`);
                const json = await res.json();
                if (!cancelled && res.ok && json.success && json.data) {
                    setSelectedItem(json.data as GalleryItem);
                }
            } catch {
                /* ignore */
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams, initialItemId, items]);

    // 하단 페이지네이션 렌더링 도우미 (최대 5개 노출)
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        const maxPagesToShow = 5;
        let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        let endPage = startPage + maxPagesToShow - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        const buttons = [];
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${
                        page === i 
                        ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {i}
                </button>
            );
        }
        return buttons;
    };

    return (
        <main className="min-h-screen bg-[#0b0f19] pt-28 pb-20 relative overflow-hidden">
            <Header />
            {/* 배경 효과 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* 홈으로 가기 상단 영역 */}
                <div className="mb-8">
                    <Link href="/">
                        <button className="group flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-primary/20 hover:border-primary/30 hover:text-white transition-all shadow-lg hover:shadow-primary/10">
                            <Home className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold tracking-tight">홈 화면으로 돌아가기</span>
                        </button>
                    </Link>
                </div>

                {/* 헤더 타이틀 */}
                <div className="text-center mb-16">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 uppercase tracking-widest"
                    >
                        <Grid3X3 className="w-3.5 h-3.5" />
                        FULL GALLERY
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4"
                    >
                        전체 시제품 <span className="text-teal-400">갤러리</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/60 text-lg max-w-2xl mx-auto"
                    >
                        100여 종에 달하는 고품질 출력 레퍼런스를 한눈에 확인하세요.
                    </motion.p>
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            type="button"
                            onClick={() => handleTagChange('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                galleryTag === 'all'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                        >
                            전체
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTagChange('photo-to-3d')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                galleryTag === 'photo-to-3d'
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                        >
                            사진(이미지)→3D Before/After
                        </button>
                    </div>
                </div>

                {/* 리스트 영역 */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-white/50">데이터를 불러오는 중입니다...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] border border-white/5 rounded-3xl max-w-3xl mx-auto">
                        <Box className="w-16 h-16 text-white/20 mb-4" />
                        <p className="text-white/50">등록된 갤러리 이미지가 없습니다.</p>
                    </div>
                ) : (
                    <div className="max-w-[1400px] mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                            {items.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <GalleryCard
                                        item={item}
                                        onClick={(clicked) => {
                                            openItem(clicked);
                                        }}
                                        className="group relative w-full cursor-pointer"
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* 페이지네이션 버튼 영역 */}
                        {totalPages > 1 && (
                            <div className="mt-16 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                
                                {renderPagination()}

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 상세 뷰 모달 */}
            <AnimatePresence>
                {selectedItem && (
                    <DetailViewModal 
                        key={`full-modal-${selectedItem.id}`}
                        item={selectedItem} 
                        onClose={closeItem}
                        onPrev={() => {
                            const idx = items.findIndex(i => i.id === selectedItem.id);
                            if (idx > 0) openItem(items[idx - 1]);
                        }}
                        onNext={() => {
                            const idx = items.findIndex(i => i.id === selectedItem.id);
                            if (idx >= 0 && idx < items.length - 1) openItem(items[idx + 1]);
                        }}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
