'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  page: number
  totalPages: number
  total: number
  loading?: boolean
  unitLabel?: string
  filterHint?: boolean
  onPageChange: (page: number) => void
}

export default function AdminListPagination({
  page,
  totalPages,
  total,
  loading = false,
  unitLabel = '건',
  filterHint = false,
  onPageChange,
}: Props) {
  const showPagination = totalPages > 1
  if (!showPagination && total <= 0) return null

  const renderPageButtons = () => {
    if (!showPagination) return null
    const maxPagesToShow = 5
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2))
    let endPage = startPage + maxPagesToShow - 1
    if (endPage > totalPages) {
      endPage = totalPages
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }
    const buttons: ReactNode[] = []
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          type="button"
          onClick={() => onPageChange(i)}
          className={`min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-bold transition-colors ${
            page === i
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          {i}
        </button>
      )
    }
    return buttons
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-white/10 bg-white/[0.02]">
      <p className="text-xs text-white/40 font-medium order-2 sm:order-1">
        총 <span className="text-white/70 font-bold">{total.toLocaleString()}</span>
        {unitLabel}
        {filterHint ? ' (필터 적용)' : ''}
        {' · '}
        {page}/{totalPages} 페이지
      </p>
      {showPagination && (
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/10 h-9 w-9 p-0 text-white"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1">{renderPageButtons()}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/10 h-9 w-9 p-0 text-white"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            aria-label="다음 페이지"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
