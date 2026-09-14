'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Eye,
    Loader2,
    Plus,
    Trash2,
    X,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/hooks/use-toast'
import type { CustomProductImageRole, CustomProductPublic } from '@/lib/custom-products'
import { cn } from '@/lib/utils'
import {
    CollapsibleSection,
    FieldLabel,
    SegmentedControl,
    Tip,
} from './FormUi'
import {
    emptyCustomProductForm,
    formToPayload,
    productToForm,
    type CustomProductFormState,
} from './form-types'

const TITLE_MAX = 100
const SUMMARY_MAX = 80
const SUB_MAX = 9
const DETAIL_MAX = 20

const inputClass =
    'w-full h-11 rounded-md border border-[#d1d5db] bg-white px-3 text-[14px] text-[#1e2124] outline-none focus:border-[#03c75a] focus:ring-1 focus:ring-[#03c75a]/30'
const textareaClass =
    'w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2.5 text-[14px] text-[#1e2124] outline-none focus:border-[#03c75a] focus:ring-1 focus:ring-[#03c75a]/30 resize-y'

function CharCount({ value, max }: { value: string; max: number }) {
    return (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#868b94] tabular-nums pointer-events-none">
            {value.length}/{max}
        </span>
    )
}

function ImageSlot({
    src,
    onRemove,
    onPick,
    disabled,
    label,
}: {
    src?: string
    onRemove?: () => void
    onPick: (file: File) => void
    disabled?: boolean
    label?: string
}) {
    return (
        <div className="relative">
            {src ? (
                <div className="relative w-[120px] h-[120px] rounded-md overflow-hidden border border-[#e5e8eb] bg-[#f7f8fa] group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <label
                        className={cn(
                            'absolute inset-0 bg-black/0 group-hover:bg-black/45 flex items-center justify-center cursor-pointer transition-colors',
                            disabled && 'pointer-events-none'
                        )}
                    >
                        <span className="opacity-0 group-hover:opacity-100 text-white text-[11px] font-bold">
                            교체
                        </span>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            disabled={disabled}
                            onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) onPick(f)
                                e.target.value = ''
                            }}
                        />
                    </label>
                    {onRemove ? (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/65 text-white flex items-center justify-center z-10"
                            aria-label="이미지 삭제"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    ) : null}
                </div>
            ) : (
                <label
                    className={cn(
                        'w-[120px] h-[120px] rounded-md border border-dashed border-[#c9cdd2] bg-[#fafbfc] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#03c75a] hover:bg-[#f3fff7] transition-colors',
                        disabled && 'opacity-50 pointer-events-none'
                    )}
                >
                    <Plus className="w-6 h-6 text-[#868b94]" />
                    {label ? (
                        <span className="text-[11px] font-bold text-[#868b94]">{label}</span>
                    ) : null}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={disabled}
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) onPick(f)
                            e.target.value = ''
                        }}
                    />
                </label>
            )}
        </div>
    )
}

