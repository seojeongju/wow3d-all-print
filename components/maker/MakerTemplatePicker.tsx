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
            <h3 className="font-bold text-[13px] text-white uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-full bg-teal-500/30 text-teal-300 text-[11px] font-black items-center justify-center">1</span>
                배지 · 키캡 템플릿
            </h3>
            <p className="text-[12px] text-white/80 font-bold leading-relaxed break-keep mb-4">
                선택 후 아래에서 크기를 바꿀 수 있습니다. 같은 항목을 다시 누르면 해제됩니다.
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
                            aria-pressed={active}
                            title={active ? '다시 눌러 선택 해제' : `${t.name} 적용`}
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
                                    active ? 'border-teal-400/40 bg-teal-500/20 text-teal-300' : 'border-white/20 bg-white/10 text-white/80'
                                )}>
                                    <Icon className="w-4 h-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[12px] font-black text-white">
                                        {t.name}
                                        {active && (
                                            <span className="ml-1.5 text-teal-300 font-bold">
                                                {t.id === 'badge-circle'
                                                    ? '· 크기 조절 ↓'
                                                    : t.id === 'keycap-1u'
                                                        ? '· 18mm 기준'
                                                        : '· 크기 조절 ↓'}
                                            </span>
                                        )}
                                    </span>
                                    <span className="block text-[11px] text-white/75 font-bold leading-relaxed break-keep mt-0.5">
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
