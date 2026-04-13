'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SHOWCASE_SLUGS, type ShowcaseSlug } from '@/lib/showcase';
import { Loader2, Trash2, Plus, ImageIcon, Video, Pencil } from 'lucide-react';

const SLUG_LABEL: Record<ShowcaseSlug, string> = {
    industrial: '산업용 부품',
    medical: '의료·덴탈',
    art: '아트·피규어',
    architecture: '건축·목업',
};

type CategoryRow = {
    slug: ShowcaseSlug;
    title: string;
    description: string;
    features: string[];
    card_image_key: string | null;
    cardImageUrl: string | null;
    fallbackImage: string;
};

type ExampleRow = {
    id: number;
    title: string;
    description: string;
    features: string[];
    sort_order: number;
    is_visible: boolean;
};

type MediaRow = {
    id: number;
    kind: string;
    url: string;
    sort_order: number;
};

export default function AdminShowcasePage() {
    const { token } = useAuthStore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [activeSlug, setActiveSlug] = useState<ShowcaseSlug>('industrial');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [featuresText, setFeaturesText] = useState('');
    const [savingMeta, setSavingMeta] = useState(false);
    const [uploadingCard, setUploadingCard] = useState(false);

    const [examples, setExamples] = useState<ExampleRow[]>([]);
    const [loadingEx, setLoadingEx] = useState(false);
    const [exampleDialog, setExampleDialog] = useState(false);
    const [editExample, setEditExample] = useState<ExampleRow | null>(null);
    const [exTitle, setExTitle] = useState('');
    const [exDesc, setExDesc] = useState('');
    const [exFeatures, setExFeatures] = useState('');
    const [exSort, setExSort] = useState(0);
    const [exVisible, setExVisible] = useState(true);
    const [savingEx, setSavingEx] = useState(false);

    const [mediaByExample, setMediaByExample] = useState<Record<number, MediaRow[]>>({});

    const authHeader = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
        [token]
    );

    const loadCategories = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/showcase', { headers: authHeader });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || '조회 실패');
            setCategories(j.data.categories);
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '쇼케이스 설정을 불러오지 못했습니다.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [token, authHeader, toast]);

    const loadExamples = useCallback(
        async (slug: ShowcaseSlug) => {
            if (!token) return;
            setLoadingEx(true);
            try {
                const res = await fetch(`/api/admin/showcase/category/${slug}/examples`, {
                    headers: authHeader,
                });
                const j = await res.json();
                if (!res.ok) throw new Error(j.error || '목록 실패');
                setExamples(j.data.items);
                setMediaByExample({});
            } catch (e) {
                toast({
                    title: '오류',
                    description: e instanceof Error ? e.message : '예시 목록 실패',
                    variant: 'destructive',
                });
            } finally {
                setLoadingEx(false);
            }
        },
        [token, authHeader, toast]
    );

    const loadMedia = async (exampleId: number) => {
        if (!token) return;
        try {
            const res = await fetch(`/api/admin/showcase/examples/${exampleId}/media`, {
                headers: authHeader,
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || '미디어 조회 실패');
            setMediaByExample((prev) => ({ ...prev, [exampleId]: j.data.items }));
        } catch {
            /* ignore */
        }
    };

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const activeCat = categories.find((c) => c.slug === activeSlug);

    useEffect(() => {
        if (!activeCat) return;
        setTitle(activeCat.title);
        setDescription(activeCat.description);
        setFeaturesText(activeCat.features.join('\n'));
    }, [activeCat]);

    useEffect(() => {
        loadExamples(activeSlug);
    }, [activeSlug, loadExamples]);

    const handleSaveMeta = async () => {
        setSavingMeta(true);
        try {
            const features = featuresText
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
            const res = await fetch(`/api/admin/showcase/category/${activeSlug}`, {
                method: 'PUT',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, features }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || '저장 실패');
            toast({ title: '저장됨', description: '카테고리 문구가 반영되었습니다.' });
            loadCategories();
        } catch (e) {
            toast({
                title: '저장 실패',
                description: e instanceof Error ? e.message : '',
                variant: 'destructive',
            });
        } finally {
            setSavingMeta(false);
        }
    };

    const handleCardImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploadingCard(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch(`/api/admin/showcase/category/${activeSlug}/card-image`, {
                method: 'POST',
                headers: authHeader,
                body: fd,
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || '업로드 실패');
            toast({ title: '이미지 반영', description: '카드/히어로 이미지가 업데이트되었습니다.' });
            loadCategories();
        } catch (err) {
            toast({
                title: '업로드 실패',
                description: err instanceof Error ? err.message : '',
                variant: 'destructive',
            });
        } finally {
            setUploadingCard(false);
        }
    };

    const clearCardImage = async () => {
        if (!confirm('카드 이미지를 제거하고 기본 이미지로 돌아갈까요?')) return;
        try {
            const res = await fetch(`/api/admin/showcase/category/${activeSlug}`, {
                method: 'PUT',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, features: featuresText.split('\n').map((s) => s.trim()).filter(Boolean), clearCardImage: true }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || '실패');
            toast({ title: '제거됨' });
            loadCategories();
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '',
                variant: 'destructive',
            });
        }
    };

    const openNewExample = () => {
        setEditExample(null);
        setExTitle('');
        setExDesc('');
        setExFeatures('');
        setExSort(examples.length);
        setExVisible(true);
        setExampleDialog(true);
    };

    const openEditExample = (ex: ExampleRow) => {
        setEditExample(ex);
        setExTitle(ex.title);
        setExDesc(ex.description);
        setExFeatures(ex.features.join('\n'));
        setExSort(ex.sort_order);
        setExVisible(ex.is_visible);
        setExampleDialog(true);
    };

    const saveExample = async () => {
        if (!exTitle.trim()) {
            toast({ title: '제목 필요', variant: 'destructive' });
            return;
        }
        setSavingEx(true);
        try {
            const features = exFeatures.split('\n').map((s) => s.trim()).filter(Boolean);
            if (editExample) {
                const res = await fetch(`/api/admin/showcase/examples/${editExample.id}`, {
                    method: 'PUT',
                    headers: { ...authHeader, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: exTitle.trim(),
                        description: exDesc,
                        features,
                        sort_order: exSort,
                        is_visible: exVisible,
                    }),
                });
                const j = await res.json();
                if (!res.ok) throw new Error(j.error || '수정 실패');
            } else {
                const res = await fetch(`/api/admin/showcase/category/${activeSlug}/examples`, {
                    method: 'POST',
                    headers: { ...authHeader, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: exTitle.trim(),
                        description: exDesc,
                        features,
                        sort_order: exSort,
                        is_visible: exVisible,
                    }),
                });
                const j = await res.json();
                if (!res.ok) throw new Error(j.error || '추가 실패');
            }
            toast({ title: '저장됨' });
            setExampleDialog(false);
            loadExamples(activeSlug);
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '',
                variant: 'destructive',
            });
        } finally {
            setSavingEx(false);
        }
    };

    const deleteExample = async (id: number) => {
        if (!confirm('이 제작 예시와 첨부 미디어를 모두 삭제할까요?')) return;
        try {
            const res = await fetch(`/api/admin/showcase/examples/${id}`, {
                method: 'DELETE',
                headers: authHeader,
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || '삭제 실패');
            toast({ title: '삭제됨' });
            loadExamples(activeSlug);
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '',
                variant: 'destructive',
            });
        }
    };

    const uploadExampleMedia = async (exampleId: number, kind: 'image' | 'video', file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('kind', kind);
        try {
            const res = await fetch(`/api/admin/showcase/examples/${exampleId}/media`, {
                method: 'POST',
                headers: authHeader,
                body: fd,
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || '업로드 실패');
            toast({ title: '미디어 추가됨' });
            loadMedia(exampleId);
        } catch (e) {
            toast({
                title: '업로드 실패',
                description: e instanceof Error ? e.message : '',
                variant: 'destructive',
            });
        }
    };

    const deleteMedia = async (mediaId: number, exampleId: number) => {
        if (!confirm('이 미디어를 삭제할까요?')) return;
        try {
            const res = await fetch(`/api/admin/showcase/example-media/${mediaId}`, {
                method: 'DELETE',
                headers: authHeader,
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || '삭제 실패');
            loadMedia(exampleId);
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '',
                variant: 'destructive',
            });
        }
    };

    if (loading && categories.length === 0) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">쇼케이스 관리</h1>
                <p className="text-white/50 text-sm mt-1">
                    /expert 페이지 4개 분야 카드·제작 예시 페이지용 이미지·영상입니다. (출력 갤러리와 별도)
                </p>
            </div>

            <Tabs value={activeSlug} onValueChange={(v) => setActiveSlug(v as ShowcaseSlug)}>
                <TabsList className="flex flex-wrap h-auto gap-1 bg-white/5 p-1">
                    {SHOWCASE_SLUGS.map((s) => (
                        <TabsTrigger
                            key={s}
                            value={s}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            {SLUG_LABEL[s]}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {SHOWCASE_SLUGS.map((slug) => (
                    <TabsContent key={slug} value={slug} className="mt-6 space-y-8">
                        <Card className="bg-white/[0.03] border-white/10">
                            <CardContent className="p-6 space-y-4">
                                <h2 className="text-lg font-bold text-white">카테고리 카드 / 상단 히어로</h2>
                                <div className="grid gap-2">
                                    <Label className="text-zinc-300">제목</Label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-zinc-300">설명</Label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-zinc-300">특징 (한 줄에 하나)</Label>
                                    <textarea
                                        value={featuresText}
                                        onChange={(e) => setFeaturesText(e.target.value)}
                                        rows={5}
                                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 font-mono"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={handleSaveMeta}
                                        disabled={savingMeta}
                                        className="bg-primary text-primary-foreground"
                                    >
                                        {savingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        문구 저장
                                    </Button>
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            onChange={handleCardImage}
                                            disabled={uploadingCard}
                                        />
                                        <span className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-white/20 text-sm font-medium text-white hover:bg-white/10">
                                            {uploadingCard ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4" />
                                            )}
                                            카드 이미지 업로드
                                        </span>
                                    </label>
                                    {activeCat?.cardImageUrl && (
                                        <Button variant="outline" className="border-white/20 text-zinc-200" type="button" onClick={clearCardImage}>
                                            카드 이미지 제거
                                        </Button>
                                    )}
                                </div>
                                {activeCat?.cardImageUrl && (
                                    <div className="rounded-xl border border-white/10 overflow-hidden max-w-xs">
                                        <img src={activeCat.cardImageUrl} alt="" className="w-full h-40 object-cover" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-white/[0.03] border-white/10">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center flex-wrap gap-3">
                                    <h2 className="text-lg font-bold text-white">제작 예시</h2>
                                    <Button onClick={openNewExample} className="gap-2 bg-primary text-primary-foreground">
                                        <Plus className="w-4 h-4" /> 예시 추가
                                    </Button>
                                </div>
                                {loadingEx ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                ) : examples.length === 0 ? (
                                    <p className="text-white/40 text-sm">등록된 예시가 없습니다.</p>
                                ) : (
                                    <ul className="space-y-6">
                                        {examples.map((ex) => (
                                            <li
                                                key={ex.id}
                                                className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3"
                                            >
                                                <div className="flex justify-between gap-2 flex-wrap">
                                                    <div>
                                                        <div className="font-bold text-white">{ex.title}</div>
                                                        {!ex.is_visible && (
                                                            <span className="text-xs text-amber-400">비공개</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-white/70"
                                                            onClick={() => openEditExample(ex)}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive"
                                                            onClick={() => deleteExample(ex.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <label className="cursor-pointer text-xs">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const f = e.target.files?.[0];
                                                                e.target.value = '';
                                                                if (f) uploadExampleMedia(ex.id, 'image', f);
                                                            }}
                                                        />
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/15">
                                                            <ImageIcon className="w-3 h-3" /> 이미지
                                                        </span>
                                                    </label>
                                                    <label className="cursor-pointer text-xs">
                                                        <input
                                                            type="file"
                                                            accept="video/mp4,video/webm,video/quicktime"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const f = e.target.files?.[0];
                                                                e.target.value = '';
                                                                if (f) uploadExampleMedia(ex.id, 'video', f);
                                                            }}
                                                        />
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/15">
                                                            <Video className="w-3 h-3" /> 영상
                                                        </span>
                                                    </label>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs border-white/20"
                                                        type="button"
                                                        onClick={() => loadMedia(ex.id)}
                                                    >
                                                        미디어 새로고침
                                                    </Button>
                                                </div>
                                                {mediaByExample[ex.id] && mediaByExample[ex.id].length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {mediaByExample[ex.id].map((m) => (
                                                            <div key={m.id} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                                                                {m.kind === 'video' ? (
                                                                    <video src={m.url} className="w-full h-full object-cover" muted />
                                                                ) : (
                                                                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs"
                                                                    onClick={() => deleteMedia(m.id, ex.id)}
                                                                >
                                                                    삭제
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            <Dialog open={exampleDialog} onOpenChange={setExampleDialog}>
                <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editExample ? '예시 수정' : '예시 추가'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid gap-2">
                            <Label className="text-zinc-300">제목</Label>
                            <Input
                                value={exTitle}
                                onChange={(e) => setExTitle(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-zinc-300">설명</Label>
                            <textarea
                                value={exDesc}
                                onChange={(e) => setExDesc(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-zinc-300">특징 (줄바꿈)</Label>
                            <textarea
                                value={exFeatures}
                                onChange={(e) => setExFeatures(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label className="text-zinc-300">정렬 순서</Label>
                                <Input
                                    type="number"
                                    value={exSort}
                                    onChange={(e) => setExSort(parseInt(e.target.value, 10) || 0)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div className="flex items-end pb-2 gap-2">
                                <input
                                    type="checkbox"
                                    id="vis"
                                    checked={exVisible}
                                    onChange={(e) => setExVisible(e.target.checked)}
                                    className="rounded border-white/20"
                                />
                                <Label htmlFor="vis" className="text-zinc-300 cursor-pointer">
                                    공개
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/20" onClick={() => setExampleDialog(false)}>
                            취소
                        </Button>
                        <Button className="bg-primary text-primary-foreground" onClick={saveExample} disabled={savingEx}>
                            {savingEx ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            저장
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
