'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Labels = {
    title: string
    body: string
    retry: string
}

type Props = {
    children: React.ReactNode
    onRetry?: () => void
    labels: Labels
}

type State = {
    hasError: boolean
    error: Error | null
    retryKey: number
}

/**
 * 견적 3D 뷰어 전용 에러 바운더리.
 * Trackball/WebGL 오류가 페이지 전체 error.tsx로 전파되지 않게 가둡니다.
 */
export class ViewerErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, retryKey: 0 }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[3D Viewer]', error, errorInfo)
    }

    private handleRetry = () => {
        this.setState((s) => ({
            hasError: false,
            error: null,
            retryKey: s.retryKey + 1,
        }))
        this.props.onRetry?.()
    }

    render() {
        if (this.state.hasError) {
            const { title, body, retry } = this.props.labels
            return (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-950/90 p-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10">
                        <AlertCircle className="h-7 w-7 text-amber-400" />
                    </div>
                    <div className="max-w-sm space-y-1.5">
                        <p className="text-sm font-black text-white">{title}</p>
                        <p className="text-xs font-medium text-white/50">{body}</p>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={this.handleRetry}
                        className="gap-2 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400"
                    >
                        <RefreshCw className="h-4 w-4" />
                        {retry}
                    </Button>
                </div>
            )
        }

        return (
            <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>
        )
    }
}
