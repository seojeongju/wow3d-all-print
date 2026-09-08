import {
    BestMaterialsGuidePage,
    generateBestMaterialsMetadata,
} from '@/components/guides/BestMaterialsGuideView'

const SLUG = 'best-materials-for-transparent-3d-printed-parts' as const

type Props = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
    return generateBestMaterialsMetadata({ params, slug: SLUG })
}

export default function TransparentPartsGuidePage({ params }: Props) {
    return <BestMaterialsGuidePage params={params} slug={SLUG} />
}
