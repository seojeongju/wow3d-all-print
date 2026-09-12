'use client';

import { Box } from 'lucide-react';
import ModelThumbnail from '@/components/ModelThumbnail';
import { cn } from '@/lib/utils';

type OrderItemModelThumbProps = {
  fileUrl?: string | null;
  fileName?: string | null;
  className?: string;
  /** 썸네일 렌더 해상도 (표시 크기와 별개) */
  size?: number;
  /** 클릭 시 확대 미리보기 등 */
  onClick?: () => void;
};

/**
 * 주문 품목용 3D 모델 썸네일.
 * fileUrl이 없으면 플레이스홀더 아이콘을 표시합니다.
 */
export default function OrderItemModelThumb({
  fileUrl,
  fileName,
  className,
  size = 256,
  onClick,
}: OrderItemModelThumbProps) {
  const interactive = Boolean(onClick && fileUrl);
  const content = fileUrl ? (
    <ModelThumbnail
      fileUrl={fileUrl}
      fileName={fileName || undefined}
      size={size}
      className="w-full h-full object-contain p-1.5"
    />
  ) : (
    <Box className="w-1/2 h-1/2 text-slate-300" />
  );

  const shellClass = cn(
    'bg-white overflow-hidden flex items-center justify-center shrink-0',
    interactive && 'cursor-pointer hover:ring-2 hover:ring-teal-400/60 transition-shadow',
    className
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={fileName ? `${fileName} 3D 미리보기` : '3D 모델 미리보기'}
        className={shellClass}
      >
        {content}
      </button>
    );
  }

  return <div className={shellClass}>{content}</div>;
}
