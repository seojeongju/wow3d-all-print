import {
    ESTIMATOR_CONSULT_KRW,
    ESTIMATOR_METHODS,
    estimatePriceRange,
    materialTypeForMethod,
    type EstimateRange,
    type EstimatorMethod,
    type EstimatorShape,
    type EstimatorSpecs,
} from '@/lib/price-estimator'
import type { PublicMaterial } from '@/lib/pricing-public-data'

/**
 * 3D프린팅 가격 예시표 — 대표 품목을 가격 계산기와 같은 공식·관리자 단가로 계산한다.
 * 숫자를 페이지에 하드코딩하지 않으므로 단가를 바꾸면 예시 가격도 함께 바뀐다.
 */
export type PriceExample = {
    id: string
    dims: { x: number; y: number; z: number }
    shape: EstimatorShape
}

/** 품목명·설명은 메시지(PriceExamplesGuide.examples.<id>)에 있음 */
export const PRICE_EXAMPLES: PriceExample[] = [
    { id: 'small-part', dims: { x: 40, y: 30, z: 20 }, shape: 'solid' },
    { id: 'keyring', dims: { x: 50, y: 30, z: 5 }, shape: 'solid' },
    { id: 'figure', dims: { x: 60, y: 60, z: 100 }, shape: 'figure' },
    { id: 'enclosure', dims: { x: 100, y: 70, z: 30 }, shape: 'shell' },
    { id: 'housing', dims: { x: 150, y: 100, z: 50 }, shape: 'shell' },
    { id: 'architecture', dims: { x: 200, y: 200, z: 80 }, shape: 'general' },
]

export type PriceExampleCell =
    | { status: 'ok'; materialName: string; range: EstimateRange }
    | { status: 'too-large' | 'consult' | 'no-material' }

export type PriceExampleRow = {
    example: PriceExample
    cells: Record<EstimatorMethod, PriceExampleCell>
}

/** 방식별 기본 소재 — 가격 계산기 기본 선택과 같은 규칙(정렬상 첫 소재), FDM은 PLA 우선 */
export function pickDefaultMaterial(
    materials: PublicMaterial[],
    method: EstimatorMethod
): PublicMaterial | undefined {
    const ofType = materials.filter((m) => m.type === materialTypeForMethod(method))
    if (method === 'fdm') {
        const pla = ofType.find((m) => /^PLA\b/i.test(m.name.trim()))
        if (pla) return pla
    }
    return ofType[0]
}

export function computePriceExamples(
    materials: PublicMaterial[],
    specs: EstimatorSpecs
): PriceExampleRow[] {
    return PRICE_EXAMPLES.map((example) => {
        const cells = {} as Record<EstimatorMethod, PriceExampleCell>
        for (const method of ESTIMATOR_METHODS) {
            const material = pickDefaultMaterial(materials, method)
            if (!material) {
                cells[method] = { status: 'no-material' }
                continue
            }
            const range = estimatePriceRange({
                method,
                dims: example.dims,
                shape: example.shape,
                quantity: 1,
                material,
                spec: specs[method],
            })
            if (!range || !range.fits) cells[method] = { status: 'too-large' }
            else if (range.high.totalKrw > ESTIMATOR_CONSULT_KRW) cells[method] = { status: 'consult' }
            else cells[method] = { status: 'ok', materialName: material.name, range }
        }
        return { example, cells }
    })
}

/** 가격 계산기 프리셋 링크 (계산기가 w·d·h·shape·method 쿼리를 읽음) */
export function priceCalculatorHref(example: PriceExample, method: EstimatorMethod = 'fdm') {
    const { x, y, z } = example.dims
    return `/price-calculator?w=${x}&d=${y}&h=${z}&shape=${example.shape}&method=${method}`
}

export function formatKrw(n: number, locale: string) {
    return locale === 'en' ? `KRW ${n.toLocaleString('en-US')}` : `${n.toLocaleString('ko-KR')}원`
}
