'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

const POLL_MS = 30_000;
const COUNT_UP_MS = 900;

type PublicStats = { members: number; todayQuoteViews: number };

/** 값이 바뀌면 이전 값에서 새 값까지 부드럽게 올라가는 숫자 */
function useCountUp(target: number | null): number | null {
    const [value, setValue] = useState<number | null>(target);
    const fromRef = useRef<number | null>(target);

    useEffect(() => {
        if (target == null) return;
        const from = fromRef.current ?? 0;
        fromRef.current = target;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || from === target) {
            setValue(target);
            return;
        }
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / COUNT_UP_MS);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(from + (target - from) * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target]);

    return value;
}

export default function HeroLiveStats() {
    const t = useTranslations('Home.hero');
    const locale = useLocale();
    const [stats, setStats] = useState<PublicStats | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let alive = true;
        let timer: number | undefined;

        const load = async () => {
            try {
                const res = await fetch('/api/stats/public', { cache: 'no-store' });
                const json = (await res.json()) as { success?: boolean; data?: PublicStats };
                if (!alive) return;
                if (json.success && json.data) {
                    setStats({ members: json.data.members, todayQuoteViews: json.data.todayQuoteViews });
                    setFailed(false);
                } else {
                    setFailed(true);
                }
            } catch {
                if (alive) setFailed(true);
            }
        };

        const schedule = () => {
            window.clearInterval(timer);
            timer = window.setInterval(() => {
                if (document.visibilityState === 'visible') void load();
            }, POLL_MS);
        };

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                void load();
                schedule();
            }
        };

        void load();
        schedule();
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            alive = false;
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    const members = useCountUp(stats?.members ?? null);
    const quotes = useCountUp(stats?.todayQuoteViews ?? null);
    const fmt = (n: number | null) => (n == null ? '—' : n.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US'));
    const highlight = (chunks: ReactNode) => <span className="tabular-nums text-teal-300">{chunks}</span>;

    if (failed && !stats) {
        return <p className="text-sm font-bold text-white/90">{t('customers')}</p>;
    }

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-bold text-white/90" aria-live="polite">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300/90">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {t('statsLive')}
            </span>
            <span className="break-keep">{t.rich('statsMembers', { count: fmt(members), num: highlight })}</span>
            <span className="text-white/25" aria-hidden>
                ·
            </span>
            <span className="break-keep">{t.rich('statsTodayQuotes', { count: fmt(quotes), num: highlight })}</span>
        </div>
    );
}
