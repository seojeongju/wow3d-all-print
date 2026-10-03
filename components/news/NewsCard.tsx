import { ArrowRight, Newspaper } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { formatNewsDateKo, type NewsPost } from '@/lib/news'

export const NEWS_BODY_CLASS =
    'news-body-html text-[15px] sm:text-base font-medium text-white/75 leading-[1.85] break-keep break-words space-y-4 [&_*]:max-w-full [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-white [&_h1]:mt-8 [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-white [&_h2]:mt-8 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-6 [&_p]:mb-4 [&_img]:mx-auto [&_img]:!max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:border [&_img]:border-white/10 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-teal-400 [&_blockquote]:pl-4 [&_blockquote]:text-white/60 [&_a]:text-teal-300 [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-white/15 [&_th]:bg-white/5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-2'

export default function NewsCard({
    post,
    categoryLabel,
    readMoreLabel,
    compact = false,
}: {
    post: NewsPost
    categoryLabel: string
    readMoreLabel: string
    compact?: boolean
}) {
    return (
        <Link href={`/news/${post.slug}`} className="group block h-full min-w-0">
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors group-hover:border-teal-400/40 group-hover:bg-white/[0.05]">
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
                    {post.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={post.coverUrl}
                            alt={post.coverAlt || post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.18),transparent_60%)]">
                            <Newspaper className="h-10 w-10 text-teal-400/40" />
                        </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full border border-teal-400/30 bg-slate-950/80 px-2.5 py-1 text-[11px] font-black text-teal-300 backdrop-blur">
                        {categoryLabel}
                    </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                    <time className="text-xs font-bold text-white/40" dateTime={post.publishedAt ?? undefined}>
                        {formatNewsDateKo(post.publishedAt)}
                    </time>
                    <h3 className="line-clamp-2 break-keep text-base font-black leading-snug text-white sm:text-lg">
                        {post.title}
                    </h3>
                    {!compact && post.summary[0] ? (
                        <p className="line-clamp-2 break-keep text-sm font-medium leading-relaxed text-white/50">
                            {post.summary[0]}
                        </p>
                    ) : null}
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-black text-teal-300">
                        {readMoreLabel}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
            </article>
        </Link>
    )
}
