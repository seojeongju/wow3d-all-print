'use client';

import type { ComponentType } from 'react';
import { MousePointerClick, Upload, ImageIcon, FileBox, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    HERO_CONVERSION_EVENTS,
    HERO_EVENT_LABELS,
    type HeroFunnelEventRow,
    type HeroFunnelSummary,
} from '@/lib/conversion-events';

type Props = {
    rows: HeroFunnelEventRow[];
    summary: HeroFunnelSummary;
    dayCount?: number;
};

const DISPLAY_ORDER = [
    HERO_CONVERSION_EVENTS.VIEW,
    HERO_CONVERSION_EVENTS.CTA_FILE,
    HERO_CONVERSION_EVENTS.FORK_FILE,
    HERO_CONVERSION_EVENTS.DROP_FILE,
    HERO_CONVERSION_EVENTS.DROP_ZONE_CLICK_FILE,
    HERO_CONVERSION_EVENTS.PANEL_CTA_FILE,
    HERO_CONVERSION_EVENTS.CTA_PHOTO,
    HERO_CONVERSION_EVENTS.FORK_PHOTO,
    HERO_CONVERSION_EVENTS.DROP_PHOTO,
    HERO_CONVERSION_EVENTS.DROP_ZONE_CLICK_PHOTO,
    HERO_CONVERSION_EVENTS.PANEL_CTA_PHOTO,
    HERO_CONVERSION_EVENTS.SAMPLE_TRY,
    HERO_CONVERSION_EVENTS.TERTIARY,
];

export default function HeroFunnelPanel({ rows, summary, dayCount = 14 }: Props) {
    const byName = new Map(rows.map((r) => [r.eventName, r]));
    const orderedRows = DISPLAY_ORDER.map((name) => byName.get(name)).filter(Boolean) as HeroFunnelEventRow[];

    return (
        <Card className="overflow-hidden border-white/5 bg-[#0f0f0f]">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
                    <MousePointerClick className="h-4 w-4 text-teal-400" />
                    메인 히어로 전환 추적
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                        최근 {dayCount}일
                    </span>
                </CardTitle>
                <p className="text-xs leading-relaxed text-white/45 break-keep">
                    CTA·Drop Zone·Fork 카드 클릭/업로드를 집계합니다. hero_view 대비 intent 비율로 히어로 UX를
                    점검하세요.
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid gap-px border-b border-white/5 bg-white/5 sm:grid-cols-4">
                    <SummaryCell
                        icon={Sparkles}
                        label="히어로 노출(세션)"
                        value={String(summary.views)}
                        sub="근사 도달"
                    />
                    <SummaryCell
                        icon={FileBox}
                        label="3D 파일 intent"
                        value={String(summary.fileIntent)}
                        sub={`${summary.fileIntentRate}%`}
                    />
                    <SummaryCell
                        icon={ImageIcon}
                        label="사진 intent"
                        value={String(summary.photoIntent)}
                        sub={`${summary.photoIntentRate}%`}
                    />
                    <SummaryCell
                        icon={Upload}
                        label="샘플 체험"
                        value={String(summary.sampleTry)}
                        sub="클릭"
                    />
                </div>

                {orderedRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white/30">
                        <MousePointerClick className="mb-2 h-8 w-8" />
                        <p className="text-xs font-bold">아직 이벤트 데이터가 없습니다</p>
                        <p className="mt-1 max-w-sm px-6 text-center text-[11px] text-white/25 break-keep">
                            conversion_events 테이블 마이그레이션 후 메인 페이지 방문·클릭이 기록됩니다.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/35">
                                    <th className="px-5 py-3">이벤트</th>
                                    <th className="px-4 py-3 text-right">발생</th>
                                    <th className="px-5 py-3 text-right">세션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderedRows.map((row) => (
                                    <tr key={row.eventName} className="border-b border-white/5 last:border-0">
                                        <td className="px-5 py-3 font-medium text-white/75">
                                            {HERO_EVENT_LABELS[row.eventName] ?? row.label}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black tabular-nums text-white">
                                            {row.count.toLocaleString('ko-KR')}
                                        </td>
                                        <td className="px-5 py-3 text-right tabular-nums text-white/50">
                                            {row.sessions.toLocaleString('ko-KR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SummaryCell({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <div className="bg-[#0f0f0f] p-5">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/35">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="text-2xl font-black tabular-nums text-white">{value}</p>
            <p className="mt-0.5 text-[11px] font-bold text-teal-400/80">{sub}</p>
        </div>
    );
}
