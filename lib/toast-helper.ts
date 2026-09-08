import { toast } from "@/hooks/use-toast";

type UiLocale = 'en' | 'ko'

function resolveLocale(locale?: string): UiLocale {
    if (locale?.startsWith('en')) return 'en'
    if (typeof document !== 'undefined') {
        if (document.documentElement.lang?.startsWith('en')) return 'en'
        if (window.location.pathname.startsWith('/en')) return 'en'
    }
    return 'ko'
}

const COPY: Record<UiLocale, {
    unknownError: string
    networkTitle: string
    networkDesc: string
    authTitle: string
    authDesc: string
}> = {
    ko: {
        unknownError: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        networkTitle: '네트워크 연결 오류',
        networkDesc: '서버와의 연결이 원활하지 않습니다. 인터넷 환경을 확인해 주세요.',
        authTitle: '권한 또는 세션 오류',
        authDesc: '세션이 만료되었거나 접근 권한이 없습니다. 다시 로그인해 보세요.',
    },
    en: {
        unknownError: 'Something went wrong. Please try again shortly.',
        networkTitle: 'Network error',
        networkDesc: 'Could not reach the server. Check your connection.',
        authTitle: 'Permission or session error',
        authDesc: 'Your session expired or you lack access. Please sign in again.',
    },
}

/**
 * Wow3D Pro 전용 토스트 유틸리티
 *
 * 모든 API 호출에 대해 일관되고 친절한 피드백을 제공합니다.
 */
export const showToast = {
    /**
     * 성공 알림
     */
    success: (title: string, description?: string) => {
        toast({
            title: `✅ ${title}`,
            description: description,
            className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-200 font-bold shadow-2xl",
        });
    },

    /**
     * 에러 알림
     * @param title 기본 오류 제목 (예: "목록 조회 실패")
     * @param error 실제 에러 객체 또는 메시지
     * @param locale 선택 — 미지정 시 document/path로 판별
     */
    error: (title: string, error?: any, locale?: string) => {
        const ui = resolveLocale(locale)
        const c = COPY[ui]
        let description: string = c.unknownError
        let finalTitle: string = title

        if (error) {
            if (typeof error === 'string') {
                description = error
            } else if (typeof error === 'object') {
                description = String(error.error || error.message || description)
            }
        }

        if (description.toLowerCase().includes('failed to fetch') ||
            description.toLowerCase().includes('network error')) {
            finalTitle = c.networkTitle
            description = c.networkDesc
        } else if (
            description.toLowerCase().includes('unauthorized') ||
            description.includes('인증이 필요합니다') ||
            description.includes('유효하지 않은 토큰') ||
            description.includes('세션이 만료') ||
            description.toLowerCase().includes('session has expired') ||
            description.toLowerCase().includes('authentication required')
        ) {
            finalTitle = c.authTitle
            description = c.authDesc
        }

        toast({
            title: `❌ ${finalTitle}`,
            description,
            variant: 'destructive',
            className: 'shadow-2xl',
        })
    },

    /**
     * 정보성/경고 알림
     */
    info: (title: string, description?: string, _locale?: string) => {
        toast({
            title: `ℹ️ ${title}`,
            description: description,
            className: "bg-white/[0.03] border-white/10 text-white font-medium shadow-2xl",
        });
    }
};
