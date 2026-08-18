'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Image as ImageIcon, Loader2, Trash2, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

type GalleryItem = {
    id: number;
    title: string;
    description: string;
    image_url: string;
    source_image_url?: string | null;
    material: string;
    print_method: string;
    tags: string;
    is_visible: number;
    sort_order: number;
    created_at: string;
};

function resolveAdminImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return `/api/gallery/image/${url.replace(/^gallery\//, '')}`;
}

export default function AdminGalleryPage() {
    const { toast } = useToast();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 필터 State
    const [search, setSearch] = useState('');
    const [filterMethod, setFilterMethod] = useState('all');
    const [filterMaterial, setFilterMaterial] = useState('all');

    // 모달 State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Add / Edit Form 
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sourceFileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
    const [clearSourceImage, setClearSourceImage] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        material: '',
        print_method: '',
        tags: '',
        image: null as File | null,
        source_image: null as File | null,
    });

    const fetchGallery = async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: p.toString(),
                limit: '50',
                search: search,
                print_method: filterMethod === 'all' ? '' : filterMethod,
                material: filterMaterial === 'all' ? '' : filterMaterial
            });

            const res = await fetch(`/api/admin/gallery?${params.toString()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.success) {
                setItems(data.data.items || []);
                setTotalPages(data.data.pagination?.totalPages || 1);
            } else {
                toast({ title: '데이터 로드 실패', description: data.error || '목록을 가져오지 못했습니다.', variant: 'destructive' });
            }
        } catch (e) {
            console.error('Failed to fetch gallery', e);
            toast({ title: '오류 발생', description: '서버와 통신 중 문제가 발생했습니다.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // 검색어 디바운스 처리
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGallery(1);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filterMethod, filterMaterial]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, image: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const openAddModal = () => {
        setEditId(null);
        setFormData({ title: '', description: '', material: '', print_method: '', tags: '', image: null, source_image: null });
        setPreviewUrl(null);
        setSourcePreviewUrl(null);
        setClearSourceImage(false);
        setIsAddOpen(true);
    };

    const openEditModal = (item: GalleryItem) => {
        setEditId(item.id);

        // Tags array to comma string
        let tagsStr = '';
        try {
            const arr = JSON.parse(item.tags || '[]');
            tagsStr = arr.join(', ');
        } catch {
            tagsStr = item.tags || '';
        }

        setFormData({
            title: item.title || '',
            description: item.description || '',
            material: item.material || '',
            print_method: item.print_method || '',
            tags: tagsStr,
            image: null,
            source_image: null,
        });
        setPreviewUrl(resolveAdminImageUrl(item.image_url));
        setSourcePreviewUrl(resolveAdminImageUrl(item.source_image_url));
        setClearSourceImage(false);
        setIsAddOpen(true);
    };

    const handleSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, source_image: file }));
            setSourcePreviewUrl(URL.createObjectURL(file));
            setClearSourceImage(false);
        }
    };

    const handleAddOrEditSubmit = async () => {
        if (!formData.title) {
            toast({ title: '제목은 필수 항목입니다', variant: 'destructive' });
            return;
        }

        if (!editId && !formData.image) {
            toast({ title: '업로드할 이미지를 선택해주세요', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            const data = new FormData();
            if (formData.title) data.append('title', formData.title);
            if (formData.description) data.append('description', formData.description);
            if (formData.material) data.append('material', formData.material);
            if (formData.print_method) data.append('print_method', formData.print_method);

            // # 붙은 태그들을 JSON 배열로 변환해서 저장
            const tagsArray = formData.tags
                .split(',')
                .map(t => t.trim().replace(/^#/, ''))
                .filter(Boolean);
            data.append('tags', JSON.stringify(tagsArray));

            if (formData.image) {
                data.append('image', formData.image);
            }
            if (formData.source_image) {
                data.append('source_image', formData.source_image);
            }
            if (editId && clearSourceImage) {
                data.append('clear_source_image', '1');
            }

            const url = editId ? `/api/gallery/${editId}` : '/api/gallery';
            const method = editId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: data
            });

            const json = await res.json();
            if (json.success) {
                toast({ title: `갤러리 정보가 ${editId ? '수정' : '추가'}되었습니다.` });
                setIsAddOpen(false);
                fetchGallery(page);
            } else {
                toast({ title: json.error || '저장 실패', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: '오류가 발생했습니다.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleVisibility = async (id: number, current: number) => {
        try {
            const newVal = current === 1 ? 0 : 1;
            const res = await fetch(`/api/gallery/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ is_visible: newVal })
            });
            if (res.ok) {
                setItems(items.map(it => it.id === id ? { ...it, is_visible: newVal } : it));
            }
        } catch (e) {
            toast({ title: '상태 변경 실패', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('정말로 이 출력물을 갤러리에서 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/gallery/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                toast({ title: '삭제 성공' });
                setItems(items.filter(it => it.id !== id));
            } else {
                toast({ title: '삭제 실패', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: '오류가 발생했습니다.', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">출력 갤러리 관리</h1>
                    <p className="text-white/50 text-sm mt-1">메인 페이지 갤러리 섹션에 표시될 출력물을 관리합니다.</p>
                </div>
                <Button onClick={openAddModal} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4" /> 갤러리 업로드
                </Button>
            </div>

            {/* 필터 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="col-span-1 md:col-span-2">
                    <Input 
                        placeholder="제목 또는 설명 검색..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-black/20 border-white/10 text-white"
                    />
                </div>
                <div>
                    <select 
                        value={filterMethod} 
                        onChange={(e) => setFilterMethod(e.target.value)}
                        className="w-full h-10 px-3 rounded-md bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="all">모든 출력 방식</option>
                        <option value="FDM">FDM</option>
                        <option value="SLA">SLA</option>
                        <option value="DLP">DLP</option>
                    </select>
                </div>
                <div>
                    <select 
                        value={filterMaterial} 
                        onChange={(e) => setFilterMaterial(e.target.value)}
                        className="w-full h-10 px-3 rounded-md bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="all">모든 소재</option>
                        <option value="PLA">PLA</option>
                        <option value="ABS">ABS</option>
                        <option value="PETG">PETG</option>
                        <option value="TPU">TPU (유연성)</option>
                        <option value="Nylon">Nylon</option>
                        <option value="Resin">Resin (일반)</option>
                        <option value="Tough Resin">Tough Resin</option>
                        <option value="Clear Resin">Clear Resin</option>
                    </select>
                </div>
            </div>

            <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-12 text-center text-white/40">등록된 갤러리 이미지가 없습니다.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="p-4 font-medium text-white/70 w-28">이미지</th>
                                        <th className="p-4 font-medium text-white/70">제목</th>
                                        <th className="p-4 font-medium text-white/70">소재 / 방식</th>
                                        <th className="p-4 font-medium text-white/70">태그</th>
                                        <th className="p-4 font-medium text-white/70 w-24 text-center">노출 여부</th>
                                        <th className="p-4 font-medium text-white/70 w-32 text-right">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="p-3">
                                                <div className="flex gap-1.5">
                                                    {item.source_image_url && (
                                                        <div className="w-14 h-14 rounded-lg bg-black/40 overflow-hidden border border-indigo-400/30 flex items-center justify-center shrink-0" title="원본 사진(이미지)">
                                                            <img
                                                                src={resolveAdminImageUrl(item.source_image_url) || ''}
                                                                alt="원본"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="w-14 h-14 rounded-lg bg-black/40 overflow-hidden border border-white/10 flex items-center justify-center shrink-0">
                                                        {item.image_url ? (
                                                            <img
                                                                src={resolveAdminImageUrl(item.image_url) || ''}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <ImageIcon className="w-6 h-6 text-white/20" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-white">{item.title}</div>
                                                <div className="text-xs text-white/40 truncate max-w-[200px] mt-1">{item.description}</div>
                                            </td>
                                            <td className="p-4 text-white/70 space-y-1">
                                                {item.material && <Badge variant="outline" className="border-white/10 bg-white/5 mr-1 text-[10px]">{item.material}</Badge>}
                                                {item.print_method && <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px]">{item.print_method}</Badge>}
                                            </td>
                                            <td className="p-4 text-white/50 text-xs">
                                                {(() => {
                                                    try {
                                                        const tags = JSON.parse(item.tags || '[]');
                                                        return tags.map((t: string) => `#${t}`).join(' ');
                                                    } catch { return item.tags; }
                                                })()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => toggleVisibility(item.id, item.is_visible)}
                                                    className={`transition-colors p-1.5 rounded-full ${item.is_visible ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-white/30 hover:bg-white/10'}`}
                                                    title="클릭하여 토글"
                                                >
                                                    {item.is_visible ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 mr-1" onClick={() => openEditModal(item)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-red-500/10" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-2">
                    <button
                        onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchGallery(p); }}
                        disabled={page <= 1}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                    >
                        ← 이전
                    </button>

                    {(() => {
                        const maxShow = 7;
                        let start = Math.max(1, page - Math.floor(maxShow / 2));
                        let end = Math.min(totalPages, start + maxShow - 1);
                        if (end - start + 1 < maxShow) start = Math.max(1, end - maxShow + 1);
                        return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                            <button
                                key={p}
                                onClick={() => { setPage(p); fetchGallery(p); }}
                                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                                    page === p
                                        ? 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {p}
                            </button>
                        ));
                    })()}

                    <button
                        onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchGallery(p); }}
                        disabled={page >= totalPages}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                    >
                        다음 →
                    </button>

                    <span className="ml-2 text-xs text-white/40">
                        {page} / {totalPages} 페이지
                    </span>
                </div>
            )}

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white">출력물 갤러리 {editId ? '정보 수정' : '업로드'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">출력물 · AI 3D 결과 (필수)</Label>
                                <div
                                    className="w-full h-40 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} alt="출력물 미리보기" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="text-white text-sm font-medium">출력물 변경</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-white/40 mb-2" />
                                            <span className="text-sm text-white/50 text-center px-2">출력물·3D 결과 이미지</span>
                                        </>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">원본 사진(이미지) Before (선택)</Label>
                                <div
                                    className="w-full h-40 rounded-xl border-2 border-dashed border-indigo-400/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
                                    onClick={() => sourceFileInputRef.current?.click()}
                                >
                                    {sourcePreviewUrl ? (
                                        <>
                                            <img src={sourcePreviewUrl} alt="원본 사진(이미지) 미리보기" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                                <span className="text-white text-sm font-medium">원본 변경</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-indigo-300/50 mb-2" />
                                            <span className="text-sm text-white/50 text-center px-2">사진(이미지)→3D Before 이미지</span>
                                        </>
                                    )}
                                </div>
                                <input type="file" ref={sourceFileInputRef} className="hidden" accept="image/*" onChange={handleSourceFileChange} />
                                {editId && sourcePreviewUrl && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-red-400/30 text-red-300 hover:bg-red-500/10"
                                        onClick={() => {
                                            setClearSourceImage(true);
                                            setSourcePreviewUrl(null);
                                            setFormData(prev => ({ ...prev, source_image: null }));
                                        }}
                                    >
                                        원본 사진(이미지) 제거
                                    </Button>
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-white/40 break-keep">
                            사진(이미지)→3D 쇼케이스에 노출하려면 태그에 <code className="text-indigo-300">photo-to-3d</code>를 포함하고 원본 사진(이미지)을 함께 업로드하세요.
                        </p>

                        <div className="grid gap-2">
                            <Label className="text-zinc-300">제목 (필수)</Label>
                            <Input placeholder="예: 정밀 기어 부품" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-zinc-400" />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-zinc-300">간단한 설명 (선택)</Label>
                            <Input placeholder="산업용 기어 파츠 시제품입니다." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-zinc-400" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-zinc-300">출력 방식 (선택)</Label>
                                <Input placeholder="예: SLA, FDM" value={formData.print_method} onChange={e => setFormData({ ...formData, print_method: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-zinc-400" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-zinc-300">사용 소재 (선택)</Label>
                                <Input placeholder="예: Tough ABS, PLA" value={formData.material} onChange={e => setFormData({ ...formData, material: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-zinc-400" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-zinc-300">태그 (선택)</Label>
                            <div className="flex gap-2">
                                <Input placeholder="쉼표(,)로 구분 (예: photo-to-3d, 시제품, 피규어)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-zinc-400 flex-1" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="shrink-0 border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/10 text-xs whitespace-nowrap"
                                    onClick={() => {
                                        const hasTag = formData.tags.toLowerCase().includes('photo-to-3d');
                                        if (hasTag) return;
                                        setFormData({
                                            ...formData,
                                            tags: formData.tags.trim()
                                                ? `${formData.tags.trim()}, photo-to-3d`
                                                : 'photo-to-3d',
                                        });
                                    }}
                                >
                                    + photo-to-3d
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/20 text-zinc-200 bg-transparent hover:bg-white/10" onClick={() => setIsAddOpen(false)}>취소</Button>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAddOrEditSubmit} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} 업로드 및 저장
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
