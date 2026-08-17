'use client';

import { Circle, Square, Keyboard } from 'lucide-react';
import { MAKER_TEMPLATES, type MakerTemplateId } from '@/lib/maker-templates';
import { cn } from '@/lib/utils';

const ICONS: Record<MakerTemplateId, typeof Circle> = {
    'badge-circle': Circle,
    'badge-rect': Square,
    'keycap-1u': Keyboard,
};

type Props = {
    activeId: MakerTemplateId | null;
    onApply: (id: MakerTemplateId) => void;
};

export function MakerTemplatePicker({ activeId, onApply }: Props) {
    return (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-[13px] text-white uppercase tracking-[0.15em] mb-2">
                배지 · 키캡 템플릿
            </h3>
            <p className="text-[11px] text-white/50 font-bold leading-relaxed break-keep mb-4">
                판 크기·레이어 높이·모따기를 한 번에 맞춥니다. 로고는 그대로 두고 판형만 바꿉니다.
            </p>
            <div className="grid grid-cols-1 gap-2">
                {MAKER_TEMPLATES.map((t) => {
                    const Icon = ICONS[t.id];
                    const active = activeId === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => onApply(t.id)}
                            className={cn(
                                'text-left rounded-xl border px-3 py-2.5 transition-all',
                                active
                                    ? 'border-teal-400/70 bg-teal-500/15'
                                    : 'border-white/10 bg-black/20 hover:border-white/25 hover:bg-white/5'
                            )}
                        >
                            <div className="flex items-start gap-2.5">
                                <span className={cn(
                                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                                    active ? 'border-teal-400/40 bg-teal-500/20 text-teal-300' : 'border-white/10 bg-white/5 text-white/55'
                                )}>
                                    <Icon className="w-4 h-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[12px] font-black text-white">{t.name}</span>
                                    <span className="block text-[10px] text-white/45 font-bold leading-relaxed break-keep mt-0.5">
                                        {t.description}
                                    </span>
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
