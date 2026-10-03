import { cn } from '@/lib/utils'

/**
 * 16:9 틀 안에 대표 이미지 전체를 보여 준다(잘림 없음).
 * 비율이 다른 기존 이미지도 남는 여백을 같은 이미지의 흐린 배경으로 채운다.
 */
export function NewsCoverImage({
    src,
    alt,
    className,
    imgClassName,
    loading,
}: {
    src: string
    alt: string
    className?: string
    imgClassName?: string
    loading?: 'lazy' | 'eager'
}) {
    return (
        <div className={cn('relative aspect-video w-full overflow-hidden bg-slate-900', className)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt=""
                aria-hidden
                loading={loading}
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                width={1600}
                height={900}
                loading={loading}
                className={cn('relative h-full w-full object-contain', imgClassName)}
            />
        </div>
    )
}
