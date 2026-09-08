export const BEST_MATERIALS_GUIDE_SLUGS = [
    'best-materials-for-3d-printing-prototypes',
    'best-materials-for-transparent-3d-printed-parts',
    'best-materials-for-3d-printed-housings-and-cases',
    'best-materials-for-heat-resistant-and-impact-resistant-parts',
    'best-materials-for-miniatures-and-figurines',
] as const

export type BestMaterialsGuideSlug = (typeof BEST_MATERIALS_GUIDE_SLUGS)[number]

export type BestMaterialsGuideVariant = 'useCases' | 'options'

export type BestMaterialsGuideMeta = {
    path: `/guides/${BestMaterialsGuideSlug}`
    trackingSource: string
    variant: BestMaterialsGuideVariant
}

export const BEST_MATERIALS_GUIDE_META: Record<BestMaterialsGuideSlug, BestMaterialsGuideMeta> = {
    'best-materials-for-3d-printing-prototypes': {
        path: '/guides/best-materials-for-3d-printing-prototypes',
        trackingSource: 'prototypes',
        variant: 'useCases',
    },
    'best-materials-for-transparent-3d-printed-parts': {
        path: '/guides/best-materials-for-transparent-3d-printed-parts',
        trackingSource: 'transparent_parts',
        variant: 'options',
    },
    'best-materials-for-3d-printed-housings-and-cases': {
        path: '/guides/best-materials-for-3d-printed-housings-and-cases',
        trackingSource: 'housings_cases',
        variant: 'options',
    },
    'best-materials-for-heat-resistant-and-impact-resistant-parts': {
        path: '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts',
        trackingSource: 'heat_impact_parts',
        variant: 'options',
    },
    'best-materials-for-miniatures-and-figurines': {
        path: '/guides/best-materials-for-miniatures-and-figurines',
        trackingSource: 'miniatures_figurines',
        variant: 'options',
    },
}
