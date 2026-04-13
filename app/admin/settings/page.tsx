'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Save, Trash2, Loader2, Printer, Pencil, Calculator, Zap, ArrowUp, ArrowDown, Store } from 'lucide-react'
import { Material, PrintSetting } from '@/lib/types'
import { showToast } from '@/lib/toast-helper'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PricingCalculator from '@/components/admin/PricingCalculator'
import PricingPresets from '@/components/admin/PricingPresets'
import { useAuthStore } from '@/store/useAuthStore'
import { getAdminAuthHeaders } from '@/lib/admin-auth-headers'

type EquipmentRow = {
  type: string
  name: string | null
  max_x_mm: number
  max_y_mm: number
  max_z_mm: number
  hourly_rate: number
  layer_heights_json: string | null
  layer_costs_json?: string | null
  is_active: number
  min_price_krw?: number | null
  fdm_layer_hours_factor?: number | null
  fdm_labor_cost_krw?: number | null
  fdm_support_per_cm2_krw?: number | null
  sla_layer_exposure_sec?: number | null
  sla_labor_cost_krw?: number | null
  sla_consumables_krw?: number | null
  sla_post_process_krw?: number | null
  dlp_layer_exposure_sec?: number | null
  dlp_labor_cost_krw?: number | null
  dlp_consumables_krw?: number | null
  dlp_post_process_krw?: number | null
}

type EquipForm = {
  name: string
  max_x_mm: number
  max_y_mm: number
  max_z_mm: number
  hourly_rate: number
  layer_heights_json: string
  layer_costs: Record<string, number>
  min_price_krw?: number | null
  fdm_layer_hours_factor?: number
  fdm_labor_cost_krw?: number
  fdm_support_per_cm2_krw?: number
  sla_layer_exposure_sec?: number
  sla_labor_cost_krw?: number
  sla_consumables_krw?: number
  sla_post_process_krw?: number
  dlp_layer_exposure_sec?: number
  dlp_labor_cost_krw?: number
  dlp_consumables_krw?: number
  dlp_post_process_krw?: number
}

