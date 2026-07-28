import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type GuideCTAProps = {
    eyebrow?: string;
    title: string;
    description: string;
    primaryHref?: string;
    primaryLabel?: string;
    trackingSource?: string;
    trackingTopic?: string;
    secondaryHref?: string;
    secondaryLabel?: string;
};

export default function GuideCTA({
    eyebrow = 'Next Step',
    title,
    description,
    primaryHref = '/quote',
    primaryLabel = '자동견적 시작',
    trackingSource,
    trackingTopic,
    secondaryHref = '/contact',
    secondaryLabel = '1:1 문의하기',
}: GuideCTAProps) {
    const primaryLink =
        trackingSource || trackingTopic
            ? {
                  pathname: primaryHref,
                  query: {
                      ...(trackingSource ? { guide_source: trackingSource } : {}),
                      ...(trackingTopic ? { guide_topic: trackingTopic } : {}),
                  },
              }
            : primaryHref;

    return (
        <div className="rounded-[2rem] border border-teal-400/20 bg-teal-400/5 p-8 md:p-10 space-y-5">
            <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">{eyebrow}</p>
                <h2 className="text-2xl font-black">{title}</h2>
                <p className="text-white/70 break-keep leading-relaxed">{description}</p>
            </div>
            <div className="flex gap-3">
                <Link href={primaryLink}>
                    <Button className="rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black">
                        {primaryLabel} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
                <Link href={secondaryHref}>
                    <Button variant="outline" className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                        {secondaryLabel}
                    </Button>
                </Link>
            </div>
        </div>
    );
}
