'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, Plus, Pencil, Trash2, Mail, Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type EmailTemplate = {
    id: number | string;
    name: string;
    subject: string;
    html_content: string | null;
    text_content: string | null;
    created_at: string;
    updated_at: string;
    template_key?: string | null;
    is_system?: number | boolean | null;
};

export default function EmailTemplatesPage() {
    const { toast } = useToast();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        html_content: '',
        text_content: '',
    });
    const [saving, setSaving] = useState(false);



    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/email-templates', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.success) {
                setTemplates(data.data);
            } else {
                toast({ title: data.error || '조회 실패', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: '템플릿 목록 조회 중 오류가 발생했습니다.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleOpenDialog = (template?: EmailTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                subject: template.subject,
                html_content: template.html_content || '',
                text_content: template.text_content || '',
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                subject: '[{{주문번호}}] WOW3D 견적서가 준비되었습니다',
                html_content: '<p>안녕하세요, WOW3D입니다.</p>\\n<p>요청하신 <strong>견적서</strong>가 준비되었습니다.</p>\\n<div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">\\n  <p style="margin:0 0 8px 0;"><strong>주문번호</strong> {{주문번호}}</p>\\n  <p style="margin:0;"><strong>견적 합계</strong> {{견적합계}}</p>\\n</div>\\n<p><strong>견적서 보기:</strong> <a href="{{견적서링크}}">{{견적서링크}}</a></p>\\n<p>위 링크에서 상세 견적 내용을 확인하실 수 있습니다. 확인 후 결제 또는 문의 부탁드립니다.</p>\\n<p>감사합니다.<br/>WOW3D</p>',
                text_content: '안녕하세요, WOW3D입니다.\\n\\n요청하신 견적서가 준비되었습니다.\\n\\n주문번호: {{주문번호}}\\n견적 합계: {{견적합계}}\\n\\n견적서 보기: {{견적서링크}}\\n\\n위 링크에서 상세 견적 내용을 확인하실 수 있습니다. 확인 후 결제 또는 문의 부탁드립니다.\\n\\n감사합니다.\\nWOW3D',
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.subject.trim()) {
            toast({ title: '템플릿 이름과 제목을 입력해 주세요.', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            const url = editingTemplate
                ? `/api/admin/email-templates/${editingTemplate.id}`
                : '/api/admin/email-templates';
            const method = editingTemplate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (data.success) {
                toast({ title: editingTemplate ? '수정되었습니다.' : '저장되었습니다.' });
                setIsDialogOpen(false);
                fetchTemplates();
            } else {
                toast({ title: data.error || '저장 실패', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: '저장 중 오류가 발생했습니다.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        try {
            const res = await fetch(`/api/admin/email-templates/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: '삭제되었습니다.' });
                fetchTemplates();
            } else {
                toast({ title: data.error || '삭제 실패', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: '삭제 중 오류가 발생했습니다.', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">이메일 템플릿 관리</h1>
                    <p className="text-white/70 text-sm mt-1">이메일 발송 시 사용할 자주 쓰는 문구와 양식을 관리합니다.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    새 템플릿 추가
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : templates.length === 0 ? (
                <Card className="bg-white/[0.03] border-white/10 p-12 flex flex-col items-center justify-center text-center">
                    <Mail className="w-12 h-12 text-white/20 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">등록된 템플릿이 없습니다</h3>
                    <p className="text-sm text-white/50 mb-6 max-w-sm">견적서 발송 시 매번 똑같은 문구를 입력하지 않도록 이메일 템플릿을 만들어보세요.</p>
                    <Button onClick={() => handleOpenDialog()} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <Plus className="w-4 h-4 mr-2" />
                        첫 템플릿 만들기
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {templates.map((template) => (
                        <Card key={template.id} className="bg-white/[0.03] border-white/10 overflow-hidden flex flex-col">
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-white flex-1 pr-4">{template.name}</h3>
                                    <div className="flex gap-2 shrink-0">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)} className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        {template.template_key ? (
                                            <div className="h-8 px-2 inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                기본
                                            </div>
                                        ) : (
                                            <Button variant="ghost" size="icon" onClick={() => { if(window.confirm('이 템플릿을 정말 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.')) handleDelete(template.id); }} className="h-8 w-8 text-red-400/50 hover:text-red-400 hover:bg-red-400/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm flex-1">
                                    <div>
                                        <span className="text-[10px] font-bold text-white/40 uppercase mb-1 block">이메일 제목</span>
                                        <p className="text-white/90 bg-black/20 p-2 rounded border border-white/5 truncate">{template.subject}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-white/40 uppercase mb-1 block">텍스트 본문 미리보기</span>
                                        <p className="text-white/60 bg-black/20 p-3 rounded border border-white/5 line-clamp-4 whitespace-pre-wrap text-xs">
                                            {template.text_content || '내용 없음'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30">
                                    <span>업데이트: {new Date(template.updated_at).toLocaleDateString('ko-KR')}</span>
                                    {template.html_content && <span>HTML 지원</span>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-white">{editingTemplate ? '템플릿 수정' : '새 템플릿 추가'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
                        <div className="grid gap-2">
                            <Label className="text-white/80">템플릿 이름 <span className="text-red-400">*</span></Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="예: [기본] 견적서 발송용"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-white/80">이메일 제목 <span className="text-red-400">*</span></Label>
                            <Input
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="이메일 제목을 입력하세요"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-200/80">
                                <p className="font-semibold text-blue-300 mb-1">사용 가능한 자동 변환 변수</p>
                                <p className="mb-2 text-xs">제목이나 본문에 아래 코드를 입력하면 발송 시 실제 데이터로 자동 치환됩니다.</p>
                                <ul className="space-y-1 text-xs font-mono bg-black/20 p-2 rounded text-blue-300">
                                    <li>{'{{주문번호}}'} - 발송하는 주문의 주문번호 (예: WOW12345)</li>
                                    <li>{'{{견적합계}}'} - 견적서의 총 합계 금액 (예: ₩50,000)</li>
                                    <li>{'{{견적서링크}}'} - 고객용 견적서 페이지 링크</li>
                                </ul>
                            </div>
                        </div>

                        <Tabs defaultValue="html" className="w-full">
                            <TabsList className="bg-white/5 border border-white/10">
                                <TabsTrigger value="html" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">HTML 양식</TabsTrigger>
                                <TabsTrigger value="text" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">일반 텍스트 양식</TabsTrigger>
                            </TabsList>
                            <TabsContent value="html" className="mt-4 space-y-2">
                                <Label className="text-white/80 text-xs">HTML 소스 코드를 입력하세요. (HTML을 지원하는 이메일 클라이언트에서 보여집니다)</Label>
                                <textarea
                                    value={formData.html_content}
                                    onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                                    className="w-full rounded-md px-3 py-2 min-h-[300px] font-mono text-xs bg-black/40 border-white/10 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border"
                                    placeholder="<p>내용을 입력하세요</p>"
                                />
                            </TabsContent>
                            <TabsContent value="text" className="mt-4 space-y-2">
                                <Label className="text-white/80 text-xs">일반 텍스트를 입력하세요. (HTML을 지원하지 않는 경우 보여집니다)</Label>
                                <textarea
                                    value={formData.text_content}
                                    onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                                    className="w-full rounded-md px-3 py-2 min-h-[300px] bg-white/5 border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30 border"
                                    placeholder="내용을 입력하세요"
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="mt-4 border-t border-white/5 pt-4">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-white/10 hover:text-white text-white/70">
                            취소
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            저장하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </div>
    );
}