export default function CustomProductEditor({ productId }: { productId?: number }) {
    const router = useRouter()
    const { token } = useAuthStore()
    const { toast } = useToast()
    const isEdit = typeof productId === 'number' && productId > 0

    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [form, setForm] = useState<CustomProductFormState>(emptyCustomProductForm)
    const [product, setProduct] = useState<CustomProductPublic | null>(null)
    const [detailMode, setDetailMode] = useState<'write' | 'html'>('write')

    const authHeader = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
        [token]
    )

    const loadProduct = useCallback(async () => {
        if (!isEdit || !token) return
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/custom-products/${productId}`, {
                headers: authHeader,
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '조회 실패')
            setProduct(j.data)
            setForm(productToForm(j.data))
        } catch (e) {
            toast({
                title: '오류',
                description: e instanceof Error ? e.message : '상품을 불러오지 못했습니다.',
                variant: 'destructive',
            })
            router.replace('/admin/custom-products')
        } finally {
            setLoading(false)
        }
    }, [isEdit, productId, token, authHeader, toast, router])

    useEffect(() => {
        void loadProduct()
    }, [loadProduct])

    const patch = <K extends keyof CustomProductFormState>(
        key: K,
        value: CustomProductFormState[K]
    ) => setForm((prev) => ({ ...prev, [key]: value }))

    const saveProduct = async (opts?: { silent?: boolean; navigateOnCreate?: boolean }) => {
        if (!form.title.trim()) {
            toast({ title: '입력 오류', description: '상품명을 입력하세요.', variant: 'destructive' })
            return null
        }
        setSaving(true)
        try {
            const payload = formToPayload(form)
            const res = await fetch(
                isEdit ? `/api/admin/custom-products/${productId}` : '/api/admin/custom-products',
                {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: { ...authHeader, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            )
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '저장 실패')

            if (!opts?.silent) {
                toast({ title: '저장 완료', description: '상품 정보가 저장되었습니다.' })
            }

            const newId = (j.data?.id as number | undefined) ?? productId ?? null

            if (!isEdit && newId && opts?.navigateOnCreate !== false) {
                router.replace(`/admin/custom-products/${newId}`)
                return newId
            }

            if (isEdit) await loadProduct()
            return newId
        } catch (e) {
            toast({
                title: '저장 실패',
                description: e instanceof Error ? e.message : '저장에 실패했습니다.',
                variant: 'destructive',
            })
            return null
        } finally {
            setSaving(false)
        }
    }

    const ensureSavedThenUpload = async (role: CustomProductImageRole, file: File) => {
        let id = productId
        let created = false
        if (!id || id < 1) {
            const createdId = await saveProduct({ silent: true, navigateOnCreate: false })
            if (!createdId) return
            id = createdId
            created = true
        }
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('image', file)
            fd.append('role', role)
            const res = await fetch(`/api/admin/custom-products/${id}/images`, {
                method: 'POST',
                headers: authHeader,
                body: fd,
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '업로드 실패')
            toast({ title: created ? '상품 저장 및 이미지 업로드 완료' : '업로드 완료' })
            if (created) {
                router.replace(`/admin/custom-products/${id}`)
            } else {
                await loadProduct()
            }
        } catch (e) {
            toast({
                title: '업로드 실패',
                description: e instanceof Error ? e.message : '업로드에 실패했습니다.',
                variant: 'destructive',
            })
            if (created) router.replace(`/admin/custom-products/${id}`)
        } finally {
            setUploading(false)
        }
    }

    const deleteImage = async (imageId: number) => {
        if (!confirm('이 이미지를 삭제할까요?')) return
        try {
            const res = await fetch(`/api/admin/custom-products/images/${imageId}`, {
                method: 'DELETE',
                headers: authHeader,
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || '삭제 실패')
            await loadProduct()
        } catch (e) {
            toast({
                title: '삭제 실패',
                description: e instanceof Error ? e.message : '이미지 삭제 실패',
                variant: 'destructive',
            })
        }
    }

    const mainImage = (product?.imageRows || []).find((i) => i.role === 'main')
    const subImages = (product?.imageRows || []).filter((i) => i.role === 'sub')
    const detailImages = (product?.imageRows || []).filter((i) => i.role === 'detail')

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f6f8]">
                <Loader2 className="w-8 h-8 animate-spin text-[#03c75a]" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-3.5rem)] bg-[#f5f6f8] text-[#1e2124] -m-6 lg:-m-8 pb-24">
            {/* 상단 탭 바 */}
            <div className="sticky top-0 z-30 bg-white border-b border-[#e5e8eb]">
                <div className="max-w-[1080px] mx-auto px-4 sm:px-6 flex items-end justify-between gap-4">
                    <div className="flex items-end gap-6">
                        <div className="pt-3 pb-0">
                            <span className="inline-block pb-3 text-[15px] font-bold text-[#1e2124] border-b-2 border-[#03c75a]">
                                {isEdit ? '상품 수정' : '상품 등록'}
                            </span>
                        </div>
                        <Link
                            href="/admin/custom-products"
                            className="pb-3 text-[14px] font-bold text-[#868b94] hover:text-[#1e2124]"
                        >
                            상품 목록
                        </Link>
                    </div>
                    <div className="py-2.5 flex items-center gap-2">
                        {form.slug ? (
                            <Link
                                href={`/custom/${form.slug}`}
                                target="_blank"
                                className="hidden sm:inline-flex h-8 items-center gap-1.5 px-3 rounded border border-[#d1d5db] text-[12px] font-bold text-[#555] hover:bg-[#f7f8fa]"
                            >
                                <Eye className="w-3.5 h-3.5" /> 미리보기
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-5 space-y-3">
                {/* 상품명 */}
                <CollapsibleSection title="상품명" required help="검색에 잘 걸리는 상품명을 권장합니다.">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <FieldLabel required>상품명</FieldLabel>
                        <div className="flex-1 space-y-2">
                            <div className="relative">
                                <input
                                    value={form.title}
                                    maxLength={TITLE_MAX}
                                    onChange={(e) => patch('title', e.target.value)}
                                    placeholder="상품명을 입력해 주세요"
                                    className={cn(inputClass, 'pr-16')}
                                />
                                <CharCount value={form.title} max={TITLE_MAX} />
                            </div>
                            <Tip>
                                고객이 검색할 키워드(용도·재질·사이즈)를 상품명에 자연스럽게 넣어 주세요.
                            </Tip>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-5">
                        <FieldLabel>URL 슬러그</FieldLabel>
                        <div className="flex-1 space-y-2">
                            <input
                                value={form.slug}
                                onChange={(e) =>
                                    patch(
                                        'slug',
                                        e.target.value
                                            .toLowerCase()
                                            .replace(/[^a-z0-9-가-힣]/g, '-')
                                    )
                                }
                                placeholder="비워두면 상품명으로 자동 생성"
                                className={cn(inputClass, 'font-mono text-[13px]')}
                            />
                            <Tip tone="gray">공개 URL: /custom/{form.slug || 'slug'}</Tip>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-5">
                        <FieldLabel>한줄 소개</FieldLabel>
                        <div className="flex-1 space-y-2">
                            <div className="relative">
                                <input
                                    value={form.summary}
                                    maxLength={SUMMARY_MAX}
                                    onChange={(e) => patch('summary', e.target.value)}
                                    placeholder="목록·상세 상단에 보이는 짧은 소개"
                                    className={cn(inputClass, 'pr-14')}
                                />
                                <CharCount value={form.summary} max={SUMMARY_MAX} />
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 이미지 */}
                <CollapsibleSection
                    title="상품이미지"
                    required
                    help="대표·추가·상세 이미지를 등록합니다."
                    summary={
                        mainImage
                            ? `대표 1 · 추가 ${subImages.length} · 상세 ${detailImages.length}`
                            : '미등록'
                    }
                >
                    {!isEdit ? (
                        <div className="mb-4">
                            <Tip tone="red">
                                이미지를 올리려면 먼저 하단 저장하기로 상품을 생성하세요. (+ 클릭 시 자동
                                저장 후 업로드됩니다)
                            </Tip>
                        </div>
                    ) : null}

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-2">
                        <FieldLabel required>대표이미지</FieldLabel>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-3 items-start">
                                {mainImage ? (
                                    <ImageSlot
                                        src={mainImage.url}
                                        disabled={uploading}
                                        onRemove={() => mainImage.id && deleteImage(mainImage.id)}
                                        onPick={(f) => void ensureSavedThenUpload('main', f)}
                                    />
                                ) : (
                                    <ImageSlot
                                        disabled={uploading}
                                        onPick={(f) => void ensureSavedThenUpload('main', f)}
                                    />
                                )}
                            </div>
                            <Tip>권장 사이즈: 1000 x 1000 (최소 300 x 300) · JPG, PNG, WebP, GIF</Tip>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-8">
                        <FieldLabel>
                            추가이미지
                            <span className="ml-1 text-[12px] font-normal text-[#868b94]">
                                ({subImages.length}/{SUB_MAX})
                            </span>
                        </FieldLabel>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-3">
                                {subImages.map((img) => (
                                    <ImageSlot
                                        key={img.id}
                                        src={img.url}
                                        disabled={uploading}
                                        onRemove={() => img.id && deleteImage(img.id)}
                                        onPick={(f) => void ensureSavedThenUpload('sub', f)}
                                    />
                                ))}
                                {subImages.length < SUB_MAX ? (
                                    <ImageSlot
                                        disabled={uploading}
                                        onPick={(f) => void ensureSavedThenUpload('sub', f)}
                                    />
                                ) : null}
                            </div>
                            <Tip>갤러리 썸네일로 노출됩니다. 여러 장 등록 가능합니다.</Tip>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-8">
                        <FieldLabel>
                            상세이미지
                            <span className="ml-1 text-[12px] font-normal text-[#868b94]">
                                ({detailImages.length}/{DETAIL_MAX})
                            </span>
                        </FieldLabel>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-3">
                                {detailImages.map((img) => (
                                    <ImageSlot
                                        key={img.id}
                                        src={img.url}
                                        disabled={uploading}
                                        onRemove={() => img.id && deleteImage(img.id)}
                                        onPick={(f) => void ensureSavedThenUpload('detail', f)}
                                    />
                                ))}
                                {detailImages.length < DETAIL_MAX ? (
                                    <ImageSlot
                                        disabled={uploading}
                                        onPick={(f) => void ensureSavedThenUpload('detail', f)}
                                    />
                                ) : null}
                            </div>
                            <Tip>상세설명 영역에 세로로 나열됩니다. 권장 가로 폭 848px 이상</Tip>
                        </div>
                    </div>

                    {uploading ? (
                        <p className="mt-4 text-[12px] text-[#03c75a] flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> 이미지 업로드 중…
                        </p>
                    ) : null}
                </CollapsibleSection>

                {/* 판매가 / 공정 */}
                <CollapsibleSection title="판매 정보" required summary={form.priceNote || '미입력'}>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <FieldLabel required>판매가 안내</FieldLabel>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 max-w-md">
                                <input
                                    value={form.priceNote}
                                    onChange={(e) => patch('priceNote', e.target.value)}
                                    placeholder="예: 맞춤 견적가"
                                    className={inputClass}
                                />
                            </div>
                            <Tip>고정가가 아닌 경우 「맞춤 견적가」 등 안내 문구를 입력하세요.</Tip>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-6">
                        <FieldLabel>출력 공정</FieldLabel>
                        <div className="flex-1">
                            <SegmentedControl
                                value={form.method}
                                onChange={(v) => patch('method', v)}
                                options={[
                                    { value: 'fdm', label: 'FDM' },
                                    { value: 'sla', label: 'SLA' },
                                    { value: 'dlp', label: 'DLP' },
                                    { value: 'mixed', label: '복합' },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-6">
                        <FieldLabel>주 버튼(CTA)</FieldLabel>
                        <div className="flex-1 space-y-3">
                            <SegmentedControl
                                value={form.primaryCta}
                                onChange={(v) => patch('primaryCta', v)}
                                options={[
                                    { value: 'quote', label: '자동견적' },
                                    { value: 'photo', label: '사진→3D' },
                                    { value: 'inquiry', label: '문의' },
                                ]}
                            />
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-[13px] font-bold text-[#555]">보조 버튼</span>
                                <SegmentedControl
                                    value={(form.secondaryCta || 'none') as 'none' | 'quote' | 'photo' | 'inquiry'}
                                    onChange={(v) =>
                                        patch(
                                            'secondaryCta',
                                            v === 'none' ? '' : v
                                        )
                                    }
                                    options={[
                                        { value: 'none', label: '없음' },
                                        { value: 'quote', label: '자동견적' },
                                        { value: 'photo', label: '사진→3D' },
                                        { value: 'inquiry', label: '문의' },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 옵션 */}
                <CollapsibleSection
                    title="상품 옵션"
                    summary={form.optionsText.trim() ? '설정함' : '설정안함'}
                    defaultOpen
                >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <FieldLabel>옵션 구성</FieldLabel>
                        <div className="flex-1 space-y-2">
                            <textarea
                                value={form.optionsText}
                                onChange={(e) => patch('optionsText', e.target.value)}
                                rows={6}
                                placeholder={'색상: 블랙, 화이트, 그레이\n사이즈: S, M, L'}
                                className={cn(textareaClass, 'font-mono text-[13px]')}
                            />
                            <Tip>한 줄에 하나 · 형식: 옵션명: 선택1, 선택2, 선택3</Tip>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-6">
                        <FieldLabel>하이라이트</FieldLabel>
                        <div className="flex-1 space-y-2">
                            <textarea
                                value={form.highlightsText}
                                onChange={(e) => patch('highlightsText', e.target.value)}
                                rows={4}
                                placeholder={'기종별 핏 맞춤\n시제품 빠른 검증'}
                                className={textareaClass}
                            />
                            <Tip tone="gray">상세 우측·요약에 체크 리스트로 표시됩니다. (줄바꿈 구분)</Tip>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 상세설명 */}
                <CollapsibleSection title="상세설명" required>
                    <div className="border-b border-[#e5e8eb] mb-4 flex gap-5">
                        <button
                            type="button"
                            onClick={() => setDetailMode('write')}
                            className={cn(
                                'pb-2.5 text-[13px] font-bold border-b-2 -mb-px',
                                detailMode === 'write'
                                    ? 'text-[#1e2124] border-[#03c75a]'
                                    : 'text-[#868b94] border-transparent'
                            )}
                        >
                            직접 작성
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailMode('html')}
                            className={cn(
                                'pb-2.5 text-[13px] font-bold border-b-2 -mb-px',
                                detailMode === 'html'
                                    ? 'text-[#1e2124] border-[#03c75a]'
                                    : 'text-[#868b94] border-transparent'
                            )}
                        >
                            고급(원문)
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <FieldLabel>상품 설명</FieldLabel>
                        <div className="flex-1 space-y-2">
                            <textarea
                                value={form.description}
                                onChange={(e) => patch('description', e.target.value)}
                                rows={3}
                                placeholder="상품 소개 문단"
                                className={textareaClass}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-6">
                        <FieldLabel required>상세 본문</FieldLabel>
                        <div className="flex-1 space-y-2">
                            {detailMode === 'write' ? (
                                <textarea
                                    value={form.detailBody}
                                    onChange={(e) => patch('detailBody', e.target.value)}
                                    rows={10}
                                    placeholder={
                                        '상세 페이지에 표시할 본문을 입력하세요.\n줄바꿈으로 문단을 구분합니다.'
                                    }
                                    className={textareaClass}
                                />
                            ) : (
                                <textarea
                                    value={form.detailBody}
                                    onChange={(e) => patch('detailBody', e.target.value)}
                                    rows={12}
                                    className={cn(textareaClass, 'font-mono text-[12px]')}
                                />
                            )}
                            <div className="space-y-1 pt-1">
                                <Tip tone="red">
                                    외부 쇼핑몰 링크·개인정보 수집 문구는 넣지 마세요.
                                </Tip>
                                <Tip>권장 가로 폭: 848px · 상세이미지는 위 「상품이미지」에서 등록</Tip>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 노출 */}
                <CollapsibleSection
                    title="노출 설정"
                    summary={form.isActive ? '공개' : '숨김'}
                    defaultOpen={false}
                >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <FieldLabel>공개 여부</FieldLabel>
                        <div className="flex-1 space-y-3">
                            <SegmentedControl
                                value={form.isActive ? 'on' : 'off'}
                                onChange={(v) => patch('isActive', v === 'on')}
                                options={[
                                    { value: 'on', label: '공개 노출' },
                                    { value: 'off', label: '숨김' },
                                ]}
                            />
                            <div className="flex items-center gap-3 max-w-xs">
                                <span className="text-[13px] font-bold text-[#555] w-16">정렬</span>
                                <input
                                    type="number"
                                    value={form.sortOrder}
                                    onChange={(e) => patch('sortOrder', Number(e.target.value) || 0)}
                                    className={cn(inputClass, 'h-9')}
                                />
                            </div>
                            <Tip tone="gray">숫자가 작을수록 목록 앞쪽에 표시됩니다.</Tip>
                        </div>
                    </div>
                </CollapsibleSection>
            </div>

            {/* 하단 고정 액션바 */}
            <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-40 border-t border-[#e5e8eb] bg-white/95 backdrop-blur">
                <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                    <p className="text-[12px] text-[#868b94] hidden sm:block">
                        {isEdit ? `상품 ID ${productId}` : '신규 등록'} · `/custom`에 반영
                    </p>
                    <div className="flex items-center gap-2 ml-auto">
                        {form.slug ? (
                            <Link
                                href={`/custom/${form.slug}`}
                                target="_blank"
                                className="h-10 px-4 rounded-md bg-[#4a4a4a] text-white text-[13px] font-bold inline-flex items-center hover:bg-[#333]"
                            >
                                미리보기
                            </Link>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => void saveProduct()}
                            disabled={saving}
                            className="h-10 px-5 rounded-md bg-[#03c75a] text-white text-[13px] font-bold hover:bg-[#02b351] disabled:opacity-60 inline-flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            저장하기
                        </button>
                        <Link
                            href="/admin/custom-products"
                            className="h-10 px-4 rounded-md border border-[#d1d5db] bg-white text-[13px] font-bold text-[#333] inline-flex items-center hover:bg-[#f7f8fa]"
                        >
                            취소
                        </Link>
                        {isEdit ? (
                            <button
                                type="button"
                                className="h-10 w-10 rounded-md border border-[#ffd0d0] text-[#ff5252] inline-flex items-center justify-center hover:bg-[#fff5f5]"
                                title="삭제"
                                onClick={async () => {
                                    if (!productId) return
                                    if (!confirm('이 상품을 삭제할까요?')) return
                                    const res = await fetch(`/api/admin/custom-products/${productId}`, {
                                        method: 'DELETE',
                                        headers: authHeader,
                                    })
                                    const j = await res.json()
                                    if (!res.ok) {
                                        toast({
                                            title: '삭제 실패',
                                            description: j.error || '삭제 실패',
                                            variant: 'destructive',
                                        })
                                        return
                                    }
                                    toast({ title: '삭제 완료' })
                                    router.replace('/admin/custom-products')
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
