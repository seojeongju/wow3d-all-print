import { useAuthStore } from '@/store/useAuthStore'

/** persist 복원 이후 최신 토큰으로 Bearer 헤더 (관리자 API용) */
export function getAdminAuthHeaders(): HeadersInit {
    const token = useAuthStore.getState().token?.trim()
    return token ? { Authorization: `Bearer ${token}` } : {}
}
