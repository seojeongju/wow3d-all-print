'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    material: string;
    print_method: string;
    tags: string;
    is_visible: number;
    sort_order: number;
    created_at: string;
};

export default function AdminGalleryPage() {
    const { toast } = useToast();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<GalleryItem[]>([]);

    // 모달 State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Add Form 
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        material: '',
        print_method: '',
        tags: '',
        image: null as File | null
    });

    const fetchGallery = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/gallery?limit=50', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.success) {
                setItems(data.data.items || []);
            }
        } catch (e) {
            console.error('Failed to fetch gallery', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, image: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAddSubmit = async () => {
        if (!formData.title || !formData.image) {
            toast({ title: '제목과 이미지는 필수 항목입니다', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('material', formData.material);
            data.append('print_method', formData.print_method);

            // # 붙은 태그들을 JSON 배열로 변환해서 저장
            const tagsArray = formData.tags
                .split(',')
                .map(t => t.trim().replace(/^#/, ''))
                .filter(Boolean);
            data.append('tags', JSON.stringify(tagsArray));
            data.append('image', formData.image);

            const res = await fetch('/api/gallery', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: data
            });

            const json = await res.json();
            if (json.success) {
                toast({ title: '갤러리에 이미지가 추가되었습니다.' });
                setIsAddOpen(false);
                setFormData({ title: '', description: '', material: '', print_method: '', tags: '', image: null });
                setPreviewUrl(null);
                fetchGallery();
            } else {
                toast({ title: json.error || '등록 실패', variant: 'destructive' });
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
                <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-primary text-white hover:bg-primary/90">
                    <Plus className="w-4 h-4" /> 갤러리 업로드
                </Button>
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
                                        <th className="p-4 font-medium text-white/70 w-24">이미지</th>
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
                                                <div className="w-16 h-16 rounded-lg bg-black/40 overflow-hidden border border-white/10 flex items-center justify-center">
                                                    {item.image_url ? (
                                                        <img src={`/api/gallery/image/${item.image_url.replace('gallery/', '')}`} alt={item.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-white/20" />
                                                    )}
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
                                            <td className="p-4 text-right">
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

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white">출력물 갤러리 업로드</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div
                                className="w-full h-48 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <>
                                        <ImageIcon className="w-8 h-8 text-white/40 mb-2" />
                                        <span className="text-sm text-white/50">클릭하여 이미지 업로드 (JPG, PNG)</span>
                                    </>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-white/70">제목 (필수)</Label>
                            <Input placeholder="예: 정밀 기어 부품" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-white/5 border-white/10 text-white" />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-white/70">간단한 설명 (선택)</Label>
                            <Input placeholder="산업용 기어 파츠 시제품입니다." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-white/5 border-white/10 text-white" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-white/70">출력 방식 (선택)</Label>
                                <Input placeholder="예: SLA, FDM" value={formData.print_method} onChange={e => setFormData({ ...formData, print_method: e.target.value })} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-white/70">사용 소재 (선택)</Label>
                                <Input placeholder="예: Tough ABS, PLA" value={formData.material} onChange={e => setFormData({ ...formData, material: e.target.value })} className="bg-white/5 border-white/10 text-white" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-white/70">태그 (선택)</Label>
                            <Input placeholder="쉼표(,)로 구분 (예: 시제품,산업용,부품)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="bg-white/5 border-white/10 text-white" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/10 text-white bg-transparent hover:bg-white/10" onClick={() => setIsAddOpen(false)}>취소</Button>
                        <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleAddSubmit} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} 업로드 및 저장
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
