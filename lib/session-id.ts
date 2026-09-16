/** 견적·장바구니(useAuthStore)와 동일한 방문 세션 키 */
export const SESSION_ID_STORAGE_KEY = 'wow3d-session-id';
const LEGACY_SESSION_ID_STORAGE_KEY = 'wow3d_session_id';

/** TrafficTracker·전환 이벤트·견적/카트가 공유하는 방문 세션 ID */
export function getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';

    // 견적·카트와 조인되도록 주 키를 우선 사용
    let sessionId = localStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (sessionId) return sessionId;

    // 레거시 트래픽 전용 키가 있으면 이관
    const legacy = localStorage.getItem(LEGACY_SESSION_ID_STORAGE_KEY);
    if (legacy) {
        localStorage.setItem(SESSION_ID_STORAGE_KEY, legacy);
        try {
            localStorage.removeItem(LEGACY_SESSION_ID_STORAGE_KEY);
        } catch {
            /* ignore */
        }
        return legacy;
    }

    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
    return sessionId;
}
