'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Send, Paperclip, AlertCircle } from 'lucide-react';

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
};

export function SendQuotationDialog({
    orderId,
    open,
    onOpenChange,
    token,
    onSent,
}: SendQuotationDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState<{
        to: string;
        subject: string;
        html: string;
        pdfReady: boolean;
        pdfError?: string;
        order_number: string;
    } | null>(null);
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [html, setHtml] = useState('');
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || orderId == null) {
            setDraft(null);
            setLoadError(null);
            return;
        }
        setLoading(true);
        setLoadError(null);
        fetch(`/api/admin/orders/${orderId}/quotation-email-draft`, {
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
            })
            .catch((e) => {
                setLoadError(e instanceof Error ? e.message : '초안 로드 실패');
            })
            .finally(() => setLoading(false));
    }, [open, orderId, token]);

    const handleSend = async () => {
        if (orderId == null) return;
        const trimmedTo = to.trim();
        if (!trimmedTo) return;
        setSending(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/send-quotation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    emailOverride: trimmedTo,
                    subject: subject.trim() || undefined,
                    html: html.trim() || undefined,
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
                            <Label className="text-white/80">본문 (HTML)</Label>
                            <textarea
                                value={html}
                                onChange={(e) => setHtml(e.target.value)}
                                rows={12}
                                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono"
                                placeholder="HTML 본문"
                            />
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
