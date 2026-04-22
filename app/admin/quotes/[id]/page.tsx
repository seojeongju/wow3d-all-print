'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/** DB/API 금액 단위 → 원화 표시 (다른 페이지와 동일) */
// 금액은 원화(KRW)로 저장·표시
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Save, Plus, Trash2, ArrowLeft, RotateCcw, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';

export default function QuoteEditPage() {
    const { toast } = useToast();
    const { token } = useAuthStore();
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [loading, setLoading] = useState(true);
    const [orderInfo, setOrderInfo] = useState<any>(null);

    const [recipient, setRecipient] = useState({ name: '', phone: '', email: '', address: '' });
    const [items, setItems] = useState<any[]>([]);
    const [autoItems, setAutoItems] = useState<any[]>([]);
    const [autoRecipient, setAutoRecipient] = useState({ name: '', phone: '', email: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [hasExpertQuote, setHasExpertQuote] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/admin/orders/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    const { order, items } = json.data;
                    setOrderInfo(order);

                    const baseRecipient = {
                        name: order.recipient_name || '',
                        phone: order.recipient_phone || '',
                        email: order.user_email || order.guest_email || '',
                        address: order.shipping_address || ''
                    };
                    setAutoRecipient(baseRecipient);

                    const autoItemsMapped = items.map((it: any) => {
                        const unitPriceBase = Number(it.unit_price) || 0;
                        const unitPriceKr = Math.round(unitPriceBase);
                        return {
                            id: it.id || Math.random(),
                            name: it.file_name,
                            spec: `${it.print_method || ''} ${it.material_name ? '/ ' + it.material_name : ''}`.trim(),
                            quantity: Number(it.quantity) || 1,
                            unit_price: unitPriceKr,
                        };
                    });
                    setAutoItems(autoItemsMapped);

                    if (order.has_expert_quote && order.expert_quote_data) {
                        try {
                            const expertData = JSON.parse(order.expert_quote_data);
                            setItems(expertData.items?.map((it: any) => ({
                                ...it,
                                unit_price: Math.round(Number(it.unit_price) || 0),
                                quantity: Number(it.quantity) || 1,
                            })) || []);
                            setRecipient(expertData.recipient || baseRecipient);
                            setHasExpertQuote(true);
                        } catch (e) {
                            setItems(autoItemsMapped);
                            setRecipient(baseRecipient);
                        }
                    } else {
                        setItems(autoItemsMapped);
                        setRecipient(baseRecipient);
                    }
                } else {
                    toast({ title: '데이터 로드 실패', variant: 'destructive' });
                }
            })
            .catch(() => toast({ title: '오류 발생', variant: 'destructive' }))
            .finally(() => setLoading(false));
    }, [id, toast, token]);

    const handleItemChange = (idx: number, field: string, value: string) => {
        const newItems = [...items];
        if (field === 'unit_price' || field === 'quantity') {
            const cleaned = value.replace(/,/g, '').replace(/[^0-9]/g, '');
            newItems[idx] = { ...newItems[idx], [field]: cleaned === '' ? 0 : Number(cleaned) };
        } else {
            newItems[idx] = { ...newItems[idx], [field]: value };
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), name: '', spec: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    // 금액 계산 (이미 부가세가 포함된 단가 기준)
    const totalAmount = items.reduce((acc, it) => {
        return acc + (Math.round(Number(it.unit_price) || 0) * Math.round(Number(it.quantity) || 0));
    }, 0);
    // 합계금액에서 부가세를 역산 (합계 = 공급가 * 1.1)
    const totalSupply = Math.round(totalAmount / 1.1);
    const totalVat = totalAmount - totalSupply;

    const handleSaveExpertQuote = async () => {
        if (!id || saving) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    expert_quote_data: {
                        items,
                        recipient,
                        total_amount: totalAmount,
                        updated_at: new Date().toISOString()
                    }
                })
            });
            const json = await res.json();
            if (json.success) {
                setHasExpertQuote(true);
                toast({ title: '전문가 견적이 저장되었습니다.' });
            } else {
                toast({
                    title: '저장 실패',
                    description: json?.error || '다시 시도해 주세요.',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({ title: '오류 발생', description: '네트워크 또는 서버 오류일 수 있습니다.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const resetToAutoQuote = () => {
        if (confirm('자동견적 원본 데이터로 초기화하시겠습니까?')) {
            setItems(autoItems.map(it => ({ ...it })));
            setRecipient({ ...autoRecipient });
        }
    };

    const handlePrint = () => {
        const printData = {
            order: {
                ...orderInfo,
                recipient_name: recipient.name,
                recipient_phone: recipient.phone,
                user_email: recipient.email,
                guest_email: recipient.email,
                shipping_address: recipient.address,
                total_amount: totalAmount,
            },
            items: items.map(it => ({
                id: it.id,
                file_name: it.name,
                print_method: it.spec,
                material_name: '',
                quantity: it.quantity,
                unit_price: Math.round(Number(it.unit_price) || 0),
                subtotal: Math.round(Number(it.unit_price) || 0) * Number(it.quantity),
            }))
        };
        localStorage.setItem(`quote_temp_${id}`, JSON.stringify(printData));
        if (token) localStorage.setItem('admin_print_token', token);
        window.open(`/print/estimate/${id}?temp=true`, '_blank', 'width=900,height=1000');
    };

    if (loading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    if (!orderInfo) return <div className="p-8 text-white">데이터를 찾을 수 없습니다.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white/50 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        견적서 수정 및 발행
                        {hasExpertQuote && (
                            <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">전문가 견적 저장됨</Badge>
                        )}
                    </h1>
                    <p className="text-white/40 text-sm ml-10">아래 단가 및 품목을 직접 수정하고 저장하세요.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={resetToAutoQuote} className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white text-sm">
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        자동견적으로 초기화
                    </Button>
                    <Button onClick={handleSaveExpertQuote} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm">
                        {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                        수정견적 저장
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm">
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        견적서 인쇄
                    </Button>
                </div>
            </div>

            {/* ─── 자동견적 vs 수정견적 비교 ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 자동견적 원본 */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">자동견적 원본</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                        <Button
                            variant="ghost" size="sm"
                            className="text-white/30 hover:text-white text-xs h-6 px-2"
                            onClick={() => {
                                const autoTotal = autoItems.reduce((acc, it) => acc + Math.round(Number(it.unit_price) || 0) * Number(it.quantity), 0);
                                const printData = {
                                    order: { ...orderInfo, total_amount: autoTotal },
                                    items: autoItems.map(it => ({
                                        file_name: it.name, print_method: it.spec, material_name: '',
                                        quantity: it.quantity,
                                        unit_price: Math.round(Number(it.unit_price) || 0),
                                        subtotal: Math.round(Number(it.unit_price) || 0) * Number(it.quantity),
                                    }))
                                };
                                localStorage.setItem(`quote_temp_${id}`, JSON.stringify(printData));
                                if (token) localStorage.setItem('admin_print_token', token);
                                window.open(`/print/estimate/${id}?temp=true`, '_blank', 'width=900,height=1000');
                            }}
                        >
                            <Printer className="w-3 h-3 mr-1" /> 출력
                        </Button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                        {autoItems.map((it, i) => {
                            const supply = Math.round(Number(it.unit_price) || 0) * Number(it.quantity);
                            return (
                                <div key={i} className="flex justify-between text-white/60">
                                    <span className="truncate max-w-[180px]">{it.name || `품목 ${i + 1}`}</span>
                                    <span className={hasExpertQuote ? 'line-through text-white/25' : ''}>{supply.toLocaleString()}원</span>
                                </div>
                            );
                        })}
                        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-medium">
                            <span className="text-white/50">합계 (VAT 포함)</span>
                            <span className={hasExpertQuote ? 'line-through text-white/25' : 'text-white'}>
                                ₩ {(() => { const s = autoItems.reduce((a, it) => a + Math.round(Number(it.unit_price) || 0) * Number(it.quantity), 0); return s.toLocaleString(); })()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 수정견적 */}
                <div className={`rounded-xl border p-4 transition-all ${hasExpertQuote ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-white/10 bg-white/[0.01] border-dashed'
                    }`}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold uppercase tracking-wider ${hasExpertQuote ? 'text-emerald-400' : 'text-white/20'}`}>전문가 수정견적</span>
                        <div className={`h-px flex-1 ${hasExpertQuote ? 'bg-emerald-500/20' : 'bg-white/5'}`}></div>
                        {hasExpertQuote && (
                            <Button
                                variant="ghost" size="sm"
                                className="text-emerald-400 hover:text-emerald-300 text-xs h-6 px-2"
                                onClick={handlePrint}
                            >
                                <Printer className="w-3 h-3 mr-1" /> 출력
                            </Button>
                        )}
                    </div>
                    {hasExpertQuote ? (
                        <div className="space-y-1.5 text-xs">
                            {items.map((it, i) => {
                                const supply = Math.round(Number(it.unit_price) || 0) * Number(it.quantity);
                                return (
                                    <div key={i} className="flex justify-between text-white/70">
                                        <span className="truncate max-w-[180px]">{it.name || `품목 ${i + 1}`}</span>
                                        <span>{supply.toLocaleString()}원</span>
                                    </div>
                                );
                            })}
                            <div className="border-t border-emerald-500/20 pt-2 mt-2 flex justify-between font-bold">
                                <span className="text-emerald-300">합계 (VAT 포함)</span>
                                <span className="text-emerald-400">₩ {totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-white/20">
                            <Pencil className="w-8 h-8 mb-2" />
                            <p className="text-xs text-center">아래에서 품목·단가를 수정 후<br />수정견적 저장 버튼을 클릭하세요</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 공급받는자 정보 */}
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-primary" />
                            공급받는자 정보
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { label: '성명/상호', key: 'name' },
                            { label: '연락처', key: 'phone' },
                            { label: '이메일', key: 'email' },
                            { label: '주소', key: 'address' },
                        ].map(({ label, key }) => (
                            <div key={key} className="grid grid-cols-4 items-center gap-3">
                                <Label className="text-right text-white/60 text-sm">{label}</Label>
                                <Input
                                    className="col-span-3 bg-white/5 border-white/20 text-white text-sm focus:border-primary/60 focus:bg-white/10 transition-colors"
                                    value={(recipient as any)[key]}
                                    onChange={e => setRecipient({ ...recipient, [key]: e.target.value })}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 견적 요약 */}
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-white">견적 요약</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                            <span className="text-white/60 text-sm">견적 번호</span>
                            <span className="font-mono text-white text-sm">{orderInfo.order_number}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                            <span className="text-white/60 text-sm">견적 일자</span>
                            <span className="text-white text-sm">{new Date(orderInfo.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                            <span className="text-white/60 text-sm">공급가액</span>
                            <span className="text-white font-medium">₩ {totalSupply.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                            <span className="text-white/60 text-sm">부가세 (10%)</span>
                            <span className="text-white font-medium">₩ {totalVat.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 pb-1">
                            <span className="text-lg font-bold text-white">합계금액 (VAT포함)</span>
                            <span className="text-2xl font-bold text-primary">₩ {totalAmount.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 품목 편집 테이블 */}
            <Card className="bg-white/[0.03] border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-primary" />
                        견적 품목 상세
                        <span className="text-xs text-white/40 font-normal ml-1">단가·수량·품명을 직접 수정하세요</span>
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={addItem} className="border-white/20 text-white hover:bg-white/10 text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> 항목 추가
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50 text-xs">
                                    <th className="p-2 text-center w-10">No</th>
                                    <th className="p-2 text-left">품명</th>
                                    <th className="p-2 text-left w-28">규격/사양</th>
                                    <th className="p-2 text-center w-20">수량</th>
                                    <th className="p-2 text-right w-36">단가 (원)</th>
                                    <th className="p-2 text-right w-36">공급가액 (원)</th>
                                    <th className="p-2 text-center w-10">삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => {
                                    const supply = Math.round(Number(item.unit_price) || 0) * Math.round(Number(item.quantity) || 0);
                                    return (
                                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="p-2 text-center text-white/40 text-xs">{idx + 1}</td>
                                            <td className="p-1.5">
                                                <Input
                                                    className="bg-white/5 border border-white/20 text-white h-8 text-sm focus:border-primary/60 focus:bg-white/10 transition-colors"
                                                    placeholder="품명 입력"
                                                    value={item.name}
                                                    onChange={e => handleItemChange(idx, 'name', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <Input
                                                    className="bg-white/5 border border-white/20 text-white h-8 text-sm focus:border-primary/60 focus:bg-white/10 transition-colors"
                                                    placeholder="DLP / FDM"
                                                    value={item.spec}
                                                    onChange={e => handleItemChange(idx, 'spec', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <Input
                                                    type="text"
                                                    className="bg-white/5 border border-white/20 text-white text-center h-8 text-sm focus:border-primary/60 focus:bg-white/10 transition-colors"
                                                    value={item.quantity}
                                                    onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <Input
                                                    type="text"
                                                    className="bg-white/5 border border-primary/40 text-primary text-right h-8 text-sm font-medium focus:border-primary focus:bg-primary/5 transition-colors"
                                                    value={Number(item.unit_price).toLocaleString()}
                                                    onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2 text-right text-white font-medium">
                                                {supply.toLocaleString()}원
                                            </td>
                                            <td className="p-2 text-center">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    onClick={() => removeItem(idx)}
                                                    className="h-7 w-7 text-red-500/50 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-white/20 bg-white/[0.02]">
                                    <td colSpan={4} className="p-2 text-right text-white/50 text-xs">소계</td>
                                    <td className="p-2 text-right text-white font-bold">{totalSupply.toLocaleString()}원</td>
                                    <td className="p-2 text-right text-white/50 text-xs">공급가액 합계</td>
                                    <td></td>
                                </tr>
                                <tr className="bg-white/[0.02]">
                                    <td colSpan={4} className="p-2 text-right text-white/50 text-xs">부가세 (10%)</td>
                                    <td className="p-2 text-right text-white/70">{totalVat.toLocaleString()}원</td>
                                    <td colSpan={2}></td>
                                </tr>
                                <tr className="border-t border-primary/30 bg-primary/5">
                                    <td colSpan={4} className="p-3 text-right font-bold text-white">합계금액 (VAT 포함)</td>
                                    <td className="p-3 text-right font-bold text-primary text-base">{totalAmount.toLocaleString()}원</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
                        <div className="text-primary text-lg">💡</div>
                        <div className="text-sm">
                            <p className="text-white font-medium">수정 후 반드시 <span className="text-emerald-400 font-bold">수정견적 저장</span> 버튼을 클릭하세요.</p>
                            <p className="text-white/50 text-xs mt-0.5">저장된 전문가 견적과 자동 견적 원본이 모두 유지됩니다.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
