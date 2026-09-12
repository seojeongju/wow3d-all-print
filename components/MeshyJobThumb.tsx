'use client';

import { useEffect, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import ModelThumbnail from '@/components/ModelThumbnail';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

type MeshyJobThumbProps = {
  jobId: number;
  modelReady?: boolean;
  resultFileName?: string | null;
  thumbnailUrl?: string | null;
  className?: string;
};

function resolveFetchUrl(thumbnailUrl: string): string {
  if (thumbnailUrl.startsWith('http') || thumbnailUrl.startsWith('/api/') || thumbnailUrl.startsWith('blob:')) {
    return thumbnailUrl;
  }
  if (thumbnailUrl.startsWith('/')) {
    return `/api/files${thumbnailUrl}`;
  }
  return `/api/files/${thumbnailUrl}`;
}

/**
 * AI 변환 작업 카드용 썸네일.
 * 모델이 준비되면 STL 렌더, 아니면 원본/중간 썸네일(인증 fetch)을 표시합니다.
 */
export default function MeshyJobThumb({
  jobId,
  modelReady,
  resultFileName,
  thumbnailUrl,
  className,
}: MeshyJobThumbProps) {
  const { token, user, sessionId } = useAuthStore();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modelReady || !thumbnailUrl) {
      setBlobUrl(null);
      return;
    }
    if (thumbnailUrl.startsWith('http') || thumbnailUrl.startsWith('blob:')) {
      setBlobUrl(thumbnailUrl);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);

    const headers: Record<string, string> = {};
    if (token && user?.id) {
      headers.Authorization = `Bearer ${token}`;
      headers['X-User-ID'] = String(user.id);
    } else if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    fetch(resolveFetchUrl(thumbnailUrl), { headers, cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('thumb');
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [modelReady, thumbnailUrl, token, user?.id, sessionId]);

  if (modelReady) {
    return (
      <div className={cn('bg-white overflow-hidden flex items-center justify-center', className)}>
        <ModelThumbnail
          fileUrl={`/api/meshy/jobs/${jobId}/model`}
          fileName={resultFileName || `ai-photo-${jobId}.stl`}
          size={320}
          className="w-full h-full object-contain p-2"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn('bg-white/10 flex items-center justify-center', className)}>
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  if (blobUrl) {
    return (
      <div className={cn('bg-black/40 overflow-hidden', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={blobUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={cn('bg-white/10 flex items-center justify-center', className)}>
      <Camera className="w-8 h-8 text-white/30" />
    </div>
  );
}
