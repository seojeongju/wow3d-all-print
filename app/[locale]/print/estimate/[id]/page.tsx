'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { correctDisplayAmount } from '@/lib/amount-display';
import { formatKoreanDate, formatNowKoreanDate } from '@/lib/date-utils';
import { getStoredAdminToken } from '@/lib/client-admin-auth';
import { normalizeEstimateViewToken } from '@/lib/quotation-view-token';
import {
    DEFAULT_SHIPPING_SETTINGS,
    formatFreeShippingHint,
    parseShippingSettings,
    resolveShippingFee,
    type ShippingSettings,
} from '@/lib/shipping-settings';

function getPersistedUserToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem('wow3d-auth');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const t = parsed?.state?.token;
        return typeof t === 'string' && t.trim() ? t : null;
    } catch {
        return null;
    }
}

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
    seal_url?: string;
};

// 기본 회사 정보 (DB 로드 실패 시 폴백)
const DEFAULT_COMPANY: CompanyInfo = {
    company_name: '와우쓰리디(Wow3D)',
    representative: '서정주',
    business_type: '제조업',
    business_item: '3D프린팅',
    address: '서울시 금천구 가산디지털1로 1, 101호',
    estimate_valid_days: 14,
    seal_url: '',
};

export default function EstimatePrintPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id;
    const isTemp = searchParams.get('temp') === 'true';
    const token = normalizeEstimateViewToken(searchParams.get('token'));

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');
    const [errorHint, setErrorHint] = useState('');
    const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
    const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);

    useEffect(() => {
        if (!id) return;

        // 1. URL 보안 토큰(token)이 주어진 경우 -> 퍼블릭 고객용 API
        if (token) {
            fetch(`/api/orders/${id}/estimate?token=${encodeURIComponent(token)}`)
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data) {
                        const { order, items, company: dbCompany, shippingSettings: rows } = json.data;
                        setData({ order, items, shipping_fee: json.data.shipping_fee });
                        if (dbCompany) {
                            setCompany({ ...DEFAULT_COMPANY, ...dbCompany });
                        }
                        if (rows) setShippingSettings(parseShippingSettings(rows));
                    } else {
                        setError(json.error || '견적 정보를 불러올 수 없습니다.');
                        setErrorHint('이메일로 받으신 최신 견적서 링크를 이용해 주세요. 링크가 동작하지 않으면 발송처에 문의해 주세요.');
                    }
                })
                .catch(err => {
                    setError('데이터 로딩 실패');
                    setErrorHint('잠시 후 다시 시도해 주세요.');
                    console.error(err);
                })
                .finally(() => setLoading(false));
            return;
        }

        // 2. 로그인 고객: 본인 주문 견적서 (마이페이지에서 열기)
        const userToken = getPersistedUserToken();
        if (userToken) {
            fetch(`/api/orders/${id}/estimate`, {
                headers: { Authorization: `Bearer ${userToken}` },
            })
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data) {
                        const { order, items, company: dbCompany, shippingSettings: rows } = json.data;
                        setData({ order, items, shipping_fee: json.data.shipping_fee });
                        if (dbCompany) {
                            setCompany({ ...DEFAULT_COMPANY, ...dbCompany });
                        }
                        if (rows) setShippingSettings(parseShippingSettings(rows));
                        setLoading(false);
                        return true;
                    }
                    return false;
                })
                .then((ok) => {
                    if (ok) return;
                    // 본인 주문이 아니면 관리자 모드로 폴백
                    loadAdminEstimate();
                })
                .catch(() => loadAdminEstimate());
            return;
        }

        loadAdminEstimate();

        function loadAdminEstimate() {
            const savedToken = getStoredAdminToken();
            const authHeader: Record<string, string> = {};
            if (savedToken) authHeader['Authorization'] = `Bearer ${savedToken}`;

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

            fetch('/api/settings')
                .then(r => r.json())
                .then(json => {
                    if (json.success && Array.isArray(json.data)) {
                        setShippingSettings(parseShippingSettings(json.data));
                    }
                })
                .catch(() => {});

            if (isTemp) {
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
                        setError(json.error || '주문 정보를 불러올 수 없습니다.');
                        setErrorHint(
                            savedToken
                                ? '관리자 페이지 → 견적 관리에서 인쇄 버튼을 통해 열어주세요.'
                                : '로그인 후 마이페이지에서 견적서를 확인하거나, 이메일로 받은 견적서 링크를 이용해 주세요.'
                        );
                    }
                })
                .catch(err => {
                    setError('데이터 로딩 실패');
                    setErrorHint('잠시 후 다시 시도해 주세요.');
                    console.error(err);
                })
                .finally(() => setLoading(false));
        }
    }, [id, isTemp, token]);

    // 인쇄/PDF 시 브라우저 제목 통일 (훅 규칙: 조건부 return 이전에 호출)
    const orderNumber = data?.order?.order_number;
    useEffect(() => {
        if (orderNumber) {
            const prev = document.title;
            document.title = `견적서 - ${orderNumber}`;
            return () => { document.title = prev; };
        }
    }, [orderNumber]);

    // 훅은 조건부 return 이전에 항상 호출 (React 훅 규칙)
    const displayItems = useMemo(() => {
        if (!data) return [];
        const { order, items: apiItems } = data;
        const hasExpert = order?.has_expert_quote || order?.hasExpertQuote;
        const rawExpert = order?.expert_quote_data ?? order?.expertQuoteData;
        if (hasExpert && rawExpert) {
            try {
                const expert = typeof rawExpert === 'string' ? JSON.parse(rawExpert) : rawExpert;
                const list = expert?.items;
                if (Array.isArray(list) && list.length > 0) {
                    return list.map((it: any, idx: number) => {
                        const unitPrice = Math.round(Number(it.unit_price) || 0);
                        const qty = Math.max(1, Number(it.quantity) || 1);
                        return {
                            id: it.id ?? idx,
                            file_name: it.name ?? it.file_name ?? `품목 ${idx + 1}`,
                            print_method: it.spec ?? it.print_method ?? '',
                            material_name: it.material_name ?? '',
                            quantity: qty,
                            unit_price: unitPrice,
                            subtotal: unitPrice * qty,
                        };
                    });
                }
            } catch (_) {}
        }
        return (apiItems || []).map((item: any) => {
            const raw = Number(item.unit_price || 0);
            const unitPrice = correctDisplayAmount(raw) ?? Math.round(raw);
            const qty = Math.max(1, Number(item.quantity) || 1);
            return {
                ...item,
                unit_price: unitPrice,
                subtotal: unitPrice * qty,
            };
        });
    }, [data]);

    const totalAmount = displayItems.reduce((acc: number, item: any) =>
        acc + Math.round(Number(item.unit_price || 0) * Number(item.quantity || 0)), 0);

    const shippingOverride = useMemo(() => {
        if (!data) return null;
        if (data.shipping_fee != null && data.shipping_fee !== '') {
            const n = Number(data.shipping_fee);
            return Number.isFinite(n) ? n : null;
        }
        const rawExpert = data.order?.expert_quote_data ?? data.order?.expertQuoteData;
        if (!rawExpert) return null;
        try {
            const expert = typeof rawExpert === 'string' ? JSON.parse(rawExpert) : rawExpert;
            if (expert?.shipping_fee != null && expert.shipping_fee !== '') {
                const n = Number(expert.shipping_fee);
                return Number.isFinite(n) ? n : null;
            }
        } catch {
            /* ignore */
        }
        return null;
    }, [data]);

    const shippingFee = resolveShippingFee(totalAmount, shippingSettings, shippingOverride);
    const grandTotal = totalAmount + shippingFee;
    const totalSupply = Math.round(grandTotal / 1.1);
    const totalVat = grandTotal - totalSupply;
    const footerLines = [
        ...(company.estimate_footer_note
            ? company.estimate_footer_note.split('\n').filter(Boolean)
            : [
                `본 견적의 유효기간은 견적일로부터 ${company.estimate_valid_days || 14}일입니다.`,
                '제작 사양 변경 시 견적 금액이 변동될 수 있습니다.',
                '본 견적서는 귀사의 발주를 위한 기초 자료로 제공됩니다.',
            ]),
        shippingFee > 0
            ? `배송비 ₩${shippingFee.toLocaleString()} 포함 (${formatFreeShippingHint(shippingSettings.freeThreshold)})`
            : `배송비: 무료 (${formatFreeShippingHint(shippingSettings.freeThreshold)})`,
    ];

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
    );

    if (error) return (
        <div className="flex h-screen items-center justify-center flex-col gap-4 text-center p-8">
            <div className="text-red-500 text-lg font-bold">
                {token ? '견적서 링크 오류' : '접근 권한 없음'}
            </div>
            <div className="text-slate-600 text-sm max-w-sm">{error}</div>
            {errorHint && (
                <div className="text-slate-400 text-xs mt-2 max-w-sm">{errorHint}</div>
            )}
        </div>
    );

    if (!data) return null;

    const { order } = data;
    const estimateDate = order.created_at ? formatKoreanDate(order.created_at) : formatNowKoreanDate();

    return (
        <div className="bg-white text-black min-h-screen">
            {/* 인쇄 시 브라우저 기본 헤더/푸터 영향 최소화 + 레이아웃 유지 */}
            <style jsx global>{`
                @page {
                    size: A4;
                    margin: 12mm;
                }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    tr { break-inside: avoid; }
                    .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
                }
            `}</style>

            {/* 인쇄 버튼 바 - 인쇄 시 숨김 */}
            <div className="print:hidden bg-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
                <span className="text-white text-sm font-medium">견적서 미리보기</span>
                <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className="text-xs text-slate-400 max-w-[240px] sm:max-w-none">
                        PDF로 저장 시 인쇄 창에서 &apos;헤더 및 푸터&apos; 해제 시 미리보기와 동일하게 저장됩니다.
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.close()}
                            className="px-4 py-1.5 text-sm text-slate-300 hover:text-white border border-slate-600 rounded transition-colors"
                        >
                            닫기
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-5 py-1.5 text-sm bg-slate-600 hover:bg-slate-500 text-white rounded font-bold transition-colors"
                        >
                            🖨️ 인쇄
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8 md:p-12 print:p-6">
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
                            <div>견적일자 : {estimateDate}</div>
                        </div>
                    </div>

                    {/* 상단 추가 문구 */}
                    {company.estimate_header_note && (
                        <div className="mb-6 text-sm text-slate-600 italic border-l-4 border-slate-300 pl-3">
                            {company.estimate_header_note}
                        </div>
                    )}

                    {/* 공급자/수요자 정보 - 한 줄에 배치, 컴팩트 */}
                    <div className="flex flex-row gap-0 border border-black mb-6">
                        {/* 공급받는자 */}
                        <div className="flex-1 min-w-0 p-0 border-r border-black">
                            <div className="bg-slate-100 py-1.5 px-2 text-center font-bold border-b border-black text-xs">공급받는자</div>
                            <div className="p-2 space-y-1 text-xs">
                                <InfoRow label="상호/성명" value={order.recipient_name} compact />
                                <InfoRow label="연락처" value={order.recipient_phone} compact />
                                <InfoRow label="이메일" value={order.user_email || order.guest_email || '-'} compact />
                                <InfoRow label="주소" value={order.shipping_address} compact />
                            </div>
                        </div>

                        {/* 공급자 */}
                        <div className="flex-1 min-w-0 p-0">
                            <div className="bg-slate-100 py-1.5 px-2 text-center font-bold border-b border-black text-xs">공급자</div>
                            <div className="p-2 space-y-1 text-xs relative">
                                {company.business_number && <InfoRow label="등록번호" value={company.business_number} compact />}
                                <div className="flex min-w-0 gap-2">
                                    <div className="flex items-center shrink-0">
                                        <span className="w-[4.5rem] flex-shrink-0 font-bold text-slate-500 whitespace-nowrap">상호(법인)</span>
                                        <span className="font-bold text-sm whitespace-nowrap">{company.company_name}</span>
                                    </div>
                                    <div className="flex items-center ml-4">
                                        <span className="w-11 flex-shrink-0 font-bold text-slate-500 whitespace-nowrap">대표자</span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-sm whitespace-nowrap">{company.representative}</span>
                                            <div className="relative flex items-center justify-center ml-1">
                                                <span className="border border-red-500 text-red-500 rounded-sm px-1 text-[10px] select-none flex-shrink-0 opacity-40 font-bold">(인)</span>
                                                {company.seal_url && (
                                                    <img 
                                                        src={company.seal_url} 
                                                        alt="seal" 
                                                        className="absolute w-12 h-12 min-w-[3rem] object-contain rotate-[-5deg] print:opacity-100" 
                                                        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(-5deg)', maxWidth: 'none' }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {company.address && <InfoRow label="사업장" value={company.address} compact />}
                                {(company.business_type || company.business_item) && (
                                    <InfoRow label="업태/종목" value={`${company.business_type || ''} / ${company.business_item || ''}`} compact />
                                )}
                                {company.phone && <InfoRow label="전화" value={company.phone} compact />}
                            </div>
                        </div>
                    </div>

                    {/* 합계 금액 */}
                    <div className="print-avoid-break border-b-2 border-black pb-2 mb-6 space-y-2">
                        <div className="flex justify-between items-end text-sm">
                            <span className="text-slate-600">품목 합계 (VAT 포함)</span>
                            <span>₩ {totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-end text-sm">
                            <span className="text-slate-600">
                                배송비
                                {shippingFee > 0 ? (
                                    <span className="text-xs text-slate-400 ml-2">
                                        ({formatFreeShippingHint(shippingSettings.freeThreshold)})
                                    </span>
                                ) : null}
                            </span>
                            <span>{shippingFee === 0 ? '무료' : `₩ ${shippingFee.toLocaleString()}`}</span>
                        </div>
                        <div className="flex justify-between items-end pt-1">
                            <span className="font-bold text-lg">합계금액 (Supply Price Total)</span>
                            <span className="text-2xl font-bold">
                                ₩ {grandTotal.toLocaleString()}
                                <span className="text-sm font-normal text-slate-600"> (VAT 포함)</span>
                            </span>
                        </div>
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
                                <th className="border border-black p-2 font-bold w-20">부가세(10%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item: any, idx: number) => {
                                const itemTotal = Math.round(Number(item.unit_price || 0) * Number(item.quantity || 0));
                                const itemSupply = Math.round(itemTotal / 1.1);
                                const itemVat = itemTotal - itemSupply;
                                return (
                                    <tr key={item.id ?? idx} className="text-center">
                                        <td className="border border-black p-2">{idx + 1}</td>
                                        <td className="border border-black p-2 text-left">
                                            <div className="font-bold">{item.file_name}</div>
                                            <div className="text-xs text-slate-500">
                                                {item.print_method ? String(item.print_method).toUpperCase() : ''}
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
                            {Array.from({ length: Math.max(0, 10 - displayItems.length) }).map((_, i) => (
                                <tr key={`empty-${i}`} className="text-center h-8">
                                    {[...Array(6)].map((_, j) => <td key={j} className="border border-black p-2"></td>)}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50 font-bold">
                                <td className="border border-black p-2 text-center" colSpan={2}>품목 합계</td>
                                <td className="border border-black p-2 text-center">
                                    {displayItems.reduce((acc: number, curr: any) => acc + Number(curr.quantity || 0), 0)}
                                </td>
                                <td className="border border-black p-2 text-right">-</td>
                                <td className="border border-black p-2 text-right">
                                    {Math.round(totalAmount / 1.1).toLocaleString()}
                                </td>
                                <td className="border border-black p-2 text-right">
                                    {(totalAmount - Math.round(totalAmount / 1.1)).toLocaleString()}
                                </td>
                            </tr>
                            <tr className="bg-white">
                                <td className="border border-black p-2 text-center" colSpan={2}>배송비</td>
                                <td className="border border-black p-2 text-center">-</td>
                                <td className="border border-black p-2 text-right">-</td>
                                <td className="border border-black p-2 text-right" colSpan={2}>
                                    {shippingFee === 0 ? '무료' : `₩ ${shippingFee.toLocaleString()}`}
                                </td>
                            </tr>
                            <tr className="bg-slate-50 font-bold">
                                <td className="border border-black p-2 text-center" colSpan={2}>최종 합계</td>
                                <td className="border border-black p-2 text-center">-</td>
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
                    <div className="print-avoid-break mt-6 text-sm space-y-2">
                        <p className="font-bold border-b border-black inline-block mb-2">특이사항</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                            {footerLines.map((line, i) => <li key={i}>{line}</li>)}
                        </ul>
                    </div>

                    {/* 서명란 */}
                    <div className="mt-16 text-center">
                        <p className="text-lg font-serif">위와 같이 견적합니다.</p>
                        <p className="mt-4 font-bold">{estimateDate}</p>
                        <p className="mt-2 font-bold text-xl">{company.company_name || '와우쓰리디 (Wow3D)'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, compact }: { label: string; value?: string; compact?: boolean }) {
    if (!value) return null;
    return (
        <div className="flex min-w-0">
            <span className={`font-bold text-slate-500 flex-shrink-0 ${compact ? 'w-14' : 'w-20'}`}>{label}</span>
            <span className="flex-1 min-w-0 break-words">{value}</span>
        </div>
    );
}
