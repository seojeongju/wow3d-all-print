export const SESSION_ID_STORAGE_KEY = 'wow3d_session_id';

/** TrafficTracker·전환 이벤트가 공유하는 방문 세션 ID */
export function getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';
    let sessionId = localStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
    }
    return sessionId;
}
