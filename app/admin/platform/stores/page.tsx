'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Store as StoreIcon, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StoreManagementPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stores, setStores] = useState<any[]>([]);

    // 모달 상태
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', slug: '', owner_email: '' });
    const [creating, setCreating] = useState(false);

    const fetchStores = async () => {
        try {
            const res = await fetch('/api/admin/platform/stores');
            const json = await res.json();
            if (json.success) {
                setStores(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const handleCreate = async () => {
        if (!formData.name || !formData.slug) {
            toast({ title: '이름과 슬러그(ID)는 필수입니다.', variant: 'destructive' });
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/admin/platform/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const json = await res.json();

            if (json.success) {
                toast({ title: '스토어 생성 완료', description: `${formData.name} 스토어가 생성되었습니다.` });
                setOpen(false);
                setFormData({ name: '', slug: '', owner_email: '' });
                fetchStores();
            } else {
                toast({ title: '생성 실패', description: json.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: '오류 발생', variant: 'destructive' });
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <StoreIcon className="w-6 h-6 text-yellow-500" />
                        플랫폼 스토어 관리
                    </h1>
                    <p className="text-white/50 text-sm mt-1">입점 업체를 생성하고 관리합니다. (Super Admin Only)</p>
                </div>
                <Button onClick={() => setOpen(true)} className="bg-yellow-500 text-black hover:bg-yellow-400">
                    <Plus className="w-4 h-4 mr-2" /> 스토어 추가
                </Button>
            </div>

            <Card className="bg-[#0c0c0c] border-white/10">
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="text-white/40 bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="p-4 font-normal">ID</th>
                                <th className="p-4 font-normal">스토어명</th>
                                <th className="p-4 font-normal">슬러그 (URL)</th>
                                <th className="p-4 font-normal">소유자 ID</th>
                                <th className="p-4 font-normal">플랜</th>
                                <th className="p-4 font-normal">생성일</th>
                                <th className="p-4 font-normal text-right">링크</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                            {stores.map((store) => (
                                <tr key={store.id} className="hover:bg-white/[0.02]">
                                    <td className="p-4 text-white/30">#{store.id}</td>
                                    <td className="p-4 font-bold text-white">{store.name}</td>
                                    <td className="p-4 font-mono text-yellow-500">{store.slug}</td>
                                    <td className="p-4">{store.owner_id ? `User #${store.owner_id}` : '-'}</td>
                                    <td className="p-4 uppercase text-xs font-bold text-white/50">{store.plan}</td>
                                    <td className="p-4 text-white/30 text-xs">{new Date(store.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <Button
                                            variant="ghost" size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => window.open(`/store/${store.slug}`, '_blank')}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {stores.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-white/30">등록된 스토어가 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* 생성 모달 */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>새 스토어 생성</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>스토어 이름</Label>
                            <Input
                                placeholder="예: 삼성전자 시제품실"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>슬러그 (고유 ID)</Label>
                            <Input
                                placeholder="영문 소문자 (예: samsung)"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                className="bg-black/20 border-white/10"
                            />
                            <p className="text-xs text-white/30">주소로 사용됩니다: {formData.slug}.wow3d.com</p>
                        </div>
                        <div className="space-y-2">
                            <Label>소유자 이메일 (이미 가입된 계정)</Label>
                            <Input
                                placeholder="user@example.com"
                                value={formData.owner_email}
                                onChange={e => setFormData({ ...formData, owner_email: e.target.value })}
                                className="bg-black/20 border-white/10"
                            />
                            <p className="text-xs text-yellow-500/70">주의: 해당 사용자는 이 스토어의 관리자로 변경됩니다.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}>취소</Button>
                        <Button onClick={handleCreate} disabled={creating} className="bg-yellow-500 text-black hover:bg-yellow-400">
                            {creating ? <Loader2 className="animate-spin w-4 h-4" /> : '생성하기'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
