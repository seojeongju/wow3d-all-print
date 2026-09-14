'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { CustomProductPublic } from '@/lib/custom-products'
import { Loader2, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminCustomProductsPage() {
    const { token } = useAuthStore()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<CustomProductPublic[]>([])

    const authHeader = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
        [token]
    )

    const load = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/custom-products', { headers: authHeader })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '조회 실패')
            setItems(j.data.items || [])
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '목록을 불러오지 못했습니다.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [token, authHeader, toast])

    useEffect(() => {
        void load()
    }, [load])

    const deleteProduct = async (p: CustomProductPublic) => {
        if (!p.id || p.id < 1) return
        if (!confirm(`「${p.title}」 상품을 삭제할까요?`)) return
        try {
            const res = await fetch(`/api/admin/custom-products/${p.id}`, {
                method: 'DELETE',
                headers: authHeader,
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '삭제 실패')
            toast({ title: '삭제 완료' })
            await load()
        } catch (e) {
            toast({
                title: '삭제 실패',
                description: e instanceof Error ? e.message : '삭제에 실패했습니다.',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="space-y-6 p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">맞춤 상품</h1>
                    <p className="text-sm text-white/50 mt-1">
                        스마트스토어형으로 상품을 등록·수정하고 `/custom`에 노출합니다.
                    </p>
                </div>
                <Link href="/admin/custom-products/new">
                    <Button className="gap-2 bg-[#03c75a] hover:bg-[#02b351] text-white font-bold">
                        <Plus className="w-4 h-4" /> 상품 등록
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#03c75a]" />
                </div>
            ) : items.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="py-16 text-center space-y-4">
                        <p className="text-white/50">등록된 맞춤 상품이 없습니다.</p>
                        <Link href="/admin/custom-products/new">
                            <Button className="bg-[#03c75a] hover:bg-[#02b351] text-white font-bold gap-2">
                                <Plus className="w-4 h-4" /> 첫 상품 등록하기
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((p) => (
                        <Card
                            key={p.id ?? p.slug}
                            className="bg-white/5 border-white/10 overflow-hidden"
                        >
                            <div className="aspect-[4/3] bg-black/30 relative">
                                <img
                                    src={p.images[0] || '/placeholder-3d.svg'}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                />
                                <span
                                    className={cn(
                                        'absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded',
                                        p.isActive
                                            ? 'bg-[#03c75a] text-white'
                                            : 'bg-white/20 text-white'
                                    )}
                                >
                                    {p.isActive ? '노출' : '숨김'}
                                </span>
                            </div>
                            <CardContent className="p-4 space-y-3">
                                <div>
                                    <h2 className="font-bold text-white truncate">{p.title}</h2>
                                    <p className="text-xs text-white/40 font-mono">/{p.slug}</p>
                                    <p className="text-sm text-[#03c75a] font-bold mt-1">{p.priceNote}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link href={`/admin/custom-products/${p.id}`}>
                                        <Button size="sm" variant="outline" className="border-white/15">
                                            <Pencil className="w-3.5 h-3.5 mr-1" /> 수정
                                        </Button>
                                    </Link>
                                    <Link href={`/custom/${p.slug}`} target="_blank">
                                        <Button size="sm" variant="outline" className="border-white/15">
                                            <Eye className="w-3.5 h-3.5 mr-1" /> 보기
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-rose-300 hover:text-rose-200"
                                        onClick={() => deleteProduct(p)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
