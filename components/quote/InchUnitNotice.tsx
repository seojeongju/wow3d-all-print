'use client'

import { Ruler } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useFileStore } from '@/store/useFileStore'
import { INCH_TO_MM, isLikelyInchModel } from '@/lib/model-transform'

/**
 * 단위 정보가 없는 STL·OBJ·PLY가 비정상적으로 작으면 인치 파일로 의심하고 ×25.4 변환을 제안.
 * 변환 중에는 되돌리기 버튼을 보여준다.
 */
export default function InchUnitNotice() {
    const t = useTranslations('QuotePanel')
    const file = useFileStore((s) => s.file)
    const fileSource = useFileStore((s) => s.fileSource)
    const baseAnalysis = useFileStore((s) => s.baseAnalysis)
    const unitInch = useFileStore((s) => s.unitInch)
    const setUnitInch = useFileStore((s) => s.setUnitInch)

    if (!file || !baseAnalysis || fileSource.kind === 'meshy-photo') return null

    if (unitInch) {
        return (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-teal-500/10 border border-teal-400/40">
                <Ruler className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-teal-100">{t('inchConvertedTitle')}</p>
                    <p className="text-xs text-teal-100/80 mt-0.5 leading-relaxed break-keep">
                        {t('inchConvertedBody')}
                    </p>
                    <button
                        type="button"
                        onClick={() => setUnitInch(false)}
                        className="mt-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors"
                    >
                        {t('inchRevertButton')}
                    </button>
                </div>
            </div>
        )
    }

    if (!isLikelyInchModel(file.name, baseAnalysis)) return null

    const { x, y, z } = baseAnalysis.boundingBox
    const longest = Math.max(x, y, z)

    return (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40">
            <Ruler className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-100">{t('inchSuspectTitle')}</p>
                <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed break-keep">
                    {t('inchSuspectBody', {
                        mm: longest.toFixed(2),
                        converted: (longest * INCH_TO_MM).toFixed(1),
                    })}
                </p>
                <button
                    type="button"
                    onClick={() => setUnitInch(true)}
                    className="mt-2 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-300 transition-colors"
                >
                    {t('inchConvertButton')}
                </button>
            </div>
        </div>
    )
}
