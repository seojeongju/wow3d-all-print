'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Info, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'

type PricingPreset = {
    id: string
    name: string
    description: string
    badge?: string
    equipment: {
        fdm?: Partial<EquipmentParams>
        sla?: Partial<EquipmentParams>
        dlp?: Partial<EquipmentParams>
    }
}

type EquipmentParams = {
    hourly_rate: number
    fdm_layer_hours_factor: number
    fdm_labor_cost_krw: number
    fdm_support_per_cm2_krw: number
    sla_layer_exposure_sec: number
    sla_labor_cost_krw: number
    sla_consumables_krw: number
    sla_post_process_krw: number
    dlp_layer_exposure_sec: number
    dlp_labor_cost_krw: number
    dlp_consumables_krw: number
    dlp_post_process_krw: number
}

const PRESETS: PricingPreset[] = [
    {
        id: 'economy',
        name: '경제형',
        description: '비용을 최소화한 기본 설정. 일반적인 프로토타입 제작에 적합합니다.',
        badge: '저가',
        equipment: {
            fdm: {
                hourly_rate: 4000,
                fdm_labor_cost_krw: 5000,
                fdm_support_per_cm2_krw: 20,
                fdm_layer_hours_factor: 0.02,
            },
            sla: {
                hourly_rate: 6000,
                sla_labor_cost_krw: 7000,
                sla_consumables_krw: 3000,
                sla_post_process_krw: 8000,
                sla_layer_exposure_sec: 8,
            },
            dlp: {
                hourly_rate: 7000,
                dlp_labor_cost_krw: 7000,
                dlp_consumables_krw: 3000,
                dlp_post_process_krw: 8000,
                dlp_layer_exposure_sec: 3,
            },
        },
    },
    {
        id: 'standard',
        name: '표준형',
        description: '균형잡힌 가격과 품질. 대부분의 프로젝트에 권장됩니다.',
        badge: '추천',
        equipment: {
            fdm: {
                hourly_rate: 5000,
                fdm_labor_cost_krw: 6500,
                fdm_support_per_cm2_krw: 26,
                fdm_layer_hours_factor: 0.02,
            },
            sla: {
                hourly_rate: 8000,
                sla_labor_cost_krw: 9100,
                sla_consumables_krw: 3900,
                sla_post_process_krw: 10400,
                sla_layer_exposure_sec: 8,
            },
            dlp: {
                hourly_rate: 9000,
                dlp_labor_cost_krw: 9100,
                dlp_consumables_krw: 3900,
                dlp_post_process_krw: 10400,
                dlp_layer_exposure_sec: 3,
            },
        },
    },
    {
        id: 'premium',
        name: '프리미엄',
        description: '고품질 출력과 빠른 처리. 전문가용 프로젝트에 적합합니다.',
        badge: '고급',
        equipment: {
            fdm: {
                hourly_rate: 7000,
                fdm_labor_cost_krw: 9000,
                fdm_support_per_cm2_krw: 35,
                fdm_layer_hours_factor: 0.015,
            },
            sla: {
                hourly_rate: 12000,
                sla_labor_cost_krw: 12000,
                sla_consumables_krw: 5000,
                sla_post_process_krw: 15000,
                sla_layer_exposure_sec: 6,
            },
            dlp: {
                hourly_rate: 14000,
                dlp_labor_cost_krw: 12000,
                dlp_consumables_krw: 5000,
                dlp_post_process_krw: 15000,
                dlp_layer_exposure_sec: 2,
            },
        },
    },
]

type Props = {
    onApplyPreset: (preset: PricingPreset) => void
}

export default function PricingPresets({ onApplyPreset }: Props) {
    const [selectedPreset, setSelectedPreset] = useState<PricingPreset | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleApply = () => {
        if (selectedPreset) {
            onApplyPreset(selectedPreset)
            setConfirmOpen(false)
            setSelectedPreset(null)
        }
    }

    return (
        <Card className="bg-white/[0.03] border-white/10">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <CardTitle className="text-white">빠른 프리셋</CardTitle>
                </div>
                <CardDescription className="text-white/50">
                    사전 정의된 가격 정책을 선택하여 빠르게 적용할 수 있습니다.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-100 text-sm">
                        프리셋을 적용하면 현재 설정이 덮어써집니다. 적용 전 현재 설정을 백업해두세요.
                    </p>
                </div>

                <div className="grid gap-4">
                    {PRESETS.map((preset) => (
                        <div
                            key={preset.id}
                            className="p-4 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-white">{preset.name}</h4>
                                        {preset.badge && (
                                            <Badge
                                                variant="outline"
                                                className={
                                                    preset.id === 'economy'
                                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                        : preset.id === 'standard'
                                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                            : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                                }
                                            >
                                                {preset.badge}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-white/60">{preset.description}</p>

                                    {/* 주요 설정 미리보기 */}
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                        {preset.equipment.fdm && (
                                            <div className="p-2 rounded bg-white/5">
                                                <div className="text-white/40">FDM 시간당</div>
                                                <div className="font-mono text-white">₩{preset.equipment.fdm.hourly_rate?.toLocaleString()}</div>
                                            </div>
                                        )}
                                        {preset.equipment.sla && (
                                            <div className="p-2 rounded bg-white/5">
                                                <div className="text-white/40">SLA 시간당</div>
                                                <div className="font-mono text-white">₩{preset.equipment.sla.hourly_rate?.toLocaleString()}</div>
                                            </div>
                                        )}
                                        {preset.equipment.dlp && (
                                            <div className="p-2 rounded bg-white/5">
                                                <div className="text-white/40">DLP 시간당</div>
                                                <div className="font-mono text-white">₩{preset.equipment.dlp.hourly_rate?.toLocaleString()}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Dialog open={confirmOpen && selectedPreset?.id === preset.id} onOpenChange={setConfirmOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedPreset(preset)}
                                            className="ml-4"
                                        >
                                            적용
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>프리셋 적용 확인</DialogTitle>
                                            <DialogDescription>
                                                "{preset.name}" 프리셋을 적용하시겠습니까?
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
                                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <p className="text-white/80 text-sm">
                                                    다음 항목이 변경됩니다:
                                                </p>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                {preset.equipment.fdm && (
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                        <span className="text-white/70">FDM 장비 설정</span>
                                                    </div>
                                                )}
                                                {preset.equipment.sla && (
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                        <span className="text-white/70">SLA 장비 설정</span>
                                                    </div>
                                                )}
                                                {preset.equipment.dlp && (
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                        <span className="text-white/70">DLP 장비 설정</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                                                취소
                                            </Button>
                                            <Button onClick={handleApply}>
                                                적용하기
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 프리셋 설명 */}
                <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                    <h5 className="text-sm font-bold text-white/90 mb-2">💡 프리셋 선택 가이드</h5>
                    <ul className="text-xs text-white/60 space-y-1.5">
                        <li>• <strong className="text-white/80">경제형</strong>: 가격 경쟁력이 중요한 일반 프로토타입</li>
                        <li>• <strong className="text-white/80">표준형</strong>: 품질과 가격의 균형이 필요한 대부분의 프로젝트 (권장)</li>
                        <li>• <strong className="text-white/80">프리미엄</strong>: 최고 품질이 요구되는 전문가용 프로젝트</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
