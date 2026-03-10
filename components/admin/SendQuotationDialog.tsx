'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Paperclip, AlertCircle, FileCode, FileText, Plus, X } from 'lucide-react';

export type QuotationSendResult = {
    success: boolean;
    message?: string;
    emailSent?: boolean;
    sentAt?: string;
};

export type SendQuotationDialogProps = {
    orderId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token: string | null;
    onSent?: (result: QuotationSendResult) => void;
    /** 포함할 품목(order_item id). 없으면 전체 */
    selectedItemIds?: number[];
};

export function SendQuotationDialog({
    orderId,
    open,
    onOpenChange,
    token,
    onSent,
    selectedItemIds,
}: SendQuotationDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState<{
        to: string;
        subject: string;
        html: string;
        text: string;
        pdfReady: boolean;
        pdfError?: string;
        order_number: string;
    } | null>(null);
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [html, setHtml] = useState('');
    const [text, setText] = useState('');
    const [bodyType, setBodyType] = useState<'html' | 'text'>('html');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [extraFiles, setExtraFiles] = useState<{ id: string; file: File }[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!open || orderId == null) {
            setDraft(null);
            setLoadError(null);
            setExtraFiles([]);
            return;
        }
        setLoading(true);
        setLoadError(null);
        const itemIdsParam = selectedItemIds?.length ? `?itemIds=${selectedItemIds.join(',')}` : '';
        fetch(`/api/admin/orders/${orderId}/quotation-email-draft${itemIdsParam}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((res) => {
                if (!res.ok) throw new Error('초안을 불러올 수 없습니다.');
                return res.json();
            })
            .then((data) => {
                setDraft(data);
                setTo(data.to ?? '');
                setSubject(data.subject ?? '');
                setHtml(data.html ?? '');
                setText(data.text ?? '');
            })
            .catch((e) => {
                setLoadError(e instanceof Error ? e.message : '초안 로드 실패');
            })
            .finally(() => setLoading(false));
    }, [open, orderId, token, selectedItemIds?.join(',')]);

    const readFileAsBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => {
                const s = (r.result as string) || '';
                const base64 = s.includes(',') ? s.split(',')[1] : s;
                resolve(base64 || '');
            };
            r.onerror = () => reject(new Error('파일 읽기 실패'));
            r.readAsDataURL(file);
        });

    const handleSend = async () => {
        if (orderId == null) return;
        const trimmedTo = to.trim();
        if (!trimmedTo) return;
        setSending(true);
        try {
            let extraAttachments: { filename: string; content: string }[] = [];
            if (extraFiles.length > 0) {
                extraAttachments = await Promise.all(
                    extraFiles.map(async ({ file }) => ({
                        filename: file.name,
                        content: await readFileAsBase64(file),
                    }))
                );
            }
            const res = await fetch(`/api/admin/orders/${orderId}/send-quotation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    emailOverride: trimmedTo,
                    subject: subject.trim() || undefined,
                    ...(bodyType === 'html' ? { html: html.trim() || undefined } : { text: text.trim() || undefined }),
                    ...(extraAttachments.length > 0 ? { extraAttachments } : {}),
                    ...(selectedItemIds?.length ? { itemIds: selectedItemIds } : {}),
                }),
            });
            const j = await res.json();
            if (j.success) {
                onSent?.({ success: true, message: j.message, emailSent: j.emailSent, sentAt: j.sentAt });
                onOpenChange(false);
            } else {
                toast({ title: j.error || '발송 처리 실패', variant: 'destructive' });
            }
            return j;
        } catch (e) {
            toast({ title: '발송 중 오류가 발생했습니다.', variant: 'destructive' });
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0c0c0c] border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        견적서 이메일 발송
                    </DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                    </div>
                ) : loadError ? (
                    <p className="text-red-400 text-sm py-4">{loadError}</p>
                ) : draft ? (
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label className="text-white/80">수신 이메일</Label>
                            <Input
                                type="email"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                placeholder="customer@example.com"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-white/80">제목</Label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="견적서 제목"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Label className="text-white/80">본문</Label>
                                <div className="flex rounded-md border border-white/10 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setBodyType('html')}
                                        className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${bodyType === 'html' ? 'bg-white/15 text-white' : 'bg-white/5 text-white/60 hover:text-white/80'}`}
                                    >
                                        <FileCode className="w-3.5 h-3.5" /> HTML
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBodyType('text')}
                                        className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${bodyType === 'text' ? 'bg-white/15 text-white' : 'bg-white/5 text-white/60 hover:text-white/80'}`}
                                    >
                                        <FileText className="w-3.5 h-3.5" /> 일반 텍스트
                                    </button>
                                </div>
                            </div>
                            {bodyType === 'html' ? (
                                <textarea
                                    value={html}
                                    onChange={(e) => setHtml(e.target.value)}
                                    rows={12}
                                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono"
                                    placeholder="HTML 본문"
                                />
                            ) : (
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    rows={12}
                                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 resize-y"
                                    placeholder="일반 텍스트 본문"
                                />
                            )}
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
                            {draft.pdfReady ? (
                                <>
                                    <Paperclip className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span className="text-sm text-white/80">견적서 PDF가 메일에 첨부됩니다.</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="text-sm text-white/70">
                                        <span>PDF 첨부 불가</span>
                                        {draft.pdfError && (
                                            <span className="block text-white/50 mt-0.5">{draft.pdfError}</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-white/80">추가 첨부 파일</Label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip"
                                onChange={(e) => {
                                    const list = e.target.files;
                                    if (!list?.length) return;
                                    const add: { id: string; file: File }[] = [];
                                    for (let i = 0; i < list.length; i++) {
                                        const file = list[i];
                                        if (file.size > 8 * 1024 * 1024) continue;
                                        add.push({ id: `${Date.now()}-${i}-${file.name}`, file });
                                    }
                                    setExtraFiles((prev) => [...prev, ...add].slice(0, 5));
                                    e.target.value = '';
                                }}
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-white/20 text-white/80 hover:bg-white/10"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={extraFiles.length >= 5}
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> 파일 첨부 (최대 5개, 8MB 이하)
                                </Button>
                                {extraFiles.length > 0 && (
                                    <ul className="flex flex-wrap gap-2 mt-1">
                                        {extraFiles.map(({ id, file }) => (
                                            <li key={id} className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs text-white/90">
                                                <span className="truncate max-w-[140px]">{file.name}</span>
                                                <button
                                                    type="button"
                                                    className="p-0.5 rounded hover:bg-white/20 text-white/70"
                                                    onClick={() => setExtraFiles((p) => p.filter((x) => x.id !== id))}
                                                    aria-label="제거"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
                {draft && !loadError && (
                    <DialogFooter className="gap-2 sm:gap-0 pt-4">
                        <Button
                            variant="outline"
                            className="border-white/10 text-white"
                            onClick={() => onOpenChange(false)}
                            disabled={sending}
                        >
                            취소
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={handleSend}
                            disabled={sending || !to.trim()}
                        >
                            {sending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            발송
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
