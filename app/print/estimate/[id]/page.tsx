'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type CompanyInfo = {
    business_number?: string;
    company_name?: string;
    representative?: string;
    business_type?: string;
    business_item?: string;
    address?: string;
    phone?: string;
    fax?: string;
    email?: string;
    logo_url?: string;
    estimate_valid_days?: number;
    estimate_header_note?: string;
    estimate_footer_note?: string;
    bank_name?: string;
    bank_account?: string;
    bank_holder?: string;
};

// 기본 회사 정보 (DB 로드 실패 시 폴백)
const DEFAULT_COMPANY: CompanyInfo = {
    company_name: '와우쓰리디(Wow3D)',
    representative: '서정주',
    business_type: '제조업',
    business_item: '3D프린팅',
    address: '서울시 금천구 가산디지털1로 1, 101호',
    estimate_valid_days: 14,
};

export default function EstimatePrintPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id;
    const isTemp = searchParams.get('temp') === 'true';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');
    const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);

    useEffect(() => {
        if (!id) return;

        // localStorage에 저장된 관리자 토큰
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_print_token') : null;
        const authHeader = savedToken ? { Authorization: `Bearer ${savedToken}` } : {};

        // 회사 정보 로드 (인증 토큰이 있을 때)
        if (savedToken) {
            fetch('/api/admin/company', { headers: authHeader })
                .then(r => r.json())
                .then(json => {
                    if (json.success && json.data) {
                        setCompany({ ...DEFAULT_COMPANY, ...json.data });
                    }
                })
                .catch(e => console.warn('Company info load failed', e));
        }

        if (isTemp) {
            // 임시 저장된 데이터 (관리자 수정본)
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

        fetch(`/api/admin/orders/${id}`, { headers: authHeader })
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.error || '주문 정보를 불러올 수 없습니다. 관리자 페이지에서 인쇄해주세요.');
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
            setTimeout(() => window.print(), 800);
        }
    }, [loading, data]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
    );

    if (error) return (
        <div className="flex h-screen items-center justify-center flex-col gap-4 text-center p-8">
            <div className="text-red-500 text-lg font-bold">❌ 인증 오류</div>
            <div className="text-slate-600 text-sm max-w-sm">{error}</div>
            <div className="text-slate-400 text-xs mt-2">관리자 페이지 → 견적 관리에서 인쇄 버튼을 통해 열어주세요.</div>
        </div>
    );

    if (!data) return null;

    const { order, items } = data;
    const today = new Date();
    const orderDate = new Date(order.created_at);

    // 금액 계산: 수량 × 단가 = 공급가액, 공급가액 × 10% = 부가세, 합계 = 공급가액 + 부가세
    const totalSupply = items.reduce((acc: number, item: any) =>
        acc + (Number(item.unit_price || 0) * Number(item.quantity || 0)), 0);
    const totalVat = Math.round(totalSupply * 0.1);
    const totalAmount = totalSupply + totalVat;

    // 견적서 특이사항 분리 처리
    const footerLines = company.estimate_footer_note
        ? company.estimate_footer_note.split('\n').filter(Boolean)
        : [
            `본 견적의 유효기간은 견적일로부터 ${company.estimate_valid_days || 14}일입니다.`,
            '제작 사양 변경 시 견적 금액이 변동될 수 있습니다.',
            '본 견적서는 귀사의 발주를 위한 기초 자료로 제공됩니다.',
        ];

    return (
        <div className="bg-white text-black min-h-screen p-8 md:p-12 print:p-6">
            <div className="max-w-[210mm] mx-auto bg-white print:max-w-none">

                {/* 헤더 */}
                <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-4">
                    <div className="flex items-center gap-4">
                        {company.logo_url && (
                            <img src={company.logo_url} alt="company logo" className="h-14 object-contain" />
                        )}
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-widest">견 적 서</h1>
                            {company.company_name && (
                                <div className="text-sm text-slate-500 mt-1">{company.company_name}</div>
                            )}
                        </div>
                    </div>
                    <div className="text-sm text-right">
                        <div className="font-bold mb-1">견적번호 : {order.order_number}</div>
                        <div>견적일자 : {order.created_at ? new Date(order.created_at).toLocaleDateString() : today.toLocaleDateString()}</div>
                    </div>
                </div>

                {/* 상단 추가 문구 */}
                {company.estimate_header_note && (
                    <div className="mb-6 text-sm text-slate-600 italic border-l-4 border-slate-300 pl-3">
                        {company.estimate_header_note}
                    </div>
                )}

                {/* 공급자/수요자 정보 */}
                <div className="flex flex-col md:flex-row gap-0 border border-black mb-8">
                    {/* 공급받는자 */}
                    <div className="w-full md:w-1/2 p-0 border-b md:border-b-0 md:border-r border-black">
                        <div className="bg-slate-100 p-2 text-center font-bold border-b border-black text-sm">공급받는자</div>
                        <div className="p-4 space-y-2 text-sm">
                            <InfoRow label="상호/성명" value={order.recipient_name} />
                            <InfoRow label="연락처" value={order.recipient_phone} />
                            <InfoRow label="이메일" value={order.user_email || order.guest_email || '-'} />
                            <InfoRow label="주소" value={order.shipping_address} />
                        </div>
                    </div>

                    {/* 공급자 */}
                    <div className="w-full md:w-1/2 p-0">
                        <div className="bg-slate-100 p-2 text-center font-bold border-b border-black text-sm">공급자</div>
                        <div className="p-4 space-y-2 text-sm relative">
                            {company.business_number && <InfoRow label="등록번호" value={company.business_number} />}
                            <InfoRow label="상호(법인)" value={company.company_name} />
                            <div className="flex">
                                <span className="w-20 font-bold text-slate-500">대표자</span>
                                <span>{company.representative}</span>
                                <div className="absolute right-4 top-10 opacity-40">
                                    <span className="border border-red-500 text-red-500 rounded-sm px-1 text-xs select-none">(인)</span>
                                </div>
                            </div>
                            {company.address && <InfoRow label="사업장" value={company.address} />}
                            {(company.business_type || company.business_item) && (
                                <InfoRow label="업태/종목" value={`${company.business_type || ''} / ${company.business_item || ''}`} />
                            )}
                            {company.phone && <InfoRow label="전화" value={company.phone} />}
                        </div>
                    </div>
                </div>

                {/* 합계 금액 */}
                <div className="border-b-2 border-black pb-2 mb-6 flex justify-between items-end">
                    <span className="font-bold text-lg">합계금액 (Supply Price Total)</span>
                    <span className="text-2xl font-bold">
                        ₩ {totalAmount.toLocaleString()}
                        <span className="text-sm font-normal text-slate-600"> (VAT 포함)</span>
                    </span>
                </div>

                {/* 품목 리스트 */}
                <table className="w-full text-sm border-collapse mb-8 border border-black">
                    <thead>
                        <tr className="bg-slate-100 text-center">
                            <th className="border border-black p-2 font-bold w-10">No</th>
                            <th className="border border-black p-2 font-bold">품목명 / 사양</th>
                            <th className="border border-black p-2 font-bold w-14">수량</th>
                            <th className="border border-black p-2 font-bold w-24">단가</th>
                            <th className="border border-black p-2 font-bold w-24">공급가액</th>
                            <th className="border border-black p-2 font-bold w-20">세액(10%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, idx: number) => {
                            const itemSupply = Number(item.unit_price || 0) * Number(item.quantity || 0);
                            const itemVat = Math.round(itemSupply * 0.1);
                            return (
                                <tr key={item.id || idx} className="text-center">
                                    <td className="border border-black p-2">{idx + 1}</td>
                                    <td className="border border-black p-2 text-left">
                                        <div className="font-bold">{item.file_name}</div>
                                        <div className="text-xs text-slate-500">
                                            {item.print_method ? item.print_method.toUpperCase() : ''}
                                            {item.material_name ? ` / ${item.material_name}` : ''}
                                        </div>
                                    </td>
                                    <td className="border border-black p-2">{item.quantity}</td>
                                    <td className="border border-black p-2 text-right">{Number(item.unit_price || 0).toLocaleString()}</td>
                                    <td className="border border-black p-2 text-right">{itemSupply.toLocaleString()}</td>
                                    <td className="border border-black p-2 text-right">{itemVat.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                        {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
                            <tr key={`empty-${i}`} className="text-center h-8">
                                {[...Array(6)].map((_, j) => <td key={j} className="border border-black p-2"></td>)}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 font-bold">
                            <td className="border border-black p-2 text-center" colSpan={2}>합 계</td>
                            <td className="border border-black p-2 text-center">
                                {items.reduce((acc: number, curr: any) => acc + Number(curr.quantity || 0), 0)}
                            </td>
                            <td className="border border-black p-2 text-right">-</td>
                            <td className="border border-black p-2 text-right">{totalSupply.toLocaleString()}</td>
                            <td className="border border-black p-2 text-right">{totalVat.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* 계좌 정보 */}
                {(company.bank_name || company.bank_account) && (
                    <div className="mb-6 p-3 border border-slate-300 rounded text-sm">
                        <span className="font-bold text-slate-700">입금 계좌:</span>{' '}
                        {company.bank_name} {company.bank_account}
                        {company.bank_holder ? ` (${company.bank_holder})` : ''}
                    </div>
                )}

                {/* 특이사항 */}
                <div className="mt-6 text-sm space-y-2">
                    <p className="font-bold border-b border-black inline-block mb-2">특이사항</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {footerLines.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                </div>

                {/* 서명란 */}
                <div className="mt-16 text-center">
                    <p className="text-lg font-serif">위와 같이 견적합니다.</p>
                    <p className="mt-4 font-bold">{orderDate.toLocaleDateString()}</p>
                    <p className="mt-2 font-bold text-xl">{company.company_name || '와우쓰리디 (Wow3D)'}</p>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
        <div className="flex">
            <span className="w-20 font-bold text-slate-500 flex-shrink-0">{label}</span>
            <span className="flex-1">{value}</span>
        </div>
    );
}
