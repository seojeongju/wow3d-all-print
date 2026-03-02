import { toast } from "@/hooks/use-toast";

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
     */
    error: (title: string, error?: any) => {
        let description = "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
        let finalTitle = title;

        if (error) {
            if (typeof error === 'string') {
                description = error;
            } else if (typeof error === 'object') {
                // 서버 응답 형태 ({ error: '...' }) 또는 Error 객체
                description = error.error || error.message || description;
            }
        }

        // 네트워크 오류 친화적 변환
        if (description.toLowerCase().includes("failed to fetch") ||
            description.toLowerCase().includes("network error")) {
            finalTitle = "네트워크 연결 오류";
            description = "서버와의 연결이 원활하지 않습니다. 인터넷 환경을 확인해 주세요.";
        }
        // 인증 오류 친화적 변환
        else if (description.toLowerCase().includes("unauthorized") ||
            description.toLowerCase().includes("인증이 필요합니다") ||
            description.includes("401") || description.includes("403")) {
            finalTitle = "권한 또는 세션 오류";
            description = "세션이 만료되었거나 접근 권한이 없습니다. 다시 로그인해 보세요.";
        }

        toast({
            title: `❌ ${finalTitle}`,
            description: description,
            variant: "destructive",
            className: "shadow-2xl",
        });
    },

    /**
     * 정보성/경고 알림
     */
    info: (title: string, description?: string) => {
        toast({
            title: `ℹ️ ${title}`,
            description: description,
            className: "bg-white/[0.03] border-white/10 text-white font-medium shadow-2xl",
        });
    }
};
