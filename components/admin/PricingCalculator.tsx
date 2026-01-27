'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calculator, TrendingUp, AlertCircle, Info } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type CalcParams = {
    // 모델 정보
    volumeCm3: number
    surfaceAreaCm2: number
    heightMm: number

    // FDM 설정
    fdm_infill: number
    fdm_layer_height: number
    fdm_support_enabled: boolean
    fdm_material_price_per_gram: number
    fdm_material_density: number

    // SLA 설정
    sla_layer_height: number
    sla_material_price_per_ml: number
    sla_post_processing: boolean

    // DLP 설정
    dlp_layer_height: number
    dlp_material_price_per_ml: number
    dlp_post_processing: boolean
}

type EquipmentParams = {
    // 기본 시간당 비용
    hourly_rate: number

    // 레이어별 비용
    layer_costs: Record<string, number>

    // FDM 파라미터
    fdm_layer_hours_factor: number
    fdm_labor_cost_krw: number
    fdm_support_per_cm2_krw: number

    // SLA 파라미터
    sla_layer_exposure_sec: number
    sla_labor_cost_krw: number
    sla_consumables_krw: number
    sla_post_process_krw: number

    // DLP 파라미터
    dlp_layer_exposure_sec: number
    dlp_labor_cost_krw: number
    dlp_consumables_krw: number
    dlp_post_process_krw: number
}

type Props = {
    equipmentParams: {
        fdm?: EquipmentParams
        sla?: EquipmentParams
        dlp?: EquipmentParams
    }
}

const KRW_TO_UNIT = 1300

