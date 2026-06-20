'use client';

import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatActionTone = 'default' | 'warning' | 'success' | 'accent' | 'muted';

export type StatAction = {
    label: string;
    href?: string;
    ariaLabel?: string;
    tone?: StatActionTone;
};

type DashboardStatCardProps = {
    title: string;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    value: React.ReactNode;
    valueClassName?: string;
    primary: StatAction;
    secondary?: StatAction;
};

const toneClasses: Record<StatActionTone, string> = {
    default: 'text-white/50 hover:text-white/80',
    warning: 'text-amber-400/90 hover:text-amber-300',
    success: 'text-emerald-400/90 hover:text-emerald-300',
    accent: 'text-cyan-400/90 hover:text-cyan-300',
    muted: 'text-white/30',
};

const secondaryButtonTone: Record<StatActionTone, string> = {
    default: 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 text-white/70',
    warning: 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-200',
    success: 'border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-200',
    accent: 'border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-200',
    muted: 'border-white/5 bg-white/[0.02] text-white/35 cursor-default',
};

function ActionLink({
    action,
    variant,
    className,
}: {
    action: StatAction;
    variant: 'primary' | 'secondary';
    className?: string;
}) {
    const tone = action.tone ?? 'default';
    const content =
        variant === 'primary' ? (
            <span className={cn('text-[10px] font-bold tracking-wide', toneClasses[tone], className)}>
                {action.label}
            </span>
        ) : (
            <span
                className={cn(
                    'flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg border text-[10px] font-bold transition-all',
                    secondaryButtonTone[tone],
                    action.href && tone !== 'muted' && 'group/sec cursor-pointer',
                    className
                )}
            >
                <span>{action.label}</span>
                {action.href && tone !== 'muted' && (
                    <ChevronRight className="w-3 h-3 opacity-40 group-hover/sec:opacity-100 group-hover/sec:translate-x-0.5 transition-all shrink-0" />
                )}
            </span>
        );

    if (!action.href || tone === 'muted') {
        return variant === 'secondary' ? (
            <div aria-label={action.ariaLabel}>{content}</div>
        ) : (
            <div className={className}>{content}</div>
        );
    }

    return (
        <Link
            href={action.href}
            aria-label={action.ariaLabel ?? action.label}
            className={cn(
                variant === 'primary' && 'inline-flex items-center gap-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                variant === 'secondary' && 'block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]',
                className
            )}
        >
            {content}
            {variant === 'primary' && (
                <ChevronRight className="w-3 h-3 opacity-0 group-hover/pri:opacity-60 transition-opacity" />
            )}
        </Link>
    );
}

export default function DashboardStatCard({
    title,
    icon: Icon,
    iconColor,
    iconBg,
    value,
    valueClassName,
    primary,
    secondary,
}: DashboardStatCardProps) {
    const primaryClickable = Boolean(primary.href);

    const valueBlock = (
        <div
            className={cn(
                'text-xl font-black text-white transition-colors',
                primaryClickable && 'group-hover/pri:text-primary/90',
                valueClassName
            )}
        >
            {value}
        </div>
    );

    return (
        <Card className="bg-[#0f0f0f] border-white/5 h-full flex flex-col overflow-hidden relative group/card">
            <div
                className={cn(
                    'absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 rounded-full -mr-4 -mt-4 transition-opacity',
                    iconBg,
                    primaryClickable && 'group-hover/card:opacity-40'
                )}
            />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{title}</CardTitle>
                <div className={cn('p-1.5 rounded-lg', iconBg, iconColor)}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 gap-3 relative z-10 pt-0">
                {primaryClickable ? (
                    <Link
                        href={primary.href!}
                        aria-label={primary.ariaLabel ?? primary.label}
                        className="group/pri block rounded-lg -mx-1 px-1 py-0.5 hover:bg-white/[0.03] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        {valueBlock}
                        <div className="mt-1.5 flex items-center gap-0.5">
                            <ActionLink action={primary} variant="primary" />
                        </div>
                    </Link>
                ) : (
                    <div>
                        {valueBlock}
                        <div className="mt-1.5">
                            <ActionLink action={primary} variant="primary" />
                        </div>
                    </div>
                )}

                {secondary && (
                    <div className="mt-auto pt-1 border-t border-white/5">
                        <ActionLink action={secondary} variant="secondary" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
