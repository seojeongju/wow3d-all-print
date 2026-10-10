'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Calculator, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const POLL_MS = 10_000;
const ROLL_MS = 1100;

type PublicStats = { members: number; todayQuoteViews: number };

/** 0~9를 세 번 이어 붙인 띠 — 가운데 구간(10~19)을 기준으로 앞뒤로 굴린다 */
const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);

/**
 * 자릿수 하나 — 주행거리계처럼 값이 늘면 항상 아래로(8→9→0) 굴러간다.
 * 굴러간 뒤 가운데 구간으로 애니메이션 없이 되돌려 다음 변화에 대비한다.
 */
function RollingDigit({
    digit,
    direction,
    delayMs,
    reduce,
}: {
    digit: number;
    direction: 1 | -1;
    delayMs: number;
    reduce: boolean;
}) {
    const [pos, setPos] = useState(10);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setPos((p) => {
            const cur = ((p % 10) + 10) % 10;
            if (cur === digit) return p;
            const step = direction === 1 ? (digit - cur + 10) % 10 : -((cur - digit + 10) % 10);
            return p + step;
        });
        setAnimate(!reduce);
    }, [digit, direction, reduce]);

    const settle = () => {
        if (pos >= 10 && pos <= 19) return;
        setAnimate(false);
        setPos(10 + (((pos % 10) + 10) % 10));
    };

    return (
        <span className="relative inline-block overflow-hidden align-bottom leading-none">
            <span className="invisible">0</span>
            <span
                className="absolute inset-x-0 top-0 flex flex-col"
                onTransitionEnd={settle}
                style={{
                    transform: `translateY(-${(pos / STRIP.length) * 100}%)`,
                    transition: animate ? `transform ${ROLL_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms` : 'none',
                }}
            >
                {STRIP.map((n, i) => (
                    <span key={i} className="leading-none">
                        {n}
                    </span>
                ))}
            </span>
        </span>
    );
}

/** 처음엔 0에서 굴러 올라가고, 값이 바뀌면 바뀐 자리만 굴러간다 */
function RollingNumber({ value, locale }: { value: number; locale: string }) {
    const reduce = useReducedMotion() ?? false;
    const [shown, setShown] = useState<number | null>(reduce ? value : null);
    // 자릿수가 바뀌는 같은 렌더에서 방향도 알아야 하므로 렌더 중에 갱신한다
    const [tracked, setTracked] = useState<{ value: number; direction: 1 | -1 }>({ value, direction: 1 });
    if (tracked.value !== value) {
        setTracked({ value, direction: value < tracked.value ? -1 : 1 });
    }
    const direction = tracked.direction;

    useEffect(() => {
        if (reduce) {
            setShown(value);
            return;
        }
        const raf = requestAnimationFrame(() => setShown(value));
        return () => cancelAnimationFrame(raf);
    }, [value, reduce]);

    const text = value.toLocaleString(locale);
    const chars = text.split('');
    return (
        <span className="inline-flex tabular-nums" aria-label={text}>
            {chars.map((ch, i) => {
                const fromRight = chars.length - i;
                if (!/\d/.test(ch)) {
                    return (
                        <span key={`s${fromRight}`} aria-hidden>
                            {ch}
                        </span>
                    );
                }
                const digit = shown == null ? 0 : Number(ch);
                return (
                    <RollingDigit
                        key={`d${fromRight}`}
                        digit={digit}
                        direction={direction}
                        delayMs={(fromRight - 1) * 70}
                        reduce={reduce}
                    />
                );
            })}
        </span>
    );
}

