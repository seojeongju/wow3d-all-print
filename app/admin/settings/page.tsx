'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Material, PrintSetting } from '@/lib/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [settings, setSettings] = useState<PrintSetting[]>([]);

    // New Material Form State
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
        name: '', type: 'FDM', pricePerGram: 0, density: 1.24, colors: ['#FFFFFF']
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [matRes, setRes] = await Promise.all([
                fetch('/api/admin/materials'),
                fetch('/api/admin/settings')
            ]);

            const matData = await matRes.json();
            const setData = await setRes.json();

            if (matData.success) {
                const mappedMaterials = matData.data.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    type: m.type,
                    pricePerGram: m.price_per_gram,
                    density: m.density,
                    colors: JSON.parse(m.colors || '[]'),
                    isActive: m.is_active
                }));
                setMaterials(mappedMaterials);
            }

            if (setData.success) {
                setSettings(setData.data);
            }
        } catch (error) {
            toast({ title: "데이터 로딩 실패", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMaterial = async (id: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/admin/materials?id=${id}`, { method: 'DELETE' });
            setMaterials(materials.filter(m => m.id !== id));
            toast({ title: "자재 삭제 완료" });
        } catch (error) {
            toast({ title: "삭제 실패", variant: "destructive" });
        }
    };

    const handleAddMaterial = async () => {
        try {
            const res = await fetch('/api/admin/materials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMaterial)
            });
            if (res.ok) {
                setIsAddingMaterial(false);
                fetchData(); // Reload
                toast({ title: "자재 추가 완료" });
                setNewMaterial({ name: '', type: 'FDM', pricePerGram: 0, density: 1.24, colors: ['#FFFFFF'] });
            } else {
                throw new Error();
            }
        } catch (e) {
            toast({ title: "추가 실패", variant: "destructive" });
        }
    };

    const handleSaveSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) toast({ title: "설정 저장 완료" });
            else throw new Error();
        } catch (e) {
            toast({ title: "저장 실패", variant: "destructive" });
        }
    };

    const handleSettingChange = (key: string, value: string) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">설정 및 자재 관리</h1>
                <p className="text-white/50 text-sm mt-1">견적 계산에 사용되는 기본 값과 자재 정보를 관리합니다.</p>
            </div>

            <Tabs defaultValue="materials" className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="materials" className="data-[state=active]:bg-primary data-[state=active]:text-white">자재</TabsTrigger>
                    <TabsTrigger value="pricing" className="data-[state=active]:bg-primary data-[state=active]:text-white">가격 정책</TabsTrigger>
                </TabsList>

                <TabsContent value="materials" className="space-y-4">
                    <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>자재 목록</CardTitle>
                                <CardDescription>
                                    견적 산출에 사용되는 3D 프린팅 자재 리스트
                                </CardDescription>
                            </div>
                            <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="w-4 h-4 mr-2" /> 자재 추가</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>새 자재 추가</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">이름</Label>
                                            <Input className="col-span-3" value={newMaterial.name} onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })} placeholder="예: PLA Plus" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">타입</Label>
                                            <Select value={newMaterial.type} onValueChange={v => setNewMaterial({ ...newMaterial, type: v })}>
                                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="FDM">FDM</SelectItem>
                                                    <SelectItem value="SLA">SLA</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">g당 가격</Label>
                                            <Input type="number" className="col-span-3" value={newMaterial.pricePerGram} onChange={e => setNewMaterial({ ...newMaterial, pricePerGram: parseFloat(e.target.value) })} />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">밀도</Label>
                                            <Input type="number" className="col-span-3" value={newMaterial.density} onChange={e => setNewMaterial({ ...newMaterial, density: parseFloat(e.target.value) })} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddMaterial}>추가하기</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-white/10 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="p-4 font-medium text-white/70">이름</th>
                                            <th className="p-4 font-medium text-white/70">타입</th>
                                            <th className="p-4 font-medium text-white/70">g당 가격(원)</th>
                                            <th className="p-4 font-medium text-white/70">밀도(g/cm³)</th>
                                            <th className="p-4 font-medium text-right text-white/70">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materials.map((m) => (
                                            <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                <td className="p-4 font-medium text-white">{m.name}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${m.type === 'FDM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {m.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-white/90">{m.pricePerGram}원</td>
                                                <td className="p-4 text-white/90">{m.density}</td>
                                                <td className="p-4 text-right">
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteMaterial(m.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                    <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">기본 가격 정책</CardTitle>
                            <CardDescription className="text-white/50">
                                장비 운용 비용 및 최소 주문 금액 등을 설정합니다. (변경 시 즉시 반영)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {settings.map((s) => (
                                <div key={s.key} className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 py-3 border-b border-white/5 last:border-0">
                                    <div className="font-medium text-sm text-white/90">
                                        {s.description || s.key}
                                        <div className="text-xs text-white/40">{s.key}</div>
                                    </div>
                                    <Input type="number" value={s.value} onChange={(e) => handleSettingChange(s.key, e.target.value)} className="bg-white/5 border-white/10 text-white" />
                                </div>
                            ))}
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90"><Save className="w-4 h-4 mr-2" /> 변경사항 저장</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
