'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Printer, Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QuoteEditPage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [loading, setLoading] = useState(true);
    const [orderInfo, setOrderInfo] = useState<any>(null); // 원본 주문 정보 (불변)

    // 편집 가능한 상태
    const [recipient, setRecipient] = useState({ name: '', phone: '', email: '', address: '' });
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/admin/orders/${id}`)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    const { order, items } = json.data;
                    setOrderInfo(order);

                    // 초기값 설정
                    setRecipient({
                        name: order.recipient_name || '',
                        phone: order.recipient_phone || '',
                        email: order.user_email || order.guest_email || '',
                        address: order.shipping_address || ''
                    });

                    setItems(items.map((it: any) => ({
                        id: it.id || Math.random(),
                        name: it.file_name,
                        spec: `${it.print_method || ''} ${it.material_name ? '/ ' + it.material_name : ''}`,
                        quantity: it.quantity,
                        unit_price: it.unit_price,
                    })));
                } else {
                    toast({ title: '데이터 로드 실패', variant: 'destructive' });
                }
            })
            .catch(() => toast({ title: '오류 발생', variant: 'destructive' }))
            .finally(() => setLoading(false));
    }, [id, toast]);

    const handleItemChange = (idx: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { id: Math.random(), name: '', spec: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    // 총액 자동 계산
    const totalAmount = items.reduce((acc, it) => acc + (Number(it.unit_price || 0) * Number(it.quantity || 0)), 0);

    const handlePrint = () => {
        // 인쇄용 데이터 구성 (DB 구조와 일치시키기 위해 매핑)
        const printData = {
            order: {
                ...orderInfo,
                recipient_name: recipient.name,
                recipient_phone: recipient.phone,
                user_email: recipient.email, // or guest_email logic
                guest_email: recipient.email,
                shipping_address: recipient.address,
                total_amount: totalAmount,
                created_at: orderInfo.created_at // 유지
            },
            items: items.map(it => ({
                id: it.id,
                file_name: it.name,
                print_method: it.spec, // 단순화
                material_name: '', // display 용으로 spec에 합침
                quantity: it.quantity,
                unit_price: it.unit_price,
                subtotal: Number(it.unit_price) * Number(it.quantity)
            }))
        };

        // localStorage에 임시 저장 후 인쇄 창 열기
        localStorage.setItem(`quote_temp_${id}`, JSON.stringify(printData));
        window.open(`/print/estimate/${id}?temp=true`, '_blank', 'width=900,height=1000');
    };

    if (loading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    if (!orderInfo) return <div className="p-8 text-white">데이터를 찾을 수 없습니다.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white/50 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        견적서 수정 및 발행
                    </h1>
                    <p className="text-white/50 text-sm ml-10">내용을 수정해도 원본 주문 데이터는 변경되지 않습니다. (견적서 출력용)</p>
                </div>
                <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-black font-bold">
                    <Printer className="w-4 h-4 mr-2" />
                    견적서 인쇄
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 공급받는자 정보 */}
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader><CardTitle className="text-lg text-white">공급받는자 정보</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-white/70">성명/상호</Label>
                            <Input className="col-span-3 bg-white/5 border-white/10 text-white" value={recipient.name} onChange={e => setRecipient({ ...recipient, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-white/70">연락처</Label>
                            <Input className="col-span-3 bg-white/5 border-white/10 text-white" value={recipient.phone} onChange={e => setRecipient({ ...recipient, phone: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-white/70">이메일</Label>
                            <Input className="col-span-3 bg-white/5 border-white/10 text-white" value={recipient.email} onChange={e => setRecipient({ ...recipient, email: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-white/70">주소</Label>
                            <Input className="col-span-3 bg-white/5 border-white/10 text-white" value={recipient.address} onChange={e => setRecipient({ ...recipient, address: e.target.value })} />
                        </div>
                    </CardContent>
                </Card>

                {/* 견적 요약 */}
                <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader><CardTitle className="text-lg text-white">견적 요약</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-white/70">견적 번호</span>
                            <span className="font-mono text-white">{orderInfo.order_number}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-white/70">견적 일자</span>
                            <span className="text-white">{new Date(orderInfo.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-4">
                            <span className="text-lg font-bold text-white">총 합계</span>
                            <span className="text-2xl font-bold text-primary">₩ {totalAmount.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 품목 리스트 */}
            <Card className="bg-white/[0.03] border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg text-white">견적 품목 상세</CardTitle>
                    <Button variant="outline" size="sm" onClick={addItem} className="border-white/10 text-white hover:bg-white/10">
                        <Plus className="w-4 h-4 mr-2" /> 항목 추가
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/60">
                                    <th className="p-2 text-left w-12">No</th>
                                    <th className="p-2 text-left">품명</th>
                                    <th className="p-2 text-left">규격/사양</th>
                                    <th className="p-2 text-right w-24">수량</th>
                                    <th className="p-2 text-right w-32">단가</th>
                                    <th className="p-2 text-right w-32">공급가액</th>
                                    <th className="p-2 text-center w-12">삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-white/5">
                                        <td className="p-2 text-white/50">{idx + 1}</td>
                                        <td className="p-2">
                                            <Input
                                                className="bg-transparent border-transparent hover:border-white/20 text-white h-8"
                                                value={item.name}
                                                onChange={e => handleItemChange(idx, 'name', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                className="bg-transparent border-transparent hover:border-white/20 text-white h-8"
                                                value={item.spec}
                                                onChange={e => handleItemChange(idx, 'spec', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                className="bg-transparent border-transparent hover:border-white/20 text-white text-right h-8"
                                                value={item.quantity}
                                                onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                className="bg-transparent border-transparent hover:border-white/20 text-white text-right h-8"
                                                value={item.unit_price}
                                                onChange={e => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-2 text-right text-white/90">
                                            {(item.quantity * item.unit_price).toLocaleString()}
                                        </td>
                                        <td className="p-2 text-center">
                                            <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-8 w-8 text-red-500/70 hover:text-red-500 hover:bg-red-500/10">
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
        </div>
    );
}
