'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EstimatePrintPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id;
    const isTemp = searchParams.get('temp') === 'true';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        if (isTemp) {
            // 임시 저장된 데이터 로드 (관리자 수정본)
            try {
                const stored = localStorage.getItem(`quote_temp_${id}`);
                if (stored) {
                    setData(JSON.parse(stored));
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error('Failed to load temp quote', e);
            }
        }

        // 없으면 DB 로드
        fetch(`/api/admin/orders/${id}`)
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.error || '주문 정보를 불러올 수 없습니다.');
                }
            })
            .catch(err => {
                setError('데이터 로딩 실패');
                console.error(err);
            })
            .finally(() => setLoading(false));
    }, [id, isTemp]);

    useEffect(() => {
        if (!loading && data) {
            // 데이터 로드 후 잠시 뒤 자동 인쇄 창 띄우기 (옵션)
            setTimeout(() => {
                window.print();
            }, 800);
        }
    }, [loading, data]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
    if (!data) return null;

    const { order, items } = data;
    const today = new Date();
    const orderDate = new Date(order.created_at);

    // 총 합계 계산
    const totalAmount = Number(order.total_amount || 0);
    const supplyValue = Math.round(totalAmount / 1.1); // 공급가액 (VAT 포함 가정 시 역산)
    const vat = totalAmount - supplyValue; // 부가세

    return (
        <div className="bg-white text-black min-h-screen p-8 md:p-12 print:p-0">
            {/* A4 용지 스타일 컨테이너 */}
            <div className="max-w-[210mm] mx-auto bg-white print:max-w-none">

                {/* 헤더: 제목 및 결재란(선택사항) */}
                <div className="flex justify-between items-start mb-12 border-b-2 border-black pb-4">
                    <h1 className="text-4xl font-serif font-bold tracking-widest">견 적 서</h1>
                    <div className="text-sm text-right">
                        <div className="font-bold mb-1">견적번호 : {order.order_number}</div>
                        <div>견적일자 : {order.created_at ? new Date(order.created_at).toLocaleDateString() : today.toLocaleDateString()}</div>
                    </div>
                </div>

                {/* 공급자/수요자 정보 테이블 */}
                <div className="flex flex-col md:flex-row gap-0 border border-black mb-8">
                    {/* 공급받는자 */}
                    <div className="w-full md:w-1/2 p-0 border-b md:border-b-0 md:border-r border-black">
                        <div className="bg-slate-100 p-2 text-center font-bold border-b border-black">공급받는자</div>
                        <div className="p-4 space-y-3 text-sm">
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">상호/성명</span>
                                <span>{order.recipient_name}</span>
                            </div>
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">연락처</span>
                                <span>{order.recipient_phone}</span>
                            </div>
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">이메일</span>
                                <span>{order.user_email || order.guest_email || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">주소</span>
                                <span className="flex-1">{order.shipping_address}</span>
                            </div>
                        </div>
                    </div>

                    {/* 공급자 */}
                    <div className="w-full md:w-1/2 p-0">
                        <div className="bg-slate-100 p-2 text-center font-bold border-b border-black">공급자</div>
                        <div className="p-4 space-y-3 text-sm relative">
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">등록번호</span>
                                <span>123-45-67890</span>
                            </div>
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">상호(법인)</span>
                                <span>와우쓰리디(Wow3D)</span>
                            </div>
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">대표자</span>
                                <span>서정주</span>
                                {/* 도장 이미지 (Optional) */}
                                <div className="absolute right-4 top-10 opacity-50">
                                    <span className="border border-red-500 text-red-500 rounded-sm px-1 text-xs select-none">(인)</span>
                                </div>
                            </div>
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">사업장</span>
                                <span>서울시 금천구 가산디지털1로 1, 101호</span>
                            </div>
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">업태/종목</span>
                                <span>제조업 / 3D프린팅</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 합계 금액 */}
                <div className="border-b-2 border-black pb-2 mb-6 flex justify-between items-end">
                    <span className="font-bold text-lg">합계금액 (Supply Price Total)</span>
                    <span className="text-2xl font-bold">₩ {totalAmount.toLocaleString()} <span className="text-sm font-normal text-slate-600">(VAT 포함)</span></span>
                </div>

                {/* 품목 리스트 */}
                <table className="w-full text-sm border-collapse mb-8 border border-black">
                    <thead>
                        <tr className="bg-slate-100 text-center">
                            <th className="border border-black p-2 font-bold w-12">No</th>
                            <th className="border border-black p-2 font-bold max-w-[200px]">품목명 / 사양</th>
                            <th className="border border-black p-2 font-bold w-16">수량</th>
                            <th className="border border-black p-2 font-bold w-24">단가</th>
                            <th className="border border-black p-2 font-bold w-24">공급가액</th>
                            <th className="border border-black p-2 font-bold w-24">세액</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, idx: number) => {
                            const itemPrice = Number(item.subtotal || 0);
                            const itemSupply = Math.round(itemPrice / 1.1);
                            const itemVat = itemPrice - itemSupply;

                            return (
                                <tr key={item.id} className="text-center">
                                    <td className="border border-black p-2">{idx + 1}</td>
                                    <td className="border border-black p-2 text-left">
                                        <div className="font-bold">{item.file_name}</div>
                                        <div className="text-xs text-slate-500">
                                            {item.print_method?.toUpperCase()} / {item.material_name}
                                        </div>
                                    </td>
                                    <td className="border border-black p-2">{item.quantity}</td>
                                    <td className="border border-black p-2 text-right">{Number(item.unit_price || 0).toLocaleString()}</td>
                                    <td className="border border-black p-2 text-right">{itemSupply.toLocaleString()}</td>
                                    <td className="border border-black p-2 text-right">{itemVat.toLocaleString()}</td>
                                </tr>
                            );
                        })}

                        {/* 여백용 빈 줄 (필요 시) */}
                        {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
                            <tr key={`empty-${i}`} className="text-center h-8">
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 font-bold">
                            <td className="border border-black p-2 text-center" colSpan={2}>합 계</td>
                            <td className="border border-black p-2 text-center">{items.reduce((acc: number, curr: any) => acc + (curr.quantity || 0), 0)}</td>
                            <td className="border border-black p-2 text-right">-</td>
                            <td className="border border-black p-2 text-right">{supplyValue.toLocaleString()}</td>
                            <td className="border border-black p-2 text-right">{vat.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* 하단 메모 */}
                <div className="mt-8 text-sm space-y-2">
                    <p className="font-bold border-b border-black inline-block mb-2">특이사항</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                        <li>본 견적의 유효기간은 견적일로부터 14일입니다.</li>
                        <li>제작 사양 변경 시 견적 금액이 변동될 수 있습니다.</li>
                        <li>본 견적서는 귀사의 발주를 위한 기초 자료로 제공됩니다.</li>
                    </ul>
                </div>

                {/* 하단 서명란 */}
                <div className="mt-16 text-center">
                    <p className="text-lg font-serif">위와 같이 견적합니다.</p>
                    <p className="mt-4 font-bold">{orderDate.toLocaleDateString()}</p>
                    <p className="mt-2 font-bold text-xl">와우쓰리디 (Wow3D)</p>
                </div>
            </div>
        </div>
    );
}
