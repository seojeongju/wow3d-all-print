'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Save, Trash2, Loader2, Printer, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Material, PrintSetting } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
}

const EQUIPMENT_DEFAULTS: Record<string, Partial<EquipmentRow>> = {
  FDM: { max_x_mm: 220, max_y_mm: 220, max_z_mm: 250, hourly_rate: 5000, layer_heights_json: '[0.1,0.2,0.3]' },
  SLA: { max_x_mm: 145, max_y_mm: 145, max_z_mm: 175, hourly_rate: 8000, layer_heights_json: '[0.025,0.05,0.1]' },
  DLP: { max_x_mm: 120, max_y_mm: 68, max_z_mm: 200, hourly_rate: 9000, layer_heights_json: '[0.025,0.05,0.1]' },
}

export default function AdminSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [materials, setMaterials] = useState<Material[]>([])
  const [settings, setSettings] = useState<PrintSetting[]>([])
  const [equipment, setEquipment] = useState<EquipmentRow[]>([])

  const [isAddingMaterial, setIsAddingMaterial] = useState(false)
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: '',
    type: 'FDM',
    pricePerGram: 0,
    density: 1.24,
    colors: ['#FFFFFF'],
  })

  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [editForm, setEditForm] = useState<Partial<Material>>({})
  const [savingEquip, setSavingEquip] = useState<string | null>(null)
  const [equipForms, setEquipForms] = useState<Record<string, { name: string; max_x_mm: number; max_y_mm: number; max_z_mm: number; hourly_rate: number; layer_heights_json: string; layer_costs: Record<string, number> }>>({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const next: Record<string, { name: string; max_x_mm: number; max_y_mm: number; max_z_mm: number; hourly_rate: number; layer_heights_json: string; layer_costs: Record<string, number> }> = {}
    for (const t of ['FDM', 'SLA', 'DLP']) {
      const e = equipment.find((x) => x.type === t)
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
      }
    }
    setEquipForms(next)
  }, [equipment])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [matRes, setRes, eqRes] = await Promise.all([
        fetch('/api/admin/materials'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/equipment').catch(() => ({ json: () => ({ success: false, data: [] }) })),
      ])
      const matData = await matRes.json()
      const setData = await setRes.json()
      const eqData = await eqRes.json()

      if (matData.success) {
        setMaterials(
          (matData.data || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            pricePerGram: m.price_per_gram,
            density: m.density,
            colors: JSON.parse(m.colors || '[]'),
            isActive: m.is_active,
            description: m.description,
          }))
        )
      }
      if (setData.success) setSettings(setData.data || [])
      if (eqData.success) setEquipment(eqData.data || [])
    } catch (e) {
      toast({ title: '데이터 로딩 실패', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const getDefaultForm = (t: string) => {
    const d = EQUIPMENT_DEFAULTS[t]
    const arr = (d?.layer_heights_json as string)?.replace(/[\[\]]/g, '').split(',').map((x) => x.trim()).filter(Boolean).join(', ') || (t === 'FDM' ? '0.1, 0.2, 0.3' : '0.025, 0.05, 0.1')
    return { name: '', max_x_mm: (d?.max_x_mm as number) || 220, max_y_mm: (d?.max_y_mm as number) || 220, max_z_mm: (d?.max_z_mm as number) || 250, hourly_rate: (d?.hourly_rate as number) || 5000, layer_heights_json: arr, layer_costs: {} }
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
        headers: { 'Content-Type': 'application/json' },
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
      toast({ title: `${type} 장비 설정 저장 완료` })
      fetchData()
    } catch (e) {
      toast({ title: '저장 실패', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
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
      await fetch(`/api/admin/materials?id=${id}`, { method: 'DELETE' })
      setMaterials((m) => m.filter((x) => x.id !== id))
      toast({ title: '자재 삭제 완료' })
    } catch {
      toast({ title: '삭제 실패', variant: 'destructive' })
    }
  }

  const handleAddMaterial = async () => {
    try {
      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMaterial.name,
          type: (newMaterial.type || 'FDM').toUpperCase(),
          pricePerGram: newMaterial.pricePerGram ?? 0,
          density: newMaterial.density ?? 1.24,
          colors: newMaterial.colors || ['#FFFFFF'],
          description: (newMaterial as any).description || undefined,
        }),
      })
      if (!res.ok) {
        let errMsg = '추가 실패'
        try { const j = await res.json(); if (j && typeof j.error === 'string') errMsg = j.error } catch { /* */ }
        throw new Error(errMsg)
      }
      setIsAddingMaterial(false)
      fetchData()
      toast({ title: '자재 추가 완료' })
      setNewMaterial({ name: '', type: 'FDM', pricePerGram: 0, density: 1.24, colors: ['#FFFFFF'] })
    } catch (e) {
      toast({ title: '추가 실패', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    }
  }

  const openEdit = (m: Material) => {
    setEditingMaterial(m)
    setEditForm({ name: m.name, type: m.type, pricePerGram: m.pricePerGram, density: m.density, colors: m.colors || [], description: (m as any).description })
  }
  const handleSaveMaterialEdit = async () => {
    if (!editingMaterial) return
    try {
      const res = await fetch(`/api/admin/materials/${editingMaterial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          type: (editForm.type || 'FDM').toUpperCase(),
          pricePerGram: editForm.pricePerGram,
          density: editForm.density,
          colors: editForm.colors || ['#FFFFFF'],
          description: (editForm as any).description ?? undefined,
        }),
      })
      if (!res.ok) {
        let errMsg = '수정 실패'
        try { const j = await res.json(); if (j && typeof j.error === 'string') errMsg = j.error } catch { /* */ }
        throw new Error(errMsg)
      }
      setEditingMaterial(null)
      fetchData()
      toast({ title: '자재 수정 완료' })
    } catch (e) {
      toast({ title: '수정 실패', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    }
  }

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        let errMsg = '저장 실패'
        try { const j = await res.json(); if (j && typeof j.error === 'string') errMsg = j.error } catch { /* */ }
        throw new Error(errMsg)
      }
      toast({ title: '가격 정책 저장 완료' })
    } catch (e) {
      toast({ title: '저장 실패', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)))
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
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">설정 및 자재 관리</h1>
        <p className="text-white/50 text-sm mt-1">장비별 최대 출력 크기, 자재, 가격 정책을 관리합니다.</p>
      </div>

      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger value="equipment" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Printer className="w-4 h-4" /> 장비 설정
          </TabsTrigger>
          <TabsTrigger value="materials" className="data-[state=active]:bg-primary data-[state=active]:text-white">자재</TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-primary data-[state=active]:text-white">가격 정책</TabsTrigger>
        </TabsList>

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
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card className="bg-white/[0.03] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>자재 목록</CardTitle>
                <CardDescription>FDM / SLA / DLP 견적에 사용되는 자재</CardDescription>
              </div>
              <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" /> 자재 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>새 자재 추가</DialogTitle>
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
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">g당 가격</Label>
                      <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={newMaterial.pricePerGram || ''} onChange={(e) => setNewMaterial({ ...newMaterial, pricePerGram: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">밀도</Label>
                      <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={newMaterial.density || ''} onChange={(e) => setNewMaterial({ ...newMaterial, density: parseFloat(e.target.value) || 1.24 })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">설명 (선택)</Label>
                      <Input className="col-span-3 bg-white/5 border-white/10" value={(newMaterial as any).description || ''} onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })} placeholder="자재 설명" />
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
                      <th className="p-4 font-medium text-white/70">g당 가격(원)</th>
                      <th className="p-4 font-medium text-white/70">밀도</th>
                      <th className="p-4 font-medium text-white/70">설명</th>
                      <th className="p-4 font-medium text-right text-white/70">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 font-medium text-white">{m.name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${typeBadge(m.type || '')}`}>{m.type}</span>
                        </td>
                        <td className="p-4 text-white/90">{m.pricePerGram}원</td>
                        <td className="p-4 text-white/90">{m.density}</td>
                        <td className="p-4 text-white/50 max-w-[160px] truncate" title={(m as any).description}>{(m as any).description || '-'}</td>
                        <td className="p-4 text-right flex items-center justify-end gap-1">
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
                <DialogTitle>자재 수정</DialogTitle>
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">g당 가격</Label>
                    <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={editForm.pricePerGram ?? ''} onChange={(e) => setEditForm({ ...editForm, pricePerGram: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">밀도</Label>
                    <Input type="number" className="col-span-3 bg-white/5 border-white/10" value={editForm.density ?? ''} onChange={(e) => setEditForm({ ...editForm, density: parseFloat(e.target.value) || 1.24 })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">설명</Label>
                    <Input className="col-span-3 bg-white/5 border-white/10" value={(editForm as any).description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="자재 설명" />
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
              <CardTitle className="text-white">기본 가격 정책</CardTitle>
              <CardDescription className="text-white/50">최소 주문 금액 등 전역 설정 (장비별 시간당 비용은 장비 설정에서)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.map((s) => (
                <div key={s.key} className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 py-3 border-b border-white/5 last:border-0">
                  <div className="font-medium text-sm text-white/90">
                    {s.description || s.key}
                    <div className="text-xs text-white/40">{s.key}</div>
                  </div>
                  <Input type="number" value={s.value} onChange={(e) => handleSettingChange(s.key, e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" /> 변경사항 저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
