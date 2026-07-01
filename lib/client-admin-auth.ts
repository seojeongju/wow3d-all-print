/** 브라우저에서 관리자 JWT — admin_print_token 또는 zustand wow3d-auth */
export function getStoredAdminToken(): string | null {
    if (typeof window === 'undefined') return null;

    const legacy = localStorage.getItem('admin_print_token');
    if (legacy) return legacy;

    try {
        const raw = localStorage.getItem('wow3d-auth');
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
        const token = parsed?.state?.token;
        return token && typeof token === 'string' ? token : null;
    } catch {
        return null;
    }
}

export function syncAdminPrintToken(token: string | null | undefined): void {
    if (typeof window === 'undefined' || !token) return;
    try {
        localStorage.setItem('admin_print_token', token);
    } catch {
        /* ignore */
    }
}
