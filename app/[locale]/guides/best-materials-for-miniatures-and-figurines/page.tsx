import {
    BestMaterialsGuidePage,
    generateBestMaterialsMetadata,
} from '@/components/guides/BestMaterialsGuideView'

const SLUG = 'best-materials-for-miniatures-and-figurines' as const

type Props = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
    return generateBestMaterialsMetadata({ params, slug: SLUG })
}

export default function MiniatureMaterialGuidePage({ params }: Props) {
    return <BestMaterialsGuidePage params={params} slug={SLUG} />
}