function StatCard({
    icon,
    label,
    value,
    renderValue,
}: {
    icon: ReactNode;
    label: string;
    value: number | null;
    renderValue: (num: ReactNode) => ReactNode;
}) {
    const locale = useLocale();
    const reduce = useReducedMotion() ?? false;
    const prevRef = useRef<number | null>(null);
    const bumpTimerRef = useRef<number | undefined>(undefined);
    const [bump, setBump] = useState<{ id: number; delta: number } | null>(null);

    useEffect(() => {
        if (value == null) return;
        const prev = prevRef.current;
        prevRef.current = value;
        if (prev == null || value <= prev) return;
        setBump({ id: Date.now(), delta: value - prev });
        window.clearTimeout(bumpTimerRef.current);
        bumpTimerRef.current = window.setTimeout(() => setBump(null), 2200);
    }, [value]);

    useEffect(() => () => window.clearTimeout(bumpTimerRef.current), []);

    const fmtLocale = locale === 'ko' ? 'ko-KR' : 'en-US';

    return (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-3.5 py-3 lg:py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <AnimatePresence>
                {bump && !reduce ? (
                    <motion.span
                        key={`glow-${bump.id}`}
                        className="pointer-events-none absolute inset-0 rounded-xl border border-teal-300/60 bg-teal-400/[0.12]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                    />
                ) : null}
            </AnimatePresence>

            <div className="relative flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-teal-400/20 bg-teal-400/10 text-teal-300">
                    {icon}
                </span>
                <span className="truncate text-[11px] font-semibold text-white/55">{label}</span>
            </div>

            <div className="relative mt-2 flex items-end gap-1 text-2xl font-extrabold leading-none text-white sm:text-[26px]">
                {value == null ? (
                    <span className="inline-block h-[1em] w-16 animate-pulse rounded-md bg-white/10" aria-hidden />
                ) : (
                    renderValue(<RollingNumber value={value} locale={fmtLocale} />)
                )}
            </div>

            <AnimatePresence>
                {bump && !reduce ? (
                    <motion.span
                        key={`delta-${bump.id}`}
                        className="pointer-events-none absolute right-3 top-2.5 rounded-full border border-emerald-400/40 bg-emerald-400/20 px-2 py-0.5 text-[11px] font-extrabold text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.35)]"
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: [0, 1, 1, 0], y: [8, 0, -4, -14], scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }}
                    >
                        +{bump.delta.toLocaleString(fmtLocale)}
                    </motion.span>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

export default function HeroLiveStats() {
    const t = useTranslations('Home.hero');
    const [stats, setStats] = useState<PublicStats | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let alive = true;
        let timer: number | undefined;
        let inFlight = false;

        const load = async () => {
            if (inFlight) return;
            inFlight = true;
            try {
                const res = await fetch('/api/stats/public', { cache: 'no-store' });
                const json = (await res.json()) as { success?: boolean; data?: PublicStats };
                if (!alive) return;
                if (json.success && json.data) {
                    const { members, todayQuoteViews } = json.data;
                    // 값이 실제로 달라졌을 때만 갱신해 애니메이션이 불필요하게 돌지 않게 한다
                    setStats((prev) =>
                        prev && prev.members === members && prev.todayQuoteViews === todayQuoteViews
                            ? prev
                            : { members, todayQuoteViews }
                    );
                    setFailed(false);
                } else {
                    setFailed(true);
                }
            } catch {
                if (alive) setFailed(true);
            } finally {
                inFlight = false;
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

    if (failed && !stats) {
        return <p className="text-sm font-bold text-white/90">{t('customers')}</p>;
    }

    const unit = (chunks: ReactNode) => (
        <span className="pb-0.5 text-xs font-bold text-white/50">{chunks}</span>
    );

    return (
        <div aria-live="polite">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300/90">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {t('statsLive')}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <StatCard
                    icon={<Users className="h-3.5 w-3.5" aria-hidden />}
                    label={t('statsMembersLabel')}
                    value={stats?.members ?? null}
                    renderValue={(num) => t.rich('statsMembersValue', { num: () => num, unit })}
                />
                <StatCard
                    icon={<Calculator className="h-3.5 w-3.5" aria-hidden />}
                    label={t('statsTodayQuotesLabel')}
                    value={stats?.todayQuoteViews ?? null}
                    renderValue={(num) => t.rich('statsTodayQuotesValue', { num: () => num, unit })}
                />
            </div>
        </div>
    );
}