const EQUIPMENT_DEFAULTS: Record<string, Partial<EquipmentRow>> = {
  FDM: { max_x_mm: 220, max_y_mm: 220, max_z_mm: 250, hourly_rate: 5000, layer_heights_json: '[0.1,0.2,0.3]' },
  SLA: { max_x_mm: 145, max_y_mm: 145, max_z_mm: 175, hourly_rate: 8000, layer_heights_json: '[0.025,0.05,0.1]' },
  DLP: { max_x_mm: 120, max_y_mm: 68, max_z_mm: 200, hourly_rate: 9000, layer_heights_json: '[0.025,0.05,0.1]' },
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [materials, setMaterials] = useState<Material[]>([])
  const [settings, setSettings] = useState<PrintSetting[]>([])
  const [equipment, setEquipment] = useState<EquipmentRow[]>([])
  const [storeConfigs, setStoreConfigs] = useState<{ setting_key: string, setting_value: string }[]>([])
  const [isAddingMaterial, setIsAddingMaterial] = useState(false)
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: '',
    type: 'FDM',
    pricePerGram: 0,
    pricePerMl: undefined,
    density: 1.24,
    colors: ['#FFFFFF'],
  })

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [editForm, setEditForm] = useState<Partial<Material>>({})

  // URL에서 초기 탭 상태 가져오기
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'store')

  const [savingEquip, setSavingEquip] = useState<string | null>(null)
  const [equipForms, setEquipForms] = useState<Record<string, EquipForm>>({})

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    // 히스토리 스택에 추가하지 않고 URL 교체
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const authHeaders = getAdminAuthHeaders()
      const [matRes, setRes, eqRes, storeRes] = await Promise.all([
        fetch('/api/admin/materials', { headers: authHeaders }),
        fetch('/api/admin/settings', { headers: authHeaders }),
        fetch('/api/admin/equipment', { headers: authHeaders }).catch(() => ({ json: () => ({ success: false, data: [] }) })),
        fetch('/api/settings', { headers: authHeaders }).catch(() => ({ json: () => ({ success: false, data: [] }) })),
      ])
      const matData = await matRes.json()
      const setData = await setRes.json()
      const eqData = await eqRes.json()
      const storeData = await storeRes.json()

      if (matData.success) {
        setMaterials(
          (matData.data || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            pricePerGram: m.price_per_gram,
            pricePerMl: m.price_per_ml != null ? m.price_per_ml : undefined,
            density: m.density,
            colors: JSON.parse(m.colors || '[]'),
            isActive: m.is_active,
            description: m.description,
          }))
        )
      }
      if (setData.success) setSettings(setData.data || [])
      if (eqData.success) setEquipment(eqData.data || [])
      if (storeData.success) setStoreConfigs(storeData.data || [])
    } catch (e) {
      showToast.error('데이터 로딩 실패', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = () => {
      if (!cancelled) void fetchData()
    }
    const unsub = useAuthStore.persist.onFinishHydration(run)
    if (useAuthStore.persist.hasHydrated()) run()
    return () => {
      cancelled = true
      unsub()
    }
  }, [fetchData])

  useEffect(() => {
    const next: Record<string, EquipForm> = {}
    for (const t of ['FDM', 'SLA', 'DLP']) {
      const e = equipment.find((x) => x.type === t) as EquipmentRow | undefined
      const d = EQUIPMENT_DEFAULTS[t]
      const baseRate = e?.hourly_rate ?? (d?.hourly_rate as number) ?? 5000
      const arr = (() => {
        try {
          const j = e?.layer_heights_json || d?.layer_heights_json || (t === 'FDM' ? '[0.1,0.2,0.3]' : '[0.025,0.05,0.1]')
          const v = typeof j === 'string' && j.startsWith('[') ? JSON.parse(j) : []
          return Array.isArray(v) ? v : (t === 'FDM' ? [0.1, 0.2, 0.3] : [0.025, 0.05, 0.1])
        } catch { return t === 'FDM' ? [0.1, 0.2, 0.3] : [0.025, 0.05, 0.1] }
      })()
      let parsed: Record<string, number> = {}
      try {
        if (e?.layer_costs_json && typeof e.layer_costs_json === 'string') {
          const o = JSON.parse(e.layer_costs_json)
          if (o && typeof o === 'object' && !Array.isArray(o)) {
            for (const [k, v] of Object.entries(o)) {
              const n = Number(v)
              if (Number.isFinite(n) && n >= 0) parsed[String(k)] = n
            }
          }
        }
      } catch { /* */ }
      const layer_costs: Record<string, number> = {}
      for (const th of arr) {
        const k = String(th)
        layer_costs[k] = (parsed[k] != null && Number.isFinite(parsed[k])) ? parsed[k] : baseRate
      }
      next[t] = {
        name: e?.name ?? '',
        max_x_mm: e?.max_x_mm ?? (d?.max_x_mm as number) ?? 220,
        max_y_mm: e?.max_y_mm ?? (d?.max_y_mm as number) ?? 220,
        max_z_mm: e?.max_z_mm ?? (d?.max_z_mm as number) ?? 250,
        hourly_rate: baseRate,
        layer_heights_json: arr.join(', '),
        layer_costs,
        min_price_krw: e?.min_price_krw ?? undefined,
        fdm_layer_hours_factor: e?.fdm_layer_hours_factor ?? 0.02,
        fdm_labor_cost_krw: e?.fdm_labor_cost_krw ?? 6500,
        fdm_support_per_cm2_krw: e?.fdm_support_per_cm2_krw ?? 26,
        sla_layer_exposure_sec: e?.sla_layer_exposure_sec ?? 8,
        sla_labor_cost_krw: e?.sla_labor_cost_krw ?? 9100,
        sla_consumables_krw: e?.sla_consumables_krw ?? 3900,
        sla_post_process_krw: e?.sla_post_process_krw ?? 10400,
        dlp_layer_exposure_sec: e?.dlp_layer_exposure_sec ?? 3,
        dlp_labor_cost_krw: e?.dlp_labor_cost_krw ?? 9100,
        dlp_consumables_krw: e?.dlp_consumables_krw ?? 3900,
        dlp_post_process_krw: e?.dlp_post_process_krw ?? 10400,
      }
    }
    setEquipForms(next)
  }, [equipment])

  const handleSaveStoreConfigs = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ settings: storeConfigs }),
      })
      if (!res.ok) throw new Error('저장 실패')
      showToast.success('상점 설정 저장 완료')
      fetchData()
    } catch (e) {
      showToast.error('저장 실패', e)
    }
  }

  const handleStoreConfigChange = (key: string, value: string) => {
    setStoreConfigs(prev => {
      const exists = prev.find(s => s.setting_key === key);
      if (exists) return prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s);
      return [...prev, { setting_key: key, setting_value: value }];
    });
  }

  const getDefaultForm = (t: string): EquipForm => {
    const d = EQUIPMENT_DEFAULTS[t]
    const arr = (d?.layer_heights_json as string)?.replace(/[\[\]]/g, '').split(',').map((x) => x.trim()).filter(Boolean).join(', ') || (t === 'FDM' ? '0.1, 0.2, 0.3' : '0.025, 0.05, 0.1')
    return { name: '', max_x_mm: (d?.max_x_mm as number) || 220, max_y_mm: (d?.max_y_mm as number) || 220, max_z_mm: (d?.max_z_mm as number) || 250, hourly_rate: (d?.hourly_rate as number) || 5000, layer_heights_json: arr, layer_costs: {}, min_price_krw: undefined, fdm_layer_hours_factor: 0.02, fdm_labor_cost_krw: 6500, fdm_support_per_cm2_krw: 26, sla_layer_exposure_sec: 8, sla_labor_cost_krw: 9100, sla_consumables_krw: 3900, sla_post_process_krw: 10400, dlp_layer_exposure_sec: 3, dlp_labor_cost_krw: 9100, dlp_consumables_krw: 3900, dlp_post_process_krw: 10400 }
  }

  const setEquipLayerCost = (t: string, thickness: string, value: number) => {
    setEquipForms((prev) => {
      const cur = prev[t] || getDefaultForm(t)
      const lc = { ...(cur.layer_costs || {}), [String(thickness)]: value }
      return { ...prev, [t]: { ...cur, layer_costs: lc } }
    })
  }

  const handleSaveEquipment = async (type: string) => {
    const form = equipForms[type]
    if (!form) return
    if (!useAuthStore.getState().token?.trim()) {
      showToast.error('저장 실패', new Error('인증 정보가 없습니다. 다시 로그인해 주세요.'))
      return
    }
    setSavingEquip(type)
    try {
      const layerArr = String(form.layer_heights_json || '')
        .split(',')
        .map((n) => parseFloat(n.trim()))
        .filter(Number.isFinite)
      const arr = layerArr.length ? layerArr : (type === 'FDM' ? [0.1, 0.2, 0.3] : [0.025, 0.05, 0.1])
      const layer_costs: Record<string, number> = {}
      for (const th of arr) {
        const k = String(th)
        layer_costs[k] = (form.layer_costs && form.layer_costs[k] != null && Number.isFinite(form.layer_costs[k]))
          ? form.layer_costs[k]
          : form.hourly_rate
      }
      const res = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          type,
          name: form.name?.trim() || null,
          max_x_mm: form.max_x_mm,
          max_y_mm: form.max_y_mm,
          max_z_mm: form.max_z_mm,
          hourly_rate: form.hourly_rate,
          layer_heights_json: JSON.stringify(arr),
          layer_costs_json: layer_costs,
          is_active: 1,
          min_price_krw: form.min_price_krw != null && form.min_price_krw > 0 ? form.min_price_krw : null,
          fdm_layer_hours_factor: form.fdm_layer_hours_factor ?? 0.02,
          fdm_labor_cost_krw: form.fdm_labor_cost_krw ?? 6500,
          fdm_support_per_cm2_krw: form.fdm_support_per_cm2_krw ?? 26,
          sla_layer_exposure_sec: form.sla_layer_exposure_sec ?? 8,
          sla_labor_cost_krw: form.sla_labor_cost_krw ?? 9100,
          sla_consumables_krw: form.sla_consumables_krw ?? 3900,
          sla_post_process_krw: form.sla_post_process_krw ?? 10400,
          dlp_layer_exposure_sec: form.dlp_layer_exposure_sec ?? 3,
          dlp_labor_cost_krw: form.dlp_labor_cost_krw ?? 9100,
          dlp_consumables_krw: form.dlp_consumables_krw ?? 3900,
          dlp_post_process_krw: form.dlp_post_process_krw ?? 10400,
        }),
      })
      if (!res.ok) {
        let errMsg = '저장 실패'
        try {
          const j = await res.json()
          if (j && typeof j.error === 'string') errMsg = j.error
        } catch { /* non-JSON response */ }
        throw new Error(errMsg)
      }
      showToast.success(`${type} 장비 설정 저장 완료`)
      fetchData()
    } catch (e) {
      showToast.error('저장 실패', e)
    } finally {
      setSavingEquip(null)
    }
  }

  const setEquip = (t: string, k: string, v: string | number) => {
    setEquipForms((prev) => {
      const cur = prev[t] || getDefaultForm(t)
      return { ...prev, [t]: { ...cur, [k]: v } }
    })
  }

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await fetch(`/api/admin/materials?id=${id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      })
      setMaterials((m) => m.filter((x) => x.id !== id))
      showToast.success('소재 삭제 완료')
    } catch (e) {
      showToast.error('삭제 실패', e)
    }
  }

  const handleMoveMaterial = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === materials.length - 1) return

    const newMaterials = [...materials]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    // Swap
    const temp = newMaterials[index]
    newMaterials[index] = newMaterials[targetIndex]
    newMaterials[targetIndex] = temp

    // Optimistic Update
    setMaterials(newMaterials)

    try {
      const res = await fetch('/api/admin/materials/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ orderedIds: newMaterials.map(m => m.id) })
      })
      if (!res.ok) throw new Error('Failed to reorder')
    } catch (e) {
      showToast.error('순서 변경 실패', e)
      fetchData() // Rollback on error
    }
  }


  const handleAddMaterial = async () => {
    try {
      const type = (newMaterial.type || 'FDM').toUpperCase()
      const body: Record<string, unknown> = {
        name: newMaterial.name,
        type,
        pricePerGram: newMaterial.pricePerGram ?? 0,
        density: newMaterial.density ?? 1.24,
        colors: newMaterial.colors || ['#FFFFFF'],
        description: (newMaterial as any).description || undefined,
      }
      if (type === 'SLA' || type === 'DLP') {
        body.pricePerMl = newMaterial.pricePerMl != null ? Number(newMaterial.pricePerMl) : null
      }
      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        let errMsg = '추가 실패'
        try { const j = await res.json(); if (j && typeof j.error === 'string') errMsg = j.error } catch { /* */ }
        throw new Error(errMsg)
      }
      setIsAddingMaterial(false)
      fetchData()
      showToast.success('소재 추가 완료')
      setNewMaterial({ name: '', type: 'FDM', pricePerGram: 0, pricePerMl: undefined, density: 1.24, colors: ['#FFFFFF'] })
    } catch (e) {
      showToast.error('추가 실패', e)
    }
  }

  const openEdit = (m: Material) => {
    setEditingMaterial(m)
    setEditForm({ name: m.name, type: m.type, pricePerGram: m.pricePerGram, pricePerMl: m.pricePerMl ?? undefined, density: m.density, colors: m.colors || [], description: (m as any).description })
  }
  const handleSaveMaterialEdit = async () => {
    if (!editingMaterial) return
    try {
      const type = (editForm.type || 'FDM').toUpperCase()
      const patchBody: Record<string, unknown> = {
        name: editForm.name,
        type,
        pricePerGram: editForm.pricePerGram,
        density: editForm.density,
        colors: editForm.colors || ['#FFFFFF'],
        description: (editForm as any).description ?? undefined,
      }
      if (type === 'SLA' || type === 'DLP') {
        patchBody.pricePerMl = editForm.pricePerMl != null ? Number(editForm.pricePerMl) : null
      }
      const res = await fetch(`/api/admin/materials/${editingMaterial.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(patchBody),
      })
      if (!res.ok) {
        let errMsg = '수정 실패'
        try { const j = await res.json(); if (j && typeof j.error === 'string') errMsg = j.error } catch { /* */ }
        throw new Error(errMsg)
      }
      setEditingMaterial(null)
      fetchData()
      showToast.success('소재 수정 완료')
    } catch (e) {
      showToast.error('수정 실패', e)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        let errMsg = '저장 실패'
        try { const j = await res.json(); if (j && typeof j.error === 'string') errMsg = j.error } catch { /* */ }
        throw new Error(errMsg)
      }
      showToast.success('가격 정책 저장 완료')
    } catch (e) {
      showToast.error('저장 실패', e)
    }
  }

  /** 가격 정책 탭: 운영 지표(operating_rate, operating_detail)만 저장 */
  const handleSaveSettingsPricingOnly = async () => {
    try {
      const payload = [
        { key: 'operating_rate', value: settings.find((s) => s.key === 'operating_rate')?.value ?? '82', description: '가동률 (%)' },
        { key: 'operating_detail', value: settings.find((s) => s.key === 'operating_detail')?.value ?? '프린터 12/15대 가동중', description: '가동 상세' },
      ]
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let errMsg = '저장 실패'
        try { const j = await res.json(); if (j && typeof j.error === 'string') errMsg = j.error } catch { /* */ }
        throw new Error(errMsg)
      }
      showToast.success('운영 지표 저장 완료')
    } catch (e) {
      showToast.error('저장 실패', e)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => {
      const i = prev.findIndex((s) => s.key === key)
      if (i >= 0) return prev.map((s) => (s.key === key ? { ...s, value } : s))
      const newItem: PrintSetting = {
        key,
        value,
        category: '',
        description: key === 'operating_rate' ? '가동률 (%)' : '가동 상세',
        updatedAt: new Date().toISOString(),
      }
      return [...prev, newItem]
    })
  }

  const typeBadge = (t: string) => {
    if (t === 'FDM') return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    if (t === 'SLA') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    if (t === 'DLP') return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    return 'bg-white/10 text-white/60'
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">설정 및 소재 관리</h1>
        <p className="text-white/50 text-sm mt-1">장비별 최대 출력 크기, 소재, 가격 정책을 관리합니다.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex-wrap sm:flex-nowrap">
          <TabsTrigger value="store" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 text-white/50 hover:text-white transition-colors">
            <Store className="w-4 h-4" /> 기본 설정
          </TabsTrigger>
          <TabsTrigger value="equipment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 text-white/50 hover:text-white transition-colors">
            <Printer className="w-4 h-4" /> 장비 설정
          </TabsTrigger>
          <TabsTrigger value="materials" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-white/50 hover:text-white transition-colors">소재</TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-white/50 hover:text-white transition-colors">가격 정책</TabsTrigger>
        </TabsList>

        {/* 상점 기본 설정 */}
        <TabsContent value="store" className="space-y-4">
          <Card className="bg-white/[0.03] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">상점 기본 설정 (배송비 등)</CardTitle>
              <CardDescription className="text-white/50">사용자에게 노출되는 기본 배송비 및 무료 배송 기준 등을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-white/50 uppercase">기본 배송비 (원)</Label>
                  <Input 
                    type="number" 
                    value={storeConfigs.find(s => s.setting_key === 'shipping_base_fee')?.setting_value || ''} 
                    onChange={e => handleStoreConfigChange('shipping_base_fee', e.target.value)} 
                    className="bg-white/5 border-white/10 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-white/50 uppercase">무료 배송 기준액 (원)</Label>
                  <Input 
                    type="number" 
                    value={storeConfigs.find(s => s.setting_key === 'shipping_free_threshold')?.setting_value || ''} 
                    onChange={e => handleStoreConfigChange('shipping_free_threshold', e.target.value)} 
                    className="bg-white/5 border-white/10 text-white" 
                  />
                  <p className="text-[10px] text-white/40 mt-1">결제 예상 금액이 이 기준을 넘으면 배송비가 무료가 됩니다.</p>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveStoreConfigs} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" /> 설정 저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 장비 설정: FDM, SLA, DLP */}
        <TabsContent value="equipment" className="space-y-6">
          {(['FDM', 'SLA', 'DLP'] as const).map((t) => {
            const f = equipForms[t] || getDefaultForm(t)
            return (
              <Card key={t} className="bg-white/[0.03] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-sm ${typeBadge(t)}`}>{t}</span>
                    {f.name && <span className="text-white/60 font-normal">{f.name}</span>}
                  </CardTitle>
                  <CardDescription className="text-white/50">
                    최대 출력 크기(mm), 시간당 비용, 적용 레이어 두께를 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-[10px] text-white/50 uppercase">이름 (선택)</Label>
                      <Input className="mt-1 bg-white/5 border-white/10 text-white" placeholder={`기본 ${t}`} value={f.name} onChange={(e) => setEquip(t, 'name', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-white/50 uppercase">최대 X (mm)</Label>
                      <Input type="number" className="mt-1 bg-white/5 border-white/10 text-white" value={f.max_x_mm} onChange={(e) => setEquip(t, 'max_x_mm', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-white/50 uppercase">최대 Y (mm)</Label>
                      <Input type="number" className="mt-1 bg-white/5 border-white/10 text-white" value={f.max_y_mm} onChange={(e) => setEquip(t, 'max_y_mm', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-white/50 uppercase">최대 Z (mm)</Label>
                      <Input type="number" className="mt-1 bg-white/5 border-white/10 text-white" value={f.max_z_mm} onChange={(e) => setEquip(t, 'max_z_mm', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[10px] text-white/50 uppercase">기본 시간당 비용 (원)</Label>
                      <Input type="number" className="mt-1 bg-white/5 border-white/10 text-white" value={f.hourly_rate} onChange={(e) => setEquip(t, 'hourly_rate', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-white/50 uppercase">기본금액 · 최소 견적 (원)</Label>
                      <Input type="number" min="0" placeholder="미설정 시 산출금액 그대로" className="mt-1 bg-white/5 border-white/10 text-white" value={f.min_price_krw ?? ''} onChange={(e) => setEquip(t, 'min_price_krw', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} />
                      <p className="text-[10px] text-white/40 mt-0.5">자동견적이 이 금액 미만이면 기본금액으로 책정됩니다.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[10px] text-white/50 uppercase">레이어 두께 (예: 0.1, 0.2, 0.3)</Label>
                      <Input className="mt-1 bg-white/5 border-white/10 text-white" placeholder="0.1, 0.2, 0.3" value={f.layer_heights_json} onChange={(e) => setEquip(t, 'layer_heights_json', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-white/50 uppercase">레이어별 시간당 비용 (원) — 견적 시 적용</Label>
                    <p className="text-[10px] text-white/40 mt-0.5">선택한 레이어 두께마다 다른 비용을 둘 수 있습니다. 미입력 시 위 기본 시간당 비용이 사용됩니다.</p>
                    <div className="mt-2 rounded-lg border border-white/10 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-white/10 bg-white/5"><th className="p-2 text-left text-white/70 font-medium">레이어 두께 (mm)</th><th className="p-2 text-left text-white/70 font-medium">시간당 비용 (원)</th></tr></thead>
                        <tbody>
                          {String(f.layer_heights_json || '')
                            .split(',')
                            .map((s) => parseFloat(s.trim()))
                            .filter(Number.isFinite)
                            .map((th) => (
                              <tr key={th} className="border-b border-white/5">
                                <td className="p-2 text-white/90">{th} mm</td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    className="h-9 bg-white/5 border-white/10 text-white w-32"
                                    value={(f.layer_costs && f.layer_costs[String(th)] != null) ? f.layer_costs[String(th)] : f.hourly_rate}
                                    onChange={(e) => setEquipLayerCost(t, String(th), parseFloat(e.target.value) || 0)}
                                  />
                                </td>
                              </tr>
                            ))}
                          {String(f.layer_heights_json || '').split(',').map((s) => parseFloat(s.trim())).filter(Number.isFinite).length === 0 && (
                            <tr><td colSpan={2} className="p-3 text-white/40 text-xs">레이어 두께를 위에 입력한 후 저장하면 여기서 각각 비용을 설정할 수 있습니다.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-white/50 uppercase">견적 산출 기준 — 출력 시간·인건비·지지/소모품/후가공 (상세보기·견적 금액 연동)</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {t === 'FDM' && (
                        <>
                          <div>
                            <Label className="text-[10px] text-white/40">레이어당 소요 시간 (h)</Label>
                            <Input type="number" step="0.01" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.fdm_layer_hours_factor ?? 0.02} onChange={(e) => setEquip(t, 'fdm_layer_hours_factor', parseFloat(e.target.value) || 0.02)} />
                          </div>
                          <div>
                            <Label className="text-[10px] text-white/40">인건비 (원)</Label>
                            <Input type="number" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.fdm_labor_cost_krw ?? 6500} onChange={(e) => setEquip(t, 'fdm_labor_cost_krw', parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label className="text-[10px] text-white/40">지지 구조 단가 (원/cm²)</Label>
                            <Input type="number" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.fdm_support_per_cm2_krw ?? 26} onChange={(e) => setEquip(t, 'fdm_support_per_cm2_krw', parseFloat(e.target.value) || 0)} />
                          </div>
                        </>
                      )}
                      {t === 'SLA' && (
                        <>
                          <div>
                            <Label className="text-[10px] text-white/40">레이어당 노출 시간 (초)</Label>
                            <Input type="number" step="0.1" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.sla_layer_exposure_sec ?? 8} onChange={(e) => setEquip(t, 'sla_layer_exposure_sec', parseFloat(e.target.value) || 8)} />
                          </div>
                          <div>
                            <Label className="text-[10px] text-white/40">인건비 (원)</Label>
                            <Input type="number" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.sla_labor_cost_krw ?? 9100} onChange={(e) => setEquip(t, 'sla_labor_cost_krw', parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label className="text-[10px] text-white/40">소모품비 (원)</Label>
                            <Input type="number" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.sla_consumables_krw ?? 3900} onChange={(e) => setEquip(t, 'sla_consumables_krw', parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label className="text-[10px] text-white/40">후가공 비용 (원)</Label>
                            <Input type="number" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.sla_post_process_krw ?? 10400} onChange={(e) => setEquip(t, 'sla_post_process_krw', parseFloat(e.target.value) || 0)} />
                          </div>
                        </>
                      )}
                      {t === 'DLP' && (
                        <>
                          <div>
                            <Label className="text-[10px] text-white/40">레이어당 노출 시간 (초)</Label>
                            <Input type="number" step="0.1" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.dlp_layer_exposure_sec ?? 3} onChange={(e) => setEquip(t, 'dlp_layer_exposure_sec', parseFloat(e.target.value) || 3)} />
                          </div>
                          <div>
                            <Label className="text-[10px] text-white/40">인건비 (원)</Label>
                            <Input type="number" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.dlp_labor_cost_krw ?? 9100} onChange={(e) => setEquip(t, 'dlp_labor_cost_krw', parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label className="text-[10px] text-white/40">소모품비 (원)</Label>
                            <Input type="number" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.dlp_consumables_krw ?? 3900} onChange={(e) => setEquip(t, 'dlp_consumables_krw', parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label className="text-[10px] text-white/40">후가공 비용 (원)</Label>
                            <Input type="number" min="0" className="mt-1 bg-white/5 border-white/10 text-white h-9" value={f.dlp_post_process_krw ?? 10400} onChange={(e) => setEquip(t, 'dlp_post_process_krw', parseFloat(e.target.value) || 0)} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveEquipment(t)} disabled={savingEquip === t}>
                      {savingEquip === t ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="ml-2">저장</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* 가격 정책 계산기 */}

        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card className="bg-white/[0.03] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>소재 목록</CardTitle>
                <CardDescription>FDM / SLA / DLP 견적에 사용되는 소재</CardDescription>
              </div>
              <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" /> 소재 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>새 소재 추가</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">이름</Label>
                      <Input className="col-span-3 bg-white/5 border-white/10" value={newMaterial.name} onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} placeholder="예: PLA Plus" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">타입</Label>
                      <Select value={newMaterial.type} onValueChange={(v) => setNewMaterial({ ...newMaterial, type: v })}>
                        <SelectTrigger className="col-span-3 bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FDM">FDM</SelectItem>
                          <SelectItem value="SLA">SLA</SelectItem>
                          <SelectItem value="DLP">DLP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newMaterial.type === 'FDM' ? (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">g당 가격 (원)</Label>
                        <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={newMaterial.pricePerGram ?? ''} onChange={(e) => setNewMaterial({ ...newMaterial, pricePerGram: parseFloat(e.target.value) || 0 })} placeholder="FDM 필라멘트 가격" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">mL당 가격 (원)</Label>
                        <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={newMaterial.pricePerMl ?? ''} onChange={(e) => setNewMaterial({ ...newMaterial, pricePerMl: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })} placeholder="SLA/DLP 레진 가격" />
                      </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">밀도</Label>
                      <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={newMaterial.density ?? ''} onChange={(e) => setNewMaterial({ ...newMaterial, density: parseFloat(e.target.value) || 1.24 })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">설명 (선택)</Label>
                      <Input className="col-span-3 bg-white/5 border-white/10" value={(newMaterial as any).description || ''} onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })} placeholder="소재 설명" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddMaterial}>추가하기</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-4 font-medium text-white/70">이름</th>
                      <th className="p-4 font-medium text-white/70">타입</th>
                      <th className="p-4 font-medium text-white/70">가격</th>
                      <th className="p-4 font-medium text-white/70">밀도</th>
                      <th className="p-4 font-medium text-white/70">설명</th>
                      <th className="p-4 font-medium text-right text-white/70">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, index) => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 font-medium text-white">{m.name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${typeBadge(m.type || '')}`}>{m.type}</span>
                        </td>
                        <td className="p-4 text-white/90">
                          {m.type === 'FDM'
                            ? `${m.pricePerGram}원/g`
                            : (m.pricePerMl != null && m.pricePerMl > 0
                              ? `${m.pricePerMl}원/mL`
                              : <span className="text-amber-400 text-xs">미설정</span>)
                          }
                        </td>
                        <td className="p-4 text-white/90">{m.density}</td>
                        <td className="p-4 text-white/50 max-w-[160px] truncate" title={(m as any).description}>{(m as any).description || '-'}</td>
                        <td className="p-4 text-right flex items-center justify-end gap-1">
                          <div className="flex flex-col mr-2 bg-white/5 rounded overflow-hidden">
                            <button
                              className="p-1 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                              onClick={() => handleMoveMaterial(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              className="p-1 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                              onClick={() => handleMoveMaterial(index, 'down')}
                              disabled={index === materials.length - 1}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" onClick={() => openEdit(m)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteMaterial(m.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={!!editingMaterial} onOpenChange={(o) => !o && setEditingMaterial(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>소재 수정</DialogTitle>
              </DialogHeader>
              {editingMaterial && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">이름</Label>
                    <Input className="col-span-3 bg-white/5 border-white/10" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">타입</Label>
                    <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                      <SelectTrigger className="col-span-3 bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FDM">FDM</SelectItem>
                        <SelectItem value="SLA">SLA</SelectItem>
                        <SelectItem value="DLP">DLP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editForm.type === 'FDM' ? (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">g당 가격 (원)</Label>
                      <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={editForm.pricePerGram ?? ''} onChange={(e) => setEditForm({ ...editForm, pricePerGram: parseFloat(e.target.value) || 0 })} placeholder="FDM 필라멘트 가격" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">mL당 가격 (원)</Label>
                      <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={editForm.pricePerMl ?? ''} onChange={(e) => setEditForm({ ...editForm, pricePerMl: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })} placeholder="SLA/DLP 레진 가격" />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">밀도</Label>
                    <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={editForm.density ?? ''} onChange={(e) => setEditForm({ ...editForm, density: parseFloat(e.target.value) || 1.24 })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">설명</Label>
                    <Input className="col-span-3 bg-white/5 border-white/10" value={(editForm as any).description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="소재 설명" />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingMaterial(null)}>취소</Button>
                <Button onClick={handleSaveMaterialEdit}>저장</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card className="bg-white/[0.03] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">운영 지표 (대시보드 표시용)</CardTitle>
              <CardDescription className="text-white/50">관리자 대시보드에 표시되는 가동률·가동 상세만 설정합니다. 시간당 비용·최소 견적은 장비 설정 탭에서 관리하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['operating_rate', 'operating_detail'].map((key) => {
                const s = settings.find((x) => x.key === key) || { key, value: key === 'operating_rate' ? '82' : '프린터 12/15대 가동중', description: key === 'operating_rate' ? '가동률 (%)' : '가동 상세' }
                return (
                  <div key={s.key} className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 py-3 border-b border-white/5 last:border-0">
                    <div className="font-medium text-sm text-white/90">
                      {s.description || s.key}
                      <div className="text-xs text-white/40">{s.key}</div>
                    </div>
                    <Input
                      type={s.key === 'operating_detail' ? 'text' : 'number'}
                      value={s.value}
                      onChange={(e) => handleSettingChange(s.key, e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder={s.key === 'operating_detail' ? '예: 프린터 12/15대 가동중' : undefined}
                    />
                  </div>
                )
              })}
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSaveSettingsPricingOnly()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" /> 변경사항 저장
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 가격 정책 계산기 */}
          <PricingCalculator equipmentParams={{
            fdm: equipForms.FDM ? {
              hourly_rate: equipForms.FDM.hourly_rate,
              layer_costs: equipForms.FDM.layer_costs,
              fdm_layer_hours_factor: equipForms.FDM.fdm_layer_hours_factor ?? 0.02,
              fdm_labor_cost_krw: equipForms.FDM.fdm_labor_cost_krw ?? 6500,
              fdm_support_per_cm2_krw: equipForms.FDM.fdm_support_per_cm2_krw ?? 26,
              sla_layer_exposure_sec: 0,
              sla_labor_cost_krw: 0,
              sla_consumables_krw: 0,
              sla_post_process_krw: 0,
              dlp_layer_exposure_sec: 0,
              dlp_labor_cost_krw: 0,
              dlp_consumables_krw: 0,
              dlp_post_process_krw: 0,
            } : undefined,
            sla: equipForms.SLA ? {
              hourly_rate: equipForms.SLA.hourly_rate,
              layer_costs: equipForms.SLA.layer_costs,
              fdm_layer_hours_factor: 0,
              fdm_labor_cost_krw: 0,
              fdm_support_per_cm2_krw: 0,
              sla_layer_exposure_sec: equipForms.SLA.sla_layer_exposure_sec ?? 8,
              sla_labor_cost_krw: equipForms.SLA.sla_labor_cost_krw ?? 9100,
              sla_consumables_krw: equipForms.SLA.sla_consumables_krw ?? 3900,
              sla_post_process_krw: equipForms.SLA.sla_post_process_krw ?? 10400,
              dlp_layer_exposure_sec: 0,
              dlp_labor_cost_krw: 0,
              dlp_consumables_krw: 0,
              dlp_post_process_krw: 0,
            } : undefined,
            dlp: equipForms.DLP ? {
              hourly_rate: equipForms.DLP.hourly_rate,
              layer_costs: equipForms.DLP.layer_costs,
              fdm_layer_hours_factor: 0,
              fdm_labor_cost_krw: 0,
              fdm_support_per_cm2_krw: 0,
              sla_layer_exposure_sec: 0,
              sla_labor_cost_krw: 0,
              sla_consumables_krw: 0,
              sla_post_process_krw: 0,
              dlp_layer_exposure_sec: equipForms.DLP.dlp_layer_exposure_sec ?? 3,
              dlp_labor_cost_krw: equipForms.DLP.dlp_labor_cost_krw ?? 9100,
              dlp_consumables_krw: equipForms.DLP.dlp_consumables_krw ?? 3900,
              dlp_post_process_krw: equipForms.DLP.dlp_post_process_krw ?? 10400,
            } : undefined,
          }} />

          {/* 프리셋 */}
          <PricingPresets onApplyPreset={(preset) => {
            // 프리셋 적용
            const newForms = { ...equipForms }
            if (preset.equipment.fdm) {
              newForms.FDM = { ...equipForms.FDM, ...preset.equipment.fdm }
            }
            if (preset.equipment.sla) {
              newForms.SLA = { ...equipForms.SLA, ...preset.equipment.sla }
            }
            if (preset.equipment.dlp) {
              newForms.DLP = { ...equipForms.DLP, ...preset.equipment.dlp }
            }
            setEquipForms(newForms)
            showToast.success(`"${preset.name}" 프리셋이 적용되었습니다`, '각 장비 탭에서 저장 버튼을 눌러 변경사항을 확정하세요.')
          }} />
        </TabsContent>

      </Tabs>
    </div>
  )
}
