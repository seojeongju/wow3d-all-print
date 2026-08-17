import type { GeometryAnalysis } from '@/lib/geometry'

export type PrintabilityWarning = {
    level: 'info' | 'warn'
    message: string
}

/** AI 생성 STL의 출력 적합성 휴리스틱 (자동 수리는 하지 않음) */
export function assessPrintability(analysis: GeometryAnalysis): PrintabilityWarning[] {
    const warnings: PrintabilityWarning[] = []
    const { x, y, z } = analysis.boundingBox
    const minAxis = Math.min(x, y, z)
    const maxAxis = Math.max(x, y, z)
    const bboxVolCm3 = (x * y * z) / 1000
    const fillRatio = bboxVolCm3 > 0.001 ? analysis.volume / bboxVolCm3 : 0

    if (minAxis > 0 && minAxis < 1.2) {
        warnings.push({
            level: 'warn',
            message: `가장 얇은 치수가 ${minAxis.toFixed(1)}mm입니다. FDM은 1.2mm 이상, 레진은 0.8mm 이상을 권장합니다.`,
        })
    }
    if (maxAxis > 0 && maxAxis < 8) {
        warnings.push({
            level: 'info',
            message: '모델이 매우 작습니다. 견적 화면에서 실제 길이(mm)로 스케일을 키워 주세요.',
        })
    }
    if (fillRatio > 0 && fillRatio < 0.08) {
        warnings.push({
            level: 'warn',
            message: '부피가 외형 대비 매우 작습니다. 구멍이 나 있거나 얇은 껍질일 수 있습니다.',
        })
    }
    if ((analysis.overhangArea || 0) > analysis.surfaceArea * 0.35) {
        warnings.push({
            level: 'info',
            message: '오버행이 많습니다. FDM은 서포트를 켜고, 레진은 배향을 확인해 주세요.',
        })
    }

    return warnings
}
