import {
    BestMaterialsGuidePage,
    generateBestMaterialsMetadata,
} from '@/components/guides/BestMaterialsGuideView'

const SLUG = 'best-materials-for-heat-resistant-and-impact-resistant-parts' as const

type Props = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
    return generateBestMaterialsMetadata({ params, slug: SLUG })
}

export default function HeatImpactMaterialGuidePage({ params }: Props) {
    return <BestMaterialsGuidePage params={params} slug={SLUG} />
}
