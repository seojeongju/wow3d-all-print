import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { PhotoTo3DShowcaseItem } from '@/lib/seo-photo-to-3d'

type PhotoTo3DBeforeAfterProps = {
    items: readonly PhotoTo3DShowcaseItem[]
    heading?: string
    description?: string
}

export default function PhotoTo3DBeforeAfter({
    items,
    heading = '사진 → AI 3D → 출력',
    description = '제품 사진에서 AI 3D 모델을 만들고, 자동견적·3D 프린팅 출력까지 이어지는 흐름 예시입니다.',
}: PhotoTo3DBeforeAfterProps) {
    if (items.length === 0) return null

    return (
        <section className="space-y-6" aria-labelledby="photo-to-3d-showcase-heading">
            <div className="space-y-2">
                <h2 id="photo-to-3d-showcase-heading" className="text-2xl font-black">
                    {heading}
                </h2>
                <p className="text-white/65 text-sm leading-relaxed break-keep">{description}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {items.map((item) => (
                    <article
                        key={item.title}
                        className="rounded-[2rem] border border-white/10 bg-white/[0.03] overflow-hidden"
                    >
                        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch min-h-[200px]">
                            <figure className="relative flex flex-col">
                                <div className="relative aspect-[4/3] bg-slate-900/80">
                                    <Image
                                        src={item.beforeSrc}
                                        alt={item.beforeAlt}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 45vw, 280px"
                                    />
                                </div>
                                <figcaption className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/45 text-center">
                                    원본 사진
                                </figcaption>
                            </figure>

                            <div className="flex items-center justify-center px-2 bg-white/[0.02] border-x border-white/5">
                                <ArrowRight className="w-5 h-5 text-teal-400 shrink-0" aria-hidden />
                            </div>

                            <figure className="relative flex flex-col">
                                <div className="relative aspect-[4/3] bg-slate-900/80">
                                    <Image
                                        src={item.afterSrc}
                                        alt={item.afterAlt}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 45vw, 280px"
                                    />
                                </div>
                                <figcaption className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-teal-400/80 text-center">
                                    AI 3D · 출력
                                </figcaption>
                            </figure>
                        </div>

                        <div className="p-5 space-y-2 border-t border-white/10">
                            <h3 className="text-lg font-black break-keep">{item.title}</h3>
                            {item.caption && (
                                <p className="text-sm text-white/65 leading-relaxed break-keep">{item.caption}</p>
                            )}
                            {(item.printMethod || item.material) && (
                                <p className="text-xs text-white/40 font-medium">
                                    {[item.printMethod, item.material].filter(Boolean).join(' · ')}
                                </p>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}
