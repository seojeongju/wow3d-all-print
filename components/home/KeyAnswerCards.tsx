'use client';

import { useId, useState, type ReactNode } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type KeyAnswerCard = {
    href: string;
    icon: ReactNode;
    question: string;
    /** 한눈에 보는 인포그래픽 (항상 표시) */
    graphic: ReactNode;
    answer: string;
    /** Speakable 대상(#aeo-key-answer)으로 쓸 답변 */
    speakable?: boolean;
};

/**
 * 홈 핵심 답변 카드 — 기본은 질문 + 인포그래픽만, 누르면 전체 답변이 아래로 슬라이드되어 열림.
 * 답변 문장은 접혀 있어도 DOM에 남겨 검색·AI가 읽고, FAQPage 스키마와 화면 문구가 일치한다.
 */
export default function KeyAnswerCards({
    cards,
    showLabel,
    hideLabel,
    moreLabel,
}: {
    cards: KeyAnswerCard[];
    showLabel: string;
    hideLabel: string;
    moreLabel: string;
}) {
    const [open, setOpen] = useState<number | null>(null);
    const baseId = useId();

    return (
        // 모바일: 옆으로 넘기는 슬라이드(스냅), 데스크톱: 3열 — items-start로 펼친 카드만 길어짐
        <div className="-mx-4 mt-5 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
            {cards.map((card, i) => {
                const isOpen = open === i;
                const panelId = `${baseId}-panel-${i}`;
                return (
                    <article
                        key={card.href}
                        className={cn(
                            'w-[86%] shrink-0 snap-start rounded-2xl border bg-white/[0.03] transition-colors sm:w-[60%] lg:w-auto',
                            isOpen ? 'border-teal-400/40 bg-teal-400/[0.05]' : 'border-white/10 hover:border-teal-400/25'
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : i)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            className="w-full rounded-2xl p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                        >
                            <div className="flex items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                                    {card.icon}
                                </span>
                                <h3 className="flex-1 pt-1.5 text-sm font-bold leading-snug text-white break-keep">{card.question}</h3>
                            </div>
                            <div className="mt-3">{card.graphic}</div>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-300">
                                {isOpen ? hideLabel : showLabel}
                                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', isOpen && 'rotate-180')} aria-hidden />
                            </span>
                        </button>

                        {/* 슬라이드 패널 — grid-rows 0fr↔1fr 전환 */}
                        <div
                            id={panelId}
                            role="region"
                            className={cn(
                                'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
                                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                            )}
                        >
                            <div className="overflow-hidden">
                                <div className={cn('px-4 pb-4 transition-opacity duration-300', isOpen ? 'opacity-100' : 'opacity-0')}>
                                    <p
                                        id={card.speakable ? 'aeo-key-answer' : undefined}
                                        className="border-t border-white/10 pt-3 text-sm leading-relaxed text-white/70 break-keep"
                                    >
                                        {card.answer}
                                    </p>
                                    <Link
                                        href={card.href}
                                        tabIndex={isOpen ? undefined : -1}
                                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-300 hover:text-teal-200"
                                    >
                                        {moreLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
