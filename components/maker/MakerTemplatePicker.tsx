'use client';

import { useTranslations } from 'next-intl';
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
    const t = useTranslations('Maker');

    return (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-[13px] text-white uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-full bg-teal-500/30 text-teal-300 text-[11px] font-black items-center justify-center">1</span>
                {t('templateTitle')}
            </h3>
            <p className="text-[12px] text-white/80 font-bold leading-relaxed break-keep mb-4">
                {t('templateHint')}
            </p>
            <div className="grid grid-cols-1 gap-2">
                {MAKER_TEMPLATES.map((tmpl) => {
                    const Icon = ICONS[tmpl.id];
                    const active = activeId === tmpl.id;
                    return (
                        <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => onApply(tmpl.id)}
                            aria-pressed={active}
                            title={active ? t('templateToggleOff') : t('templateApply', { name: tmpl.name })}
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
                                        {tmpl.name}
                                        {active && (
                                            <span className="ml-1.5 text-teal-300 font-bold">
                                                {tmpl.id === 'keycap-1u'
                                                    ? t('templateKeycapBase')
                                                    : t('templateSizeAdjust')}
                                            </span>
                                        )}
                                    </span>
                                    <span className="block text-[11px] text-white/75 font-bold leading-relaxed break-keep mt-0.5">
                                        {tmpl.description}
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
