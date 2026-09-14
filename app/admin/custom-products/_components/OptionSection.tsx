'use client'

import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldLabel, SegmentedControl, Tip } from './FormUi'
import {
    buildCombinations,
    draftsToOptions,
    parseValuesText,
    resizeOptionDrafts,
    type CustomProductFormState,
    type OptionComposeType,
    type OptionDraftRow,
    type OptionInputMethod,
    type OptionSortOrder,
} from './form-types'
import type { CustomProductOption } from '@/lib/custom-products'

const selectClass =
    'h-10 min-w-[100px] rounded-md border border-[#d1d5db] bg-white px-3 text-[13px] font-bold text-[#1e2124] outline-none focus:border-[#03c75a]'
const inputClass =
    'h-10 w-full rounded-md border border-[#d1d5db] bg-white px-3 text-[13px] text-[#1e2124] outline-none focus:border-[#03c75a] focus:ring-1 focus:ring-[#03c75a]/30'

function RadioItem({
    checked,
    label,
    onChange,
    disabled,
}: {
    checked: boolean
    label: string
    onChange: () => void
    disabled?: boolean
}) {
    return (
        <label
            className={cn(
                'inline-flex items-center gap-2 text-[13px] font-bold cursor-pointer',
                disabled ? 'text-[#b0b3b8] cursor-not-allowed' : 'text-[#1e2124]'
            )}
        >
            <input
                type="radio"
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                className="accent-[#03c75a] w-4 h-4"
            />
            {label}
        </label>
    )
}

type Props = {
    form: CustomProductFormState
    onChange: (patch: Partial<CustomProductFormState>) => void
}

