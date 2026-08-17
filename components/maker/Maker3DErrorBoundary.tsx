'use client';

import React from 'react';
import { AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: React.ReactNode;
    onRetry: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * AI 3D Maker 결과물(3D) 탭 전용 에러 바운더리.
 * WebGL/Three.js 오류 시 사용자에게 안내 메시지와 "스케치로 돌아가기" 버튼 표시.
 */
export class Maker3DErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[AI 3D Maker] 3D 미리보기 오류:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-b from-[#0a0a0f] to-[#12121a] z-10">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                    </div>
                    <div className="text-center space-y-2 max-w-sm">
                        <p className="text-sm font-semibold text-white">
                            3D 미리보기를 불러올 수 없습니다
                        </p>
                        <p className="text-xs text-white/80">
                            브라우저가 3D 렌더링을 지원하지 않거나 일시적인 오류가 발생했을 수 있습니다. 스케치(2D) 탭으로 돌아가 다시 그려 주세요.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            this.props.onRetry();
                        }}
                        className="gap-2 border-white/20 text-white hover:bg-white/10"
                    >
                        <Pencil className="w-4 h-4" />
                        스케치(2D)로 돌아가기
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}
