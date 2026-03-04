'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Building2, Phone, MapPin, CreditCard, Image as ImageIcon,
    FileText, Save, Loader2, Upload, X, CheckCircle2, Landmark
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';

type CompanyInfo = {
    business_number: string;
    company_name: string;
    representative: string;
    business_type: string;
    business_item: string;
    address: string;
    phone: string;
    fax: string;
    email: string;
    website: string;
    logo_url: string;
    estimate_header_note: string;
    estimate_footer_note: string;
    estimate_valid_days: number;
    bank_name: string;
    bank_account: string;
    bank_holder: string;
};

const EMPTY: CompanyInfo = {
    business_number: '', company_name: '', representative: '',
    business_type: '', business_item: '', address: '', phone: '',
    fax: '', email: '', website: '', logo_url: '',
    estimate_header_note: '', estimate_footer_note: '',
    estimate_valid_days: 14, bank_name: '', bank_account: '', bank_holder: '',
};

export default function CompanyInfoPage() {
    const { toast } = useToast();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [info, setInfo] = useState<CompanyInfo>(EMPTY);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [logoUploading, setLogoUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const load = async () => {
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            try {
                const res = await fetch('/api/admin/company', { headers });
                const json = await res.json();
                if (json.success && json.data) {
                    setInfo({ ...EMPTY, ...json.data });
                    if (json.data.logo_url) setLogoPreview(json.data.logo_url);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token]);

    const set = (field: keyof CompanyInfo, value: string | number) => {
        setInfo(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const res = await fetch('/api/admin/company', {
                method: 'POST',
                headers,
                body: JSON.stringify({ ...info, logo_url: logoPreview || info.logo_url }),
            });
            const json = await res.json();
            if (json.success) {
                setSaved(true);
                toast({ title: '✅ 회사 정보가 저장되었습니다.' });
                setTimeout(() => setSaved(false), 3000);
            } else {
                toast({ title: '저장 실패', description: json.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: '오류 발생', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // 로고 파일 선택 → base64 preview (R2 업로드는 별도 구현 또는 URL 직접 입력)
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setLogoPreview(ev.target?.result as string);
            setSaved(false);
        };
        reader.readAsDataURL(file);
    };

    if (loading) return (
        <div className="flex justify-center items-center p-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Building2 className="w-7 h-7 text-primary" />
                        회사 정보 관리
                    </h1>
                    <p className="text-white/50 text-sm mt-1">
                        등록된 정보는 견적서 발행 시 자동으로 반영됩니다.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className={saved ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : 'bg-primary hover:bg-primary/90 text-black font-bold'}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                        saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> :
                            <Save className="w-4 h-4 mr-2" />}
                    {saved ? '저장 완료' : '저장하기'}
                </Button>
            </div>

            <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="basic" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Building2 className="w-3.5 h-3.5 mr-2" />사업자 정보
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Phone className="w-3.5 h-3.5 mr-2" />연락처/주소
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Landmark className="w-3.5 h-3.5 mr-2" />계좌 정보
                    </TabsTrigger>
                    <TabsTrigger value="estimate" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <FileText className="w-3.5 h-3.5 mr-2" />견적서 설정
                    </TabsTrigger>
                    <TabsTrigger value="logo" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <ImageIcon className="w-3.5 h-3.5 mr-2" />로고
                    </TabsTrigger>
                </TabsList>

                {/* 사업자 정보 */}
                <TabsContent value="basic">
                    <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">사업자 등록 정보</CardTitle>
                            <CardDescription className="text-white/40">사업자등록증에 기재된 정보를 입력해주세요.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label="사업자등록번호" placeholder="000-00-00000" value={info.business_number}
                                    onChange={v => set('business_number', v)} />
                                <Field label="상호(법인명)" placeholder="와우쓰리디(Wow3D)" value={info.company_name}
                                    onChange={v => set('company_name', v)} />
                                <Field label="대표자명" placeholder="홍길동" value={info.representative}
                                    onChange={v => set('representative', v)} />
                                <Field label="업태" placeholder="제조업" value={info.business_type}
                                    onChange={v => set('business_type', v)} />
                                <Field label="종목" placeholder="3D프린팅" value={info.business_item}
                                    onChange={v => set('business_item', v)} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 연락처/주소 */}
                <TabsContent value="contact">
                    <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">연락처 및 주소</CardTitle>
                            <CardDescription className="text-white/40">견적서에 표시될 회사 연락처 정보입니다.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label="대표 전화" placeholder="02-0000-0000" value={info.phone}
                                    onChange={v => set('phone', v)} icon={<Phone className="w-4 h-4" />} />
                                <Field label="팩스" placeholder="02-0000-0001" value={info.fax}
                                    onChange={v => set('fax', v)} />
                                <Field label="이메일" placeholder="info@company.com" value={info.email}
                                    onChange={v => set('email', v)} type="email" />
                                <Field label="웹사이트" placeholder="https://www.company.com" value={info.website}
                                    onChange={v => set('website', v)} type="url" />
                            </div>
                            <div>
                                <Label className="text-white/70 text-sm mb-2 block">
                                    <MapPin className="w-4 h-4 inline mr-1" />사업장 주소
                                </Label>
                                <Input
                                    value={info.address}
                                    onChange={e => set('address', e.target.value)}
                                    placeholder="서울시 금천구 가산디지털1로 1, 101호"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 계좌 정보 */}
                <TabsContent value="bank">
                    <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">계좌 정보</CardTitle>
                            <CardDescription className="text-white/40">견적서 하단 또는 입금 안내에 사용됩니다.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <Field label="은행명" placeholder="국민은행" value={info.bank_name}
                                    onChange={v => set('bank_name', v)} />
                                <Field label="계좌번호" placeholder="000-0000-0000-00" value={info.bank_account}
                                    onChange={v => set('bank_account', v)} />
                                <Field label="예금주" placeholder="와우쓰리디" value={info.bank_holder}
                                    onChange={v => set('bank_holder', v)} />
                            </div>
                            {(info.bank_name || info.bank_account) && (
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-white/70">
                                    <span className="text-primary font-bold">입금 계좌 안내:</span>{' '}
                                    {info.bank_name} {info.bank_account} ({info.bank_holder})
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 견적서 설정 */}
                <TabsContent value="estimate">
                    <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">견적서 설정</CardTitle>
                            <CardDescription className="text-white/40">견적서 발행 시 자동으로 포함되는 내용을 설정합니다.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-white/70 text-sm mb-2 block">견적 유효기간 (일)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={info.estimate_valid_days}
                                    onChange={e => set('estimate_valid_days', Number(e.target.value))}
                                    className="bg-white/5 border-white/10 text-white w-32"
                                />
                                <p className="text-xs text-white/30 mt-1">견적서 상에 "본 견적의 유효기간은 {info.estimate_valid_days}일입니다." 문구로 표시됩니다.</p>
                            </div>

                            <div>
                                <Label className="text-white/70 text-sm mb-2 block">견적서 상단 추가 문구</Label>
                                <textarea
                                    value={info.estimate_header_note}
                                    onChange={e => set('estimate_header_note', e.target.value)}
                                    rows={3}
                                    placeholder="예: 견적서에 대한 문의는 담당자에게 연락 부탁드립니다."
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 resize-y focus:outline-none focus:border-primary/50"
                                />
                            </div>

                            <div>
                                <Label className="text-white/70 text-sm mb-2 block">견적서 하단 특이사항 (추가 문구)</Label>
                                <textarea
                                    value={info.estimate_footer_note}
                                    onChange={e => set('estimate_footer_note', e.target.value)}
                                    rows={5}
                                    placeholder={"예:\n- 납기는 발주 후 협의에 따라 결정됩니다.\n- 부가세는 별도입니다.\n- 입금 확인 후 제작을 시작합니다."}
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 resize-y focus:outline-none focus:border-primary/50"
                                />
                                <p className="text-xs text-white/30 mt-1">각 줄이 견적서 특이사항 목록에 추가됩니다.</p>
                            </div>

                            {/* 미리보기 */}
                            <div className="p-4 rounded-xl bg-black/20 border border-white/10 text-xs text-white/50 space-y-2">
                                <div className="text-white/40 font-bold uppercase tracking-wider text-[10px] mb-3">견적서 미리보기</div>
                                {info.estimate_header_note && (
                                    <div className="text-white/70 italic">"{info.estimate_header_note}"</div>
                                )}
                                <div className="text-white/40">... 견적 내용 ...</div>
                                <div className="text-white/60 font-bold">특이사항</div>
                                <ul className="list-disc list-inside space-y-1">
                                    {info.estimate_footer_note
                                        ? info.estimate_footer_note.split('\n').filter(Boolean).map((line, i) => (
                                            <li key={i}>{line}</li>
                                        ))
                                        : (
                                            <>
                                                <li>본 견적의 유효기간은 {info.estimate_valid_days || 14}일입니다.</li>
                                                <li>제작 사양 변경 시 견적 금액이 변동될 수 있습니다.</li>
                                            </>
                                        )
                                    }
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 로고 */}
                <TabsContent value="logo">
                    <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">회사 로고</CardTitle>
                            <CardDescription className="text-white/40">견적서 상단에 표시될 회사 로고를 등록합니다. (PNG, JPG, SVG 권장)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* 로고 미리보기 */}
                            <div className="flex items-start gap-6">
                                <div className="w-40 h-40 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="회사 로고" className="w-full h-full object-contain p-3" />
                                    ) : (
                                        <div className="text-center text-white/20">
                                            <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                                            <span className="text-xs">로고 없음</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <Label className="text-white/70 text-sm mb-2 block">파일 업로드</Label>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                className="border-white/10 text-white hover:bg-white/10"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                파일 선택
                                            </Button>
                                            {logoPreview && (
                                                <Button
                                                    variant="ghost"
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    onClick={() => { setLogoPreview(''); set('logo_url', ''); }}
                                                >
                                                    <X className="w-4 h-4 mr-1" />제거
                                                </Button>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleLogoChange}
                                        />
                                        <p className="text-xs text-white/30 mt-2">최대 2MB. PNG, JPG, SVG, WEBP 지원</p>
                                    </div>
                                    <div>
                                        <Label className="text-white/70 text-sm mb-2 block">또는 URL 직접 입력</Label>
                                        <Input
                                            value={info.logo_url}
                                            onChange={e => { set('logo_url', e.target.value); setLogoPreview(e.target.value); }}
                                            placeholder="https://example.com/logo.png"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 견적서 내 로고 미리보기 */}
                            {logoPreview && (
                                <div className="border border-white/10 rounded-xl overflow-hidden">
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider px-4 py-2 bg-white/5 border-b border-white/10">
                                        견적서 상단 미리보기
                                    </div>
                                    <div className="bg-white p-6 flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <img src={logoPreview} alt="logo" className="h-12 object-contain" />
                                            <div className="text-black">
                                                <div className="text-xl font-bold font-serif tracking-widest">견 적 서</div>
                                                <div className="text-xs text-slate-500 mt-1">{info.company_name || '회사명'}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 text-right">
                                            <div>견적번호 : WOW260304XXXXXX</div>
                                            <div>견적일자 : {new Date().toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* 저장 버튼 (하단 고정) */}
            <div className="flex justify-end pt-4 border-t border-white/10">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="lg"
                    className={saved ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : 'bg-primary hover:bg-primary/90 text-black font-bold'}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                        saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> :
                            <Save className="w-4 h-4 mr-2" />}
                    {saved ? '저장 완료' : '저장하기'}
                </Button>
            </div>
        </div>
    );
}

// 공통 Input 필드 컴포넌트
function Field({
    label, value, onChange, placeholder, type = 'text', icon
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div>
            <Label className="text-white/70 text-sm mb-2 block">
                {icon && <span className="inline mr-1 align-middle">{icon}</span>}
                {label}
            </Label>
            <Input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
        </div>
    );
}
