'use client'

import { useEffect, useRef, useState } from 'react'
import { generateModelThumbnailFromUrl } from '@/lib/modelThumbnail'
import { Box, Loader2 } from 'lucide-react'

type ModelThumbnailProps = {
  fileUrl: string
  fileName?: string
  /** 생성된 Data URL을 전달. 장바구니에서 persist 시 사용 */
  onThumbnailReady?: (dataUrl: string) => void
  className?: string
  size?: number
}

/**
 * file_url에서 STL/OBJ/3MF/PLY를 fetch 후 썸네일을 생성해 표시.
 * 저장 목록·장바구니(fileUrl만 있는 경우)에서 사용.
 */
export default function ModelThumbnail({
  fileUrl,
  fileName,
  onThumbnailReady,
  className = '',
  size = 256,
}: ModelThumbnailProps) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const onReadyRef = useRef(onThumbnailReady)
  onReadyRef.current = onThumbnailReady

  useEffect(() => {
    if (!fileUrl) {
      setState('error')
      return
    }
    let cancelled = false
    setState('loading')
    setDataUrl(null)

    generateModelThumbnailFromUrl(fileUrl, { size, fileName })
      .then((url) => {
        if (cancelled) return
        if (url) {
          setDataUrl(url)
          setState('ok')
          onReadyRef.current?.(url)
        } else {
          setState('error')
        }
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [fileUrl, fileName, size])

  if (state === 'ok' && dataUrl) {
    return <img src={dataUrl} alt="" className={`w-full h-full object-contain ${className}`} />
  }
  if (state === 'loading') {
    return (
      <div className={`flex items-center justify-center w-full h-full ${className}`}>
        <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
      </div>
    )
  }
  return (
    <div className={`flex items-center justify-center w-full h-full ${className}`}>
      <Box className="w-10 h-10 text-white/20" />
    </div>
  )
}