export default function PricingCalculator({ equipmentParams }: Props) {
    const [method, setMethod] = useState<'fdm' | 'sla' | 'dlp'>('fdm')

    // 기본 테스트 모델 파라미터
    const [params, setParams] = useState<CalcParams>({
        volumeCm3: 10,
        surfaceAreaCm2: 50,
        heightMm: 50,
        fdm_infill: 20,
        fdm_layer_height: 0.2,
        fdm_support_enabled: true,
        fdm_material_price_per_gram: 50,
        fdm_material_density: 1.24,
        sla_layer_height: 0.05,
        sla_material_price_per_ml: 150,
        sla_post_processing: true,
        dlp_layer_height: 0.05,
        dlp_material_price_per_ml: 150,
        dlp_post_processing: true,
    })

    // FDM 계산
    const fdmCalc = useMemo(() => {
        const ep = equipmentParams.fdm
        if (!ep) return null

        const effectiveDensity = params.fdm_material_density * (params.fdm_infill / 100)
        const adjustedDensity = Math.max(params.fdm_material_density * 0.2, effectiveDensity)
        const weightGrams = params.volumeCm3 * adjustedDensity
        const materialCost = (params.fdm_material_price_per_gram / KRW_TO_UNIT) * weightGrams

        const numLayers = Math.max(1, Math.ceil(params.heightMm / params.fdm_layer_height))

        // [개선된 알고리즘] 부피, 표면적, 높이를 모두 고려한 시간 산출 (2차 튜닝)
        const materialTimeFactor = 0.013; // 0.022 -> 0.013
        const volumeTime = weightGrams * materialTimeFactor;
        const layerTimeFactor = (ep.fdm_layer_hours_factor ?? 0.02) * 0.015; // 0.1 -> 0.015 (약 1초)
        const movementTime = numLayers * layerTimeFactor;
        const surfaceTime = params.surfaceAreaCm2 * 0.0005; // 0.001 -> 0.0005

        const estTimeHours = Math.max(0.5, volumeTime + movementTime + surfaceTime);

        const supportCost = params.fdm_support_enabled
            ? (ep.fdm_support_per_cm2_krw / KRW_TO_UNIT) * params.surfaceAreaCm2
            : 0

        const laborCost = ep.fdm_labor_cost_krw / KRW_TO_UNIT

        const machineRate = ep.layer_costs[String(params.fdm_layer_height)]
            ?? ep.hourly_rate
        const machineCost = estTimeHours * (machineRate / KRW_TO_UNIT)

        const total = materialCost + supportCost + machineCost + laborCost

        return {
            materialCost: materialCost * KRW_TO_UNIT,
            supportCost: supportCost * KRW_TO_UNIT,
            machineCost: machineCost * KRW_TO_UNIT,
            laborCost: laborCost * KRW_TO_UNIT,
            total: total * KRW_TO_UNIT,
            timeHours: estTimeHours,
            numLayers,
            weightGrams,
        }
    }, [equipmentParams.fdm, params])

    // SLA 계산
    const slaCalc = useMemo(() => {
        const ep = equipmentParams.sla
        if (!ep) return null

        const volumeML = params.volumeCm3
        const resinCost = (params.sla_material_price_per_ml / KRW_TO_UNIT) * volumeML

        const numLayers = Math.max(1, Math.ceil(params.heightMm / params.sla_layer_height))
        // [개선] 기구 동작 시간(Lift & Retract) 추가 (약 8.5초)
        const mechanicDelay = 8.5;
        const estTimeHours = (numLayers * (ep.sla_layer_exposure_sec + mechanicDelay)) / 3600

        const consumablesCost = ep.sla_consumables_krw / KRW_TO_UNIT
        const postProcessCost = params.sla_post_processing
            ? ep.sla_post_process_krw / KRW_TO_UNIT
            : 0
        const otherCost = consumablesCost + postProcessCost

        const laborCost = ep.sla_labor_cost_krw / KRW_TO_UNIT

        const machineRate = ep.layer_costs[String(params.sla_layer_height)]
            ?? ep.hourly_rate
        const machineCost = estTimeHours * (machineRate / KRW_TO_UNIT)

        const total = resinCost + otherCost + machineCost + laborCost

        return {
            materialCost: resinCost * KRW_TO_UNIT,
            otherCost: otherCost * KRW_TO_UNIT,
            machineCost: machineCost * KRW_TO_UNIT,
            laborCost: laborCost * KRW_TO_UNIT,
            total: total * KRW_TO_UNIT,
            timeHours: estTimeHours,
            numLayers,
            volumeML,
        }
    }, [equipmentParams.sla, params])

    // DLP 계산
    const dlpCalc = useMemo(() => {
        const ep = equipmentParams.dlp
        if (!ep) return null

        const volumeML = params.volumeCm3
        const resinCost = (params.dlp_material_price_per_ml / KRW_TO_UNIT) * volumeML

        const numLayers = Math.max(1, Math.ceil(params.heightMm / params.dlp_layer_height))
        // [개선] 기구 동작 시간(Lift & Retract) 추가 (약 8.5초)
        const mechanicDelay = 8.5;
        const estTimeHours = (numLayers * (ep.dlp_layer_exposure_sec + mechanicDelay)) / 3600

        const consumablesCost = ep.dlp_consumables_krw / KRW_TO_UNIT
        const postProcessCost = params.dlp_post_processing
            ? ep.dlp_post_process_krw / KRW_TO_UNIT
            : 0
        const otherCost = consumablesCost + postProcessCost

        const laborCost = ep.dlp_labor_cost_krw / KRW_TO_UNIT

        const machineRate = ep.layer_costs[String(params.dlp_layer_height)]
            ?? ep.hourly_rate
        const machineCost = estTimeHours * (machineRate / KRW_TO_UNIT)

        const total = resinCost + otherCost + machineCost + laborCost

        return {
            materialCost: resinCost * KRW_TO_UNIT,
            otherCost: otherCost * KRW_TO_UNIT,
            machineCost: machineCost * KRW_TO_UNIT,
            laborCost: laborCost * KRW_TO_UNIT,
            total: total * KRW_TO_UNIT,
            timeHours: estTimeHours,
            numLayers,
            volumeML,
        }
    }, [equipmentParams.dlp, params])

    const currentCalc = method === 'fdm' ? fdmCalc : method === 'sla' ? slaCalc : dlpCalc

    return (
        <Card className="bg-white/[0.03] border-white/10">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    <CardTitle className="text-white">가격 정책 계산기</CardTitle>
                </div>
                <CardDescription className="text-white/50">
                    테스트 모델의 견적을 실시간으로 계산하여 설정 변경의 영향을 즉시 확인하세요.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-100 text-sm">
                        장비 설정 탭에서 값을 변경하면 이 계산기에 실시간으로 반영됩니다.
                    </p>
                </div>

                {/* 모델 파라미터 입력 */}
                <div className="space-y-4">
                    <Label className="text-sm font-bold text-white/90">테스트 모델 파라미터</Label>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="text-[10px] text-white/50">부피 (cm³)</Label>
                            <Input
                                type="number"
                                className="mt-1 bg-white/5 border-white/10 text-white"
                                value={params.volumeCm3}
                                onChange={(e) => setParams({ ...params, volumeCm3: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-white/50">표면적 (cm²)</Label>
                            <Input
                                type="number"
                                className="mt-1 bg-white/5 border-white/10 text-white"
                                value={params.surfaceAreaCm2}
                                onChange={(e) => setParams({ ...params, surfaceAreaCm2: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-white/50">높이 (mm)</Label>
                            <Input
                                type="number"
                                className="mt-1 bg-white/5 border-white/10 text-white"
                                value={params.heightMm}
                                onChange={(e) => setParams({ ...params, heightMm: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                </div>

                {/* 출력 방식별 설정 */}
                <Tabs value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="fdm">FDM</TabsTrigger>
                        <TabsTrigger value="sla">SLA</TabsTrigger>
                        <TabsTrigger value="dlp">DLP</TabsTrigger>
                    </TabsList>

                    <TabsContent value="fdm" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[10px] text-white/50">Infill (%)</Label>
                                <Input
                                    type="number"
                                    className="mt-1 bg-white/5 border-white/10 text-white"
                                    value={params.fdm_infill}
                                    onChange={(e) => setParams({ ...params, fdm_infill: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] text-white/50">레이어 두께 (mm)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    className="mt-1 bg-white/5 border-white/10 text-white"
                                    value={params.fdm_layer_height}
                                    onChange={(e) => setParams({ ...params, fdm_layer_height: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] text-white/50">소재 단가 (원/g)</Label>
                                <Input
                                    type="number"
                                    className="mt-1 bg-white/5 border-white/10 text-white"
                                    value={params.fdm_material_price_per_gram}
                                    onChange={(e) => setParams({ ...params, fdm_material_price_per_gram: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] text-white/50">소재 밀도 (g/cm³)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="mt-1 bg-white/5 border-white/10 text-white"
                                    value={params.fdm_material_density}
                                    onChange={(e) => setParams({ ...params, fdm_material_density: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="fdm-support"
                                checked={params.fdm_support_enabled}
                                onChange={(e) => setParams({ ...params, fdm_support_enabled: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="fdm-support" className="text-sm text-white/90">지지 구조 사용</Label>
                        </div>
                    </TabsContent>

                    <TabsContent value="sla" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[10px] text-white/50">레이어 두께 (mm)</Label>
                                <Input
                                    type="number"
                                    step="0.025"
                                    className="mt-1 bg-white/5 border-white/10 text-white"
                                    value={params.sla_layer_height}
                                    onChange={(e) => setParams({ ...params, sla_layer_height: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] text-white/50">레진 단가 (원/mL)</Label>
                                <Input
                                    type="number"
                                    className="mt-1 bg-white/5 border-white/10 text-white"
                                    value={params.sla_material_price_per_ml}
                                    onChange={(e) => setParams({ ...params, sla_material_price_per_ml: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sla-post"
                                checked={params.sla_post_processing}
                                onChange={(e) => setParams({ ...params, sla_post_processing: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="sla-post" className="text-sm text-white/90">후가공 적용</Label>
                        </div>
                    </TabsContent>

                    <TabsContent value="dlp" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[10px] text-white/50">레이어 두께 (mm)</Label>
                                <Input
                                    type="number"
                                    step="0.025"
                                    className="mt-1 bg-white/5 border-white/10 text-white"
                                    value={params.dlp_layer_height}
                                    onChange={(e) => setParams({ ...params, dlp_layer_height: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] text-white/50">레진 단가 (원/mL)</Label>
                                <Input
                                    type="number"
                                    className="mt-1 bg-white/5 border-white/10 text-white"
                                    value={params.dlp_material_price_per_ml}
                                    onChange={(e) => setParams({ ...params, dlp_material_price_per_ml: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="dlp-post"
                                checked={params.dlp_post_processing}
                                onChange={(e) => setParams({ ...params, dlp_post_processing: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="dlp-post" className="text-sm text-white/90">후가공 적용</Label>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* 계산 결과 */}
                {currentCalc && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <Label className="text-sm font-bold text-white/90">예상 견적</Label>
                        </div>

                        {/* 비용 구분 */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">{method === 'fdm' ? '재료비' : '레진비'}</span>
                                <span className="font-mono text-white">₩{Math.round(currentCalc.materialCost).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">{method === 'fdm' ? '지지구조비' : '기타비용'}</span>
                                <span className="font-mono text-white">₩{Math.round(method === 'fdm' ? (currentCalc as any).supportCost : (currentCalc as any).otherCost).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">장비비</span>
                                <span className="font-mono text-white">₩{Math.round(currentCalc.machineCost).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">인건비</span>
                                <span className="font-mono text-white">₩{Math.round(currentCalc.laborCost).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10">
                                <span className="text-white">총 견적</span>
                                <span className="font-mono text-primary">₩{Math.round(currentCalc.total).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* 상세 정보 */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-3 rounded-lg bg-white/5">
                                <div className="text-[10px] text-white/50 uppercase">예상 소요 시간</div>
                                <div className="text-lg font-bold text-emerald-400 mt-1">
                                    {currentCalc.timeHours < 1
                                        ? `${Math.ceil(currentCalc.timeHours * 60)}분`
                                        : currentCalc.timeHours >= 24
                                            ? `${Math.ceil(currentCalc.timeHours / 24)}일`
                                            : `${Math.ceil(currentCalc.timeHours)}시간`}
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5">
                                <div className="text-[10px] text-white/50 uppercase">총 레이어 수</div>
                                <div className="text-lg font-bold text-white mt-1">
                                    {currentCalc.numLayers.toLocaleString()} layers
                                </div>
                            </div>
                            {method === 'fdm' && (
                                <div className="p-3 rounded-lg bg-white/5 col-span-2">
                                    <div className="text-[10px] text-white/50 uppercase">소재 사용량</div>
                                    <div className="text-lg font-bold text-white mt-1">
                                        {(currentCalc as any).weightGrams.toFixed(1)} g
                                    </div>
                                </div>
                            )}
                            {(method === 'sla' || method === 'dlp') && (
                                <div className="p-3 rounded-lg bg-white/5 col-span-2">
                                    <div className="text-[10px] text-white/50 uppercase">레진 사용량</div>
                                    <div className="text-lg font-bold text-white mt-1">
                                        {(currentCalc as any).volumeML.toFixed(1)} mL
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