export default function OptionSection({ form, onChange }: Props) {
    const enabled = form.optionsEnabled
    const listCount =
        form.optionComposeType === 'combination'
            ? buildCombinations(form.options).length
            : form.options.reduce((n, o) => n + o.choices.length, 0)

    const setDrafts = (drafts: OptionDraftRow[]) => onChange({ optionDrafts: drafts })

    const updateDraft = (idx: number, patch: Partial<OptionDraftRow>) => {
        setDrafts(
            form.optionDrafts.map((row, i) => (i === idx ? { ...row, ...patch } : row))
        )
    }

    const applyToList = () => {
        const opts = draftsToOptions(form.optionDrafts, form.optionSortOrder)
        if (opts.length === 0) {
            alert('옵션명과 옵션값을 입력한 뒤 적용해 주세요.')
            return
        }
        for (const o of opts) {
            if (o.choices.length === 0) {
                alert(`「${o.label}」의 옵션값을 입력해 주세요.`)
                return
            }
        }
        onChange({ options: opts, optionsEnabled: true })
    }

    const addValueChip = (idx: number) => {
        const row = form.optionDrafts[idx]
        if (!row) return
        const current = parseValuesText(row.valuesText)
        const nextVal = window.prompt('추가할 옵션값을 입력하세요', '')
        if (!nextVal?.trim()) return
        const merged = [...current, nextVal.trim()]
        updateDraft(idx, { valuesText: merged.join(',') })
    }

    const removeOptionGroup = (optId: string) => {
        onChange({ options: form.options.filter((o) => o.id !== optId) })
    }

    const removeChoice = (optId: string, choice: string) => {
        const next = form.options
            .map((o) =>
                o.id === optId
                    ? { ...o, choices: o.choices.filter((c) => c !== choice) }
                    : o
            )
            .filter((o) => o.choices.length > 0)
        onChange({ options: next })
    }

    const combinationRows = buildCombinations(form.options)

    return (
        <div className="space-y-6">
            {/* 선택형 */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                <FieldLabel>선택형</FieldLabel>
                <div className="flex-1">
                    <SegmentedControl
                        value={enabled ? 'on' : 'off'}
                        onChange={(v) => onChange({ optionsEnabled: v === 'on' })}
                        options={[
                            { value: 'on', label: '설정함' },
                            { value: 'off', label: '설정안함' },
                        ]}
                    />
                </div>
            </div>

            {!enabled ? (
                <Tip tone="gray">옵션을 사용하지 않으면 상세 페이지에 옵션 선택이 표시되지 않습니다.</Tip>
            ) : (
                <>
                    {/* 입력방식 */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <FieldLabel>옵션 입력방식</FieldLabel>
                        <div className="flex-1 flex flex-wrap gap-x-5 gap-y-2">
                            {(
                                [
                                    ['direct', '직접 입력하기'],
                                    ['excel', '엑셀 일괄등록'],
                                    ['import', '다른상품 옵션 불러오기'],
                                ] as [OptionInputMethod, string][]
                            ).map(([value, label]) => (
                                <RadioItem
                                    key={value}
                                    checked={form.optionInputMethod === value}
                                    label={label}
                                    disabled={value !== 'direct'}
                                    onChange={() => onChange({ optionInputMethod: value })}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 구성타입 */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <FieldLabel>옵션 구성타입</FieldLabel>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-x-5 gap-y-2">
                                {(
                                    [
                                        ['standalone', '단독형'],
                                        ['combination', '조합형'],
                                    ] as [OptionComposeType, string][]
                                ).map(([value, label]) => (
                                    <RadioItem
                                        key={value}
                                        checked={form.optionComposeType === value}
                                        label={label}
                                        onChange={() => onChange({ optionComposeType: value })}
                                    />
                                ))}
                            </div>
                            {form.optionComposeType === 'combination' ? (
                                <Tip>
                                    옵션별 조합 목록이 필요하면 조합형을 선택해 주세요. (상세에서는
                                    옵션명별 선택 UI로 표시됩니다)
                                </Tip>
                            ) : (
                                <Tip tone="gray">
                                    단독형은 옵션명마다 독립적으로 선택합니다.
                                </Tip>
                            )}
                        </div>
                    </div>

                    {/* 개수 / 정렬 */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <FieldLabel required>옵션명 개수</FieldLabel>
                        <div className="flex-1 flex flex-wrap items-center gap-4">
                            <select
                                className={selectClass}
                                value={form.optionNameCount}
                                onChange={(e) => {
                                    const count = Number(e.target.value) || 1
                                    onChange({
                                        optionNameCount: count,
                                        optionDrafts: resizeOptionDrafts(
                                            form.optionDrafts,
                                            count
                                        ),
                                    })
                                }}
                            >
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <option key={n} value={n}>
                                        {n}개
                                    </option>
                                ))}
                            </select>

                            <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-[#1e2124] flex items-center gap-1.5">
                                    정렬 순서
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff5252]" />
                                </span>
                                <select
                                    className={selectClass}
                                    value={form.optionSortOrder}
                                    onChange={(e) =>
                                        onChange({
                                            optionSortOrder: e.target.value as OptionSortOrder,
                                        })
                                    }
                                >
                                    <option value="registered">등록순</option>
                                    <option value="name">옵션명순</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 옵션입력 */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <FieldLabel required>옵션입력</FieldLabel>
                        <div className="flex-1 space-y-3">
                            <div className="hidden sm:grid grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)_40px] gap-2 text-[12px] font-bold text-[#868b94] px-0.5">
                                <span>옵션명</span>
                                <span>옵션값</span>
                                <span />
                            </div>

                            {form.optionDrafts.map((row, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)_40px] gap-2"
                                >
                                    <input
                                        className={inputClass}
                                        placeholder="예시 : 컬러"
                                        value={row.name}
                                        onChange={(e) =>
                                            updateDraft(idx, { name: e.target.value })
                                        }
                                    />
                                    <input
                                        className={inputClass}
                                        placeholder="예시 : 빨강,노랑 (, 로 구분)"
                                        value={row.valuesText}
                                        onChange={(e) =>
                                            updateDraft(idx, { valuesText: e.target.value })
                                        }
                                    />
                                    <button
                                        type="button"
                                        title="옵션값 추가"
                                        onClick={() => addValueChip(idx)}
                                        className="h-10 w-10 rounded-md bg-[#4a4a4a] text-white flex items-center justify-center hover:bg-[#333] justify-self-start sm:justify-self-auto"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={applyToList}
                                className="w-full h-11 rounded-md bg-[#eceff1] text-[14px] font-bold text-[#333] hover:bg-[#e0e3e6] transition-colors"
                            >
                                옵션목록으로 적용 ↓
                            </button>
                        </div>
                    </div>

                    {/* 옵션목록 */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 border-t border-[#eef0f2] pt-6">
                        <FieldLabel required>옵션목록</FieldLabel>
                        <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-[13px]">
                                <span className="font-bold text-[#1e2124]">
                                    (총 {form.optionComposeType === 'combination' ? combinationRows.length : listCount}개)
                                </span>
                                <span className="text-[#868b94]">
                                    적용 후 목록을 확인하고 저장하세요.
                                </span>
                            </div>

                            {form.options.length === 0 ? (
                                <div className="rounded-md border border-dashed border-[#d1d5db] bg-[#fafbfc] px-4 py-10 text-center text-[13px] text-[#868b94]">
                                    옵션을 입력한 뒤 「옵션목록으로 적용」을 눌러 주세요.
                                </div>
                            ) : form.optionComposeType === 'standalone' ? (
                                <StandaloneList
                                    options={form.options}
                                    onRemoveGroup={removeOptionGroup}
                                    onRemoveChoice={removeChoice}
                                />
                            ) : (
                                <CombinationList
                                    options={form.options}
                                    rows={combinationRows}
                                    onClear={() => onChange({ options: [] })}
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function StandaloneList({
    options,
    onRemoveGroup,
    onRemoveChoice,
}: {
    options: CustomProductOption[]
    onRemoveGroup: (id: string) => void
    onRemoveChoice: (id: string, choice: string) => void
}) {
    return (
        <div className="space-y-3">
            {options.map((opt) => (
                <div
                    key={opt.id}
                    className="rounded-md border border-[#e5e8eb] overflow-hidden"
                >
                    <div className="flex items-center justify-between gap-2 bg-[#f7f8fa] px-3 py-2 border-b border-[#e5e8eb]">
                        <span className="text-[13px] font-bold text-[#1e2124]">{opt.label}</span>
                        <button
                            type="button"
                            onClick={() => onRemoveGroup(opt.id)}
                            className="text-[#868b94] hover:text-[#ff5252]"
                            title="옵션명 삭제"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="p-3 flex flex-wrap gap-1.5">
                        {opt.choices.map((c) => (
                            <span
                                key={c}
                                className="inline-flex items-center gap-1 h-8 px-2.5 rounded border border-[#e5e8eb] bg-white text-[12px] font-bold text-[#333]"
                            >
                                {c}
                                <button
                                    type="button"
                                    className="text-[#b0b3b8] hover:text-[#ff5252]"
                                    onClick={() => onRemoveChoice(opt.id, c)}
                                    aria-label={`${c} 삭제`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function CombinationList({
    options,
    rows,
    onClear,
}: {
    options: CustomProductOption[]
    rows: string[]
    onClear: () => void
}) {
    return (
        <div className="rounded-md border border-[#e5e8eb] overflow-hidden">
            <div className="flex items-center justify-between gap-2 bg-[#f7f8fa] px-3 py-2 border-b border-[#e5e8eb]">
                <span className="text-[12px] font-bold text-[#555]">
                    {options.map((o) => o.label).join(' · ')} 조합
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    className="text-[12px] font-bold text-[#868b94] hover:text-[#ff5252]"
                >
                    목록 비우기
                </button>
            </div>
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                <table className="w-full text-[13px]">
                    <thead className="sticky top-0 bg-white border-b border-[#eef0f2]">
                        <tr className="text-left text-[#868b94]">
                            <th className="px-3 py-2 font-bold w-14">No</th>
                            {options.map((o) => (
                                <th key={o.id} className="px-3 py-2 font-bold">
                                    {o.label}
                                </th>
                            ))}
                            <th className="px-3 py-2 font-bold">조합</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((combo, idx) => {
                            const parts = combo.split(' / ')
                            return (
                                <tr key={combo} className="border-t border-[#f0f1f3]">
                                    <td className="px-3 py-2 text-[#868b94]">{idx + 1}</td>
                                    {options.map((o, oi) => (
                                        <td key={o.id} className="px-3 py-2 font-bold text-[#333]">
                                            {parts[oi] || '-'}
                                        </td>
                                    ))}
                                    <td className="px-3 py-2 text-[#555]">{combo}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
